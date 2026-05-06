// Module: funnel (10 cases)

case 'funnel_summary': {
    const rows = await db_1.prisma.$queryRawUnsafe(
        `SELECT fs.name AS stage, COUNT(fd.id)::int AS count
         FROM funnel_stages fs
         LEFT JOIN funnel_deals fd ON fd.stage_id = fs.id AND fd.workspace_id = $1
         WHERE fs.workspace_id = $1
         GROUP BY fs.id, fs.name, fs.sort_order ORDER BY fs.sort_order`,
        workspaceId
    );
    res.json({ ok: true, data: { stages: rows, total: rows.reduce((s, r) => s + r.count, 0) } });
    return;
}

case 'list_funnel_deals': {
    const stage = typeof args.stage === 'string' ? args.stage : 'ALL';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 50;
    const params = [workspaceId];
    let sql = `SELECT fd.id, fd.person_id, fd.value, fd.expected_close_date, fd.source, fd.assigned_to, fs.name AS stage_name
               FROM funnel_deals fd LEFT JOIN funnel_stages fs ON fs.id = fd.stage_id
               WHERE fd.workspace_id = $1`;
    if (stage !== 'ALL') {
        params.push(stage);
        sql += ` AND fs.name = $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY fd.created_at DESC LIMIT $${params.length}`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'get_funnel_deal_detail': {
    const dealId = typeof args.deal_id === 'string' ? args.deal_id : '';
    if (!dealId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_DEAL_ID' } });
        return;
    }
    const deal = await db_1.prisma.$queryRawUnsafe(
        `SELECT fd.*, fs.name AS stage_name FROM funnel_deals fd
         LEFT JOIN funnel_stages fs ON fs.id = fd.stage_id
         WHERE fd.id = $1 AND fd.workspace_id = $2 LIMIT 1`,
        dealId, workspaceId
    );
    if (!deal.length) {
        res.status(404).json({ ok: false, error: { code: 'DEAL_NOT_FOUND' } });
        return;
    }
    const history = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, from_stage_id, to_stage_id, changed_by, note, changed_at
         FROM funnel_stage_history WHERE deal_id = $1 ORDER BY changed_at DESC LIMIT 50`,
        dealId
    );
    res.json({ ok: true, data: { ...deal[0], history } });
    return;
}

case 'create_funnel_deal': {
    const fullName = typeof args.full_name === 'string' ? args.full_name : '';
    const phone = typeof args.phone === 'string' ? args.phone : '';
    if (!fullName || !phone) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS', message: 'full_name và phone required' } });
        return;
    }
    const stage = typeof args.stage === 'string' ? args.stage : 'LEAD';
    const value = typeof args.value === 'number' ? args.value : 0;
    const personId = typeof args.person_id === 'string' ? args.person_id : null;
    const note = typeof args.note === 'string' ? args.note : null;
    const stageRow = await db_1.prisma.$queryRawUnsafe(
        `SELECT id FROM funnel_stages WHERE name = $1 AND workspace_id = $2 LIMIT 1`,
        stage, workspaceId
    );
    const stageId = stageRow.length ? stageRow[0].id : null;
    const r = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO funnel_deals (workspace_id, person_id, stage_id, value, source, assigned_to, note, created_at)
         VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, now())
         RETURNING id, person_id, value, source, created_at`,
        workspaceId, personId, stageId, value, args.source || null, args.assigned_to || null, note
    );
    res.json({ ok: true, data: { ...r[0], full_name: fullName, phone, stage } });
    return;
}

case 'delete_funnel_deal': {
    const dealId = typeof args.deal_id === 'string' ? args.deal_id : '';
    const reason = typeof args.reason === 'string' ? args.reason : 'no_reason';
    if (!dealId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_DEAL_ID' } });
        return;
    }
    const result = await db_1.prisma.$executeRawUnsafe(
        `DELETE FROM funnel_deals WHERE id = $1 AND workspace_id = $2`,
        dealId, workspaceId
    );
    console.log(`[funnel] delete deal=${dealId} ws=${workspaceId} user=${hermesUserId} reason=${reason}`);
    res.json({ ok: true, data: { deleted: result > 0, deal_id: dealId, reason } });
    return;
}

case 'assign_funnel_deal': {
    const dealId = typeof args.deal_id === 'string' ? args.deal_id : '';
    const staffId = typeof args.staff_id === 'string' ? args.staff_id : '';
    if (!dealId || !staffId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
        return;
    }
    const result = await db_1.prisma.$executeRawUnsafe(
        `UPDATE funnel_deals SET assigned_to = $1 WHERE id = $2 AND workspace_id = $3`,
        staffId, dealId, workspaceId
    );
    res.json({ ok: true, data: { deal_id: dealId, staff_id: staffId, assigned: result > 0 } });
    return;
}

case 'bulk_update_funnel_stage': {
    const dealIds = Array.isArray(args.deal_ids) ? args.deal_ids.filter(x => typeof x === 'string').slice(0, 100) : [];
    const stage = typeof args.stage === 'string' ? args.stage : '';
    if (dealIds.length === 0 || !stage) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
        return;
    }
    const stageRow = await db_1.prisma.$queryRawUnsafe(
        `SELECT id FROM funnel_stages WHERE name = $1 AND workspace_id = $2 LIMIT 1`,
        stage, workspaceId
    );
    if (!stageRow.length) {
        res.status(404).json({ ok: false, error: { code: 'STAGE_NOT_FOUND' } });
        return;
    }
    let updated = 0;
    for (const did of dealIds) {
        const r = await db_1.prisma.$executeRawUnsafe(
            `UPDATE funnel_deals SET stage_id = $1::uuid WHERE id = $2 AND workspace_id = $3`,
            stageRow[0].id, did, workspaceId
        );
        if (r > 0) updated++;
    }
    res.json({ ok: true, data: { updated, total: dealIds.length, stage } });
    return;
}

case 'get_funnel_deal_history': {
    const dealId = typeof args.deal_id === 'string' ? args.deal_id : '';
    if (!dealId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_DEAL_ID' } });
        return;
    }
    const items = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, from_stage_id, to_stage_id, changed_by, note, changed_at
         FROM funnel_stage_history WHERE deal_id = $1 ORDER BY changed_at DESC LIMIT 100`,
        dealId
    );
    res.json({ ok: true, data: { deal_id: dealId, items, total: items.length } });
    return;
}

case 'manage_funnel_stages': {
    const action = typeof args.action === 'string' ? args.action : '';
    if (action === 'list') {
        const items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, name, color, sort_order, is_won, is_lost FROM funnel_stages WHERE workspace_id = $1 ORDER BY sort_order`,
            workspaceId
        );
        res.json({ ok: true, data: { items, total: items.length } });
        return;
    }
    if (action === 'create') {
        const data = (args.stage_data && typeof args.stage_data === 'object') ? args.stage_data : {};
        const name = typeof data.name === 'string' ? data.name : '';
        if (!name) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_NAME' } });
            return;
        }
        const r = await db_1.prisma.$queryRawUnsafe(
            `INSERT INTO funnel_stages (workspace_id, name, color, sort_order, is_won, is_lost)
             VALUES ($1, $2, $3, COALESCE($4,0), $5, $6) RETURNING id, name, sort_order`,
            workspaceId, name, data.color || null, data.sort_order || 0, data.is_won === true, data.is_lost === true
        );
        res.json({ ok: true, data: r[0] });
        return;
    }
    if (action === 'delete') {
        const stageId = typeof args.stage_id === 'string' ? args.stage_id : '';
        if (!stageId) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_STAGE_ID' } });
            return;
        }
        const result = await db_1.prisma.$executeRawUnsafe(
            `DELETE FROM funnel_stages WHERE id = $1 AND workspace_id = $2`,
            stageId, workspaceId
        );
        res.json({ ok: true, data: { deleted: result > 0, stage_id: stageId } });
        return;
    }
    res.status(400).json({ ok: false, error: { code: 'INVALID_ACTION' } });
    return;
}

case 'funnel_conversion_report': {
    const rows = await db_1.prisma.$queryRawUnsafe(
        `SELECT fs.name AS stage, COUNT(fd.id)::int AS count
         FROM funnel_stages fs
         LEFT JOIN funnel_deals fd ON fd.stage_id = fs.id AND fd.workspace_id = $1
         WHERE fs.workspace_id = $1 GROUP BY fs.id, fs.name, fs.sort_order ORDER BY fs.sort_order`,
        workspaceId
    );
    res.json({ ok: true, data: { stages: rows } });
    return;
}
