const authService = require("../services/auth.service");

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const businessName =
      req.storeSettings?.businessName || req.tenant?.name || "";
    const result = await authService.login(
      req.tenant?.id,
      email,
      password,
      businessName,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const userId = req.user.id || null;
    const businessName =
      req.storeSettings?.businessName || req.tenant?.name || "";
    const user = await authService.me(req.tenant?.id, userId, businessName);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const validateToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await authService.validateToken(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const activate = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.activate(token, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(
      req.tenant.id,
      email,
      req.tenant,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, code, email, password } = req.body;
    const tenantId = req.tenant?.id || null;
    const result = await authService.resetPassword({
      tenantId,
      token,
      code,
      email,
      password,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  me,
  validateToken,
  activate,
  changePassword,
  forgotPassword,
  resetPassword,
};
