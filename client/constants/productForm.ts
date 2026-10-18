export const UNIT_LABEL: Record<string, string> = {
  kg: "Gr",
  m: "Cm",
  l: "Ml",
};

export const UNIT_DIVISOR: Record<string, number> = {
  kg: 1000,
  m: 100,
  l: 1000,
};

export const EMPTY_PRODUCT = {
  name: "",
  slug: "",
  description: "",
  images: [],
  retailPrice: 0,
  comparePrice: null,
  discountPercentage: null,
  wholesalePrice: null,
  wholesaleMinQty: null,
  stock: 0,
  status: "active",
  tags: [],
  categoryId: "",
};

export const EMPTY_SKU = {
  retailPrice: 0,
  wholesalePrice: null,
  wholesaleMinQty: null,
  stock: 0,
  sku: "",
  images: [],
  sortOrder: 0,
  status: "active",
  attributeValueIds: [],
};

export const PRODUCT_FORM_MESSAGES = {
  NAME_REQUIRED: "El nombre es obligatorio",
  UNSYNCED_ATTRIBUTES:
    "Los atributos no coinciden con las variantes. Generá las variantes primero.",
  SAVE_SUCCESS_NEW: "Producto creado con éxito",
  SAVE_SUCCESS_EDIT: "Producto actualizado con éxito",
  SAVE_ERROR: "Error al guardar el producto",
  ATTR_SELECT_VALUE_WARNING: (attrName: string) =>
    `Seleccioná al menos un valor para "${attrName}"`,
  CONFIRM_DELETE_SKUS_TITLE: "¿Actualizar variantes?",
  CONFIRM_DELETE_SKUS_TEXT: (count: number) =>
    `Se eliminarán ${count} variante(s) con sus precios y stock asociados. ¿Continuar?`,
  UNSAVED_CHANGES_TITLE: "¿Salir sin guardar?",
  UNSAVED_CHANGES_TEXT:
    "Tenés cambios sin guardar. Si salís, los cambios se perderán.",
} as const;
