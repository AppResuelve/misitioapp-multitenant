export const MAX_ITEMS_PER_SLOT = 6;
export const MAX_SLIDES_PER_CAROUSEL = 6;
export const BANNER_SLOTS = [
  {
    key: "top_bar",
    label: "Top Bar (Barra superior de aviso)",
    description:
      "Franja fija superior para anuncios, promociones o envíos gratis.",
    recommendedSize: "Texto continuo / 1920x60px",
  },
  {
    key: "category_highlight",
    label: "Banner de Categoría Destacada",
    description:
      "Espacio intermedio para promocionar una categoría específica.",
    recommendedSize: "1200x400px (Desktop) / 600x400px (Mobile)",
  },
  {
    key: "product_highlight",
    label: "Banner de Producto Estrella",
    description: "Llamada a la acción visual enfocada en un producto clave.",
    recommendedSize: "1200x500px",
  },
  {
    key: "promo_grid",
    label: "Banner Promocional Estático",
    description: "Bloque gráfico fijo para ofertas de temporada o cupones.",
    recommendedSize: "1400x450px",
  },
] as const;

export const CAROUSEL_SLOTS = [
  {
    key: "hero",
    label: "Hero Carousel (Principal de Portada)",
    description: "Secuencia principal de diapositivas en la cabecera del home.",
    recommendedSize: "1920x700px (Desktop) / 800x800px (Mobile)",
  },
  {
    key: "brand_carousel",
    label: "Carrusel de Marcas / Logos",
    description: "Tira deslizante horizontal de marcas o proveedores aliados.",
    recommendedSize: "Logos vectoriales o PNG transparentes 200x80px",
  },
  {
    key: "social_proof",
    label: "Prueba Social (Historias / Destacados)",
    description:
      "Círculos estilo Instagram con testimonios o fotos de clientes.",
    recommendedSize:
      "Imágenes cuadradas 400x400px o formato vertical 1080x1920px",
  },
] as const;

export const LINK_TYPES = [
  { value: "none", label: "Sin enlace" },
  { value: "category", label: "Categoría del catálogo" },
  { value: "product", label: "Producto específico" },
  { value: "external", label: "Enlace externo (URL)" },
] as const;

export const SITE_CONTENT_MESSAGES = {
  CREATE_SUCCESS: "Contenido creado con éxito",
  UPDATE_SUCCESS: "Contenido actualizado con éxito",
  DELETE_SUCCESS: "Contenido eliminado",
  STATUS_SUCCESS: "Estado actualizado",
  DELETE_CONFIRM_TITLE: "Eliminar contenido",
  DELETE_CONFIRM_TEXT: (name: string) =>
    `¿Estás seguro de eliminar "${name}"? Esta acción no se puede deshacer.`,
  NAME_REQUIRED: "El nombre interno es obligatorio",
  SLOT_REQUIRED: "Debés seleccionar un espacio (slot) para este contenido",
  SLOT_LIMIT_REACHED: `Límite alcanzado: este espacio admite un máximo de ${MAX_ITEMS_PER_SLOT} elementos.`,
  SAVE_ERROR: "Error al guardar el contenido",
  DELETE_ERROR: "No se pudo eliminar el contenido",
  STATUS_ERROR: "Error al alternar el estado del contenido",
};
