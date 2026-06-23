// רשימת תבניות הצעות מחיר - תצוגת מובייל אנכית בלבד
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Folder,
  FileText,
  MoreVertical,
  Copy,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuoteTemplate, QuoteTemplateFolder, CATEGORIES } from "../types";

interface Props {
  templates: QuoteTemplate[];
  folders: QuoteTemplateFolder[];
  isLoading: boolean;
  onCreate: () => void;
  onOpen: (t: QuoteTemplate) => void;
  onPreview: (t: QuoteTemplate) => void;
  onDuplicate: (t: QuoteTemplate) => void;
  onDelete: (t: QuoteTemplate) => void;
}

export function MobileTemplatesList({
  templates,
  folders,
  isLoading,
  onCreate,
  onOpen,
  onPreview,
  onDuplicate,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | "all" | "none">(
    "all",
  );

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (activeFolder === "none" && t.folder_id) return false;
      if (activeFolder !== "all" && activeFolder !== "none") {
        if (t.folder_id !== activeFolder) return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    });
  }, [templates, search, activeFolder]);

  const categoryLabel = (v: string) =>
    CATEGORIES.find((c) => c.value === v)?.label || v;

  return (
    <div
      className="flex flex-col gap-4 pb-24 overflow-x-hidden w-full"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-bold text-foreground">
          תבניות הצעות מחיר
        </h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש תבנית..."
            className="pr-10 h-11 bg-card"
          />
        </div>

        {/* Folder chips - horizontal scroll inside container only */}
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max pb-1">
            <FolderChip
              active={activeFolder === "all"}
              onClick={() => setActiveFolder("all")}
              label={`הכל (${templates.length})`}
            />
            <FolderChip
              active={activeFolder === "none"}
              onClick={() => setActiveFolder("none")}
              label="ללא תיקייה"
            />
            {folders.map((f) => (
              <FolderChip
                key={f.id}
                active={activeFolder === f.id}
                onClick={() => setActiveFolder(f.id)}
                label={f.name}
                color={f.color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          טוען תבניות...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            לא נמצאו תבניות
          </p>
          <Button onClick={onCreate} size="sm">
            <Plus className="h-4 w-4 ml-1" />
            צור תבנית חדשה
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3 w-full">
          {filtered.map((t) => {
            const folder = folders.find((f) => f.id === t.folder_id);
            return (
              <Card
                key={t.id}
                className="p-4 active:scale-[0.99] transition-transform cursor-pointer w-full"
                onClick={() => onOpen(t)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${t.design_settings?.primary_color || "#d8ac27"}20`,
                    }}
                  >
                    <FileText
                      className="h-5 w-5"
                      style={{
                        color:
                          t.design_settings?.primary_color || "#d8ac27",
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      {t.name || "ללא שם"}
                    </div>
                    {t.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {t.description}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {categoryLabel(t.category)}
                      </Badge>
                      {folder && (
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1"
                          style={{ borderColor: folder.color }}
                        >
                          <Folder
                            className="h-3 w-3"
                            style={{ color: folder.color }}
                          />
                          {folder.name}
                        </Badge>
                      )}
                      {(t.stages?.length || 0) > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {t.stages.length} שלבים
                        </Badge>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="rtl">
                      <DropdownMenuItem onClick={() => onOpen(t)}>
                        <Pencil className="h-4 w-4 ml-2" /> עריכה
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPreview(t)}>
                        <Eye className="h-4 w-4 ml-2" /> תצוגה מקדימה
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(t)}>
                        <Copy className="h-4 w-4 ml-2" /> שכפול
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(t)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 ml-2" /> מחיקה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <Button
        onClick={onCreate}
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
        aria-label="צור תבנית חדשה"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}

function FolderChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 h-8 rounded-full text-xs font-medium transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border"
      }`}
    >
      {color && !active && (
        <span
          className="inline-block h-2 w-2 rounded-full ml-1.5 align-middle"
          style={{ background: color }}
        />
      )}
      {label}
    </button>
  );
}
