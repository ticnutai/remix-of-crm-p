// Widget Layout Manager - מערכת ניהול פריסת ווידג'טים מאוחדת
// tenarch CRM Pro
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Widget Size Types
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

// Grid Gap Types
export type GridGap = 'tight' | 'normal' | 'wide';

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
  | 'dynamic-stats'
  | string; // Support dynamic IDs

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
export const DEFAULT_LAYOUTS: WidgetLayout[] = [
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

const STORAGE_KEY = 'widget-layouts-v3';
const GAP_STORAGE_KEY = 'widget-grid-gap';

// Size cycle order
const SIZE_CYCLE: WidgetSize[] = ['small', 'medium', 'large', 'full'];

// Size display names
export const SIZE_LABELS: Record<WidgetSize, string> = {
  small: 'קטן (25%)',
  medium: 'בינוני (50%)',
  large: 'גדול (75%)',
  full: 'מלא (100%)',
};

// Grid class for each size (4-column grid system)
export const SIZE_GRID_CLASS: Record<WidgetSize, string> = {
  small: 'col-span-1',                    // 1/4 width
  medium: 'col-span-2',                   // 1/2 width
  large: 'col-span-3',                    // 3/4 width
  full: 'col-span-4',                     // full width
};

// Size weights for grid calculations
export const SIZE_WEIGHTS: Record<WidgetSize, number> = {
  small: 1,
  medium: 2,
  large: 3,
  full: 4,
};

// Gap classes
export const GAP_CLASSES: Record<GridGap, string> = {
  tight: 'gap-2',
  normal: 'gap-4',
  wide: 'gap-6',
};

export const GAP_LABELS: Record<GridGap, string> = {
  tight: 'צפוף',
  normal: 'רגיל',
  wide: 'רחב',
};

// Context Type
interface WidgetLayoutContextType {
  layouts: WidgetLayout[];
  gridGap: GridGap;
  gapX: number;
  gapY: number;
  isLoading: boolean;
  isSaving: boolean;
  equalizeHeights: boolean;
  autoExpand: boolean;
  dashboardTheme: string;
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
  autoArrangeWidgets: () => void;
  setGridGap: (gap: GridGap) => void;
  setGapX: (gap: number) => void;
  setGapY: (gap: number) => void;
  balanceRow: (widgetId: WidgetId) => void;
  setEqualizeHeights: (enabled: boolean) => void;
  setAutoExpand: (enabled: boolean) => void;
  setDashboardTheme: (theme: string) => void;
}

const WidgetLayoutContext = createContext<WidgetLayoutContextType | undefined>(undefined);

const CLOUD_SETTING_KEY = 'dashboard-widget-layouts';

// Provider Component
export function WidgetLayoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [layouts, setLayouts] = useState<WidgetLayout[]>(DEFAULT_LAYOUTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);

  const [gridGap, setGridGapState] = useState<GridGap>(() => {
    try {
      const saved = localStorage.getItem(GAP_STORAGE_KEY);
      if (saved && ['tight', 'normal', 'wide'].includes(saved)) {
        return saved as GridGap;
      }
    } catch (e) {
      console.error('[WidgetLayout] Error loading gap:', e);
    }
    return 'normal';
  });

  // Equalize heights option - makes all widgets in a row same height
  const [equalizeHeights, setEqualizeHeightsState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('widget-equalize-heights');
      return saved === 'true';
    } catch (e) {
      return true; // Default to true
    }
  });

  // Auto expand option - expand last widget in row to fill empty space
  const [autoExpand, setAutoExpandState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('widget-auto-expand');
      return saved !== 'false'; // Default to true
    } catch (e) {
      return true;
    }
  });

  // Dashboard theme - synced to cloud
  const [dashboardTheme, setDashboardThemeState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('dashboard-theme');
      return saved || 'navy-gold';
    } catch (e) {
      return 'navy-gold';
    }
  });

  // Custom gap values (in pixels)
  const [gapX, setGapXState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('widget-gap-x');
      return saved ? parseInt(saved, 10) : 16;
    } catch (e) {
      return 16;
    }
  });

  const [gapY, setGapYState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('widget-gap-y');
      return saved ? parseInt(saved, 10) : 16;
    } catch (e) {
      return 16;
    }
  });

  // Load from cloud on mount
  useEffect(() => {
    const loadFromCloud = async () => {
      console.log('[WidgetLayout DEBUG] loadFromCloud called, user:', user?.id ? user.id.substring(0, 8) + '...' : 'NO USER');
      
      if (!user?.id) {
        console.log('[WidgetLayout DEBUG] No user, trying localStorage fallback');
        // Try localStorage fallback if no user
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          console.log('[WidgetLayout DEBUG] localStorage data:', saved ? 'FOUND' : 'NOT FOUND');
          if (saved) {
            const parsed = JSON.parse(saved);
            const merged = DEFAULT_LAYOUTS.map(def => {
              const savedLayout = parsed.find((p: WidgetLayout) => p.id === def.id);
              return savedLayout ? { ...def, ...savedLayout } : def;
            });
            setLayouts(merged);
          }
        } catch (e) {
          console.error('[WidgetLayout] Error loading from localStorage:', e);
        }
        setIsLoading(false);
        return;
      }

      console.log('[WidgetLayout DEBUG] Fetching from cloud for user:', user.id.substring(0, 8) + '...');
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', CLOUD_SETTING_KEY)
          .maybeSingle();

        console.log('[WidgetLayout DEBUG] Cloud response:', { data: data ? 'FOUND' : 'NULL', error: error?.message || 'NO ERROR' });

        if (error) {
          console.error('[WidgetLayout] Error loading from cloud:', error);
          // Fallback to localStorage
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            setLayouts(JSON.parse(saved));
          }
        } else if ((data?.setting_value as any)?.layouts) {
          const settingValue = data.setting_value as any;
          console.log('[WidgetLayout DEBUG] Found', settingValue.layouts.length, 'layouts in cloud');
          // Merge with defaults to ensure all widgets exist
          const merged = DEFAULT_LAYOUTS.map(def => {
            const saved = settingValue.layouts.find((l: WidgetLayout) => l.id === def.id);
            return saved ? { ...def, ...saved } : def;
          });
          setLayouts(merged);
          // Also update localStorage as cache
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          
          // Load display settings from cloud
          if (settingValue.gridGap && ['tight', 'normal', 'wide'].includes(settingValue.gridGap)) {
            setGridGapState(settingValue.gridGap);
            localStorage.setItem(GAP_STORAGE_KEY, settingValue.gridGap);
          }
          if (typeof settingValue.equalizeHeights === 'boolean') {
            setEqualizeHeightsState(settingValue.equalizeHeights);
            localStorage.setItem('widget-equalize-heights', String(settingValue.equalizeHeights));
          }
          if (typeof settingValue.autoExpand === 'boolean') {
            setAutoExpandState(settingValue.autoExpand);
            localStorage.setItem('widget-auto-expand', String(settingValue.autoExpand));
          }
          // Load dashboard theme from cloud
          if (settingValue.dashboardTheme) {
            setDashboardThemeState(settingValue.dashboardTheme);
            localStorage.setItem('dashboard-theme', settingValue.dashboardTheme);
            // Dispatch event for DashboardThemeProvider to sync
            window.dispatchEvent(new CustomEvent('dashboardThemeChanged', { detail: settingValue.dashboardTheme }));
          }
        } else {
          console.log('[WidgetLayout DEBUG] No data in cloud, using defaults');
        }
      } catch (err) {
        console.error('[WidgetLayout] Failed to load:', err);
      } finally {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    };

    loadFromCloud();
  }, [user?.id]);

  // Save to cloud with debounce
  const saveToCloud = useCallback(async (
    newLayouts: WidgetLayout[],
    overrideSettings?: { gridGap?: GridGap; equalizeHeights?: boolean; autoExpand?: boolean; dashboardTheme?: string }
  ) => {
    console.log('[WidgetLayout DEBUG] saveToCloud called with', newLayouts.length, 'layouts');
    console.log('[WidgetLayout DEBUG] User ID:', user?.id ? user.id.substring(0, 8) + '...' : 'NO USER');
    
    // Always save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayouts));
    console.log('[WidgetLayout DEBUG] Saved to localStorage');

    if (!user?.id) {
      console.log('[WidgetLayout DEBUG] No user, skipping cloud save');
      return;
    }

    // Use overrideSettings if provided, otherwise use current state
    const settingsToSave = {
      gridGap: overrideSettings?.gridGap ?? gridGap,
      equalizeHeights: overrideSettings?.equalizeHeights ?? equalizeHeights,
      autoExpand: overrideSettings?.autoExpand ?? autoExpand,
      dashboardTheme: overrideSettings?.dashboardTheme ?? dashboardTheme,
      gapX: (overrideSettings as any)?.gapX ?? gapX,
      gapY: (overrideSettings as any)?.gapY ?? gapY,
    };

    // Debounce cloud save
    if (saveTimeoutRef.current) {
      console.log('[WidgetLayout DEBUG] Clearing previous timeout');
      clearTimeout(saveTimeoutRef.current);
    }

    console.log('[WidgetLayout DEBUG] Setting timeout for cloud save (1 second)');
    saveTimeoutRef.current = setTimeout(async () => {
      console.log('[WidgetLayout DEBUG] Timeout fired, starting cloud save...');
      setIsSaving(true);
      try {
        const payload = {
          user_id: user.id,
          setting_key: CLOUD_SETTING_KEY,
          setting_value: { 
            layouts: newLayouts, 
            ...settingsToSave,
            lastUpdated: new Date().toISOString() 
          },
          updated_at: new Date().toISOString(),
        };
        console.log('[WidgetLayout DEBUG] Upsert payload:', { ...payload, user_id: payload.user_id.substring(0, 8) + '...' });
        
        const { error } = await (supabase as any)
          .from('user_settings')
          .upsert(
            payload,
            { onConflict: 'user_id,setting_key' }
          );

        if (error) {
          console.error('[WidgetLayout DEBUG] Cloud save ERROR:', error.message, error.details, error.hint);
        } else {
          console.log('[WidgetLayout DEBUG] ✅ Saved to cloud successfully!');
        }
      } catch (err) {
        console.error('[WidgetLayout DEBUG] Cloud save EXCEPTION:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1 second debounce
  }, [user?.id, gridGap, equalizeHeights, autoExpand, dashboardTheme]);

  // Update layouts and save
  const updateLayouts = useCallback((updater: (prev: WidgetLayout[]) => WidgetLayout[]) => {
    setLayouts(prev => {
      const newLayouts = updater(prev);
      saveToCloud(newLayouts);
      return newLayouts;
    });
  }, [saveToCloud]);

  // Set grid gap
  const setGridGap = useCallback((gap: GridGap) => {
    setGridGapState(gap);
    localStorage.setItem(GAP_STORAGE_KEY, gap);
    // Trigger cloud save with the new gridGap value
    saveToCloud(layouts, { gridGap: gap });
    toast({
      title: "📐 מרווח שונה",
      description: `מרווח: ${GAP_LABELS[gap]}`,
      duration: 1500,
    });
  }, [layouts, saveToCloud]);

  // Set equalize heights
  const setEqualizeHeights = useCallback((enabled: boolean) => {
    setEqualizeHeightsState(enabled);
    localStorage.setItem('widget-equalize-heights', String(enabled));
    // Trigger cloud save with the new equalizeHeights value
    saveToCloud(layouts, { equalizeHeights: enabled });
    toast({
      title: enabled ? "⚖️ יישור גבהים מופעל" : "⚖️ יישור גבהים כבוי",
      description: enabled ? "ווידג'טים באותה שורה יהיו באותו גובה" : "כל ווידג'ט בגובה שלו",
      duration: 1500,
    });
  }, [layouts, saveToCloud]);

  // Set auto expand
  const setAutoExpand = useCallback((enabled: boolean) => {
    setAutoExpandState(enabled);
    localStorage.setItem('widget-auto-expand', String(enabled));
    // Trigger cloud save with the new autoExpand value
    saveToCloud(layouts, { autoExpand: enabled });
    toast({
      title: enabled ? "↔️ הרחבה אוטומטית מופעלת" : "↔️ הרחבה אוטומטית כבויה",
      description: enabled ? "ווידג'טים יתרחבו למלא שטח ריק" : "ווידג'טים ישמרו על גודלם המוגדר",
      duration: 1500,
    });
  }, [layouts, saveToCloud]);

  // Set dashboard theme - synced to cloud for cross-device persistence
  const setDashboardTheme = useCallback((theme: string) => {
    setDashboardThemeState(theme);
    localStorage.setItem('dashboard-theme', theme);
    // Dispatch event for DashboardThemeProvider to sync
    window.dispatchEvent(new CustomEvent('dashboardThemeChanged', { detail: theme }));
    // Trigger cloud save with the new theme value
    saveToCloud(layouts, { dashboardTheme: theme });
  }, [layouts, saveToCloud]);

  // Set horizontal gap
  const setGapX = useCallback((gap: number) => {
    setGapXState(gap);
    localStorage.setItem('widget-gap-x', String(gap));
    saveToCloud(layouts, { gapX: gap } as any);
  }, [layouts, saveToCloud]);

  // Set vertical gap
  const setGapY = useCallback((gap: number) => {
    setGapYState(gap);
    localStorage.setItem('widget-gap-y', String(gap));
    saveToCloud(layouts, { gapY: gap } as any);
  }, [layouts, saveToCloud]);

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
    if (id1 === id2) return;
    
    updateLayouts(prev => {
      const newLayouts = [...prev];
      const idx1 = newLayouts.findIndex(l => l.id === id1);
      const idx2 = newLayouts.findIndex(l => l.id === id2);
      
      if (idx1 === -1 || idx2 === -1) return prev;
      
      // Swap orders
      const tempOrder = newLayouts[idx1].order;
      newLayouts[idx1] = { ...newLayouts[idx1], order: newLayouts[idx2].order };
      newLayouts[idx2] = { ...newLayouts[idx2], order: tempOrder };
      
      return newLayouts;
    });

    toast({
      title: "✅ מיקום הוחלף",
      description: "הווידג'טים הוחלפו בהצלחה",
      duration: 1500,
    });
  }, [updateLayouts]);

  // Cycle through sizes
  const cycleSize = useCallback((id: WidgetId) => {
    updateLayouts(prev => {
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
  }, [updateLayouts]);

  // Set specific size
  const setSize = useCallback((id: WidgetId, size: WidgetSize) => {
    updateLayouts(prev => prev.map(l => l.id === id ? { ...l, size } : l));
    
    const widget = layouts.find(l => l.id === id);
    toast({
      title: "📐 גודל שונה",
      description: `${widget?.name || id}: ${SIZE_LABELS[size]}`,
      duration: 1500,
    });
  }, [layouts, updateLayouts]);

  // Toggle visibility
  const toggleVisibility = useCallback((id: WidgetId) => {
    updateLayouts(prev => {
      const widget = prev.find(l => l.id === id);
      const newVisible = !widget?.visible;
      
      toast({
        title: newVisible ? "👁 ווידג'ט גלוי" : "🙈 ווידג'ט מוסתר",
        description: widget?.name || id,
        duration: 1500,
      });
      
      return prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
    });
  }, [updateLayouts]);

  // Toggle collapse
  const toggleCollapse = useCallback((id: WidgetId) => {
    updateLayouts(prev => prev.map(l => l.id === id ? { ...l, collapsed: !l.collapsed } : l));
  }, [updateLayouts]);

  // Move widget up or down
  const moveWidget = useCallback((id: WidgetId, direction: 'up' | 'down') => {
    updateLayouts(prev => {
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
  }, [updateLayouts]);

  // Balance row - make widgets in same row equal size
  const balanceRow = useCallback((widgetId: WidgetId) => {
    updateLayouts(prev => {
      const sorted = [...prev].filter(l => l.visible).sort((a, b) => a.order - b.order);
      const targetIdx = sorted.findIndex(l => l.id === widgetId);
      if (targetIdx === -1) return prev;

      // Find widgets in same "row" (sum of sizes = 4)
      let rowStart = 0;
      let currentSum = 0;
      
      for (let i = 0; i <= targetIdx; i++) {
        const weight = SIZE_WEIGHTS[sorted[i].size];
        if (currentSum + weight > 4) {
          rowStart = i;
          currentSum = weight;
        } else {
          currentSum += weight;
        }
      }

      // Find row end
      let rowEnd = rowStart;
      currentSum = SIZE_WEIGHTS[sorted[rowStart].size];
      for (let i = rowStart + 1; i < sorted.length; i++) {
        const weight = SIZE_WEIGHTS[sorted[i].size];
        if (currentSum + weight > 4) break;
        currentSum += weight;
        rowEnd = i;
      }

      // Calculate balanced size
      const widgetsInRow = rowEnd - rowStart + 1;
      const balancedSize: WidgetSize = widgetsInRow === 1 ? 'full' :
                                        widgetsInRow === 2 ? 'medium' :
                                        widgetsInRow === 3 ? 'small' : 'small';

      // Apply balanced size to all widgets in row
      const rowWidgetIds = sorted.slice(rowStart, rowEnd + 1).map(w => w.id);
      
      toast({
        title: "⚖️ שורה מאוזנת",
        description: `${widgetsInRow} ווידג'טים שונו לגודל ${SIZE_LABELS[balancedSize]}`,
        duration: 2000,
      });

      return prev.map(l => rowWidgetIds.includes(l.id) ? { ...l, size: balancedSize } : l);
    });
  }, [updateLayouts]);

  // Auto-arrange widgets to eliminate gaps (pack efficiently in 4-column grid)
  const autoArrangeWidgets = useCallback(() => {
    updateLayouts(prev => {
      const visible = prev.filter(l => l.visible);
      const hidden = prev.filter(l => !l.visible);
      
      // Sort by size (larger first) for optimal row packing
      visible.sort((a, b) => SIZE_WEIGHTS[b.size] - SIZE_WEIGHTS[a.size]);
      
      // Pack into rows of 4 columns
      const rows: WidgetLayout[][] = [];
      let currentRow: WidgetLayout[] = [];
      let currentRowWeight = 0;

      for (const widget of visible) {
        const weight = SIZE_WEIGHTS[widget.size];
        
        if (currentRowWeight + weight > 4) {
          // Fill remaining space with last widget if possible
          if (currentRow.length > 0) {
            rows.push(currentRow);
          }
          currentRow = [widget];
          currentRowWeight = weight;
        } else {
          currentRow.push(widget);
          currentRowWeight += weight;
        }
      }
      
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }

      // Flatten and assign order
      const arranged = rows.flat().map((widget, idx) => ({
        ...widget,
        order: idx + 1,
      }));
      
      // Add hidden widgets at the end
      const hiddenArranged = hidden.map((widget, idx) => ({
        ...widget,
        order: arranged.length + idx + 1,
      }));
      
      return [...arranged, ...hiddenArranged];
    });
    
    toast({
      title: "✨ סידור אוטומטי",
      description: "הווידג'טים סודרו בצורה אופטימלית ללא רווחים",
      duration: 2000,
    });
  }, [updateLayouts]);

  // Reset all to defaults
  const resetAll = useCallback(async () => {
    updateLayouts(() => DEFAULT_LAYOUTS);
    setGridGapState('normal');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GAP_STORAGE_KEY);
    
    // Also delete from cloud
    if (user?.id) {
      await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('setting_key', CLOUD_SETTING_KEY);
    }
    
    toast({
      title: "🔄 אופס לברירת מחדל",
      description: "כל הגדרות הווידג'טים אופסו",
      duration: 2000,
    });
  }, [updateLayouts, user?.id]);

  return (
    <WidgetLayoutContext.Provider value={{
      layouts,
      gridGap,
      gapX,
      gapY,
      isLoading,
      isSaving,
      equalizeHeights,
      autoExpand,
      dashboardTheme,
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
      autoArrangeWidgets,
      setGridGap,
      setGapX,
      setGapY,
      balanceRow,
      setEqualizeHeights,
      setAutoExpand,
      setDashboardTheme,
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
export { DEFAULT_LAYOUTS as defaultLayouts };
