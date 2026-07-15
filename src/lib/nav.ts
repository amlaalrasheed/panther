import type { AppRole } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Megaphone,
  Building2,
  CalendarDays,
  BarChart3,
  FileSpreadsheet,
  Users,
  ScrollText,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const ALL_NAV: (NavItem & { roles: AppRole[] })[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "FINANCE", "MARKETING"] },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone, roles: ["ADMIN", "FINANCE", "MARKETING"] },
  { label: "Companies", href: "/companies", icon: Building2, roles: ["ADMIN", "FINANCE"] },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, roles: ["ADMIN", "FINANCE", "MARKETING"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["ADMIN", "FINANCE"] },
  { label: "Reports", href: "/reports", icon: FileSpreadsheet, roles: ["ADMIN", "FINANCE"] },
  { label: "Users", href: "/users", icon: Users, roles: ["ADMIN"] },
  { label: "Audit Log", href: "/audit-log", icon: ScrollText, roles: ["ADMIN"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN", "FINANCE", "MARKETING"] },
];

export function getNavForRole(role: AppRole): NavItem[] {
  return ALL_NAV.filter((item) => item.roles.includes(role));
}
