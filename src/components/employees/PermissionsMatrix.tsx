/**
 * PermissionsMatrix — Admin UI to manage per-user, per-module permissions.
 *
 * Layout:
 *   Top bar: employee selector + template picker + apply button
 *   Table: rows = sidebar modules (grouped), columns = view / edit / delete
 *   Each cell: checkbox. Editing one column auto-adjusts dependencies
 *     (e.g. enabling edit auto-enables view; disabling view auto-disables edit+delete)
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MODULES,
  ModuleDef,
  ModulePerm,
  PermissionsMap,
  ROLE_TEMPLATES,
  RoleTemplate,
} from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Crown, Eye, Pencil, Trash2, Save, RefreshCcw, ShieldCheck, Users,
  ShieldAlert, UserCog, UserCheck, ChevronDown, ChevronUp, Loader2, Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ---- Types ----
interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

type DraftMap = Record<string, ModulePerm>;

function noAccess(): ModulePerm  { return { can_view: false, can_edit: false, can_delete: false }; }

const TEMPLATE_META: Record<string, { label: string; color: string; icon: React.ElementType; desc: string }> = {
  admin:    { label: "אדמין",   color: "bg-red-100 text-red-700 border-red-200",    icon: Crown,       desc: "גישה מלאה לכל המודולים ללא הגבלה" },
  manager:  { label: "מנהל",   color: "bg-amber-100 text-amber-700 border-amber-200", icon: UserCog,  desc: "גישה מלאה לרוב המודולים, ללא HR וכספים מלאים" },
  employee: { label: "עובד",   color: "bg-blue-100 text-blue-700 border-blue-200",  icon: UserCheck,   desc: "צפייה ועריכה מוגבלת, ללא גישה לניהול" },
  client:   { label: "לקוח",   color: "bg-green-100 text-green-700 border-green-200", icon: Users,   desc: "גישה לעמודים ממוקדים לקוח בלבד" },
};

const GROUP_ICONS: Record<string, React.ElementType> = {
  "כללי":        ShieldCheck,
  "לקוחות":      Users,
  "עובדים ו-HR": UserCog,
  "זמן":         RefreshCcw,
  "משימות":      ShieldCheck,
  "כספים":       ShieldAlert,
  "כלים":        ShieldCheck,
};

// ---- Helper: group modules ----
function groupModules(modules: ModuleDef[]): [string, ModuleDef[]][] {
  const groups: Record<string, ModuleDef[]> = {};
  for (const m of modules) {
    if (!groups[m.group]) groups[m.group] = [];
    groups[m.group].push(m);
  }
  return Object.entries(groups);
}

// ---- Main component ----
export function PermissionsMatrix({ employees }: { employees: Employee[] }) {
  const { user } = useAuth();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [draft, setDraft] = useState<DraftMap>({});
  const [saving, setSaving] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [confirmTemplate, setConfirmTemplate] = useState<RoleTemplate | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);

  const selectedEmployee = useMemo(
    () => employees.find(e => e.id === selectedUserId),
    [employees, selectedUserId],
  );

  const isAdminUser = selectedEmployee?.role === "admin" || selectedEmployee?.role === "super_manager";

  // Load permissions for selected user
  const loadUserPerms = useCallback(async (userId: string) => {
    setLoadingUser(true);
    setDirty(false);
    try {
      const { data, error } = await supabase
        .from("user_permissions" as any)
        .select("module, can_view, can_edit, can_delete")
        .eq("user_id", userId);

      if (error) throw error;

      const base: DraftMap = Object.fromEntries(MODULES.map(m => [m.key, noAccess()]));
      for (const row of (data ?? []) as any[]) {
        base[row.module] = {
          can_view:   row.can_view,
          can_edit:   row.can_edit,
          can_delete: row.can_delete,
        };
      }
      setDraft(base);
    } catch (e: any) {
      toast({ title: "שגיאה בטעינת הרשאות", description: e.message, variant: "destructive" });
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) void loadUserPerms(selectedUserId);
    else setDraft({});
  }, [selectedUserId, loadUserPerms]);

  // Toggle a single cell
  const toggle = useCallback((moduleKey: string, field: keyof ModulePerm) => {
    setDraft(prev => {
      const cur = prev[moduleKey] ?? noAccess();
      let next = { ...cur };

      if (field === "can_view") {
        next.can_view = !cur.can_view;
        // Disabling view → strip edit + delete
        if (!next.can_view) { next.can_edit = false; next.can_delete = false; }
      } else if (field === "can_edit") {
        next.can_edit = !cur.can_edit;
        // Enabling edit → auto-enable view
        if (next.can_edit) next.can_view = true;
        // Disabling edit → strip delete
        if (!next.can_edit) next.can_delete = false;
      } else if (field === "can_delete") {
        next.can_delete = !cur.can_delete;
        // Enabling delete → auto-enable view + edit
        if (next.can_delete) { next.can_view = true; next.can_edit = true; }
      }

      setDirty(true);
      return { ...prev, [moduleKey]: next };
    });
  }, []);

  // Apply a role template
  const applyTemplate = useCallback((role: RoleTemplate) => {
    const tpl = ROLE_TEMPLATES[role];
    if (!tpl) {
      // admin template → everything full
      setDraft(Object.fromEntries(
        MODULES.map(m => [m.key, { can_view: true, can_edit: true, can_delete: true }])
      ));
    } else {
      setDraft(tpl as DraftMap);
    }
    setDirty(true);
    setConfirmTemplate(null);
  }, []);

  // Bulk actions per group
  const setGroupAccess = useCallback((group: string, level: "full" | "view" | "none") => {
    const keys = MODULES.filter(m => m.group === group).map(m => m.key);
    setDraft(prev => {
      const next = { ...prev };
      for (const k of keys) {
        next[k] = level === "full"
          ? { can_view: true, can_edit: true, can_delete: true }
          : level === "view"
          ? { can_view: true, can_edit: false, can_delete: false }
          : noAccess();
      }
      return next;
    });
    setDirty(true);
  }, []);

  // Save to Supabase
  const save = async () => {
    if (!selectedUserId || !user) return;
    setSaving(true);
    try {
      // Upsert all modules in a single batch
      const rows = MODULES.map(m => ({
        user_id:    selectedUserId,
        module:     m.key,
        can_view:   draft[m.key]?.can_view   ?? false,
        can_edit:   draft[m.key]?.can_edit   ?? false,
        can_delete: draft[m.key]?.can_delete ?? false,
        updated_by: user.id,
      }));

      const { error } = await supabase
        .from("user_permissions" as any)
        .upsert(rows, { onConflict: "user_id,module" });

      if (error) throw error;
      setDirty(false);
      toast({ title: "הרשאות נשמרו", description: `${selectedEmployee?.full_name ?? ""}` });
    } catch (e: any) {
      toast({ title: "שגיאה בשמירה", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => groupModules(MODULES), []);

  // ---- Render ----
  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Top controls ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-primary" />
            מטריצת הרשאות משתמשים
          </CardTitle>
          <CardDescription>
            בחר עובד, החל תבנית תפקיד או קבע הרשאות ידנית לכל מודול — ולאחר מכן שמור.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Employee picker */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                בחר עובד / משתמש
              </label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר משתמש…" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="flex items-center gap-2">
                        {e.full_name || e.email}
                        <RoleBadge role={e.role} />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadUserPerms(selectedUserId)}
                disabled={loadingUser}
              >
                {loadingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              </Button>
            )}

            {selectedUserId && dirty && (
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                שמור הרשאות
              </Button>
            )}
          </div>

          {/* Template buttons */}
          {selectedUserId && !isAdminUser && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">החל תבנית תפקיד</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(TEMPLATE_META) as [RoleTemplate, typeof TEMPLATE_META[string]][]).map(([role, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <TooltipProvider key={role}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`gap-1.5 border ${meta.color}`}
                            onClick={() => setConfirmTemplate(role)}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {meta.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="max-w-[200px] text-xs">{meta.desc}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin notice */}
          {selectedUserId && isAdminUser && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <Crown className="h-4 w-4 shrink-0" />
              משתמש זה הוא אדמין — יש לו גישה מלאה לכל המערכת ללא תלות בהרשאות.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Permission table ── */}
      {selectedUserId && !isAdminUser && (
        <div className="space-y-3">
          {grouped.map(([group, mods]) => {
            const GroupIcon = GROUP_ICONS[group] ?? ShieldCheck;
            const collapsed = collapsedGroups[group];

            // Group-level stats
            const anyView   = mods.some(m => draft[m.key]?.can_view);
            const anyEdit   = mods.some(m => draft[m.key]?.can_edit);
            const anyDelete = mods.some(m => draft[m.key]?.can_delete);

            return (
              <Card key={group} className="overflow-hidden">
                {/* Group header */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-right"
                  onClick={() =>
                    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }))
                  }
                >
                  <span className="flex items-center gap-2 font-semibold text-sm">
                    <GroupIcon className="h-4 w-4 text-muted-foreground" />
                    {group}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({mods.length} מודולים)
                    </span>
                  </span>

                  <span className="flex items-center gap-3">
                    {/* Quick bulk buttons */}
                    <span
                      className="flex gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setGroupAccess(group, "none")}
                      >
                        ללא גישה
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setGroupAccess(group, "view")}
                      >
                        צפייה
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setGroupAccess(group, "full")}
                      >
                        מלא
                      </Button>
                    </span>

                    {/* Status dots */}
                    <span className="flex gap-1">
                      <span className={`w-2 h-2 rounded-full ${anyView ? "bg-green-400" : "bg-gray-200"}`} title="צפייה" />
                      <span className={`w-2 h-2 rounded-full ${anyEdit ? "bg-blue-400" : "bg-gray-200"}`} title="עריכה" />
                      <span className={`w-2 h-2 rounded-full ${anyDelete ? "bg-red-400" : "bg-gray-200"}`} title="מחיקה" />
                    </span>

                    {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </span>
                </button>

                {/* Module rows */}
                {!collapsed && (
                  <div className="divide-y">
                    {/* Column header */}
                    <div className="grid grid-cols-[1fr_80px_80px_80px] items-center px-5 py-2 text-xs font-semibold text-muted-foreground bg-muted/10">
                      <span>מודול</span>
                      <span className="text-center flex items-center justify-center gap-1">
                        <Eye className="h-3 w-3" /> צפייה
                      </span>
                      <span className="text-center flex items-center justify-center gap-1">
                        <Pencil className="h-3 w-3" /> עריכה
                      </span>
                      <span className="text-center flex items-center justify-center gap-1">
                        <Trash2 className="h-3 w-3" /> מחיקה
                      </span>
                    </div>

                    {mods.map(mod => {
                      const p = draft[mod.key] ?? noAccess();
                      const isLoading = loadingUser;
                      return (
                        <div
                          key={mod.key}
                          className={`grid grid-cols-[1fr_80px_80px_80px] items-center px-5 py-3 hover:bg-muted/10 transition-colors ${mod.adminOnly ? "opacity-60" : ""}`}
                        >
                          <span className="text-sm flex items-center gap-2">
                            {mod.label}
                            {mod.adminOnly && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1">
                                אדמין
                              </Badge>
                            )}
                          </span>

                          {(["can_view", "can_edit", "can_delete"] as (keyof ModulePerm)[]).map(field => (
                            <div key={field} className="flex justify-center">
                              <Checkbox
                                checked={p[field]}
                                disabled={isLoading}
                                onCheckedChange={() => toggle(mod.key, field)}
                                className={
                                  field === "can_view"   ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" :
                                  field === "can_edit"   ? "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" :
                                                           "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                }
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Sticky save bar */}
          {dirty && (
            <div className="sticky bottom-4 flex justify-end">
              <div className="flex items-center gap-3 bg-background border rounded-xl shadow-lg px-4 py-2">
                <Info className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">יש שינויים שלא נשמרו</span>
                <Button onClick={save} disabled={saving} size="sm" className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  שמור
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Confirm template dialog ── */}
      <AlertDialog open={!!confirmTemplate} onOpenChange={o => !o && setConfirmTemplate(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>החלת תבנית תפקיד</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTemplate && (
                <>
                  האם להחיל את תבנית &ldquo;{TEMPLATE_META[confirmTemplate]?.label}&rdquo; על{" "}
                  <strong>{selectedEmployee?.full_name ?? "המשתמש הנבחר"}</strong>?
                  <br />
                  <span className="text-xs mt-1 block">{TEMPLATE_META[confirmTemplate]?.desc}</span>
                  <br />
                  פעולה זו תדרוס את ההגדרות הנוכחיות (לא תישמר עד שתלחץ &ldquo;שמור&rdquo;).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmTemplate && applyTemplate(confirmTemplate)}
            >
              החל תבנית
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Mini role badge ----
function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin:         "bg-red-100 text-red-700",
    super_manager: "bg-purple-100 text-purple-700",
    manager:       "bg-amber-100 text-amber-700",
    employee:      "bg-blue-100 text-blue-700",
  };
  const labels: Record<string, string> = {
    admin:         "אדמין",
    super_manager: "סופר מנהל",
    manager:       "מנהל",
    employee:      "עובד",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[role] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[role] ?? role}
    </span>
  );
}
