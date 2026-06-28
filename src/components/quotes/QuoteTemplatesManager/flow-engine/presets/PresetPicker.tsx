// בורר ערכת עיצוב: dropdown + כפתורי "ערוך / חדש / מחק".

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Palette, Plus, Pencil, Trash2, Check } from "lucide-react";
import { usePresets } from "./usePresets";
import type { DesignPreset } from "./types";
import PresetEditorDialog from "./PresetEditorDialog";
import { toast } from "sonner";

interface Props {
  selectedId: string | null;
  onSelect: (preset: DesignPreset | null) => void;
}

export default function PresetPicker({ selectedId, onSelect }: Props) {
  const { presets, loading, create, update, remove } = usePresets();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DesignPreset | null>(null);

  const selected = presets.find((p) => p.id === selectedId) || null;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: DesignPreset) => {
    setEditing(p);
    setDialogOpen(true);
  };
  const handleRemove = async (p: DesignPreset) => {
    if (!window.confirm(`למחוק את הערכה "${p.name}"?`)) return;
    try {
      await remove(p.id);
      if (selectedId === p.id) onSelect(null);
      toast.success("נמחק");
    } catch (e: any) {
      toast.error(e?.message || "שגיאה במחיקה");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Palette className="h-3.5 w-3.5" />
            <span className="max-w-[140px] truncate">
              ערכה: {selected?.name || "ברירת מחדל"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rtl">
          <DropdownMenuLabel className="text-xs">ערכות עיצוב</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => onSelect(null)}>
            <div className="flex w-full items-center justify-between">
              <span>ברירת מחדל (ללא ערכה)</span>
              {!selected && <Check className="h-3.5 w-3.5" />}
            </div>
          </DropdownMenuItem>
          {loading ? (
            <DropdownMenuItem disabled>טוען...</DropdownMenuItem>
          ) : (
            presets.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onSelect={(e) => {
                  e.preventDefault();
                  onSelect(p);
                }}
                className="group"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {selectedId === p.id && <Check className="h-3.5 w-3.5" />}
                    <span className="truncate">{p.name}</span>
                    {p.is_builtin && (
                      <span className="rounded bg-muted px-1 text-[10px] text-muted-foreground">
                        מובנה
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded p-1 hover:bg-accent"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        openEdit(p);
                      }}
                      title={p.is_builtin ? "שכפל וערוך" : "ערוך"}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {!p.is_builtin && (
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-destructive/20"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleRemove(p);
                        }}
                        title="מחק"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={openCreate}>
            <Plus className="ml-2 h-3.5 w-3.5" />
            ערכה חדשה
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
