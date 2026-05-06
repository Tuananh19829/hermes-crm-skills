# VPS deploy info — Hermes CRM

**Source of truth** cho cả CRM AI lẫn Hub AI. Update khi VPS đổi.

## Production VPS

| Field | Value |
|---|---|
| **IP** | `136.112.201.221` |
| **Provider** | GCP (Google Cloud) |
| **Hostname** | `spaclaw-main` |
| **SSH user** | `daotaokinhdoanhspanoibo` |
| **SSH key** | `~/.ssh/id_rsa` (anh giữ) |
| **Auth** | SSH key (không dùng password) |

## Domains

| Domain | Mục đích |
|---|---|
| `crm.spaclaw.pro` | App CRM chính |
| `api-auth.spaclaw.pro` | Core SSO (RS256 JWT) |
| `api-core.spaclaw.pro` | Core API (events, audit, notify) |
| `app.spaclaw.pro` | Admin tổng (tick features + plans) |
| `pay.spaclaw.pro` | Payment gateway VietQR |

## Container layout (Docker on VPS)

| Container | Role | Bind-mount |
|---|---|---|
| `appcrm-api` | Express :4000 backend | `/opt/crm/dist` → `/app/dist` |
| `appcrm-web` | nginx alpine (KHÔNG dùng cho frontend) | — |
| `spaclaw-shared-pg` | PostgreSQL 17 (shared cho nhiều app) | named volume |
| `appcrm-nginx` | nginx gateway (front of api) | — |

**Frontend serve**: HOST nginx (`/var/www/crm-web/`), KHÔNG phải `appcrm-web` container.

## Skill handler file

| Field | Value |
|---|---|
| Host path | `/opt/crm/agent-tools-hermes.js` |
| Container path | `appcrm-api:/app/dist/modules/agent-tools/routes.js` |
| Cơ chế | Host bind-mount (sửa host = container thấy ngay sau restart) |

## DB

| Field | Value |
|---|---|
| Container | `spaclaw-shared-pg` (KHÔNG phải `appcrm-db` cũ — đã exited) |
| User | `appcrm` |
| Database | `appcrm` |
| Port | 5432 (internal) |
| Connect | `docker exec spaclaw-shared-pg psql -U appcrm -d appcrm` |

## ENV vars quan trọng (set trong `/var/www/appcrm/docker-compose.yml`)

```
APP_URL=https://crm.spaclaw.pro
JWT_ISSUER=https://api-auth.spaclaw.pro
MODULE_KEY=crm
CORE_API_URL=https://api-core.spaclaw.pro
INTERNAL_SECRET=spaclaw-internal-4f8a9c2d
HUB_INTERNAL_SECRET=<khác với CORE_INTERNAL_SECRET>
CORE_INTERNAL_SECRET=<khác với HUB>
CRM_INTERNAL_SECRET=<dùng cho Hub gọi /internal/skills/*>
PAYMENT_GATEWAY_URL=https://pay.spaclaw.pro
```

## Deploy backend skill handler

```bash
# Anh local:
ssh daotaokinhdoanhspanoibo@136.112.201.221

# Trên VPS:
bash <(curl -sL https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/customer_groups/APPLY_PATCH.sh)
```

Script tự backup + insert + restart + verify.

## Lưu ý CRM AI

- Em **KHÔNG có SSH access** trực tiếp (sandbox block production VPS modify)
- Tất cả deploy phải qua anh hoặc qua git workflow
- File trong `/opt/crm/` là bind-mount → sửa host file = container thấy sau `docker restart`
- KHÔNG xài `prune`, KHÔNG `down --no-deps` (theo memory `ref_vps_spaclaw_main_runbook`)

## Lưu ý Hub AI

- Trong report Hub đã đưa SSH user `vienthammykjm` — **SAI**, đúng là `daotaokinhdoanhspanoibo`
- Container `appcrm-db` ĐÃ EXITED — DB là `spaclaw-shared-pg`
