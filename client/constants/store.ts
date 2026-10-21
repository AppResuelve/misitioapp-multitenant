import { Globe, PauseCircle, AlertTriangle, LucideIcon } from "lucide-react";

export type StoreStatusType = "active" | "paused" | "maintenance";

export interface StoreStatusOption {
  value: StoreStatusType;
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
    description: "Tu tienda está visible y recibiendo compras normalmente.",
  },
  {
    value: "paused",
    label: "En pausa",
    icon: PauseCircle,
    dot: "bg-amber-500",
    description: "Catálogo visible para consulta, pero con compras pausadas.",
  },
  {
    value: "maintenance",
    label: "Mantenimiento",
    icon: AlertTriangle,
    dot: "bg-red-500",
    description: "Tienda temporalmente cerrada con aviso de mantenimiento.",
  },
];

// Diccionario indexado por status para acceso directo O(1)
export const STORE_STATUS_MAP: Record<
  StoreStatusType,
  { label: string; dot: string; description: string }
> = {
  active: {
    label: "Activa",
    dot: "bg-emerald-500",
    description: "Tu tienda está visible y recibiendo compras normalmente.",
  },
  paused: {
    label: "En pausa",
    dot: "bg-amber-500",
    description: "Catálogo visible para consulta, pero con compras pausadas.",
  },
  maintenance: {
    label: "Mantenimiento",
    dot: "bg-red-500",
    description: "Tienda temporalmente cerrada con aviso de mantenimiento.",
  },
};

// Fallback seguro por si la DB devuelve algo inesperado o null
export const DEFAULT_STORE_STATUS_INFO = STORE_STATUS_MAP.active;

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
