import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GripVertical,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Settings,
  X,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Widget size options
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

// Widget configuration
export interface WidgetConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  size: WidgetSize;
  visible: boolean;
  order: number;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
}

// Storage key for saving widget layout
const STORAGE_KEY = 'finance-widget-layout';

// Size to grid columns mapping
const sizeToColumns: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-2',
  large: 'col-span-3',
  full: 'col-span-4',
};

// Size labels in Hebrew
const sizeLabels: Record<WidgetSize, string> = {
  small: 'קטן',
  medium: 'בינוני',
  large: 'גדול',
  full: 'מלא',
};

// Sortable Widget Component
interface SortableWidgetProps {
  widget: WidgetConfig;
  children: React.ReactNode;
  onSizeChange: (id: string, size: WidgetSize) => void;
  onVisibilityToggle: (id: string) => void;
  isDragging?: boolean;
}

function SortableWidget({
  widget,
  children,
  onSizeChange,
  onVisibilityToggle,
  isDragging,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.5 : 1,
  };

  const sizes: WidgetSize[] = ['small', 'medium', 'large', 'full'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        sizeToColumns[widget.size],
        'transition-all duration-200',
        isCurrentlyDragging && 'z-50'
      )}
    >
      <Card className={cn(
        'h-full relative group border-2',
        isCurrentlyDragging && 'ring-2 ring-primary shadow-lg',
        !widget.visible && 'opacity-50'
      )}>
        {/* Drag Handle & Controls */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rtl">
              <div className="px-2 py-1.5 text-sm font-medium">גודל</div>
              {sizes.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => onSizeChange(widget.id, size)}
                  className={cn(widget.size === size && 'bg-accent')}
                >
                  {size === 'small' && <Minimize2 className="h-4 w-4 ml-2" />}
                  {size === 'medium' && <LayoutGrid className="h-4 w-4 ml-2" />}
                  {size === 'large' && <Maximize2 className="h-4 w-4 ml-2" />}
                  {size === 'full' && <Maximize2 className="h-4 w-4 ml-2" />}
                  {sizeLabels[size]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onVisibilityToggle(widget.id)}>
                {widget.visible ? (
                  <>
                    <EyeOff className="h-4 w-4 ml-2" />
                    הסתר
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 ml-2" />
                    הצג
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {children}
      </Card>
    </div>
  );
}

// Main Grid Component
interface FinanceWidgetGridProps {
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  children: Record<string, React.ReactNode>;
}

export function FinanceWidgetGrid({
  widgets,
  onWidgetsChange,
  children,
}: FinanceWidgetGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Save to localStorage
  useEffect(() => {
    const saveData = widgets.map(w => ({
      id: w.id,
      size: w.size,
      visible: w.visible,
      order: w.order,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  }, [widgets]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);

      const newWidgets = arrayMove(widgets, oldIndex, newIndex).map((w, i) => ({
        ...w,
        order: i,
      }));

      onWidgetsChange(newWidgets);
    }
  };

  const handleSizeChange = (id: string, size: WidgetSize) => {
    onWidgetsChange(
      widgets.map((w) => (w.id === id ? { ...w, size } : w))
    );
  };

  const handleVisibilityToggle = (id: string) => {
    onWidgetsChange(
      widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const visibleWidgets = widgets.filter((w) => w.visible);
  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visibleWidgets.map((w) => w.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-4 gap-4 auto-rows-min">
          {visibleWidgets.map((widget) => (
            <SortableWidget
              key={widget.id}
              widget={widget}
              onSizeChange={handleSizeChange}
              onVisibilityToggle={handleVisibilityToggle}
              isDragging={activeId === widget.id}
            >
              {children[widget.id]}
            </SortableWidget>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeWidget && (
          <Card className="shadow-2xl ring-2 ring-primary opacity-80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {activeWidget.icon}
                {activeWidget.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-20 flex items-center justify-center text-muted-foreground">
              גורר...
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Hidden widgets panel
interface HiddenWidgetsPanelProps {
  widgets: WidgetConfig[];
  onShow: (id: string) => void;
}

export function HiddenWidgetsPanel({ widgets, onShow }: HiddenWidgetsPanelProps) {
  const hiddenWidgets = widgets.filter((w) => !w.visible);

  if (hiddenWidgets.length === 0) return null;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
          <EyeOff className="h-4 w-4" />
          ווידג'טים מוסתרים ({hiddenWidgets.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {hiddenWidgets.map((widget) => (
            <Button
              key={widget.id}
              variant="outline"
              size="sm"
              onClick={() => onShow(widget.id)}
              className="gap-2"
            >
              {widget.icon}
              {widget.title}
              <Eye className="h-3 w-3" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to manage widget state
export function useFinanceWidgets(defaultWidgets: WidgetConfig[]) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedData = JSON.parse(saved);
        // Merge saved data with default widgets
        return defaultWidgets.map((dw) => {
          const savedWidget = savedData.find((sw: any) => sw.id === dw.id);
          if (savedWidget) {
            return {
              ...dw,
              size: savedWidget.size || dw.size,
              visible: savedWidget.visible ?? dw.visible,
              order: savedWidget.order ?? dw.order,
            };
          }
          return dw;
        }).sort((a, b) => a.order - b.order);
      } catch {
        return defaultWidgets;
      }
    }
    return defaultWidgets;
  });

  const showWidget = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: true } : w))
    );
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(defaultWidgets);
    localStorage.removeItem(STORAGE_KEY);
  }, [defaultWidgets]);

  return {
    widgets,
    setWidgets,
    showWidget,
    resetLayout,
  };
}

export default FinanceWidgetGrid;
