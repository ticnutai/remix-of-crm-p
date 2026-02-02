import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarDays, List, LayoutGrid, CalendarRange, Table } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarViewType = 'month' | 'week' | 'list' | 'agenda' | 'schedule';

interface CalendarViewToggleProps {
  view: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

const views = [
  { value: 'month', label: 'חודשי', icon: CalendarDays },
  { value: 'week', label: 'שבועי', icon: CalendarRange },
  { value: 'list', label: 'רשימה', icon: List },
  { value: 'agenda', label: 'אג׳נדה', icon: LayoutGrid },
  { value: 'schedule', label: 'לו״ז', icon: Table },
] as const;

export function CalendarViewToggle({ view, onViewChange }: CalendarViewToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={view} 
      onValueChange={(v) => v && onViewChange(v as CalendarViewType)}
      className="bg-muted/50 p-1 rounded-xl border border-border/50"
    >
      {views.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className={cn(
            "gap-2 px-3 py-2 text-sm rounded-lg transition-all",
            "data-[state=on]:bg-[hsl(var(--navy))] data-[state=on]:text-white data-[state=on]:shadow-md",
            "hover:bg-accent/50"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden md:inline">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
