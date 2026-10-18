// UserFilterMenu - global cloud-synced user filter for tasks/meetings/reminders cards.
// Three modes, picked from tabs at the top of the menu:
//   - "רק שלי"       (mine)  - only the current user
//   - "כולם"          (all)   - no filter
//   - "בחירה מרובה"  (multi) - any combination of team members, e.g. me + Dana + Yossi
// The user list is shown only in multi mode. The multi selection is remembered
// separately, so going back to multi mode restores the users picked last time.
// Includes a scope toggle: created_by / assigned_to / both.
// Everything is persisted to the cloud via useSyncedSetting.
import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Users, User as UserIcon, UserCheck, Search, ListChecks } from "lucide-react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { cn } from "@/lib/utils";

export type UserFilterScope = "created_by" | "assigned_to" | "both";
export type UserFilterMode = "mine" | "all" | "multi";
/** "mine" stands for the current user; any other entry is a profile id. */
export const MINE = "mine";
/** Accepted by setValue: "all", "mine", a single profile id or a list (multi mode). */
export type UserFilterValue = "all" | "mine" | string | string[];

// Older versions kept a single value here ("all" | "mine" | id | id[]).
// It is only read, to derive the mode for users who never used the new menu.
const LEGACY_KEY = "global-user-filter";
const MODE_KEY = "global-user-filter-mode";
const MULTI_KEY = "global-user-filter-multi";
const SCOPE_KEY = "global-user-filter-scope";

/** Normalizes a stored list (or legacy single value) to unique entries, mapping yourself to "mine". */
function toList(raw: unknown, currentUserId: string | null): string[] {
  let list: string[];
  if (Array.isArray(raw)) list = raw.filter((v): v is string => typeof v === "string" && !!v);
  else if (typeof raw === "string" && raw && raw !== "all") list = [raw];
  else list = [];
  const mapped = list.map((v) => (currentUserId && v === currentUserId ? MINE : v));
  return Array.from(new Set(mapped));
}

function legacyMode(list: string[]): UserFilterMode {
  if (list.length === 0) return "all";
  if (list.length === 1 && list[0] === MINE) return "mine";
  return "multi";
}

export function useUserFilter() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [legacyValue] = useSyncedSetting<unknown>({ key: LEGACY_KEY, defaultValue: [] });
  const [storedMode, setStoredMode] = useSyncedSetting<UserFilterMode | null>({
    key: MODE_KEY,
    defaultValue: null,
  });
  const [storedMulti, setStoredMulti] = useSyncedSetting<string[] | null>({
    key: MULTI_KEY,
    defaultValue: null,
  });
  const [scope, setScope] = useSyncedSetting<UserFilterScope>({
    key: SCOPE_KEY,
    defaultValue: "both",
  });

  const legacyList = useMemo(() => toList(legacyValue, userId), [legacyValue, userId]);
  const mode: UserFilterMode = storedMode ?? legacyMode(legacyList);
  /** Users picked in multi mode (kept even while another mode is active). */
  const multiUsers = useMemo(
    () => (storedMulti ? toList(storedMulti, userId) : legacyMode(legacyList) === "multi" ? legacyList : []),
    [storedMulti, legacyList, userId],
  );

  const setMode = useCallback((next: UserFilterMode) => setStoredMode(next), [setStoredMode]);

  /** Back-compat: "all" / "mine" switch mode, an id or a list switches to multi with those users. */
  const setValue = useCallback(
    (next: UserFilterValue) => {
      if (next === "all" || next === "mine") {
        setStoredMode(next);
        return;
      }
      setStoredMulti(toList(next, userId));
      setStoredMode("multi");
    },
    [setStoredMode, setStoredMulti, userId],
  );

  /** Adds or removes one user ("mine" or a profile id) in the multi selection. */
  const toggleUser = useCallback(
    (id: string) => {
      const key = userId && id === userId ? MINE : id;
      const next = multiUsers.includes(key)
        ? multiUsers.filter((v) => v !== key)
        : [...multiUsers, key];
      setStoredMulti(next);
      if (mode !== "multi") setStoredMode("multi");
    },
    [multiUsers, mode, setStoredMulti, setStoredMode, userId],
  );

  /** What is actually filtered on right now ("mine" token or profile ids). */
  const selection = useMemo(() => {
    if (mode === "mine") return [MINE];
    if (mode === "multi") return multiUsers;
    return [];
  }, [mode, multiUsers]);

  /** Resolved profile ids to filter by. Empty = no filter (all users). */
  const targetIds = useMemo(() => {
    const ids = selection
      .map((v) => (v === MINE ? userId : v))
      .filter((v): v is string => !!v);
    return Array.from(new Set(ids));
  }, [selection, userId]);

  // Multi mode with nobody ticked behaves like "all" (nothing to filter by).
  const isAll = targetIds.length === 0;
  const isOnlyMine = mode === "mine";
  const value: UserFilterValue = isAll ? "all" : isOnlyMine ? MINE : selection;
  /** A single target id when exactly one user is selected, otherwise null. */
  const targetId = targetIds.length === 1 ? targetIds[0] : null;

  /** Returns true if the item passes the filter. */
  const matches = useCallback((item: any, entity: "tasks" | "meetings" | "reminders") => {
    if (targetIds.length === 0) return true;
    const createdBy = item?.created_by || item?.user_id || null;
    const assignedTo = item?.assigned_to || null;
    const attendees: string[] = Array.isArray(item?.attendees) ? item.attendees : [];

    const createdMatch = !!createdBy && targetIds.includes(createdBy);
    if (entity === "reminders") return createdMatch;

    const assignedMatch =
      (!!assignedTo && targetIds.includes(assignedTo)) ||
      attendees.some((a) => targetIds.includes(a));

    if (scope === "created_by") return createdMatch;
    if (scope === "assigned_to") return assignedMatch;
    return createdMatch || assignedMatch;
  }, [scope, targetIds]);

  return {
    mode,
    setMode,
    multiUsers,
    value,
    setValue,
    selection,
    toggleUser,
    isAll,
    isOnlyMine,
    scope,
    setScope,
    matches,
    targetId,
    targetIds,
  };
}

interface Props {
  align?: "start" | "end" | "center";
  showLabel?: boolean;
}

const MODES: { mode: UserFilterMode; label: string; Icon: typeof Users }[] = [
  { mode: "mine", label: "רק שלי", Icon: UserIcon },
  { mode: "all", label: "כולם", Icon: Users },
  { mode: "multi", label: "בחירה מרובה", Icon: ListChecks },
];

export function UserFilterMenu({ align = "end", showLabel = false }: Props) {
  const { user } = useAuth();
  const { members } = useTeamMembers();
  const { mode, setMode, multiUsers, toggleUser, setValue, isAll, scope, setScope } = useUserFilter();
  const [search, setSearch] = useState("");

  const active = !isAll;
  const Icon = mode === "mine" ? UserIcon : mode === "multi" && !isAll ? UserCheck : Users;

  const nameOf = useCallback(
    (id: string) => {
      if (id === MINE) return "אני";
      const m = members.find((x) => x.id === id);
      return m?.full_name || m?.email || "משתמש";
    },
    [members],
  );

  const label = useMemo(() => {
    if (mode === "mine") return "רק שלי";
    if (mode === "all" || multiUsers.length === 0) return "כל המשתמשים";
    if (multiUsers.length <= 2) return multiUsers.map(nameOf).join(" + ");
    return `${multiUsers.length} משתמשים`;
  }, [mode, multiUsers, nameOf]);

  const filteredMembers = useMemo(() => {
    const others = members.filter((m) => m.id !== user?.id);
    const q = search.trim().toLowerCase();
    if (!q) return others;
    return others.filter((m) => {
      const name = (m.full_name || "").toLowerCase();
      const email = (m.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [members, search, user?.id]);

  // Keep the menu open while ticking several users.
  const keepOpen = (e: Event) => e.preventDefault();

  return (
    <DropdownMenu onOpenChange={(o) => !o && setSearch("")}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant={showLabel ? "outline" : "ghost"}
          className={showLabel
            ? "h-8 gap-1.5 px-3 hover:bg-primary/10 relative"
            : "h-8 w-8 p-0 hover:bg-primary/10 relative"}
          title={`סינון לפי משתמש: ${label}`}
          style={active ? { color: "#d8ac27" } : undefined}
        >
          <Icon className="h-4 w-4" />
          {showLabel && <span className="text-xs max-w-40 truncate">{label}</span>}
          {active && (
            <span
              className="absolute top-0.5 left-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-background"
              style={{ background: "#d8ac27" }}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* One scroll area for the whole menu, never taller than the space on screen,
          so the wheel always scrolls the list without moving the page. */}
      <DropdownMenuContent
        align={align}
        sideOffset={6}
        className="w-72 rtl max-h-[min(80vh,var(--radix-dropdown-menu-content-available-height))] overscroll-contain"
      >
        {/* Mode tabs */}
        <div className="p-1.5" role="tablist" aria-label="מצב הסינון">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {MODES.map(({ mode: m, label: l, Icon: TabIcon }) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-xs transition-colors",
                  mode === m
                    ? "bg-background font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                style={mode === m ? { color: "#d8ac27" } : undefined}
              >
                <TabIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{l}</span>
              </button>
            ))}
          </div>
        </div>

        {mode === "multi" && (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-2 py-1">
              <DropdownMenuLabel className="p-0 text-right">
                בחר משתמשים
                <span className="block text-[11px] font-normal opacity-60">
                  {multiUsers.length === 0
                    ? "לא נבחר אף משתמש - מוצגים כולם"
                    : `נבחרו ${multiUsers.length}`}
                </span>
              </DropdownMenuLabel>
              {multiUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setValue([])}
                  className="text-xs underline opacity-70 hover:opacity-100"
                >
                  נקה
                </button>
              )}
            </div>

            <DropdownMenuCheckboxItem
              checked={multiUsers.includes(MINE)}
              onCheckedChange={() => toggleUser(MINE)}
              onSelect={keepOpen}
              className="text-right"
              disabled={!user?.id}
            >
              אני
            </DropdownMenuCheckboxItem>

            {/* Search */}
            <div className="px-2 py-1.5">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="חיפוש משתמש..."
                  className="h-7 pr-7 text-xs text-right"
                />
              </div>
            </div>

            {filteredMembers.length === 0 && (
              <DropdownMenuItem disabled className="text-right opacity-60 text-xs">
                {members.length === 0 ? "אין משתמשים זמינים" : "לא נמצאו תוצאות"}
              </DropdownMenuItem>
            )}
            {filteredMembers.map((m) => (
              <DropdownMenuCheckboxItem
                key={m.id}
                checked={multiUsers.includes(m.id)}
                onCheckedChange={() => toggleUser(m.id)}
                onSelect={keepOpen}
                className="text-right"
              >
                <span className="truncate">
                  {m.full_name || m.email || m.id.slice(0, 8)}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}

        {mode !== "all" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-right">היקף הסינון</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as UserFilterScope)}
            >
              <DropdownMenuRadioItem
                value="created_by"
                className="flex-row-reverse justify-end text-right"
                onSelect={keepOpen}
              >
                מי שהוסיף
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="assigned_to"
                className="flex-row-reverse justify-end text-right"
                onSelect={keepOpen}
              >
                משויך ל
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="both"
                className="flex-row-reverse justify-end text-right"
                onSelect={keepOpen}
              >
                שניהם
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
