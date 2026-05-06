// Module: orders (5 cases)

case 'list_orders': {
    const status = typeof args.status === 'string' ? args.status : 'ALL';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 30;
    const params = [workspaceId];
    let sql = `SELECT id, code, person_id, channel, status, total, paid_amount, debt_amount, created_at FROM orders WHERE workspace_id = $1`;
    if (status !== 'ALL') {
        params.push(status);
        sql += ` AND status = $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'orders_summary': {
    const r = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'DELIVERED')::int AS delivered,
                COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled,
                COALESCE(SUM(total), 0)::bigint AS total_revenue,
                COALESCE(SUM(debt_amount), 0)::bigint AS total_debt
         FROM orders WHERE workspace_id = $1`,
        workspaceId
    );
    res.json({ ok: true, data: r[0] });
    return;
}

case 'get_order_detail': {
    const orderId = typeof args.order_id === 'string' ? args.order_id : '';
    if (!orderId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_ORDER_ID' } });
        return;
    }
    const order = await db_1.prisma.$queryRawUnsafe(
        `SELECT * FROM orders WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        orderId, workspaceId
    );
    if (!order.length) {
        res.status(404).json({ ok: false, error: { code: 'ORDER_NOT_FOUND' } });
        return;
    }
    const items = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, product_id, qty, unit_price, discount, amount FROM order_items WHERE order_id = $1`,
        orderId
    );
    res.json({ ok: true, data: { ...order[0], items } });
    return;
}

case 'create_order': {
    const personId = typeof args.person_id === 'string' ? args.person_id : '';
    const items = Array.isArray(args.items) ? args.items : [];
    if (!personId || items.length === 0) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS', message: 'person_id và items required' } });
        return;
    }
    const channel = typeof args.channel === 'string' ? args.channel : 'TAI_CHO';
    let subtotal = 0;
    for (const it of items) subtotal += (it.qty || 0) * (it.unit_price || 0);
    const code = `ORD-${Date.now()}`;
    const r = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO orders (workspace_id, code, person_id, channel, status, subtotal, total, debt_amount, created_by_user_id, created_at)
         VALUES ($1, $2, $3, $4, 'PENDING', $5::bigint, $5::bigint, $5::bigint, $6, now())
         RETURNING id, code, status, total`,
        workspaceId, code, personId, channel, subtotal, hermesUserId
    );
    const orderId = r[0].id;
    for (const it of items.slice(0, 50)) {
        await db_1.prisma.$executeRawUnsafe(
            `INSERT INTO order_items (order_id, product_id, qty, unit_price, amount)
             VALUES ($1::uuid, $2, $3, $4::bigint, $5::bigint)`,
            orderId, it.product_id, it.qty || 1, it.unit_price || 0, (it.qty || 1) * (it.unit_price || 0)
        );
    }
    res.json({ ok: true, data: { ...r[0], items_count: items.length } });
    return;
}

case 'update_order_status': {
    const orderId = typeof args.order_id === 'string' ? args.order_id : '';
    const status = typeof args.status === 'string' ? args.status : '';
    const validStatuses = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED'];
    if (!orderId || !validStatuses.includes(status)) {
        res.status(400).json({ ok: false, error: { code: 'INVALID_PARAMS' } });
        return;
    }
    const result = await db_1.prisma.$executeRawUnsafe(
        `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 AND workspace_id = $3`,
        status, orderId, workspaceId
    );
    res.json({ ok: true, data: { updated: result > 0, order_id: orderId, status } });
    return;
}
