// @ts-nocheck
import * as XLSX from "xlsx";

export const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 255) || "sin-nombre";

export const normalizeKey = (text) =>
  (text ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

export const UPDATE_FIELDS = [
  { key: "retailPrice", label: "Precio", productField: "price" },
  {
    key: "wholesalePrice",
    label: "Precio mayorista",
    productField: "wholesalePrice",
  },
  {
    key: "wholesaleMinQty",
    label: "Cant. mín. mayorista",
    productField: "wholesaleMinQty",
  },
  {
    key: "discountPercentage",
    label: "% Descuento",
    productField: "discountPercentage",
  },
  {
    key: "comparePrice",
    label: "Precio de comparación",
    productField: "comparePrice",
  },
  { key: "description", label: "Descripción", productField: "description" },
  { key: "stock", label: "Stock", productField: "stock" },
  { key: "sku", label: "Código SKU", productField: "sku" },
  // { key: "tags", label: "Etiquetas / Tags", productField: "tags" },
  { key: "images", label: "Imágenes", productField: "images" },
];

export const FIELD_UPDATE_LABELS = Object.fromEntries(
  UPDATE_FIELDS.map((f) => [f.key, f.label]),
);

export const SYSTEM_FIELDS = [
  ...UPDATE_FIELDS,
  { key: "status", label: "Estado", inputType: "status" },
  { key: "categoryId", label: "Categoría", inputType: "category" },
];
export const NAME_ALIASES = [
  "nombre",
  "name",
  "producto",
  "product",
  "product_name",
  "producto_nombre",
];
export const PRICE_ALIASES = [
  "precio",
  "price",
  "importe",
  "costo",
  "valor",
  "retail_price",
  "precio_venta",
];
export const SLUG_ALIASES = [
  "slug",
  "id",
  "identificador",
  "codigo_producto",
  "codigo",
];

export const OPTIONAL_FIELDS = [
  {
    key: "category",
    label: "Categoría",
    aliases: ["categoria", "category", "rubro"],
  },
  {
    key: "description",
    label: "Descripción",
    aliases: ["descripcion", "description", "desc", "detalle"],
  },
  {
    key: "discountPercentage",
    label: "% Descuento",
    aliases: ["descuento", "discount", "porcentaje", "off"],
  },
  {
    key: "comparePrice",
    label: "Precio de comparación",
    aliases: [
      "precio_original",
      "compare_price",
      "precio_anterior",
      "precio_comparacion",
    ],
  },
  {
    key: "wholesalePrice",
    label: "Precio mayorista",
    aliases: ["mayorista", "wholesale", "precio_mayorista"],
  },
  {
    key: "wholesaleMinQty",
    label: "Cant. mín. mayorista",
    aliases: [
      "unidades_mayorista",
      "wholesale_min",
      "cantidad_mayorista",
      "min_mayorista",
    ],
  },
  {
    key: "stock",
    label: "Stock",
    aliases: ["stock", "cantidad", "inventario", "disponible"],
  },
  {
    key: "sku",
    label: "Código SKU",
    aliases: ["sku", "codigo", "code", "cod"],
  },
  {
    key: "tags",
    label: "Etiquetas / Tags",
    aliases: ["tags", "etiquetas", "tag"],
  },
  {
    key: "images",
    label: "Imágenes (URLs)",
    aliases: ["imagenes", "imagen", "image", "images", "fotos", "foto", "img"],
  },
  { key: "status", label: "Estado", aliases: ["estado", "status", "activo"] },
];

export const ATTR_COL_PATTERN = /^(atributo|attr)[\s_-]?(\d+)$/i;
export const VAL_COL_PATTERN = /^(valor|val)[\s_-]?(\d+)$/i;

// Helper para parsear imágenes (soporta una o varias URLs separadas por coma/punto y coma o formato JSON)
export function parseImageUrls(raw) {
  if (!raw) return [];
  const val = String(raw).trim();
  if (val.startsWith("[")) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }
  return val
    .split(/[,;\n]+/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http"));
}

// Helper para parsear tags separados por coma
export function parseTagsList(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function detectColumn(headers, aliases) {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.findIndex((h) => h === alias || h.includes(alias));
    if (idx !== -1) return headers[idx];
  }
  return "";
}

export function parseProducts(
  rawData,
  nameCol,
  priceCol,
  optionals,
  attrPairs,
  opts = {},
) {
  const { slugCol = "", typeCol = "tipo" } = opts;
  const products = [];
  const errors = [];
  const grouped = {};

  rawData.rows.forEach((row, i) => {
    const name = String(row[nameCol] ?? "").trim();
    const price = row[priceCol];

    if (!name) {
      errors.push(`Fila ${i + 2}: falta el nombre`);
      return;
    }
    if (
      price == null ||
      price === "" ||
      isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      errors.push(`Fila ${i + 2}: "${name}" — precio inválido`);
      return;
    }

    const excelSlug = slugCol ? String(row[slugCol] ?? "").trim() : "";
    const key = normalizeKey(excelSlug || name);

    // Identificar si la fila es PRODUCTO o VARIANTE
    const rowType = String(row[typeCol] || row["tipo"] || "")
      .trim()
      .toUpperCase();
    const isExplicitParent = rowType === "PRODUCTO";
    const isExplicitVariant = rowType === "VARIANTE";

    // 1. Inicializar el producto agrupado si no existe
    if (!grouped[key]) {
      grouped[key] = {
        name,
        slug: excelSlug || slugify(name),
        excelSlug: excelSlug || undefined,
        price: Number(price),
        retailPrice: Number(price),
        skus: [],
      };

      for (const { key: fKey } of OPTIONAL_FIELDS) {
        const col = optionals[fKey];
        if (!col || row[col] == null || row[col] === "") continue;

        if (fKey === "images") {
          grouped[key].images = parseImageUrls(row[col]);
        } else if (fKey === "tags") {
          grouped[key].tags = parseTagsList(row[col]);
        } else if (
          ["description", "sku", "category", "status"].includes(fKey)
        ) {
          grouped[key][fKey] = String(row[col]).trim();
        } else {
          const num = Number(row[col]);
          if (!isNaN(num)) grouped[key][fKey] = num;
        }
      }
    } else if (isExplicitParent) {
      // Si la fila del producto padre vino después, actualizamos el precio base oficial del producto
      grouped[key].price = Number(price);
      grouped[key].retailPrice = Number(price);
    }

    // Asegurar tags aunque vengan en filas posteriores
    const tagsCol = optionals["tags"] || "tags";
    if (
      row[tagsCol] &&
      (!grouped[key].tags || grouped[key].tags.length === 0)
    ) {
      grouped[key].tags = parseTagsList(row[tagsCol]);
    }

    // 2. Extraer variantes / atributos
    const attrValues = [];
    attrPairs.forEach(({ attrCol, valCol }) => {
      const attrName = String(row[attrCol] ?? "").trim();
      const value = String(row[valCol] ?? "").trim();
      if (attrName && value) attrValues.push({ attrName, value });
    });

    // Si tiene atributos O viene explícitamente marcada como VARIANTE, la sumamos como SKU
    if (attrValues.length > 0 || isExplicitVariant) {
      const skuImages =
        optionals["images"] && row[optionals["images"]]
          ? parseImageUrls(row[optionals["images"]])
          : [];

      grouped[key].skus.push({
        retailPrice:
          row[priceCol] != null && row[priceCol] !== ""
            ? Number(row[priceCol])
            : Number(price),
        stock:
          optionals["stock"] && row[optionals["stock"]] != null
            ? Number(row[optionals["stock"]]) || 0
            : 0,
        sku:
          optionals["sku"] && row[optionals["sku"]] != null
            ? String(row[optionals["sku"]]).trim()
            : null,
        images: skuImages,
        attrValues,
      });
    }
  });

  for (const p of Object.values(grouped)) {
    products.push(p);
  }

  return { products, errors };
}

export function parseUpdateProducts(
  rawData,
  slugCol,
  nameCol,
  priceCol,
  optionals,
  attrPairs,
  field,
  opts = {},
) {
  const { typeCol = "tipo" } = opts;
  const products = [];
  const errors = [];
  const grouped = {};

  const isSkuField = [
    "retailPrice",
    "wholesalePrice",
    "wholesaleMinQty",
    "stock",
    "sku",
    "images",
  ].includes(field);

  rawData.rows.forEach((row, i) => {
    const slug = slugCol ? String(row[slugCol] ?? "").trim() : "";
    if (!slug) {
      errors.push(`Fila ${i + 2}: falta el slug (identificador)`);
      return;
    }

    const key = slug.toLowerCase();
    const name = nameCol ? String(row[nameCol] ?? "").trim() : "";
    const rawType = String(row[typeCol] || row["tipo"] || "")
      .trim()
      .toUpperCase();

    if (!grouped[key]) {
      grouped[key] = {
        name: name || slug,
        slug,
        excelSlug: slug,
        parentValue: undefined,
        skus: [],
      };
    }

    const col = field === "retailPrice" ? priceCol : optionals[field];
    const rawVal = col ? row[col] : undefined;

    const attrValues = [];
    attrPairs.forEach(({ attrCol, valCol }) => {
      const attrName = String(row[attrCol] ?? "").trim();
      const value = String(row[valCol] ?? "").trim();
      if (attrName && value) attrValues.push({ attrName, value });
    });

    const isVariantRow =
      rawType === "VARIANTE" ||
      (rawType !== "PRODUCTO" && attrValues.length > 0);
    const isParentRow =
      rawType === "PRODUCTO" || (!isVariantRow && attrValues.length === 0);

    if (isParentRow) {
      if (rawVal !== undefined && rawVal !== "") {
        grouped[key].parentValue = rawVal;
      }
    } else if (isVariantRow && isSkuField) {
      if (rawVal !== undefined && rawVal !== "") {
        grouped[key].skus.push({ attrValues, value: rawVal });
      }
    }
  });

  for (const p of Object.values(grouped)) {
    // Si vino fila de producto base, ese valor manda
    if (p.parentValue !== undefined) {
      p.value = p.parentValue;
    }

    // Si tiene fila de producto padre, no mandamos los SKUs
    // para evitar que el backend compare fracciones contra base
    if (p.parentValue !== undefined && p.skus.length > 0) {
      delete p.skus;
    } else if (p.skus.length === 0) {
      delete p.skus;
    }

    delete p.parentValue;
    products.push(p);
  }

  return { products, errors };
}

export function downloadTemplate() {
  const headers = [
    "tipo",
    "slug",
    "nombre",
    "categoria",
    "precio",
    "precio_mayorista",
    "cantidad_mayorista",
    "descuento",
    "precio_comparacion",
    "descripcion",
    "stock",
    "sku",
    "tags",
    "imagenes",
    "estado",
    "atributo_1",
    "valor_1",
    "atributo_2",
    "valor_2",
  ];

  // 1. Producto Padre (Base para variantes o precio por unidad/kg)
  const exampleParent = [
    "PRODUCTO",
    "remera-algodon",
    "Remera Básica Algodón",
    "Indumentaria",
    15000,
    12000,
    6,
    "",
    18000,
    "Remera 100% algodón peinado",
    "", // Stock vacío en el padre (se gestiona por variante)
    "", // SKU vacío en el padre
    "Temporada: Verano, Material: Algodón",
    "https://ejemplo.com/remera-1.jpg, https://ejemplo.com/remera-2.jpg",
    "active",
    "",
    "",
    "",
    "",
  ];

  // 2. Variante A
  const exampleVariant1 = [
    "VARIANTE",
    "remera-algodon",
    "Remera Básica Algodón",
    "Indumentaria",
    15000,
    12000,
    6,
    "",
    18000,
    "Remera 100% algodón peinado",
    10,
    "REM-NEG-S",
    "Temporada: Verano, Material: Algodón",
    "https://ejemplo.com/remera-negra-s.jpg",
    "active",
    "Color",
    "Negro",
    "Talle",
    "S",
  ];

  // 3. Variante B
  const exampleVariant2 = [
    "VARIANTE",
    "remera-algodon",
    "Remera Básica Algodón",
    "Indumentaria",
    15000,
    12000,
    6,
    "",
    18000,
    "Remera 100% algodón peinado",
    5,
    "REM-NEG-M",
    "Temporada: Verano, Material: Algodón",
    "https://ejemplo.com/remera-negra-m.jpg",
    "active",
    "Color",
    "Negro",
    "Talle",
    "M",
  ];

  // 4. Producto Simple (Sin variantes)
  const exampleSimpleProduct = [
    "PRODUCTO",
    "serum-vitamina-c",
    "Serum Vitamina C 30ml",
    "Skincare",
    22000,
    18000,
    3,
    10,
    25000,
    "Serum antioxidante facial",
    25,
    "SER-VIT-30",
    "Línea: Facial, Beneficio: Antioxidante",
    "https://ejemplo.com/serum-1.jpg",
    "active",
    "",
    "",
    "",
    "",
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    headers,
    exampleParent,
    exampleVariant1,
    exampleVariant2,
    exampleSimpleProduct,
  ]);

  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, "plantilla-productos.xlsx");
}
