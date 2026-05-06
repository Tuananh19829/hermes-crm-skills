// Module: finance (9 cases)

case 'cashbook_report': {
    const period = typeof args.period === 'string' ? args.period : 'month';
    let intervalSql = `interval '30 days'`;
    if (period === 'today') intervalSql = `interval '1 day'`;
    else if (period === 'week') intervalSql = `interval '7 days'`;
    const r = await db_1.prisma.$queryRawUnsafe(
        `SELECT
            COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)::bigint AS total_income,
            COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)::bigint AS total_expense,
            COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0)::bigint AS net,
            COUNT(*)::int AS tx_count
         FROM cash_transactions WHERE workspace_id = $1 AND transaction_date > now() - ${intervalSql}`,
        workspaceId
    );
    res.json({ ok: true, data: { period, ...r[0] } });
    return;
}

case 'create_cashbook_entry': {
    const accountId = typeof args.account_id === 'string' ? args.account_id : '';
    const type = typeof args.type === 'string' ? args.type : '';
    const amount = typeof args.amount === 'number' ? args.amount : 0;
    if (!accountId || !['INCOME', 'EXPENSE', 'TRANSFER'].includes(type) || amount <= 0) {
        res.status(400).json({ ok: false, error: { code: 'INVALID_PARAMS' } });
        return;
    }
    const code = `CT-${Date.now()}`;
    const description = typeof args.description === 'string' ? args.description : null;
    const categoryId = typeof args.category_id === 'string' ? args.category_id : null;
    const r = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO cash_transactions (workspace_id, account_id, category_id, code, type, amount, description, created_by_user_id, transaction_date, created_at)
         VALUES ($1, $2, $3, $4, $5::"CashTransactionType", $6, $7, $8, now(), now())
         RETURNING id, code, type, amount, transaction_date`,
        workspaceId, accountId, categoryId, code, type, amount, description, hermesUserId
    );
    res.json({ ok: true, data: r[0] });
    return;
}

case 'list_debts': {
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 50;
    const items = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, person_id, status, total, paid_amount, debt_amount, issued_at, created_at
         FROM invoices WHERE workspace_id = $1 AND debt_amount > 0 AND status != 'VOID'
         ORDER BY debt_amount DESC LIMIT $2`,
        workspaceId, limit
    );
    const totalDebt = items.reduce((s, x) => s + Number(x.debt_amount || 0), 0);
    res.json({ ok: true, data: { items, total: items.length, total_debt: totalDebt } });
    return;
}

case 'collect_debt': {
    const invoiceId = typeof args.invoice_id === 'string' ? args.invoice_id : '';
    const method = typeof args.method === 'string' ? args.method : '';
    const amount = typeof args.amount === 'number' ? args.amount : 0;
    if (!invoiceId || !method || amount <= 0) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
        return;
    }
    const inv = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, debt_amount, paid_amount, total FROM invoices WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        invoiceId, workspaceId
    );
    if (!inv.length) {
        res.status(404).json({ ok: false, error: { code: 'INVOICE_NOT_FOUND' } });
        return;
    }
    await db_1.prisma.$executeRawUnsafe(
        `INSERT INTO payments (workspace_id, invoice_id, method, amount, paid_at, created_by_user_id)
         VALUES ($1, $2, $3::"PaymentMethod", $4::bigint, now(), $5)`,
        workspaceId, invoiceId, method, amount, hermesUserId
    );
    const newPaid = Number(inv[0].paid_amount) + amount;
    const newDebt = Math.max(0, Number(inv[0].total) - newPaid);
    await db_1.prisma.$executeRawUnsafe(
        `UPDATE invoices SET paid_amount = $1::bigint, debt_amount = $2::bigint WHERE id = $3`,
        newPaid, newDebt, invoiceId
    );
    res.json({ ok: true, data: { invoice_id: invoiceId, collected: amount, paid_amount: newPaid, debt_amount: newDebt } });
    return;
}

case 'list_service_cards': {
    const status = typeof args.status === 'string' ? args.status : 'ACTIVE';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 50;
    const params = [workspaceId];
    let sql = `SELECT id, person_id, name, type, total_sessions, used_sessions, total_amount, used_amount, status, expires_at, created_at
               FROM packages WHERE workspace_id = $1`;
    if (status !== 'ALL') {
        params.push(status);
        sql += ` AND status = $${params.length}::"PackageStatus"`;
    }
    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'deposit_card': {
    const personId = typeof args.person_id === 'string' ? args.person_id : '';
    const amount = typeof args.amount === 'number' ? args.amount : 0;
    const name = typeof args.name === 'string' ? args.name : 'Thẻ tiền';
    if (!personId || amount <= 0) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
        return;
    }
    const r = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO packages (workspace_id, person_id, name, type, total_sessions, used_sessions, total_amount, used_amount, status, created_by_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, 'PREPAID', 0, 0, $4::bigint, 0, 'ACTIVE', $5, now(), now())
         RETURNING id, name, total_amount, status, created_at`,
        workspaceId, personId, name, amount, hermesUserId
    );
    res.json({ ok: true, data: r[0] });
    return;
}

case 'list_input_invoices': {
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 50;
    const items = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, supplier_id, invoice_date, invoice_number, subtotal, tax_amount, total, payment_status, paid_amount, created_at
         FROM input_invoices WHERE workspace_id = $1 ORDER BY invoice_date DESC LIMIT $2`,
        workspaceId, limit
    );
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'manage_payment_methods': {
    const action = typeof args.action === 'string' ? args.action : '';
    if (action === 'list') {
        const items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, name, type, account_number, account_holder, balance, is_active, is_default
             FROM bank_accounts WHERE workspace_id = $1 AND is_active = true ORDER BY is_default DESC, name`,
            workspaceId
        );
        res.json({ ok: true, data: { items, total: items.length } });
        return;
    }
    if (action === 'create') {
        const name = typeof args.name === 'string' ? args.name : '';
        const type = typeof args.type === 'string' ? args.type : 'BANK';
        if (!name) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_NAME' } });
            return;
        }
        const r = await db_1.prisma.$queryRawUnsafe(
            `INSERT INTO bank_accounts (workspace_id, name, type, account_number, account_holder, balance, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, 0, true, now(), now())
             RETURNING id, name, type`,
            workspaceId, name, type, args.account_number || null, args.account_holder || null
        );
        res.json({ ok: true, data: r[0] });
        return;
    }
    res.status(400).json({ ok: false, error: { code: 'INVALID_ACTION' } });
    return;
}

case 'manage_finance_categories': {
    const action = typeof args.action === 'string' ? args.action : '';
    if (action === 'list') {
        const items = await db_1.prisma.$queryRawUnsafe(
            `SELECT id, name, type, is_system, created_at
             FROM transaction_categories WHERE workspace_id = $1 ORDER BY type, name`,
            workspaceId
        );
        res.json({ ok: true, data: { items, total: items.length } });
        return;
    }
    if (action === 'create') {
        const name = typeof args.name === 'string' ? args.name : '';
        const type = typeof args.type === 'string' ? args.type : '';
        if (!name || !['INCOME', 'EXPENSE'].includes(type)) {
            res.status(400).json({ ok: false, error: { code: 'INVALID_PARAMS' } });
            return;
        }
        const r = await db_1.prisma.$queryRawUnsafe(
            `INSERT INTO transaction_categories (workspace_id, name, type, is_system, created_at)
             VALUES ($1, $2, $3, false, now()) RETURNING id, name, type`,
            workspaceId, name, type
        );
        res.json({ ok: true, data: r[0] });
        return;
    }
    if (action === 'delete') {
        const categoryId = typeof args.category_id === 'string' ? args.category_id : '';
        if (!categoryId) {
            res.status(400).json({ ok: false, error: { code: 'MISSING_CATEGORY_ID' } });
            return;
        }
        const result = await db_1.prisma.$executeRawUnsafe(
            `DELETE FROM transaction_categories WHERE id = $1 AND workspace_id = $2 AND is_system = false`,
            categoryId, workspaceId
        );
        res.json({ ok: true, data: { deleted: result > 0, category_id: categoryId } });
        return;
    }
    res.status(400).json({ ok: false, error: { code: 'INVALID_ACTION' } });
    return;
}

