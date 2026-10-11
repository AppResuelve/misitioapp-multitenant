const paymentService = require("../../services/admin/payment.service");

const list = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const items = await paymentService.list(tenantId);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const newItem = await paymentService.create(tenantId, req.body);
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
};

const reorder = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { orders } = req.body;
    await paymentService.reorder(tenantId, orders);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const updated = await paymentService.update(tenantId, id, req.body);

    if (!updated) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const deleted = await paymentService.remove(tenantId, id);

    if (!deleted) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove, reorder };
