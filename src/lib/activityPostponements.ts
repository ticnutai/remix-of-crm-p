export type ActivityEntityType =
  | "task"
  | "reminder"
  | "meeting"
  | "client_stage_task";

export type ActivityPostponement = {
  id: string;
  entity_type: ActivityEntityType;
  entity_id: string;
  sequence_no: number;
  previous_due_at: string | null;
  postponed_to: string;
  reason: string;
  next_action: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export function toDateTimeLocalValue(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getPostponePresetDate(
  preset: "tomorrow" | "week",
  now = new Date(),
) {
  const next = new Date(now);
  next.setDate(next.getDate() + (preset === "tomorrow" ? 1 : 7));
  return next;
}

