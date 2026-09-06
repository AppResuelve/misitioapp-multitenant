const authService = require('../services/auth.service')

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const me = async (req, res, next) => {
  try {
    const userId = req.user.id || null
    const user = await authService.me(userId)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

const validateToken = async (req, res, next) => {
  try {
    const { token } = req.body
    const result = await authService.validateToken(token)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const activate = async (req, res, next) => {
  try {
    const { token, password } = req.body
    const result = await authService.activate(token, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body
    const result = await authService.changePassword(req.user.id, newPassword)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const result = await authService.forgotPassword(email)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body
    const result = await authService.resetPassword(token, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

module.exports = { login, me, validateToken, activate, changePassword, forgotPassword, resetPassword }
