// ============================================================
// PATCH cho /opt/crm/agent-tools-hermes.js
// Module: customers (6 case core — wire vào dispatcher)
// Style match với existing handlers:
//  - args = input params, workspaceId scope, hermesUserId from header
//  - db_1.prisma.$queryRawUnsafe(sql, ...params) (parameterized only)
//  - res.json({ ok:true, data:{...} }); return;
// ============================================================
// Round 1: 6 core skill (search, update, delete, summary, list_groups, care_list)
// Round 2 (sau): get_loyalty_points, manage_vouchers, merge_customers, tier_distribution, overview, export, import
// ============================================================

case 'search_customers': {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 50) : 20;
    const params = [workspaceId];
    let sql = `SELECT id, full_name, phone, email, gender, birthday, tier, tags, lead_status, created_at FROM people WHERE workspace_id = $1 AND deleted_at IS NULL`;
    if (query) {
        params.push(`%${query}%`);
        sql += ` AND (full_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length, query, limit } });
    return;
}

case 'update_customer': {
    const customerId = typeof args.id === 'string' ? args.id : '';
    if (!customerId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_ID' } });
        return;
    }
    const sets = [];
    const params = [];
    if (typeof args.full_name === 'string') { params.push(args.full_name); sets.push(`full_name = $${params.length}`); }
    if (typeof args.phone === 'string') { params.push(args.phone); sets.push(`phone = $${params.length}`); }
    if (typeof args.email === 'string') { params.push(args.email); sets.push(`email = $${params.length}`); }
    if (typeof args.address === 'string') { params.push(args.address); sets.push(`address = $${params.length}`); }
    if (typeof args.note === 'string') { params.push(args.note); sets.push(`note = $${params.length}`); }
    if (sets.length === 0) {
        res.status(400).json({ ok: false, error: { code: 'NO_FIELDS' } });
        return;
    }
    params.push(customerId);
    params.push(workspaceId);
    const result = await db_1.prisma.$queryRawUnsafe(
        `UPDATE people SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length - 1} AND workspace_id = $${params.length} RETURNING id, full_name, phone, email`,
        ...params
    );
    if (!result.length) {
        res.status(404).json({ ok: false, error: { code: 'CUSTOMER_NOT_FOUND' } });
        return;
    }
    res.json({ ok: true, data: result[0] });
    return;
}

case 'delete_customer': {
    const customerId = typeof args.id === 'string' ? args.id : '';
    const reason = typeof args.reason === 'string' ? args.reason : 'no_reason';
    if (!customerId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_ID' } });
        return;
    }
    const result = await db_1.prisma.$executeRawUnsafe(
        `UPDATE people SET deleted_at = now() WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
        customerId, workspaceId
    );
    console.log(`[customers] soft-delete id=${customerId} ws=${workspaceId} user=${hermesUserId} reason=${reason}`);
    res.json({ ok: true, data: { deleted: result > 0, id: customerId, reason } });
    return;
}

case 'customers_summary': {
    const totals = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE tier::text = 'VIP')::int AS vip_count,
                COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS new_30d
         FROM people WHERE workspace_id = $1 AND deleted_at IS NULL`,
        workspaceId
    );
    res.json({ ok: true, data: totals[0] });
    return;
}

case 'list_customer_groups': {
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 50) : 20;
    const items = await db_1.prisma.$queryRawUnsafe(
        `SELECT g.id, g.name, g.description, g.color, g.created_at,
                (SELECT COUNT(*)::int FROM customer_group_members WHERE group_id = g.id) AS member_count
         FROM customer_groups g WHERE g.workspace_id = $1 ORDER BY g.created_at DESC LIMIT $2`,
        workspaceId, limit
    );
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'customer_care_list': {
    const careType = typeof args.care_type === 'string' ? args.care_type : 'all';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 20;
    let items = [];
    if (careType === 'no_visit') {
        items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, full_name, phone, last_visit_at FROM people
             WHERE workspace_id = $1 AND deleted_at IS NULL
               AND (last_visit_at IS NULL OR last_visit_at < now() - interval '30 days')
             ORDER BY last_visit_at ASC NULLS FIRST LIMIT $2`,
            workspaceId, limit
        );
    } else if (careType === 'birthday') {
        items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, full_name, phone, birthday FROM people
             WHERE workspace_id = $1 AND deleted_at IS NULL AND birthday IS NOT NULL
               AND EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM now())
               AND EXTRACT(DAY FROM birthday) BETWEEN EXTRACT(DAY FROM now()) AND EXTRACT(DAY FROM now()) + 7
             ORDER BY EXTRACT(DAY FROM birthday) ASC LIMIT $2`,
            workspaceId, limit
        );
    } else {
        items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, full_name, phone, last_visit_at, birthday FROM people
             WHERE workspace_id = $1 AND deleted_at IS NULL
             ORDER BY COALESCE(last_visit_at, created_at) ASC LIMIT $2`,
            workspaceId, limit
        );
    }
    res.json({ ok: true, data: { care_type: careType, items, total: items.length } });
    return;
}
