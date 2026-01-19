import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  CalendarFold,
  Clock,
  TrendingUp,
  DollarSign,
  Briefcase,
  Palette,
  Sun,
  Moon,
  Sparkles,
  Settings2,
  Type,
  Square,
  RotateCcw,
  Pipette,
  RectangleHorizontal,
  Bold,
  ALargeSmall
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useDashboardTheme, DashboardTheme } from './DashboardThemeProvider';
import { ThemedWidget } from './ThemedWidget';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

type TimePeriod = 'day' | 'week' | 'month' | 'year';
type ColorKey = 'gold' | 'navy' | 'gray' | 'white' | 'blue' | 'custom';

interface ColorWithCustom {
  preset: ColorKey;
  custom?: string;
}

interface CustomColors {
  iconColor: ColorWithCustom;
  textColor: ColorWithCustom;
  bgColor: ColorWithCustom;
  frameColor: ColorWithCustom;
  dateColor: ColorWithCustom; // New: date text color
  // Text options
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  // Frame options
  borderWidth: number;
  borderRadius: number;
}

interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  description: string | null;
  hourly_rate: number | null;
  project_id: string | null;
  client_id: string | null;
  project?: { name: string } | null;
  client?: { name: string } | null;
}

interface WorkHoursTableWidgetProps {
  isLoading?: boolean;
}

const periodConfig: Record<TimePeriod, { label: string; icon: React.ElementType; getStart: () => Date }> = {
  day: { label: 'יום', icon: Calendar, getStart: () => startOfDay(new Date()) },
  week: { label: 'שבוע', icon: CalendarDays, getStart: () => startOfWeek(new Date(), { weekStartsOn: 0 }) },
  month: { label: 'חודש', icon: CalendarRange, getStart: () => startOfMonth(new Date()) },
  year: { label: 'שנה', icon: CalendarFold, getStart: () => startOfYear(new Date()) },
};

const themeOptions: { id: DashboardTheme; label: string; icon: React.ElementType; colors: string }[] = [
  { id: 'navy-gold', label: 'נייבי זהב', icon: Sparkles, colors: 'bg-[#162C58] border-[#d4af37]' },
  { id: 'modern-dark', label: 'מודרני כהה', icon: Moon, colors: 'bg-gray-900 border-purple-500' },
  { id: 'classic', label: 'קלאסי', icon: Sun, colors: 'bg-card border-primary' },
];

const COLOR_OPTIONS: { key: ColorKey; label: string; hex: string; bg: string; text: string; border: string }[] = [
  { key: 'gold', label: 'זהב', hex: '#d4af37', bg: 'bg-[#d4af37]', text: 'text-[#d4af37]', border: 'border-[#d4af37]' },
  { key: 'navy', label: 'נייבי', hex: '#1e3a5f', bg: 'bg-[#1e3a5f]', text: 'text-[#1e3a5f]', border: 'border-[#1e3a5f]' },
  { key: 'blue', label: 'כחול', hex: '#2563eb', bg: 'bg-[#2563eb]', text: 'text-[#2563eb]', border: 'border-[#2563eb]' },
  { key: 'gray', label: 'אפור', hex: '#6b7280', bg: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500' },
  { key: 'white', label: 'לבן', hex: '#ffffff', bg: 'bg-white', text: 'text-white', border: 'border-white' },
];

// Format duration in HH:MM format
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}:${mins.toString().padStart(2, '0')}`;
};

// Format duration with label for display
const formatDurationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} דק'`;
  if (mins === 0) return `${hours} שעות`;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
};

const FONT_WEIGHT_OPTIONS: { key: CustomColors['fontWeight']; label: string }[] = [
  { key: 'normal', label: 'רגיל' },
  { key: 'medium', label: 'בינוני' },
  { key: 'semibold', label: 'מודגש למחצה' },
  { key: 'bold', label: 'מודגש' },
];

const STORAGE_KEY = 'work-hours-widget-colors';

const defaultColors: CustomColors = {
  iconColor: { preset: 'gold' },
  textColor: { preset: 'gold' },
  bgColor: { preset: 'navy' },
  frameColor: { preset: 'gold' },
  dateColor: { preset: 'blue' }, // Default to blue for dates
  fontSize: 14,
  fontWeight: 'medium',
  borderWidth: 1,
  borderRadius: 8,
};

function getColorHex(colorWithCustom: ColorWithCustom | undefined): string {
  if (!colorWithCustom) {
    return '#2563eb'; // Default blue for undefined
  }
  if (colorWithCustom.preset === 'custom' && colorWithCustom.custom) {
    return colorWithCustom.custom;
  }
  const option = COLOR_OPTIONS.find(c => c.key === colorWithCustom.preset);
  return option?.hex || '#d4af37';
}

function getColorValue(colorWithCustom: ColorWithCustom, type: 'bg' | 'text' | 'border'): string {
  if (colorWithCustom.preset === 'custom' && colorWithCustom.custom) {
    const hex = colorWithCustom.custom;
    return type === 'bg' ? `bg-[${hex}]` : type === 'text' ? `text-[${hex}]` : `border-[${hex}]`;
  }
  const option = COLOR_OPTIONS.find(c => c.key === colorWithCustom.preset);
  if (!option) return '';
  return type === 'bg' ? option.bg : type === 'text' ? option.text : option.border;
}

// Color Picker Row Component
function ColorPickerRow({ 
  label, 
  icon, 
  value, 
  onChange 
}: { 
  label: string; 
  icon: React.ReactNode; 
  value: ColorWithCustom | undefined; 
  onChange: (val: ColorWithCustom) => void;
}) {
  // Provide default value if undefined
  const safeValue = value || { preset: 'gold' as ColorKey };
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </Label>
      <div className="flex gap-2 flex-wrap items-center">
        {COLOR_OPTIONS.map(color => (
          <Button
            key={color.key}
            variant={safeValue.preset === color.key ? 'default' : 'outline'}
            size="sm"
            className={`${color.bg} ${safeValue.preset === color.key ? 'ring-2 ring-offset-2' : ''} ${color.key === 'white' ? 'text-black' : 'text-white'}`}
            onClick={() => onChange({ preset: color.key })}
          >
            {color.label}
          </Button>
        ))}
        {/* Custom Color Picker */}
        <div className="relative">
          <input
            type="color"
            value={safeValue.preset === 'custom' && safeValue.custom ? safeValue.custom : '#d4af37'}
            onChange={(e) => onChange({ preset: 'custom', custom: e.target.value })}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button
            variant={safeValue.preset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={`gap-1 ${safeValue.preset === 'custom' ? 'ring-2 ring-offset-2' : ''}`}
            style={safeValue.preset === 'custom' && safeValue.custom ? { backgroundColor: safeValue.custom } : {}}
          >
            <Pipette className="h-3 w-3" />
            התאמה
          </Button>
        </div>
      </div>
      {safeValue.preset === 'custom' && safeValue.custom && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div 
            className="w-4 h-4 rounded border" 
            style={{ backgroundColor: safeValue.custom }}
          />
          <span>{safeValue.custom}</span>
        </div>
      )}
    </div>
  );
}

export function WorkHoursTableWidget({ isLoading: externalLoading }: WorkHoursTableWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const [customColors, setCustomColors] = useState<CustomColors>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Merge stored with defaults to ensure new properties have default values
        return { ...defaultColors, ...JSON.parse(stored) };
      }
      return defaultColors;
    } catch {
      return defaultColors;
    }
  });
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const { currentTheme, setTheme } = useDashboardTheme();
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customColors));
    // Trigger storage event for cloud sync
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  }, [customColors]);

  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['time-entries-widget', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const yearStart = startOfYear(new Date()).toISOString();
      
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          id,
          start_time,
          end_time,
          duration_minutes,
          description,
          hourly_rate,
          project_id,
          client_id,
          projects:project_id(name),
          clients:client_id(name)
        `)
        .eq('user_id', user.id)
        .gte('start_time', yearStart)
        .order('start_time', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(entry => ({
        ...entry,
        project: entry.projects as { name: string } | null,
        client: entry.clients as { name: string } | null,
      }));
    },
    enabled: !!user?.id,
  });

  const filteredEntries = useMemo(() => {
    const periodStart = periodConfig[selectedPeriod].getStart();
    return timeEntries.filter(entry => 
      isAfter(parseISO(entry.start_time), periodStart)
    );
  }, [timeEntries, selectedPeriod]);

  const stats = useMemo(() => {
    const totalMinutes = filteredEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const totalHours = totalMinutes / 60;
    const totalRevenue = filteredEntries.reduce((sum, e) => {
      const hours = (e.duration_minutes || 0) / 60;
      return sum + (hours * (e.hourly_rate || 0));
    }, 0);

    const projectMinutes: Record<string, { name: string; minutes: number }> = {};
    filteredEntries.forEach(e => {
      const name = e.project?.name || e.client?.name || 'ללא פרויקט';
      const key = e.project_id || e.client_id || 'none';
      if (!projectMinutes[key]) projectMinutes[key] = { name, minutes: 0 };
      projectMinutes[key].minutes += (e.duration_minutes || 0);
    });
    
    const topProject = Object.values(projectMinutes).sort((a, b) => b.minutes - a.minutes)[0];

    const periodStart = periodConfig[selectedPeriod].getStart();
    const daysInPeriod = Math.max(1, Math.ceil((Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
    const avgMinutesPerDay = totalMinutes / daysInPeriod;

    return {
      totalHours,
      totalMinutes,
      totalRevenue,
      avgMinutesPerDay,
      topProject: topProject?.name || '-',
      topProjectMinutes: topProject?.minutes || 0,
      entriesCount: filteredEntries.length,
    };
  }, [filteredEntries, selectedPeriod]);

  // Dynamic theme classes based on custom colors
  const frameColorClass = getColorValue(customColors.frameColor, 'border');
  const iconColorClass = getColorValue(customColors.iconColor, 'text');
  const bgColorClass = getColorValue(customColors.bgColor, 'bg');
  
  const themeClasses = currentTheme === 'navy-gold' 
    ? `bg-[#162C58] ${frameColorClass}/30`
    : currentTheme === 'modern-dark'
    ? 'bg-gray-900 border-gray-700'
    : 'bg-card border-border';

  const buttonActiveClass = currentTheme === 'navy-gold'
    ? `${getColorValue(customColors.iconColor, 'bg')} text-[#162C58]`
    : currentTheme === 'modern-dark'
    ? 'bg-purple-600 text-white'
    : 'bg-primary text-primary-foreground';

  const buttonInactiveClass = currentTheme === 'navy-gold'
    ? `bg-[#162C58]/50 ${iconColorClass} hover:${getColorValue(customColors.iconColor, 'bg')}/20`
    : currentTheme === 'modern-dark'
    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    : 'bg-muted text-muted-foreground hover:bg-muted/80';

  if (externalLoading || isLoading) {
    return (
      <ThemedWidget 
        widgetId="table-hours"
        title="שעות עבודה"
        titleIcon={<Clock className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-9 w-16" />)}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-48" />
        </div>
      </ThemedWidget>
    );
  }

  // Header actions including color settings, theme dropdown, and badge
  const headerActionsContent = (
    <>
      {/* Custom Colors Dialog */}
      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${
              currentTheme === 'navy-gold' 
                ? `${iconColorClass} hover:bg-[#d4af37]/20` 
                : currentTheme === 'modern-dark'
                ? 'text-purple-400 hover:bg-purple-500/20'
                : 'text-primary hover:bg-primary/10'
            }`}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg bg-popover max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              התאמה אישית של צבעים
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="colors">צבעים</TabsTrigger>
              <TabsTrigger value="text">טקסט</TabsTrigger>
              <TabsTrigger value="frame">מסגרות</TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4">
              <ColorPickerRow
                label="צבע אייקונים"
                icon={<Sparkles className="h-4 w-4" />}
                value={customColors.iconColor}
                onChange={(val) => setCustomColors(prev => ({ ...prev, iconColor: val }))}
              />
              <ColorPickerRow
                label="צבע טקסט בשדות"
                icon={<Type className="h-4 w-4" />}
                value={customColors.textColor}
                onChange={(val) => setCustomColors(prev => ({ ...prev, textColor: val }))}
              />
              <ColorPickerRow
                label="צבע רקע שדות"
                icon={<Square className="h-4 w-4" />}
                value={customColors.bgColor}
                onChange={(val) => setCustomColors(prev => ({ ...prev, bgColor: val }))}
              />
              <ColorPickerRow
                label="צבע מסגרות"
                icon={<RectangleHorizontal className="h-4 w-4" />}
                value={customColors.frameColor}
                onChange={(val) => setCustomColors(prev => ({ ...prev, frameColor: val }))}
              />
              <ColorPickerRow
                label="צבע תאריכים"
                icon={<Calendar className="h-4 w-4" />}
                value={customColors.dateColor}
                onChange={(val) => setCustomColors(prev => ({ ...prev, dateColor: val }))}
              />
            </TabsContent>

            {/* Text Tab */}
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <ALargeSmall className="h-4 w-4" />
                  גודל פונט: {customColors.fontSize}px
                </Label>
                <Slider
                  value={[customColors.fontSize]}
                  onValueChange={([val]) => setCustomColors(prev => ({ ...prev, fontSize: val }))}
                  min={10}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Bold className="h-4 w-4" />
                  משקל פונט
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {FONT_WEIGHT_OPTIONS.map(option => (
                    <Button
                      key={option.key}
                      variant={customColors.fontWeight === option.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCustomColors(prev => ({ ...prev, fontWeight: option.key }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Frame Tab */}
            <TabsContent value="frame" className="space-y-4">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <RectangleHorizontal className="h-4 w-4" />
                  עובי מסגרת: {customColors.borderWidth}px
                </Label>
                <Slider
                  value={[customColors.borderWidth]}
                  onValueChange={([val]) => setCustomColors(prev => ({ ...prev, borderWidth: val }))}
                  min={0}
                  max={4}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Square className="h-4 w-4" />
                  עיגול פינות: {customColors.borderRadius}px
                </Label>
                <Slider
                  value={[customColors.borderRadius]}
                  onValueChange={([val]) => setCustomColors(prev => ({ ...prev, borderRadius: val }))}
                  min={0}
                  max={24}
                  step={2}
                  className="w-full"
                />
              </div>
              <div className="mt-4 p-4 border rounded-lg" style={{
                borderWidth: `${customColors.borderWidth}px`,
                borderRadius: `${customColors.borderRadius}px`,
                borderColor: getColorHex(customColors.frameColor),
                backgroundColor: getColorHex(customColors.bgColor) + '20',
              }}>
                <span className="text-sm" style={{ 
                  color: getColorHex(customColors.textColor),
                  fontSize: `${customColors.fontSize}px`,
                  fontWeight: customColors.fontWeight === 'bold' ? 700 : 
                             customColors.fontWeight === 'semibold' ? 600 :
                             customColors.fontWeight === 'medium' ? 500 : 400
                }}>
                  תצוגה מקדימה
                </span>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-2 border-t mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomColors(defaultColors)}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              איפוס
            </Button>
            <Button
              size="sm"
              onClick={() => setColorDialogOpen(false)}
            >
              סגור
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Theme Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${
              currentTheme === 'navy-gold' 
                ? `${iconColorClass} hover:bg-[#d4af37]/20` 
                : currentTheme === 'modern-dark'
                ? 'text-purple-400 hover:bg-purple-500/20'
                : 'text-primary hover:bg-primary/10'
            }`}
          >
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 bg-popover">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = currentTheme === option.id;
            return (
              <DropdownMenuItem
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={`flex items-center gap-2 cursor-pointer ${isActive ? 'bg-accent' : ''}`}
              >
                <div className={`w-4 h-4 rounded border-2 ${option.colors}`} />
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
                {isActive && <span className="mr-auto text-xs">✓</span>}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Badge 
        variant="outline" 
        className={cn(
          "text-xs",
          (currentTheme === 'navy-gold' || currentTheme === 'modern-dark') && "bg-white/10 text-white border-white/30"
        )}
      >
        {stats.entriesCount} רשומות
      </Badge>
    </>
  );

  return (
    <ThemedWidget
      widgetId="table-hours"
      title="שעות עבודה"
      titleIcon={<Clock className="h-5 w-5" />}
      headerActions={headerActionsContent}
    >
      {/* Period Selector */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(periodConfig) as TimePeriod[]).map((period) => {
          const Icon = periodConfig[period].icon;
          const isActive = selectedPeriod === period;
          return (
            <Button
              key={period}
              size="sm"
              variant="ghost"
              className={`flex items-center gap-1.5 transition-all ${
                isActive ? buttonActiveClass : buttonInactiveClass
              }`}
              onClick={() => setSelectedPeriod(period)}
            >
              <Icon className="h-4 w-4" />
              {periodConfig[period].label}
            </Button>
          );
        })}
      </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Clock}
            label="סה״כ זמן"
            value={formatDurationLabel(stats.totalMinutes)}
            suffix=""
            theme={currentTheme}
            customColors={customColors}
          />
          <StatCard
            icon={TrendingUp}
            label="ממוצע ליום"
            value={formatDurationLabel(stats.avgMinutesPerDay)}
            suffix=""
            theme={currentTheme}
            customColors={customColors}
          />
          <StatCard
            icon={Briefcase}
            label="פרויקט מוביל"
            value={stats.topProject}
            suffix={stats.topProjectMinutes > 0 ? formatDuration(stats.topProjectMinutes) : ''}
            theme={currentTheme}
            customColors={customColors}
            small
          />
          <StatCard
            icon={DollarSign}
            label="הכנסה צפויה"
            value={`₪${stats.totalRevenue.toLocaleString()}`}
            theme={currentTheme}
            customColors={customColors}
          />
        </div>

        {/* Table */}
        <div className={`rounded-lg border overflow-hidden ${currentTheme === 'navy-gold' ? frameColorClass : ''}`}>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className={`sticky top-0 ${
                currentTheme === 'navy-gold' ? 'bg-[#162C58] text-white' :
                currentTheme === 'modern-dark' ? 'bg-gray-800 text-white' : 'bg-muted'
              }`}>
                <tr>
                  <th className="text-right p-2 font-medium">תאריך</th>
                  <th className="text-right p-2 font-medium">פרויקט/לקוח</th>
                  <th className="text-right p-2 font-medium hidden md:table-cell">תיאור</th>
                  <th className="text-center p-2 font-medium">שעות</th>
                  <th className="text-left p-2 font-medium">סכום</th>
                </tr>
              </thead>
              <tbody className={
                (currentTheme === 'navy-gold' || currentTheme === 'modern-dark') ? 'text-white' : ''
              }>
                {filteredEntries.slice(0, 10).map((entry) => {
                  const minutes = entry.duration_minutes || 0;
                  const hours = minutes / 60;
                  const amount = hours * (entry.hourly_rate || 0);
                  return (
                    <tr 
                      key={entry.id} 
                      className={`border-t ${
                        currentTheme === 'navy-gold' ? `${frameColorClass}/10 hover:${getColorValue(customColors.iconColor, 'bg')}/5` :
                        currentTheme === 'modern-dark' ? 'border-gray-700 hover:bg-gray-800/50' : 
                        'border-border hover:bg-muted/50'
                      }`}
                    >
                      <td 
                        className="p-2 font-semibold"
                        style={{ color: getColorHex(customColors.dateColor) }}
                      >
                        {format(parseISO(entry.start_time), 'dd/MM', { locale: he })}
                      </td>
                      <td className="p-2 font-medium truncate max-w-[120px]">
                        {entry.project?.name || entry.client?.name || '-'}
                      </td>
                      <td className={`p-2 truncate max-w-[150px] hidden md:table-cell ${(currentTheme === 'navy-gold' || currentTheme === 'modern-dark') ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {entry.description || '-'}
                      </td>
                      <td className="p-2 text-center">
                        <Badge 
                          variant="secondary" 
                          className={`font-mono ${currentTheme === 'navy-gold' ? `${getColorValue(customColors.iconColor, 'bg')} text-[#0a1628]` : ''}`}
                        >
                          {formatDuration(minutes)}
                        </Badge>
                      </td>
                      <td className="p-2 text-left font-medium">
                        ₪{amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className={`p-8 text-center ${(currentTheme === 'navy-gold' || currentTheme === 'modern-dark') ? 'text-white/60' : 'text-muted-foreground'}`}>
                      אין רשומות לתקופה זו
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredEntries.length > 0 && (
                <tfoot className={cn(
                  "font-semibold",
                  currentTheme === 'navy-gold' && `${getColorValue(customColors.iconColor, 'bg')}/10 text-white`,
                  currentTheme === 'modern-dark' && 'bg-purple-900/20 text-white',
                  currentTheme !== 'navy-gold' && currentTheme !== 'modern-dark' && 'bg-primary/10'
                )}>
                  <tr className="border-t-2">
                    <td colSpan={3} className="p-2 text-right">סה״כ:</td>
                    <td className="p-2 text-center">
                      <Badge className={`font-mono ${currentTheme === 'navy-gold' ? `${getColorValue(customColors.iconColor, 'bg')} text-[#0a1628]` : ''}`}>
                        {formatDuration(stats.totalMinutes)}
                      </Badge>
                    </td>
                    <td className="p-2 text-left">
                      ₪{stats.totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {filteredEntries.length > 10 && (
          <p className={cn(
            "text-xs text-center",
            (currentTheme === 'navy-gold' || currentTheme === 'modern-dark') ? 'text-white/60' : 'text-muted-foreground'
          )}>
            מציג 10 מתוך {filteredEntries.length} רשומות
          </p>
        )}
    </ThemedWidget>
  );
}


function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix, 
  theme,
  customColors,
  small 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  suffix?: string;
  theme: string;
  customColors: CustomColors;
  small?: boolean;
}) {
  const frameColorClass = getColorValue(customColors.frameColor, 'border');
  const iconColorClass = getColorValue(customColors.iconColor, 'text');
  
  const bgClass = theme === 'navy-gold' 
    ? `bg-[#0f2847] ${frameColorClass}/20`
    : theme === 'modern-dark'
    ? 'bg-gray-800 border-gray-700'
    : 'bg-muted/50 border-border';

  // Text color based on theme for proper contrast
  const textColorClass = theme === 'navy-gold' || theme === 'modern-dark'
    ? 'text-white'
    : 'text-foreground';

  const suffixColorClass = theme === 'navy-gold' || theme === 'modern-dark'
    ? 'text-white/70'
    : 'text-muted-foreground';

  return (
    <div className={`rounded-lg border p-3 ${bgClass}`}>
      <div className={`flex items-center gap-2 mb-1 ${theme === 'navy-gold' ? iconColorClass : 'text-muted-foreground'}`}>
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className={`font-bold ${textColorClass} ${small ? 'text-sm truncate' : 'text-xl'}`}>
        {value}
      </div>
      {suffix && (
        <div className={`text-xs ${suffixColorClass}`}>{suffix}</div>
      )}
    </div>
  );
}
