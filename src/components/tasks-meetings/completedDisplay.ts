import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import type { CompletedDisplayMode } from "./CompletedDisplayToggle";

/** פריט "בוצע": משימה/פגישה בסטטוס completed, או תזכורת שהושלמה או כבר נשלחה. */
export function isItemDone(item: {
  status?: string | null;
  completed?: boolean | null;
  is_completed?: boolean | null;
  is_dismissed?: boolean | null;
  is_sent?: boolean | null;
}): boolean {
  return (
    item.status === "completed" ||
    item.completed === true ||
    item.is_completed === true ||
    item.is_dismissed === true ||
    item.is_sent === true
  );
}

/** מחלקת CSS לכותרת של פריט שבוצע במצב "קו". */
export const DONE_TEXT_CLASS = "line-through text-muted-foreground";

/**
 * הגדרת תצוגת פריטים שבוצעו למקום מסוים במערכת (נשמרת ומסונכרנת בין מכשירים).
 * scope = מזהה המקום, למשל "client-profile-tasks".
 */
export function useCompletedDisplay(scope: string) {
  const [mode, setMode] = useSyncedSetting<CompletedDisplayMode>({
    key: `completed-display:${scope}`,
    defaultValue: "strike",
  });
  const hide = mode === "hide";
  const visible = <T extends Parameters<typeof isItemDone>[0]>(items: T[]): T[] =>
    hide ? items.filter((item) => !isItemDone(item)) : items;
  return { mode, setMode, hide, visible };
}
