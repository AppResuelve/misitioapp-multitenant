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
const { proxyProductImages } = require("../../utils/cdn");
const {
  getActiveDiscounts,
  resolveProductPricing,
} = require("./discounts.service");
const {
  getCachedProducts,
  setCachedProducts,
} = require("../../utils/cache/productsCache");
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

// Inclusiones estándar para serializar un producto completo hacia el storefront
const defaultProductIncludes = [
  {
    model: Category,
    as: "category", // o simplemente Category si no usás alias
    attributes: ["id", "name", "slug"],
  },
  {
    model: TagValue,
    as: "tagValues",
    required: false,
    include: [
      {
        model: Tag,
        as: "tag",
        attributes: ["id", "name"],
      },
    ],
  },
];

const list = async (tenantId, query = {}, storeSettings) => {
  if (!tenantId) {
    return { products: [], total: 0, page: 1, totalPages: 0 };
  }

  // 1. Revisar caché en memoria (saltea si es búsqueda de texto libre)
  const cached = getCachedProducts(tenantId, query);
  if (cached) return cached;

  const {
    page = 1,
    limit = 24, // Optimizado a 24 para grillas responsivas (2, 3 y 4 columnas)
    search,
    categoryId,
    categorySlug,
    tagIds,
  } = query;
  const parsedLimit = Number(limit);
  const parsedPage = Number(page);
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = ['"Product"."status" = \'active\''];
  const bindParams = [];

  conditions.push(`"Product"."tenant_id" = $${bindParams.length + 1}`);
  bindParams.push(tenantId);

  if (search) {
    conditions.push(
      `("Product"."name" ILIKE $${bindParams.length + 1} OR "Product"."description" ILIKE $${bindParams.length + 1})`,
    );
    bindParams.push(`%${search}%`);
  }

  let resolvedCategoryId =
    categoryId && categoryId !== "undefined" && categoryId !== "null"
      ? categoryId
      : null;

  if (categorySlug) {
    const cat = await Category.findOne({
      where: { tenantId, slug: categorySlug, status: "active" },
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

    if (intersects.length > 0) {
      conditions.push(`"Product"."id" IN (${intersects.join(" INTERSECT ")})`);
    }
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM "products" AS "Product" WHERE ${whereClause}`,
    { bind: bindParams, type: sequelize.QueryTypes.SELECT },
  );
  const total = parseInt(countResult[0]?.total || "0");

  if (total === 0) {
    const emptyResult = {
      products: [],
      total: 0,
      page: parsedPage,
      totalPages: 0,
    };
    setCachedProducts(tenantId, query, emptyResult);
    return emptyResult;
  }

  const idResult = await sequelize.query(
    `SELECT "Product"."id"
     FROM "products" AS "Product"
     WHERE ${whereClause}
     ORDER BY "Product"."created_at" DESC
     LIMIT $${bindParams.length + 1} OFFSET $${bindParams.length + 2}`,
    {
      bind: [...bindParams, parsedLimit, offset],
      type: sequelize.QueryTypes.SELECT,
    },
  );
  const ids = idResult.map((r) => r.id);

  if (ids.length === 0) {
    const emptyPageResult = {
      products: [],
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
    };
    setCachedProducts(tenantId, query, emptyPageResult);
    return emptyPageResult;
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

  const autoCalculate = storeSettings?.autoCalculateUnitPrices ?? true;

  products.forEach((product) => applyUnitPricing(product, autoCalculate));

  const discounts = await getActiveDiscounts(tenantId);
  const productDiscounts = discounts.filter((d) => d.type !== "cart_total");
  products.forEach((p) => resolveProductPricing(p, productDiscounts));

  // Aplicar proxy CDN a todas las imágenes de los productos
  products.forEach(proxyProductImages);

  const result = {
    products,
    total,
    page: parsedPage,
    totalPages: Math.ceil(total / parsedLimit),
  };

  // 2. Guardar en memoria LRU para siguientes peticiones idénticas
  setCachedProducts(tenantId, query, result);

  return result;
};

const getBySlug = async (tenantId, slug, storeSettings) => {
  if (!tenantId || !slug) {
    throw Object.assign(new Error("Parámetros inválidos"), { status: 400 });
  }

  const product = await Product.findOne({
    where: { tenantId, slug, status: "active" },
    include: [
      { model: Category, as: "category", attributes: ["id", "name", "slug"] },
      skuInclude,
      {
        model: TagValue,
        as: "tagValues",
        include: [{ model: Tag, as: "tag" }],
      },
    ],
  });

  if (!product) {
    throw Object.assign(new Error("Producto no encontrado"), { status: 404 });
  }

  const autoCalculate = storeSettings?.autoCalculateUnitPrices ?? true;

  applyUnitPricing(product, autoCalculate);

  const discounts = await getActiveDiscounts(tenantId);
  const productDiscounts = discounts.filter((d) => d.type !== "cart_total");
  resolveProductPricing(product, productDiscounts);

  // Aplicar proxy CDN a las imágenes del producto individual
  proxyProductImages(product);

  try {
    product.description = sanitizeDescription(product.description);
  } catch (sanitizeErr) {
    console.error(
      "[PRODUCTS SVC getBySlug] sanitizeDescription ERROR:",
      sanitizeErr.message,
      sanitizeErr.stack,
    );
    product.description = product.description || "";
  }

  return product;
};

const getFeaturedProducts = async (tenantId, config = {}) => {
  const mode = config.mode || "auto"; // "manual" | "tag" | "auto"
  const limit = config.limit || 8;

  // CASO 1: Selección manual explícita por IDs
  if (mode === "manual" && config.productIds?.length) {
    const products = await Product.findAll({
      where: {
        tenantId,
        id: config.productIds,
        status: "active",
      },
      include: defaultProductIncludes, // Categorías, imágenes, tags, etc.
    });
    if (products.length > 0) return products;
  }

  // CASO 2: Tag específico (si está configurado)
  if (mode === "tag" && config.tagName) {
    const products = await Product.findAll({
      where: { tenantId, status: "active" },
      include: [
        ...defaultProductIncludes,
        {
          model: TagValue,
          required: true,
          include: [
            {
              model: Tag,
              as: "tag",
              where: { name: { [Op.iLike]: config.tagName } },
            },
          ],
        },
      ],
      limit,
    });
    if (products.length > 0) return products;
  }

  // CASO 3: Los Más Pedidos (Top Sales por OrderItems)
  // Agrupamos OrderItems de órdenes confirmadas/entregadas de ese tenant
  // const topSold = await OrderItem.findAll({
  //   attributes: [
  //     "productId",
  //     [sequelize.fn("COUNT", sequelize.col("id")), "salesCount"],
  //   ],
  //   include: [
  //     {
  //       model: Order,
  //       attributes: [],
  //       where: { tenantId, status: { [Op.notIn]: ["cancelled", "refunded"] } },
  //     },
  //   ],
  //   group: ["productId"],
  //   order: [[sequelize.literal('"salesCount"'), "DESC"]],
  //   limit,
  // });

  // const topProductIds = topSold.map((item) => item.productId).filter(Boolean);

  // if (topProductIds.length > 0) {
  //   featured = await Product.findAll({
  //     where: {
  //       tenantId,
  //       id: topProductIds,
  //       status: "active",
  //     },
  //     include: defaultProductIncludes,
  //   });
  // }

  let featured = [];
  // FALLBACK FINAL: Si no hay ventas suficientes (tienda nueva), traer los últimos creados
  if (featured.length < 4) {
    const remainingLimit = limit - featured.length;
    const existingIds = featured.map((p) => p.id);

    const recent = await Product.findAll({
      where: {
        tenantId,
        status: "active",
        id: { [Op.notIn]: existingIds },
      },
      order: [["createdAt", "DESC"]],
      limit: remainingLimit,
      include: defaultProductIncludes,
    });

    featured = [...featured, ...recent];
  }

  return featured;
};

module.exports = { list, getBySlug, getFeaturedProducts };
