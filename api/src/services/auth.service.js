const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User, Setting } = require('../models')
const { getStatus } = require('./billing.service')
const { adminOriginFromTenant } = require('../utils/adminOrigin')

const getBusinessName = async (tenantId) => {
  const where = tenantId ? { key: 'business_name', tenantId } : { key: 'business_name' }
  const row = await Setting.findOne({ where })
  return row?.value || ''
}

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role || 'admin', tenantId: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

const login = async (email, password, tenantId) => {
  const billingStatus = await getStatus(tenantId)
  const businessName = await getBusinessName(tenantId)

  if (process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD &&
      email === process.env.SUPER_ADMIN_EMAIL && password === process.env.SUPER_ADMIN_PASSWORD) {
    const superUser = { id: 0, name: 'Super Admin', email, role: 'super_admin', tenantId }
    const token = generateToken(superUser)
    return {
      token,
      user: { name: superUser.name, email: superUser.email, role: 'super_admin', tenantId, billing_status: billingStatus, business_name: businessName },
    }
  }

  const user = await User.findOne({ where: { email, status: 'active', tenantId } })
  if (!user) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 })
  }

  const valid = await user.comparePassword(password)
  if (!valid) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 })
  }

  const token = generateToken(user)
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, billing_status: billingStatus, business_name: businessName },
  }
}

const validateToken = async (token) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    where: { activationTokenHash: hash, activationExpires: { [require('sequelize').Op.gt]: new Date() } },
  })
  if (!user) {
    throw Object.assign(new Error('Token inválido o expirado'), { status: 400 })
  }
  return { email: user.email, valid: true }
}

const activate = async (token, password) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    where: { activationTokenHash: hash, activationExpires: { [require('sequelize').Op.gt]: new Date() } },
  })
  if (!user) {
    throw Object.assign(new Error('Token inválido o expirado'), { status: 400 })
  }
  if (!password || password.length < 6) {
    throw Object.assign(new Error('La contraseña debe tener al menos 6 caracteres'), { status: 400 })
  }

  user.password = password
  user.status = 'active'
  user.activationTokenHash = null
  user.activationExpires = null
  await user.save()

  return { success: true }
}

const changePassword = async (userId, newPassword) => {
  if (!userId) {
    throw Object.assign(new Error('El super admin no puede cambiar contraseña desde acá'), { status: 400 })
  }

  const user = await User.findByPk(userId)
  if (!user) {
    throw Object.assign(new Error('Usuario no encontrado'), { status: 404 })
  }

  if (!newPassword || newPassword.length < 6) {
    throw Object.assign(new Error('La nueva contraseña debe tener al menos 6 caracteres'), { status: 400 })
  }

  user.password = newPassword
  await user.save()

  return { success: true }
}

const emailService = require('./email.service')

const forgotPassword = async (tenantId, email, tenant) => {
  const user = await User.findOne({ where: { tenantId, email, status: 'active' } })
  if (!user) {
    // No revelar si el email existe o no
    return { success: true }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1h

  await user.update({ resetTokenHash: hash, resetExpires: expires })

  const link = `${adminOriginFromTenant(tenant)}/reset/${token}`

  await emailService.sendResetPasswordEmail(email, link)

  return { success: true }
}

const resetPassword = async (token, newPassword) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    where: { resetTokenHash: hash, resetExpires: { [require('sequelize').Op.gt]: new Date() } },
  })
  if (!user) {
    throw Object.assign(new Error('Token inválido o expirado'), { status: 400 })
  }
  if (!newPassword || newPassword.length < 6) {
    throw Object.assign(new Error('La contraseña debe tener al menos 6 caracteres'), { status: 400 })
  }

  user.password = newPassword
  user.resetTokenHash = null
  user.resetExpires = null
  await user.save()

  const token_jwt = generateToken(user)
  return { success: true, token: token_jwt, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}

const me = async (userId, tenantId) => {
  const billingStatus = await getStatus(tenantId)
  const businessName = await getBusinessName(tenantId)

  if (!userId) {
    return { id: 0, name: 'Super Admin', email: '', role: 'super_admin', tenantId, billing_status: billingStatus, business_name: businessName }
  }

  const user = await User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'role', 'tenantId'],
  })
  if (!user) {
    throw Object.assign(new Error('Usuario no encontrado'), { status: 404 })
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    billing_status: billingStatus,
    business_name: businessName,
  }
}

module.exports = { generateToken, login, validateToken, activate, changePassword, forgotPassword, resetPassword, me }
