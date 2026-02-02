// Dashboard Theme Provider - 7 Luxury Styles
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DashboardTheme = 'navy-gold' | 'modern-dark' | 'classic' | 'elegant-white' | 'mouse-gray' | 'royal-blue' | 'gold-premium';

export interface DashboardThemeConfig {
  id: DashboardTheme;
  name: string;
  description: string;
  colors: {
    background: string;
    cardBackground: string;
    headerBackground: string;
    border: string;
    accent: string;
    text: string;
    textMuted: string;
    statCardBg: string;
    chartBg: string;
  };
  effects: {
    reflection: boolean;
    glow: boolean;
    gradient: boolean;
    roundedCorners: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  };
}

export const dashboardThemes: Record<DashboardTheme, DashboardThemeConfig> = {
  'navy-gold': {
    id: 'navy-gold',
    name: 'Navy & Gold',
    description: 'עיצוב יוקרתי קלאסי עם כחול כהה וזהב',
    colors: {
      background: 'linear-gradient(180deg, hsl(45, 30%, 96%) 0%, hsl(45, 20%, 92%) 100%)',
      cardBackground: 'hsl(45, 30%, 97%)',
      headerBackground: 'hsl(220, 60%, 20%)',
      border: 'hsl(45, 80%, 50%)',
      accent: 'hsl(45, 80%, 55%)',
      text: 'hsl(220, 60%, 20%)',
      textMuted: 'hsl(220, 30%, 40%)',
      statCardBg: 'hsl(45, 25%, 95%)',
      chartBg: 'hsl(45, 30%, 97%)',
    },
    effects: {
      reflection: true,
      glow: true,
      gradient: true,
      roundedCorners: '2xl',
    },
  },
  'modern-dark': {
    id: 'modern-dark',
    name: 'Modern Dark',
    description: 'עיצוב מודרני כהה עם אפקטים זוהרים',
    colors: {
      background: 'linear-gradient(180deg, hsl(240, 10%, 8%) 0%, hsl(240, 10%, 4%) 100%)',
      cardBackground: 'hsl(240, 10%, 12%)',
      headerBackground: 'hsl(240, 10%, 6%)',
      border: 'hsl(210, 100%, 50%)',
      accent: 'hsl(210, 100%, 60%)',
      text: 'hsl(0, 0%, 98%)',
      textMuted: 'hsl(0, 0%, 60%)',
      statCardBg: 'hsl(240, 10%, 15%)',
      chartBg: 'hsl(240, 10%, 10%)',
    },
    effects: {
      reflection: false,
      glow: true,
      gradient: true,
      roundedCorners: 'xl',
    },
  },
  'classic': {
    id: 'classic',
    name: 'Classic',
    description: 'העיצוב המקורי של המערכת',
    colors: {
      background: 'hsl(var(--background))',
      cardBackground: 'hsl(var(--card))',
      headerBackground: 'hsl(var(--primary))',
      border: 'hsl(var(--border))',
      accent: 'hsl(var(--primary))',
      text: 'hsl(var(--foreground))',
      textMuted: 'hsl(var(--muted-foreground))',
      statCardBg: 'hsl(var(--card))',
      chartBg: 'hsl(var(--card))',
    },
    effects: {
      reflection: false,
      glow: false,
      gradient: false,
      roundedCorners: 'lg',
    },
  },
  'elegant-white': {
    id: 'elegant-white',
    name: 'לבן אלגנטי',
    description: 'עיצוב נקי ומינימליסטי עם מסגרות זהב',
    colors: {
      background: 'linear-gradient(180deg, hsl(0, 0%, 100%) 0%, hsl(45, 20%, 97%) 100%)',
      cardBackground: 'hsl(0, 0%, 100%)',
      headerBackground: 'hsl(220, 60%, 20%)',
      border: 'hsl(45, 80%, 55%)',
      accent: 'hsl(45, 80%, 50%)',
      text: 'hsl(220, 60%, 15%)',
      textMuted: 'hsl(220, 20%, 45%)',
      statCardBg: 'hsl(0, 0%, 99%)',
      chartBg: 'hsl(0, 0%, 100%)',
    },
    effects: {
      reflection: true,
      glow: false,
      gradient: true,
      roundedCorners: 'xl',
    },
  },
  'mouse-gray': {
    id: 'mouse-gray',
    name: 'אפור עכבר',
    description: 'עיצוב מודרני באפור עם נגיעות זהב',
    colors: {
      background: 'linear-gradient(180deg, hsl(220, 10%, 92%) 0%, hsl(220, 10%, 88%) 100%)',
      cardBackground: 'hsl(220, 10%, 95%)',
      headerBackground: 'hsl(220, 60%, 18%)',
      border: 'hsl(45, 75%, 55%)',
      accent: 'hsl(45, 80%, 50%)',
      text: 'hsl(220, 30%, 20%)',
      textMuted: 'hsl(220, 15%, 45%)',
      statCardBg: 'hsl(220, 10%, 93%)',
      chartBg: 'hsl(220, 10%, 96%)',
    },
    effects: {
      reflection: false,
      glow: true,
      gradient: true,
      roundedCorners: 'xl',
    },
  },
  'royal-blue': {
    id: 'royal-blue',
    name: 'כחול מלכותי',
    description: 'ניייבי עמוק עם הדגשות זהב מרהיבות',
    colors: {
      background: 'linear-gradient(180deg, hsl(220, 50%, 18%) 0%, hsl(220, 55%, 12%) 100%)',
      cardBackground: 'hsl(220, 50%, 22%)',
      headerBackground: 'hsl(220, 60%, 15%)',
      border: 'hsl(45, 85%, 55%)',
      accent: 'hsl(45, 90%, 60%)',
      text: 'hsl(45, 30%, 95%)',
      textMuted: 'hsl(45, 20%, 70%)',
      statCardBg: 'hsl(220, 45%, 25%)',
      chartBg: 'hsl(220, 50%, 20%)',
    },
    effects: {
      reflection: true,
      glow: true,
      gradient: true,
      roundedCorners: '2xl',
    },
  },
  'gold-premium': {
    id: 'gold-premium',
    name: 'זהב פרימיום',
    description: 'עיצוב יוקרתי עם דומיננטיות זהב',
    colors: {
      background: 'linear-gradient(180deg, hsl(45, 40%, 96%) 0%, hsl(45, 35%, 90%) 100%)',
      cardBackground: 'hsl(45, 35%, 97%)',
      headerBackground: 'hsl(45, 75%, 45%)',
      border: 'hsl(45, 80%, 50%)',
      accent: 'hsl(220, 60%, 25%)',
      text: 'hsl(220, 60%, 15%)',
      textMuted: 'hsl(220, 30%, 40%)',
      statCardBg: 'hsl(45, 40%, 95%)',
      chartBg: 'hsl(45, 35%, 98%)',
    },
    effects: {
      reflection: true,
      glow: true,
      gradient: true,
      roundedCorners: '2xl',
    },
  },
};

interface DashboardThemeContextType {
  currentTheme: DashboardTheme;
  themeConfig: DashboardThemeConfig;
  setTheme: (theme: DashboardTheme) => void;
}

const DashboardThemeContext = createContext<DashboardThemeContextType | undefined>(undefined);

const DASHBOARD_THEME_KEY = 'dashboard-theme';

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<DashboardTheme>(() => {
    const saved = localStorage.getItem(DASHBOARD_THEME_KEY);
    return (saved as DashboardTheme) || 'navy-gold';
  });

  const themeConfig = dashboardThemes[currentTheme];

  // Listen for theme changes from cloud sync
  useEffect(() => {
    const handleThemeChange = (e: CustomEvent<string>) => {
      if (e.detail && dashboardThemes[e.detail as DashboardTheme]) {
        setCurrentTheme(e.detail as DashboardTheme);
      }
    };

    window.addEventListener('dashboardThemeChanged', handleThemeChange as EventListener);
    return () => window.removeEventListener('dashboardThemeChanged', handleThemeChange as EventListener);
  }, []);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_THEME_KEY, currentTheme);
  }, [currentTheme]);

  const setTheme = (theme: DashboardTheme) => {
    setCurrentTheme(theme);
  };

  return (
    <DashboardThemeContext.Provider value={{ currentTheme, themeConfig, setTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const context = useContext(DashboardThemeContext);
  if (!context) {
    throw new Error('useDashboardTheme must be used within DashboardThemeProvider');
  }
  return context;
}
