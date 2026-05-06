// Module: pos (10 cases)

case 'pos_create_invoice': {
    const personId = typeof args.person_id === 'string' ? args.person_id : '';
    const items = Array.isArray(args.items) ? args.items.slice(0, 50) : [];
    if (!personId || items.length === 0) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
        return;
    }
    let subtotal = 0;
    for (const it of items) subtotal += (it.qty || 1) * (it.unit_price || 0);
    const discount = typeof args.discount === 'number' ? args.discount : 0;
    const total = Math.max(0, subtotal - discount);
    const status = (args.status === 'DRAFT' || args.status === 'ISSUED') ? args.status : 'ISSUED';
    const r = await db_1.prisma.$queryRawUnsafe(
        `INSERT INTO invoices (workspace_id, person_id, status, subtotal, discount, total, debt_amount, issued_at, created_by_user_id, created_at)
         VALUES ($1, $2, $3::"InvoiceStatus", $4::bigint, $5::bigint, $6::bigint, $6::bigint, ${status === 'ISSUED' ? 'now()' : 'NULL'}, $7, now())
         RETURNING id, status, subtotal, total`,
        workspaceId, personId, status, subtotal, discount, total, hermesUserId
    );
    res.json({ ok: true, data: { ...r[0], items_count: items.length } });
    return;
}

case 'pos_add_payment': {
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
    const newDebt = Number(inv[0].total) - newPaid;
    await db_1.prisma.$executeRawUnsafe(
        `UPDATE invoices SET paid_amount = $1::bigint, debt_amount = $2::bigint WHERE id = $3`,
        newPaid, newDebt, invoiceId
    );
    res.json({ ok: true, data: { invoice_id: invoiceId, paid_amount: newPaid, debt_amount: newDebt, payment_added: amount } });
    return;
}

case 'list_invoices': {
    const status = typeof args.status === 'string' ? args.status : 'ALL';
    const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 30;
    const params = [workspaceId];
    let sql = `SELECT id, person_id, status, subtotal, total, paid_amount, debt_amount, issued_at, created_at FROM invoices WHERE workspace_id = $1`;
    if (status !== 'ALL') {
        params.push(status);
        sql += ` AND status = $${params.length}::"InvoiceStatus"`;
    }
    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    const items = await db_1.prisma.$queryRawUnsafe(sql, ...params);
    res.json({ ok: true, data: { items, total: items.length } });
    return;
}

case 'view_invoice': {
    const invoiceId = typeof args.invoice_id === 'string' ? args.invoice_id : '';
    if (!invoiceId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_INVOICE_ID' } });
        return;
    }
    const inv = await db_1.prisma.$queryRawUnsafe(
        `SELECT * FROM invoices WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        invoiceId, workspaceId
    );
    if (!inv.length) {
        res.status(404).json({ ok: false, error: { code: 'INVOICE_NOT_FOUND' } });
        return;
    }
    const items = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, kind, ref_id, name_snapshot, qty, unit_price, amount, staff_id FROM invoice_items WHERE invoice_id = $1`,
        invoiceId
    );
    const payments = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, method, amount, paid_at FROM payments WHERE invoice_id = $1 ORDER BY paid_at`,
        invoiceId
    );
    res.json({ ok: true, data: { ...inv[0], items, payments } });
    return;
}

case 'pos_complete_appointment': {
    const appointmentId = typeof args.appointment_id === 'string' ? args.appointment_id : '';
    if (!appointmentId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_APPOINTMENT_ID' } });
        return;
    }
    const apt = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, person_id, status FROM appointments WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        appointmentId, workspaceId
    );
    if (!apt.length) {
        res.status(404).json({ ok: false, error: { code: 'APPOINTMENT_NOT_FOUND' } });
        return;
    }
    if (apt[0].status === 'COMPLETED') {
        res.json({ ok: true, data: { appointment_id: appointmentId, status: 'COMPLETED', already: true } });
        return;
    }
    await db_1.prisma.$executeRawUnsafe(
        `UPDATE appointments SET status = 'COMPLETED', updated_at = now() WHERE id = $1`,
        appointmentId
    );
    res.json({ ok: true, data: { appointment_id: appointmentId, status: 'COMPLETED' } });
    return;
}

case 'apply_voucher_to_invoice': {
    const invoiceId = typeof args.invoice_id === 'string' ? args.invoice_id : '';
    const voucherCode = typeof args.voucher_code === 'string' ? args.voucher_code : '';
    if (!invoiceId || !voucherCode) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
        return;
    }
    const v = await db_1.prisma.$queryRawUnsafe(
        `SELECT id, code, discount_amount, status FROM voucher_redemptions WHERE code = $1 LIMIT 1`,
        voucherCode
    );
    if (!v.length) {
        res.status(404).json({ ok: false, error: { code: 'VOUCHER_NOT_FOUND' } });
        return;
    }
    if (v[0].status !== 'ISSUED') {
        res.status(400).json({ ok: false, error: { code: 'VOUCHER_NOT_USABLE', status: v[0].status } });
        return;
    }
    res.json({ ok: true, data: { invoice_id: invoiceId, voucher_code: voucherCode, discount: v[0].discount_amount, applied: true } });
    return;
}

case 'update_invoice': {
    const invoiceId = typeof args.invoice_id === 'string' ? args.invoice_id : '';
    if (!invoiceId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_INVOICE_ID' } });
        return;
    }
    const sets = [];
    const params = [];
    if (typeof args.note === 'string') { params.push(args.note); sets.push(`note = $${params.length}`); }
    if (typeof args.discount === 'number') { params.push(args.discount); sets.push(`discount = $${params.length}::bigint`); }
    if (sets.length === 0) {
        res.status(400).json({ ok: false, error: { code: 'NO_FIELDS' } });
        return;
    }
    params.push(invoiceId);
    params.push(workspaceId);
    const result = await db_1.prisma.$queryRawUnsafe(
        `UPDATE invoices SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length - 1} AND workspace_id = $${params.length} RETURNING id, total, debt_amount`,
        ...params
    );
    if (!result.length) {
        res.status(404).json({ ok: false, error: { code: 'INVOICE_NOT_FOUND' } });
        return;
    }
    res.json({ ok: true, data: result[0] });
    return;
}

case 'void_invoice': {
    const invoiceId = typeof args.invoice_id === 'string' ? args.invoice_id : '';
    const reason = typeof args.reason === 'string' ? args.reason : 'no_reason';
    if (!invoiceId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_INVOICE_ID' } });
        return;
    }
    const result = await db_1.prisma.$executeRawUnsafe(
        `UPDATE invoices SET status = 'VOID', note = COALESCE(note,'') || ' | VOID: ' || $1::text WHERE id = $2 AND workspace_id = $3`,
        reason, invoiceId, workspaceId
    );
    console.log(`[pos] void invoice=${invoiceId} ws=${workspaceId} user=${hermesUserId} reason=${reason}`);
    res.json({ ok: true, data: { voided: result > 0, invoice_id: invoiceId, reason } });
    return;
}

case 'print_invoice': {
    const invoiceId = typeof args.invoice_id === 'string' ? args.invoice_id : '';
    const format = typeof args.format === 'string' ? args.format : 'pdf';
    if (!invoiceId) {
        res.status(400).json({ ok: false, error: { code: 'MISSING_INVOICE_ID' } });
        return;
    }
    res.json({ ok: true, data: { invoice_id: invoiceId, format, file_url: `https://crm.spaclaw.pro/api/invoices/${invoiceId}/print?format=${format}` } });
    return;
}

case 'dashboard_overview': {
    const period = typeof args.period === 'string' ? args.period : 'today';
    let intervalSql = `interval '1 day'`;
    if (period === 'week') intervalSql = `interval '7 days'`;
    else if (period === 'month') intervalSql = `interval '30 days'`;
    const revenue = await db_1.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(total),0)::bigint AS revenue, COUNT(*)::int AS invoice_count FROM invoices WHERE workspace_id = $1 AND created_at > now() - ${intervalSql} AND status != 'VOID'`,
        workspaceId
    );
    const debt = await db_1.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(debt_amount),0)::bigint AS total_debt FROM invoices WHERE workspace_id = $1 AND debt_amount > 0`,
        workspaceId
    );
    const apt = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS today_count FROM appointments WHERE workspace_id = $1 AND DATE(start_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE`,
        workspaceId
    );
    const newCust = await db_1.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS new_count FROM people WHERE workspace_id = $1 AND created_at > now() - ${intervalSql}`,
        workspaceId
    );
    res.json({ ok: true, data: { period, revenue: revenue[0], debt: debt[0], appointments: apt[0], new_customers: newCust[0] } });
    return;
}
