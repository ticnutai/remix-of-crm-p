// Dynamic Stats Widget - Customizable stats cards based on client data columns 
import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Filter, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { ThemedWidget } from './ThemedWidget';
import { useDashboardTheme } from './DashboardThemeProvider';
import { cn } from '@/lib/utils';

interface DynamicStatConfig {
  id: string;
  columnKey: string;
  columnName: string;
  tableName: string;
  filter?: { column: string; value: string };
}

interface ColumnOption {
  key: string;
  name: string;
  type: string;
  options?: string[];
}

const STORAGE_KEY = 'dashboard-dynamic-stats';

// Predefined columns from clients table
const clientColumns: ColumnOption[] = [
  { key: 'status', name: 'סטטוס', type: 'select', options: ['active', 'inactive', 'pending'] },
  { key: 'stage', name: 'שלב', type: 'text' },
  { key: 'source', name: 'מקור', type: 'text' },
  { key: 'preferred_contact', name: 'אמצעי קשר מועדף', type: 'text' },
];

const statusLabels: Record<string, string> = {
  active: 'פעיל',
  inactive: 'לא פעיל',
  pending: 'ממתין',
};

interface DynamicStatsWidgetProps {
  widgetId?: string;
}

export function DynamicStatsWidget({ widgetId = 'dynamic-stats' }: DynamicStatsWidgetProps) {
  const { themeConfig, currentTheme } = useDashboardTheme();
  const [stats, setStats] = useState<DynamicStatConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [columnData, setColumnData] = useState<Record<string, Record<string, number>>>({});
  const [customColumns, setCustomColumns] = useState<ColumnOption[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const WIDGET_STORAGE_KEY = `dashboard-dynamic-stats-${widgetId}`;

  // Load saved stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(WIDGET_STORAGE_KEY);
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch {
        setStats([]);
      }
    }
  }, [WIDGET_STORAGE_KEY]);

  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(stats));
  }, [stats, WIDGET_STORAGE_KEY]);

  // Load custom columns from database
  useEffect(() => {
    const loadCustomColumns = async () => {
      const { data, error } = await supabase
        .from('table_custom_columns')
        .select('*')
        .eq('table_name', 'clients')
        .in('column_type', ['select', 'multi_select', 'data_type']);

      if (!error && data) {
        const cols: ColumnOption[] = data.map(col => ({
          key: col.column_key,
          name: col.column_name,
          type: col.column_type,
          options: col.column_options as string[] | undefined,
        }));
        setCustomColumns(cols);
      }
    };

    loadCustomColumns();
  }, []);

  // Fetch data for all stats
  useEffect(() => {
    const fetchData = async () => {
      const newData: Record<string, Record<string, number>> = {};

      for (const stat of stats) {
        const { data, error } = await supabase
          .from('clients')
          .select(stat.columnKey);

        if (!error && data) {
          const counts: Record<string, number> = {};
          data.forEach((row: any) => {
            let value = row[stat.columnKey];
            // Handle custom_data JSON field
            if (!value && row.custom_data) {
              value = row.custom_data[stat.columnKey];
            }
            if (value) {
              const key = String(value);
              counts[key] = (counts[key] || 0) + 1;
            }
          });
          newData[stat.id] = counts;
        }
      }

      setColumnData(newData);
    };

    if (stats.length > 0) {
      fetchData();
    }
  }, [stats]);

  const allColumns = [...clientColumns, ...customColumns];

  const handleAddStat = () => {
    if (!selectedColumn) return;

    const column = allColumns.find(c => c.key === selectedColumn);
    if (!column) return;

    const newStat: DynamicStatConfig = {
      id: `stat-${Date.now()}`,
      columnKey: selectedColumn,
      columnName: column.name,
      tableName: 'clients',
    };

    if (editingId) {
      setStats(prev => prev.map(s => s.id === editingId ? newStat : s));
      setEditingId(null);
    } else {
      setStats(prev => [...prev, newStat]);
    }

    setSelectedColumn('');
    setDialogOpen(false);
  };

  const handleRemoveStat = (id: string) => {
    setStats(prev => prev.filter(s => s.id !== id));
    delete columnData[id];
  };

  const handleEditStat = (stat: DynamicStatConfig) => {
    setEditingId(stat.id);
    setSelectedColumn(stat.columnKey);
    setDialogOpen(true);
  };

  const isNavyGold = currentTheme === 'navy-gold';

  const getDisplayValue = (key: string): string => {
    return statusLabels[key] || key || 'ללא';
  };

  return (
    <ThemedWidget
      widgetId={widgetId as any}
      title={widgetId === 'dynamic-stats' ? 'סטטוס דינמי' : widgetId.replace('dynamic-stats-', 'סטטוס דינמי ')}
      titleIcon={<BarChart3 className="h-5 w-5" />}
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingId(null);
            setSelectedColumn('');
            setDialogOpen(true);
          }}
          className="h-8 gap-1 text-xs"
          title="הוסף כרטיס סטטוס"
        >
          <Plus className="h-4 w-4" />
          <span>הוסף</span>
        </Button>
      }
    >
      <div className="p-4" dir="rtl">
        {stats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">לחץ על + כדי להוסיף כרטיס סטטוס</p>
            <p className="text-xs mt-1">בחר עמודה מטבלת הלקוחות לצפייה בהתפלגות</p>
          </div>
        ) : (
          <>
            {/* Search and Filter */}
            <div className="mb-4 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="חיפוש לפי שם עמודה..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg pr-3 pl-3"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={categoryFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter('all')}
                  className="text-xs"
                >
                  הכל
                </Button>
                <Button
                  variant={categoryFilter === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter('system')}
                  className="text-xs"
                >
                  מערכת
                </Button>
                <Button
                  variant={categoryFilter === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter('custom')}
                  className="text-xs"
                >
                  מותאם
                </Button>
              </div>
            </div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats
                .filter(stat => {
                  // Search filter
                  if (searchQuery && !stat.columnName.includes(searchQuery)) {
                    return false;
                  }
                  // Category filter
                  if (categoryFilter === 'system') {
                    return clientColumns.some(c => c.key === stat.columnKey);
                  }
                  if (categoryFilter === 'custom') {
                    return customColumns.some(c => c.key === stat.columnKey);
                  }
                  return true;
                })
                .map(stat => (
                <div
                  key={stat.id}
                  className={cn(
                    "relative p-4 rounded-xl border transition-all hover:shadow-md group",
                    isNavyGold && "border-[hsl(45,80%,50%)] bg-[hsl(45,25%,95%)]"
                  )}
                  style={{
                    borderColor: !isNavyGold ? themeConfig.colors.border : undefined,
                    backgroundColor: !isNavyGold ? themeConfig.colors.statCardBg : undefined,
                  }}
                  onMouseEnter={() => setHoveredCard(stat.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Header with actions */}
                  <div className="flex items-center justify-between mb-3" dir="rtl">
                    <h4 className="font-semibold text-sm" style={{ color: themeConfig.colors.text }}>
                      {stat.columnName}
                    </h4>
                    <div className={cn(
                      "flex gap-1 transition-opacity",
                      hoveredCard === stat.id ? "opacity-100" : "opacity-0"
                    )}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEditStat(stat)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-destructive"
                        onClick={() => handleRemoveStat(stat.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Values */}
                  <div className="space-y-2" dir="rtl">
                  {columnData[stat.id] ? (
                    Object.entries(columnData[stat.id])
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([value, count]) => (
                        <div key={value} className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {getDisplayValue(value)}
                          </Badge>
                          <span 
                            className="font-bold text-lg"
                            style={{ color: themeConfig.colors.accent }}
                          >
                            {count}
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-2 text-muted-foreground text-sm">
                      טוען...
                    </div>
                  )}
                </div>

                {/* Total */}
                {columnData[stat.id] && (
                  <div className="mt-3 pt-2 border-t flex items-center justify-between" dir="rtl">
                    <span className="text-xs text-muted-foreground">סה"כ</span>
                    <span className="font-bold" style={{ color: themeConfig.colors.text }}>
                      {Object.values(columnData[stat.id]).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'ערוך כרטיס סטטוס' : 'הוסף כרטיס סטטוס'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">בחר עמודה</label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר עמודה להצגה" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    עמודות מערכת
                  </div>
                  {clientColumns.map(col => (
                    <SelectItem key={col.key} value={col.key}>
                      {col.name}
                    </SelectItem>
                  ))}
                  {customColumns.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                        עמודות מותאמות
                      </div>
                      {customColumns.map(col => (
                        <SelectItem key={col.key} value={col.key}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddStat}
              disabled={!selectedColumn}
              className="w-full"
            >
              {editingId ? 'עדכן' : 'הוסף'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ThemedWidget>
  );
}

export default DynamicStatsWidget;
