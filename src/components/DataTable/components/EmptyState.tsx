import React from 'react';
import { FileX, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({
  icon,
  title = 'אין נתונים להצגה',
  description = 'לא נמצאו תוצאות',
  hasFilters,
  onClearFilters,
}: EmptyStateProps) {
  const defaultIcon = hasFilters ? (
    <Filter className="h-16 w-16 text-muted-foreground/50" />
  ) : (
    <FileX className="h-16 w-16 text-muted-foreground/50" />
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="mb-4">{icon || defaultIcon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      {hasFilters && onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          נקה סינון ונסה שוב
        </Button>
      )}
    </div>
  );
}
