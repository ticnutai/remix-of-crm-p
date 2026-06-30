// בורר ערכות עיצוב בתצוגה גלויה (לא תפריט נפתח) —
// מציג רשימה של כרטיסיות עם תצוגה מקדימה מיניאטורית,
// ומאפשר: בחירה, יצירת ערכה חדשה, עריכה, שכפול ומחיקה.
// כשנפתח דיאלוג העריכה / יצירה — סוגרים קודם את ה-Popover שעוטף אותנו
// כדי שהדיאלוג יופיע מקדימה ולא יוסתר מאחוריו.

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Copy, Check } from "lucide-react";
import { usePresets } from "./usePresets";
import type { DesignPreset } from "./types";
import PresetEditorDialog from "./PresetEditorDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  selectedId: string | null;
  onSelect: (preset: DesignPreset | null) => void;
  /** נקרא לפני פתיחת דיאלוג כדי לסגור Popover/Dropdown שעוטפים אותנו. */
  onBeforeOpenDialog?: () => void;
}

export default function PresetPicker({ selectedId, onSelect, onBeforeOpenDialog }: Props) {
  const { presets, loading, create, update, remove } = usePresets();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DesignPreset | null>(null);

  const openDialog = (p: DesignPreset | null) => {
    setEditing(p);
    onBeforeOpenDialog?.();
    // delay slightly so the parent popover can unmount before the dialog opens
    setTimeout(() => setDialogOpen(true), 30);
  };

  const handleRemove = async (e: React.MouseEvent, p: DesignPreset) => {
    e.stopPropagation();
    if (!window.confirm(`למחוק את הערכה "${p.name}"?`)) return;
    try {
      await remove(p.id);
      if (selectedId === p.id) onSelect(null);
      toast.success("נמחק");
    } catch (err: any) {
      toast.error(err?.message || "שגיאה במחיקה");
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">בחר ערכה</span>
          <Button
            type="button"
            size="sm"
            variant="default"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => openDialog(null)}
          >
            <Plus className="h-3 w-3" />
            חדשה
          </Button>
        </div>

        <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
          {/* ברירת מחדל */}
          <PresetCard
            label="ברירת מחדל (ללא ערכה)"
            badge={null}
            selected={!selectedId}
            onClick={() => onSelect(null)}
          />

          {loading && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">טוען...</div>
          )}

          {!loading &&
            presets.map((p) => (
              <PresetCard
                key={p.id}
                label={p.name}
                badge={p.is_builtin ? "מובנה" : null}
                selected={selectedId === p.id}
                onClick={() => onSelect(p)}
                actions={
                  <>
                    <IconBtn
                      title={p.is_builtin ? "שכפל וערוך" : "ערוך"}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDialog(p);
                      }}
                    >
                      {p.is_builtin ? <Copy className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                    </IconBtn>
                    {!p.is_builtin && (
                      <IconBtn
                        title="מחק"
                        variant="danger"
                        onClick={(e) => handleRemove(e, p)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </IconBtn>
                    )}
                  </>
                }
              />
            ))}
        </div>
      </div>

      <PresetEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        preset={editing}
        onSave={async (name, config, mode) => {
          if (mode === "update" && editing) {
            await update(editing.id, { name, config });
          } else {
            const created = await create(name, config);
            onSelect(created);
          }
        }}
      />
    </>
  );
}

function PresetCard({
  label,
  badge,
  selected,
  onClick,
  actions,
}: {
  label: string;
  badge: string | null;
  selected: boolean;
  onClick: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-right transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:bg-accent/40",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
          )}
        >
          {selected && <Check className="h-2.5 w-2.5" />}
        </span>
        <span className="truncate text-xs font-medium">{label}</span>
        {badge && (
          <span className="rounded bg-muted px-1 text-[10px] text-muted-foreground">{badge}</span>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {actions}
        </div>
      )}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  variant,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  variant?: "danger";
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      title={title}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(e as any);
        }
      }}
      className={cn(
        "rounded p-1 transition-colors",
        variant === "danger" ? "hover:bg-destructive/20" : "hover:bg-accent",
      )}
    >
      {children}
    </span>
  );
}
