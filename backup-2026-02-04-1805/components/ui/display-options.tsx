import React, { useState, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
  Settings2,
  Calendar,
  CalendarDays,
  BarChart3,
  PieChart,
  LineChart,
  Table2,
  Grid3X3,
  List,
  TrendingUp,
  Eye,
  LayoutGrid,
  LayoutList,
  AreaChart,
  Edit2,
  Trash2,
  ExternalLink,
  Palette,
  Activity,
  ScatterChart,
  Radar,
  Gauge,
  BarChartHorizontal,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewType = 'chart' | 'bar' | 'pie' | 'line' | 'table' | 'grid' | 'list' | 'cards' | 'area' | 'donut' | 'radar' | 'scatter' | 'horizontal-bar' | 'stacked-bar' | 'gauge';
export type TimeRange = 'year' | 'month' | 'week' | 'day' | 'all' | 'quarter' | 'custom';
export type ChartType = 'pie' | 'bar' | 'line' | 'area' | 'donut' | 'radar' | 'scatter' | 'horizontal-bar' | 'stacked-bar' | 'gauge';

// Color schemes for charts
export type ColorScheme = 'default' | 'ocean' | 'sunset' | 'forest' | 'candy' | 'monochrome' | 'rainbow' | 'pastel' | 'neon' | 'earth' | 'royal';

export const COLOR_SCHEMES: Record<ColorScheme, { name: string; colors: string[]; preview: string }> = {
  default: {
    name: 'ברירת מחדל',
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    preview: 'linear-gradient(90deg, #3b82f6 0%, #10b981 33%, #f59e0b 66%, #ef4444 100%)',
  },
  ocean: {
    name: 'אוקיינוס',
    colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#0891b2', '#22d3ee', '#67e8f9'],
    preview: 'linear-gradient(90deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)',
  },
  sunset: {
    name: 'שקיעה',
    colors: ['#f97316', '#fb923c', '#f59e0b', '#fbbf24', '#ef4444', '#dc2626'],
    preview: 'linear-gradient(90deg, #f97316 0%, #f59e0b 50%, #ef4444 100%)',
  },
  forest: {
    name: 'יער',
    colors: ['#22c55e', '#16a34a', '#15803d', '#84cc16', '#65a30d', '#4ade80'],
    preview: 'linear-gradient(90deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
  },
  candy: {
    name: 'ממתקים',
    colors: ['#ec4899', '#f472b6', '#a855f7', '#c084fc', '#8b5cf6', '#d946ef'],
    preview: 'linear-gradient(90deg, #ec4899 0%, #a855f7 50%, #d946ef 100%)',
  },
  monochrome: {
    name: 'מונוכרום',
    colors: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'],
    preview: 'linear-gradient(90deg, #1e293b 0%, #475569 50%, #94a3b8 100%)',
  },
  rainbow: {
    name: 'קשת',
    colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
    preview: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)',
  },
  pastel: {
    name: 'פסטל',
    colors: ['#fda4af', '#fdba74', '#fde047', '#86efac', '#93c5fd', '#c4b5fd'],
    preview: 'linear-gradient(90deg, #fda4af, #fde047, #86efac, #93c5fd)',
  },
  neon: {
    name: 'ניאון',
    colors: ['#00ff87', '#00d9ff', '#ff00ff', '#ffff00', '#ff6600', '#00ffff'],
    preview: 'linear-gradient(90deg, #00ff87, #00d9ff, #ff00ff, #ffff00)',
  },
  earth: {
    name: 'אדמה',
    colors: ['#a16207', '#ca8a04', '#78716c', '#57534e', '#92400e', '#b45309'],
    preview: 'linear-gradient(90deg, #a16207 0%, #78716c 50%, #92400e 100%)',
  },
  royal: {
    name: 'מלכותי',
    colors: ['#7c3aed', '#6366f1', '#4f46e5', '#8b5cf6', '#a78bfa', '#c4b5fd'],
    preview: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)',
  },
};

interface DisplayOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface DisplayOptionsProps {
  // View type options
  viewType?: ViewType;
  onViewTypeChange?: (type: ViewType) => void;
  availableViewTypes?: ViewType[];
  
  // Time range options
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  availableTimeRanges?: TimeRange[];
  
  // Chart type options
  chartType?: ChartType;
  onChartTypeChange?: (type: ChartType) => void;
  showChartOptions?: boolean;
  
  // Color scheme options
  colorScheme?: ColorScheme;
  onColorSchemeChange?: (scheme: ColorScheme) => void;
  showColorOptions?: boolean;
  
  // Custom options
  customOptions?: DisplayOption[];
  selectedOption?: string;
  onOptionChange?: (optionId: string) => void;
  
  // UI
  size?: 'sm' | 'default';
  className?: string;
  iconOnly?: boolean;
}

const VIEW_TYPE_OPTIONS: Record<ViewType, { label: string; icon: React.ReactNode }> = {
  chart: { label: 'גרף', icon: <TrendingUp className="h-4 w-4" /> },
  bar: { label: 'גרף עמודות', icon: <BarChart3 className="h-4 w-4" /> },
  'horizontal-bar': { label: 'עמודות אופקיות', icon: <BarChartHorizontal className="h-4 w-4" /> },
  'stacked-bar': { label: 'עמודות מוערמות', icon: <BarChart3 className="h-4 w-4" /> },
  pie: { label: 'גרף עוגה', icon: <PieChart className="h-4 w-4" /> },
  donut: { label: 'גרף טבעת', icon: <CircleDot className="h-4 w-4" /> },
  line: { label: 'גרף קווי', icon: <LineChart className="h-4 w-4" /> },
  area: { label: 'גרף אזור', icon: <AreaChart className="h-4 w-4" /> },
  radar: { label: 'גרף רדאר', icon: <Radar className="h-4 w-4" /> },
  scatter: { label: 'גרף פיזור', icon: <ScatterChart className="h-4 w-4" /> },
  gauge: { label: 'מד', icon: <Gauge className="h-4 w-4" /> },
  table: { label: 'טבלה', icon: <Table2 className="h-4 w-4" /> },
  grid: { label: 'רשת', icon: <Grid3X3 className="h-4 w-4" /> },
  list: { label: 'רשימה', icon: <List className="h-4 w-4" /> },
  cards: { label: 'כרטיסים', icon: <LayoutList className="h-4 w-4" /> },
};

const TIME_RANGE_OPTIONS: Record<TimeRange, { label: string; icon: React.ReactNode }> = {
  day: { label: 'יום', icon: <CalendarDays className="h-4 w-4" /> },
  week: { label: 'שבוע', icon: <CalendarDays className="h-4 w-4" /> },
  month: { label: 'חודש', icon: <Calendar className="h-4 w-4" /> },
  quarter: { label: 'רבעון', icon: <Calendar className="h-4 w-4" /> },
  year: { label: 'שנה', icon: <Calendar className="h-4 w-4" /> },
  all: { label: 'הכל', icon: <Eye className="h-4 w-4" /> },
  custom: { label: 'מותאם אישית', icon: <Calendar className="h-4 w-4" /> },
};

const CHART_TYPE_OPTIONS: Record<ChartType, { label: string; icon: React.ReactNode }> = {
  pie: { label: 'תרשים עוגה', icon: <PieChart className="h-4 w-4" /> },
  donut: { label: 'תרשים טבעת', icon: <CircleDot className="h-4 w-4" /> },
  bar: { label: 'תרשים עמודות', icon: <BarChart3 className="h-4 w-4" /> },
  'horizontal-bar': { label: 'עמודות אופקיות', icon: <BarChartHorizontal className="h-4 w-4" /> },
  'stacked-bar': { label: 'עמודות מוערמות', icon: <BarChart3 className="h-4 w-4" /> },
  line: { label: 'תרשים קווי', icon: <LineChart className="h-4 w-4" /> },
  area: { label: 'תרשים אזור', icon: <AreaChart className="h-4 w-4" /> },
  radar: { label: 'תרשים רדאר', icon: <Radar className="h-4 w-4" /> },
  scatter: { label: 'תרשים פיזור', icon: <ScatterChart className="h-4 w-4" /> },
  gauge: { label: 'מד', icon: <Gauge className="h-4 w-4" /> },
};

export const DisplayOptions = forwardRef<HTMLDivElement, DisplayOptionsProps>(function DisplayOptions({
  viewType,
  onViewTypeChange,
  availableViewTypes = ['bar', 'pie', 'line', 'table'],
  timeRange,
  onTimeRangeChange,
  availableTimeRanges = ['year', 'month'],
  chartType,
  onChartTypeChange,
  showChartOptions = false,
  colorScheme,
  onColorSchemeChange,
  showColorOptions = false,
  customOptions,
  selectedOption,
  onOptionChange,
  size = 'sm',
  className,
  iconOnly = false,
}, _ref) {
  const [isOpen, setIsOpen] = useState(false);

  const hasViewTypes = viewType !== undefined && onViewTypeChange;
  const hasTimeRanges = timeRange !== undefined && onTimeRangeChange;
  const hasChartTypes = showChartOptions && chartType !== undefined && onChartTypeChange;
  const hasColorSchemes = showColorOptions && colorScheme !== undefined && onColorSchemeChange;
  const hasCustomOptions = customOptions && customOptions.length > 0 && onOptionChange;

  if (!hasViewTypes && !hasTimeRanges && !hasChartTypes && !hasColorSchemes && !hasCustomOptions) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'icon' : 'default'}
          className={cn(
            "h-8 w-8 p-0 hover:bg-muted/80 transition-colors",
            size === 'default' && "h-9 w-auto px-3",
            className
          )}
        >
          <Settings2 className={cn("h-4 w-4", !iconOnly && size === 'default' && "ml-2")} />
          {!iconOnly && size === 'default' && <span>אפשרויות תצוגה</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-[100]">
        {/* View Type Options */}
        {hasViewTypes && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground text-right">סוג תצוגה</DropdownMenuLabel>
            {availableViewTypes.map((type) => {
              const option = VIEW_TYPE_OPTIONS[type];
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => onViewTypeChange(type)}
                  className={cn(
                    "flex flex-row-reverse items-center justify-end gap-2 cursor-pointer text-right",
                    viewType === type && "bg-accent text-accent-foreground"
                  )}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {/* Chart Type Options */}
        {hasChartTypes && (
          <>
            {hasViewTypes && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground text-right">סוג תרשים</DropdownMenuLabel>
            {(['pie', 'donut', 'bar', 'horizontal-bar', 'stacked-bar', 'line', 'area', 'radar'] as ChartType[]).map((type) => {
              const option = CHART_TYPE_OPTIONS[type];
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => onChartTypeChange(type)}
                  className={cn(
                    "flex flex-row-reverse items-center justify-end gap-2 cursor-pointer text-right",
                    chartType === type && "bg-accent text-accent-foreground"
                  )}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {/* Color Scheme Options */}
        {hasColorSchemes && (
          <>
            {(hasViewTypes || hasChartTypes) && <DropdownMenuSeparator />}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex flex-row-reverse items-center justify-end gap-2 cursor-pointer text-right">
                <Palette className="h-4 w-4" />
                <span>ערכת צבעים</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-48 bg-background border shadow-lg z-[100]">
                  {(Object.keys(COLOR_SCHEMES) as ColorScheme[]).map((scheme) => {
                    const schemeConfig = COLOR_SCHEMES[scheme];
                    return (
                      <DropdownMenuItem
                        key={scheme}
                        onClick={() => onColorSchemeChange(scheme)}
                        className={cn(
                          "flex flex-row-reverse items-center justify-end gap-2 cursor-pointer text-right",
                          colorScheme === scheme && "bg-accent text-accent-foreground"
                        )}
                      >
                        <div 
                          className="w-5 h-5 rounded-full border border-border/50"
                          style={{ background: schemeConfig.preview }}
                        />
                        <span>{schemeConfig.name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </>
        )}

        {/* Time Range Options */}
        {hasTimeRanges && (
          <>
            {(hasViewTypes || hasChartTypes || hasColorSchemes) && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground text-right">טווח זמן</DropdownMenuLabel>
            {availableTimeRanges.map((range) => {
              const option = TIME_RANGE_OPTIONS[range];
              return (
                <DropdownMenuItem
                  key={range}
                  onClick={() => onTimeRangeChange(range)}
                  className={cn(
                    "flex flex-row-reverse items-center justify-end gap-2 cursor-pointer text-right",
                    timeRange === range && "bg-accent text-accent-foreground"
                  )}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {/* Custom Options */}
        {hasCustomOptions && (
          <>
            {(hasViewTypes || hasTimeRanges || hasChartTypes || hasColorSchemes) && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground text-right">אפשרויות</DropdownMenuLabel>
            {customOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => onOptionChange(option.id)}
                className={cn(
                  "flex flex-row-reverse items-center justify-end gap-2 cursor-pointer text-right",
                  selectedOption === option.id && "bg-accent text-accent-foreground"
                )}
              >
                {option.icon}
                <span>{option.label}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// Hover Actions Component - Edit/Delete icons that appear on hover
interface HoverActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
}

export function HoverActions({
  onEdit,
  onDelete,
  onView,
  className,
  showEdit = true,
  showDelete = true,
  showView = false,
}: HoverActionsProps) {
  return (
    <div
      className={cn(
        "absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        className
      )}
    >
      {showView && onView && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg bg-background/90 hover:bg-primary/10 hover:text-primary shadow-sm border border-border/50"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      )}
      {showEdit && onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg bg-background/90 hover:bg-primary/10 hover:text-primary shadow-sm border border-border/50"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      )}
      {showDelete && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg bg-background/90 hover:bg-destructive/10 hover:text-destructive shadow-sm border border-border/50"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// Wrapper component for items with hover actions
interface HoverItemWrapperProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onClick?: () => void;
  className?: string;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
}

export function HoverItemWrapper({
  children,
  onEdit,
  onDelete,
  onView,
  onClick,
  className,
  showEdit = true,
  showDelete = true,
  showView = false,
}: HoverItemWrapperProps) {
  return (
    <div
      className={cn(
        "group relative cursor-pointer transition-all duration-200",
        onClick && "hover:scale-[1.01]",
        className
      )}
      onClick={onClick}
    >
      {children}
      <HoverActions
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        showEdit={showEdit}
        showDelete={showDelete}
        showView={showView}
      />
    </div>
  );
}
