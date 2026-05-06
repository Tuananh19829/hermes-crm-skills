// Module: services (7 cases)

case 'search_services': {
    const q = typeof args.q === 'string' ? args.q : '';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 30;
    const params = [workspaceId];
    let sql = `SELECT id, name, price, duration_minutes, category_id, service_type, total_sessions, is_active
               FROM services WHERE workspace_id = $1 AND is_active = true`;
    if (q) {
        params.push(`%${q}%`);
        sql += ` AND name ILIKE $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY sort_order, name LIMIT $${params.length}`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'get_service_detail': {
    const serviceId = typeof args.service_id === 'string' ? args.service_id : '';
    if (!serviceId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_SERVICE_ID' } });
        return;
    }
    const r = await db_1.prisma.$queryRawUnsafe(
        `SELECT s.*, sc.name AS category_name FROM services s
         LEFT JOIN service_categories sc ON sc.id = s.category_id
         WHERE s.id = $1 AND s.workspace_id = $2 LIMIT 1`,
        serviceId, workspaceId
    );
    if (!r.length) {
        res.status(404).json({ ok: false, error: { code: 'SERVICE_NOT_FOUND' } });
        return;
    }
    res.json({ ok: true, data: r[0] });
    return;
}

case 'list_service_categories': {
    const items = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, name, description, sort_order, is_active FROM service_categories
         WHERE workspace_id = $1 AND is_active = true ORDER BY sort_order, name`,
        workspaceId
    );
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'search_treatments': {
    const q = typeof args.q === 'string' ? args.q : '';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 30;
    const params = [workspaceId];
    let sql = `SELECT id, name, price, duration_minutes, total_sessions, service_type, is_active
               FROM services WHERE workspace_id = $1 AND service_type IN ('package','treatment') AND is_active = true`;
    if (q) {
        params.push(`%${q}%`);
        sql += ` AND name ILIKE $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY name LIMIT $${params.length}`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'create_treatment': {
    const name = typeof args.name === 'string' ? args.name : '';
    const price = typeof args.price === 'number' ? args.price : 0;
    const totalSessions = typeof args.total_sessions === 'number' ? args.total_sessions : 1;
    const duration = typeof args.duration_minutes === 'number' ? args.duration_minutes : 60;
    if (!name || totalSessions < 1) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS', message: 'name & total_sessions required' } });
        return;
    }
    const categoryId = typeof args.category_id === 'string' ? args.category_id : null;
    const r = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO services (id, workspace_id, name, price, duration_minutes, service_type, total_sessions, category_id, is_active, created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'package', $5, $6, true, now())
         RETURNING id, name, price, total_sessions, service_type`,
        workspaceId, name, price, duration, totalSessions, categoryId
    );
    res.json({ ok: true, data: r[0] });
    return;
}

case 'cancel_service_refund': {
    const invoiceId = typeof args.invoice_id === 'string' ? args.invoice_id : '';
    const reason = typeof args.reason === 'string' ? args.reason : 'no_reason';
    const refundAmount = typeof args.refund_amount === 'number' ? args.refund_amount : 0;
    if (!invoiceId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_INVOICE_ID' } });
        return;
    }
    const result = await db_1.prisma.$executeRawUnsafe(
        `UPDATE invoices SET status = 'VOID', note = COALESCE(note,'') || ' | REFUND: ' || $1::text || ' amount=' || $2::text
         WHERE id = $3 AND workspace_id = $4`,
        reason, String(refundAmount), invoiceId, workspaceId
    );
    console.log(`[services] cancel/refund invoice=${invoiceId} ws=${workspaceId} user=${hermesUserId} amount=${refundAmount}`);
    res.json({ ok: true, data: { refunded: result > 0, invoice_id: invoiceId, refund_amount: refundAmount, reason } });
    return;
}

case 'manage_marketing_cost': {
    const action = typeof args.action === 'string' ? args.action : '';
    if (action === 'list') {
        const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 50;
        const items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, code, title, amount, status, cost_date, campaign_id, created_at
             FROM marketing_costs WHERE workspace_id = $1 ORDER BY cost_date DESC LIMIT $2`,
            workspaceId, limit
        );
        res.json({ ok: true, data: { items, total: items.length } });
        return;
    }
    if (action === 'create') {
        const title = typeof args.title === 'string' ? args.title : '';
        const amount = typeof args.amount === 'number' ? args.amount : 0;
        if (!title || amount <= 0) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
            return;
        }
        const code = `MKT-${Date.now()}`;
        const r = await db_1.prisma.$queryRawUnsafe(
            `INSERT INTO marketing_costs (workspace_id, code, title, amount, status, cost_date, created_by, created_at)
             VALUES ($1, $2, $3, $4, 'PENDING', CURRENT_DATE, $5, now())
             RETURNING id, code, title, amount, status`,
            workspaceId, code, title, amount, hermesUserId
        );
        res.json({ ok: true, data: r[0] });
        return;
    }
    res.status(400).json({ ok: false, error: { code: 'INVALID_ACTION' } });
    return;
}

