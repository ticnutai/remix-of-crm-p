// Dashboard Widget Container - רכיב עטיפה לווידג'טים עם drag-drop ו-resize
// e-control CRM Pro
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, Maximize2, ChevronUp, ChevronDown, Eye, EyeOff, Scale } from 'lucide-react';
import { useWidgetLayout, WidgetId, SIZE_LABELS, GAP_CLASSES } from './WidgetLayoutManager';
import { useDashboardTheme } from './DashboardThemeProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WidgetContainerProps {
  widgetId: WidgetId;
  children: React.ReactNode;
  className?: string;
  enableDrag?: boolean;
  enableResize?: boolean;
}

// Global drag state
let globalDraggedId: WidgetId | null = null;

// Hook to get widget edit mode from global state
function useWidgetEditMode() {
  const [editMode, setEditMode] = useState(() => {
    const saved = localStorage.getItem('widget-edit-mode');
    return saved === 'true';
  });

  useEffect(() => {
    const handleChange = (e: CustomEvent<{ enabled: boolean }>) => {
      setEditMode(e.detail.enabled);
    };
    
    window.addEventListener('widgetEditModeChanged', handleChange as EventListener);
    return () => window.removeEventListener('widgetEditModeChanged', handleChange as EventListener);
  }, []);

  return editMode;
}

export function WidgetContainer({ 
  widgetId, 
  children, 
  className,
  enableDrag = true,
  enableResize = true,
}: WidgetContainerProps) {
  const { 
    getLayout, 
    getGridClass, 
    swapWidgets, 
    cycleSize, 
    setSize,
    toggleCollapse,
    moveWidget,
    balanceRow,
  } = useWidgetLayout();
  const { currentTheme } = useDashboardTheme();
  const editMode = useWidgetEditMode();
  
  // Only allow drag/resize when edit mode is enabled
  const canDrag = enableDrag && editMode;
  const canResize = enableResize && editMode;
  
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const layout = getLayout(widgetId);
  const isNavyGold = currentTheme === 'navy-gold';
  const isModernDark = currentTheme === 'modern-dark';
  const isDarkTheme = isNavyGold || isModernDark;

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!canDrag) return;
    
    e.dataTransfer.setData('text/plain', widgetId);
    e.dataTransfer.effectAllowed = 'move';
    globalDraggedId = widgetId;
    setIsDragging(true);
    
    // Create drag image
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(containerRef.current, rect.width / 2, 20);
    }
  }, [widgetId, canDrag]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    globalDraggedId = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!canDrag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (globalDraggedId && globalDraggedId !== widgetId) {
      setIsDragOver(true);
    }
  }, [widgetId, canDrag]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (containerRef.current && relatedTarget && containerRef.current.contains(relatedTarget)) {
      return;
    }
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const sourceId = e.dataTransfer.getData('text/plain') as WidgetId;
    if (sourceId && sourceId !== widgetId) {
      swapWidgets(sourceId, widgetId);
    }
    globalDraggedId = null;
  }, [widgetId, swapWidgets]);

  const handleResizeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    cycleSize(widgetId);
  }, [widgetId, cycleSize]);

  if (!layout) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative group transition-all duration-300",
        getGridClass(widgetId),
        isDragging && "opacity-50 scale-[0.98] z-50",
        isDragOver && "ring-2 ring-offset-2 ring-offset-background scale-[1.01]",
        isDragOver && (isDarkTheme ? "ring-amber-400" : "ring-primary"),
        layout.collapsed && "h-16 overflow-hidden",
        className
      )}
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Handle - Right Side - Only visible in edit mode */}
      {canDrag && (
        <div
          className={cn(
            "absolute -right-2 top-4 z-30",
            "opacity-0 group-hover:opacity-100 transition-all duration-200",
            "cursor-grab active:cursor-grabbing",
            "p-1.5 rounded-lg shadow-lg",
            isDarkTheme 
              ? "bg-slate-800/90 hover:bg-slate-700 text-amber-400 border border-amber-500/30" 
              : "bg-white/90 hover:bg-white text-primary border border-primary/30 shadow-md"
          )}
          title="גרור להחלפת מיקום"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Widget Actions Menu - Top Right - Only visible in edit mode */}
      {editMode && (
        <div
          className={cn(
            "absolute -top-2 -right-2 z-30",
            "opacity-0 group-hover:opacity-100 transition-all duration-200",
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-7 w-7 p-0 rounded-full shadow-lg",
                  isDarkTheme 
                    ? "bg-slate-800/90 hover:bg-slate-700 text-amber-400 border-amber-500/30" 
                    : "bg-white/90 hover:bg-white text-primary border-primary/30"
                )}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setSize(widgetId, 'small')}>
                <span className={layout.size === 'small' ? 'font-bold' : ''}>קטן (25%)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSize(widgetId, 'medium')}>
                <span className={layout.size === 'medium' ? 'font-bold' : ''}>בינוני (50%)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSize(widgetId, 'large')}>
                <span className={layout.size === 'large' ? 'font-bold' : ''}>גדול (75%)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSize(widgetId, 'full')}>
                <span className={layout.size === 'full' ? 'font-bold' : ''}>רוחב מלא (100%)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => balanceRow(widgetId)}>
                <Scale className="h-4 w-4 ml-2" />
                אזן שורה
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => moveWidget(widgetId, 'up')}>
                <ChevronUp className="h-4 w-4 ml-2" />
                הזז למעלה
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => moveWidget(widgetId, 'down')}>
                <ChevronDown className="h-4 w-4 ml-2" />
                הזז למטה
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleCollapse(widgetId)}>
                {layout.collapsed ? (
                  <>
                    <Eye className="h-4 w-4 ml-2" />
                    הרחב
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 ml-2" />
                    כווץ
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Resize Handle - Bottom Right Corner - Only visible in edit mode */}
      {canResize && (
        <div
          className={cn(
            "absolute -bottom-2 -right-2 z-30",
            "opacity-0 group-hover:opacity-100 transition-all duration-200",
            "cursor-pointer",
            "p-1 rounded-full shadow-lg",
            isDarkTheme 
              ? "bg-amber-500 hover:bg-amber-400 text-slate-900" 
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
          onClick={handleResizeClick}
          title={`גודל: ${SIZE_LABELS[layout.size]} - לחץ לשנות`}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Size Badge */}
      {editMode && (
        <div
          className={cn(
            "absolute -bottom-1 left-1/2 -translate-x-1/2 z-20",
            "opacity-0 group-hover:opacity-100 transition-all duration-200",
            "px-2 py-0.5 rounded-full text-[10px] font-medium shadow",
            isDarkTheme 
              ? "bg-slate-800 text-amber-400 border border-amber-500/30" 
              : "bg-white text-primary border border-primary/20"
          )}
        >
          {SIZE_LABELS[layout.size]}
        </div>
      )}

      {/* Drop Overlay */}
      {isDragOver && (
        <div 
          className={cn(
            "absolute inset-0 rounded-xl z-20 pointer-events-none",
            "border-2 border-dashed animate-pulse",
            isDarkTheme 
              ? "border-amber-400 bg-amber-400/10" 
              : "border-primary bg-primary/10"
          )}
        >
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "px-4 py-2 rounded-lg font-medium text-sm shadow-lg",
            isDarkTheme
              ? "bg-amber-500 text-slate-900"
              : "bg-primary text-primary-foreground"
          )}>
            🔄 שחרר להחלפה
          </div>
        </div>
      )}

      {/* Collapsed Overlay */}
      {layout.collapsed && (
        <div 
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center cursor-pointer rounded-xl",
            isDarkTheme 
              ? "bg-slate-800/80" 
              : "bg-muted/80"
          )}
          onClick={() => toggleCollapse(widgetId)}
        >
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            isDarkTheme ? "bg-amber-500/20 text-amber-400" : "bg-primary/10 text-primary"
          )}>
            {layout.name} - לחץ להרחבה
          </span>
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
}

// Grid wrapper with 4-column layout and configurable gap
interface WidgetGridProps {
  children: React.ReactNode;
  className?: string;
}

export function WidgetGrid({ children, className }: WidgetGridProps) {
  const { currentTheme } = useDashboardTheme();
  const { gridGap } = useWidgetLayout();
  const isDarkTheme = currentTheme === 'navy-gold' || currentTheme === 'modern-dark';
  const editMode = useWidgetEditMode();

  return (
    <div className={cn("space-y-3", className)}>
      {/* Instructions Bar - Only visible in edit mode */}
      {editMode && (
        <div 
          className={cn(
            "flex items-center justify-center gap-6 text-xs px-4 py-2 rounded-lg",
            isDarkTheme 
              ? "bg-slate-800/50 text-slate-400 border border-slate-700" 
              : "bg-muted/50 text-muted-foreground border border-border"
          )}
        >
          <div className="flex items-center gap-1.5">
            <GripVertical className="h-3.5 w-3.5" />
            <span>גרור להחלפה</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5" />
            <span>לחץ לשינוי גודל</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            <span>איזון שורה</span>
          </div>
        </div>
      )}
      
      {/* 4-column Grid with dense packing and configurable gap */}
      <div 
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
          GAP_CLASSES[gridGap],
          "[grid-auto-flow:dense]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
