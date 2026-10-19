export const INITIAL_GENERAL_SETTINGS = {
  businessName: "",
  businessSlogan: "",
  businessDescription: "",
  logoUrl: "",
  faviconUrl: "",
  email: "",
  socialLinks: {
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    twitter: "",
    linkedin: "",
  },
};

export type SocialNetworkKey =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "linkedin";

export interface SocialNetworkMeta {
  label: string;
  placeholder: string;
}

export const SOCIAL_NETWORKS_DICT: Record<SocialNetworkKey, SocialNetworkMeta> =
  {
    instagram: {
      label: "Instagram",
      placeholder: "https://instagram.com/tu-usuario",
    },
    facebook: {
      label: "Facebook",
      placeholder: "https://facebook.com/tu-pagina",
    },
    tiktok: {
      label: "TikTok",
      placeholder: "https://tiktok.com/@tu-usuario",
    },
    youtube: {
      label: "YouTube",
      placeholder: "https://youtube.com/@tu-canal",
    },
    twitter: {
      label: "X (Twitter)",
      placeholder: "https://x.com/tu-usuario",
    },
    linkedin: {
      label: "LinkedIn",
      placeholder: "https://linkedin.com/company/tu-empresa",
    },
  };

export const SOCIAL_NETWORK_KEYS = Object.keys(
  SOCIAL_NETWORKS_DICT,
) as SocialNetworkKey[];

export const GENERAL_SETTINGS_MESSAGES = {
  SAVE_SUCCESS: "Configuración guardada con éxito",
  SAVE_ERROR: "No se pudo guardar la configuración",
  FETCH_ERROR: "Error al cargar la configuración general",
} as const;
