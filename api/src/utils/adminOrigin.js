// Deriva la URL del panel admin de un tenant a partir de su dominio.
// Convención: el admin vive bajo `admin.{dominio}`. Si el tenant tiene
// `adminDomain` explícito, se usa ese. Si no hay tenant, cae a la env global.
function adminOriginFromTenant(tenant) {
  const source = tenant?.adminDomain || tenant?.domain

  if (source) {
    const host = source.replace(/^https?:\/\//, '')
    return host.startsWith('admin.') ? `https://${host}` : `https://admin.${host}`
  }

  const origin =
    process.env.STORE_FRONTEND_URL ||
    process.env.CORS_ORIGIN?.split(',')[0] ||
    'http://localhost:5173'
  const host = origin.replace(/^https?:\/\//, '')
  return host.startsWith('admin.') ? `https://${host}` : `https://admin.${host}`
}

module.exports = { adminOriginFromTenant }
