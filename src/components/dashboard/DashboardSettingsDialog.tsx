// Dashboard Settings Floating Panel - Non-modal, draggable, resizable
// tenarch CRM Pro - Rebuilt for clarity and functionality
import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Palette,
  LayoutGrid,
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  GripVertical,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Table,
  PieChart,
  Settings2,
  Maximize2,
  Grid3X3,
  ArrowUpDown,
  Cloud,
  MoveHorizontal,
  MoveVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDashboardTheme,
  dashboardThemes,
  DashboardTheme,
} from "./DashboardThemeProvider";
import {
  useWidgetLayout,
  WidgetSize,
  SIZE_LABELS,
  GridGap,
} from "./WidgetLayoutManager";
import { useToast } from "@/hooks/use-toast";

interface DashboardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// CONSTANTS
// ============================================

type WidgetCategory = "stats" | "charts" | "tables" | "other";

const WIDGET_CATEGORIES: Record<string, WidgetCategory> = {
  "stats-clients": "stats",
  "stats-projects": "stats",
  "stats-revenue": "stats",
  "stats-hours": "stats",
  "dynamic-stats": "stats",
  "chart-revenue": "charts",
  "chart-projects": "charts",
  "chart-hours": "charts",
  "table-hours": "tables",
  "table-clients": "tables",
  "table-vip": "tables",
  "features-info": "other",
};

const CATEGORY_INFO: Record<
  WidgetCategory,
  { name: string; icon: React.ReactNode }
> = {
  stats: { name: "סטטיסטיקות", icon: <BarChart3 className="h-4 w-4" /> },
  charts: { name: "גרפים", icon: <PieChart className="h-4 w-4" /> },
  tables: { name: "טבלאות", icon: <Table className="h-4 w-4" /> },
  other: { name: "אחר", icon: <Sparkles className="h-4 w-4" /> },
};

const SIZE_OPTIONS: { value: WidgetSize; label: string; width: string }[] = [
  { value: "small", label: "קטן", width: "25%" },
  { value: "medium", label: "בינוני", width: "50%" },
  { value: "large", label: "גדול", width: "75%" },
  { value: "full", label: "מלא", width: "100%" },
];

const GAP_OPTIONS: { value: GridGap; label: string; size: string }[] = [
  { value: "tight", label: "צפוף", size: "8px" },
  { value: "normal", label: "רגיל", size: "16px" },
  { value: "wide", label: "רחב", size: "24px" },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function DashboardSettingsDialog({
  open,
  onOpenChange,
}: DashboardSettingsDialogProps) {
  const { currentTheme, setTheme, themeConfig } = useDashboardTheme();
  const {
    layouts: widgets,
    toggleVisibility,
    resetAll,
    moveWidget,
    setSize,
    autoArrangeWidgets,
    gridGap,
    setGridGap,
    gapX,
    gapY,
    setGapX,
    setGapY,
    equalizeHeights,
    setEqualizeHeights,
    autoExpand,
    setAutoExpand,
    setDashboardTheme,
    isSaving,
  } = useWidgetLayout();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("layout");

  // Floating panel state (draggable + resizable, persisted)
  const POS_KEY = "dashboard-settings-panel-pos";
  const SIZE_KEY = "dashboard-settings-panel-size";
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(POS_KEY) : null;
      if (raw) return JSON.parse(raw);
    } catch {}
    if (typeof window === "undefined") return { x: 80, y: 80 };
    return { x: Math.max(20, window.innerWidth - 760), y: 80 };
  });
  const [size, setSize] = useState<{ w: number; h: number }>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(SIZE_KEY) : null;
      if (raw) return JSON.parse(raw);
    } catch {}
    return { w: 720, h: 640 };
  });
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    try { window.localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch {}
  }, [open, pos]);
  useEffect(() => {
    if (!open) return;
    try { window.localStorage.setItem(SIZE_KEY, JSON.stringify(size)); } catch {}
  }, [open, size]);

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, [role='tab']")) return;
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const nx = Math.max(0, Math.min(window.innerWidth - 100, ev.clientX - dragRef.current.dx));
      const ny = Math.max(0, Math.min(window.innerHeight - 60, ev.clientY - dragRef.current.dy));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startResize = (corner: "se" | "sw" | "ne" | "nw") => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const start = { sx: e.clientX, sy: e.clientY, sw: size.w, sh: size.h, px: pos.x, py: pos.y };
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - start.sx;
      const dy = ev.clientY - start.sy;
      let nw = start.sw;
      let nh = start.sh;
      let nx = start.px;
      let ny = start.py;
      if (corner === "se") { nw = start.sw + dx; nh = start.sh + dy; }
      if (corner === "sw") { nw = start.sw - dx; nh = start.sh + dy; nx = start.px + dx; }
      if (corner === "ne") { nw = start.sw + dx; nh = start.sh - dy; ny = start.py + dy; }
      if (corner === "nw") { nw = start.sw - dx; nh = start.sh - dy; nx = start.px + dx; ny = start.py + dy; }
      nw = Math.max(380, Math.min(window.innerWidth - 20, nw));
      nh = Math.max(360, Math.min(window.innerHeight - 20, nh));
      setSize({ w: nw, h: nh });
      setPos({ x: Math.max(0, nx), y: Math.max(0, ny) });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Memoized sorted widgets
  const sortedWidgets = useMemo(
    () => [...widgets].sort((a, b) => a.order - b.order),
    [widgets],
  );

  // Memoized widgets grouped by category
  const widgetsByCategory = useMemo(() => {
    const groups: Record<WidgetCategory, typeof sortedWidgets> = {
      stats: [],
      charts: [],
      tables: [],
      other: [],
    };
    sortedWidgets.forEach((widget) => {
      const category = WIDGET_CATEGORIES[widget.id] || "other";
      groups[category].push(widget);
    });
    return groups;
  }, [sortedWidgets]);

  // Handlers
  const handleThemeChange = (theme: DashboardTheme) => {
    setTheme(theme);
    setDashboardTheme(theme);
    toast({
      title: "🎨 ערכת נושא שונתה",
      description: `עברת לערכת "${dashboardThemes[theme].name}"`,
    });
  };

  const handleReset = () => {
    resetAll();
    toast({
      title: "🔄 ההגדרות אופסו",
      description: "כל ההגדרות חזרו לברירת המחדל",
    });
  };

  const handleAutoArrange = () => {
    autoArrangeWidgets();
    toast({
      title: "✨ סידור אוטומטי",
      description: "הווידג'טים סודרו בצורה אופטימלית",
    });
  };

  // Avoid all work when closed (no wasted renders / effects)
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-[60] bg-white border border-[#D4AF37] shadow-2xl rounded-xl flex flex-col overflow-hidden pointer-events-auto"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      dir="rtl"
    >
      {/* ======== HEADER (drag handle) ======== */}
      <div
        onMouseDown={onHeaderMouseDown}
        className="px-4 py-2 border-b bg-gradient-to-l from-muted/50 to-background cursor-move select-none"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Settings2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">הגדרות דשבורד</h2>
              <p className="text-[11px] text-muted-foreground leading-tight">תצוגה מקדימה חיה — גרור / מתח גדל</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isSaving ? "outline" : "secondary"} className="gap-1.5 px-2 py-0.5 text-[10px]">
              <Cloud className={cn("h-3 w-3", isSaving && "animate-pulse")} />
              {isSaving ? "שומר..." : "מסונכרן"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)} title="סגור">
              <span className="text-lg leading-none">×</span>
            </Button>
          </div>
        </div>
      </div>

        {/* ======== TABS ======== */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="px-3 pt-2">
            <TabsList className="grid w-full grid-cols-3 h-10 p-1 bg-muted/50">
              <TabsTrigger
                value="layout"
                className="gap-1.5 text-xs h-8 data-[state=active]:shadow-md"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="font-medium">פריסה ומרווחים</span>
              </TabsTrigger>
              <TabsTrigger
                value="widgets"
                className="gap-1.5 text-xs h-8 data-[state=active]:shadow-md"
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="font-medium">ווידג'טים</span>
              </TabsTrigger>
              <TabsTrigger
                value="themes"
                className="gap-1.5 text-xs h-8 data-[state=active]:shadow-md"
              >
                <Palette className="h-4 w-4" />
                <span className="font-medium">ערכות נושא</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ======== LAYOUT TAB ======== */}
          <TabsContent
            value="layout"
            className="mt-0 flex-1 px-3 py-3 overflow-y-auto"
            dir="rtl"
          >
            <div className="grid gap-8">
              {/* Grid Gap Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Grid3X3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      מרווחים בין ווידג'טים
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      התאם את הריווחים בין הרכיבים
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Horizontal Gap Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MoveHorizontal className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">
                          מרווח אופקי
                        </Label>
                      </div>
                      <Badge
                        variant="secondary"
                        className="min-w-[60px] justify-center"
                      >
                        {gapX}px
                      </Badge>
                    </div>
                    <Slider
                      value={[gapX]}
                      onValueChange={(value) => setGapX(value[0])}
                      min={0}
                      max={48}
                      step={4}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>צפוף</span>
                      <span>רווח</span>
                    </div>
                  </div>

                  {/* Vertical Gap Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MoveVertical className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">
                          מרווח אנכי
                        </Label>
                      </div>
                      <Badge
                        variant="secondary"
                        className="min-w-[60px] justify-center"
                      >
                        {gapY}px
                      </Badge>
                    </div>
                    <Slider
                      value={[gapY]}
                      onValueChange={(value) => setGapY(value[0])}
                      min={0}
                      max={48}
                      step={4}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>צפוף</span>
                      <span>רווח</span>
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      הגדרות מוכנות:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {GAP_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            const gapValue =
                              option.value === "tight"
                                ? 8
                                : option.value === "normal"
                                  ? 16
                                  : 24;
                            setGapX(gapValue);
                            setGapY(gapValue);
                            setGridGap(option.value);
                          }}
                          className={cn(
                            "relative p-3 rounded-xl border text-center transition-all duration-200",
                            "hover:border-primary/50 hover:shadow-sm",
                            gridGap === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card",
                          )}
                        >
                          <div className="text-sm font-medium">
                            {option.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {option.size}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Layout Behavior Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Maximize2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">התנהגות פריסה</h3>
                    <p className="text-sm text-muted-foreground">
                      הגדר כיצד הווידג'טים מתארגנים
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <Label
                        htmlFor="equalize"
                        className="text-base font-medium cursor-pointer"
                      >
                        השווה גבהים אוטומטית
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        כל הווידג'טים באותה שורה יהיו בגובה זהה
                      </p>
                    </div>
                    <Switch
                      id="equalize"
                      checked={equalizeHeights}
                      onCheckedChange={setEqualizeHeights}
                      className="scale-125"
                    />
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <Label
                        htmlFor="expand"
                        className="text-base font-medium cursor-pointer"
                      >
                        הרחבה אוטומטית לשטח ריק
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        הווידג'ט האחרון בשורה יתרחב למילוי הרוחב
                      </p>
                    </div>
                    <Switch
                      id="expand"
                      checked={autoExpand}
                      onCheckedChange={setAutoExpand}
                      className="scale-125"
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* Quick Actions Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">פעולות מהירות</h3>
                    <p className="text-sm text-muted-foreground">
                      כלים לניהול מהיר של הדשבורד
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleAutoArrange}
                    className="h-16 gap-3 text-base hover:bg-primary/5 hover:border-primary/50"
                  >
                    <ArrowUpDown className="h-5 w-5" />
                    סידור אוטומטי חכם
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="h-16 gap-3 text-base text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/50"
                  >
                    <RotateCcw className="h-5 w-5" />
                    איפוס לברירת מחדל
                  </Button>
                </div>
              </section>
            </div>
          </TabsContent>

          {/* ======== WIDGETS TAB ======== */}
          <TabsContent
            value="widgets"
            className="mt-0 flex-1 px-3 py-3 overflow-y-auto"
            dir="rtl"
          >
            <div className="space-y-8">
              {(Object.keys(widgetsByCategory) as WidgetCategory[]).map(
                (category) => {
                  const categoryWidgets = widgetsByCategory[category];
                  if (categoryWidgets.length === 0) return null;
                  const { name, icon } = CATEGORY_INFO[category];

                  return (
                    <section key={category}>
                      {/* Category Header */}
                      <div className="flex items-center gap-3 mb-4" dir="rtl">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {icon}
                        </div>
                        <h3 className="font-semibold text-lg">{name}</h3>
                        <Badge variant="secondary" className="text-sm">
                          {categoryWidgets.length} ווידג'טים
                        </Badge>
                      </div>

                      {/* Widgets Grid */}
                      <div className="space-y-3">
                        {categoryWidgets.map((widget) => (
                          <div
                            key={widget.id}
                            className={cn(
                              "flex items-center gap-5 p-5 rounded-2xl border-2 bg-card transition-all",
                              "hover:shadow-md hover:border-primary/30",
                              !widget.visible &&
                                "opacity-50 bg-muted/20 border-dashed",
                            )}
                          >
                            {/* Drag Handle */}
                            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
                              <GripVertical className="h-6 w-6" />
                            </div>

                            {/* Widget Info */}
                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  "font-semibold text-base",
                                  !widget.visible &&
                                    "line-through text-muted-foreground",
                                )}
                              >
                                {widget.name}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                <span>מיקום: {widget.order}</span>
                                <span>•</span>
                                <span>{SIZE_LABELS[widget.size]}</span>
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-3">
                              {/* Move Buttons */}
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-primary/10"
                                  onClick={() => moveWidget(widget.id, "up")}
                                  disabled={widget.order === 1}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-primary/10"
                                  onClick={() => moveWidget(widget.id, "down")}
                                  disabled={widget.order === widgets.length}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Size Select */}
                              <Select
                                value={widget.size}
                                onValueChange={(value) =>
                                  setSize(widget.id, value as WidgetSize)
                                }
                              >
                                <SelectTrigger className="w-[110px] h-10 font-medium">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SIZE_OPTIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={opt.value}
                                    >
                                      {opt.label} ({opt.width})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* Visibility Toggle */}
                              <Button
                                variant={widget.visible ? "default" : "outline"}
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => toggleVisibility(widget.id)}
                              >
                                {widget.visible ? (
                                  <Eye className="h-5 w-5" />
                                ) : (
                                  <EyeOff className="h-5 w-5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                },
              )}
            </div>
          </TabsContent>

          {/* ======== THEMES TAB ======== */}
          <TabsContent
            value="themes"
            className="mt-0 flex-1 px-3 py-3 overflow-y-auto"
            dir="rtl"
          >
            {/* Current Theme Card */}
            <Card className="mb-8 border-2 border-primary/50 bg-gradient-to-l from-primary/5 to-background">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>ערכת נושא פעילה</CardTitle>
                    <CardDescription>הערכה הנוכחית בשימוש</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{themeConfig.name}</div>
                    <div className="text-muted-foreground mt-1">
                      {themeConfig.description}
                    </div>
                    <div className="flex gap-2 mt-4">
                      {themeConfig.effects.glow && <Badge>✨ זוהר</Badge>}
                      {themeConfig.effects.reflection && (
                        <Badge>🪞 השתקפות</Badge>
                      )}
                      {themeConfig.effects.gradient && (
                        <Badge>🎨 גרדיאנט</Badge>
                      )}
                      <Badge variant="outline">
                        פינות: {themeConfig.effects.roundedCorners}
                      </Badge>
                    </div>
                  </div>
                  <div
                    className="w-24 h-24 rounded-2xl border-2 shadow-lg"
                    style={{
                      background: themeConfig.colors.background,
                      borderColor: themeConfig.colors.border,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Themes Grid */}
            <div className="grid grid-cols-2 gap-5">
              {(Object.keys(dashboardThemes) as DashboardTheme[]).map(
                (themeKey) => {
                  const theme = dashboardThemes[themeKey];
                  const isActive = currentTheme === themeKey;

                  return (
                    <button
                      key={themeKey}
                      onClick={() => handleThemeChange(themeKey)}
                      className={cn(
                        "relative p-5 rounded-2xl border-2 text-right transition-all duration-200",
                        "hover:shadow-xl hover:scale-[1.02]",
                        isActive
                          ? "border-primary ring-4 ring-primary/20 shadow-lg"
                          : "border-border hover:border-primary/50",
                      )}
                      style={{ background: theme.colors.background }}
                    >
                      {/* Selection Indicator */}
                      {isActive && (
                        <div className="absolute top-4 left-4">
                          <div
                            className="p-1.5 rounded-full"
                            style={{ backgroundColor: theme.colors.accent }}
                          >
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Mini Preview */}
                      <div className="space-y-2 mb-4">
                        <div
                          className="h-4 rounded-md"
                          style={{
                            backgroundColor: theme.colors.headerBackground,
                          }}
                        />
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="flex-1 h-5 rounded-md"
                              style={{
                                backgroundColor: theme.colors.statCardBg,
                                border: `1px solid ${theme.colors.border}`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <div
                            className="flex-1 h-10 rounded-md"
                            style={{ backgroundColor: theme.colors.chartBg }}
                          />
                          <div
                            className="flex-1 h-10 rounded-md"
                            style={{ backgroundColor: theme.colors.chartBg }}
                          />
                        </div>
                      </div>

                      {/* Theme Info */}
                      <div className="space-y-1">
                        <div
                          className="text-lg font-bold"
                          style={{ color: theme.colors.text }}
                        >
                          {theme.name}
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: theme.colors.textMuted }}
                        >
                          {theme.description}
                        </div>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ======== FOOTER ======== */}
        <div className="px-3 py-2 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            💾 ההגדרות נשמרות אוטומטית ומסונכרנות
          </p>
          <Button
            onClick={() => onOpenChange(false)}
            size="sm"
            className="px-4"
          >
            סיום
          </Button>
        </div>

        {/* Resize handles (4 corners) */}
        <div onMouseDown={startResize("se")} className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize" title="גרור לשינוי גודל" />
        <div onMouseDown={startResize("sw")} className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize" title="גרור לשינוי גודל" />
        <div onMouseDown={startResize("ne")} className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize" title="גרור לשינוי גודל" />
        <div onMouseDown={startResize("nw")} className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize" title="גרור לשינוי גודל" />
      </div>,
    document.body,
  );
}
