# Handler Proposal — POS module 6 skills

File này đề xuất code cần thêm vào `agent-tools-hermes.js` (bind-mount tại `/opt/crm/agent-tools-hermes.js` trên VPS prod) để 6 skill POS chạy được.

## Quy ước
- Tất cả handler nằm trong 1 file CommonJS, export default `dispatchSkill(skillName, body, ctx)`
- `ctx` = `{ workspaceId, userId, branchId, prisma }` đã resolve bởi middleware từ headers `X-User-Id` + `X-Group-Id`
- Tất cả handler chạy trong `prisma.$transaction` để đảm bảo atomic
- Trả về `{ ok: true, data }` hoặc throw `SkillError(code, message, details)` (middleware tự convert thành response)

## Switch-case bổ sung

```js
// agent-tools-hermes.js — thêm vào switch chính
case 'pos_create_invoice':
  return await handlePosCreateInvoice(body, ctx);
case 'pos_add_payment':
  return await handlePosAddPayment(body, ctx);
case 'list_invoices':
  return await handleListInvoices(body, ctx);
case 'view_invoice':
  return await handleViewInvoice(body, ctx);
case 'pos_complete_appointment':
  return await handlePosCompleteAppointment(body, ctx);
case 'apply_voucher_to_invoice':
  return await handleApplyVoucherToInvoice(body, ctx);
```

---

## 1. `handlePosCreateInvoice`

```js
async function handlePosCreateInvoice(body, ctx) {
  const { person_id, branch_id, appointment_id, items, discount = 0,
          voucher_code, note, status = 'ISSUED' } = body;
  const { workspaceId, userId, prisma } = ctx;

  if (!person_id) throw new SkillError('PERSON_REQUIRED');
  if (!Array.isArray(items) || items.length === 0) throw new SkillError('ITEMS_REQUIRED');

  return await prisma.$transaction(async (tx) => {
    // 1. Validate person
    const person = await tx.person.findFirst({ where: { id: person_id, workspaceId } });
    if (!person) throw new SkillError('PERSON_NOT_FOUND');

    // 2. Validate appointment if present
    if (appointment_id) {
      const apt = await tx.appointment.findFirst({ where: { id: appointment_id, workspaceId } });
      if (!apt) throw new SkillError('APPOINTMENT_NOT_FOUND');
      const exists = await tx.invoice.findFirst({ where: { appointmentId: appointment_id } });
      if (exists) throw new SkillError('APPOINTMENT_ALREADY_INVOICED');
    }

    // 3. Build items + tính subtotal
    let subtotal = 0n;
    const itemsToInsert = [];
    const stockToDeduct = [];
    for (const it of items) {
      const amount = BigInt(it.amount ?? Math.round(it.qty * it.unit_price));
      subtotal += amount;
      itemsToInsert.push({
        workspaceId,
        kind: it.kind,
        refId: it.ref_id ?? null,
        nameSnapshot: it.name_snapshot ?? '',
        qty: it.qty,
        unitPrice: BigInt(Math.round(it.unit_price)),
        amount,
        staffId: it.staff_id ?? null,
      });
      if (it.kind === 'PRODUCT' && it.ref_id) {
        stockToDeduct.push({ productId: it.ref_id, qty: it.qty });
      }
    }

    // 4. Apply voucher
    let finalDiscount = BigInt(Math.round(discount));
    let voucherRedemption = null;
    if (voucher_code) {
      const v = await validateVoucher(tx, voucher_code, person_id, subtotal, workspaceId);
      finalDiscount += v.discountAmount;
      voucherRedemption = v.redemption;
    }
    const total = subtotal - finalDiscount;

    // 5. Check stock
    for (const s of stockToDeduct) {
      const stock = await tx.productStock.findFirst({ where: { productId: s.productId, workspaceId } });
      if (!stock || stock.quantity < s.qty) {
        throw new SkillError('STOCK_INSUFFICIENT', `Sản phẩm thiếu ${s.qty} đv`, { productId: s.productId });
      }
    }

    // 6. Create invoice
    const invoice = await tx.invoice.create({
      data: {
        workspaceId,
        personId: person_id,
        appointmentId: appointment_id ?? null,
        branchId: branch_id ?? ctx.branchId ?? null,
        status,
        subtotal,
        discount: finalDiscount,
        total,
        paidAmount: 0n,
        debtAmount: total,
        issuedAt: status === 'ISSUED' ? new Date() : null,
        note: note ?? null,
        createdByUserId: userId,
        items: { create: itemsToInsert },
      },
      include: { items: true },
    });

    // 7. Deduct stock
    for (const s of stockToDeduct) {
      await tx.productStock.update({
        where: { productId_workspaceId: { productId: s.productId, workspaceId } },
        data: { quantity: { decrement: s.qty } },
      });
      await tx.stockMovement.create({
        data: {
          workspaceId, productId: s.productId, qty: -s.qty,
          reason: 'INVOICE_SALE', refId: invoice.id, createdByUserId: userId,
        },
      });
    }

    // 8. Commission entries
    for (const item of invoice.items) {
      if (item.staffId && item.kind === 'SERVICE') {
        const svc = await tx.service.findUnique({ where: { id: item.refId } });
        if (svc?.commissionRate > 0) {
          await tx.commissionEntry.create({
            data: {
              workspaceId, invoiceId: invoice.id, invoiceItemId: item.id,
              staffId: item.staffId, baseAmount: item.amount,
              rate: svc.commissionRate,
              amount: BigInt(Math.round(Number(item.amount) * svc.commissionRate)),
              status: 'PENDING',
            },
          });
        }
      }
    }

    // 9. Voucher redemption
    if (voucherRedemption) {
      await tx.voucherRedemption.create({ data: { ...voucherRedemption, invoiceId: invoice.id } });
    }

    // 10. Audit
    await audit(tx, { workspaceId, userId, action: 'pos.invoice.created', resourceId: invoice.id });

    return { ok: true, data: serializeInvoice(invoice, { voucher_applied: voucher_code }) };
  });
}
```

## 2. `handlePosAddPayment`

```js
async function handlePosAddPayment(body, ctx) {
  const { invoice_id, method, amount, card_id, deposit_id, loyalty_points,
          paid_at, note } = body;
  const { workspaceId, userId, prisma } = ctx;

  if (!invoice_id || !method || !amount) throw new SkillError('REQUIRED_FIELDS_MISSING');

  return await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findFirst({ where: { id: invoice_id, workspaceId } });
    if (!inv) throw new SkillError('INVOICE_NOT_FOUND');
    if (inv.status === 'VOID') throw new SkillError('INVOICE_VOID');
    if (inv.status === 'PAID') throw new SkillError('INVOICE_ALREADY_PAID');

    const amt = BigInt(Math.round(amount));
    if (amt > inv.debtAmount) throw new SkillError('AMOUNT_EXCEED_DEBT');

    // Method-specific deduction
    if (method === 'SERVICE_CARD') {
      if (!card_id) throw new SkillError('CARD_ID_REQUIRED');
      const card = await tx.serviceCard.findFirst({ where: { id: card_id, workspaceId, personId: inv.personId } });
      if (!card) throw new SkillError('CARD_NOT_FOUND');
      if (card.expiresAt && card.expiresAt < new Date()) throw new SkillError('CARD_EXPIRED');
      if (card.remaining < amt) throw new SkillError('CARD_INSUFFICIENT');
      await tx.serviceCard.update({
        where: { id: card_id },
        data: { remaining: { decrement: amt } },
      });
      await tx.cardMovement.create({
        data: { cardId: card_id, workspaceId, amount: -amt, reason: 'PAYMENT', refId: invoice_id, createdByUserId: userId },
      });
    } else if (method === 'DEPOSIT') {
      if (!deposit_id) throw new SkillError('DEPOSIT_ID_REQUIRED');
      const dep = await tx.deposit.findFirst({ where: { id: deposit_id, workspaceId, personId: inv.personId } });
      if (!dep) throw new SkillError('DEPOSIT_NOT_FOUND');
      if (dep.balance < amt) throw new SkillError('DEPOSIT_INSUFFICIENT');
      await tx.deposit.update({ where: { id: deposit_id }, data: { balance: { decrement: amt } } });
      await tx.depositMovement.create({
        data: { depositId: deposit_id, workspaceId, amount: -amt, reason: 'PAYMENT', refId: invoice_id, createdByUserId: userId },
      });
    } else if (method === 'LOYALTY_POINTS') {
      if (!loyalty_points) throw new SkillError('LOYALTY_POINTS_REQUIRED');
      const ws = await tx.workspaceSettings.findUnique({ where: { workspaceId } });
      const ratio = ws?.loyaltyPointToVnd ?? 0;
      if (ratio === 0) throw new SkillError('POINTS_RATIO_NOT_CONFIGURED');
      const expectedAmt = BigInt(loyalty_points * ratio);
      if (expectedAmt !== amt) throw new SkillError('POINTS_AMOUNT_MISMATCH');
      const lp = await tx.loyaltyAccount.findFirst({ where: { personId: inv.personId, workspaceId } });
      if (!lp || lp.points < loyalty_points) throw new SkillError('POINTS_INSUFFICIENT');
      await tx.loyaltyAccount.update({
        where: { id: lp.id },
        data: { points: { decrement: loyalty_points } },
      });
      await tx.loyaltyHistory.create({
        data: {
          workspaceId, accountId: lp.id, action: 'REDEEM',
          points: -loyalty_points, reason: `Invoice ${invoice_id}`,
          refId: invoice_id, createdByUserId: userId,
        },
      });
    }

    // Insert payment
    const payment = await tx.payment.create({
      data: {
        workspaceId, invoiceId: invoice_id, method, amount: amt,
        paidAt: paid_at ? new Date(paid_at) : new Date(),
        note: note ?? null, createdByUserId: userId,
      },
    });

    // Update invoice
    const newPaid = inv.paidAmount + amt;
    const newDebt = inv.total - newPaid;
    const newStatus = newDebt === 0n ? 'PAID' : 'PARTIAL';
    await tx.invoice.update({
      where: { id: invoice_id },
      data: { paidAmount: newPaid, debtAmount: newDebt, status: newStatus },
    });

    // Settle commissions when fully paid
    if (newStatus === 'PAID') {
      await tx.commissionEntry.updateMany({
        where: { invoiceId: invoice_id, status: 'PENDING' },
        data: { status: 'APPROVED', approvedAt: new Date() },
      });
    }

    // Card balance for return
    let cardRemaining = null;
    if (method === 'SERVICE_CARD') {
      const after = await tx.serviceCard.findUnique({ where: { id: card_id } });
      cardRemaining = Number(after.remaining);
    }

    await audit(tx, { workspaceId, userId, action: 'pos.payment.created', resourceId: payment.id });

    return {
      ok: true,
      data: {
        payment_id: payment.id,
        invoice_id,
        method,
        amount: Number(amt),
        paid_at: payment.paidAt,
        invoice_status_after: newStatus,
        invoice_paid_amount: Number(newPaid),
        invoice_debt_amount: Number(newDebt),
        card_remaining_after: cardRemaining,
      },
    };
  });
}
```

## 3. `handleListInvoices` (read-only — không cần transaction)

```js
async function handleListInvoices(body, ctx) {
  const { person_id, branch_id, status = 'ALL', from_date, to_date, period,
          min_total, max_total, has_debt, limit = 30, include_summary = true } = body;
  const { workspaceId, prisma } = ctx;

  const where = { workspaceId };
  if (person_id) where.personId = person_id;
  if (branch_id) where.branchId = branch_id;
  if (status !== 'ALL') where.status = status;
  if (has_debt) where.debtAmount = { gt: 0n };
  if (min_total) where.total = { ...where.total, gte: BigInt(min_total) };
  if (max_total) where.total = { ...where.total, lte: BigInt(max_total) };

  const range = resolveDateRange({ period, from_date, to_date });
  if (range) where.issuedAt = { gte: range.from, lte: range.to };

  const items = await prisma.invoice.findMany({
    where, take: limit, orderBy: { issuedAt: 'desc' },
    include: { person: { select: { fullName: true, phone: true } }, branches: { select: { name: true } } },
  });

  let summary = null;
  if (include_summary) {
    const grouped = await prisma.invoice.groupBy({
      by: ['status'], where, _count: true, _sum: { total: true, paidAmount: true, debtAmount: true },
    });
    summary = {
      total_count: grouped.reduce((a, g) => a + g._count, 0),
      total_amount: Number(grouped.reduce((a, g) => a + (g._sum.total ?? 0n), 0n)),
      total_paid: Number(grouped.reduce((a, g) => a + (g._sum.paidAmount ?? 0n), 0n)),
      total_debt: Number(grouped.reduce((a, g) => a + (g._sum.debtAmount ?? 0n), 0n)),
      by_status: Object.fromEntries(grouped.map(g => [g.status, g._count])),
    };
  }

  return { ok: true, data: { items: items.map(serializeInvoice), summary } };
}
```

## 4. `handleViewInvoice` (read-only)

```js
async function handleViewInvoice(body, ctx) {
  const { invoice_id, include = ['items', 'payments', 'voucher', 'appointment'] } = body;
  const { workspaceId, prisma } = ctx;

  const inv = await prisma.invoice.findFirst({
    where: { id: invoice_id, workspaceId },
    include: {
      person: { select: { id: true, fullName: true, phone: true } },
      branches: { select: { id: true, name: true } },
      items: include.includes('items') ? { include: { staff: { select: { id: true, fullName: true } } } } : false,
      payments: include.includes('payments') ? { orderBy: { paidAt: 'asc' } } : false,
      commissionEntries: include.includes('commissions') ? { include: { staff: { select: { id: true, fullName: true } } } } : false,
    },
  });
  if (!inv) throw new SkillError('INVOICE_NOT_FOUND');

  const data = serializeInvoice(inv);
  if (include.includes('voucher')) {
    const vr = await prisma.voucherRedemption.findFirst({ where: { invoiceId: invoice_id } });
    data.voucher = vr ? { code: vr.code, discount_amount: Number(vr.discountAmount) } : null;
  }
  if (include.includes('appointment') && inv.appointmentId) {
    data.appointment = await prisma.appointment.findUnique({ where: { id: inv.appointmentId } });
  }
  return { ok: true, data };
}
```

## 5. `handlePosCompleteAppointment`

```js
async function handlePosCompleteAppointment(body, ctx) {
  const { appointment_id, extra_items = [], discount = 0, voucher_code, payment, note } = body;
  const { workspaceId, prisma } = ctx;

  return await prisma.$transaction(async (tx) => {
    const apt = await tx.appointment.findFirst({
      where: { id: appointment_id, workspaceId },
      include: { services: { include: { service: true } } },
    });
    if (!apt) throw new SkillError('APPOINTMENT_NOT_FOUND');
    if (apt.status === 'COMPLETED') throw new SkillError('APPOINTMENT_ALREADY_COMPLETED');
    if (apt.status === 'CANCELLED') throw new SkillError('APPOINTMENT_CANCELLED');

    const existInv = await tx.invoice.findFirst({ where: { appointmentId: appointment_id } });
    if (existInv) throw new SkillError('APPOINTMENT_ALREADY_INVOICED');

    // Convert appointment services -> items
    const aptItems = apt.services.map(s => ({
      kind: 'SERVICE',
      ref_id: s.serviceId,
      name_snapshot: s.service.name,
      qty: 1,
      unit_price: Number(s.service.price),
      staff_id: apt.staffId,
    }));
    const allItems = [...aptItems, ...extra_items];

    // Reuse pos_create_invoice logic (refactor to inner fn)
    const invoiceData = await _createInvoiceInner(tx, {
      person_id: apt.personId, branch_id: apt.branchId, appointment_id,
      items: allItems, discount, voucher_code, note, status: 'ISSUED',
    }, ctx);

    // Update appointment
    await tx.appointment.update({
      where: { id: appointment_id },
      data: { status: 'COMPLETED' },
    });

    // Optional payment
    let paymentId = null;
    if (payment) {
      const result = await _addPaymentInner(tx, { invoice_id: invoiceData.id, ...payment }, ctx);
      paymentId = result.payment_id;
    }

    return {
      ok: true,
      data: {
        appointment_id,
        appointment_status: 'COMPLETED',
        invoice: invoiceData,
        payment_id: paymentId,
      },
    };
  });
}
```

## 6. `handleApplyVoucherToInvoice`

```js
async function handleApplyVoucherToInvoice(body, ctx) {
  const { invoice_id, voucher_code, force = false } = body;
  const { workspaceId, userId, prisma } = ctx;

  return await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findFirst({ where: { id: invoice_id, workspaceId } });
    if (!inv) throw new SkillError('INVOICE_NOT_FOUND');
    if (inv.status === 'PAID' && !force) throw new SkillError('INVOICE_PAID');
    if (inv.status === 'VOID') throw new SkillError('INVOICE_VOID');

    const existing = await tx.voucherRedemption.findFirst({ where: { invoiceId: invoice_id } });
    if (existing && !force) throw new SkillError('INVOICE_ALREADY_HAS_VOUCHER');

    const v = await validateVoucher(tx, voucher_code, inv.personId, inv.subtotal, workspaceId);

    if (existing && force) {
      await tx.voucherRedemption.delete({ where: { id: existing.id } });
    }
    await tx.voucherRedemption.create({ data: { ...v.redemption, invoiceId: invoice_id } });

    const newTotal = inv.subtotal - v.discountAmount;
    const newDebt = newTotal - inv.paidAmount;
    await tx.invoice.update({
      where: { id: invoice_id },
      data: { discount: v.discountAmount, total: newTotal, debtAmount: newDebt },
    });

    await audit(tx, { workspaceId, userId, action: 'pos.voucher.applied', resourceId: invoice_id });

    return {
      ok: true,
      data: {
        invoice_id,
        voucher_code,
        old_discount: Number(inv.discount),
        new_discount: Number(v.discountAmount),
        old_total: Number(inv.total),
        new_total: Number(newTotal),
        new_debt_amount: Number(newDebt),
      },
    };
  });
}
```

---

## Helpers cần có sẵn (hoặc thêm vào file)

```js
// SkillError class
class SkillError extends Error {
  constructor(code, message, details) {
    super(message ?? code);
    this.code = code;
    this.details = details;
  }
}

// validateVoucher — reuse từ customers/manage_vouchers.action=apply
async function validateVoucher(tx, code, personId, orderValue, workspaceId) { /* ... */ }

// resolveDateRange — convert period (today/week/month) → { from, to }
function resolveDateRange({ period, from_date, to_date }) { /* ... */ }

// serializeInvoice — convert BigInt → Number, format response
function serializeInvoice(inv, extra = {}) { /* ... */ }

// audit
async function audit(tx, { workspaceId, userId, action, resourceId, details }) {
  await tx.auditLog.create({
    data: { workspaceId, actorUserId: userId, action, resourceId, details: details ?? {}, createdAt: new Date() },
  });
}

// Inner helpers (refactor để pos_complete_appointment dùng được)
async function _createInvoiceInner(tx, body, ctx) { /* logic giống pos_create_invoice */ }
async function _addPaymentInner(tx, body, ctx) { /* logic giống pos_add_payment */ }
```

---

## Schema bổ sung cần kiểm tra

Một số bảng/field reference trên có thể chưa có trong schema hiện tại, cần check:

| Bảng/Field | Trong schema chưa? |
|---|---|
| `Invoice.code` (auto-generate INV-YYYY-MM-XXXX) | ❓ Không thấy field `code` ở model Invoice — cần thêm hoặc bỏ |
| `Invoice.appointmentId` (unique) | ✅ Có (line 652 schema) |
| `ServiceCard.remaining` / `expiresAt` | ❓ Cần verify |
| `Deposit` model | ❓ Cần verify (có thể chưa có) |
| `LoyaltyAccount` / `LoyaltyHistory` | ❓ Cần verify |
| `WorkspaceSettings.loyaltyPointToVnd` | ❓ Cần thêm config |
| `VoucherRedemption.invoiceId` | ❓ Cần verify |
| `CommissionEntry` (đã thấy ở Invoice relation) | ✅ Có |
| `PaymentMethod` enum bao gồm `SERVICE_CARD` / `DEPOSIT` / `LOYALTY_POINTS` | ❓ Cần check enum |

→ Trước khi deploy handler, em sẽ:
1. Pull schema thật từ VPS prod (`docker exec appcrm-api cat /app/prisma/schema.prisma`)
2. Chạy diff với plan này
3. Thêm migration cho field/enum thiếu (cẩn trọng — DB shared, theo runbook `ref_vps_spaclaw_main_runbook`)

---

## Quy trình deploy 6 skill này

Theo memory `ref_hermes_crm_skill_workflow`:

1. **Em (CRM AI)**: ✅ tạo `_index.json` + 6 `.md` ở local + repo (đã xong)
2. **Em**: pull `agent-tools-hermes.js` từ VPS prod (`scp` về), patch thêm 6 case + helpers
3. **Em**: scp lại lên VPS thay file bind-mount → `docker restart appcrm-api`
4. **Hub AI**: deploy `_index.json` canonical lên đăng ký skill ở Hub
5. **Em**: smoke test bằng curl với `X-Internal-Secret` header

⚠️ Không skip prune, không xài `--no-deps` sai chỗ — theo `feedback_appcrm_deploy_quirks`.

⚠️ Tier enum NORMAL/VIP, cast `$N::text::"CustomerTier"` nếu raw query (memory `bug_crm_skill_drift_prod_source_20260506`).
