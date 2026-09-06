const {
  AttributeValue,
  Attribute,
  Service,
  ServiceVariant,
  ServiceVariantModifier,
  sequelize,
} = require("../../models");

const variantInclude = {
  model: ServiceVariant,
  as: "variants",
  include: [
    { model: ServiceVariantModifier, as: "modifiers" },
    {
      model: AttributeValue,
      as: "attributeValues",
      through: { attributes: [] },
      include: [{ model: Attribute, as: "attribute" }],
    },
  ],
  order: [
    ["sort_order", "ASC"],
    ["modifiers", "sort_order", "ASC"],
  ],
};

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 255);

const list = async (query = {}) => {
  const { page = 1, limit = 20, search, status } = query;
  const offset = (page - 1) * limit;
  const where = {};
  if (search) {
    where[require("sequelize").Op.or] = [
      { name: { [require("sequelize").Op.iLike]: `%${search}%` } },
      { description: { [require("sequelize").Op.iLike]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;

  const { count, rows } = await Service.findAndCountAll({
    where,
    include: [variantInclude],
    order: [["name", "ASC"]],
    limit: Number(limit),
    offset,
  });
  return {
    services: rows,
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / limit),
  };
};

const getById = async (id) => {
  const service = await Service.findByPk(id, { include: [variantInclude] });
  if (!service)
    throw Object.assign(new Error("Servicio no encontrado"), { status: 404 });
  return service;
};

const syncVariants = async (serviceId, variants = [], basePrice, transaction) => {
  const variantIds = [];
  for (const v of variants) {
    const variantData = {
      serviceId,
      price: v.price || basePrice || 0,
      durationMinutes: v.durationMinutes ?? null,
      images: v.images ?? [],
      sortOrder: v.sortOrder ?? 0,
      status: v.status || "active",
    };
    let variant;
    if (v.id) {
      variant = await ServiceVariant.findByPk(v.id, { transaction });
      if (variant && variant.serviceId === serviceId)
        await variant.update(variantData, { transaction });
      else variant = await ServiceVariant.create(variantData, { transaction });
    } else {
      variant = await ServiceVariant.create(variantData, { transaction });
    }
    variantIds.push(variant.id);

    // Sync attribute values (replaces old 'name' field)
    if (v.attributeValueIds && Array.isArray(v.attributeValueIds)) {
      const currentLinks = await variant.getAttributeValues({ transaction });
      const currentIds = currentLinks.map((av) => av.id);
      const toAdd = v.attributeValueIds.filter(
        (id) => !currentIds.includes(id),
      );
      const toRemove = currentIds.filter(
        (id) => !v.attributeValueIds.includes(id),
      );
      if (toRemove.length > 0)
        await variant.removeAttributeValues(toRemove, { transaction });
      if (toAdd.length > 0)
        await variant.addAttributeValues(toAdd, { transaction });
    }

    if (v.modifiers && Array.isArray(v.modifiers)) {
      const modifierIds = [];
      for (const m of v.modifiers) {
        const modifierData = {
          serviceVariantId: variant.id,
          name: m.name,
          price: m.price || 0,
          maxSelection: m.maxSelection ?? null,
          sortOrder: m.sortOrder ?? 0,
          status: m.status || "active",
        };
        let modifier;
        if (m.id) {
          modifier = await ServiceVariantModifier.findByPk(m.id, {
            transaction,
          });
          if (modifier && modifier.serviceVariantId === variant.id)
            await modifier.update(modifierData, { transaction });
          else
            modifier = await ServiceVariantModifier.create(modifierData, {
              transaction,
            });
        } else {
          modifier = await ServiceVariantModifier.create(modifierData, {
            transaction,
          });
        }
        modifierIds.push(modifier.id);
      }
      await ServiceVariantModifier.destroy({
        where: {
          serviceVariantId: variant.id,
          id: { [require("sequelize").Op.notIn]: modifierIds },
        },
        transaction,
      });
    }
  }
  await ServiceVariant.destroy({
    where: { serviceId, id: { [require("sequelize").Op.notIn]: variantIds } },
    transaction,
  });
};

const create = async (data) => {
  const { variants, ...serviceData } = data;
  if (!serviceData.slug && serviceData.name)
    serviceData.slug = slugify(serviceData.name);
  const result = await sequelize.transaction(async (t) => {
    const service = await Service.create(serviceData, { transaction: t });
    if (variants && variants.length > 0) {
      await syncVariants(service.id, variants, service.price, t);
      const activeVariants = variants.filter(v => v.status !== 'draft')
      if (activeVariants.length > 0) {
        const prices = activeVariants.map(v => Number(v.price)).filter(p => p > 0)
        if (prices.length) { service.price = Math.min(...prices); await service.save({ transaction: t }) }
      }
    } else {
      const [baseVariant] = await ServiceVariant.findOrCreate({
        where: { serviceId: service.id },
        defaults: { serviceId: service.id, price: service.price || 0, durationMinutes: null, images: [], sortOrder: 0, status: 'active' },
        transaction: t,
      })
      if (!baseVariant._options?.isNewRecord) {
        await baseVariant.update({ price: service.price || 0 }, { transaction: t })
      }
      await baseVariant.setAttributeValues([], { transaction: t })
    }
    return Service.findByPk(service.id, {
      include: [variantInclude],
      transaction: t,
    });
  });

  return result;
};

const update = async (id, data) => {
  const service = await getById(id);
  const { variants, ...serviceData } = data;
  if (!serviceData.slug && serviceData.name)
    serviceData.slug = slugify(serviceData.name);

  if (serviceData.slug && serviceData.slug !== service.slug) {
    const existing = await Service.findOne({ where: { slug: serviceData.slug } })
    if (existing && existing.id !== service.id) {
      throw Object.assign(new Error('Ya existe un servicio con ese slug'), { status: 400 })
    }
  }
  const result = await sequelize.transaction(async (t) => {
    await service.update(serviceData, { transaction: t });
    if (variants && Array.isArray(variants)) {
      await syncVariants(service.id, variants, service.price, t);
      const activeVariants = variants.filter(v => v.status !== 'draft')
      if (activeVariants.length > 0) {
        const prices = activeVariants.map(v => Number(v.price)).filter(p => p > 0)
        if (prices.length) { service.price = Math.min(...prices); await service.save({ transaction: t }) }
      }
    } else {
      const [baseVariant] = await ServiceVariant.findOrCreate({
        where: { serviceId: service.id },
        defaults: { serviceId: service.id, price: service.price || 0, durationMinutes: null, images: [], sortOrder: 0, status: 'active' },
        transaction: t,
      })
      if (!baseVariant._options?.isNewRecord) {
        await baseVariant.update({ price: service.price || 0 }, { transaction: t })
      }
      await baseVariant.setAttributeValues([], { transaction: t })
    }
    return Service.findByPk(id, { include: [variantInclude], transaction: t });
  });

  return result;
};

const remove = async (id) => {
  const service = await getById(id);
  return service.destroy();
};

module.exports = { list, getById, create, update, remove };
