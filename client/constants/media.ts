export const MEDIA_TABS = [
  { key: "todos", label: "Todos" },
  { key: "galeria", label: "Galería" },
  { key: "productos", label: "Productos" },
  { key: "branding", label: "Branding" },
  { key: "servicios", label: "Servicios" },
] as const;

export const UPLOAD_FOLDERS = [
  "galeria",
  "productos",
  "branding",
  "servicios",
] as const;

export const MEDIA_PAGE_SIZE = 50;

export const MEDIA_MESSAGES = {
  COPY_SUCCESS: "Enlace copiado al portapapeles",
  UPLOAD_SUCCESS: "Imágenes subidas correctamente",
  UPLOAD_ERROR: "Error al subir imágenes",
  RESTORE_SUCCESS: "Imagen restaurada",
  RESTORE_ERROR: "Error al restaurar imagen",
  DELETE_CONFIRM_TITLE: "¿Eliminar imagen?",
  DELETE_CONFIRM_TRASH: "La imagen se moverá a la papelera.",
  FORCE_DELETE_TITLE: "¿Eliminar definitivamente?",
  FORCE_DELETE_WARNING:
    "La imagen se borrará de Cloudinary y todos los productos que la usan perderán la imagen. Esta acción es irreversible.",
  EMPTY_TRASH_TITLE: "¿Vaciar papelera?",
  EMPTY_TRASH_WARNING: (count: number) =>
    `Se eliminarán definitivamente ${count} imagen(es) de Cloudinary. Esta acción es irreversible.`,
  EMPTY_TRASH_SUCCESS: (count: number) => `${count} imágenes eliminadas`,
} as const;
