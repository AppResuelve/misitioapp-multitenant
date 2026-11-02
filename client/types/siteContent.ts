import {
  BANNER_SLOTS,
  CAROUSEL_SLOTS,
  LINK_TYPES,
} from "@/constants/siteContent";

export type SlotKey =
  | (typeof BANNER_SLOTS)[number]["key"]
  | (typeof CAROUSEL_SLOTS)[number]["key"];

export type LinkTypeValue = (typeof LINK_TYPES)[number]["value"];

// Diccionario de exclusión: define exactamente qué destinos admite cada ranura
export const SLOT_ALLOWED_LINKS: Record<SlotKey, readonly LinkTypeValue[]> = {
  top_bar: ["none", "category", "product", "external"],
  category_highlight: ["category", "external", "none"],
  product_highlight: ["product", "external", "none"],
  promo_grid: ["none", "category", "product", "external"],
  hero: ["none", "category", "product", "external"],
  featured_products: [],
  brand_carousel: ["none", "external"],
  social_proof: ["none", "external", "product"],
};
