const {
  Product,
  Category,
  ProductSku,
  AttributeValue,
  Attribute,
  TagValue,
  Tag,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");
const { applyUnitPricing } = require("../../utils/unitPricing");
const { getActiveDiscounts, resolveProductPricing } = require("./discounts.service");
const sanitizeHtml = require("sanitize-html");

const sanitizeDescription = (html) =>
  sanitizeHtml(html || "", {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "u", "s"],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });

const skuInclude = {
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
  order: [["sort_order", "ASC"]],
};

const list = async (tenantId, query = {}) => {
  const {
    page = 1,
    limit = 50,
    search,
    categoryId,
    categorySlug,
    tagIds,
  } = query;
  const offset = (page - 1) * limit;

  const conditions = ['"Product"."status" = \'active\''];
  const bindParams = []; // Renombrado a bindParams para mayor claridad

  if (tenantId) {
    conditions.push(`"Product"."tenant_id" = $${bindParams.length + 1}`);
    bindParams.push(tenantId);
  }

  if (search) {
    conditions.push(
      `("Product"."name" ILIKE $${bindParams.length + 1} OR "Product"."description" ILIKE $${bindParams.length + 1})`,
    );
    bindParams.push(`%${search}%`);
  }

  // Sanitizamos el categoryId para evitar strings 'undefined' o 'null'
  let resolvedCategoryId =
    categoryId && categoryId !== "undefined" && categoryId !== "null"
      ? categoryId
      : null;

  if (categorySlug) {
    const cat = await Category.findOne({
      where: { slug: categorySlug },
      attributes: ["id"],
    });
    if (cat) resolvedCategoryId = cat.id;
  }

  if (resolvedCategoryId) {
    conditions.push(`"Product"."category_id" = $${bindParams.length + 1}`);
    bindParams.push(Number(resolvedCategoryId));
  }

  const rawIds = tagIds
    ? (Array.isArray(tagIds)
        ? tagIds.map(Number)
        : tagIds.split(",").map(Number)
      ).filter(Boolean)
    : [];

  if (rawIds.length > 0) {
    const tagValues = await TagValue.findAll({
      where: { id: { [Op.in]: rawIds } },
      attributes: ["id", "tagId"],
    });

    const groups = {};
    tagValues.forEach((tv) => {
      if (!groups[tv.tagId]) groups[tv.tagId] = [];
      groups[tv.tagId].push(tv.id);
    });

    const intersects = Object.values(groups).map((ids) => {
      const startIdx = bindParams.length;
      bindParams.push(...ids);
      const placeholders = ids.map((_, i) => `$${startIdx + i + 1}`);
      return `SELECT "product_id" FROM "product_tags" WHERE "tag_value_id" IN (${placeholders.join(", ")})`;
    });

    // FIX: Solo agregamos la condición si realmente hay intersecciones válidas
    if (intersects.length > 0) {
      conditions.push(`"Product"."id" IN (${intersects.join(" INTERSECT ")})`);
    }
  }

  const whereClause = conditions.join(" AND ");

  // FIX: Usamos "bind" en lugar de "replacements" para que soporte los $1, $2
  const countResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM "products" AS "Product" WHERE ${whereClause}`,
    { bind: bindParams, type: sequelize.QueryTypes.SELECT },
  );
  const total = parseInt(countResult[0]?.total || "0");

  if (total === 0) {
    return { products: [], total: 0, page: Number(page), totalPages: 0 };
  }

  const idResult = await sequelize.query(
    `SELECT "Product"."id"
     FROM "products" AS "Product"
     WHERE ${whereClause}
     ORDER BY "Product"."created_at" DESC
     LIMIT $${bindParams.length + 1} OFFSET $${bindParams.length + 2}`,
    {
      bind: [...bindParams, Number(limit), offset],
      type: sequelize.QueryTypes.SELECT,
    },
  );
  const ids = idResult.map((r) => r.id);

  if (ids.length === 0) {
    return {
      products: [],
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    };
  }

  const products = await Product.findAll({
    where: { id: { [Op.in]: ids } },
    include: [
      { model: Category, as: "category", attributes: ["id", "name", "slug"] },
      skuInclude,
      {
        model: TagValue,
        as: "tagValues",
        include: [{ model: Tag, as: "tag" }],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  products.forEach(applyUnitPricing);

  const discounts = await getActiveDiscounts(tenantId);
  const productDiscounts = discounts.filter((d) => d.type !== "cart_total");
  products.forEach((p) => resolveProductPricing(p, productDiscounts));

  return {
    products,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

const getBySlug = async (tenantId, slug) => {
  const product = await Product.findOne({
    where: { tenantId, slug, status: 'active' },
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      skuInclude,
      { model: TagValue, as: 'tagValues', include: [{ model: Tag, as: 'tag' }] },
    ],
  });
  if (!product) {
    throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  }
  applyUnitPricing(product);

  const discounts = await getActiveDiscounts(tenantId);
  const productDiscounts = discounts.filter((d) => d.type !== "cart_total");
  resolveProductPricing(product, productDiscounts);

  product.description = sanitizeDescription(product.description);
  return product;
};

module.exports = { list, getBySlug };
