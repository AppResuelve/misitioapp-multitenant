export const MAX_ITEMS_PER_SLOT = 3;
export const MAX_SLIDES_PER_CAROUSEL = 3;

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
    key: "featured_products",
    label: "Carrusel de Productos Destacados",
    description:
      "Vitrina deslizable de tarjetas de producto con precio y compra.",
    recommendedSize: "Configuración por Tag o Selección manual de catálogo",
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

export const createEmptySlide = () => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random()),
  imageUrl: null,
  title: "",
  subtitle: "",
  buttonText: "",
  linkType: "none",
  categoryId: "",
  categoryName: "",
  categorySlug: "",
  productId: "",
  productName: "",
  productSlug: "",
  externalUrl: "",
});

export const EMPTY_BANNER = {
  name: "",
  slotKey: BANNER_SLOTS[0]?.key || "top_bar",
  status: "draft",
  campaignId: "",
  startAt: "",
  endAt: "",
  linkType: "none",
  categoryId: "",
  categoryName: "",
  productId: "",
  productName: "",
  externalUrl: "",
  config: {
    imageUrl: null,
    title: "",
    subtitle: "",
    buttonText: "",
  },
};

export const EMPTY_CAROUSEL = {
  name: "",
  slotKey: CAROUSEL_SLOTS[0]?.key || "hero",
  status: "draft",
  campaignId: "",
  startAt: "",
  endAt: "",
  linkType: "none",
  categoryId: "",
  categoryName: "",
  productId: "",
  productName: "",
  externalUrl: "",
  config: {
    autoplay: true,
    interval: 5,
    customPerSlide: false,
    overlayTitle: "",
    overlaySubtitle: "",
    overlayButtonText: "",
    // Propiedades de featured_products:
    mode: "auto",
    tagName: "",
    limit: 8,
    selectedProducts: [],
    productIds: [],
    slides: [createEmptySlide()],
  },
};

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
  UNLINK_CAMPAIGN_TITLE: "Desasociar campaña",
  UNLINK_CAMPAIGN_WARNING: (campaignName: string) =>
    `Este elemento está vinculado a "${campaignName}". Modificar la fecha o la configuración desvinculará la campaña. ¿Deseás continuar?`,
  CONFIRM_UNLINK_BTN: "Desasociar y cambiar",
  CANCEL_UNLINK_BTN: "Mantener campaña",
  // Textos de ayuda para la selección y fallback de productos
  FEATURED_MODE_HELP: {
    tag: "Se mostrarán los productos que tengan este tag. Si no hay suficientes, se completará con los últimos productos agregados.",
    manual:
      "Se mostrarán únicamente los productos seleccionados que permanezcan activos y con stock.",
    auto: "Prioriza los productos con más pedidos. Si la tienda es nueva y no tiene ventas, mostrará las últimas novedades.",
  },
};
