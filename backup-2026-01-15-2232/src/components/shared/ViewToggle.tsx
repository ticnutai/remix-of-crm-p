// View Toggle Component - Switch between different view modes
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutGrid,
  TableProperties,
  Columns3,
  List,
  Rows3,
  Grid2x2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'cards' | 'grid' | 'list' | 'compact' | 'kanban';

export interface ViewOption {
  value: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  mobileFriendly?: boolean;
}

export const defaultViewOptions: ViewOption[] = [
  {
    value: 'cards',
    label: 'כרטיסים',
    icon: LayoutGrid,
    description: 'כרטיסים גדולים עם כל המידע',
    mobileFriendly: true,
  },
  {
    value: 'grid',
    label: 'רשת',
    icon: Grid2x2,
    description: 'רשת צפופה של פריטים',
    mobileFriendly: true,
  },
  {
    value: 'table',
    label: 'טבלה',
    icon: TableProperties,
    description: 'טבלה מלאה עם עמודות',
    mobileFriendly: false,
  },
  {
    value: 'list',
    label: 'רשימה',
    icon: List,
    description: 'רשימה פשוטה ונקייה',
    mobileFriendly: true,
  },
  {
    value: 'compact',
    label: 'מצומצם',
    icon: Rows3,
    description: 'תצוגה צפופה עם מידע מינימלי',
    mobileFriendly: true,
  },
  {
    value: 'kanban',
    label: 'קנבן',
    icon: Columns3,
    description: 'עמודות לפי סטטוס',
    mobileFriendly: false,
  },
];

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  options?: ViewOption[];
  isMobile?: boolean;
  showLabel?: boolean;
  variant?: 'buttons' | 'dropdown';
  className?: string;
}

export function ViewToggle({
  currentView,
  onViewChange,
  options = defaultViewOptions,
  isMobile = false,
  showLabel = false,
  variant = 'dropdown',
  className,
}: ViewToggleProps) {
  // Filter options for mobile if needed
  const availableOptions = isMobile
    ? options.filter(opt => opt.mobileFriendly !== false)
    : options;

  const currentOption = availableOptions.find(opt => opt.value === currentView) || availableOptions[0];
  const CurrentIcon = currentOption.icon;

  if (variant === 'buttons') {
    return (
      <div className={cn('flex items-center gap-1 bg-muted/50 rounded-lg p-1', className)}>
        {availableOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentView === option.value;
          return (
            <Button
              key={option.value}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(option.value)}
              className={cn(
                'h-8 px-3 gap-2',
                isActive && 'bg-primary text-primary-foreground'
              )}
              title={option.description}
            >
              <Icon className="h-4 w-4" />
              {showLabel && <span className="text-xs">{option.label}</span>}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-9 gap-2', className)}
          title={`תצוגה נוכחית: ${currentOption.label}`}
        >
          <CurrentIcon className="h-4 w-4" />
          {showLabel && <span className="hidden sm:inline">{currentOption.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          בחר תצוגה
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentView === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onViewChange(option.value)}
              className={cn(
                'gap-2 cursor-pointer',
                isActive && 'bg-primary/10 text-primary font-medium'
              )}
            >
              <Icon className="h-4 w-4" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {option.label}
                  {isActive && <CheckCircle2 className="h-3 w-3" />}
                </div>
                {option.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook for managing view state with localStorage
export function useViewMode(storageKey: string, defaultView: ViewMode = 'cards') {
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return (saved as ViewMode) || defaultView;
    } catch {
      return defaultView;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, viewMode);
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  }, [viewMode, storageKey]);

  return [viewMode, setViewMode] as const;
}

// Grid View Component
interface GridViewProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function GridView<T>({
  data,
  renderItem,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className,
  keyExtractor,
}: GridViewProps<T>) {
  // Using inline styles for grid because Tailwind doesn't support dynamic class names
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gap: `${gap * 0.25}rem`,
    gridTemplateColumns: `repeat(${columns.mobile}, minmax(0, 1fr))`,
  };

  return (
    <div
      className={cn('w-full', className)}
      style={gridStyle}
    >
      <style>{`
        @media (min-width: 640px) {
          .grid-view-responsive { grid-template-columns: repeat(${columns.tablet}, minmax(0, 1fr)) !important; }
        }
        @media (min-width: 1024px) {
          .grid-view-responsive { grid-template-columns: repeat(${columns.desktop}, minmax(0, 1fr)) !important; }
        }
      `}</style>
      <div className="grid-view-responsive" style={gridStyle}>
        {data.map((item, index) => (
          <div key={keyExtractor ? keyExtractor(item, index) : index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// List View Component
interface ListViewProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  divided?: boolean;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function ListView<T>({
  data,
  renderItem,
  divided = true,
  className,
  keyExtractor,
}: ListViewProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('p-8 text-center text-muted-foreground', className)}>
        אין נתונים להצגה
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {data.map((item, index) => (
        <div
          key={keyExtractor ? keyExtractor(item, index) : index}
          className={cn(
            'py-3 px-4',
            divided && index !== data.length - 1 && 'border-b border-border'
          )}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// Compact View Component
interface CompactViewProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function CompactView<T>({
  data,
  renderItem,
  className,
  keyExtractor,
}: CompactViewProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('p-8 text-center text-muted-foreground', className)}>
        אין נתונים להצגה
      </div>
    );
  }

  return (
    <div className={cn('space-y-1 p-2', className)}>
      {data.map((item, index) => (
        <div key={keyExtractor ? keyExtractor(item, index) : index} className="hover:bg-muted/50 transition-colors rounded">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
