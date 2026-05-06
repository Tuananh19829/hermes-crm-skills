// ============================================================
// PATCH cho /opt/crm/agent-tools-hermes.js
// Module: loyalty (10 case)
// ============================================================

case 'loyalty_summary': {
    const tiers = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total FROM loyalty_tiers WHERE workspace_id = $1`,
        workspaceId
    );
    const customers = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE points > 0)::int AS active
         FROM loyalty_accounts WHERE workspace_id = $1`,
        workspaceId
    );
    res.json({ ok: true, data: { tiers_count: tiers[0].total, customers: customers[0] } });
    return;
}

case 'update_loyalty_tier': {
    const tierId = typeof args.tier_id === 'string' ? args.tier_id : '';
    if (!tierId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_TIER_ID' } });
        return;
    }
    const sets = [];
    const params = [];
    if (typeof args.name === 'string') { params.push(args.name); sets.push(`name = $${params.length}`); }
    if (typeof args.min_points === 'number') { params.push(args.min_points); sets.push(`min_points = $${params.length}`); }
    if (typeof args.discount_percent === 'number') { params.push(args.discount_percent); sets.push(`discount_percent = $${params.length}`); }
    if (typeof args.benefits === 'string') { params.push(args.benefits); sets.push(`benefits = $${params.length}`); }
    if (typeof args.color === 'string') { params.push(args.color); sets.push(`color = $${params.length}`); }
    if (sets.length === 0) {
        res.status(400).json({ ok: false, error: { code: 'NO_FIELDS' } });
        return;
    }
    params.push(tierId);
    params.push(workspaceId);
    const result = await db_1.prisma.$queryRawUnsafe(
        `UPDATE loyalty_tiers SET ${sets.join(', ')} WHERE id = $${params.length - 1} AND workspace_id = $${params.length} RETURNING id, name, min_points, discount_percent, color`,
        ...params
    );
    if (!result.length) {
        res.status(404).json({ ok: false, error: { code: 'TIER_NOT_FOUND' } });
        return;
    }
    res.json({ ok: true, data: result[0] });
    return;
}

case 'delete_loyalty_tier': {
    const tierId = typeof args.tier_id === 'string' ? args.tier_id : '';
    const reason = typeof args.reason === 'string' ? args.reason : 'no_reason';
    if (!tierId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_TIER_ID' } });
        return;
    }
    const result = await db_1.prisma.$executeRawUnsafe(
        `DELETE FROM loyalty_tiers WHERE id = $1 AND workspace_id = $2`,
        tierId, workspaceId
    );
    console.log(`[loyalty] delete tier=${tierId} ws=${workspaceId} user=${hermesUserId} reason=${reason}`);
    res.json({ ok: true, data: { deleted: result > 0, tier_id: tierId, reason } });
    return;
}

case 'assign_loyalty_tier': {
    const customerId = typeof args.customer_id === 'string' ? args.customer_id : '';
    const tierId = typeof args.tier_id === 'string' ? args.tier_id : '';
    if (!customerId || !tierId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
        return;
    }
    await db_1.prisma.$executeRawUnsafe(
        `INSERT INTO loyalty_accounts (workspace_id, person_id, tier_id, points, lifetime_points, created_at)
         VALUES ($1, $2, $3, 0, 0, now())
         ON CONFLICT (person_id) DO UPDATE SET tier_id = $3`,
        workspaceId, customerId, tierId
    );
    res.json({ ok: true, data: { customer_id: customerId, tier_id: tierId, assigned: true } });
    return;
}

case 'count_loyalty_customers': {
    const tierId = typeof args.tier_id === 'string' ? args.tier_id : null;
    const params = [workspaceId];
    let sql = `SELECT COUNT(*)::int AS total FROM loyalty_accounts WHERE workspace_id = $1`;
    if (tierId) {
        params.push(tierId);
        sql += ` AND tier_id = $${params.length}`;
    }
    const r = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { total: r[0].total, tier_id: tierId } });
    return;
}

case 'list_loyalty_history': {
    const customerId = typeof args.customer_id === 'string' ? args.customer_id : null;
    const action = typeof args.action === 'string' ? args.action : 'ALL';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 200) : 50;
    const params = [workspaceId];
    let sql = `SELECT lh.id, lh.action, lh.points, lh.reason, lh.created_at, la.person_id
               FROM loyalty_history lh
               JOIN loyalty_accounts la ON la.id = lh.account_id
               WHERE lh.workspace_id = $1`;
    if (customerId) {
        params.push(customerId);
        sql += ` AND la.person_id = $${params.length}`;
    }
    if (action !== 'ALL') {
        params.push(action);
        sql += ` AND lh.action = $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY lh.created_at DESC LIMIT $${params.length}`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'manage_loyalty_label': {
    const action = typeof args.action === 'string' ? args.action : '';
    if (action === 'list') {
        const items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, name, color, criteria, is_active FROM loyalty_labels WHERE workspace_id = $1 ORDER BY name`,
            workspaceId
        );
        res.json({ ok: true, data: { items, total: items.length } });
        return;
    }
    if (action === 'create') {
        const data = (args.label_data && typeof args.label_data === 'object') ? args.label_data : {};
        const name = typeof data.name === 'string' ? data.name : '';
        if (!name) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_NAME' } });
            return;
        }
        const r = await db_1.prisma.$queryRawUnsafe(
            `INSERT INTO loyalty_labels (workspace_id, name, color, criteria, is_active)
             VALUES ($1, $2, $3, $4::jsonb, true) RETURNING id, name, color`,
            workspaceId, name, data.color || null, JSON.stringify(data.criteria || {})
        );
        res.json({ ok: true, data: r[0] });
        return;
    }
    if (action === 'delete') {
        const labelId = typeof args.label_id === 'string' ? args.label_id : '';
        if (!labelId) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_LABEL_ID' } });
            return;
        }
        const result = await db_1.prisma.$executeRawUnsafe(
            `DELETE FROM loyalty_labels WHERE id = $1 AND workspace_id = $2`,
            labelId, workspaceId
        );
        res.json({ ok: true, data: { deleted: result > 0, label_id: labelId } });
        return;
    }
    res.status(400).json({ ok: false, error: { code: 'INVALID_ACTION', message: 'action must be list/create/delete' } });
    return;
}

case 'manage_loyalty_source': {
    const action = typeof args.action === 'string' ? args.action : '';
    if (action === 'list') {
        const items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, name, icon, is_active FROM loyalty_sources WHERE workspace_id = $1 ORDER BY name`,
            workspaceId
        );
        res.json({ ok: true, data: { items, total: items.length } });
        return;
    }
    if (action === 'create') {
        const data = (args.source_data && typeof args.source_data === 'object') ? args.source_data : {};
        const name = typeof data.name === 'string' ? data.name : '';
        if (!name) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_NAME' } });
            return;
        }
        const r = await db_1.prisma.$queryRawUnsafe(
            `INSERT INTO loyalty_sources (workspace_id, name, icon, is_active)
             VALUES ($1, $2, $3, true) RETURNING id, name, icon`,
            workspaceId, name, data.icon || null
        );
        res.json({ ok: true, data: r[0] });
        return;
    }
    if (action === 'delete') {
        const sourceId = typeof args.source_id === 'string' ? args.source_id : '';
        if (!sourceId) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_SOURCE_ID' } });
            return;
        }
        const result = await db_1.prisma.$executeRawUnsafe(
            `DELETE FROM loyalty_sources WHERE id = $1 AND workspace_id = $2`,
            sourceId, workspaceId
        );
        res.json({ ok: true, data: { deleted: result > 0, source_id: sourceId } });
        return;
    }
    res.status(400).json({ ok: false, error: { code: 'INVALID_ACTION' } });
    return;
}

case 'list_loyalty_labels': {
    const activeOnly = args.active_only !== false;
    const params = [workspaceId];
    let sql = `SELECT id, name, color, criteria, is_active FROM loyalty_labels WHERE workspace_id = $1`;
    if (activeOnly) sql += ` AND is_active = true`;
    sql += ` ORDER BY name`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'list_loyalty_sources': {
    const activeOnly = args.active_only !== false;
    const params = [workspaceId];
    let sql = `SELECT id, name, icon, is_active FROM loyalty_sources WHERE workspace_id = $1`;
    if (activeOnly) sql += ` AND is_active = true`;
    sql += ` ORDER BY name`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}
