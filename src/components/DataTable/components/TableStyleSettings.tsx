// Table Style Settings - הגדרות עיצוב טבלה
import React from "react";
import {
  Settings2,
  TableProperties,
  Rows3,
  Columns3,
  Maximize2,
  Eye,
  EyeOff,
  Palette,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TableStyleConfig, TableDividers, TableHeaderOpacity } from "../types";
import {
  useTableStyleConfig,
  defaultConfig,
} from "../hooks/useTableStyleConfig";

interface TableStyleSettingsProps {
  config?: TableStyleConfig;
  onChange?: (config: TableStyleConfig) => void;
  onReset?: () => void;
  embedded?: boolean;
  className?: string;
  trigger?: React.ReactNode;
}

export function TableStyleSettings({
  config: externalConfig,
  onChange,
  onReset,
  embedded = false,
  className,
  trigger,
}: TableStyleSettingsProps) {
  const internalState = useTableStyleConfig();

  const config = externalConfig ?? internalState.config;
  const updateConfig = onChange
    ? (updates: Partial<TableStyleConfig>) =>
        onChange({ ...config, ...updates })
    : internalState.updateConfig;

  const content = (
    <div className={cn("space-y-6 p-4", className)} dir="rtl">
      {/* Dividers Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <TableProperties className="h-4 w-4" />
          חוצצים ומפרידים
        </Label>

        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "none", label: "ללא", icon: "▢" },
            { value: "horizontal", label: "אופקי", icon: "═" },
            { value: "vertical", label: "אנכי", icon: "║" },
            { value: "both", label: "גריד מלא", icon: "╬" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() =>
                updateConfig({ dividers: option.value as TableDividers })
              }
              className={cn(
                "p-3 rounded-lg border-2 transition-all text-center",
                config.dividers === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted hover:border-primary/50",
              )}
            >
              <div className="text-2xl mb-1">{option.icon}</div>
              <div className="text-sm font-medium">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Header Settings */}
      <div className="space-y-4">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Rows3 className="h-4 w-4" />
          הגדרות כותרת
        </Label>

        <div className="flex items-center justify-between">
          <Label className="text-sm">כותרת דביקה (Sticky)</Label>
          <Switch
            checked={config.headerSticky}
            onCheckedChange={(checked) =>
              updateConfig({ headerSticky: checked })
            }
          />
        </div>

        {config.headerSticky && (
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              {config.headerOpacity === "solid" ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              שקיפות כותרת
            </Label>
            <Select
              value={config.headerOpacity}
              onValueChange={(value) =>
                updateConfig({ headerOpacity: value as TableHeaderOpacity })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">אטום (ללא שקיפות)</SelectItem>
                <SelectItem value="semi">חצי שקוף</SelectItem>
                <SelectItem value="transparent">שקוף</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              כותרת אטומה מבטיחה קריאות מלאה בגלילה
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Spacing Settings */}
      <div className="space-y-4">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Maximize2 className="h-4 w-4" />
          מרווחים
        </Label>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">ריווח בין שורות</Label>
              <span className="text-sm text-muted-foreground">
                {config.rowGap}px
              </span>
            </div>
            <Slider
              value={[config.rowGap]}
              onValueChange={([value]) => updateConfig({ rowGap: value })}
              min={0}
              max={16}
              step={2}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">ריפוד תאים (Padding)</Label>
              <span className="text-sm text-muted-foreground">
                {config.cellPadding}px
              </span>
            </div>
            <Slider
              value={[config.cellPadding]}
              onValueChange={([value]) => updateConfig({ cellPadding: value })}
              min={4}
              max={24}
              step={2}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Style Options */}
      <div className="space-y-4">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Columns3 className="h-4 w-4" />
          אפשרויות נוספות
        </Label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">שורות מפוספסות (Zebra)</Label>
            <Switch
              checked={config.striped}
              onCheckedChange={(checked) => updateConfig({ striped: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">מסגרת חיצונית</Label>
            <Switch
              checked={config.bordered}
              onCheckedChange={(checked) => updateConfig({ bordered: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">מצב קומפקטי</Label>
            <Switch
              checked={config.compact}
              onCheckedChange={(checked) => updateConfig({ compact: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Color Styling */}
      <div className="space-y-4">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Palette className="h-4 w-4" />
          עיצוב צבעים
        </Label>

        {/* Preset Color Themes */}
        <div className="space-y-2">
          <Label className="text-sm">ערכות צבעים מוכנות</Label>
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                name: "ברירת מחדל",
                header: undefined,
                row: undefined,
                alt: undefined,
                accent: undefined,
              },
              {
                name: "זהב יוקרתי",
                header: "#1e3a5f",
                row: "#faf8f5",
                alt: "#f5f0e8",
                accent: "#d4af37",
              },
              {
                name: "כחול מודרני",
                header: "#1e40af",
                row: "#ffffff",
                alt: "#eff6ff",
                accent: "#3b82f6",
              },
              {
                name: "ירוק טבעי",
                header: "#166534",
                row: "#ffffff",
                alt: "#f0fdf4",
                accent: "#22c55e",
              },
              {
                name: "סגול עמוק",
                header: "#581c87",
                row: "#ffffff",
                alt: "#faf5ff",
                accent: "#a855f7",
              },
              {
                name: "אפור אלגנטי",
                header: "#374151",
                row: "#ffffff",
                alt: "#f9fafb",
                accent: "#6b7280",
              },
              {
                name: "כתום חם",
                header: "#9a3412",
                row: "#ffffff",
                alt: "#fff7ed",
                accent: "#f97316",
              },
              {
                name: "ורוד עדין",
                header: "#9d174d",
                row: "#ffffff",
                alt: "#fdf2f8",
                accent: "#ec4899",
              },
            ].map((theme, idx) => (
              <button
                key={idx}
                onClick={() =>
                  updateConfig({
                    headerBgColor: theme.header,
                    rowBgColor: theme.row,
                    rowAltBgColor: theme.alt,
                    accentColor: theme.accent,
                  })
                }
                className={cn(
                  "p-2 rounded-lg border-2 transition-all text-center text-[10px]",
                  config.headerBgColor === theme.header &&
                    config.accentColor === theme.accent
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-muted hover:border-primary/50",
                )}
                title={theme.name}
              >
                <div className="flex flex-col gap-0.5">
                  <div
                    className="h-2 rounded-sm"
                    style={{
                      backgroundColor: theme.header || "hsl(var(--muted))",
                    }}
                  />
                  <div
                    className="h-1.5 rounded-sm"
                    style={{
                      backgroundColor: theme.row || "hsl(var(--background))",
                    }}
                  />
                  <div
                    className="h-1.5 rounded-sm"
                    style={{
                      backgroundColor: theme.alt || "hsl(var(--muted)/0.3)",
                    }}
                  />
                </div>
                <span className="mt-1 block truncate">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="space-y-3 pt-2">
          <Label className="text-sm font-medium">צבעים מותאמים אישית</Label>

          <div className="grid grid-cols-2 gap-3">
            {/* Header Background */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">רקע כותרת</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.headerBgColor || "#1e3a5f"}
                  onChange={(e) =>
                    updateConfig({ headerBgColor: e.target.value })
                  }
                  className="w-10 h-8 p-0.5 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config.headerBgColor || ""}
                  onChange={(e) =>
                    updateConfig({ headerBgColor: e.target.value || undefined })
                  }
                  placeholder="ברירת מחדל"
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>

            {/* Header Text */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                טקסט כותרת
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.headerTextColor || "#ffffff"}
                  onChange={(e) =>
                    updateConfig({ headerTextColor: e.target.value })
                  }
                  className="w-10 h-8 p-0.5 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config.headerTextColor || ""}
                  onChange={(e) =>
                    updateConfig({
                      headerTextColor: e.target.value || undefined,
                    })
                  }
                  placeholder="ברירת מחדל"
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>

            {/* Row Background */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">רקע שורה</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.rowBgColor || "#ffffff"}
                  onChange={(e) => updateConfig({ rowBgColor: e.target.value })}
                  className="w-10 h-8 p-0.5 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config.rowBgColor || ""}
                  onChange={(e) =>
                    updateConfig({ rowBgColor: e.target.value || undefined })
                  }
                  placeholder="ברירת מחדל"
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>

            {/* Alternating Row */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                שורה חלופית
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.rowAltBgColor || "#f5f5f5"}
                  onChange={(e) =>
                    updateConfig({ rowAltBgColor: e.target.value })
                  }
                  className="w-10 h-8 p-0.5 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config.rowAltBgColor || ""}
                  onChange={(e) =>
                    updateConfig({ rowAltBgColor: e.target.value || undefined })
                  }
                  placeholder="ברירת מחדל"
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>

            {/* Divider Color */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                צבע חוצצים
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.dividerColor || "#e5e7eb"}
                  onChange={(e) =>
                    updateConfig({ dividerColor: e.target.value })
                  }
                  className="w-10 h-8 p-0.5 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config.dividerColor || ""}
                  onChange={(e) =>
                    updateConfig({ dividerColor: e.target.value || undefined })
                  }
                  placeholder="ברירת מחדל"
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">צבע הדגשה</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.accentColor || "#d4af37"}
                  onChange={(e) =>
                    updateConfig({ accentColor: e.target.value })
                  }
                  className="w-10 h-8 p-0.5 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config.accentColor || ""}
                  onChange={(e) =>
                    updateConfig({ accentColor: e.target.value || undefined })
                  }
                  placeholder="ברירת מחדל"
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (onReset) {
            onReset();
          } else if (onChange) {
            onChange(defaultConfig);
          } else {
            internalState.resetConfig();
          }
        }}
        className="w-full"
      >
        איפוס לברירת מחדל
      </Button>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Settings2 className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="text-right">הגדרות עיצוב טבלה</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
