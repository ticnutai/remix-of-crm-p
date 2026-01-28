// Widget Layout Manager - מערכת ניהול פריסת ווידג'טים מאוחדת
// e-control CRM Pro
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
  isLoading: boolean;
  isSaving: boolean;
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
  balanceRow: (widgetId: WidgetId) => void;
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

  // Load from cloud on mount
  useEffect(() => {
    const loadFromCloud = async () => {
      if (!user?.id) {
        // Try localStorage fallback if no user
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
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

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', CLOUD_SETTING_KEY)
          .maybeSingle();

        if (error) {
          console.error('[WidgetLayout] Error loading from cloud:', error);
          // Fallback to localStorage
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            setLayouts(JSON.parse(saved));
          }
        } else if (data?.setting_value?.layouts) {
          // Merge with defaults to ensure all widgets exist
          const merged = DEFAULT_LAYOUTS.map(def => {
            const saved = data.setting_value.layouts.find((l: WidgetLayout) => l.id === def.id);
            return saved ? { ...def, ...saved } : def;
          });
          setLayouts(merged);
          // Also update localStorage as cache
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
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
  const saveToCloud = useCallback(async (newLayouts: WidgetLayout[]) => {
    // Always save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayouts));

    if (!user?.id) return;

    // Debounce cloud save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert(
            {
              user_id: user.id,
              setting_key: CLOUD_SETTING_KEY,
              setting_value: { layouts: newLayouts, gridGap, lastUpdated: new Date().toISOString() },
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,setting_key' }
          );

        if (error) {
          console.error('[WidgetLayout] Error saving to cloud:', error);
        } else {
          console.log('[WidgetLayout] Saved to cloud successfully');
        }
      } catch (err) {
        console.error('[WidgetLayout] Failed to save:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1 second debounce
  }, [user?.id, gridGap]);

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
    toast({
      title: "📐 מרווח שונה",
      description: `מרווח: ${GAP_LABELS[gap]}`,
      duration: 1500,
    });
  }, []);

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
      isLoading,
      isSaving,
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
      balanceRow,
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
