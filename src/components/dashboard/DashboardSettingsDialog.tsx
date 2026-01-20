// Dashboard Settings Dialog - Theme & Widget Control
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Moon,
  Sun,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Search,
  BarChart3,
  Table,
  PieChart,
  Download,
  Upload,
  Trash2,
  Filter,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardTheme, dashboardThemes, DashboardTheme } from './DashboardThemeProvider';
import { useWidgetManager, WidgetConfig, WidgetCategory, widgetPresets } from './WidgetManager';
import { useToast } from '@/hooks/use-toast';

interface DashboardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryIcons: Record<WidgetCategory, React.ReactNode> = {
  stats: <BarChart3 className="h-4 w-4" />,
  charts: <PieChart className="h-4 w-4" />,
  tables: <Table className="h-4 w-4" />,
  other: <Sparkles className="h-4 w-4" />,
};

const categoryNames: Record<WidgetCategory, string> = {
  stats: 'סטטיסטיקות',
  charts: 'גרפים',
  tables: 'טבלאות',
  other: 'אחר',
};

export function DashboardSettingsDialog({ open, onOpenChange }: DashboardSettingsDialogProps) {
  const { currentTheme, setTheme, themeConfig } = useDashboardTheme();
  const { widgets, toggleVisibility, resetToDefaults, reorderWidgets, updateWidget, moveWidget, applyPreset, exportConfig, importConfig, autoLayout, toggleAutoLayout, addDynamicStatsWidget, removeDynamicStatsWidget } = useWidgetManager();
  const { toast } = useToast();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<WidgetCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderWidgets(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-widgets-config.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'הוגדרות יוצאו בהצלחה', description: 'הקובץ הורד למחשב שלך' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      if (importConfig(json)) {
        toast({ title: 'הגדרות יובאו בהצלחה', description: 'הוידג\'טים עודכנו' });
      } else {
        toast({ title: 'שגיאה בייבוא', description: 'הקובץ אינו תקין', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter widgets
  const filteredWidgets = widgets
    .sort((a, b) => a.order - b.order)
    .filter(widget => {
      if (searchQuery && !widget.name.includes(searchQuery) && !widget.description.includes(searchQuery)) {
        return false;
      }
      if (categoryFilter !== 'all' && widget.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === 'visible' && !widget.visible) {
        return false;
      }
      if (statusFilter === 'hidden' && widget.visible) {
        return false;
      }
      return true;
    });

  const themePreview = (theme: DashboardTheme) => {
    const config = dashboardThemes[theme];
    return (
      <div 
        className={cn(
          "relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02]",
          currentTheme === theme && "ring-2 ring-offset-2 ring-primary"
        )}
        style={{
          background: config.colors.background,
          borderColor: config.colors.border,
        }}
        onClick={() => setTheme(theme)}
      >
        {/* Mini Preview Layout */}
        <div className="space-y-2">
          {/* Header */}
          <div 
            className="h-4 rounded-sm"
            style={{ backgroundColor: config.colors.headerBackground }}
          />
          {/* Stats Row */}
          <div className="flex gap-1">
            {[1,2,3,4].map(i => (
              <div 
                key={i}
                className="flex-1 h-6 rounded-sm"
                style={{ 
                  backgroundColor: config.colors.statCardBg,
                  border: `1px solid ${config.colors.border}`,
                }}
              />
            ))}
          </div>
          {/* Charts */}
          <div className="flex gap-1">
            <div 
              className="flex-1 h-10 rounded-sm"
              style={{ backgroundColor: config.colors.chartBg }}
            />
            <div 
              className="flex-1 h-10 rounded-sm"
              style={{ backgroundColor: config.colors.chartBg }}
            />
          </div>
        </div>
        
        {/* Theme Name */}
        <div className="mt-3 flex items-center justify-between">
          <span 
            className="font-semibold text-sm"
            style={{ color: config.colors.text }}
          >
            {config.name}
          </span>
          {currentTheme === theme && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </div>
        <p 
          className="text-xs mt-1"
          style={{ color: config.colors.textMuted }}
        >
          {config.description}
        </p>
        
        {/* Effects Indicators */}
        <div className="flex gap-1 mt-2">
          {config.effects.reflection && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              השתקפות
            </Badge>
          )}
          {config.effects.glow && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              זוהר
            </Badge>
          )}
          {config.effects.gradient && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              גרדיאנט
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            הגדרות דשבורד
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="widgets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="widgets" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              ווידג'טים
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-2">
              <Palette className="h-4 w-4" />
              ערכות נושא
            </TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="mt-4">
            <ScrollArea className="h-[350px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {themePreview('navy-gold')}
                {themePreview('elegant-white')}
                {themePreview('mouse-gray')}
                {themePreview('royal-blue')}
                {themePreview('gold-premium')}
                {themePreview('modern-dark')}
                {themePreview('classic')}
              </div>
            </ScrollArea>
            
            {/* Current Theme Info */}
            <div className="mt-6 p-4 rounded-xl bg-muted/50 border">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                ערכה פעילה: {themeConfig.name}
              </h4>
              <p className="text-xs text-muted-foreground">{themeConfig.description}</p>
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary">
                  פינות: {themeConfig.effects.roundedCorners}
                </Badge>
                {themeConfig.effects.glow && (
                  <Badge variant="secondary">אפקט זוהר</Badge>
                )}
                {themeConfig.effects.reflection && (
                  <Badge variant="secondary">השתקפות</Badge>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="mt-4">
            {/* Search and Filters */}
            <div className="space-y-3 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש וידג'ט..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Category Filter */}
                <div className="flex items-center gap-1">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as WidgetCategory | 'all')}>
                    <SelectTrigger className="h-8 w-[100px] text-xs">
                      <SelectValue placeholder="קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="stats">📊 סטטיסטיקות</SelectItem>
                      <SelectItem value="charts">📈 גרפים</SelectItem>
                      <SelectItem value="tables">📋 טבלאות</SelectItem>
                      <SelectItem value="other">✨ אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="flex gap-1">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setStatusFilter('all')}
                  >
                    הכל
                  </Button>
                  <Button
                    variant={statusFilter === 'visible' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => setStatusFilter('visible')}
                  >
                    <Eye className="h-3 w-3" />
                    גלויים
                  </Button>
                  <Button
                    variant={statusFilter === 'hidden' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => setStatusFilter('hidden')}
                  >
                    <EyeOff className="h-3 w-3" />
                    מוסתרים
                  </Button>
                </div>

                <div className="flex-1" />

                {/* Presets */}
                <Select onValueChange={applyPreset}>
                  <SelectTrigger className="h-8 w-[110px] text-xs">
                    <SelectValue placeholder="פריסות מוכנות" />
                  </SelectTrigger>
                  <SelectContent>
                    {widgetPresets.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {/* Auto Arrange - Pack widgets optimally */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Trigger auto-arrange via custom event
                    window.dispatchEvent(new CustomEvent('autoArrangeWidgets'));
                    toast({
                      title: "✨ סידור אוטומטי",
                      description: "הווידג'טים סודרו בצורה אופטימלית",
                      duration: 2000,
                    });
                  }}
                  className="gap-1 text-xs bg-primary/10 hover:bg-primary/20"
                >
                  <Sparkles className="h-3 w-3" />
                  סדר אוטומטי
                </Button>
                
                {/* Auto Layout Toggle */}
                <Button
                  variant={autoLayout ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleAutoLayout}
                  className="gap-1 text-xs"
                >
                  <LayoutGrid className="h-3 w-3" />
                  {autoLayout ? 'פריסה צפופה ✓' : 'פריסה צפופה'}
                </Button>
                
                <div className="w-px h-6 bg-border self-center" />
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    addDynamicStatsWidget();
                    toast({
                      title: "✅ ווידג'ט נוסף",
                      description: "ווידג'ט סטטוס דינמי חדש נוצר",
                      duration: 2000,
                    });
                  }} 
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  הוסף סטטוס דינמי
                </Button>
                
                <div className="w-px h-6 bg-border self-center" />
                
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 text-xs">
                  <Download className="h-3 w-3" />
                  ייצוא
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1 text-xs">
                  <Upload className="h-3 w-3" />
                  ייבוא
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <div className="flex-1" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetToDefaults}
                  className="gap-1 text-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  איפוס
                </Button>
              </div>
            </div>
            
            {/* Widget List */}
            <ScrollArea className="h-[300px] pl-4">
              <div className="space-y-2">
                {filteredWidgets.map((widget, index) => (
                  <div
                    key={widget.id}
                    draggable
                    onDragStart={() => handleDragStart(widgets.findIndex(w => w.id === widget.id))}
                    onDragOver={(e) => handleDragOver(e, widgets.findIndex(w => w.id === widget.id))}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border bg-card",
                      "hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-all",
                      draggedIndex === widgets.findIndex(w => w.id === widget.id) && "opacity-50 scale-[1.02]",
                      !widget.visible && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {categoryIcons[widget.category]}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-medium text-sm",
                          !widget.visible && "line-through"
                        )}>
                          {widget.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {widget.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Move Up/Down */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveWidget(widget.id, 'up')}
                        disabled={widget.order === 1}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveWidget(widget.id, 'down')}
                        disabled={widget.order === widgets.length}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      
                      {/* Size Select */}
                      <Select
                        value={widget.size}
                        onValueChange={(value: 'small' | 'medium' | 'large' | 'full') => {
                          updateWidget(widget.id, { size: value });
                        }}
                      >
                        <SelectTrigger className="h-7 w-[70px] text-xs border-primary/50 border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="small">קטן</SelectItem>
                          <SelectItem value="medium">בינוני</SelectItem>
                          <SelectItem value="large">גדול</SelectItem>
                          <SelectItem value="full">מלא</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Visibility Toggle */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleVisibility(widget.id)}
                      >
                        {widget.visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>                      
                      {/* Delete Dynamic Stats Widgets */}
                      {widget.id.startsWith('dynamic-stats-') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => {
                            removeDynamicStatsWidget(widget.id);
                            toast({
                              title: "🗑️ ווידג'ט הוסר",
                              description: `${widget.name} נמחק`,
                              duration: 2000,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}                    </div>
                  </div>
                ))}
                
                {filteredWidgets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>לא נמצאו וידג'טים מתאימים</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
