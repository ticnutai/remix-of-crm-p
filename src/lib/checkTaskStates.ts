export type CheckTaskState = {
  color: string;
  filled: boolean;
  label?: string;
};

export const DEFAULT_CHECK_TASK_STATES: CheckTaskState[] = [
  { color: "#10b981", filled: false, label: "מצב התחלתי" },
  { color: "#dc2626", filled: true, label: "מסומן" },
];

export function normalizeCheckTaskStates(value: unknown): CheckTaskState[] {
  const parsed = typeof value === "string" ? (() => {
    try { return JSON.parse(value); } catch { return null; }
  })() : value;
  if (!Array.isArray(parsed)) return DEFAULT_CHECK_TASK_STATES.map((state) => ({ ...state }));
  const states = parsed
    .filter((state): state is Record<string, unknown> => Boolean(state && typeof state === "object"))
    .map((state, index) => ({
      color: typeof state.color === "string" && /^#[0-9a-f]{6}$/i.test(state.color)
        ? state.color
        : DEFAULT_CHECK_TASK_STATES[index % DEFAULT_CHECK_TASK_STATES.length].color,
      filled: typeof state.filled === "boolean" ? state.filled : index > 0,
      label: typeof state.label === "string" ? state.label : `מצב ${index + 1}`,
    }));
  return states.length >= 2 ? states : DEFAULT_CHECK_TASK_STATES.map((state) => ({ ...state }));
}

export function getCheckTaskState(task: {
  check_states?: unknown;
  check_state_index?: number | null;
  check_marked?: boolean | null;
}) {
  const states = normalizeCheckTaskStates(task.check_states);
  const legacyIndex = task.check_marked ? 1 : 0;
  const rawIndex = Number.isInteger(task.check_state_index) ? Number(task.check_state_index) : legacyIndex;
  const index = ((rawIndex % states.length) + states.length) % states.length;
  return { states, index, state: states[index] };
}
