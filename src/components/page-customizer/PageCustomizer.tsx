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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, LayoutTemplate, Settings as SettingsIcon, X, RotateCcw, Power } from "lucide-react";
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!ctl.isOpen) return null;

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

  const toggleSection = (id: string) => {
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
      className="fixed z-50 w-[380px] rounded-xl border bg-background shadow-2xl flex flex-col overflow-hidden"
      dir="rtl"
    >
      {/* Header / drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b bg-muted/50 cursor-move select-none"
        onMouseDown={(e) => {
          dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
          setDragging(true);
        }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={ctl.reset} title="איפוס">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={ctl.closePanel} title="סגור">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue={ctl.initialTab} className="flex flex-col">
        <TabsList className="m-3 mb-0 grid grid-cols-2">
          <TabsTrigger value="layout" className="gap-1.5">
            <LayoutTemplate className="h-4 w-4" />
            פריסה
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5">
            <SettingsIcon className="h-4 w-4" />
            פונקציות
          </TabsTrigger>
        </TabsList>

        {/* ── LAYOUT TAB ── */}
        <TabsContent value="layout" className="m-0">
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs text-muted-foreground">
              לחץ על כפתור ההדלקה כדי להציג/להסתיר חלק. גרור לשינוי סדר.
            </p>
          </div>
          <ScrollArea className="max-h-[55vh]">
            <div className="px-3 pb-3 pt-2 space-y-2">
              {ctl.orderedSections.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  לא הוגדרו חלקים לעמוד זה.
                </div>
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={ctl.config.sectionOrder} strategy={verticalListSortingStrategy}>
                  {ctl.orderedSections.map(s => {
                    const visible = !ctl.config.hiddenSections[s.id];
                    return (
                      <SortableRow
                        key={s.id}
                        id={s.id}
                        label={s.label}
                        description={s.description}
                        active={visible}
                        onToggle={() => toggleSection(s.id)}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── FEATURES TAB ── */}
        <TabsContent value="features" className="m-0">
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs text-muted-foreground">
              לחץ על כפתור ההדלקה כדי להפעיל/לכבות פונקציה.
            </p>
          </div>
          <ScrollArea className="max-h-[55vh]">
            <div className="px-3 pb-3 pt-2 space-y-2">
              {ctl.features.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  לא הוגדרו פונקציות לעמוד זה.
                </div>
              )}
              {ctl.features.map(f => {
                const enabled = !ctl.config.disabledFeatures[f.id];
                return (
                  <PowerRow
                    key={f.id}
                    label={f.label}
                    description={f.description}
                    active={enabled}
                    onToggle={() => toggleFeature(f.id)}
                  />
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="px-3 py-2 border-t bg-muted/30 text-[11px] text-muted-foreground text-center">
        השינויים נשמרים אוטומטית במכשיר זה
      </div>
    </div>
  );
}

/* ── Shared power-row (used in both tabs for features, and via SortableRow for sections) ── */
function PowerRow({
  label, description, active, onToggle,
}: { label: string; description?: string; active: boolean; onToggle: () => void }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-all",
        active ? "bg-green-50 border-green-200" : "bg-muted/30 border-muted/60 opacity-70",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        title={active ? "כבה" : "הפעל"}
        className={cn(
          "shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm",
          active
            ? "bg-green-500 text-white hover:bg-red-500"
            : "bg-muted text-muted-foreground hover:bg-green-500 hover:text-white",
        )}
      >
        <Power className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
          {label}
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
              active ? "bg-green-100 text-green-700" : "bg-muted-foreground/20 text-muted-foreground",
            )}
          >
            {active ? "פעיל" : "כבוי"}
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
        )}
      </div>
    </div>
  );
}

/* ── Sortable row (layout tab) — drag handle + PowerRow ── */
function SortableRow({
  id, label, description, active, onToggle,
}: { id: string; label: string; description?: string; active: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded"
        title="גרור לשינוי סדר"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <PowerRow
          label={label}
          description={description}
          active={active}
          onToggle={onToggle}
        />
      </div>
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
