// Module: customers (8 cases - FIX schema-aligned + 4 missing handlers)
// Real schema (verified via \d people on prod 2026-05-06):
//   - Table = `people` (NOT `customers`)
//   - Has: tier (CustomerTier enum), tags, lead_status, last_called_at, visit_count, customer_group (text)
//   - NO deleted_at, NO last_visit_at, NO `customer_group_members` table
// Membership lưu trong `people.customer_group` (text) match `customer_groups.name`.

case 'search_customers': {
    const query = typeof args.query === 'string' ? args.query.trim() : (typeof args.q === 'string' ? args.q.trim() : '');
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 50) : 20;
    const params = [workspaceId];
    let sql = `SELECT id, full_name, phone, email, gender, birthday, tier, tags, lead_status, customer_group, last_called_at, visit_count, created_at FROM people WHERE workspace_id = $1`;
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

case 'get_customer_detail': {
    const customerId = typeof args.id === 'string' ? args.id : (typeof args.person_id === 'string' ? args.person_id : '');
    if (!customerId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_ID', message: 'id required' } });
        return;
    }
    const r = await db_1.prisma.$queryRawUnsafe(
        `SELECT * FROM people WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        customerId, workspaceId
    );
    if (!r.length) {
        res.status(404).json({ ok: false, error: { code: 'CUSTOMER_NOT_FOUND' } });
        return;
    }
    res.json({ ok: true, data: r[0] });
    return;
}

case 'create_customer': {
    const fullName = typeof args.full_name === 'string' ? args.full_name.trim() : '';
    const phone = typeof args.phone === 'string' ? args.phone.trim() : '';
    if (!fullName || !phone) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS', message: 'full_name & phone required' } });
        return;
    }
    const email = typeof args.email === 'string' ? args.email : null;
    const gender = typeof args.gender === 'string' ? args.gender : null;
    const note = typeof args.note === 'string' ? args.note : null;
    const r = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO people (id, workspace_id, full_name, phone, email, gender, note, created_by_user_id, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, now(), now())
         RETURNING id, full_name, phone, email`,
        workspaceId, fullName, phone, email, gender, note, hermesUserId
    );
    res.json({ ok: true, data: r[0] });
    return;
}

case 'update_customer': {
    const customerId = typeof args.id === 'string' ? args.id : (typeof args.person_id === 'string' ? args.person_id : '');
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
    if (typeof args.gender === 'string') { params.push(args.gender); sets.push(`gender = $${params.length}`); }
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
    const customerId = typeof args.id === 'string' ? args.id : (typeof args.person_id === 'string' ? args.person_id : '');
    const reason = typeof args.reason === 'string' ? args.reason : 'no_reason';
    if (!customerId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_ID' } });
        return;
    }
    // No soft-delete column on people. Mark via tag + note instead.
    const r = await db_1.prisma.$executeRawUnsafe(
        `UPDATE people SET tags = array_append(COALESCE(tags,'{}'::text[]), 'archived'),
                           note = COALESCE(note,'') || ' | ARCHIVED: ' || $1::text, updated_at = now()
         WHERE id = $2 AND workspace_id = $3 AND NOT ('archived' = ANY(COALESCE(tags,'{}'::text[])))`,
        reason, customerId, workspaceId
    );
    console.log(`[customers] archive id=${customerId} ws=${workspaceId} user=${hermesUserId} reason=${reason}`);
    res.json({ ok: true, data: { archived: r > 0, id: customerId, reason } });
    return;
}

case 'customers_summary': {
    const totals = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE tier::text = 'VIP')::int AS vip_count,
                COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS new_30d
         FROM people WHERE workspace_id = $1`,
        workspaceId
    );
    res.json({ ok: true, data: totals[0] });
    return;
}

case 'list_customer_groups': {
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 50) : 20;
    const items = await db_1.prisma.$queryRawUnsafe(
        `SELECT g.id, g.name, g.description, g.color, g.is_active, g.created_at,
                (SELECT COUNT(*)::int FROM people p WHERE p.workspace_id = g.workspace_id AND p.customer_group = g.name) AS member_count
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
            `SELECT id, full_name, phone, last_called_at, visit_count FROM people
             WHERE workspace_id = $1
               AND (last_called_at IS NULL OR last_called_at < now() - interval '30 days')
             ORDER BY last_called_at ASC NULLS FIRST LIMIT $2`,
            workspaceId, limit
        );
    } else if (careType === 'birthday') {
        items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, full_name, phone, birthday FROM people
             WHERE workspace_id = $1 AND birthday IS NOT NULL
               AND EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM now())
               AND EXTRACT(DAY FROM birthday) BETWEEN EXTRACT(DAY FROM now()) AND EXTRACT(DAY FROM now()) + 7
             ORDER BY EXTRACT(DAY FROM birthday) ASC LIMIT $2`,
            workspaceId, limit
        );
    } else {
        items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, full_name, phone, last_called_at, birthday, visit_count FROM people
             WHERE workspace_id = $1
             ORDER BY COALESCE(last_called_at, created_at) ASC LIMIT $2`,
            workspaceId, limit
        );
    }
    res.json({ ok: true, data: { care_type: careType, items, total: items.length } });
    return;
}

case 'get_loyalty_points': {
    const customerId = typeof args.id === 'string' ? args.id : (typeof args.person_id === 'string' ? args.person_id : '');
    if (!customerId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_ID' } });
        return;
    }
    const ledger = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, type, points, balance_after, reason, created_at FROM loyalty_ledger
         WHERE workspace_id = $1 AND person_id = $2 ORDER BY created_at DESC LIMIT 50`,
        workspaceId, customerId
    );
    const balance = ledger.length ? Number(ledger[0].balance_after) : 0;
    res.json({ ok: true, data: { person_id: customerId, balance, history: ledger, total_history: ledger.length } });
    return;
}

case 'manage_vouchers': {
    const action = typeof args.action === 'string' ? args.action : 'list';
    const customerId = typeof args.id === 'string' ? args.id : (typeof args.person_id === 'string' ? args.person_id : '');
    if (action === 'list') {
        const params = [workspaceId];
        let sql = `SELECT vr.id, vr.code_id, vc.code, vr.discount_applied, vr.used_at, vr.is_voided, vr.invoice_id
                   FROM voucher_redemptions vr LEFT JOIN voucher_codes vc ON vc.id = vr.code_id
                   WHERE vr.workspace_id = $1`;
        if (customerId) {
            params.push(customerId);
            sql += ` AND vr.person_id = $${params.length}`;
        }
        sql += ` ORDER BY vr.used_at DESC LIMIT 50`;
        const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
        res.json({ ok: true, data: { items, total: items.length } });
        return;
    }
    res.status(400).json({ ok: false, error: { code: 'INVALID_ACTION' } });
    return;
}

