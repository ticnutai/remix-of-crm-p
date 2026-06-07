// Reusable Sort/Group Menu for Tasks/Meetings/Reminders
// Cloud-synced preferences (via useSyncedSetting) — last selection persists across refresh and devices.
import React from "react";
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
import { ArrowDown, ArrowUp, ArrowUpDown, Check } from "lucide-react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import type { SortField, SortOrder, GroupBy } from "@/utils/sortAndDedup";

export type EntityKind = "tasks" | "meetings" | "reminders";

interface SortMenuProps {
  entity: EntityKind;
  size?: "sm" | "icon" | "default";
  /** When true, render only an icon button (no label). */
  iconOnly?: boolean;
  align?: "start" | "end" | "center";
  showGroup?: boolean;
}

const FIELD_LABELS_TASK: Record<SortField, string> = {
  title: "שם / כותרת",
  created_by: "מי הוסיף",
  created_at: "תאריך יצירה",
  due_date: "תאריך יעד",
  event_date: "תאריך יעד",
  priority: "עדיפות",
  status: "סטטוס",
};

const FIELD_LABELS_MEETING: Record<SortField, string> = {
  title: "שם / כותרת",
  created_by: "מי הוסיף",
  created_at: "תאריך יצירה",
  due_date: "מועד פגישה",
  event_date: "מועד פגישה",
  priority: "עדיפות",
  status: "סטטוס",
};

const FIELD_LABELS_REMINDER: Record<SortField, string> = {
  title: "שם / כותרת",
  created_by: "מי הוסיף",
  created_at: "תאריך יצירה",
  due_date: "מועד תזכורת",
  event_date: "מועד תזכורת",
  priority: "עדיפות",
  status: "סטטוס",
};

const TASK_FIELDS: SortField[] = ["title", "due_date", "created_by", "created_at", "priority", "status"];
const MEETING_FIELDS: SortField[] = ["title", "event_date", "created_by", "created_at", "status"];
const REMINDER_FIELDS: SortField[] = ["title", "event_date", "created_by", "created_at", "status"];

const GROUP_LABELS: Record<GroupBy, string> = {
  none: "ללא קיבוץ",
  created_by: "לפי משתמש שהוסיף",
  priority: "לפי עדיפות",
  status: "לפי סטטוס",
  date: "לפי תאריך",
};

const TASK_GROUPS: GroupBy[] = ["none", "created_by", "priority", "status", "date"];
const MEETING_GROUPS: GroupBy[] = ["none", "created_by", "status", "date"];
const REMINDER_GROUPS: GroupBy[] = ["none", "created_by", "status", "date"];

/** Global cloud-synced sort state for a given entity ('tasks' | 'meetings'). */
export function useEntitySort(entity: EntityKind) {
  const defaultField: SortField = entity === "tasks" ? "due_date" : "event_date";
  const [sortBy, setSortBy] = useSyncedSetting<SortField>({
    key: `${entity}-sort-by`,
    defaultValue: defaultField,
  });
  const [sortOrder, setSortOrder] = useSyncedSetting<SortOrder>({
    key: `${entity}-sort-order`,
    defaultValue: "asc",
  });
  const [groupBy, setGroupBy] = useSyncedSetting<GroupBy>({
    key: `${entity}-group-by`,
    defaultValue: "none",
  });
  return { sortBy, setSortBy, sortOrder, setSortOrder, groupBy, setGroupBy };
}

export function SortMenu({
  entity,
  iconOnly = false,
  align = "end",
  showGroup = true,
}: SortMenuProps) {
  const { sortBy, setSortBy, sortOrder, setSortOrder, groupBy, setGroupBy } =
    useEntitySort(entity);

  const labels =
    entity === "tasks"
      ? FIELD_LABELS_TASK
      : entity === "meetings"
        ? FIELD_LABELS_MEETING
        : FIELD_LABELS_REMINDER;
  const fields =
    entity === "tasks"
      ? TASK_FIELDS
      : entity === "meetings"
        ? MEETING_FIELDS
        : REMINDER_FIELDS;
  const groups =
    entity === "tasks"
      ? TASK_GROUPS
      : entity === "meetings"
        ? MEETING_GROUPS
        : REMINDER_GROUPS;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {iconOnly ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-primary/10"
            title={`מיון: ${labels[sortBy]} · ${sortOrder === "asc" ? "עולה" : "יורד"}`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <span>{labels[sortBy]}</span>
            {sortOrder === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56 rtl" sideOffset={6}>
        <DropdownMenuLabel className="text-right">מיון לפי</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortField)}
        >
          {fields.map((f) => (
            <DropdownMenuRadioItem
              key={f}
              value={f}
              className="flex-row-reverse justify-end text-right"
            >
              {labels[f]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-right">כיוון</DropdownMenuLabel>
        <DropdownMenuItem
          className="justify-between"
          onClick={() => setSortOrder("asc")}
        >
          <span>{sortOrder === "asc" && <Check className="h-4 w-4" />}</span>
          <span className="flex items-center gap-2">
            עולה <ArrowUp className="h-3.5 w-3.5" />
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-between"
          onClick={() => setSortOrder("desc")}
        >
          <span>{sortOrder === "desc" && <Check className="h-4 w-4" />}</span>
          <span className="flex items-center gap-2">
            יורד <ArrowDown className="h-3.5 w-3.5" />
          </span>
        </DropdownMenuItem>

        {showGroup && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-right">קיבוץ</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={groupBy}
              onValueChange={(v) => setGroupBy(v as GroupBy)}
            >
              {groups.map((g) => (
                <DropdownMenuRadioItem
                  key={g}
                  value={g}
                  className="flex-row-reverse justify-end text-right"
                >
                  {GROUP_LABELS[g]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helpers to get a sort field value for tasks/meetings
export function getTaskSortValue(task: any, field: SortField): string | null | undefined {
  switch (field) {
    case "created_at":
      return task.created_at;
    case "due_date":
    case "event_date":
      return task.due_date;
    case "title":
      return task.title;
    case "created_by":
      return task.creator?.full_name || task.created_by;
    case "priority":
      return task.priority;
    case "status":
      return task.status;
    default:
      return null;
  }
}

export function getMeetingSortValue(meeting: any, field: SortField): string | null | undefined {
  switch (field) {
    case "created_at":
      return meeting.created_at;
    case "due_date":
    case "event_date":
      return meeting.start_time;
    case "title":
      return meeting.title;
    case "created_by":
      return meeting.creator?.full_name || meeting.created_by;
    case "status":
      return meeting.status;
    case "priority":
      return null;
    default:
      return null;
  }
}

export function getReminderSortValue(reminder: any, field: SortField): string | null | undefined {
  switch (field) {
    case "created_at":
      return reminder.created_at;
    case "due_date":
    case "event_date":
      return reminder.remind_at;
    case "title":
      return reminder.title;
    case "created_by":
      return reminder.creator?.full_name || reminder.created_by || reminder.user_id;
    case "status":
      return reminder.is_dismissed ? "dismissed" : reminder.is_sent ? "sent" : "pending";
    case "priority":
      return null;
    default:
      return null;
  }
}

/** Returns a group key for an item given current groupBy + entity. */
export function getGroupKey(
  item: any,
  groupBy: GroupBy,
  entity: EntityKind,
  resolveUser: (id: string | null | undefined) => string,
): string {
  if (groupBy === "none") return "";
  if (groupBy === "created_by") {
    return resolveUser(item.created_by || item.user_id) || "ללא משתמש";
  }
  if (groupBy === "priority") return item.priority || "—";
  if (groupBy === "status") {
    if (entity === "reminders") {
      return item.is_dismissed ? "נדחה" : item.is_sent ? "נשלח" : "ממתין";
    }
    return item.status || "—";
  }
  if (groupBy === "date") {
    const raw =
      entity === "tasks"
        ? item.due_date
        : entity === "reminders"
          ? item.remind_at
          : item.start_time;
    if (!raw) return "ללא תאריך";
    try {
      const d = new Date(raw);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return "ללא תאריך";
    }
  }
  return "";
}
