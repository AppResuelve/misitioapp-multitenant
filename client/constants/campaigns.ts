export const CAMPAIGN_MESSAGES = {
  CREATE_SUCCESS: "Campaña creada con éxito",
  UPDATE_SUCCESS: "Campaña actualizada con éxito",
  DELETE_SUCCESS: "Campaña eliminada",
  STATUS_SUCCESS: "Estado de la campaña actualizado",
  DELETE_CONFIRM_TITLE: "Eliminar campaña",
  DELETE_CONFIRM_TEXT: (name: string) =>
    `¿Estás seguro de eliminar "${name}"? Los contenidos o descuentos asociados perderán esta vinculación temporal.`,
  NAME_REQUIRED: "El nombre de la campaña es obligatorio",
  DATES_REQUIRED: "Las fechas de inicio y fin son obligatorias",
  INVALID_DATE_RANGE: "La fecha de fin debe ser posterior a la fecha de inicio",
  SAVE_ERROR: "Error al guardar la campaña",
  DELETE_ERROR: "No se pudo eliminar la campaña",
  STATUS_ERROR: "Error al cambiar el estado de la campaña",
};
