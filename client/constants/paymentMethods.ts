import {
  CreditCard,
  Building2,
  Banknote,
  Wallet,
  LucideIcon,
} from "lucide-react";

export interface PaymentTypeOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const PAYMENT_TYPES: PaymentTypeOption[] = [
  { value: "credit", label: "Tarjetas de crédito", icon: CreditCard },
  { value: "debit", label: "Tarjetas de débito", icon: CreditCard },
  { value: "transfer", label: "Transferencia bancaria", icon: Building2 },
  { value: "cash", label: "Efectivo", icon: Banknote },
  { value: "wallets", label: "Billeteras virtuales / Apps", icon: Wallet },
];

export const PAYMENT_TYPE_ICONS: Record<string, LucideIcon> = {
  credit: CreditCard,
  debit: CreditCard,
  transfer: Building2,
  cash: Banknote,
  wallets: Wallet,
};

export const PAYMENT_MESSAGES = {
  SAVE_SUCCESS_NEW: "Medio de pago creado con éxito",
  SAVE_SUCCESS_EDIT: "Medio de pago actualizado con éxito",
  SAVE_ERROR: "No se pudo guardar el medio de pago",
  DELETE_CONFIRM_TITLE: "¿Eliminar medio de pago?",
  DELETE_CONFIRM_TEXT:
    "Esta acción no se puede deshacer y se ocultará de la tienda pública.",
  DELETE_SUCCESS: "Medio de pago eliminado",
  DELETE_ERROR: "No se pudo eliminar el medio de pago",
  STATUS_UPDATED: (active: boolean) =>
    `El canal ahora está ${active ? "activo" : "oculto"} en la tienda.`,
  REORDER_ERROR: "No se pudo actualizar el orden de los medios de pago.",
} as const;
