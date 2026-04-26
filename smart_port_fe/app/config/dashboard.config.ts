import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  FileText,
  ShoppingCart,
  Bell,
  HelpCircle,
  Layers,
  Shield,
  Zap,
  Inbox,
  Ship,
  ShipWheel,
  Container,
  ReceiptText,
} from "lucide-react";
import logo from "@/app/components/images/logo.png";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
  isExternal?: boolean;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const siteConfig = {
  name: "Smart Port Dashboard",
  logo: "@/app/components/images/logo.png",
  version: "1.1.0",
};

export const navSections: NavSection[] = [
  {
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      }
    ],
  },
  {
    title: "Management",
    items: [
      {
        key: "users",
        label: "Users",
        href: "/users",
        icon: Users,
      },
      {
        key: "vessels",
        label: "Vessels",
        href: "/vessels",
        icon: Ship,
        badge: "New",
      },
      {
        key: "berths",
        label: "Berths",
        href: "/berth",
        icon: ShipWheel,
        badge: "New",
      },
      {
        key: "logistics",
        label: "Logistics",
        href: "/logistics",
        icon: Container,
        badge: "New",
      },
      {
        key: "invoice",
        label: "Billing",
        href: "/invoice",
        icon: ReceiptText,
      }
      // {
      //   key: "content",
      //   label: "Content",
      //   href: "/content",
      //   icon: FileText,
      // },
      // {
      //   key: "layers",
      //   label: "Projects",
      //   href: "/projects",
      //   icon: Layers,
      // },
    ],
  },
  // {
  //   title: "Analytics",
  //   items: [
  //     {
  //       key: "analytics",
  //       label: "Analytics",
  //       href: "/analytics",
  //       icon: BarChart3,
  //     },
  //     {
  //       key: "performance",
  //       label: "Performance",
  //       href: "/performance",
  //       icon: Zap,
  //     },
  //   ],
  // },
  {
    title: "System",
    items: [
      {
        key: "notifications",
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        badge: 12,
      },
      // {
      //   key: "security",
      //   label: "Security",
      //   href: "/security",
      //   icon: Shield,
      // },
      {
        key: "settings",
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
      // {
      //   key: "help",
      //   label: "Help & Docs",
      //   href: "/help",
      //   icon: HelpCircle,
      // },
    ],
  },
];
