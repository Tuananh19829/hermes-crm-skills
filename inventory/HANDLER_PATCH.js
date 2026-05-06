// Module: inventory (11 cases)

case 'search_products': {
    const q = typeof args.q === 'string' ? args.q : '';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 30;
    const params = [workspaceId];
    let sql = `SELECT id, code, name, sale_price, cost_price, unit, is_active, category_id, brand_id
               FROM products WHERE workspace_id = $1 AND is_active = true`;
    if (q) {
        params.push(`%${q}%`);
        sql += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length})`;
    }
    params.push(limit);
    sql += ` ORDER BY name LIMIT $${params.length}`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'get_stock_report': {
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 200) : 100;
    const items = await db_1.prisma.$queryRawUnsafe(
        `SELECT p.id, p.code, p.name, p.unit, p.min_stock,
                COALESCE(SUM(sm.quantity), 0)::int AS stock,
                p.cost_price, p.sale_price
         FROM products p
         LEFT JOIN stock_movements sm ON sm.product_id = p.id
         WHERE p.workspace_id = $1 AND p.is_active = true
         GROUP BY p.id, p.code, p.name, p.unit, p.min_stock, p.cost_price, p.sale_price
         ORDER BY p.name LIMIT $2`,
        workspaceId, limit
    );
    const lowStock = items.filter(i => i.stock < (i.min_stock || 0)).length;
    res.json({ ok: true, data: { items, total: items.length, low_stock_count: lowStock } });
    return;
}

case 'create_import_stock': {
    const productId = typeof args.product_id === 'string' ? args.product_id : '';
    const quantity = typeof args.quantity === 'number' ? args.quantity : 0;
    const unitCost = typeof args.unit_cost === 'number' ? args.unit_cost : 0;
    if (!productId || quantity <= 0) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
        return;
    }
    const supplierId = typeof args.supplier_id === 'string' ? args.supplier_id : null;
    const note = typeof args.note === 'string' ? args.note : null;
    const r = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO stock_movements (workspace_id, product_id, quantity, unit_cost, type, supplier_id, note, created_by_user_id, created_at)
         VALUES ($1, $2, $3, $4::bigint, 'IMPORT'::"StockMovementType", $5, $6, $7, now())
         RETURNING id, product_id, quantity, type`,
        workspaceId, productId, quantity, unitCost, supplierId, note, hermesUserId
    );
    res.json({ ok: true, data: r[0] });
    return;
}

case 'create_export_stock': {
    const productId = typeof args.product_id === 'string' ? args.product_id : '';
    const quantity = typeof args.quantity === 'number' ? args.quantity : 0;
    if (!productId || quantity <= 0) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
        return;
    }
    const note = typeof args.note === 'string' ? args.note : null;
    const r = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO stock_movements (workspace_id, product_id, quantity, type, note, created_by_user_id, created_at)
         VALUES ($1, $2, $3, 'EXPORT'::"StockMovementType", $4, $5, now())
         RETURNING id, product_id, quantity, type`,
        workspaceId, productId, -Math.abs(quantity), note, hermesUserId
    );
    res.json({ ok: true, data: r[0] });
    return;
}

case 'create_stock_transfer': {
    const productId = typeof args.product_id === 'string' ? args.product_id : '';
    const quantity = typeof args.quantity === 'number' ? args.quantity : 0;
    const fromBranch = typeof args.from_branch_id === 'string' ? args.from_branch_id : null;
    const toBranch = typeof args.to_branch_id === 'string' ? args.to_branch_id : null;
    if (!productId || quantity <= 0 || !fromBranch || !toBranch) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
        return;
    }
    await db_1.prisma.$executeRawUnsafe(
        `INSERT INTO stock_movements (workspace_id, product_id, quantity, type, branch_id, note, created_by_user_id, created_at)
         VALUES ($1, $2, $3, 'TRANSFER'::"StockMovementType", $4, $5, $6, now())`,
        workspaceId, productId, -Math.abs(quantity), fromBranch, `Transfer to ${toBranch}`, hermesUserId
    );
    await db_1.prisma.$executeRawUnsafe(
        `INSERT INTO stock_movements (workspace_id, product_id, quantity, type, branch_id, note, created_by_user_id, created_at)
         VALUES ($1, $2, $3, 'TRANSFER'::"StockMovementType", $4, $5, $6, now())`,
        workspaceId, productId, quantity, toBranch, `Transfer from ${fromBranch}`, hermesUserId
    );
    res.json({ ok: true, data: { product_id: productId, quantity, from_branch_id: fromBranch, to_branch_id: toBranch } });
    return;
}

case 'create_stocktake': {
    const productId = typeof args.product_id === 'string' ? args.product_id : '';
    const actualQty = typeof args.actual_qty === 'number' ? args.actual_qty : 0;
    if (!productId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PRODUCT_ID' } });
        return;
    }
    const cur = await db_1.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(quantity), 0)::int AS stock FROM stock_movements WHERE workspace_id = $1 AND product_id = $2`,
        workspaceId, productId
    );
    const diff = actualQty - Number(cur[0].stock);
    if (diff !== 0) {
        await db_1.prisma.$executeRawUnsafe(
            `INSERT INTO stock_movements (workspace_id, product_id, quantity, type, note, created_by_user_id, created_at)
             VALUES ($1, $2, $3, 'ADJUSTMENT'::"StockMovementType", 'Stocktake adjust', $4, now())`,
            workspaceId, productId, diff, hermesUserId
        );
    }
    res.json({ ok: true, data: { product_id: productId, system_qty: Number(cur[0].stock), actual_qty: actualQty, adjustment: diff } });
    return;
}

case 'manage_suppliers': {
    const action = typeof args.action === 'string' ? args.action : '';
    if (action === 'list') {
        const items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, name, phone, email, address, note FROM suppliers WHERE workspace_id = $1 ORDER BY name`,
            workspaceId
        );
        res.json({ ok: true, data: { items, total: items.length } });
        return;
    }
    if (action === 'create') {
        const name = typeof args.name === 'string' ? args.name : '';
        if (!name) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_NAME' } });
            return;
        }
        const r = await db_1.prisma.$queryRawUnsafe(
            `INSERT INTO suppliers (workspace_id, name, phone, email, address, note, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING id, name`,
            workspaceId, name, args.phone || null, args.email || null, args.address || null, args.note || null
        );
        res.json({ ok: true, data: r[0] });
        return;
    }
    if (action === 'delete') {
        const supplierId = typeof args.supplier_id === 'string' ? args.supplier_id : '';
        if (!supplierId) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_SUPPLIER_ID' } });
            return;
        }
        const result = await db_1.prisma.$executeRawUnsafe(
            `DELETE FROM suppliers WHERE id = $1 AND workspace_id = $2`,
            supplierId, workspaceId
        );
        res.json({ ok: true, data: { deleted: result > 0 } });
        return;
    }
    res.status(400).json({ ok: false, error: { code: 'INVALID_ACTION' } });
    return;
}

case 'create_product': {
    const name = typeof args.name === 'string' ? args.name : '';
    const code = typeof args.code === 'string' ? args.code : `P-${Date.now()}`;
    const salePrice = typeof args.sale_price === 'number' ? args.sale_price : 0;
    const costPrice = typeof args.cost_price === 'number' ? args.cost_price : 0;
    if (!name) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_NAME' } });
        return;
    }
    const r = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO products (workspace_id, code, name, sale_price, cost_price, unit, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4::bigint, $5::bigint, $6, true, now(), now())
         RETURNING id, code, name, sale_price`,
        workspaceId, code, name, salePrice, costPrice, args.unit || 'Cái'
    );
    res.json({ ok: true, data: r[0] });
    return;
}

case 'manage_brands': {
    const action = typeof args.action === 'string' ? args.action : 'list';
    if (action === 'list') {
        const items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, name, description FROM product_brands WHERE workspace_id = $1 ORDER BY name`,
            workspaceId
        );
        res.json({ ok: true, data: { items, total: items.length } });
        return;
    }
    if (action === 'create') {
        const name = typeof args.name === 'string' ? args.name : '';
        if (!name) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_NAME' } });
            return;
        }
        const r = await db_1.prisma.$queryRawUnsafe(
            `INSERT INTO product_brands (workspace_id, name, description, created_at)
             VALUES ($1, $2, $3, now()) RETURNING id, name`,
            workspaceId, name, args.description || null
        );
        res.json({ ok: true, data: r[0] });
        return;
    }
    res.status(400).json({ ok: false, error: { code: 'INVALID_ACTION' } });
    return;
}

case 'manage_units': {
    const action = typeof args.action === 'string' ? args.action : 'list';
    if (action === 'list') {
        const items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, name FROM product_units WHERE workspace_id = $1 ORDER BY name`,
            workspaceId
        );
        res.json({ ok: true, data: { items, total: items.length } });
        return;
    }
    if (action === 'create') {
        const name = typeof args.name === 'string' ? args.name : '';
        if (!name) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_NAME' } });
            return;
        }
        const r = await db_1.prisma.$queryRawUnsafe(
            `INSERT INTO product_units (workspace_id, name, created_at) VALUES ($1, $2, now()) RETURNING id, name`,
            workspaceId, name
        );
        res.json({ ok: true, data: r[0] });
        return;
    }
    res.status(400).json({ ok: false, error: { code: 'INVALID_ACTION' } });
    return;
}

case 'manage_fixed_assets': {
    res.json({ ok: false, error: { code: 'NOT_IMPLEMENTED', message: 'Fixed assets table not in schema; awaiting migration' } });
    return;
}

