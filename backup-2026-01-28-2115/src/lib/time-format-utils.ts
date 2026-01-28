// Global time formatting utilities - no leading zeros

/**
 * Format duration from minutes to H:M format (no leading zeros)
 * Example: 65 minutes -> "1:5", 120 minutes -> "2:0"
 */
export function formatDurationNoLeadingZeros(minutes: number | null | undefined): string {
  if (!minutes) return '0:0';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins}`;
}

/**
 * Format time from date string to H:M format (no leading zeros)
 * Example: "2024-01-15T09:05:00" -> "9:5"
 */
export function formatTimeNoLeadingZeros(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes}`;
}

/**
 * Format time with seconds from date to H:M:S format (no leading zeros)
 * Example: "2024-01-15T09:05:03" -> "9:5:3"
 */
export function formatTimeWithSecondsNoLeadingZeros(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format time range from start to end (no leading zeros)
 * Example: "9:5 - 10:30"
 */
export function formatTimeRangeNoLeadingZeros(startDate: string | Date, endDate: string | Date): string {
  return `${formatTimeNoLeadingZeros(startDate)} - ${formatTimeNoLeadingZeros(endDate)}`;
}
