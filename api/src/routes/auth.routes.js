const authController = require('../controllers/auth.controller')
const authMiddleware = require('../middleware/auth')
const { emailLimiter } = require('../middleware/rateLimiter')
const validate = require('../middleware/validate')
const { loginSchema, emailSchema, tokenAndPasswordSchema, changePasswordSchema } = require('../validations/auth.schema')

const router = require('express').Router()

router.post('/login', validate(loginSchema), authController.login)
router.get('/me', authMiddleware, authController.me)
router.post('/validate-token', validate(tokenAndPasswordSchema), authController.validateToken)
router.post('/activate', validate(tokenAndPasswordSchema), authController.activate)
router.put('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword)
router.post('/forgot-password', emailLimiter, validate(emailSchema), authController.forgotPassword)
router.post('/reset-password', validate(tokenAndPasswordSchema), authController.resetPassword)

module.exports = router
