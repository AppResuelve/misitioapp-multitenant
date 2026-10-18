export const PRODUCTS_PAGE_SIZE = 20;

export const PRODUCT_MESSAGES = {
  STATUS_ERROR: "Error al cambiar el estado del producto",
  DELETE_CONFIRM_TITLE: "¿Eliminar producto?",
  DELETE_CONFIRM_TEXT: (name: string) =>
    `"${name}" se eliminará permanentemente.`,
  BULK_DELETE_TITLE: "¿Eliminar productos seleccionados?",
  BULK_DELETE_TEXT: (count: number) =>
    `${count} producto(s) se eliminarán permanentemente. Esta acción no se puede deshacer.`,
  BULK_DELETE_SUCCESS: (count: number) =>
    `${count} producto(s) eliminados con éxito`,
  BULK_DELETE_PARTIAL: (successCount: number, failCount: number) =>
    `Se eliminaron ${successCount} producto(s). ${failCount} no pudieron eliminarse.`,
  BULK_DELETE_ERROR: "No se pudieron eliminar los productos seleccionados",
  SELECTION_REPLACE_TITLE: "Reemplazar selección",
  SELECTION_REPLACE_TEXT: (outsideCount: number, action: string) =>
    `Tenés ${outsideCount} producto(s) seleccionado(s) en otras páginas. Al continuar, ${action}.`,
} as const;
