// Dashboard Settings Dialog - Professional Widget & Theme Management
// e-control CRM Pro - Rebuilt for clarity and functionality
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardTheme, dashboardThemes, DashboardTheme } from './DashboardThemeProvider';
import { useWidgetLayout, WidgetSize, SIZE_LABELS, GridGap } from './WidgetLayoutManager';
import { useToast } from '@/hooks/use-toast';

interface DashboardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// CONSTANTS
// ============================================

type WidgetCategory = 'stats' | 'charts' | 'tables' | 'other';

const WIDGET_CATEGORIES: Record<string, WidgetCategory> = {
  'stats-clients': 'stats',
  'stats-projects': 'stats',
  'stats-revenue': 'stats',
  'stats-hours': 'stats',
  'dynamic-stats': 'stats',
  'chart-revenue': 'charts',
  'chart-projects': 'charts',
  'chart-hours': 'charts',
  'table-hours': 'tables',
  'table-clients': 'tables',
  'table-vip': 'tables',
  'features-info': 'other',
};

const CATEGORY_INFO: Record<WidgetCategory, { name: string; icon: React.ReactNode }> = {
  stats: { name: 'סטטיסטיקות', icon: <BarChart3 className="h-4 w-4" /> },
  charts: { name: 'גרפים', icon: <PieChart className="h-4 w-4" /> },
  tables: { name: 'טבלאות', icon: <Table className="h-4 w-4" /> },
  other: { name: 'אחר', icon: <Sparkles className="h-4 w-4" /> },
};

const SIZE_OPTIONS: { value: WidgetSize; label: string; width: string }[] = [
  { value: 'small', label: 'קטן', width: '25%' },
  { value: 'medium', label: 'בינוני', width: '50%' },
  { value: 'large', label: 'גדול', width: '75%' },
  { value: 'full', label: 'מלא', width: '100%' },
];

const GAP_OPTIONS: { value: GridGap; label: string; size: string }[] = [
  { value: 'tight', label: 'צפוף', size: '8px' },
  { value: 'normal', label: 'רגיל', size: '16px' },
  { value: 'wide', label: 'רחב', size: '24px' },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function DashboardSettingsDialog({ open, onOpenChange }: DashboardSettingsDialogProps) {
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
    equalizeHeights,
    setEqualizeHeights,
    autoExpand,
    setAutoExpand,
    setDashboardTheme,
    isSaving,
  } = useWidgetLayout();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('layout');

  // Memoized sorted widgets
  const sortedWidgets = useMemo(() => 
    [...widgets].sort((a, b) => a.order - b.order), 
    [widgets]
  );

  // Memoized widgets grouped by category
  const widgetsByCategory = useMemo(() => {
    const groups: Record<WidgetCategory, typeof sortedWidgets> = {
      stats: [],
      charts: [],
      tables: [],
      other: [],
    };
    sortedWidgets.forEach(widget => {
      const category = WIDGET_CATEGORIES[widget.id] || 'other';
      groups[category].push(widget);
    });
    return groups;
  }, [sortedWidgets]);

  // Handlers
  const handleThemeChange = (theme: DashboardTheme) => {
    setTheme(theme);
    setDashboardTheme(theme);
    toast({
      title: '🎨 ערכת נושא שונתה',
      description: `עברת לערכת "${dashboardThemes[theme].name}"`,
    });
  };

  const handleReset = () => {
    resetAll();
    toast({
      title: '🔄 ההגדרות אופסו',
      description: 'כל ההגדרות חזרו לברירת המחדל',
    });
  };

  const handleAutoArrange = () => {
    autoArrangeWidgets();
    toast({
      title: '✨ סידור אוטומטי',
      description: 'הווידג\'טים סודרו בצורה אופטימלית',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] p-0 overflow-hidden" dir="rtl">
        
        {/* ======== HEADER ======== */}
        <DialogHeader className="px-8 pt-6 pb-5 border-b bg-gradient-to-l from-muted/50 to-background">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Settings2 className="h-6 w-6 text-primary" />
                </div>
                הגדרות דשבורד
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                התאם את מראה הדשבורד והווידג'טים לפי העדפותיך האישיות
              </DialogDescription>
            </div>
            <Badge 
              variant={isSaving ? "outline" : "secondary"} 
              className="gap-2 px-3 py-1.5"
            >
              <Cloud className={cn("h-4 w-4", isSaving && "animate-pulse")} />
              {isSaving ? 'שומר...' : 'מסונכרן'}
            </Badge>
          </div>
        </DialogHeader>

        {/* ======== TABS ======== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-8 pt-5">
            <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-muted/50">
              <TabsTrigger value="layout" className="gap-2 text-sm h-12 data-[state=active]:shadow-md">
                <LayoutGrid className="h-5 w-5" />
                <span className="font-medium">פריסה ומרווחים</span>
              </TabsTrigger>
              <TabsTrigger value="widgets" className="gap-2 text-sm h-12 data-[state=active]:shadow-md">
                <Grid3X3 className="h-5 w-5" />
                <span className="font-medium">ווידג'טים</span>
              </TabsTrigger>
              <TabsTrigger value="themes" className="gap-2 text-sm h-12 data-[state=active]:shadow-md">
                <Palette className="h-5 w-5" />
                <span className="font-medium">ערכות נושא</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ======== LAYOUT TAB ======== */}
          <TabsContent value="layout" className="px-8 py-6">
            <div className="grid gap-8">
              
              {/* Grid Gap Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Grid3X3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">מרווח בין ווידג'טים</h3>
                    <p className="text-sm text-muted-foreground">בחר את הריווח המועדף בין הרכיבים</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {GAP_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGridGap(option.value)}
                      className={cn(
                        "relative p-5 rounded-2xl border-2 text-center transition-all duration-200",
                        "hover:border-primary/50 hover:shadow-md",
                        gridGap === option.value 
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                          : "border-border bg-card"
                      )}
                    >
                      <div className="text-xl font-bold mb-1">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.size}</div>
                      {gridGap === option.value && (
                        <div className="absolute top-3 left-3">
                          <div className="p-1 rounded-full bg-primary">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
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
                    <p className="text-sm text-muted-foreground">הגדר כיצד הווידג'טים מתארגנים</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <Label htmlFor="equalize" className="text-base font-medium cursor-pointer">
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
                      <Label htmlFor="expand" className="text-base font-medium cursor-pointer">
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
                    <p className="text-sm text-muted-foreground">כלים לניהול מהיר של הדשבורד</p>
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
          <TabsContent value="widgets" className="px-8 py-6">
            <ScrollArea className="h-[420px] pr-4">
              <div className="space-y-8">
                {(Object.keys(widgetsByCategory) as WidgetCategory[]).map((category) => {
                  const categoryWidgets = widgetsByCategory[category];
                  if (categoryWidgets.length === 0) return null;
                  const { name, icon } = CATEGORY_INFO[category];

                  return (
                    <section key={category}>
                      {/* Category Header */}
                      <div className="flex items-center gap-3 mb-4">
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
                              !widget.visible && "opacity-50 bg-muted/20 border-dashed"
                            )}
                          >
                            {/* Drag Handle */}
                            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
                              <GripVertical className="h-6 w-6" />
                            </div>

                            {/* Widget Info */}
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "font-semibold text-base",
                                !widget.visible && "line-through text-muted-foreground"
                              )}>
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
                                  onClick={() => moveWidget(widget.id, 'up')}
                                  disabled={widget.order === 1}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-primary/10"
                                  onClick={() => moveWidget(widget.id, 'down')}
                                  disabled={widget.order === widgets.length}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Size Select */}
                              <Select
                                value={widget.size}
                                onValueChange={(value) => setSize(widget.id, value as WidgetSize)}
                              >
                                <SelectTrigger className="w-[110px] h-10 font-medium">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SIZE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
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
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ======== THEMES TAB ======== */}
          <TabsContent value="themes" className="px-8 py-6">
            <ScrollArea className="h-[420px] pr-4">
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
                      <div className="text-muted-foreground mt-1">{themeConfig.description}</div>
                      <div className="flex gap-2 mt-4">
                        {themeConfig.effects.glow && (
                          <Badge>✨ זוהר</Badge>
                        )}
                        {themeConfig.effects.reflection && (
                          <Badge>🪞 השתקפות</Badge>
                        )}
                        {themeConfig.effects.gradient && (
                          <Badge>🎨 גרדיאנט</Badge>
                        )}
                        <Badge variant="outline">פינות: {themeConfig.effects.roundedCorners}</Badge>
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
                {(Object.keys(dashboardThemes) as DashboardTheme[]).map((themeKey) => {
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
                          : "border-border hover:border-primary/50"
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
                          style={{ backgroundColor: theme.colors.headerBackground }}
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
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* ======== FOOTER ======== */}
        <div className="px-8 py-5 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            💾 כל ההגדרות נשמרות אוטומטית ומסונכרנות בין המכשירים שלך
          </p>
          <Button onClick={() => onOpenChange(false)} size="lg" className="px-8">
            סיום
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
