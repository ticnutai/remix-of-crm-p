// Timer Theme Context - Share theme settings between timer components
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TimerTheme, TIMER_COLOR_MAP, defaultTimerTheme } from './TimerSettingsDialog';
import { isLightBackground, getContrastTextColor } from '@/lib/colorUtils';

export { TIMER_COLOR_MAP };

interface TimerThemeContextType {
  theme: TimerTheme;
  setTheme: (theme: TimerTheme) => void;
  getInputBgStyle: () => React.CSSProperties;
  getInputTextStyle: () => React.CSSProperties;
  getIconStyle: () => React.CSSProperties;
  getFrameStyle: () => React.CSSProperties;
  getTypographyStyle: () => React.CSSProperties;
  getTimerDisplayStyle: () => React.CSSProperties;
  getContrastTextStyle: (bgColorKey?: string) => React.CSSProperties;
  getButtonStyle: () => React.CSSProperties;
  getTagStyle: () => React.CSSProperties;
  getInputFieldStyle: () => React.CSSProperties;
}

const TimerThemeContext = createContext<TimerThemeContextType | undefined>(undefined);

const TIMER_THEME_KEY = 'timer-theme';

export function TimerThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<TimerTheme>(() => {
    const saved = localStorage.getItem(TIMER_THEME_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all required fields exist with defaults
        return {
          ...defaultTimerTheme,
          ...parsed,
        };
      } catch {
        return defaultTimerTheme;
      }
    }
    return defaultTimerTheme;
  });

  useEffect(() => {
    localStorage.setItem(TIMER_THEME_KEY, JSON.stringify(theme));
  }, [theme]);

  const getInputBgStyle = (): React.CSSProperties => {
    const colorKey = theme.inputBgColor || 'white';
    return {
      backgroundColor: TIMER_COLOR_MAP[colorKey].bg,
      borderColor: `${TIMER_COLOR_MAP[theme.frameColor || 'gold'].border}40`,
    };
  };

  const getInputTextStyle = (): React.CSSProperties => {
    const colorKey = theme.inputTextColor || 'navy';
    const bgColorKey = theme.inputBgColor || 'white';
    const bgColor = TIMER_COLOR_MAP[bgColorKey].bg;
    const textColor = TIMER_COLOR_MAP[colorKey].text;
    
    // Auto-contrast: if text color is too similar to background, use contrasting color
    if (!hasGoodContrastColors(bgColor, textColor)) {
      return {
        color: getContrastTextColor(bgColor),
      };
    }
    
    return {
      color: textColor,
    };
  };

  const getIconStyle = (): React.CSSProperties => {
    const colorKey = theme.iconColor || 'gold';
    return {
      color: TIMER_COLOR_MAP[colorKey].icon,
    };
  };

  const getFrameStyle = (): React.CSSProperties => {
    const colorKey = theme.frameColor || 'gold';
    return {
      borderColor: TIMER_COLOR_MAP[colorKey].border,
    };
  };

  const getTypographyStyle = (): React.CSSProperties => {
    return {
      fontSize: `${theme.fontSize || 14}px`,
      lineHeight: theme.lineHeight || 1.5,
      fontFamily: `"${theme.fontFamily || 'Heebo'}", sans-serif`,
    };
  };

  // Get style for timer display (the big numbers)
  const getTimerDisplayStyle = (): React.CSSProperties => {
    const bgColorKey = theme.inputBgColor || 'white';
    const bgColor = TIMER_COLOR_MAP[bgColorKey].bg;
    const timerFontSize = theme.timerDisplayFontSize || 28;
    
    // Always use high-contrast color for timer display
    const contrastColor = getContrastTextColor(bgColor);
    
    return {
      fontSize: `${timerFontSize}px`,
      color: contrastColor,
      fontFamily: `"${theme.fontFamily || 'Heebo'}", sans-serif`,
      fontWeight: 700,
    };
  };

  // Get contrast text style for any background
  const getContrastTextStyle = (bgColorKey?: string): React.CSSProperties => {
    const key = bgColorKey || theme.inputBgColor || 'white';
    const bgColor = TIMER_COLOR_MAP[key]?.bg || TIMER_COLOR_MAP.white.bg;
    
    return {
      color: getContrastTextColor(bgColor),
    };
  };

  // Get button style based on theme settings
  const getButtonStyle = (): React.CSSProperties => {
    const size = theme.buttonSize || 40;
    const bgColor = theme.playButtonBgColor || theme.accentColor || 'hsl(45, 80%, 50%)';
    const iconColor = theme.playButtonColor || theme.backgroundColor || 'hsl(220, 60%, 20%)';
    
    return {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: theme.buttonShape === 'circle' ? '50%' 
        : theme.buttonShape === 'square' ? '0px' 
        : '12px',
      background: theme.buttonGradient 
        ? `linear-gradient(135deg, ${bgColor}, ${theme.accentColor})` 
        : bgColor,
      boxShadow: theme.buttonShadow ? `0 4px 15px ${bgColor}40` : 'none',
      color: iconColor,
    };
  };

  // Get tag style based on theme settings
  const getTagStyle = (): React.CSSProperties => {
    const tagColor = theme.tagTextColor || theme.accentColor || 'hsl(45, 80%, 55%)';
    const tagBg = theme.tagBgColor || theme.accentColor || 'hsl(45, 80%, 55%)';
    const opacity = (theme.tagBgOpacity || 20) / 100;
    const sizeMap = { sm: '10px', md: '12px', lg: '14px' };
    const paddingMap = { sm: '0.125rem 0.5rem', md: '0.25rem 0.625rem', lg: '0.375rem 0.75rem' };
    
    return {
      fontSize: sizeMap[theme.tagSize || 'sm'],
      padding: paddingMap[theme.tagSize || 'sm'],
      borderRadius: theme.tagShape === 'pill' ? '9999px' 
        : theme.tagShape === 'square' ? '0px' 
        : '6px',
      backgroundColor: `${tagBg}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
      color: tagColor,
      borderWidth: `${theme.tagBorderWidth || 1}px`,
      borderStyle: 'solid',
      borderColor: `${tagColor}40`,
    };
  };

  // Get input field style based on theme settings
  const getInputFieldStyle = (): React.CSSProperties => {
    return {
      borderRadius: theme.inputShape === 'pill' ? '9999px' 
        : theme.inputShape === 'square' ? '0px' 
        : '8px',
      borderWidth: `${theme.inputBorderWidth || 1}px`,
      height: `${theme.inputHeight || 40}px`,
    };
  };

  return (
    <TimerThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      getInputBgStyle, 
      getInputTextStyle, 
      getIconStyle,
      getFrameStyle,
      getTypographyStyle,
      getTimerDisplayStyle,
      getContrastTextStyle,
      getButtonStyle,
      getTagStyle,
      getInputFieldStyle,
    }}>
      {children}
    </TimerThemeContext.Provider>
  );
}

// Helper function to check contrast between two colors
function hasGoodContrastColors(color1: string, color2: string): boolean {
  const lum1 = getLuminanceFromColor(color1);
  const lum2 = getLuminanceFromColor(color2);
  const diff = Math.abs(lum1 - lum2);
  return diff > 0.3;
}

function getLuminanceFromColor(color: string): number {
  const match = color.match(/hsl\((\d+),?\s*(\d+)%?,?\s*(\d+)%?\)/);
  if (match) {
    return parseInt(match[3]) / 100;
  }
  // Fallback based on color keywords
  if (color.includes('255') || color.toLowerCase().includes('white')) return 1;
  if (color.includes('0, 0, 0') || color.toLowerCase().includes('black')) return 0;
  return 0.5;
}

export function useTimerTheme() {
  const context = useContext(TimerThemeContext);
  if (!context) {
    // Return default values if not in provider
    return {
      theme: defaultTimerTheme,
      setTheme: () => {},
      getInputBgStyle: () => ({ backgroundColor: 'white', borderColor: 'hsl(45, 80%, 50%)' }),
      getInputTextStyle: () => ({ color: 'hsl(220, 60%, 25%)' }),
      getIconStyle: () => ({ color: 'hsl(45, 85%, 60%)' }),
      getFrameStyle: () => ({ borderColor: 'hsl(45, 80%, 50%)' }),
      getTypographyStyle: () => ({ fontSize: '14px', lineHeight: 1.5, fontFamily: '"Heebo", sans-serif' }),
      getTimerDisplayStyle: () => ({ fontSize: '28px', color: 'hsl(220, 60%, 20%)', fontWeight: 700 }),
      getContrastTextStyle: () => ({ color: 'hsl(220, 60%, 20%)' }),
      getButtonStyle: () => ({ width: '40px', height: '40px', borderRadius: '12px', background: 'hsl(45, 80%, 50%)' }),
      getTagStyle: () => ({ fontSize: '10px', padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: 'hsl(45, 80%, 55%, 0.2)', color: 'hsl(45, 80%, 55%)' }),
      getInputFieldStyle: () => ({ borderRadius: '8px', borderWidth: '1px', height: '40px' }),
    };
  }
  return context;
}
