import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { List, CalendarDays, LayoutGrid, Columns3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewType = 'list' | 'calendar' | 'grid' | 'kanban' | 'timeline';

interface TasksViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

const views = [
  { value: 'list', label: 'רשימה', icon: List },
  { value: 'calendar', label: 'לוח שנה', icon: CalendarDays },
  { value: 'grid', label: 'רשת', icon: LayoutGrid },
  { value: 'kanban', label: 'קנבן', icon: Columns3 },
  { value: 'timeline', label: 'ציר זמן', icon: Clock },
] as const;

export function TasksViewToggle({ view, onViewChange }: TasksViewToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={view} 
      onValueChange={(v) => v && onViewChange(v as ViewType)}
      className="bg-muted/50 p-1 rounded-xl"
    >
      {views.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className={cn(
            "gap-2 px-3 py-2 text-sm rounded-lg transition-all",
            "data-[state=on]:bg-background data-[state=on]:shadow-sm",
            "data-[state=on]:text-[hsl(var(--navy))]"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden md:inline">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
