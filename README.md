# misitioapp-multitenant

Backend + admin multitenant de App Resuelve: un solo API, una sola base de datos y un solo panel de administración para todas las tiendas (catálogos WhatsApp).

## Estructura

- `api/` — Backend Express + Sequelize (multitenant, con `tenant_id`).
- `client/` — Panel admin (Next.js), una sola app para todos los tenants.

## Tenants

Cada tienda (cliente) es un `tenant`. El API resuelve el tenant por el header `X-Tenant-Slug`. La plataforma (`appresuelve-platform`) crea los tenants vía `POST /api/internal/tenants`.
