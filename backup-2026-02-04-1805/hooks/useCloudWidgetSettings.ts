// Cloud-synced Widget Layout Settings
import { useCallback, useEffect, useRef } from 'react';
import { useUserSettings } from './useUserSettings';
import { WidgetLayout, WidgetId, WidgetSize, DEFAULT_LAYOUTS } from '@/components/dashboard/WidgetLayoutManager';

interface WidgetLayoutSettings {
  layouts: WidgetLayout[];
  lastUpdated?: string;
}

export function useCloudWidgetSettings() {
  const { value, setValue, isLoading, isSaving } = useUserSettings<WidgetLayoutSettings>({
    key: 'widget-layouts',
    defaultValue: { layouts: DEFAULT_LAYOUTS },
  });

  const initialLoadDone = useRef(false);

  // Merge saved layouts with defaults to handle new widgets
  const mergedLayouts = useCallback((): WidgetLayout[] => {
    if (!value.layouts || value.layouts.length === 0) {
      return DEFAULT_LAYOUTS;
    }
    
    // Merge with defaults to ensure all widgets exist
    return DEFAULT_LAYOUTS.map(def => {
      const saved = value.layouts.find(l => l.id === def.id);
      return saved ? { ...def, ...saved } : def;
    });
  }, [value.layouts]);

  const layouts = mergedLayouts();

  // Save layouts to cloud
  const saveLayouts = useCallback(async (newLayouts: WidgetLayout[]) => {
    await setValue({
      layouts: newLayouts,
      lastUpdated: new Date().toISOString(),
    });
  }, [setValue]);

  // Get single layout
  const getLayout = useCallback((id: WidgetId): WidgetLayout | undefined => {
    return layouts.find(l => l.id === id);
  }, [layouts]);

  // Check visibility
  const isVisible = useCallback((id: WidgetId): boolean => {
    return layouts.find(l => l.id === id)?.visible ?? true;
  }, [layouts]);

  // Swap two widgets
  const swapWidgets = useCallback(async (id1: WidgetId, id2: WidgetId) => {
    if (id1 === id2) return;
    
    const newLayouts = [...layouts];
    const idx1 = newLayouts.findIndex(l => l.id === id1);
    const idx2 = newLayouts.findIndex(l => l.id === id2);
    
    if (idx1 === -1 || idx2 === -1) return;
    
    const tempOrder = newLayouts[idx1].order;
    newLayouts[idx1] = { ...newLayouts[idx1], order: newLayouts[idx2].order };
    newLayouts[idx2] = { ...newLayouts[idx2], order: tempOrder };
    
    await saveLayouts(newLayouts);
  }, [layouts, saveLayouts]);

  // Set size
  const setSize = useCallback(async (id: WidgetId, size: WidgetSize) => {
    const newLayouts = layouts.map(l => l.id === id ? { ...l, size } : l);
    await saveLayouts(newLayouts);
  }, [layouts, saveLayouts]);

  // Toggle visibility
  const toggleVisibility = useCallback(async (id: WidgetId) => {
    const newLayouts = layouts.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
    await saveLayouts(newLayouts);
  }, [layouts, saveLayouts]);

  // Toggle collapse
  const toggleCollapse = useCallback(async (id: WidgetId) => {
    const newLayouts = layouts.map(l => l.id === id ? { ...l, collapsed: !l.collapsed } : l);
    await saveLayouts(newLayouts);
  }, [layouts, saveLayouts]);

  // Move widget
  const moveWidget = useCallback(async (id: WidgetId, direction: 'up' | 'down') => {
    const sorted = [...layouts].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(l => l.id === id);
    
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const tempOrder = sorted[idx].order;
    sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
    sorted[swapIdx] = { ...sorted[swapIdx], order: tempOrder };
    
    await saveLayouts(sorted);
  }, [layouts, saveLayouts]);

  // Auto-arrange widgets to eliminate gaps (pack efficiently)
  const autoArrangeWidgets = useCallback(async () => {
    const visible = layouts.filter(l => l.visible);
    const hidden = layouts.filter(l => !l.visible);
    
    // Sort by current order first
    visible.sort((a, b) => a.order - b.order);
    
    // Size weights for optimal packing (4-column grid)
    const sizeWeight: Record<WidgetSize, number> = {
      full: 4,
      large: 3,
      medium: 2,
      small: 1,
    };
    
    // Sort visible widgets: larger ones first for better packing
    visible.sort((a, b) => sizeWeight[b.size] - sizeWeight[a.size]);
    
    // Reassign order values
    const arranged = visible.map((widget, idx) => ({
      ...widget,
      order: idx + 1,
    }));
    
    // Add hidden widgets at the end
    const hiddenArranged = hidden.map((widget, idx) => ({
      ...widget,
      order: arranged.length + idx + 1,
    }));
    
    await saveLayouts([...arranged, ...hiddenArranged]);
  }, [layouts, saveLayouts]);

  // Reset to defaults
  const resetAll = useCallback(async () => {
    await saveLayouts(DEFAULT_LAYOUTS);
  }, [saveLayouts]);

  return {
    layouts,
    isLoading,
    isSaving,
    getLayout,
    isVisible,
    swapWidgets,
    setSize,
    toggleVisibility,
    toggleCollapse,
    moveWidget,
    autoArrangeWidgets,
    resetAll,
    saveLayouts,
  };
}
