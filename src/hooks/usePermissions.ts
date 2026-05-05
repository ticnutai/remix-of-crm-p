/**
 * usePermissions — loads and caches the current user's module permissions.
 *
 * Admins (role = admin | super_manager) are granted full access to every
 * module without needing an explicit DB row, so the hook works without
 * the DB table for legacy admin accounts.
 *
 * Consumers:
 *   const { can, loading } = usePermissions();
 *   can('clients', 'view')   // boolean
 *   can('finance', 'delete') // boolean
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ---- Module registry — matches OverlaySidebar.tsx mainNavItems ----
export type PermAction = "view" | "edit" | "delete";

export interface ModuleDef {
  key: string;
  label: string;
  url: string;
  group: string;
  /** Admins-only by default regardless of DB */
  adminOnly?: boolean;
}

export const MODULES: ModuleDef[] = [
  // ---- General ----
  { key: "dashboard",          label: "לוח בקרה",                    url: "/",                  group: "כללי" },
  { key: "my-day",             label: "היום שלי",                    url: "/my-day",             group: "כללי" },
  // ---- Clients ----
  { key: "clients",            label: "לקוחות",                      url: "/clients",             group: "לקוחות" },
  { key: "datatable",          label: "טבלת לקוחות",                 url: "/datatable-pro",       group: "לקוחות" },
  { key: "contacts",           label: "אנשי קשר",                    url: "/contacts",            group: "לקוחות" },
  { key: "portal-management",  label: "פורטל לקוחות",                url: "/portal-management",   group: "לקוחות" },
  // ---- HR & Employees ----
  { key: "employees",          label: "עובדים",                      url: "/employees",           group: "עובדים ו-HR" },
  { key: "attendance",         label: "נוכחות שלי",                  url: "/attendance",          group: "עובדים ו-HR" },
  { key: "attendance-admin",   label: "נוכחות עובדים",               url: "/attendance/admin",    group: "עובדים ו-HR", adminOnly: true },
  { key: "hr",                 label: "שכר ופנסיה (HR)",             url: "/hr",                  group: "עובדים ו-HR", adminOnly: true },
  // ---- Time ----
  { key: "time-logs",          label: "לוגי זמן",                    url: "/time-logs",           group: "זמן" },
  { key: "time-analytics",     label: "ניתוח זמנים",                 url: "/time-analytics",      group: "זמן" },
  // ---- Tasks ----
  { key: "tasks-meetings",     label: "משימות, פגישות ותזכורות",     url: "/tasks-meetings",      group: "משימות" },
  { key: "calendar",           label: "לוח שנה",                     url: "/calendar",            group: "משימות" },
  // ---- Finance ----
  { key: "quotes",             label: "הצעות מחיר",                  url: "/quotes",              group: "כספים" },
  { key: "finance",            label: "כספים",                       url: "/finance",             group: "כספים", adminOnly: true },
  { key: "payments",           label: "תשלומים",                     url: "/payments",            group: "כספים" },
  { key: "reports",            label: "דוחות",                       url: "/reports",             group: "כספים" },
  // ---- Tools ----
  { key: "gmail",              label: "Gmail",                        url: "/gmail",               group: "כלים" },
  { key: "files",              label: "קבצים",                       url: "/files",               group: "כלים" },
  { key: "planning-gis",       label: "תכנון & GIS",                  url: "/planning-gis",        group: "כלים" },
  { key: "smart-tools",        label: "כלים חכמים",                  url: "/smart-tools",         group: "כלים" },
];

// ---- Role templates ----
export type RoleTemplate = "admin" | "manager" | "employee" | "client" | "custom";

export interface ModulePerm {
  can_view:   boolean;
  can_edit:   boolean;
  can_delete: boolean;
}

export type PermissionsMap = Record<string, ModulePerm>;

function fullAccess(): ModulePerm  { return { can_view: true,  can_edit: true,  can_delete: true  }; }
function viewEdit():   ModulePerm  { return { can_view: true,  can_edit: true,  can_delete: false }; }
function viewOnly():   ModulePerm  { return { can_view: true,  can_edit: false, can_delete: false }; }
function noAccess():   ModulePerm  { return { can_view: false, can_edit: false, can_delete: false }; }

export const ROLE_TEMPLATES: Record<RoleTemplate, PermissionsMap | null> = {
  /** Admin: unrestricted. Stored as null — code checks role instead. */
  admin: null,

  /** Manager: full except HR-admin, finance, portal management */
  manager: Object.fromEntries(
    MODULES.map(m => [
      m.key,
      ["hr", "finance", "portal-management", "datatable"].includes(m.key)
        ? viewOnly()
        : fullAccess(),
    ])
  ),

  /** Employee: view on most modules, edit only own attendance/time, no HR/finance */
  employee: Object.fromEntries(
    MODULES.map(m => {
      if (["hr", "finance", "attendance-admin", "portal-management", "employees"].includes(m.key))
        return [m.key, noAccess()];
      if (["attendance", "time-logs", "tasks-meetings", "calendar", "my-day", "dashboard"].includes(m.key))
        return [m.key, viewEdit()];
      return [m.key, viewOnly()];
    })
  ),

  /** Client: only portal-facing pages */
  client: Object.fromEntries(
    MODULES.map(m => [
      m.key,
      ["dashboard", "my-day", "calendar", "quotes", "payments"].includes(m.key)
        ? viewOnly()
        : noAccess(),
    ])
  ),

  /** Custom — placeholder, will be filled by actual DB rows */
  custom: Object.fromEntries(MODULES.map(m => [m.key, noAccess()])),
};

// ---- DB row type ----
interface PermRow {
  module:     string;
  can_view:   boolean;
  can_edit:   boolean;
  can_delete: boolean;
}

// ---- Hook ----
export interface UsePermissionsResult {
  /** True while first fetch is in progress */
  loading: boolean;
  /** Map of module → permissions for the current user */
  perms: PermissionsMap;
  /**
   * Convenience checker.
   * Admins always return true regardless of DB rows.
   */
  can: (module: string, action: PermAction) => boolean;
  /** Force a fresh fetch (call after admin saves changes) */
  refresh: () => void;
  /** Whether the current user is an admin (role = admin | super_manager) */
  isAdmin: boolean;
}

export function usePermissions(): UsePermissionsResult {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<PermissionsMap>({});

  const isAdmin = !!(
    profile?.role === "admin" || profile?.role === "super_manager"
  );

  const fetchPerms = useCallback(async () => {
    // Keep loading until auth is settled — prevents flash of "no access"
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    // Admins: skip DB, grant everything
    if (isAdmin) {
      const all: PermissionsMap = Object.fromEntries(
        MODULES.map(m => [m.key, fullAccess()])
      );
      setPerms(all);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_permissions" as any)
        .select("module, can_view, can_edit, can_delete")
        .eq("user_id", user.id);

      if (error) throw error;

      const rows = (data ?? []) as PermRow[];
      const map: PermissionsMap = Object.fromEntries(
        MODULES.map(m => [m.key, noAccess()])          // default: no access
      );
      for (const row of rows) {
        map[row.module] = {
          can_view:   row.can_view,
          can_edit:   row.can_edit,
          can_delete: row.can_delete,
        };
      }
      setPerms(map);
    } catch {
      // On error, fall back to empty (safe default)
      setPerms(Object.fromEntries(MODULES.map(m => [m.key, noAccess()])));
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, authLoading]);

  useEffect(() => { void fetchPerms(); }, [fetchPerms]);

  const can = useCallback(
    (module: string, action: PermAction): boolean => {
      if (isAdmin) return true;
      const p = perms[module];
      if (!p) return false;
      if (action === "view")   return p.can_view;
      if (action === "edit")   return p.can_view && p.can_edit;
      if (action === "delete") return p.can_view && p.can_edit && p.can_delete;
      return false;
    },
    [isAdmin, perms],
  );

  return { loading, perms, can, refresh: fetchPerms, isAdmin };
}
