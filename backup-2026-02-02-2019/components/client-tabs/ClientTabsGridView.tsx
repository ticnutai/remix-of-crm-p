// Grid view showing all custom tabs for a client
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Database,
  Users,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  Table as TableIcon,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Grid3X3,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClientCustomTab } from '@/hooks/useClientCustomTabs';
import { supabase } from '@/integrations/supabase/client';

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  Database,
  Users,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  Table: TableIcon,
  FolderKanban,
};

interface ClientTabsGridViewProps {
  tabs: ClientCustomTab[];
  clientId: string;
  onTabClick?: (tabId: string) => void;
}

interface TabStats {
  tabId: string;
  count: number;
  lastUpdated?: string;
}

export function ClientTabsGridView({ tabs, clientId, onTabClick }: ClientTabsGridViewProps) {
  const [tabStats, setTabStats] = useState<Map<string, TabStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Fetch stats for all tabs
  const fetchStats = useCallback(async () => {
    if (!tabs.length || !clientId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const statsMap = new Map<string, TabStats>();

    try {
      for (const tab of tabs) {
        // Fetch from client_tab_data
        const { data, error } = await supabase
          .from('client_tab_data')
          .select('id, created_at')
          .eq('tab_id', tab.id)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          statsMap.set(tab.id, {
            tabId: tab.id,
            count: data.length,
            lastUpdated: data[0]?.created_at,
          });
        } else {
          statsMap.set(tab.id, { tabId: tab.id, count: 0 });
        }
      }
    } catch (error) {
      console.error('Error fetching tab stats:', error);
    }

    setTabStats(statsMap);
    setIsLoading(false);
  }, [tabs, clientId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Toggle tab expansion
  const toggleTab = (tabId: string) => {
    setExpandedTabs(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }
      return next;
    });
  };

  // Grid size classes
  const gridClasses = {
    small: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
    medium: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    large: 'grid-cols-1 md:grid-cols-2',
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>אין טאבים מותאמים</p>
        <p className="text-sm">הוסף טאבים חדשים כדי להציג נתונים נוספים</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with grid controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">תצוגת רשת - כל הטאבים</h2>
          <p className="text-sm text-muted-foreground">
            צפה בכל הטאבים המותאמים במקום אחד
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">גודל:</span>
          <div className="flex border border-border rounded-lg overflow-hidden bg-background">
            <Button
              variant={gridSize === 'small' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setGridSize('small')}
              className="rounded-none h-8 px-3"
              title="קטן"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant={gridSize === 'medium' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setGridSize('medium')}
              className="rounded-none h-8 px-3"
              title="בינוני"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={gridSize === 'large' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setGridSize('large')}
              className="rounded-none h-8 px-3"
              title="גדול"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid of tabs */}
      <div className={cn('grid gap-4', gridClasses[gridSize])}>
        {tabs.map(tab => {
          const stats = tabStats.get(tab.id);
          const IconComponent = ICON_MAP[tab.icon || 'Database'] || Database;
          const hasData = (stats?.count || 0) > 0;
          const isExpanded = expandedTabs.has(tab.id);

          return (
            <Card
              key={tab.id}
              className={cn(
                'border-2 transition-all duration-300 cursor-pointer group',
                'hover:shadow-lg hover:-translate-y-1',
                hasData
                  ? 'border-[hsl(45,70%,50%)]/70 bg-gradient-to-br from-[hsl(45,70%,50%)]/5 to-transparent'
                  : 'border-border/50 hover:border-primary/50'
              )}
              onClick={() => onTabClick?.(tab.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div
                      className={cn(
                        'p-3 rounded-xl shadow-sm transition-transform group-hover:scale-110',
                        hasData
                          ? 'bg-gradient-to-br from-[hsl(45,70%,45%)] to-[hsl(45,70%,55%)]'
                          : 'bg-gradient-to-br from-muted to-muted/50'
                      )}
                    >
                      <IconComponent
                        className={cn('h-6 w-6', hasData ? 'text-white' : 'text-muted-foreground')}
                      />
                    </div>
                    <div className="text-right">
                      <CardTitle className="text-lg font-bold">{tab.display_name}</CardTitle>
                      {tab.data_type && (
                        <CardDescription className="text-sm">
                          {tab.data_type.display_name}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {hasData && (
                    <Badge className="bg-[hsl(45,70%,50%)] text-white text-lg font-bold px-3 py-1">
                      {stats?.count}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(
                    'font-medium',
                    hasData ? 'text-[hsl(45,70%,45%)]' : 'text-muted-foreground'
                  )}>
                    {hasData ? `${stats?.count} רשומות` : 'ריק - לחץ להוספה'}
                  </span>
                  {stats?.lastUpdated && (
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      {new Date(stats.lastUpdated).toLocaleDateString('he-IL')}
                    </span>
                  )}
                </div>

                {/* Feature badges */}
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {tab.show_summary && (
                    <Badge variant="outline" className="text-xs border-sky-200 text-sky-600 bg-sky-50">
                      📊 סיכום
                    </Badge>
                  )}
                  {tab.show_analysis && (
                    <Badge variant="outline" className="text-xs border-violet-200 text-violet-600 bg-violet-50">
                      🔍 ניתוח
                    </Badge>
                  )}
                  {tab.allow_files && (
                    <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-600 bg-emerald-50">
                      📁 קבצים
                    </Badge>
                  )}
                  {tab.is_global && (
                    <Badge variant="outline" className="text-xs border-amber-200 text-amber-600 bg-amber-50">
                      🌐 גלובלי
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary stats card */}
      <Card className="bg-gradient-to-l from-muted/50 to-background border-2 border-dashed">
        <CardContent className="py-5">
          <div className="flex items-center justify-between flex-row-reverse">
            <div className="flex items-center gap-6 flex-row-reverse">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{tabs.length}</p>
                <p className="text-xs text-muted-foreground">טאבים</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-[hsl(45,70%,50%)]">
                  {Array.from(tabStats.values()).reduce((sum, s) => sum + s.count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">רשומות</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-500">
                  {Array.from(tabStats.values()).filter(s => s.count > 0).length}
                </p>
                <p className="text-xs text-muted-foreground">עם נתונים</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => fetchStats()} className="gap-2">
              <Clock className="h-4 w-4" />
              רענן
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
