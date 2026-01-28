import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });
  
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();
  
  // Sync with system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateDarkMode = () => {
      if (theme === 'system') {
        setIsDark(mediaQuery.matches);
      } else {
        setIsDark(theme === 'dark');
      }
    };
    
    updateDarkMode();
    mediaQuery.addEventListener('change', updateDarkMode);
    
    return () => mediaQuery.removeEventListener('change', updateDarkMode);
  }, [theme]);
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
  }, [isDark]);
  
  // Load user preference from DB
  useEffect(() => {
    if (!user?.id) return;
    
    const loadPreference = async () => {
      try {
        const { data } = await (supabase as any)
          .from('user_preferences')
          .select('theme')
          .eq('user_id', user.id)
          .single();
        
        if (data?.theme) {
          setThemeState(data.theme);
          localStorage.setItem('theme', data.theme);
        }
      } catch (e) {
        // No preference saved yet
      }
    };
    
    loadPreference();
  }, [user?.id]);
  
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Save to DB if logged in
    if (user?.id) {
      try {
        await (supabase as any)
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            theme: newTheme,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      } catch (e) {
        console.error('Failed to save theme preference:', e);
      }
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export default ThemeProvider;
