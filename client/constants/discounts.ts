export const DISCOUNT_TYPE_LABELS = {
  global: "Global (todos los productos)",
  category: "Por categoría",
  price_range: "Por rango de precio",
  products: "Productos seleccionados",
  cart_total: "Por volumen de compra (carrito)",
} as const;

export const DISCOUNT_TYPE_OPTIONS = Object.entries(DISCOUNT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const DISCOUNT_STATUS_OPTIONS = [
  { value: "draft", label: "Borrador (guardar sin publicar)" },
  { value: "active", label: "Activo (publicar)" },
];

export const EMPTY_DISCOUNT_FORM = {
  name: "",
  type: "global",
  percentage: "",
  status: "draft",
  startAt: "",
  endAt: "",
  categoryIds: [],
  productIds: [],
  min: "",
  max: "",
  minAmount: "",
  countDiscounted: false,
};

export const DISCOUNT_MESSAGES = {
  NAME_REQUIRED: "El nombre es obligatorio",
  PERCENTAGE_INVALID: "El porcentaje debe estar entre 1 y 100",
  START_DATE_REQUIRED: "La fecha de inicio es obligatoria",
  END_DATE_INVALID: "La fecha de fin no puede ser anterior a la de inicio",
  CATEGORIES_REQUIRED: "Seleccioná al menos una categoría",
  PRODUCTS_REQUIRED: "Seleccioná al menos un producto",
  PRICE_RANGE_INVALID: "El precio mínimo no puede superar al máximo",
  CART_MIN_REQUIRED: "Ingresá un monto mínimo válido para el carrito",
  SAVE_SUCCESS_NEW: "Descuento creado",
  SAVE_SUCCESS_EDIT: "Descuento actualizado",
  SAVE_ERROR: "Error al guardar descuento",
  DELETE_CONFIRM_TITLE: "¿Eliminar descuento?",
  DELETE_CONFIRM_TEXT: (name: string) =>
    `Se eliminará "${name}" definitivamente.`,
  DELETE_SUCCESS: "Descuento eliminado",
  DELETE_ERROR: "Error al eliminar descuento",
  STATUS_ERROR: "Error al cambiar estado",
} as const;
