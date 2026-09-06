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

const { resolveDiscountFields } = require('../../utils/discount')
const { generateSkuCode } = require('../../utils/skuGenerator')
const { applyUnitPricing } = require('../../utils/unitPricing')

const skuInclude = {
  model: ProductSku,
  as: "skus",
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

const list = async (query = {}) => {
  const { page = 1, limit = 20, search, categoryId, status, tagId } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where[require("sequelize").Op.or] = [
      { name: { [require("sequelize").Op.iLike]: `%${search}%` } },
      { description: { [require("sequelize").Op.iLike]: `%${search}%` } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;

  const include = [
    { model: Category, as: "category", attributes: ["id", "name", "slug"] },
    skuInclude,
    { model: TagValue, as: "tagValues", include: [{ model: Tag, as: "tag" }] },
  ];

  if (tagId) {
    include[2].where = { id: Number(tagId) };
  }

  const { count, rows } = await Product.findAndCountAll({
    where,
    include,
    distinct: true,
    order: [["name", "ASC"]],
    limit: Number(limit),
    offset,
  });

  rows.forEach(applyUnitPricing);

  return {
    products: rows,
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / limit),
  };
};

const getById = async (id) => {
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw Object.assign(new Error("ID de producto inválido"), { status: 400 });
  }
  const product = await Product.findByPk(numericId, {
    include: [
      { model: Category, as: "category", attributes: ["id", "name", "slug"] },
      skuInclude,
      { model: TagValue, as: "tagValues", include: [{ model: Tag, as: "tag" }] },
    ],
  });
  if (!product) {
    throw Object.assign(new Error("Producto no encontrado"), { status: 404 });
  }
  applyUnitPricing(product);
  return product;
};

const applySyncPrices = (product, skus) => {
  const activeSkus = skus.filter(s => s.status !== 'draft')
  if (activeSkus.length === 0) return
  const retailPrices = activeSkus.map(s => Number(s.retailPrice)).filter(p => p > 0)
  if (retailPrices.length) product.retailPrice = Math.min(...retailPrices)
  const wholesalePrices = activeSkus.filter(s => Number(s.wholesalePrice) > 0)
  if (wholesalePrices.length) {
    product.wholesalePrice = Math.min(...wholesalePrices.map(s => Number(s.wholesalePrice)))
    product.wholesaleMinQty = Math.max(...wholesalePrices.map(s => Number(s.wholesaleMinQty) || 1))
  }
}

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 255);
};

const syncSkus = async (productId, skus = [], basePrices, transaction) => {
  const skuIds = [];

  for (const s of skus) {
    const skuData = {
      productId: productId,
      retailPrice: s.retailPrice != null ? s.retailPrice : (basePrices?.retailPrice ?? 0),
      wholesalePrice: s.wholesalePrice ?? basePrices?.wholesalePrice ?? null,
      wholesaleMinQty: s.wholesaleMinQty ?? basePrices?.wholesaleMinQty ?? null,
      stock: s.stock ?? 0,
      sku: s.sku ?? null,
      images: s.images ?? [],
      sortOrder: s.sortOrder ?? 0,
      status: s.status || "active",
    };

    let sku;
    if (s.id) {
      sku = await ProductSku.findByPk(s.id, { transaction });
      if (sku && sku.productId === productId) {
        await sku.update(skuData, { transaction });
      } else {
        sku = await ProductSku.create(skuData, { transaction });
      }
    } else {
      sku = await ProductSku.create(skuData, { transaction });
    }

    skuIds.push(sku.id);

    if (s.attributeValueIds && Array.isArray(s.attributeValueIds)) {
      const currentLinks = await sku.getAttributeValues({ transaction });
      const currentIds = currentLinks.map((v) => v.id);
      const toAdd = s.attributeValueIds.filter(
        (id) => !currentIds.includes(id),
      );
      const toRemove = currentIds.filter(
        (id) => !s.attributeValueIds.includes(id),
      );

      if (toRemove.length > 0) {
        await sku.removeAttributeValues(toRemove, { transaction });
      }
      if (toAdd.length > 0) {
        await sku.addAttributeValues(toAdd, { transaction });
      }
    }
  }

  await ProductSku.destroy({
    where: { productId, id: { [require("sequelize").Op.notIn]: skuIds } },
    transaction,
  });
};

const create = async (data) => {
  if (!data.slug && data.name) {
    data.slug = slugify(data.name);
  }

  if (data.slug) {
    const existing = await Product.findOne({ where: { slug: data.slug } });
    if (existing) {
      throw Object.assign(new Error('Ya existe un producto con ese slug'), { status: 400 });
    }
  }

  const { comparePrice, discountPercentage } = resolveDiscountFields(
    data.retailPrice,
    data.comparePrice,
    data.discountPercentage,
  );
  data.comparePrice = comparePrice;
  data.discountPercentage = discountPercentage;

  const { skus, tagIds, stock, ...productData } = data;

  const result = await sequelize.transaction(async (t) => {
    const product = await Product.create(productData, { transaction: t });
    if (tagIds && tagIds.length > 0) {
      await product.setTagValues(tagIds, { transaction: t });
    }
    if (skus && skus.length > 0) {
      const basePrices = { retailPrice: product.retailPrice, wholesalePrice: product.wholesalePrice, wholesaleMinQty: product.wholesaleMinQty }
      await syncSkus(product.id, skus, basePrices, t);
      const allAttrIds = skus.flatMap(s => s.attributeValueIds || []).filter(Boolean)
      let hasUnitType = false
      if (allAttrIds.length > 0) {
        const vals = await AttributeValue.findAll({
          where: { id: allAttrIds },
          include: [{ model: Attribute, as: 'attribute', attributes: ['unitType'] }],
          transaction: t
        })
        hasUnitType = vals.some(v => v.attribute?.unitType)
      }
      if (!hasUnitType) {
        applySyncPrices(product, skus)
        await product.save({ transaction: t })
      }
    } else {
      // Producto simple: crear/actualizar SKU base
      const [baseSku] = await ProductSku.findOrCreate({
        where: { productId: product.id },
        defaults: {
          productId: product.id,
          retailPrice: product.retailPrice || 0,
          wholesalePrice: product.wholesalePrice,
          wholesaleMinQty: product.wholesaleMinQty,
          stock: stock != null ? Number(stock) : 0, sku: null, images: [], sortOrder: 0, status: 'active',
        },
        transaction: t,
      })
      if (!baseSku._options?.isNewRecord) {
        await baseSku.update({
          retailPrice: product.retailPrice || 0,
          wholesalePrice: product.wholesalePrice,
          wholesaleMinQty: product.wholesaleMinQty,
          ...(stock != null && { stock: Number(stock) }),
        }, { transaction: t })
      }
      // Asegurar que no tenga attributeValues (es base)
      await baseSku.setAttributeValues([], { transaction: t })
    }
    return Product.findByPk(product.id, {
      include: [skuInclude],
      transaction: t,
    });
  });

  return result;
};

const update = async (id, data) => {
  const product = await getById(id);
  if (!data.slug && data.name) {
    data.slug = slugify(data.name);
  }

  if (data.slug && data.slug !== product.slug) {
    const existing = await Product.findOne({ where: { slug: data.slug } })
    if (existing && existing.id !== product.id) {
      throw Object.assign(new Error('Ya existe un producto con ese slug'), { status: 400 })
    }
  }

  const { comparePrice, discountPercentage } = resolveDiscountFields(
    data.retailPrice ?? product.retailPrice,
    data.comparePrice,
    data.discountPercentage,
  );
  data.comparePrice = comparePrice;
  data.discountPercentage = discountPercentage;

  const { skus, tagIds, stock, ...productData } = data;

  const result = await sequelize.transaction(async (t) => {
    await product.update(productData, { transaction: t });
    if (tagIds !== undefined) {
      await product.setTagValues(tagIds, { transaction: t });
    }
    if (skus && skus.length > 0) {
      const basePrices = { retailPrice: product.retailPrice, wholesalePrice: product.wholesalePrice, wholesaleMinQty: product.wholesaleMinQty }
      await syncSkus(product.id, skus, basePrices, t);
      const allAttrIds = skus.flatMap(s => s.attributeValueIds || []).filter(Boolean)
      let hasUnitType = false
      if (allAttrIds.length > 0) {
        const vals = await AttributeValue.findAll({
          where: { id: allAttrIds },
          include: [{ model: Attribute, as: 'attribute', attributes: ['unitType'] }],
          transaction: t
        })
        hasUnitType = vals.some(v => v.attribute?.unitType)
      }
      if (!hasUnitType) {
        applySyncPrices(product, skus)
        await product.save({ transaction: t })
      }
    } else {
      // Producto simple: destruir SKUs viejos (incluye variantes) y crear el SKU base
      await ProductSku.destroy({ where: { productId: product.id }, transaction: t })
      await ProductSku.create({
        productId: product.id,
        retailPrice: product.retailPrice || 0,
        wholesalePrice: product.wholesalePrice,
        wholesaleMinQty: product.wholesaleMinQty,
        stock: stock != null ? Number(stock) : 0,
        sku: null,
        images: [],
        sortOrder: 0,
        status: 'active',
      }, { transaction: t })
    }
    return Product.findByPk(id, { include: [skuInclude], transaction: t });
  });

  return result;
};

const remove = async (id) => {
  const product = await getById(id);
  return product.destroy();
};

const toggleStatus = async (id, status) => {
  const product = await Product.findByPk(id);
  if (!product) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  await product.update({ status });
  return product;
};

const CHUNK = 150;

const bulkCreate = async (products, categoryId) => {
  const hasVariants = products.some(p => p.skus?.length > 0)

  if (!hasVariants) {
    // Fast path: productos simples, bulkCreate
    const existingSlugs = new Set(
      (await Product.findAll({ attributes: ["slug"] })).map((p) => p.slug),
    )
    const used = new Set([...existingSlugs])
    const warnings = []

    const rows = products.map((p) => {
      const base = p.slug || slugify(p.name)
      let slug = base
      let suffix = 97
      while (used.has(slug)) { slug = `${base}-${String.fromCharCode(suffix)}`; suffix++ }
      used.add(slug)
      if (slug !== base) warnings.push({ name: p.name, slug })
      const retailPrice = Number(p.price) || 0
      const { comparePrice, discountPercentage } = resolveDiscountFields(retailPrice, p.comparePrice, p.discountPercentage)
      return {
        name: p.name, slug, retailPrice, status: "draft", categoryId: categoryId || null,
        ...(p.description != null && p.description !== "" && { description: String(p.description) }),
        ...(discountPercentage != null && { discountPercentage }),
        ...(comparePrice != null && { comparePrice }),
        ...(p.wholesalePrice != null && p.wholesalePrice !== "" && { wholesalePrice: Number(p.wholesalePrice) }),
        ...(p.wholesaleMinQty != null && p.wholesaleMinQty !== "" && { wholesaleMinQty: Number(p.wholesaleMinQty) }),
        ...(p.images && { images: Array.isArray(p.images) ? p.images : [p.images] }),
      }
    })

    const t = await sequelize.transaction()
    try {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK)
        const chunkProducts = products.slice(i, i + CHUNK)
        const created = await Product.bulkCreate(chunk, { validate: true, transaction: t })
        await ProductSku.bulkCreate(created.map((p, idx) => ({
          productId: p.id, retailPrice: p.retailPrice || 0,
          wholesalePrice: p.wholesalePrice || null, wholesaleMinQty: p.wholesaleMinQty || null,
          stock: chunkProducts[idx]?.stock ?? 0, sku: chunkProducts[idx]?.sku || null, images: [], sortOrder: 0, status: "active",
        })), { transaction: t })
      }
      await t.commit()
    } catch (err) { await t.rollback(); throw err }
    return { created: rows.length, warnings, createdAttributes: [] }
  }

  // Slow path: productos con variantes, create individual + findOrCreate attributes
  const existingSlugs = new Set((await Product.findAll({ attributes: ["slug"] })).map((p) => p.slug))
  const used = new Set([...existingSlugs])
  const warnings = []
  const createdAttributes = []
  let createdCount = 0

  const t = await sequelize.transaction()
  try {
    for (const p of products) {
      // Slug
      const base = p.slug || slugify(p.name)
      let slug = base
      let suffix = 97
      while (used.has(slug)) { slug = `${base}-${String.fromCharCode(suffix)}`; suffix++ }
      used.add(slug)
      if (slug !== base) warnings.push({ name: p.name, slug })

      const retailPrice = Number(p.price) || 0
      const { comparePrice, discountPercentage } = resolveDiscountFields(retailPrice, p.comparePrice, p.discountPercentage)

      const productData = {
        name: p.name, slug, retailPrice, status: "draft", categoryId: categoryId || null,
        ...(p.description != null && p.description !== "" && { description: String(p.description) }),
        ...(discountPercentage != null && { discountPercentage }),
        ...(comparePrice != null && { comparePrice }),
        ...(p.wholesalePrice != null && p.wholesalePrice !== "" && { wholesalePrice: Number(p.wholesalePrice) }),
        ...(p.wholesaleMinQty != null && p.wholesaleMinQty !== "" && { wholesaleMinQty: Number(p.wholesaleMinQty) }),
        ...(p.images && { images: Array.isArray(p.images) ? p.images : [p.images] }),
      }
      const product = await Product.create(productData, { transaction: t })
      createdCount++

      const basePrices = { retailPrice, wholesalePrice: productData.wholesalePrice, wholesaleMinQty: productData.wholesaleMinQty }

      if (p.skus?.length > 0) {
        // Build resolvedAttributes for SKU code generation
        const resolvedAttributes = []
        const skuList = []
        const allAttrIds = []
        for (const sku of p.skus) {
          const attributeValueIds = []
          if (sku.attrValues?.length > 0) {
            for (const { attrName, value } of sku.attrValues) {
              const [attr, attrCreated] = await Attribute.findOrCreate({
                where: { name: { [require('sequelize').Op.iLike]: attrName } },
                defaults: { name: attrName, sortOrder: 0 },
                transaction: t,
              })
              if (attrCreated && !createdAttributes.includes(attr.name)) {
                createdAttributes.push(attr.name)
              }
              const [attrValue] = await AttributeValue.findOrCreate({
                where: { attributeId: attr.id, value: { [require('sequelize').Op.iLike]: value } },
                defaults: { attributeId: attr.id, value, sortOrder: 0 },
                transaction: t,
              })
              attributeValueIds.push(attrValue.id)
              // Track for SKU code generation
              let resolved = resolvedAttributes.find(a => a.id === attr.id)
              if (!resolved) { resolved = { id: attr.id, name: attr.name, values: [] }; resolvedAttributes.push(resolved) }
              if (!resolved.values.find(v => v.id === attrValue.id)) resolved.values.push({ id: attrValue.id, value: attrValue.value })
            }
          }
          allAttrIds.push(...attributeValueIds)
          skuList.push({
            retailPrice: sku.retailPrice != null ? sku.retailPrice : retailPrice,
            wholesalePrice: sku.wholesalePrice ?? basePrices.wholesalePrice,
            wholesaleMinQty: sku.wholesaleMinQty ?? basePrices.wholesaleMinQty,
            stock: sku.stock || 0,
            sku: sku.sku?.trim() || (attributeValueIds.length > 0 ? generateSkuCode(product.name, attributeValueIds, resolvedAttributes) : null),
            images: sku.images || [],
            sortOrder: sku.sortOrder || 0,
            status: sku.status || 'active',
            attributeValueIds,
          })
        }
        await syncSkus(product.id, skuList, basePrices, t)

        let hasUnitType = false
        if (allAttrIds.length > 0) {
          const vals = await AttributeValue.findAll({
            where: { id: allAttrIds },
            include: [{ model: Attribute, as: 'attribute', attributes: ['unitType'] }],
            transaction: t,
          })
          hasUnitType = vals.some(v => v.attribute?.unitType)
        }
        if (!hasUnitType) {
          applySyncPrices(product, skuList)
          await product.save({ transaction: t })
        }
      } else {
        // Producto simple con variantes en el batch → SKU base
        await ProductSku.create({
          productId: product.id, retailPrice: retailPrice || 0,
          wholesalePrice: productData.wholesalePrice || null,
          wholesaleMinQty: productData.wholesaleMinQty || null,
          stock: p.stock ?? 0, sku: p.sku || null, images: [], sortOrder: 0, status: 'active',
        }, { transaction: t })
      }
    }
    await t.commit()
  } catch (err) { await t.rollback(); throw err }

  return { created: createdCount, warnings, createdAttributes }
};

const productHasOnlyUnitAttributes = (product) => {
  const skus = product.skus || []
  if (skus.length === 0) return false
  for (const sku of skus) {
    for (const av of sku.attributeValues || []) {
      if (!av.attribute?.unitType) return false
    }
  }
  return skus.some(s => (s.attributeValues || []).length > 0 && s.attributeValues.some(av => av.attribute?.unitType))
}

const exportToExcel = async () => {
  const products = await Product.findAll({
    order: [['name', 'ASC']],
    include: [
      skuInclude,
      { model: Category, as: 'category', attributes: ['name'] },
    ],
  })

  let maxAttrs = 0
  const variantsInfo = []

  for (const p of products) {
    const skus = p.skus || []
    const allValues = skus.flatMap(s => s.attributeValues || [])
    const hasSkus = allValues.length > 0
    const onlyUnit = productHasOnlyUnitAttributes(p)

    if (hasSkus && !onlyUnit) {
      const attrNames = [...new Set(allValues.map(av => av.attribute?.name).filter(Boolean))]
      maxAttrs = Math.max(maxAttrs, attrNames.length)
      variantsInfo.push({
        product: p,
        isVariant: true,
        skus,
        attrNames,
      })
    } else {
      variantsInfo.push({
        product: p,
        isVariant: false,
        sku: skus[0] || null,
      })
    }
  }

  const attrHeaders = []
  for (let i = 1; i <= maxAttrs; i++) {
    attrHeaders.push(`atributo_${i}`)
    attrHeaders.push(`valor_${i}`)
  }

  const headers = [
    'slug', 'nombre', 'categoria', 'precio', 'precio_mayorista',
    'cantidad_mayorista', 'descuento', 'precio_comparacion',
    'descripcion', 'stock', 'sku', 'imagen',
    ...attrHeaders,
  ]

  const rows = []

  for (const info of variantsInfo) {
    const p = info.product

    if (info.isVariant) {
      for (const s of info.skus) {
        const avs = s.attributeValues || []
        const attrMap = {}
        for (const av of avs) {
          if (av.attribute?.name) attrMap[av.attribute.name] = av.value
        }

        const row = [
          p.slug, p.name, p.category?.name || '',
          Number(s.retailPrice) || 0, Number(s.wholesalePrice) || '',
          s.wholesaleMinQty ?? '', p.discountPercentage ?? '',
          Number(p.comparePrice) || '', p.description || '',
          s.stock ?? 0, s.sku || '', (s.images?.[0] || ''),
        ]

        for (const attrName of info.attrNames) {
          row.push(attrName)
          row.push(attrMap[attrName] || '')
        }
        for (let i = info.attrNames.length; i < maxAttrs; i++) {
          row.push('', '')
        }

        rows.push(row)
      }
    } else {
      const sku = info.sku
      const row = [
        p.slug, p.name, p.category?.name || '',
        Number(p.retailPrice) || 0, Number(p.wholesalePrice) || '',
        p.wholesaleMinQty ?? '', p.discountPercentage ?? '',
        Number(p.comparePrice) || '', p.description || '',
        sku?.stock ?? 0, sku?.sku || '', (p.images?.[0] || ''),
      ]
      for (let i = 0; i < maxAttrs; i++) {
        row.push('', '')
      }

      rows.push(row)
    }
  }

  const XLSX = require('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Productos')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return buffer
}

const FIELD_TO_PRODUCT_KEY = {
  retailPrice: 'retailPrice',
  wholesalePrice: 'wholesalePrice',
  wholesaleMinQty: 'wholesaleMinQty',
  discountPercentage: 'discountPercentage',
  comparePrice: 'comparePrice',
  description: 'description',
  images: 'images',
}

const FIELD_TO_SKU_KEY = {
  retailPrice: 'retailPrice',
  wholesalePrice: 'wholesalePrice',
  wholesaleMinQty: 'wholesaleMinQty',
  stock: 'stock',
  sku: 'sku',
  images: 'images',
}

const STRING_FIELDS = ['description', 'sku']

const BULK_CHUNK = 1000

function normalizeValue(field, val) {
  if (val == null || val === '') return null
  if (STRING_FIELDS.includes(field)) return String(val).trim()
  if (field === 'images') return Array.isArray(val) ? (val[0] || '') : String(val)
  return Number(val)
}

function toDbValue(field, val) {
  if (val == null) {
    if (field === 'images') return []
    if (field === 'sku') return null
    return null
  }
  if (field === 'images') return Array.isArray(val) ? val : [val]
  if (STRING_FIELDS.includes(field)) return String(val)
  return Number(val)
}

function matchSkuByAttrValues(dbSkus, attrValues) {
  if (!attrValues?.length) return dbSkus?.[0] || null
  for (const sku of dbSkus || []) {
    const avs = sku.attributeValues || []
    const match = attrValues.every(({ attrName, value }) =>
      avs.some(av =>
        av.attribute?.name?.toLowerCase() === attrName.toLowerCase() &&
        av.value?.toString().toLowerCase() === value.toString().toLowerCase()
      )
    )
    if (match) return sku
  }
  return null
}

function buildProductUpdate(field, newValue, product) {
  if (field === 'discountPercentage') {
    const pct = Number(newValue)
    if (!isNaN(pct) && pct > 0) {
      const { comparePrice, discountPercentage } = resolveDiscountFields(
        Number(product.retailPrice) || 0,
        product.comparePrice,
        pct,
      )
      return { discountPercentage, comparePrice }
    }
    return { discountPercentage: null }
  }
  if (field === 'comparePrice') {
    const { comparePrice } = resolveDiscountFields(
      Number(product.retailPrice) || 0,
      newValue,
      product.discountPercentage,
    )
    return { comparePrice }
  }
  return { [field]: toDbValue(field, newValue) }
}

const previewDiff = async (field, products) => {
  const productKey = FIELD_TO_PRODUCT_KEY[field]
  const skuKey = FIELD_TO_SKU_KEY[field]

  const allSlugs = [...new Set(products.map(p => p.slug).filter(Boolean))]
  const diffs = []

  for (let i = 0; i < allSlugs.length; i += BULK_CHUNK) {
    const chunkSlugs = allSlugs.slice(i, i + BULK_CHUNK)
    const existing = await Product.findAll({
      where: { slug: chunkSlugs },
      include: [skuInclude],
    })
    const productMap = {}
    for (const p of existing) productMap[p.slug] = p

    const chunkItems = products.filter(p => chunkSlugs.includes(p.slug))

    for (const item of chunkItems) {
      const product = productMap[item.slug]
      if (!product) continue

      const isUnitType = productHasOnlyUnitAttributes(product)
      const hasSkuData = item.skus?.length > 0 && !isUnitType

      if (hasSkuData) {
        const skuDiffs = []
        for (const skuData of item.skus) {
          const dbSku = matchSkuByAttrValues(product.skus, skuData.attrValues)
          if (!dbSku) continue
          if (!skuKey) continue
          const oldValue = normalizeValue(field, dbSku[skuKey])
          const newValue = normalizeValue(field, skuData.value)
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            skuDiffs.push({ attrValues: skuData.attrValues || [], oldValue, newValue })
          }
        }
        if (skuDiffs.length > 0) {
          diffs.push({ slug: item.slug, name: product.name, skus: skuDiffs })
        }
      } else {
        const oldValue = productKey
          ? normalizeValue(field, product[productKey])
          : (skuKey && product.skus?.length ? normalizeValue(field, product.skus[0][skuKey]) : null)
        const newValue = normalizeValue(field, item.value)
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          diffs.push({ slug: item.slug, name: product.name, oldValue, newValue })
        }
      }
    }
  }

  return { field, total: products.length, diffs }
}

const bulkUpdate = async (field, products) => {
  const productKey = FIELD_TO_PRODUCT_KEY[field]
  const skuKey = FIELD_TO_SKU_KEY[field]

  const allSlugs = [...new Set(products.map(p => p.slug).filter(Boolean))]
  if (allSlugs.length === 0) {
    throw Object.assign(new Error('No se encontraron slugs válidos en los datos'), { status: 400 })
  }

  let updated = 0
  let skipped = 0
  const warnings = []

  for (let i = 0; i < allSlugs.length; i += BULK_CHUNK) {
    const chunkSlugs = allSlugs.slice(i, i + BULK_CHUNK)
    const existing = await Product.findAll({
      where: { slug: chunkSlugs },
      include: [skuInclude],
    })
    const productMap = {}
    for (const p of existing) productMap[p.slug] = p

    const chunkItems = products.filter(p => chunkSlugs.includes(p.slug))

    const t = await sequelize.transaction()
    try {
      for (const item of chunkItems) {
        const product = productMap[item.slug]
        if (!product) {
          skipped++
          warnings.push({ slug: item.slug, reason: 'Producto no encontrado' })
          continue
        }

        const isUnitType = productHasOnlyUnitAttributes(product)
        const hasSkuData = item.skus?.length > 0 && !isUnitType

        if (hasSkuData) {
          let conflict = false
          for (const skuData of item.skus) {
            const dbSku = matchSkuByAttrValues(product.skus, skuData.attrValues)
            if (!dbSku) {
              warnings.push({ slug: item.slug, reason: 'SKU no encontrado (atributos no coinciden)' })
              conflict = true
              continue
            }
            if (!skuKey) continue
            const current = normalizeValue(field, dbSku[skuKey])
            const oldVal = normalizeValue(field, skuData.oldValue)
            if (JSON.stringify(current) !== JSON.stringify(oldVal)) {
              warnings.push({ slug: item.slug, reason: 'El valor fue modificado por otro usuario' })
              conflict = true
              continue
            }
            await dbSku.update({ [skuKey]: toDbValue(field, skuData.newValue) }, { transaction: t })
          }

          if (conflict) {
            skipped++
            continue
          }

          if (productKey && (field === 'retailPrice' || field === 'wholesalePrice' || field === 'wholesaleMinQty')) {
            applySyncPrices(product, product.skus)
            await product.save({ transaction: t })
          }
          updated++
        } else {
          const current = productKey
            ? normalizeValue(field, product[productKey])
            : (skuKey && product.skus?.length ? normalizeValue(field, product.skus[0][skuKey]) : null)
          const oldVal = normalizeValue(field, item.oldValue)
          if (JSON.stringify(current) !== JSON.stringify(oldVal)) {
            warnings.push({ slug: item.slug, reason: 'El valor fue modificado por otro usuario' })
            skipped++
            continue
          }

          if (productKey) {
            const productUpdates = buildProductUpdate(field, item.newValue, product)
            if (Object.keys(productUpdates).length > 0) {
              await product.update(productUpdates, { transaction: t })
            }
          }

          if (skuKey && product.skus?.length) {
            await product.skus[0].update({ [skuKey]: toDbValue(field, item.newValue) }, { transaction: t })
          }

          updated++
        }
      }
      await t.commit()
    } catch (err) {
      await t.rollback()
      throw err
    }
  }

  return { updated, skipped, warnings }
}

const systemUpdate = async (field, value, productIds) => {
  const productKey = FIELD_TO_PRODUCT_KEY[field]
  const skuKey = FIELD_TO_SKU_KEY[field]

  let updated = 0
  let skipped = 0
  const warnings = []

  for (let i = 0; i < productIds.length; i += BULK_CHUNK) {
    const chunkIds = productIds.slice(i, i + BULK_CHUNK)
    const products = await Product.findAll({
      where: { id: chunkIds },
      include: [skuInclude],
    })

    const t = await sequelize.transaction()
    try {
      for (const product of products) {
        if (field === 'status') {
          await product.update({ status: value }, { transaction: t })
          updated++
          continue
        }

        if (field === 'categoryId') {
          await product.update({ categoryId: value == null ? null : Number(value) }, { transaction: t })
          updated++
          continue
        }

        const hasRealVariants =
          (product.skus || []).some(s => (s.attributeValues || []).length > 0) &&
          !productHasOnlyUnitAttributes(product)

        if (hasRealVariants) {
          skipped++
          warnings.push({ slug: product.slug, reason: 'Producto con variantes, editar individualmente' })
          continue
        }

        if (productKey) {
          const updates = buildProductUpdate(field, value, product)
          if (Object.keys(updates).length > 0) {
            await product.update(updates, { transaction: t })
          }
        }

        if (skuKey && product.skus?.length) {
          await product.skus[0].update({ [skuKey]: toDbValue(field, value) }, { transaction: t })
        }

        updated++
      }
      await t.commit()
    } catch (err) {
      await t.rollback()
      throw err
    }
  }

  return { updated, skipped, warnings }
}

module.exports = { list, getById, create, update, remove, toggleStatus, bulkCreate, exportToExcel, previewDiff, bulkUpdate, systemUpdate };
