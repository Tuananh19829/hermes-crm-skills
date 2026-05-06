// ============================================================
// PATCH cho /opt/crm/agent-tools-hermes.js
// ============================================================
// Module: customer_groups (7 case)
// Style match với existing handlers (find_customer, view_customer):
//  - args = input params
//  - workspaceId = scope variable
//  - hermesUserId = req.headers['x-user-id']
//  - db_1.prisma.$queryRawUnsafe(sql, ...params)
//  - res.json({ ok:true, data:{...} }); return;
//  - res.status(400/404).json({ ok:false, error:{ code, message } }); return;
// ============================================================
//
// CÁCH ÁP DỤNG: Script APPLY_PATCH.sh tự lấy 7 case block dưới đây
// và insert TRƯỚC dòng "default:" trong switch (action) {...}
// ============================================================

case 'get_customer_group_detail': {
    const groupId = typeof args.group_id === 'string' ? args.group_id : '';
    if (!groupId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAM', message: 'group_id required' } });
        return;
    }
    const grp = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, name, description, criteria, color, created_at
         FROM customer_groups WHERE id = $1::uuid AND workspace_id = $2 LIMIT 1`,
        groupId, workspaceId
    );
    if (!grp.length) {
        res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND', message: 'Nhóm KH không tồn tại' } });
        return;
    }
    const members = await db_1.prisma.$queryRawUnsafe(
        `SELECT m.customer_id, m.role, m.added_at, p.full_name, p.phone
         FROM customer_group_members m
         LEFT JOIN people p ON p.id = m.customer_id
         WHERE m.group_id = $1::uuid
         ORDER BY m.added_at DESC LIMIT 50`,
        groupId
    );
    const stats = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE role='VIP')::int AS vip_count
         FROM customer_group_members WHERE group_id = $1::uuid`,
        groupId
    );
    res.json({ ok: true, data: { ...grp[0], members, stats: stats[0] } });
    return;
}

case 'create_customer_group': {
    const name = typeof args.name === 'string' ? args.name.trim() : '';
    const description = typeof args.description === 'string' ? args.description : null;
    const criteria = (args.criteria && typeof args.criteria === 'object') ? args.criteria : {};
    const autoAssign = args.auto_assign === true;
    const color = typeof args.color === 'string' ? args.color : '#6b7280';
    if (!name) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_NAME', message: 'name required' } });
        return;
    }
    const result = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO customer_groups (workspace_id, name, description, criteria, auto_assign, color, created_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, now())
         RETURNING id, name, description, criteria, color, created_at`,
        workspaceId, name, description, JSON.stringify(criteria), autoAssign, color
    );
    let auto_assigned = 0;
    if (autoAssign) {
        const conds = [];
        const params = [workspaceId];
        if (typeof criteria.min_spent_amount === 'number') {
            params.push(criteria.min_spent_amount);
            conds.push(`(SELECT COALESCE(SUM(total),0) FROM invoices i WHERE i.person_id = p.id AND i.status IN ('PAID','PARTIAL')) >= $${params.length}`);
        }
        if (typeof criteria.min_visits === 'number') {
            params.push(criteria.min_visits);
            conds.push(`(SELECT COUNT(*) FROM appointments a WHERE a.person_id = p.id AND a.status='COMPLETED') >= $${params.length}`);
        }
        if (conds.length > 0) {
            params.push(result[0].id);
            const sql = `INSERT INTO customer_group_members (group_id, customer_id, role, added_at)
                SELECT $${params.length}::uuid, p.id, 'MEMBER', now() FROM people p
                WHERE p.workspace_id = $1 AND ${conds.join(' AND ')}
                ON CONFLICT DO NOTHING`;
            auto_assigned = await db_1.prisma.$executeRawUnsafe(sql, ...params);
        }
    }
    res.json({ ok: true, data: { ...result[0], auto_assigned } });
    return;
}

case 'update_customer_group': {
    const groupId = typeof args.group_id === 'string' ? args.group_id : '';
    if (!groupId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_GROUP_ID', message: 'group_id required' } });
        return;
    }
    const sets = [];
    const params = [];
    if (typeof args.name === 'string') { params.push(args.name); sets.push(`name = $${params.length}`); }
    if (typeof args.description === 'string') { params.push(args.description); sets.push(`description = $${params.length}`); }
    if (args.criteria && typeof args.criteria === 'object') { params.push(JSON.stringify(args.criteria)); sets.push(`criteria = $${params.length}::jsonb`); }
    if (typeof args.color === 'string') { params.push(args.color); sets.push(`color = $${params.length}`); }
    if (sets.length === 0) {
        res.status(400).json({ ok: false, error: { code: 'NO_FIELDS', message: 'Không có field nào để update' } });
        return;
    }
    params.push(groupId);
    params.push(workspaceId);
    const result = await db_1.prisma.$queryRawUnsafe(
        `UPDATE customer_groups SET ${sets.join(', ')}
         WHERE id = $${params.length - 1}::uuid AND workspace_id = $${params.length}
         RETURNING id, name, description, criteria, color`,
        ...params
    );
    if (!result.length) {
        res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND', message: 'Nhóm KH không tồn tại' } });
        return;
    }
    res.json({ ok: true, data: result[0] });
    return;
}

case 'delete_customer_group': {
    const groupId = typeof args.group_id === 'string' ? args.group_id : '';
    const reason = typeof args.reason === 'string' ? args.reason : 'no_reason';
    if (!groupId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_GROUP_ID', message: 'group_id required' } });
        return;
    }
    await db_1.prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`DELETE FROM customer_group_members WHERE group_id = $1::uuid`, groupId);
        await tx.$executeRawUnsafe(
            `DELETE FROM customer_groups WHERE id = $1::uuid AND workspace_id = $2`,
            groupId, workspaceId
        );
    });
    console.log(`[customer_groups] deleted group=${groupId} ws=${workspaceId} user=${hermesUserId} reason=${reason}`);
    res.json({ ok: true, data: { deleted: true, group_id: groupId, reason } });
    return;
}

case 'add_member_to_group': {
    const groupId = typeof args.group_id === 'string' ? args.group_id : '';
    const customerId = typeof args.customer_id === 'string' ? args.customer_id : '';
    const role = (typeof args.role === 'string' && ['MEMBER', 'VIP', 'PARTNER'].includes(args.role)) ? args.role : 'MEMBER';
    if (!groupId || !customerId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS', message: 'group_id và customer_id required' } });
        return;
    }
    const grp = await db_1.prisma.$queryRawUnsafe(
        `SELECT id FROM customer_groups WHERE id = $1::uuid AND workspace_id = $2 LIMIT 1`,
        groupId, workspaceId
    );
    if (!grp.length) {
        res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND', message: 'Nhóm KH không tồn tại' } });
        return;
    }
    const cust = await db_1.prisma.$queryRawUnsafe(
        `SELECT id FROM people WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        customerId, workspaceId
    );
    if (!cust.length) {
        res.status(404).json({ ok: false, error: { code: 'CUSTOMER_NOT_FOUND', message: 'Khách hàng không tồn tại' } });
        return;
    }
    await db_1.prisma.$executeRawUnsafe(
        `INSERT INTO customer_group_members (group_id, customer_id, role, added_at)
         VALUES ($1::uuid, $2, $3, now())
         ON CONFLICT (group_id, customer_id) DO UPDATE SET role = $3`,
        groupId, customerId, role
    );
    res.json({ ok: true, data: { group_id: groupId, customer_id: customerId, role, added: true } });
    return;
}

case 'remove_member_from_group': {
    const groupId = typeof args.group_id === 'string' ? args.group_id : '';
    const customerId = typeof args.customer_id === 'string' ? args.customer_id : '';
    if (!groupId || !customerId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS', message: 'group_id và customer_id required' } });
        return;
    }
    const grp = await db_1.prisma.$queryRawUnsafe(
        `SELECT id FROM customer_groups WHERE id = $1::uuid AND workspace_id = $2 LIMIT 1`,
        groupId, workspaceId
    );
    if (!grp.length) {
        res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND', message: 'Nhóm KH không tồn tại' } });
        return;
    }
    const result = await db_1.prisma.$executeRawUnsafe(
        `DELETE FROM customer_group_members WHERE group_id = $1::uuid AND customer_id = $2`,
        groupId, customerId
    );
    res.json({ ok: true, data: { removed: result > 0, group_id: groupId, customer_id: customerId } });
    return;
}

case 'list_group_members': {
    const groupId = typeof args.group_id === 'string' ? args.group_id : '';
    const role = (typeof args.role === 'string' && ['MEMBER', 'VIP', 'PARTNER', 'ALL'].includes(args.role)) ? args.role : 'ALL';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 200) : 50;
    const offset = typeof args.offset === 'number' ? args.offset : 0;
    if (!groupId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_GROUP_ID', message: 'group_id required' } });
        return;
    }
    const grp = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, name FROM customer_groups WHERE id = $1::uuid AND workspace_id = $2 LIMIT 1`,
        groupId, workspaceId
    );
    if (!grp.length) {
        res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND', message: 'Nhóm KH không tồn tại' } });
        return;
    }
    const params = [groupId];
    let whereRole = '';
    if (role !== 'ALL') {
        params.push(role);
        whereRole = `AND m.role = $${params.length}`;
    }
    params.push(limit);
    params.push(offset);
    const members = await db_1.prisma.$queryRawUnsafe(
        `SELECT m.customer_id, m.role, m.added_at, p.full_name, p.phone, p.email, p.tier
         FROM customer_group_members m
         LEFT JOIN people p ON p.id = m.customer_id
         WHERE m.group_id = $1::uuid ${whereRole}
         ORDER BY m.added_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        ...params
    );
    const totalParams = [groupId];
    let totalWhere = '';
    if (role !== 'ALL') {
        totalParams.push(role);
        totalWhere = `AND role = $${totalParams.length}`;
    }
    const total = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total FROM customer_group_members WHERE group_id = $1::uuid ${totalWhere}`,
        ...totalParams
    );
    res.json({ ok: true, data: { group: grp[0], members, total: total[0].total, limit, offset } });
    return;
}
