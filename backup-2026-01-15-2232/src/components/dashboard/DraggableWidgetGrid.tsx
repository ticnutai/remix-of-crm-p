import React, { useState, useRef, useCallback, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, Move, Maximize2, Minimize2 } from 'lucide-react';
import { useWidgetManager, WidgetId, WidgetConfig } from './WidgetManager';
import { useDashboardTheme } from './DashboardThemeProvider';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// Context for tracking dragged widget
interface DragContextType {
  draggedWidgetId: WidgetId | null;
  setDraggedWidgetId: (id: WidgetId | null) => void;
}

const DragContext = createContext<DragContextType>({
  draggedWidgetId: null,
  setDraggedWidgetId: () => {},
});

interface DraggableWidgetProps {
  widgetId: WidgetId;
  children: React.ReactNode;
  className?: string;
}

export function DraggableWidget({ widgetId, children, className }: DraggableWidgetProps) {
  const { widgets, reorderWidgets, updateWidget, getWidget } = useWidgetManager();
  const { currentTheme } = useDashboardTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const { draggedWidgetId, setDraggedWidgetId } = useContext(DragContext);

  const isNavyGold = currentTheme === 'navy-gold';
  const isModernDark = currentTheme === 'modern-dark';

  const widget = getWidget(widgetId);
  const widgetIndex = widgets.findIndex(w => w.id === widgetId);

  // Size options
  const sizes: WidgetConfig['size'][] = ['small', 'medium', 'large', 'full'];
  const sizeLabels: Record<string, string> = {
    small: 'קטן',
    medium: 'בינוני',
    large: 'גדול',
    full: 'מלא'
  };

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('widgetId', widgetId);
    e.dataTransfer.setData('sourceIndex', widgetIndex.toString());
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    setDraggedWidgetId(widgetId);
  }, [widgetId, widgetIndex, setDraggedWidgetId]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedWidgetId(null);
  }, [setDraggedWidgetId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Only show drag over if it's a different widget
    if (draggedWidgetId && draggedWidgetId !== widgetId) {
      setIsDragOver(true);
    }
  }, [draggedWidgetId, widgetId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Prevent flickering when moving over child elements
    const relatedTarget = e.relatedTarget as Node | null;
    if (dragRef.current && relatedTarget && dragRef.current.contains(relatedTarget)) {
      return;
    }
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const sourceWidgetId = e.dataTransfer.getData('widgetId') as WidgetId;
    const sourceIndex = widgets.findIndex(w => w.id === sourceWidgetId);
    const destIndex = widgetIndex;
    
    if (sourceWidgetId !== widgetId && sourceIndex !== -1 && destIndex !== -1) {
      // Swap the two widgets
      reorderWidgets(sourceIndex, destIndex);
      toast({
        title: "✅ סדר הווידג'טים עודכן",
        description: `${widgets[sourceIndex]?.name} הוחלף עם ${widgets[destIndex]?.name}`,
        duration: 2000,
      });
    }
  }, [widgetId, widgetIndex, widgets, reorderWidgets]);

  const handleCycleSize = useCallback(() => {
    if (!widget) return;
    const currentSizeIndex = sizes.indexOf(widget.size);
    const nextSizeIndex = (currentSizeIndex + 1) % sizes.length;
    const newSize = sizes[nextSizeIndex];
    updateWidget(widgetId, { size: newSize });
    toast({
      title: "📐 גודל הווידג'ט שונה",
      description: `גודל חדש: ${sizeLabels[newSize]}`,
      duration: 1500,
    });
  }, [widget, widgetId, updateWidget, sizes, sizeLabels]);

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative group transition-all duration-200",
        isDragging && "opacity-50 scale-[0.98] z-50",
        isDragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]",
        className
      )}
    >
      {/* Drag Handle - Right Side */}
      <div
        className={cn(
          "absolute -right-3 top-1/2 -translate-y-1/2 z-20",
          "opacity-0 group-hover:opacity-100 transition-all duration-200",
          "cursor-grab active:cursor-grabbing",
          "p-2 rounded-lg shadow-lg",
          (isNavyGold || isModernDark) 
            ? "bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-[hsl(45,80%,60%)] border border-[hsl(45,80%,50%)]/50" 
            : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
        )}
        title="גרור לשינוי מיקום"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Resize Handle - Bottom Right Corner */}
      <div
        className={cn(
          "absolute -bottom-2 -right-2 z-20",
          "opacity-0 group-hover:opacity-100 transition-all duration-200",
          "cursor-pointer",
          "p-1.5 rounded-lg shadow-lg",
          (isNavyGold || isModernDark) 
            ? "bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-[hsl(45,80%,60%)] border border-[hsl(45,80%,50%)]/50" 
            : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
        )}
        onClick={handleCycleSize}
        title={`גודל נוכחי: ${sizeLabels[widget?.size || 'medium']} - לחץ לשנות`}
      >
        <Maximize2 className="h-4 w-4" />
      </div>

      {/* Size Badge */}
      <div
        className={cn(
          "absolute -bottom-2 left-1/2 -translate-x-1/2 z-20",
          "opacity-0 group-hover:opacity-100 transition-all duration-200",
          "px-2 py-0.5 rounded-full text-[10px] font-medium shadow-lg",
          (isNavyGold || isModernDark) 
            ? "bg-[hsl(220,60%,25%)] text-[hsl(45,80%,60%)] border border-[hsl(45,80%,50%)]/50" 
            : "bg-muted text-muted-foreground border border-border"
        )}
      >
        {sizeLabels[widget?.size || 'medium']}
      </div>
      
      {/* Drop Indicator */}
      {isDragOver && (
        <div 
          className={cn(
            "absolute inset-0 rounded-xl pointer-events-none z-10",
            "border-3 border-dashed animate-pulse",
            (isNavyGold || isModernDark) 
              ? "border-amber-400 bg-amber-400/20" 
              : "border-primary bg-primary/10"
          )}
        >
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "px-4 py-2 rounded-lg font-medium text-sm",
            (isNavyGold || isModernDark)
              ? "bg-amber-400 text-slate-900"
              : "bg-primary text-primary-foreground"
          )}>
            שחרר להחלפה
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

interface DraggableWidgetGridProps {
  children: React.ReactNode;
  className?: string;
}

export function DraggableWidgetGrid({ children, className }: DraggableWidgetGridProps) {
  const { currentTheme } = useDashboardTheme();
  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);
  const isNavyGold = currentTheme === 'navy-gold';
  const isModernDark = currentTheme === 'modern-dark';

  return (
    <DragContext.Provider value={{ draggedWidgetId, setDraggedWidgetId }}>
      <div className={cn("space-y-6", className)}>
        {/* Drag Instructions */}
        <div 
          className={cn(
            "flex items-center justify-between gap-2 text-sm px-4 py-3 rounded-xl",
            (isNavyGold || isModernDark) 
              ? "bg-white/5 text-white/60 border border-white/10" 
              : "bg-muted text-muted-foreground border border-border"
          )}
        >
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4" />
            <span>גרור את הידית כדי להחליף מיקום ווידג'טים</span>
          </div>
          <div className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4" />
            <span>לחץ על הפינה לשינוי גודל</span>
          </div>
        </div>
        {children}
      </div>
    </DragContext.Provider>
  );
}
