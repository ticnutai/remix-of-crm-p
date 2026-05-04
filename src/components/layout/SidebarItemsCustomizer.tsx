import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { GripVertical, RotateCcw } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STORAGE_KEY = "sidebar-items-config-v1";

export interface SidebarItemMeta {
  url: string;
  title: string;
  group: "main" | "system";
}

export interface SidebarItemsConfig {
  hidden: Record<string, boolean>;
  order: { main: string[]; system: string[] };
}

const emptyConfig: SidebarItemsConfig = {
  hidden: {},
  order: { main: [], system: [] },
};

export function loadSidebarItemsConfig(): SidebarItemsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyConfig;
    const parsed = JSON.parse(raw) as SidebarItemsConfig;
    return {
      hidden: parsed.hidden || {},
      order: {
        main: parsed.order?.main || [],
        system: parsed.order?.system || [],
      },
    };
  } catch {
    return emptyConfig;
  }
}

function saveConfig(cfg: SidebarItemsConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent("sidebar-items-config-changed"));
}

export function useSidebarItemsConfig() {
  const [config, setConfig] = useState<SidebarItemsConfig>(loadSidebarItemsConfig);

  useEffect(() => {
    const handler = () => setConfig(loadSidebarItemsConfig());
    window.addEventListener("sidebar-items-config-changed", handler);
    return () => window.removeEventListener("sidebar-items-config-changed", handler);
  }, []);

  const isHidden = (url: string) => !!config.hidden[url];

  const orderItems = <T extends { url: string }>(
    items: T[],
    group: "main" | "system",
  ): T[] => {
    const order = config.order[group];
    if (!order || order.length === 0) return items;
    const map = new Map(items.map((i) => [i.url, i]));
    const ordered: T[] = [];
    for (const url of order) {
      const it = map.get(url);
      if (it) {
        ordered.push(it);
        map.delete(url);
      }
    }
    // Append any newcomers not yet in order
    for (const it of map.values()) ordered.push(it);
    return ordered;
  };

  return { config, setConfig, isHidden, orderItems };
}

interface SortableRowProps {
  id: string;
  title: string;
  hidden: boolean;
  onToggle: (next: boolean) => void;
}

function SortableRow({ id, title, hidden, onToggle }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-2 py-2 rounded-md border bg-card"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        aria-label="גרור"
        type="button"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm text-right">{title}</span>
      <Switch checked={!hidden} onCheckedChange={(v) => onToggle(!v)} />
    </div>
  );
}

interface SidebarItemsCustomizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mainItems: SidebarItemMeta[];
  systemItems: SidebarItemMeta[];
}

export function SidebarItemsCustomizerDialog({
  open,
  onOpenChange,
  mainItems,
  systemItems,
}: SidebarItemsCustomizerDialogProps) {
  const [config, setLocalConfig] = useState<SidebarItemsConfig>(loadSidebarItemsConfig);

  useEffect(() => {
    if (open) setLocalConfig(loadSidebarItemsConfig());
  }, [open]);

  const orderedMain = useMemo(() => {
    const order = config.order.main;
    const map = new Map(mainItems.map((i) => [i.url, i]));
    const out: SidebarItemMeta[] = [];
    for (const url of order) {
      const it = map.get(url);
      if (it) {
        out.push(it);
        map.delete(url);
      }
    }
    for (const it of map.values()) out.push(it);
    return out;
  }, [config.order.main, mainItems]);

  const orderedSystem = useMemo(() => {
    const order = config.order.system;
    const map = new Map(systemItems.map((i) => [i.url, i]));
    const out: SidebarItemMeta[] = [];
    for (const url of order) {
      const it = map.get(url);
      if (it) {
        out.push(it);
        map.delete(url);
      }
    }
    for (const it of map.values()) out.push(it);
    return out;
  }, [config.order.system, systemItems]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleToggle = (url: string, hide: boolean) => {
    const next: SidebarItemsConfig = {
      ...config,
      hidden: { ...config.hidden, [url]: hide },
    };
    if (!hide) delete next.hidden[url];
    setLocalConfig(next);
    saveConfig(next);
  };

  const handleDragEnd = (
    group: "main" | "system",
    items: SidebarItemMeta[],
    activeId: string,
    overId: string,
  ) => {
    const ids = items.map((i) => i.url);
    const oldIndex = ids.indexOf(activeId);
    const newIndex = ids.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    const next: SidebarItemsConfig = {
      ...config,
      order: { ...config.order, [group]: newOrder },
    };
    setLocalConfig(next);
    saveConfig(next);
  };

  const handleReset = () => {
    const next = { hidden: {}, order: { main: [], system: [] } };
    setLocalConfig(next);
    saveConfig(next);
  };

  const renderGroup = (
    title: string,
    group: "main" | "system",
    items: SidebarItemMeta[],
  ) => (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => {
          if (e.over && e.active.id !== e.over.id) {
            handleDragEnd(group, items, String(e.active.id), String(e.over.id));
          }
        }}
      >
        <SortableContext items={items.map((i) => i.url)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {items.map((item) => (
              <SortableRow
                key={item.url}
                id={item.url}
                title={item.title}
                hidden={!!config.hidden[item.url]}
                onToggle={(hide) => handleToggle(item.url, hide)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>התאמת תפריט הניווט</DialogTitle>
          <DialogDescription>
            הפעל/בטל פריטים בתפריט הצד וגרור לשינוי הסדר
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-4">
            {renderGroup("ניווט ראשי", "main", orderedMain)}
            <Separator />
            {renderGroup("מערכת", "system", orderedSystem)}
          </div>
        </ScrollArea>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 ml-2" />
            איפוס
          </Button>
          <Button onClick={() => onOpenChange(false)}>סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
