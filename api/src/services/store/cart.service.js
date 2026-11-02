const {
  Product,
  ProductSku,
  AttributeValue,
  Attribute,
} = require("../../models");
const { Op } = require("sequelize");
const { proxyProductImages } = require("../../utils/cdn");
const {
  getActiveDiscounts,
  resolveProductPricing,
} = require("./discounts.service");

const syncCart = async (tenantId, items = [], storeSettings = {}) => {
  if (!tenantId || !Array.isArray(items) || items.length === 0) {
    return { items: [] };
  }

  // Obtenemos solo los IDs únicos de producto involucrados
  const productIds = [
    ...new Set(items.map((i) => Number(i.productId)).filter(Boolean)),
  ];

  if (productIds.length === 0) {
    return { items: [] };
  }

  // Buscamos solo esos productos
  const products = await Product.findAll({
    where: {
      tenantId,
      id: { [Op.in]: productIds },
      status: "active",
    },
    include: [
      {
        model: ProductSku,
        as: "skus",
        where: { status: "active" },
        required: false,
        include: [
          {
            model: AttributeValue,
            as: "attributeValues",
            through: { attributes: [] },
            include: [{ model: Attribute, as: "attribute" }],
          },
        ],
      },
    ],
  });

  // Aplicar descuentos unitarios y proxy de imágenes
  const discounts = await getActiveDiscounts(tenantId);
  const productDiscounts = discounts.filter((d) => d.type !== "cart_total");

  products.forEach((p) => {
    resolveProductPricing(p, productDiscounts);
    proxyProductImages(p);
  });

  const productsMap = new Map(products.map((p) => [p.id, p]));

  // Validamos cada ítem del carrito
  const validatedItems = items.map((item) => {
    const product = productsMap.get(Number(item.productId));

    // Si el producto fue borrado, pausado o no pertenece al tenant:
    if (!product) {
      return {
        productId: item.productId,
        skuId: item.skuId || null,
        available: false,
      };
    }

    let unitPrice = Number(product.retailPrice);
    let wholesalePrice = product.wholesalePrice
      ? Number(product.wholesalePrice)
      : null;
    let wholesaleMinQty = product.wholesaleMinQty
      ? Number(product.wholesaleMinQty)
      : null;
    let variantLabel = null;
    let images = Array.isArray(product.images) ? product.images : [];

    // Si es una variante (SKU)
    if (item.skuId) {
      const sku = (product.skus || []).find((s) => s.id === Number(item.skuId));
      if (!sku) {
        return {
          productId: item.productId,
          skuId: item.skuId,
          available: false,
        };
      }

      unitPrice = Number(sku.retailPrice);
      if (sku.wholesalePrice) wholesalePrice = Number(sku.wholesalePrice);
      if (sku.wholesaleMinQty) wholesaleMinQty = Number(sku.wholesaleMinQty);
      if (sku.images && sku.images.length > 0) images = sku.images;

      if (sku.attributeValues && sku.attributeValues.length > 0) {
        const UNIT_LABEL = { kg: "Gr", m: "Cm", l: "Ml" };
        variantLabel = sku.attributeValues
          .map((v) => {
            const unit = v.attribute?.unitType;
            return unit ? `${v.value} ${UNIT_LABEL[unit] || unit}` : v.value;
          })
          .join(" / ");
      }
    }

    return {
      productId: product.id,
      skuId: item.skuId ? Number(item.skuId) : null,
      available: true,
      name: product.name,
      retailPrice: unitPrice,
      wholesalePrice,
      wholesaleMinQty,
      images,
      variantLabel,
      hasActiveDiscount: product.dataValues?.hasActiveDiscount || false,
      discountPercentage: product.dataValues?.discountPercentage || 0,
    };
  });

  return { items: validatedItems };
};

module.exports = { syncCart };
