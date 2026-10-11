import { ChannelPreset } from "@/types/payment";

export const PAYMENT_CHANNEL_PRESETS: Record<string, ChannelPreset> = {
  credit: {
    type: "credit",
    title: "Tarjetas de crédito",
    defaultBrands: [
      { id: "visa", name: "Visa", imageUrl: "/payments/visa.png" },
      {
        id: "mastercard",
        name: "Mastercard",
        imageUrl: "/payments/mastercard.png",
      },
      { id: "amex", name: "American Express", imageUrl: "/payments/amex.png" },
      { id: "naranja", name: "Naranja X", imageUrl: "/payments/naranja.png" },
      { id: "cabal", name: "Cabal", imageUrl: "/payments/cabal.png" },
    ],
  },
  debit: {
    type: "debit",
    title: "Tarjetas de débito",
    defaultBrands: [
      {
        id: "visa-debit",
        name: "Visa Débito",
        imageUrl: "/payments/visa.png",
      },
      {
        id: "mastercard-debit",
        name: "Mastercard Débito",
        imageUrl: "/payments/mastercard.png",
      },
      {
        id: "cabal-debit",
        name: "Cabal Débito",
        imageUrl: "/payments/cabal.png",
      },
    ],
  },
  transfer: {
    type: "transfer",
    title: "Transferencia bancaria",
    defaultBrands: [
      {
        id: "galicia",
        name: "Banco Galicia",
        imageUrl: "/payments/galicia.png",
      },
      {
        id: "santander",
        name: "Banco Santander",
        imageUrl: "/payments/santander.png",
      },
      { id: "bbva", name: "BBVA", imageUrl: "/payments/bbva.png" },
      { id: "nacion", name: "Banco Nación", imageUrl: "/payments/nacion.png" },
      { id: "macro", name: "Banco Macro", imageUrl: "/payments/macro.png" },
      { id: "cbu", name: "Alias / CBU", imageUrl: "/payments/cbu.png" },
    ],
  },
  wallets: {
    type: "wallets",
    title: "Billeteras virtuales / Apps",
    defaultBrands: [
      {
        id: "mercadopago",
        name: "Mercado Pago",
        imageUrl: "/payments/mercadopago.png",
      },
      { id: "modo", name: "MODO", imageUrl: "/payments/modo.png" },
      { id: "uala", name: "Ualá", imageUrl: "/payments/uala.png" },
      { id: "prex", name: "Prex", imageUrl: "/payments/prex.png" },
      {
        id: "cuenta-dni",
        name: "Cuenta DNI",
        imageUrl: "/payments/cuenta-dni.png",
      },
      {
        id: "personal-pay",
        name: "Personal Pay",
        imageUrl: "/payments/personal-pay.png",
      },
    ],
  },
  cash: {
    type: "cash",
    title: "Efectivo",
    defaultBrands: [
      { id: "rapipago", name: "Rapipago", imageUrl: "/payments/rapipago.png" },
      {
        id: "pagofacil",
        name: "Pago Fácil",
        imageUrl: "/payments/pagofacil.png",
      },
      {
        id: "cash-store",
        name: "En el local / Contra entrega",
        imageUrl: "/payments/cash.png",
      },
    ],
  },
};
