import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Search,
  Lightbulb,
  Radar,
  Store,
  Tag,
  Telescope,
  Package,
  Receipt,
  Calculator,
  Workflow,
  BellRing,
  Settings,
} from "lucide-react";

/** Konstanta aplikasi terpusat. */
export const APP = {
  name: "Etsy Intelligence",
  description: "Riset produk Etsy & kelola toko sendiri",
  timezone: process.env.APP_TIMEZONE ?? "Asia/Jakarta",
} as const;

export type NavStatus = "ready" | "later";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** "later" = belum berfungsi; ditampilkan sebagai label "Coming later" (PRD §6). */
  status: NavStatus;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Struktur navigasi sidebar (PRD §6).
 * Tandai `status: "later"` untuk menu yang belum diimplementasikan agar tidak
 * tampil seolah sudah aktif.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Today's Etsy Trends", href: "/", icon: LayoutDashboard, status: "ready" },
      { title: "Product Explorer", href: "/products", icon: Search, status: "later" },
      { title: "Idea Vault", href: "/ideas", icon: Lightbulb, status: "later" },
    ],
  },
  {
    label: "Market Research",
    items: [
      { title: "Trend Radar", href: "/trends", icon: Radar, status: "later" },
      { title: "Competitor Tracker", href: "/competitors", icon: Store, status: "later" },
      { title: "Keyword Lab", href: "/keywords", icon: Tag, status: "later" },
      { title: "Opportunity Finder", href: "/opportunities", icon: Telescope, status: "later" },
    ],
  },
  {
    label: "My Shop",
    items: [
      { title: "My Listings", href: "/my-shop/listings", icon: Package, status: "later" },
      { title: "Orders & Sales", href: "/my-shop/orders", icon: Receipt, status: "later" },
      { title: "Profit Calculator", href: "/profit", icon: Calculator, status: "later" },
    ],
  },
  {
    label: "Automation",
    items: [
      { title: "Research Workflows", href: "/automation", icon: Workflow, status: "later" },
      { title: "Alerts & Reports", href: "/reports", icon: BellRing, status: "later" },
    ],
  },
  {
    label: "Settings",
    items: [{ title: "Settings", href: "/settings", icon: Settings, status: "ready" }],
  },
];
