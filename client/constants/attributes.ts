export const UNIT_LABEL: Record<string, string> = {
  kg: "Gr",
  m: "Cm",
  l: "Ml",
};

export const UNIT_OPTIONS = [
  { value: "", label: "Ninguna (texto libre)" },
  { value: "kg", label: "Gramo (Gr)" },
  { value: "m", label: "Centímetro (Cm)" },
  { value: "l", label: "Mililitro (Ml)" },
];

export const ATTRIBUTE_MESSAGES = {
  NAME_REQUIRED: "El nombre del atributo es obligatorio",
  SAVE_SUCCESS_NEW: "Atributo creado",
  SAVE_SUCCESS_EDIT: "Atributo actualizado",
  SAVE_ERROR: "Error al guardar atributo",
  EMPTY_VALUES_NOT_ALLOWED:
    "Todos los valores agregados deben tener contenido (no pueden quedar vacíos)",
  DELETE_CONFIRM_TITLE: "¿Eliminar atributo?",
  DELETE_SUCCESS: "Atributo eliminado",
  DELETE_ERROR: "Error al eliminar atributo",
} as const;
