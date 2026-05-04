// PageCustomizer — non-blocking, draggable settings panel.
// - "Layout" tab: drag-and-drop to reorder page sections.
// - "Features" tab: toggle each feature on/off.
// State persists in localStorage under storageKey.
//
// Usage:
//   const { config, isOpen, openPanel, closePanel, isVisible, isEnabled } =
//     usePageCustomizer({ storageKey: "datatable-pro-layout", sections, features });
//
//   <PageToolbar onLayoutClick={openPanel} onSettingsClick={openPanel} />
//   <PageCustomizerPanel ... />
//   {isVisible("kpis") && isEnabled("kpis") && <KpiSection />}
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { GripVertical, LayoutTemplate, Settings as SettingsIcon, X, RotateCcw, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface PageSection {
  id: string;
  label: string;
  description?: string;
}

export interface PageFeature {
  id: string;
  label: string;
  description?: string;
}

export interface PageCustomizerConfig {
  sectionOrder: string[];
  hiddenSections: Record<string, boolean>;
  disabledFeatures: Record<string, boolean>;
}

const DEFAULT_CONFIG: PageCustomizerConfig = {
  sectionOrder: [],
  hiddenSections: {},
  disabledFeatures: {},
};

interface UseOpts {
  storageKey: string;
  sections: PageSection[];
  features: PageFeature[];
}

interface UseRet {
  config: PageCustomizerConfig;
  setConfig: (c: PageCustomizerConfig) => void;
  reset: () => void;
  isVisible: (sectionId: string) => boolean;
  isEnabled: (featureId: string) => boolean;
  orderedSections: PageSection[];
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  initialTab: "layout" | "features";
  setInitialTab: (t: "layout" | "features") => void;
  sections: PageSection[];
  features: PageFeature[];
}

export function usePageCustomizer(opts: UseOpts): UseRet {
  const { storageKey, sections, features } = opts;

  const [config, setConfigState] = useState<PageCustomizerConfig>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PageCustomizerConfig;
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_CONFIG, sectionOrder: sections.map(s => s.id) };
  });

  const [isOpen, setIsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<"layout" | "features">("layout");

  // Make sure newly added sections appear in the order
  useEffect(() => {
    const known = new Set(config.sectionOrder);
    const missing = sections.map(s => s.id).filter(id => !known.has(id));
    if (missing.length > 0) {
      setConfigState(c => ({ ...c, sectionOrder: [...c.sectionOrder, ...missing] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.map(s => s.id).join("|")]);

  const setConfig = useCallback((c: PageCustomizerConfig) => {
    setConfigState(c);
    try { localStorage.setItem(storageKey, JSON.stringify(c)); } catch { /* ignore */ }
  }, [storageKey]);

  const reset = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG, sectionOrder: sections.map(s => s.id) });
  }, [sections, setConfig]);

  const isVisible  = useCallback((id: string) => !config.hiddenSections[id], [config]);
  const isEnabled  = useCallback((id: string) => !config.disabledFeatures[id], [config]);

  const orderedSections = useMemo(() => {
    const map = new Map(sections.map(s => [s.id, s]));
    const out: PageSection[] = [];
    for (const id of config.sectionOrder) {
      const s = map.get(id);
      if (s) out.push(s);
    }
    // append any unknown
    for (const s of sections) {
      if (!config.sectionOrder.includes(s.id)) out.push(s);
    }
    return out;
  }, [sections, config.sectionOrder]);

  const openPanel  = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  return {
    config, setConfig, reset,
    isVisible, isEnabled, orderedSections,
    isOpen, openPanel, closePanel,
    initialTab, setInitialTab,
    sections, features,
  };
}

// =================== UI ===================

interface PanelProps {
  ctl: UseRet;
  title?: string;
}

export function PageCustomizerPanel({ ctl, title = "התאמה אישית של העמוד" }: PanelProps) {
  // Floating non-blocking panel — draggable across the screen.
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = localStorage.getItem("page-customizer-pos");
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { x: window.innerWidth - 440, y: 100 };
  });
  const [dragging, setDragging] = useState(false);
  const dragOffset = React.useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 360, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y)),
      });
    };
    const onUp = () => {
      setDragging(false);
      try { localStorage.setItem("page-customizer-pos", JSON.stringify(pos)); } catch { /* ignore */ }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, pos]);

  if (!ctl.isOpen) return null;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ctl.config.sectionOrder.indexOf(active.id as string);
    const newIndex = ctl.config.sectionOrder.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    ctl.setConfig({
      ...ctl.config,
      sectionOrder: arrayMove(ctl.config.sectionOrder, oldIndex, newIndex),
    });
  };

  const toggleHidden = (id: string) => {
    ctl.setConfig({
      ...ctl.config,
      hiddenSections: { ...ctl.config.hiddenSections, [id]: !ctl.config.hiddenSections[id] },
    });
  };

  const toggleFeature = (id: string) => {
    ctl.setConfig({
      ...ctl.config,
      disabledFeatures: { ...ctl.config.disabledFeatures, [id]: !ctl.config.disabledFeatures[id] },
    });
  };

  return (
    <div
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 w-[380px] max-h-[80vh] rounded-lg border bg-background shadow-2xl flex flex-col"
      dir="rtl"
    >
      {/* Drag handle / header */}
      <div
        className="flex items-center justify-between p-2 border-b cursor-move bg-muted/40 rounded-t-lg select-none"
        onMouseDown={(e) => {
          dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
          setDragging(true);
        }}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={ctl.reset} title="איפוס">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={ctl.closePanel} title="סגור">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue={ctl.initialTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="m-2 grid grid-cols-2">
          <TabsTrigger value="layout"><LayoutTemplate className="h-4 w-4 ml-1" /> פריסה</TabsTrigger>
          <TabsTrigger value="features"><SettingsIcon className="h-4 w-4 ml-1" /> פונקציות</TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-[55vh] p-3">
            <p className="text-xs text-muted-foreground mb-2">
              גרור כדי לשנות את סדר חלקי העמוד. לחץ על העין כדי להסתיר.
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={ctl.config.sectionOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {ctl.orderedSections.map(s => (
                    <SortableRow
                      key={s.id}
                      id={s.id}
                      label={s.label}
                      description={s.description}
                      hidden={!!ctl.config.hiddenSections[s.id]}
                      onToggle={() => toggleHidden(s.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="features" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-[55vh] p-3">
            <p className="text-xs text-muted-foreground mb-2">
              הפעל / כבה פונקציות בעמוד.
            </p>
            <div className="space-y-2">
              {ctl.features.map(f => (
                <div key={f.id} className="flex items-center justify-between border rounded p-2 hover:bg-muted/40">
                  <div className="min-w-0">
                    <Label className="cursor-pointer">{f.label}</Label>
                    {f.description && (
                      <p className="text-xs text-muted-foreground truncate">{f.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={!ctl.config.disabledFeatures[f.id]}
                    onCheckedChange={() => toggleFeature(f.id)}
                  />
                </div>
              ))}
              {ctl.features.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">
                  לא הוגדרו פונקציות לעמוד זה.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Separator />
      <div className="p-2 text-[11px] text-muted-foreground text-center">
        השינויים נשמרים אוטומטית במכשיר זה
      </div>
    </div>
  );
}

function SortableRow({
  id, label, description, hidden, onToggle,
}: { id: string; label: string; description?: string; hidden: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 border rounded p-2 bg-background",
        hidden && "opacity-60",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        title="גרור"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        {description && <div className="text-xs text-muted-foreground truncate">{description}</div>}
      </div>
      <Button variant="ghost" size="sm" onClick={onToggle} title={hidden ? "הצג" : "הסתר"}>
        {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// Convenience toolbar — two icon-buttons.
export function PageCustomizerToolbar({
  ctl, className,
}: { ctl: UseRet; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon"
        title="עורך פריסה"
        onClick={() => { ctl.setInitialTab("layout"); ctl.openPanel(); }}
      >
        <LayoutTemplate className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="הגדרות פונקציות"
        onClick={() => { ctl.setInitialTab("features"); ctl.openPanel(); }}
      >
        <SettingsIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
