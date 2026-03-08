// Widget Manager - Full Control System
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  | 'dynamic-stats'
  | string; // Support dynamic IDs like 'dynamic-stats-1', 'dynamic-stats-2'

export type WidgetCategory = 'stats' | 'charts' | 'tables' | 'other';

export interface WidgetConfig {
  id: WidgetId;
  name: string;
  description: string;
  category: WidgetCategory;
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large' | 'full';
  collapsed: boolean;
  customStyles?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
}

export const defaultWidgets: WidgetConfig[] = [
  { id: 'stats-clients', name: 'לקוחות פעילים', description: 'סטטיסטיקות לקוחות', category: 'stats', visible: true, order: 1, size: 'small', collapsed: false },
  { id: 'stats-projects', name: 'פרויקטים פתוחים', description: 'סטטיסטיקות פרויקטים', category: 'stats', visible: true, order: 2, size: 'small', collapsed: false },
  { id: 'stats-revenue', name: 'הכנסות החודש', description: 'סטטיסטיקות הכנסות', category: 'stats', visible: true, order: 3, size: 'small', collapsed: false },
  { id: 'stats-hours', name: 'שעות עבודה', description: 'סטטיסטיקות שעות', category: 'stats', visible: true, order: 4, size: 'small', collapsed: false },
  { id: 'dynamic-stats', name: 'סטטוס דינמי', description: 'סטטיסטיקות מותאמות אישית', category: 'stats', visible: true, order: 5, size: 'medium', collapsed: false },
  { id: 'chart-revenue', name: 'גרף הכנסות', description: 'גרף הכנסות לאורך זמן', category: 'charts', visible: true, order: 6, size: 'medium', collapsed: false },
  { id: 'chart-projects', name: 'סטטוס פרויקטים', description: 'התפלגות סטטוס פרויקטים', category: 'charts', visible: true, order: 7, size: 'medium', collapsed: false },
  { id: 'chart-hours', name: 'גרף שעות עבודה', description: 'גרף שעות עבודה', category: 'charts', visible: true, order: 8, size: 'full', collapsed: false },
  { id: 'table-hours', name: 'טבלת שעות עבודה', description: 'סיכום שעות יום/שבוע/חודש/שנה', category: 'tables', visible: true, order: 9, size: 'full', collapsed: false },
  { id: 'table-clients', name: 'רשימת לקוחות', description: 'טבלת לקוחות ראשית', category: 'tables', visible: true, order: 10, size: 'full', collapsed: false },
  { id: 'table-vip', name: 'לקוחות VIP', description: 'לקוחות עם הכנסות גבוהות', category: 'tables', visible: true, order: 11, size: 'full', collapsed: false },
  { id: 'features-info', name: 'מידע ותכונות', description: 'כרטיסי מידע', category: 'other', visible: true, order: 12, size: 'full', collapsed: false },
];

export interface WidgetPreset {
  id: string;
  name: string;
  description: string;
  config: Pick<WidgetConfig, 'id' | 'visible' | 'order' | 'size'>[];
}

export const widgetPresets: WidgetPreset[] = [
  {
    id: 'minimal',
    name: 'מינימלי',
    description: 'רק סטטיסטיקות בסיסיות',
    config: defaultWidgets.map(w => ({ 
      id: w.id, 
      visible: w.category === 'stats' || w.id === 'table-clients', 
      order: w.order, 
      size: w.size 
    })),
  },
  {
    id: 'full',
    name: 'מלא',
    description: 'כל הוידג\'טים גלויים',
    config: defaultWidgets.map(w => ({ id: w.id, visible: true, order: w.order, size: w.size })),
  },
  {
    id: 'charts-only',
    name: 'גרפים בלבד',
    description: 'סטטיסטיקות וגרפים ללא טבלאות',
    config: defaultWidgets.map(w => ({ 
      id: w.id, 
      visible: w.category === 'stats' || w.category === 'charts', 
      order: w.order, 
      size: w.size 
    })),
  },
  {
    id: 'tables-only',
    name: 'טבלאות בלבד',
    description: 'סטטיסטיקות וטבלאות ללא גרפים',
    config: defaultWidgets.map(w => ({ 
      id: w.id, 
      visible: w.category === 'stats' || w.category === 'tables', 
      order: w.order, 
      size: w.size 
    })),
  },
];

interface WidgetManagerContextType {
  widgets: WidgetConfig[];
  updateWidget: (id: WidgetId, updates: Partial<WidgetConfig>) => void;
  toggleVisibility: (id: WidgetId) => void;
  toggleCollapse: (id: WidgetId) => void;
  reorderWidgets: (sourceIndex: number, destIndex: number) => void;
  moveWidget: (id: WidgetId, direction: 'up' | 'down') => void;
  resetToDefaults: () => void;
  applyPreset: (presetId: string) => void;
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
  isWidgetVisible: (id: WidgetId) => boolean;
  getWidget: (id: WidgetId) => WidgetConfig | undefined;
  getWidgetsByCategory: (category: WidgetCategory) => WidgetConfig[];
  autoLayout: boolean;
  toggleAutoLayout: () => void;
  addDynamicStatsWidget: () => void;
  removeDynamicStatsWidget: (id: WidgetId) => void;
}

const WidgetManagerContext = createContext<WidgetManagerContextType | undefined>(undefined);

const WIDGETS_STORAGE_KEY = 'dashboard-widgets-config';

function sanitizeWidgets(widgets: WidgetConfig[]): WidgetConfig[] {
  const seen = new Set<WidgetId>();
  const result: WidgetConfig[] = [];
  
  for (const widget of widgets) {
    if (!seen.has(widget.id)) {
      seen.add(widget.id);
      const defaultWidget = defaultWidgets.find(d => d.id === widget.id);
      result.push({ ...defaultWidget, ...widget, category: defaultWidget?.category || 'other' });
    }
  }
  
  for (const defaultWidget of defaultWidgets) {
    if (!seen.has(defaultWidget.id)) {
      seen.add(defaultWidget.id);
      result.push(defaultWidget);
    }
  }
  
  result.sort((a, b) => a.order - b.order);
  return result.map((w, i) => ({ ...w, order: i + 1 }));
}

const AUTO_LAYOUT_KEY = 'dashboard-auto-layout';

export function WidgetManagerProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);
    if (saved) {
      try {
        return sanitizeWidgets(JSON.parse(saved));
      } catch {
        return defaultWidgets;
      }
    }
    return defaultWidgets;
  });

  const [autoLayout, setAutoLayout] = useState<boolean>(() => {
    const saved = localStorage.getItem(AUTO_LAYOUT_KEY);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(AUTO_LAYOUT_KEY, String(autoLayout));
  }, [autoLayout]);

  const toggleAutoLayout = () => setAutoLayout(prev => !prev);

  useEffect(() => {
    localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const updateWidget = (id: WidgetId, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const toggleVisibility = (id: WidgetId) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const toggleCollapse = (id: WidgetId) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, collapsed: !w.collapsed } : w));
  };

  const reorderWidgets = (sourceIndex: number, destIndex: number) => {
    setWidgets(prev => {
      const result = [...prev];
      const temp = result[sourceIndex];
      result[sourceIndex] = result[destIndex];
      result[destIndex] = temp;
      return result.map((w, i) => ({ ...w, order: i + 1 }));
    });
  };

  const moveWidget = (id: WidgetId, direction: 'up' | 'down') => {
    setWidgets(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex(w => w.id === id);
      if (currentIndex === -1) return prev;
      
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return prev;
      
      const temp = sorted[currentIndex];
      sorted[currentIndex] = sorted[targetIndex];
      sorted[targetIndex] = temp;
      
      return sorted.map((w, i) => ({ ...w, order: i + 1 }));
    });
  };

  const resetToDefaults = () => {
    setWidgets(defaultWidgets);
  };

  const applyPreset = (presetId: string) => {
    const preset = widgetPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    setWidgets(prev => prev.map(widget => {
      const presetConfig = preset.config.find(c => c.id === widget.id);
      return presetConfig ? { ...widget, ...presetConfig } : widget;
    }));
  };

  const exportConfig = (): string => JSON.stringify(widgets, null, 2);

  const importConfig = (json: string): boolean => {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        setWidgets(sanitizeWidgets(imported));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const isWidgetVisible = (id: WidgetId) => widgets.find(w => w.id === id)?.visible ?? true;

  const getWidget = (id: WidgetId) => widgets.find(w => w.id === id);

  const getWidgetsByCategory = (category: WidgetCategory) => 
    widgets.filter(w => w.category === category).sort((a, b) => a.order - b.order);

  const addDynamicStatsWidget = () => {
    const existingDynamicWidgets = widgets.filter(w => w.id.startsWith('dynamic-stats'));
    const nextNumber = existingDynamicWidgets.length + 1;
    const newId = `dynamic-stats-${nextNumber}`;
    
    const newWidget: WidgetConfig = {
      id: newId,
      name: `סטטוס דינמי ${nextNumber}`,
      description: 'סטטיסטיקות מותאמות אישית',
      category: 'stats',
      visible: true,
      order: widgets.length + 1,
      size: 'medium',
      collapsed: false,
    };
    
    setWidgets(prev => [...prev, newWidget]);
  };

  const removeDynamicStatsWidget = (id: WidgetId) => {
    if (id.startsWith('dynamic-stats-')) {
      setWidgets(prev => prev.filter(w => w.id !== id));
      // Also remove from localStorage
      localStorage.removeItem(`dashboard-dynamic-stats-${id}`);
    }
  };

  return (
    <WidgetManagerContext.Provider value={{
      widgets, updateWidget, toggleVisibility, toggleCollapse, reorderWidgets,
      moveWidget, resetToDefaults, applyPreset, exportConfig, importConfig,
      isWidgetVisible, getWidget, getWidgetsByCategory,
      autoLayout, toggleAutoLayout,
      addDynamicStatsWidget, removeDynamicStatsWidget,
    }}>
      {children}
    </WidgetManagerContext.Provider>
  );
}

export function useWidgetManager() {
  const context = useContext(WidgetManagerContext);
  if (!context) throw new Error('useWidgetManager must be used within WidgetManagerProvider');
  return context;
}
