/**
 * Sort & Dedup utilities for Tasks, Meetings, and Reminders
 */

export type SortField = "created_at" | "event_date" | "title";
export type SortOrder = "asc" | "desc";

/**
 * Sort items by a given field and order
 */
export function sortItems<T>(
  items: T[],
  sortBy: SortField,
  sortOrder: SortOrder,
  getFieldValue: (item: T, field: SortField) => string | null | undefined,
): T[] {
  return [...items].sort((a, b) => {
    const aVal = getFieldValue(a, sortBy) || "";
    const bVal = getFieldValue(b, sortBy) || "";
    let cmp: number;
    if (sortBy === "title") {
      cmp = aVal.localeCompare(bVal, "he");
    } else {
      // ISO date strings sort lexicographically
      cmp = aVal.localeCompare(bVal);
    }
    return sortOrder === "asc" ? cmp : -cmp;
  });
}

export interface DedupGroup<T> {
  key: string;
  primary: T;
  all: T[];
  count: number;
}

/**
 * Group items by a dedup key. Returns ordered groups.
 */
export function deduplicateItems<T>(
  items: T[],
  getKey: (item: T) => string,
): DedupGroup<T>[] {
  const groupMap = new Map<string, T[]>();
  const order: string[] = [];

  items.forEach((item) => {
    const key = getKey(item);
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      order.push(key);
    }
    groupMap.get(key)!.push(item);
  });

  return order.map((key) => {
    const all = groupMap.get(key)!;
    return { key, primary: all[0], all, count: all.length };
  });
}

/**
 * Create a dedup key from a date string + title.
 * Items with same day + same hour:minute + same title (case-insensitive) are considered duplicates.
 */
export function getDedupKey(
  dateStr: string | null | undefined,
  title: string,
): string {
  if (!dateStr) return `no-date|${title.trim().toLowerCase()}`;
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}|${title.trim().toLowerCase()}`;
  } catch {
    return `invalid|${title.trim().toLowerCase()}`;
  }
}

/**
 * Process items with dedup: returns visible items and a map of primary item IDs to their duplicate info.
 */
export function processDedup<T extends { id: string }>(
  items: T[],
  getKey: (item: T) => string,
  expandedGroups: Set<string>,
): { visible: T[]; dupMap: Map<string, { count: number; key: string }> } {
  const groups = deduplicateItems(items, getKey);
  const hasDups = groups.some((g) => g.count > 1);

  if (!hasDups) {
    return { visible: items, dupMap: new Map() };
  }

  const visible: T[] = [];
  const dupMap = new Map<string, { count: number; key: string }>();

  groups.forEach((group) => {
    if (expandedGroups.has(group.key)) {
      visible.push(...group.all);
    } else {
      visible.push(group.primary);
    }
    if (group.count > 1) {
      dupMap.set(group.primary.id, { count: group.count, key: group.key });
    }
  });

  return { visible, dupMap };
}
