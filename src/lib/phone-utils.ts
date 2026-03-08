/**
 * Phone Utility Functions
 * Global helpers for phone number validation and display
 */

/**
 * Check if a phone number is valid for display
 * Returns false for empty, null, undefined, or dummy values like "0000000000"
 */
export function isValidPhoneForDisplay(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  // Remove all non-digit characters for validation
  const cleaned = phone.replace(/\D/g, '');
  
  // Empty after cleaning
  if (!cleaned || cleaned.length === 0) return false;
  
  // All zeros (any length)
  if (/^0+$/.test(cleaned)) return false;
  
  // Too short to be a real phone number (less than 7 digits)
  if (cleaned.length < 7) return false;
  
  return true;
}

/**
 * Format phone number for display, or return null if invalid
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string | null {
  if (!isValidPhoneForDisplay(phone)) return null;
  return phone!;
}
