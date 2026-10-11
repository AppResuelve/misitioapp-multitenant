import type { Metadata, Viewport } from "next";

export const APP_NAME = "Administración";
export const DEFAULT_DESCRIPTION = "Panel de control y gestión centralizada.";

/**
 * Mapa centralizado de títulos para cada ruta del panel administrativo.
 * Soporta coincidencia exacta y rutas base para vistas anidadas.
 */
export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/products": "Productos",
  "/dashboard/services": "Servicios",
  "/dashboard/categories": "Categorías",
  "/dashboard/tags": "Etiquetas",
  "/dashboard/discounts": "Descuentos",
  "/dashboard/media": "Galería",
  "/dashboard/payment": "Medios de pago",
  "/dashboard/store": "Tienda pública",
  "/dashboard/attributes": "Atributos",
  "/dashboard/change-requests": "Solicitar cambio",
  "/dashboard/settings/general": "Configuración General",
  "/dashboard/settings/contact": "Información de Contacto",
  "/dashboard/settings/billing": "Facturación y Suscripción",
  "/dashboard/settings/data": "Gestión de Datos",
  "/dashboard/settings/help": "Centro de Ayuda",
  "/login": "Iniciar sesión",
  "/forgot": "Recuperar contraseña",
  "/reset": "Restablecer contraseña",
  "/activate": "Activar cuenta",
};

/**
 * Resuelve el título legible para document.title en el cliente (AdminShell).
 * Evalúa primero match exacto, luego prefijos jerárquicos ordenados de mayor a menor longitud.
 */
export function resolvePageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  // Ordenar por longitud descendente para evitar que '/dashboard' coincida antes que '/dashboard/products'
  const matchedEntry = Object.entries(PAGE_TITLES)
    .sort(([a], [b]) => b.length - a.length)
    .find(([path]) => pathname.startsWith(path));

  return matchedEntry ? matchedEntry[1] : APP_NAME;
}

/**
 * Viewport exportable para RootLayout en Next.js (App Router)
 */
export const baseViewport: Viewport = {
  themeColor: "#09090b", // zinc-950
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * Metadata base estricta para el RootLayout.
 * Bloquea indexación y rastreo de buscadores en todo el panel.
 */
export const baseMetadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s — ${APP_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: APP_NAME,
    title: APP_NAME,
    description: DEFAULT_DESCRIPTION,
  },
};

/**
 * Factory helper para páginas del servidor que necesiten definir metadata personalizada.
 */
export function constructMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  noIndex = true,
}: {
  title?: string;
  description?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
