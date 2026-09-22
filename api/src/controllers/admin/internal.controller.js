const crypto = require('crypto')
const { User, Setting, Product, Service, Tenant } = require('../../models')
const emailService = require('../../services/email.service')
const { run } = require('../../services/tenantContext')
const { ensureDefaults } = require('../../services/store/settings.service')
const { getStatus, setStatus } = require('../../services/billing.service')
const { adminOriginFromTenant } = require('../../utils/adminOrigin')

const seedSettings = async (req, res, next) => {
  try {
    const data = req.body

    const mappings = {
      businessName: 'business_name',
      description: 'business_description',
      whatsappNumber: 'whatsapp_number',
      logoUrl: 'logo_url',
      faviconUrl: 'favicon_url',
      storeStatus: 'store_status',
      instagram: 'instagram',
      facebook: 'facebook',
      tiktok: 'tiktok',
      youtube: 'youtube',
    }

    for (const [field, mapping] of Object.entries(mappings)) {
      const config = typeof mapping === 'string' ? { key: mapping } : mapping
      const value = data[field]
      if (value !== undefined) {
        const existing = await Setting.findOne({ where: { key: config.key } })
        if (existing) {
          await existing.update({ value })
        } else {
          await Setting.create({ key: config.key, value })
        }
      }
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

const seedProducts = async (req, res, next) => {
  try {
    const { excelUrl, excelBase64, categoryId } = req.body
    let buffer

    if (excelBase64) {
      buffer = Buffer.from(excelBase64, 'base64')
    } else if (excelUrl) {
      try {
        const protocol = excelUrl.startsWith('https') ? require('https') : require('http')
        buffer = await new Promise((resolve, reject) => {
          protocol.get(excelUrl, (response) => {
            if (response.statusCode >= 300) {
              reject(new Error(`Error descargando Excel: ${response.statusCode}`))
              return
            }
            const chunks = []
            response.on('data', (c) => chunks.push(c))
            response.on('end', () => resolve(Buffer.concat(chunks)))
          }).on('error', reject)
        })
      } catch (downloadErr) {
        return res.status(400).json({ error: `No se pudo descargar el Excel: ${downloadErr.message}` })
      }
    } else {
      return res.status(400).json({ error: 'excelUrl o excelBase64 requerido' })
    }

    const XLSX = require('xlsx')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      return res.json({ created: 0, warnings: [] })
    }

    const headers = Object.keys(rows[0])
    const NAME_ALIASES = ['nombre', 'name', 'producto', 'product', 'product_name', 'producto_nombre']
    const PRICE_ALIASES = ['precio', 'price', 'importe', 'costo', 'valor', 'retail_price', 'precio_venta']

    const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 255) || 'sin-nombre'

    const nameCol = NAME_ALIASES.reduce((found, alias) => found || headers.find((h) => h.toLowerCase().includes(alias)) || '', '') || headers[0]
    const priceCol = PRICE_ALIASES.reduce((found, alias) => found || headers.find((h) => h.toLowerCase().includes(alias)) || '', '') || headers[0]

    const products = rows
      .map((row) => {
        const name = String(row[nameCol] ?? '').trim()
        const price = row[priceCol]
        if (!name || price == null || price === '' || isNaN(Number(price)) || Number(price) < 0) return null
        return {
          name,
          slug: slugify(name),
          retailPrice: Number(price) || 0,
          status: 'draft',
          categoryId: categoryId || null,
        }
      })
      .filter(Boolean)

    await Product.bulkCreate(products, { validate: true })

    res.json({ created: products.length, warnings: [] })
  } catch (err) {
    next(err)
  }
}

const createAdmin = async (req, res, next) => {
  try {
    const { email, name } = req.body
    if (!email || !name) {
      return res.status(400).json({ error: 'email y name son requeridos' })
    }

    const existing = await User.findOne({ where: { role: 'admin' } })
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un administrador' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(token).digest('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    await User.create({
      email,
      name,
      password: '',
      status: 'pending',
      role: 'admin',
      activationTokenHash: hash,
      activationExpires: expires,
      activationSentAt: new Date(),
    })

    const link = `${adminOriginFromTenant(req.tenant)}/activate/${token}`

    await emailService.sendActivationEmail(email, link)

    res.status(201).json({ success: true })
  } catch (err) {
    next(err)
  }
}

const seedServices = async (req, res, next) => {
  try {
    const services = req.body
    if (!Array.isArray(services) || services.length === 0) {
      return res.json({ created: 0 })
    }

    const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 255)

    const rows = services
      .filter((s) => s.name?.trim())
      .map((s) => ({
        name: s.name.trim(),
        slug: slugify(s.name.trim()),
        description: s.description || null,
        price: Number(s.price) || 0,
        status: 'draft',
      }))

    if (rows.length > 0) {
      await Service.bulkCreate(rows, { validate: true })
    }

    res.json({ created: rows.length })
  } catch (err) {
    next(err)
  }
}

const getAdminStatus = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: { role: 'admin' },
      attributes: ['status', 'activationSentAt', 'activationExpires'],
    })

    if (!admin) {
      return res.json({ exists: false })
    }

    const now = new Date()
    const sentAt = admin.activationSentAt ? new Date(admin.activationSentAt) : null
    const expires = admin.activationExpires ? new Date(admin.activationExpires) : null
    const secondsSinceSent = sentAt ? Math.floor((now - sentAt) / 1000) : Infinity

    let canResend = false
    if (admin.status === 'pending' && secondsSinceSent >= 60) {
      canResend = true
    }

    return res.json({
      exists: true,
      status: admin.status,
      activationSentAt: sentAt?.toISOString() || null,
      activationExpiresAt: expires?.toISOString() || null,
      canResend,
    })
  } catch (err) {
    next(err)
  }
}

const resendActivation = async (req, res, next) => {
  try {
    const admin = await User.findOne({ where: { role: 'admin' } })
    if (!admin) {
      return res.status(404).json({ error: 'No hay administrador creado' })
    }

    if (admin.status === 'active') {
      return res.status(409).json({ error: 'El administrador ya está activado' })
    }

    const now = new Date()
    const sentAt = admin.activationSentAt ? new Date(admin.activationSentAt) : null
    const secondsSinceSent = sentAt ? Math.floor((now - sentAt) / 1000) : Infinity

    if (secondsSinceSent < 60) {
      const waitSeconds = 60 - secondsSinceSent
      return res.status(429).json({
        error: `Esperá ${waitSeconds} segundos antes de reenviar`,
        retryAfter: waitSeconds,
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(token).digest('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await admin.update({
      activationTokenHash: hash,
      activationExpires: expires,
      activationSentAt: now,
    })

    const link = `${adminOriginFromTenant(req.tenant)}/activate/${token}`

    await emailService.sendActivationEmail(admin.email, link)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

const createTenant = async (req, res, next) => {
  try {
    const { slug, name, domain, adminDomain, folderPrefix } = req.body
    if (!slug || !name) {
      return res.status(400).json({ error: 'slug y name son requeridos' })
    }

    const existing = await Tenant.findOne({ where: { slug } })
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un tenant con ese slug' })
    }

    const tenant = await Tenant.create({
      slug,
      name,
      domain: domain || null,
      adminDomain: adminDomain || null,
      folderPrefix: folderPrefix || null,
    })

    // Crear los settings default del tenant
    await run(tenant.id, () => ensureDefaults())

    res.status(201).json({ id: tenant.id, slug: tenant.slug, name: tenant.name })
  } catch (err) {
    next(err)
  }
}

const listTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.findAll({ order: [['id', 'ASC']] })
    res.json(tenants)
  } catch (err) {
    next(err)
  }
}

const setBillingStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!status) {
      return res.status(400).json({ error: 'status es requerido' })
    }
    await setStatus(req.tenant.id, status)
    res.json({ success: true, billing_status: await getStatus() })
  } catch (err) {
    next(err)
  }
}

const getBillingStatus = async (req, res, next) => {
  try {
    res.json({ billing_status: await getStatus() })
  } catch (err) {
    next(err)
  }
}

module.exports = { createTenant, listTenants, createAdmin, seedSettings, seedProducts, seedServices, getAdminStatus, resendActivation, setBillingStatus, getBillingStatus }
