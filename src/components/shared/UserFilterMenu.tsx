// UserFilterMenu - global cloud-synced user filter for tasks/meetings/reminders cards.
// Icon button next to the sort icon. Lets the user show:
//   - All users (default)
//   - Only me (quick shortcut)
//   - Any specific team member
// Includes a scope toggle: created_by / assigned_to / both
// The selection is a single global value persisted to the cloud via useSyncedSetting.
import React, { useMemo } from "react";
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
import { Users, User as UserIcon, UserCheck } from "lucide-react";
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
    defaultValue: "created_by",
  });

  const targetId = value === "mine" ? user?.id ?? null : value === "all" ? null : value;

  /** Returns true if the item passes the filter. */
  const matches = (item: any, entity: "tasks" | "meetings" | "reminders") => {
    if (!targetId) return true;
    const createdBy = item?.created_by || item?.user_id || null;
    const assignedTo = item?.assigned_to || null;

    // Reminders don't really have assigned_to — only created_by/user_id.
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

  const active = value !== "all";
  const Icon = value === "all" ? Users : value === "mine" ? UserIcon : UserCheck;

  const label = useMemo(() => {
    if (value === "all") return "כל המשתמשים";
    if (value === "mine") return "רק שלי";
    const m = members.find((x) => x.id === value);
    return m?.full_name || m?.email || "משתמש";
  }, [value, members]);

  return (
    <DropdownMenu>
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
              className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full"
              style={{ background: "#d8ac27" }}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64 rtl" sideOffset={6}>
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
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="mine"
            className="flex-row-reverse justify-end text-right"
            disabled={!user?.id}
          >
            רק שלי
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-right text-xs opacity-70">
            משתמש ספציפי
          </DropdownMenuLabel>
          <div className="max-h-64 overflow-y-auto">
            {members.length === 0 && (
              <DropdownMenuItem disabled className="text-right opacity-60">
                אין משתמשים זמינים
              </DropdownMenuItem>
            )}
            {members.map((m) => (
              <DropdownMenuRadioItem
                key={m.id}
                value={m.id}
                className="flex-row-reverse justify-end text-right"
              >
                {m.full_name || m.email || m.id.slice(0, 8)}
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
