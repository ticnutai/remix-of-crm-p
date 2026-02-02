// Utility functions for color manipulation and contrast calculation

/**
 * Parse HSL color string to values
 */
export function parseHslColor(hslString: string): { h: number; s: number; l: number } | null {
  const match = hslString.match(/hsl\((\d+),?\s*(\d+)%?,?\s*(\d+)%?\)/);
  if (match) {
    return {
      h: parseInt(match[1]),
      s: parseInt(match[2]),
      l: parseInt(match[3]),
    };
  }
  return null;
}

/**
 * Calculate relative luminance of an HSL color
 * Returns a value between 0 (darkest) and 1 (lightest)
 */
export function getLuminanceFromHsl(hslString: string): number {
  const hsl = parseHslColor(hslString);
  if (!hsl) {
    // Try to detect if it's a light or dark color by keywords
    const lowerCase = hslString.toLowerCase();
    if (lowerCase.includes('white') || lowerCase.includes('light') || lowerCase.includes('gold') || lowerCase.includes('yellow')) {
      return 0.8;
    }
    if (lowerCase.includes('black') || lowerCase.includes('dark') || lowerCase.includes('navy')) {
      return 0.2;
    }
    return 0.5;
  }
  
  // Lightness in HSL is a good approximation of perceived brightness
  return hsl.l / 100;
}

/**
 * Determine if a background color is light or dark
 */
export function isLightBackground(bgColor: string): boolean {
  const luminance = getLuminanceFromHsl(bgColor);
  return luminance > 0.5;
}

/**
 * Get a contrasting text color based on background
 * Returns dark text for light backgrounds and light text for dark backgrounds
 */
export function getContrastTextColor(bgColor: string): string {
  if (isLightBackground(bgColor)) {
    return 'hsl(220, 60%, 20%)'; // Dark navy for light backgrounds
  }
  return 'hsl(0, 0%, 100%)'; // White for dark backgrounds
}

/**
 * Get contrasting text color with options
 */
export function getContrastTextColorAdvanced(
  bgColor: string, 
  options?: {
    lightTextColor?: string;
    darkTextColor?: string;
  }
): string {
  const { lightTextColor = 'hsl(0, 0%, 100%)', darkTextColor = 'hsl(220, 60%, 20%)' } = options || {};
  
  if (isLightBackground(bgColor)) {
    return darkTextColor;
  }
  return lightTextColor;
}

/**
 * Check if two colors have sufficient contrast
 */
export function hasGoodContrast(color1: string, color2: string): boolean {
  const lum1 = getLuminanceFromHsl(color1);
  const lum2 = getLuminanceFromHsl(color2);
  const diff = Math.abs(lum1 - lum2);
  return diff > 0.3; // Minimum 30% difference for good readability
}
