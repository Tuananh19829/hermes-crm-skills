// ============================================================
// PATCH cho appcrm-api:/app/dist/modules/agent-tools/routes.js
// (host bind-mount: /opt/crm/agent-tools-hermes.js)
// ============================================================
// Module: customer_groups
// 7 handler stubs sẵn sàng paste vào dispatcher switch-case.
// Yêu cầu DB: bảng `customer_groups` + `customer_group_members` (đã có ở migrations.sql)
// ============================================================
//
// CÁCH ÁP DỤNG:
// 1. SSH vào VPS spaclaw-main
// 2. Pull file hiện tại:
//    docker exec appcrm-api cat /app/dist/modules/agent-tools/routes.js > /tmp/routes-current.js
// 3. Mở /opt/crm/agent-tools-hermes.js, tìm switch (skillName) {...}
// 4. Paste 7 case dưới đây vào switch
// 5. Paste 7 helper async function bên dưới module export
// 6. docker restart appcrm-api
// 7. Smoke test:
//    curl -X POST https://crm.spaclaw.pro/internal/skills/list_group_members \
//      -H "X-Internal-Secret: $CRM_INTERNAL_SECRET" \
//      -H "X-User-Id: <user>" -H "X-Group-Id: <ws>" \
//      -H "Content-Type: application/json" \
//      -d '{"group_id":"<uuid>"}'
//
// ============================================================

// ============= 1. SWITCH-CASE BLOCK =============
// Paste vào switch (skillName) { ... }

case 'get_customer_group_detail': {
  const { group_id } = body;
  if (!group_id) return res.status(400).json({ ok: false, error: { code: 'MISSING_PARAM', message: 'group_id required' } });
  const grp = await prisma.$queryRawUnsafe(`
    SELECT id, name, description, criteria, color, created_at
    FROM customer_groups WHERE id = $1::uuid AND workspace_id = $2 LIMIT 1
  `, group_id, workspaceId);
  if (!grp.length) return res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND' } });
  const members = await prisma.$queryRawUnsafe(`
    SELECT m.customer_id, m.role, m.added_at, p.full_name, p.phone
    FROM customer_group_members m
    LEFT JOIN people p ON p.id = m.customer_id
    WHERE m.group_id = $1::uuid
    ORDER BY m.added_at DESC LIMIT 50
  `, group_id);
  const stats = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE role='VIP')::int AS vip_count
    FROM customer_group_members WHERE group_id = $1::uuid
  `, group_id);
  return res.json({ ok: true, data: { ...grp[0], members, stats: stats[0] } });
}

case 'create_customer_group': {
  const { name, description, criteria = {}, auto_assign = false, color = '#6b7280' } = body;
  if (!name) return res.status(400).json({ ok: false, error: { code: 'MISSING_NAME' } });
  const result = await prisma.$queryRawUnsafe(`
    INSERT INTO customer_groups (workspace_id, name, description, criteria, auto_assign, color, created_at)
    VALUES ($1, $2, $3, $4::jsonb, $5, $6, now())
    RETURNING id, name, description, criteria, color, created_at
  `, workspaceId, name, description || null, JSON.stringify(criteria), auto_assign, color);
  let auto_assigned = 0;
  if (auto_assign && criteria) {
    // Auto-assign KH thoả criteria
    const conds = [];
    const params = [workspaceId];
    if (criteria.min_spent_amount) {
      params.push(criteria.min_spent_amount);
      conds.push(`(SELECT COALESCE(SUM(total),0) FROM invoices i WHERE i.person_id = p.id AND i.status='PAID') >= $${params.length}`);
    }
    if (criteria.min_visits) {
      params.push(criteria.min_visits);
      conds.push(`(SELECT COUNT(*) FROM appointments a WHERE a.person_id = p.id AND a.status='COMPLETED') >= $${params.length}`);
    }
    if (conds.length > 0) {
      const sql = `INSERT INTO customer_group_members (group_id, customer_id, role, added_at)
        SELECT $${params.length + 1}::uuid, p.id, 'MEMBER', now() FROM people p
        WHERE p.workspace_id = $1 AND ${conds.join(' AND ')} ON CONFLICT DO NOTHING`;
      params.push(result[0].id);
      const inserted = await prisma.$executeRawUnsafe(sql, ...params);
      auto_assigned = inserted;
    }
  }
  return res.json({ ok: true, data: { ...result[0], auto_assigned } });
}

case 'update_customer_group': {
  const { group_id, name, description, criteria, color } = body;
  if (!group_id) return res.status(400).json({ ok: false, error: { code: 'MISSING_GROUP_ID' } });
  const sets = [];
  const params = [];
  if (name !== undefined) { params.push(name); sets.push(`name = $${params.length}`); }
  if (description !== undefined) { params.push(description); sets.push(`description = $${params.length}`); }
  if (criteria !== undefined) { params.push(JSON.stringify(criteria)); sets.push(`criteria = $${params.length}::jsonb`); }
  if (color !== undefined) { params.push(color); sets.push(`color = $${params.length}`); }
  if (!sets.length) return res.status(400).json({ ok: false, error: { code: 'NO_FIELDS' } });
  params.push(group_id); params.push(workspaceId);
  const result = await prisma.$queryRawUnsafe(`
    UPDATE customer_groups SET ${sets.join(', ')}
    WHERE id = $${params.length - 1}::uuid AND workspace_id = $${params.length}
    RETURNING id, name, description, criteria, color
  `, ...params);
  if (!result.length) return res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND' } });
  return res.json({ ok: true, data: result[0] });
}

case 'delete_customer_group': {
  const { group_id, reason } = body;
  if (!group_id) return res.status(400).json({ ok: false, error: { code: 'MISSING_GROUP_ID' } });
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`DELETE FROM customer_group_members WHERE group_id = $1::uuid`, group_id);
    await tx.$executeRawUnsafe(`DELETE FROM customer_groups WHERE id = $1::uuid AND workspace_id = $2`, group_id, workspaceId);
    // Audit
    await tx.$executeRawUnsafe(`
      INSERT INTO audit_logs (workspace_id, actor_user_id, action, resource_type, resource_id, details, created_at)
      VALUES ($1, $2, 'customer_group.deleted', 'customer_group', $3, $4::jsonb, now())
    `, workspaceId, userId, group_id, JSON.stringify({ reason: reason || 'no_reason' }));
  });
  return res.json({ ok: true, data: { deleted: true, group_id, reason } });
}

case 'add_member_to_group': {
  const { group_id, customer_id, role = 'MEMBER' } = body;
  if (!group_id || !customer_id) return res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
  // Verify both exist in workspace
  const grp = await prisma.$queryRawUnsafe(`SELECT id FROM customer_groups WHERE id = $1::uuid AND workspace_id = $2`, group_id, workspaceId);
  if (!grp.length) return res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND' } });
  const cust = await prisma.$queryRawUnsafe(`SELECT id FROM people WHERE id = $1 AND workspace_id = $2`, customer_id, workspaceId);
  if (!cust.length) return res.status(404).json({ ok: false, error: { code: 'CUSTOMER_NOT_FOUND' } });
  await prisma.$executeRawUnsafe(`
    INSERT INTO customer_group_members (group_id, customer_id, role, added_at)
    VALUES ($1::uuid, $2, $3, now()) ON CONFLICT (group_id, customer_id) DO UPDATE SET role = $3
  `, group_id, customer_id, role);
  return res.json({ ok: true, data: { group_id, customer_id, role, added: true } });
}

case 'remove_member_from_group': {
  const { group_id, customer_id } = body;
  if (!group_id || !customer_id) return res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
  const result = await prisma.$executeRawUnsafe(`
    DELETE FROM customer_group_members WHERE group_id = $1::uuid AND customer_id = $2
  `, group_id, customer_id);
  return res.json({ ok: true, data: { removed: result > 0, group_id, customer_id } });
}

case 'list_group_members': {
  const { group_id, role = 'ALL', limit = 50, offset = 0 } = body;
  if (!group_id) return res.status(400).json({ ok: false, error: { code: 'MISSING_GROUP_ID' } });
  // Verify group belongs to workspace
  const grp = await prisma.$queryRawUnsafe(`SELECT id, name FROM customer_groups WHERE id = $1::uuid AND workspace_id = $2`, group_id, workspaceId);
  if (!grp.length) return res.status(404).json({ ok: false, error: { code: 'GROUP_NOT_FOUND' } });
  const where = role === 'ALL' ? '' : `AND m.role = '${role.replace(/'/g, "''")}'`;
  const members = await prisma.$queryRawUnsafe(`
    SELECT m.customer_id, m.role, m.added_at, p.full_name, p.phone, p.email, p.tier
    FROM customer_group_members m
    LEFT JOIN people p ON p.id = m.customer_id
    WHERE m.group_id = $1::uuid ${where}
    ORDER BY m.added_at DESC LIMIT $2 OFFSET $3
  `, group_id, Math.min(limit, 200), offset);
  const total = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS total FROM customer_group_members WHERE group_id = $1::uuid ${where}
  `, group_id);
  return res.json({ ok: true, data: { group: grp[0], members, total: total[0].total, limit, offset } });
}
