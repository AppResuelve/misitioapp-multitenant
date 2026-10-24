import {
  LayoutDashboard,
  FileBox,
  Folder,
  Settings,
  Image,
  Store,
  Wrench,
  SlidersHorizontal,
  Tag,
  FolderOpen,
  Percent,
  Globe,
  CreditCard,
  Wallet,
  Database,
  HelpCircle,
  Megaphone,
  CalendarDays,
  LayoutTemplate,
  Images,
  Layers,
  LucideIcon,
} from "lucide-react";

export interface NavChildItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

export interface NavItem {
  to?: string;
  icon: LucideIcon;
  label: string;
  children?: NavChildItem[];
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_CONFIG: NavGroup[] = [
  {
    group: "General",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      {
        label: "Catálogo",
        icon: FolderOpen,
        children: [
          { to: "/dashboard/products", icon: FileBox, label: "Productos" },
          { to: "/dashboard/categories", icon: Folder, label: "Categorías" },
          { to: "/dashboard/tags", icon: Tag, label: "Etiquetas" },
          {
            to: "/dashboard/attributes",
            icon: SlidersHorizontal,
            label: "Atributos",
          },
        ],
      },
      {
        label: "Marketing",
        icon: Megaphone,
        children: [
          {
            to: "/dashboard/marketing/campaigns",
            icon: CalendarDays,
            label: "Campañas",
          },
          {
            to: "/dashboard/marketing/discounts",
            icon: Percent,
            label: "Descuentos",
          },
        ],
      },
      { to: "/dashboard/media", icon: Image, label: "Galería" },
    ],
  },
  {
    group: "Sitio público",
    items: [
      { to: "/dashboard/store", icon: Store, label: "Tienda" },
      {
        label: "Contenido",
        icon: Layers,
        children: [
          {
            to: "/dashboard/content/banners",
            icon: LayoutTemplate,
            label: "Banners",
          },
          {
            to: "/dashboard/content/carousels",
            icon: Images,
            label: "Carruseles",
          },
        ],
      },
    ],
  },
  {
    group: "Desarrollador",
    items: [
      {
        to: "/dashboard/change-requests",
        icon: Wrench,
        label: "Solicitar cambio",
      },
    ],
  },
];

export const SETTINGS_ITEMS: NavChildItem[] = [
  { to: "/dashboard/settings/general", label: "General", icon: Globe },
  { to: "/dashboard/settings/contact", label: "Contacto", icon: Settings },
  { to: "/dashboard/settings/payment", label: "Medios de pago", icon: Wallet },
  { to: "/dashboard/settings/billing", label: "Facturación", icon: CreditCard },
  { to: "/dashboard/settings/data", label: "Datos", icon: Database },
  { to: "/dashboard/settings/help", label: "Ayuda", icon: HelpCircle },
];
