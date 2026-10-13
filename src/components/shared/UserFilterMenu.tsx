// UserFilterMenu - global cloud-synced user filter for tasks/meetings/reminders cards.
// Icon button next to the sort icon. Lets the user show:
//   - All users (default)
//   - Only me (quick shortcut)
//   - Any combination of team members (multi-select, searchable list),
//     e.g. "me + Dana + Yossi"
// Includes a scope toggle: created_by / assigned_to / both
// The selection is a single global value persisted to the cloud via useSyncedSetting.
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
import { Badge } from "@/components/ui/badge";
import { Users, User as UserIcon, UserCheck, Search, Check } from "lucide-react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers } from "@/hooks/useTeamMembers";

export type UserFilterScope = "created_by" | "assigned_to" | "both";
/** "mine" stands for the current user; any other entry is a profile id. */
export const MINE = "mine";
/**
 * Stored value. Older versions stored a single string ("all" | "mine" | id);
 * the multi-select version stores an array (empty array = all users).
 */
export type UserFilterValue = "all" | "mine" | string | string[];

const KEY = "global-user-filter";
const SCOPE_KEY = "global-user-filter-scope";

/** Normalizes any stored value (legacy single string or array) to a selection list. */
function toSelection(raw: unknown, currentUserId: string | null): string[] {
  let list: string[];
  if (Array.isArray(raw)) list = raw.filter((v): v is string => typeof v === "string" && !!v);
  else if (typeof raw === "string" && raw && raw !== "all") list = [raw];
  else list = [];
  // Selecting yourself from the list is the same as "mine".
  const mapped = list.map((v) => (currentUserId && v === currentUserId ? MINE : v));
  return Array.from(new Set(mapped));
}

export function useUserFilter() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [rawValue, setRawValue] = useSyncedSetting<UserFilterValue>({
    key: KEY,
    defaultValue: [],
  });
  const [scope, setScope] = useSyncedSetting<UserFilterScope>({
    key: SCOPE_KEY,
    defaultValue: "both",
  });

  const selection = useMemo(() => toSelection(rawValue, userId), [rawValue, userId]);

  /** Resolved profile ids to filter by. Empty = no filter (all users). */
  const targetIds = useMemo(() => {
    const ids = selection
      .map((v) => (v === MINE ? userId : v))
      .filter((v): v is string => !!v);
    return Array.from(new Set(ids));
  }, [selection, userId]);

  const isAll = selection.length === 0;
  const isOnlyMine = selection.length === 1 && selection[0] === MINE;

  /** Back-compat single value: "all", "mine", a single id, or the list. */
  const value: UserFilterValue = isAll ? "all" : selection.length === 1 ? selection[0] : selection;

  /** Accepts "all", "mine", a single id or a list of ids. */
  const setValue = useCallback(
    (next: UserFilterValue) => setRawValue(toSelection(next, userId)),
    [setRawValue, userId],
  );

  /** Adds or removes one entry ("mine" or a profile id) from the selection. */
  const toggleUser = useCallback(
    (id: string) => {
      const key = userId && id === userId ? MINE : id;
      const next = selection.includes(key)
        ? selection.filter((v) => v !== key)
        : [...selection, key];
      setRawValue(next);
    },
    [selection, setRawValue, userId],
  );

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

export function UserFilterMenu({ align = "end", showLabel = false }: Props) {
  const { user } = useAuth();
  const { members } = useTeamMembers();
  const { selection, setValue, toggleUser, isAll, isOnlyMine, scope, setScope } = useUserFilter();
  const [search, setSearch] = useState("");

  const active = !isAll;
  const Icon = isAll ? Users : isOnlyMine ? UserIcon : UserCheck;

  const nameOf = useCallback(
    (id: string) => {
      if (id === MINE) return "אני";
      const m = members.find((x) => x.id === id);
      return m?.full_name || m?.email || "משתמש";
    },
    [members],
  );

  const label = useMemo(() => {
    if (isAll) return "כל המשתמשים";
    if (isOnlyMine) return "רק שלי";
    if (selection.length <= 2) return selection.map(nameOf).join(" + ");
    return `${selection.length} משתמשים`;
  }, [isAll, isOnlyMine, selection, nameOf]);

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

  const quickToggle = () => setValue(isOnlyMine ? "all" : MINE);

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
      <DropdownMenuContent align={align} className="w-72 rtl" sideOffset={6}>
        {/* Active indicator banner */}
        {active && (
          <div
            className="mx-2 mt-2 mb-1 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs"
            style={{ background: "#d8ac2715", border: "1px solid #d8ac2750", color: "#d8ac27" }}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">מסנן פעיל: {selection.map(nameOf).join(", ")}</span>
            </span>
            <button
              type="button"
              onClick={() => setValue("all")}
              className="text-xs underline opacity-80 hover:opacity-100 shrink-0"
            >
              נקה
            </button>
          </div>
        )}

        {/* Quick toggle: all <-> mine */}
        <div className="px-2 py-1.5 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 flex-1 text-xs gap-1.5"
            onClick={quickToggle}
            style={
              isOnlyMine
                ? { background: "#d8ac2715", borderColor: "#d8ac2750", color: "#d8ac27" }
                : undefined
            }
          >
            {isOnlyMine ? (
              <>
                <Users className="h-3.5 w-3.5" /> הצג הכל
              </>
            ) : (
              <>
                <UserIcon className="h-3.5 w-3.5" /> רק שלי
              </>
            )}
          </Button>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-right">
          סינון לפי משתמש
          <span className="block text-[11px] font-normal opacity-60">אפשר לסמן כמה משתמשים יחד</span>
        </DropdownMenuLabel>

        <DropdownMenuCheckboxItem
          checked={isAll}
          onCheckedChange={() => setValue("all")}
          onSelect={keepOpen}
          className="text-right"
        >
          כל המשתמשים
          <Badge variant="secondary" className="mr-auto h-5 text-[10px]">
            {members.length}
          </Badge>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={selection.includes(MINE)}
          onCheckedChange={() => toggleUser(MINE)}
          onSelect={keepOpen}
          className="text-right"
          disabled={!user?.id}
        >
          שלי
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

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

        <DropdownMenuLabel className="text-right text-xs opacity-70">
          משתמשים נוספים
        </DropdownMenuLabel>
        <div className="max-h-56 overflow-y-auto">
          {filteredMembers.length === 0 && (
            <DropdownMenuItem disabled className="text-right opacity-60 text-xs">
              {members.length === 0 ? "אין משתמשים זמינים" : "לא נמצאו תוצאות"}
            </DropdownMenuItem>
          )}
          {filteredMembers.map((m) => (
            <DropdownMenuCheckboxItem
              key={m.id}
              checked={selection.includes(m.id)}
              onCheckedChange={() => toggleUser(m.id)}
              onSelect={keepOpen}
              className="text-right"
            >
              <span className="truncate">
                {m.full_name || m.email || m.id.slice(0, 8)}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-right">היקף הסינון</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={scope}
          onValueChange={(v) => setScope(v as UserFilterScope)}
        >
          <DropdownMenuRadioItem
            value="created_by"
            className="flex-row-reverse justify-end text-right"
          >
            מי שהוסיף
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="assigned_to"
            className="flex-row-reverse justify-end text-right"
          >
            משויך ל
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="both"
            className="flex-row-reverse justify-end text-right"
          >
            שניהם
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
