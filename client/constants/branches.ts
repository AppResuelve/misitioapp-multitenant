export const DEFAULT_COUNTRY_CODE = "AR";

export const BRANCH_MESSAGES = {
  SAVE_SUCCESS_NEW: "Sucursal creada con éxito",
  SAVE_SUCCESS_EDIT: "Sucursal actualizada con éxito",
  SAVE_ERROR: "Error al guardar la sucursal",
  DELETE_CONFIRM_TITLE: "¿Eliminar sucursal?",
  DELETE_CONFIRM_TEXT: (name: string) =>
    `¿Estás seguro de que querés eliminar "${name}"? Esta acción no se puede deshacer.`,
  DELETE_SUCCESS: "Sucursal eliminada",
  DELETE_ERROR: "Error al eliminar la sucursal",
  STATUS_ERROR: "Error al cambiar el estado de la sucursal",
  REORDER_ERROR: "Error al reordenar las sucursales",
} as const;
