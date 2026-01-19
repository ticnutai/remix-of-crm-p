// Widget Layout Manager - מערכת ניהול פריסת ווידג'טים מלאה
// e-control CRM Pro
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

// Widget Size Types
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

// Widget ID Types
export type WidgetId = 
  | 'stats-clients' 
  | 'stats-projects' 
  | 'stats-revenue' 
  | 'stats-hours'
  | 'chart-revenue'
  | 'chart-projects'
  | 'chart-hours'
  | 'table-hours'
  | 'table-clients'
  | 'table-vip'
  | 'features-info'
  | 'dynamic-stats';

// Widget Configuration
export interface WidgetLayout {
  id: WidgetId;
  name: string;
  visible: boolean;
  order: number;
  size: WidgetSize;
  collapsed: boolean;
}

// Default widget configurations
const DEFAULT_LAYOUTS: WidgetLayout[] = [
  { id: 'stats-clients', name: 'לקוחות פעילים', visible: true, order: 1, size: 'small', collapsed: false },
  { id: 'stats-projects', name: 'פרויקטים פתוחים', visible: true, order: 2, size: 'small', collapsed: false },
  { id: 'stats-revenue', name: 'הכנסות החודש', visible: true, order: 3, size: 'small', collapsed: false },
  { id: 'stats-hours', name: 'שעות עבודה', visible: true, order: 4, size: 'small', collapsed: false },
  { id: 'dynamic-stats', name: 'סטטוס דינמי', visible: true, order: 5, size: 'medium', collapsed: false },
  { id: 'chart-revenue', name: 'גרף הכנסות', visible: true, order: 6, size: 'medium', collapsed: false },
  { id: 'chart-projects', name: 'סטטוס פרויקטים', visible: true, order: 7, size: 'medium', collapsed: false },
  { id: 'chart-hours', name: 'גרף שעות עבודה', visible: true, order: 8, size: 'full', collapsed: false },
  { id: 'table-hours', name: 'טבלת שעות', visible: true, order: 9, size: 'full', collapsed: false },
  { id: 'table-clients', name: 'רשימת לקוחות', visible: true, order: 10, size: 'full', collapsed: false },
  { id: 'table-vip', name: 'לקוחות VIP', visible: true, order: 11, size: 'full', collapsed: false },
  { id: 'features-info', name: 'תכונות ומידע', visible: true, order: 12, size: 'full', collapsed: false },
];

const STORAGE_KEY = 'widget-layouts-v2';

// Size cycle order
const SIZE_CYCLE: WidgetSize[] = ['small', 'medium', 'large', 'full'];

// Size display names
export const SIZE_LABELS: Record<WidgetSize, string> = {
  small: 'קטן',
  medium: 'בינוני',
  large: 'גדול',
  full: 'מלא',
};

// Grid class for each size
export const SIZE_GRID_CLASS: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-1',
  large: 'col-span-1 md:col-span-2',
  full: 'col-span-full',
};

// Context Type
interface WidgetLayoutContextType {
  layouts: WidgetLayout[];
  getLayout: (id: WidgetId) => WidgetLayout | undefined;
  isVisible: (id: WidgetId) => boolean;
  getGridClass: (id: WidgetId) => string;
  swapWidgets: (id1: WidgetId, id2: WidgetId) => void;
  cycleSize: (id: WidgetId) => void;
  setSize: (id: WidgetId, size: WidgetSize) => void;
  toggleVisibility: (id: WidgetId) => void;
  toggleCollapse: (id: WidgetId) => void;
  resetAll: () => void;
  moveWidget: (id: WidgetId, direction: 'up' | 'down') => void;
}

const WidgetLayoutContext = createContext<WidgetLayoutContextType | undefined>(undefined);

// Provider Component
export function WidgetLayoutProvider({ children }: { children: ReactNode }) {
  const [layouts, setLayouts] = useState<WidgetLayout[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all widgets exist
        return DEFAULT_LAYOUTS.map(def => {
          const saved = parsed.find((p: WidgetLayout) => p.id === def.id);
          return saved ? { ...def, ...saved } : def;
        });
      }
    } catch (e) {
      console.error('[WidgetLayout] Error loading:', e);
    }
    return DEFAULT_LAYOUTS;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  }, [layouts]);

  // Get single layout
  const getLayout = useCallback((id: WidgetId) => {
    return layouts.find(l => l.id === id);
  }, [layouts]);

  // Check visibility
  const isVisible = useCallback((id: WidgetId) => {
    return layouts.find(l => l.id === id)?.visible ?? true;
  }, [layouts]);

  // Get grid class
  const getGridClass = useCallback((id: WidgetId) => {
    const layout = layouts.find(l => l.id === id);
    return SIZE_GRID_CLASS[layout?.size || 'medium'];
  }, [layouts]);

  // Swap two widgets
  const swapWidgets = useCallback((id1: WidgetId, id2: WidgetId) => {
    console.log('[WidgetLayout] swapWidgets called:', id1, '<->', id2);
    if (id1 === id2) return;
    
    setLayouts(prev => {
      const newLayouts = [...prev];
      const idx1 = newLayouts.findIndex(l => l.id === id1);
      const idx2 = newLayouts.findIndex(l => l.id === id2);
      
      console.log('[WidgetLayout] Found indexes:', idx1, idx2);
      if (idx1 === -1 || idx2 === -1) return prev;
      
      // Swap orders
      const tempOrder = newLayouts[idx1].order;
      newLayouts[idx1] = { ...newLayouts[idx1], order: newLayouts[idx2].order };
      newLayouts[idx2] = { ...newLayouts[idx2], order: tempOrder };
      
      // Swap positions in array
      [newLayouts[idx1], newLayouts[idx2]] = [newLayouts[idx2], newLayouts[idx1]];
      
      console.log('[WidgetLayout] New layout order:', newLayouts.map(l => `${l.id}:${l.order}`));
      return newLayouts;
    });

    const w1 = layouts.find(l => l.id === id1);
    const w2 = layouts.find(l => l.id === id2);
    toast({
      title: "✅ מיקום הוחלף",
      description: `${w1?.name} ↔ ${w2?.name}`,
      duration: 2000,
    });
  }, [layouts]);

  // Cycle through sizes
  const cycleSize = useCallback((id: WidgetId) => {
    setLayouts(prev => {
      return prev.map(l => {
        if (l.id !== id) return l;
        const currentIdx = SIZE_CYCLE.indexOf(l.size);
        const nextIdx = (currentIdx + 1) % SIZE_CYCLE.length;
        const newSize = SIZE_CYCLE[nextIdx];
        
        toast({
          title: "📐 גודל שונה",
          description: `${l.name}: ${SIZE_LABELS[newSize]}`,
          duration: 1500,
        });
        
        return { ...l, size: newSize };
      });
    });
  }, []);

  // Set specific size
  const setSize = useCallback((id: WidgetId, size: WidgetSize) => {
    setLayouts(prev => prev.map(l => l.id === id ? { ...l, size } : l));
  }, []);

  // Toggle visibility
  const toggleVisibility = useCallback((id: WidgetId) => {
    setLayouts(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }, []);

  // Toggle collapse
  const toggleCollapse = useCallback((id: WidgetId) => {
    setLayouts(prev => prev.map(l => l.id === id ? { ...l, collapsed: !l.collapsed } : l));
  }, []);

  // Move widget up or down
  const moveWidget = useCallback((id: WidgetId, direction: 'up' | 'down') => {
    setLayouts(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(l => l.id === id);
      
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === sorted.length - 1) return prev;
      
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      const tempOrder = sorted[idx].order;
      sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
      sorted[swapIdx] = { ...sorted[swapIdx], order: tempOrder };
      
      return sorted;
    });
  }, []);

  // Reset all to defaults
  const resetAll = useCallback(() => {
    setLayouts(DEFAULT_LAYOUTS);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "🔄 אופס לברירת מחדל",
      description: "כל הגדרות הווידג'טים אופסו",
      duration: 2000,
    });
  }, []);

  return (
    <WidgetLayoutContext.Provider value={{
      layouts,
      getLayout,
      isVisible,
      getGridClass,
      swapWidgets,
      cycleSize,
      setSize,
      toggleVisibility,
      toggleCollapse,
      resetAll,
      moveWidget,
    }}>
      {children}
    </WidgetLayoutContext.Provider>
  );
}

// Hook
export function useWidgetLayout() {
  const context = useContext(WidgetLayoutContext);
  if (!context) {
    throw new Error('useWidgetLayout must be used within WidgetLayoutProvider');
  }
  return context;
}

// Export default layouts for reference
export { DEFAULT_LAYOUTS };
