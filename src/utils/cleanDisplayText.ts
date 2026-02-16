/**
 * Utility to clean raw metadata from task/meeting titles and descriptions
 * before rendering in the UI.
 *
 * Removes:
 * - [stage_task:uuid] references
 * - Raw metadata like "due_date: ...|priority: ...|description ..."
 * - "משימה:" prefix (redundant in task context)
 */

// Remove [stage_task:uuid] tags
const STAGE_TASK_RE = /\[stage_task:[a-f0-9-]+\]/gi;

// Remove raw metadata fields like "due_date: 2025-08-31|priority: גבוהה|description"
// This pattern matches "field_name: value|" sequences at start of text
const RAW_METADATA_RE =
  /\b(due_date|priority|description|status|sort_order|created_at|updated_at|client_id|project_id|assigned_to|stage_id)\s*:\s*[^|]*\|?/gi;

// Remove numeric prefix like "31:" that appears from metadata overflow
const NUMERIC_PREFIX_RE = /^\d+:\s*/;

/**
 * Clean a task/meeting title for display
 */
export function cleanTitle(title: string | null | undefined): string {
  if (!title) return "";

  const cleaned = title
    .replace(STAGE_TASK_RE, "")
    .replace(RAW_METADATA_RE, "")
    .replace(NUMERIC_PREFIX_RE, "")
    .replace(/^משימה:\s*/i, "") // Remove redundant "משימה:" prefix
    .replace(/\|+/g, " ") // Replace remaining pipes with spaces
    .replace(/\s{2,}/g, " ") // Collapse multiple spaces
    .trim();

  return cleaned || title.trim(); // Fallback to original if cleaning empties it
}

/**
 * Clean a task/meeting description for display
 * Hides internal references like [stage_task:uuid]
 */
export function cleanDescription(
  description: string | null | undefined,
): string | null {
  if (!description) return null;

  const cleaned = description
    .replace(STAGE_TASK_RE, "")
    .replace(RAW_METADATA_RE, "")
    .replace(/\|+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // If the description was only metadata, return null to hide it
  return cleaned.length > 0 ? cleaned : null;
}
