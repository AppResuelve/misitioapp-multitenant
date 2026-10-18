import { Globe, Pencil, AlertTriangle, LucideIcon } from "lucide-react";

export interface StoreStatusOption {
  value: string;
  label: string;
  icon: LucideIcon;
  dot: string;
  description: string;
}

export const STORE_STATUS_OPTIONS: StoreStatusOption[] = [
  {
    value: "active",
    label: "Activa",
    icon: Globe,
    dot: "bg-emerald-500",
    description: "Tu tienda está visible para todo el mundo",
  },
  {
    value: "draft",
    label: "Borrador",
    icon: Pencil,
    dot: "bg-amber-500",
    description: "Tu tienda está oculta. Ideal para hacer cambios.",
  },
  {
    value: "maintenance",
    label: "Mantenimiento",
    icon: AlertTriangle,
    dot: "bg-red-500",
    description:
      "Tu tienda está en mantenimiento. Contactanos si necesitás asistencia.",
  },
];

export const IFRAME_DIMENSIONS = {
  WIDTH: 1440,
  HEIGHT: 900,
  MAX_HEIGHT: 600,
} as const;

export const STORE_MESSAGES = {
  STATUS_UPDATED: "Estado de la tienda actualizado",
  STATUS_ERROR: "No se pudo actualizar el estado de la tienda",
  URL_COPIED: "URL copiada al portapapeles",
} as const;
