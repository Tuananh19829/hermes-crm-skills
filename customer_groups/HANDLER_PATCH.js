// Module: customer_groups (7 cases - FIX schema-aligned)
// Real schema: customer_groups(id text, name, description, color, is_active, branch_id) — no criteria, no member table.
// Membership stored via people.customer_group (text, matches customer_groups.name).

case 'get_customer_group_detail': {
    const groupId = typeof args.group_id === 'string' ? args.group_id : '';
    if (!groupId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAM', message: 'group_id required' } });
        return;
    }
    const grp = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, name, description, color, is_active, branch_id, created_at
         FROM customer_groups WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        groupId, workspaceId
    );
    if (!grp.length) {
        res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND', message: 'Nhóm KH không tồn tại' } });
        return;
    }
    const members = await db_1.prisma.$queryRawUnsafe(
        `SELECT id AS customer_id, full_name, phone, email FROM people
         WHERE workspace_id = $1 AND customer_group = $2 ORDER BY full_name LIMIT 50`,
        workspaceId, grp[0].name
    );
    const stats = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total FROM people WHERE workspace_id = $1 AND customer_group = $2`,
        workspaceId, grp[0].name
    );
    res.json({ ok: true, data: { ...grp[0], members, stats: stats[0] } });
    return;
}

case 'create_customer_group': {
    const name = typeof args.name === 'string' ? args.name.trim() : '';
    const description = typeof args.description === 'string' ? args.description : null;
    const color = typeof args.color === 'string' ? args.color : '#3B82F6';
    if (!name) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_NAME', message: 'name required' } });
        return;
    }
    const result = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO customer_groups (id, workspace_id, name, description, color, is_active, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, now(), now())
         RETURNING id, name, description, color, created_at`,
        workspaceId, name, description, color
    );
    res.json({ ok: true, data: result[0] });
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
    if (typeof args.color === 'string') { params.push(args.color); sets.push(`color = $${params.length}`); }
    if (typeof args.is_active === 'boolean') { params.push(args.is_active); sets.push(`is_active = $${params.length}`); }
    if (sets.length === 0) {
        res.status(400).json({ ok: false, error: { code: 'NO_FIELDS', message: 'Không có field nào để update' } });
        return;
    }
    params.push(groupId);
    params.push(workspaceId);
    const result = await db_1.prisma.$queryRawUnsafe(
        `UPDATE customer_groups SET ${sets.join(', ')}, updated_at = now()
         WHERE id = $${params.length - 1} AND workspace_id = $${params.length}
         RETURNING id, name, description, color, is_active`,
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
    const grp = await db_1.prisma.$queryRawUnsafe(
        `SELECT name FROM customer_groups WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        groupId, workspaceId
    );
    if (!grp.length) {
        res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND' } });
        return;
    }
    await db_1.prisma.$executeRawUnsafe(
        `UPDATE people SET customer_group = NULL WHERE workspace_id = $1 AND customer_group = $2`,
        workspaceId, grp[0].name
    );
    const result = await db_1.prisma.$executeRawUnsafe(
        `DELETE FROM customer_groups WHERE id = $1 AND workspace_id = $2`,
        groupId, workspaceId
    );
    console.log(`[customer_groups] deleted group=${groupId} ws=${workspaceId} user=${hermesUserId} reason=${reason}`);
    res.json({ ok: true, data: { deleted: result > 0, group_id: groupId, reason } });
    return;
}

case 'add_member_to_group': {
    const groupId = typeof args.group_id === 'string' ? args.group_id : '';
    const customerId = typeof args.customer_id === 'string' ? args.customer_id : '';
    if (!groupId || !customerId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS', message: 'group_id và customer_id required' } });
        return;
    }
    const grp = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, name FROM customer_groups WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
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
        `UPDATE people SET customer_group = $1, updated_at = now() WHERE id = $2 AND workspace_id = $3`,
        grp[0].name, customerId, workspaceId
    );
    res.json({ ok: true, data: { group_id: groupId, customer_id: customerId, group_name: grp[0].name, added: true } });
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
        `SELECT name FROM customer_groups WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        groupId, workspaceId
    );
    if (!grp.length) {
        res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND' } });
        return;
    }
    const result = await db_1.prisma.$executeRawUnsafe(
        `UPDATE people SET customer_group = NULL, updated_at = now()
         WHERE id = $1 AND workspace_id = $2 AND customer_group = $3`,
        customerId, workspaceId, grp[0].name
    );
    res.json({ ok: true, data: { removed: result > 0, group_id: groupId, customer_id: customerId } });
    return;
}

case 'list_group_members': {
    const groupId = typeof args.group_id === 'string' ? args.group_id : '';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 200) : 50;
    const offset = typeof args.offset === 'number' ? args.offset : 0;
    if (!groupId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_GROUP_ID', message: 'group_id required' } });
        return;
    }
    const grp = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, name FROM customer_groups WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        groupId, workspaceId
    );
    if (!grp.length) {
        res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND', message: 'Nhóm KH không tồn tại' } });
        return;
    }
    const members = await db_1.prisma.$queryRawUnsafe(
        `SELECT id AS customer_id, full_name, phone, email, created_at AS added_at
         FROM people
         WHERE workspace_id = $1 AND customer_group = $2
         ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
        workspaceId, grp[0].name, limit, offset
    );
    const total = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total FROM people WHERE workspace_id = $1 AND customer_group = $2`,
        workspaceId, grp[0].name
    );
    res.json({ ok: true, data: { group: grp[0], members, total: total[0].total } });
    return;
}

