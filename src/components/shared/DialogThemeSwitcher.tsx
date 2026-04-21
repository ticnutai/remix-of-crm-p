import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DialogThemeId = 'navy-gold' | 'white-gold' | 'dark-elegant' | 'soft-blue';

export interface DialogThemeColors {
  background: string;
  backgroundGradient: string;
  border: string;
  borderSub: string;
  headerBorder: string;
  title: string;
  label: string;
  text: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  buttonBg: string;
  buttonText: string;
  buttonBorder: string;
  iconColor: string;
  iconBg: string;
  cancelText: string;
}

export const dialogThemes: Record<DialogThemeId, { name: string; colors: DialogThemeColors }> = {
  'navy-gold': {
    name: 'כחול כהה',
    colors: {
      background: '#162C58',
      backgroundGradient: 'linear-gradient(135deg, #162C58 0%, #0F1F3D 100%)',
      border: '#d8ac27',
      borderSub: 'rgba(216,172,39,0.25)',
      headerBorder: 'rgba(216,172,39,0.19)',
      title: '#e8c85a',
      label: '#e8c85a',
      text: '#e8c85a',
      inputBg: 'rgba(30,58,110,0.31)',
      inputBorder: 'rgba(216,172,39,0.25)',
      inputText: '#e8c85a',
      buttonBg: 'rgba(216,172,39,0.15)',
      buttonText: '#d8ac27',
      buttonBorder: '#d8ac27',
      iconColor: '#d8ac27',
      iconBg: 'rgba(216,172,39,0.13)',
      cancelText: '#e8c85a',
    },
  },
  'white-gold': {
    name: 'לבן אלגנטי',
    colors: {
      background: '#FFFFFF',
      backgroundGradient: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8F2 100%)',
      border: '#c9a227',
      borderSub: 'rgba(201,162,39,0.3)',
      headerBorder: 'rgba(201,162,39,0.25)',
      title: '#162C58',
      label: '#162C58',
      text: '#162C58',
      inputBg: '#F7F5EE',
      inputBorder: 'rgba(201,162,39,0.4)',
      inputText: '#162C58',
      buttonBg: '#162C58',
      buttonText: '#FFFFFF',
      buttonBorder: '#162C58',
      iconColor: '#162C58',
      iconBg: 'rgba(22,44,88,0.08)',
      cancelText: '#162C58',
    },
  },
  'dark-elegant': {
    name: 'כהה אלגנטי',
    colors: {
      background: '#1A1A2E',
      backgroundGradient: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
      border: '#C4A35A',
      borderSub: 'rgba(196,163,90,0.25)',
      headerBorder: 'rgba(196,163,90,0.2)',
      title: '#E8D5A3',
      label: '#E8D5A3',
      text: '#D4C5A0',
      inputBg: 'rgba(255,255,255,0.06)',
      inputBorder: 'rgba(196,163,90,0.3)',
      inputText: '#E8D5A3',
      buttonBg: '#C4A35A',
      buttonText: '#1A1A2E',
      buttonBorder: '#C4A35A',
      iconColor: '#C4A35A',
      iconBg: 'rgba(196,163,90,0.12)',
      cancelText: '#D4C5A0',
    },
  },
  'soft-blue': {
    name: 'כחול רך',
    colors: {
      background: '#F0F4FA',
      backgroundGradient: 'linear-gradient(135deg, #F0F4FA 0%, #E3EAF5 100%)',
      border: '#3B6EB5',
      borderSub: 'rgba(59,110,181,0.2)',
      headerBorder: 'rgba(59,110,181,0.15)',
      title: '#1E3A5F',
      label: '#1E3A5F',
      text: '#2C4A6E',
      inputBg: '#FFFFFF',
      inputBorder: 'rgba(59,110,181,0.3)',
      inputText: '#1E3A5F',
      buttonBg: '#1E3A5F',
      buttonText: '#FFFFFF',
      buttonBorder: '#1E3A5F',
      iconColor: '#1E3A5F',
      iconBg: 'rgba(30,58,95,0.08)',
      cancelText: '#2C4A6E',
    },
  },
};

const DIALOG_THEME_KEY = 'dialog-color-theme';

export function useDialogTheme() {
  const [themeId, setThemeId] = useState<DialogThemeId>(() => {
    const saved = localStorage.getItem(DIALOG_THEME_KEY);
    return (saved as DialogThemeId) || 'navy-gold';
  });

  useEffect(() => {
    localStorage.setItem(DIALOG_THEME_KEY, themeId);
  }, [themeId]);

  return {
    themeId,
    theme: dialogThemes[themeId].colors,
    setThemeId,
  };
}

interface DialogThemeSwitcherProps {
  currentTheme: DialogThemeId;
  onThemeChange: (id: DialogThemeId) => void;
}

export function DialogThemeSwitcher({ currentTheme, onThemeChange }: DialogThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const themeEntries = Object.entries(dialogThemes) as [DialogThemeId, typeof dialogThemes[DialogThemeId]][];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-110"
        style={{
          background: dialogThemes[currentTheme].colors.iconBg,
          border: `1.5px solid ${dialogThemes[currentTheme].colors.border}40`,
        }}
        title="שנה ערכת צבעים"
      >
        <Palette className="h-3.5 w-3.5" style={{ color: dialogThemes[currentTheme].colors.iconColor }} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[500]" onClick={() => setIsOpen(false)} />
          <div
            className="absolute top-full mt-1 right-0 z-[501] rounded-lg shadow-xl p-2 min-w-[140px] border"
            style={{
              background: '#FFFFFF',
              borderColor: '#E0E0E0',
            }}
          >
            {themeEntries.map(([id, theme]) => (
              <button
                key={id}
                type="button"
                onClick={() => { onThemeChange(id); setIsOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-right text-sm transition-colors",
                  currentTheme === id ? "bg-blue-50 font-bold" : "hover:bg-gray-50"
                )}
              >
                <div className="flex gap-1">
                  <span
                    className="w-4 h-4 rounded-full border"
                    style={{
                      background: theme.colors.background,
                      borderColor: theme.colors.border,
                    }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border"
                    style={{
                      background: theme.colors.border,
                      borderColor: theme.colors.border,
                    }}
                  />
                </div>
                <span style={{ color: '#333' }}>{theme.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
