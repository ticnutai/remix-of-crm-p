// UserFilterMenu - global cloud-synced user filter for tasks/meetings/reminders cards.
// Icon button next to the sort icon. Lets the user show:
//   - All users (default)
//   - Only me (quick shortcut)
//   - Any specific team member (searchable list)
// Includes a scope toggle: created_by / assigned_to / both
// The selection is a single global value persisted to the cloud via useSyncedSetting.
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
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
/** "all" = no filter, "mine" = current user, or a profile id */
export type UserFilterValue = "all" | "mine" | string;

const KEY = "global-user-filter";
const SCOPE_KEY = "global-user-filter-scope";

export function useUserFilter() {
  const { user } = useAuth();
  const [value, setValue] = useSyncedSetting<UserFilterValue>({
    key: KEY,
    defaultValue: "all",
  });
  const [scope, setScope] = useSyncedSetting<UserFilterScope>({
    key: SCOPE_KEY,
    defaultValue: "both",
  });

  const targetId = value === "mine" ? user?.id ?? null : value === "all" ? null : value;

  /** Returns true if the item passes the filter. */
  const matches = (item: any, entity: "tasks" | "meetings" | "reminders") => {
    if (!targetId) return true;
    const createdBy = item?.created_by || item?.user_id || null;
    const assignedTo = item?.assigned_to || null;

    if (entity === "reminders") return createdBy === targetId;

    if (scope === "created_by") return createdBy === targetId;
    if (scope === "assigned_to") return assignedTo === targetId;
    return createdBy === targetId || assignedTo === targetId;
  };

  return { value, setValue, scope, setScope, matches, targetId };
}

interface Props {
  align?: "start" | "end" | "center";
}

export function UserFilterMenu({ align = "end" }: Props) {
  const { user } = useAuth();
  const { members } = useTeamMembers();
  const { value, setValue, scope, setScope } = useUserFilter();
  const [search, setSearch] = useState("");

  const active = value !== "all";
  const Icon = value === "all" ? Users : value === "mine" ? UserIcon : UserCheck;

  const label = useMemo(() => {
    if (value === "all") return "כל המשתמשים";
    if (value === "mine") return "רק שלי";
    const m = members.find((x) => x.id === value);
    return m?.full_name || m?.email || "משתמש";
  }, [value, members]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = (m.full_name || "").toLowerCase();
      const email = (m.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [members, search]);

  const quickToggle = () => setValue(value === "mine" ? "all" : "mine");

  return (
    <DropdownMenu onOpenChange={(o) => !o && setSearch("")}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-primary/10 relative"
          title={`סינון לפי משתמש: ${label}`}
          style={active ? { color: "#d8ac27" } : undefined}
        >
          <Icon className="h-4 w-4" />
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
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              מסנן פעיל: {label}
            </span>
            <button
              type="button"
              onClick={() => setValue("all")}
              className="text-xs underline opacity-80 hover:opacity-100"
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
              value === "mine"
                ? { background: "#d8ac2715", borderColor: "#d8ac2750", color: "#d8ac27" }
                : undefined
            }
          >
            {value === "mine" ? (
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
        <DropdownMenuLabel className="text-right">סינון לפי משתמש</DropdownMenuLabel>

        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => setValue(v as UserFilterValue)}
        >
          <DropdownMenuRadioItem
            value="all"
            className="flex-row-reverse justify-end text-right"
          >
            כל המשתמשים
            <Badge variant="secondary" className="mr-auto h-5 text-[10px]">
              {members.length}
            </Badge>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="mine"
            className="flex-row-reverse justify-end text-right"
            disabled={!user?.id}
          >
            רק שלי
          </DropdownMenuRadioItem>

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
            משתמש ספציפי
          </DropdownMenuLabel>
          <div className="max-h-56 overflow-y-auto">
            {filteredMembers.length === 0 && (
              <DropdownMenuItem disabled className="text-right opacity-60 text-xs">
                {members.length === 0 ? "אין משתמשים זמינים" : "לא נמצאו תוצאות"}
              </DropdownMenuItem>
            )}
            {filteredMembers.map((m) => (
              <DropdownMenuRadioItem
                key={m.id}
                value={m.id}
                className="flex-row-reverse justify-end text-right"
              >
                <span className="truncate">
                  {m.full_name || m.email || m.id.slice(0, 8)}
                </span>
                {m.id === user?.id && (
                  <span className="text-xs opacity-60 mr-2">(אני)</span>
                )}
              </DropdownMenuRadioItem>
            ))}
          </div>
        </DropdownMenuRadioGroup>

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
