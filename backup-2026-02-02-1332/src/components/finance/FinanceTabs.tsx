import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { 
  GripVertical, 
  Settings2, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface FinanceWidget {
  id: string;
  name: string;
  icon: React.ReactNode;
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large' | 'full';
  collapsed: boolean;
  tabId: string;
}

export interface FinanceTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  widgets: string[]; // Widget IDs
}

interface SortableWidgetProps {
  widget: FinanceWidget;
  children: React.ReactNode;
  onToggleCollapse: (id: string) => void;
  onToggleSize: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  isEditMode: boolean;
}

// Sortable Widget Component
function SortableWidget({ 
  widget, 
  children, 
  onToggleCollapse, 
  onToggleSize,
  onToggleVisibility,
  isEditMode 
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 lg:col-span-2',
    large: 'col-span-1 lg:col-span-2 xl:col-span-3',
    full: 'col-span-full',
  };

  if (!widget.visible && !isEditMode) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        sizeClasses[widget.size],
        'relative group',
        isDragging && 'z-50',
        !widget.visible && 'opacity-50'
      )}
    >
      <Card className={cn(
        'h-full transition-all duration-200',
        isEditMode && 'ring-2 ring-primary/20 ring-dashed hover:ring-primary/40',
        widget.collapsed && 'h-auto'
      )}>
        {/* Widget Header with Controls */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditMode && (
                <button
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <div className="flex items-center gap-2">
                {widget.icon}
                <CardTitle className="text-sm font-medium">{widget.name}</CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isEditMode && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onToggleVisibility(widget.id)}
                  >
                    {widget.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onToggleSize(widget.id)}
                  >
                    {widget.size === 'full' ? (
                      <Minimize2 className="h-3 w-3" />
                    ) : (
                      <Maximize2 className="h-3 w-3" />
                    )}
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onToggleCollapse(widget.id)}
              >
                {widget.collapsed ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronUp className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Widget Content */}
        {!widget.collapsed && (
          <CardContent className="pt-0">
            {children}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Props for FinanceTabs
interface FinanceTabsProps {
  tabs: FinanceTab[];
  widgets: FinanceWidget[];
  onWidgetsChange: (widgets: FinanceWidget[]) => void;
  renderWidget: (widgetId: string) => React.ReactNode;
  defaultTab?: string;
}

const STORAGE_KEY = 'finance-tabs-layout';

export function FinanceTabs({ 
  tabs, 
  widgets, 
  onWidgetsChange, 
  renderWidget,
  defaultTab 
}: FinanceTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Load saved layout
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedWidgets = JSON.parse(saved);
        // Merge with current widgets
        const merged = widgets.map(w => {
          const saved = savedWidgets.find((s: FinanceWidget) => s.id === w.id);
          return saved ? { ...w, ...saved } : w;
        });
        onWidgetsChange(merged);
      } catch (e) {
        console.error('Failed to load layout:', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save layout
  const saveLayout = (newWidgets: FinanceWidget[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
    onWidgetsChange(newWidgets);
  };

  // Get widgets for current tab
  const currentTabWidgets = widgets
    .filter(w => w.tabId === activeTab)
    .sort((a, b) => a.order - b.order);

  // Handle drag events
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = currentTabWidgets.findIndex(w => w.id === active.id);
      const newIndex = currentTabWidgets.findIndex(w => w.id === over.id);
      
      const reordered = arrayMove(currentTabWidgets, oldIndex, newIndex);
      const updated = widgets.map(w => {
        const reorderedWidget = reordered.find(r => r.id === w.id);
        if (reorderedWidget) {
          return { ...w, order: reordered.indexOf(reorderedWidget) };
        }
        return w;
      });
      
      saveLayout(updated);
    }
  };

  // Toggle functions
  const toggleCollapse = (id: string) => {
    const updated = widgets.map(w => 
      w.id === id ? { ...w, collapsed: !w.collapsed } : w
    );
    saveLayout(updated);
  };

  const toggleSize = (id: string) => {
    const sizes: FinanceWidget['size'][] = ['small', 'medium', 'large', 'full'];
    const updated = widgets.map(w => {
      if (w.id === id) {
        const currentIndex = sizes.indexOf(w.size);
        const nextIndex = (currentIndex + 1) % sizes.length;
        return { ...w, size: sizes[nextIndex] };
      }
      return w;
    });
    saveLayout(updated);
  };

  const toggleVisibility = (id: string) => {
    const updated = widgets.map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    saveLayout(updated);
  };

  const activeWidget = widgets.find(w => w.id === activeId);

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between">
        <ScrollArea className="w-full max-w-[calc(100%-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="h-12 bg-muted/50 p-1 inline-flex gap-1">
              {tabs.map(tab => {
                const tabWidgetCount = widgets.filter(w => w.tabId === tab.id && w.visible).length;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      'h-10 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm',
                      'flex items-center gap-2 transition-all'
                    )}
                  >
                    {tab.icon}
                    <span>{tab.name}</span>
                    {tabWidgetCount > 0 && (
                      <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {tabWidgetCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            {isEditMode ? 'סיום עריכה' : 'ערוך פריסה'}
          </Button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-primary" />
          <div className="text-sm">
            <span className="font-medium">מצב עריכה פעיל</span>
            <span className="text-muted-foreground mr-2">
              - גרור ווידג'טים לשינוי סדר, לחץ על הכפתורים לשינוי גודל או הסתרה
            </span>
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={currentTabWidgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className={cn(
            'gap-4',
            viewMode === 'grid' 
              ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' 
              : 'flex flex-col'
          )}>
            {currentTabWidgets.map(widget => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onToggleCollapse={toggleCollapse}
                onToggleSize={toggleSize}
                onToggleVisibility={toggleVisibility}
                isEditMode={isEditMode}
              >
                {renderWidget(widget.id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget ? (
            <Card className="opacity-90 shadow-2xl ring-2 ring-primary">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  {activeWidget.icon}
                  <CardTitle className="text-sm font-medium">{activeWidget.name}</CardTitle>
                </div>
              </CardHeader>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {currentTabWidgets.filter(w => w.visible || isEditMode).length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium mb-2">אין ווידג'טים בטאב זה</p>
            <p className="text-sm">לחץ על "ערוך פריסה" כדי להוסיף ווידג'טים</p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default FinanceTabs;
