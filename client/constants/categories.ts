export const CATEGORY_MESSAGES = {
  NAME_REQUIRED: "El nombre es obligatorio",
  REORDER_ERROR: "Error al reordenar categorías",
  CREATE_SUCCESS: "Categoría creada",
  UPDATE_SUCCESS: "Categoría actualizada",
  SAVE_ERROR: "Error al guardar categoría",
  DELETE_CONFIRM_TITLE: "¿Eliminar categoría?",
  DELETE_CONFIRM_TEXT: (name: string) =>
    `"${name}" se eliminará permanentemente.`,
  DELETE_SUCCESS: "Categoría eliminada",
  DELETE_ERROR:
    "No se pudo eliminar la categoría. Verificá que no contenga productos.",
  STATUS_ERROR: "Error al cambiar estado",
} as const;
