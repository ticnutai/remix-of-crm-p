import {
  Bot,
  Calendar,
  Clock,
  Database,
  FileSpreadsheet,
  FileText,
  HardDrive,
  History,
  LayoutDashboard,
  Mail,
  MapPinned,
  Settings,
  Table,
  TestTube,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  moduleKey?: string;
  adminOnly?: boolean;
}

// This is the single source of truth for both desktop and mobile navigation.
export const mainNavItems: NavigationItem[] = [
  { title: "לוח בקרה", url: "/", icon: LayoutDashboard, moduleKey: "dashboard" },
  { title: "היום שלי", url: "/my-day", icon: Calendar, moduleKey: "my-day" },
  { title: "לקוחות", url: "/clients", icon: Users, moduleKey: "clients" },
  { title: "טבלת לקוחות", url: "/datatable-pro", icon: Table, moduleKey: "datatable" },
  { title: "עובדים", url: "/employees", icon: UserCog, moduleKey: "employees" },
  { title: "לוגי זמן", url: "/time-logs", icon: Clock, moduleKey: "time-logs" },
  { title: "נוכחות שלי", url: "/attendance", icon: Clock, moduleKey: "attendance" },
  { title: "נוכחות עובדים", url: "/attendance/admin", icon: UserCog, moduleKey: "attendance-admin", adminOnly: true },
  { title: "שכר ופנסיה (HR)", url: "/hr", icon: Wallet, moduleKey: "hr", adminOnly: true },
  { title: "ניתוח זמנים", url: "/time-analytics", icon: Clock, moduleKey: "time-analytics" },
  { title: "משימות, פגישות ותזכורות", url: "/tasks-meetings", icon: Calendar, moduleKey: "tasks-meetings" },
  { title: "הצעות מחיר", url: "/quotes", icon: FileSpreadsheet, moduleKey: "quotes" },
  { title: "הצעות מחיר PRO", url: "/quotes-pro", icon: FileSpreadsheet, moduleKey: "quotes-pro" },
  { title: "כספים", url: "/finance", icon: Wallet, moduleKey: "finance", adminOnly: true },
  { title: "תשלומים", url: "/payments", icon: Wallet, moduleKey: "payments" },
  { title: "דוחות", url: "/reports", icon: FileSpreadsheet, moduleKey: "reports" },
  { title: "לוח שנה", url: "/calendar", icon: Calendar, moduleKey: "calendar" },
  { title: "Gmail", url: "/gmail", icon: Mail, moduleKey: "gmail" },
  { title: "אנשי קשר", url: "/contacts", icon: Users, moduleKey: "contacts" },
  { title: "קבצים", url: "/files", icon: HardDrive, moduleKey: "files" },
  { title: "עורך OnlyOffice", url: "/onlyoffice-editor", icon: FileText },
  { title: "תכנון & GIS", url: "/planning-gis", icon: MapPinned, moduleKey: "planning-gis" },
  { title: "כלים חכמים", url: "/smart-tools", icon: Bot, moduleKey: "smart-tools" },
  { title: "פורטל לקוחות", url: "/portal-management", icon: Users, moduleKey: "portal-management" },
];

export const systemNavItems: NavigationItem[] = [
  { title: "גיבויים וייבוא", url: "/backups", icon: Database },
  { title: "היסטוריה", url: "/history", icon: History },
  { title: "הגדרות", url: "/settings", icon: Settings, adminOnly: true },
  { title: "בדיקות", url: "/tests", icon: TestTube, adminOnly: true },
];
