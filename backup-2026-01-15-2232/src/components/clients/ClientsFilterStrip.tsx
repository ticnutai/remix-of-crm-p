// Clients Filter Strip Component - e-control CRM Pro
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Layers,
  Calendar,
  Bell,
  CheckSquare,
  Users,
  X,
  ChevronDown,
  Filter,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ClientFilterState {
  stages: string[];
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'older';
  hasReminders: boolean | null;
  hasTasks: boolean | null;
  hasMeetings: boolean | null;
}

interface ClientStageDefinition {
  stage_id: string;
  stage_name: string;
  stage_icon: string | null;
}

interface ClientsFilterStripProps {
  filters: ClientFilterState;
  onFiltersChange: (filters: ClientFilterState) => void;
  clientsWithReminders: Set<string>;
  clientsWithTasks: Set<string>;
  clientsWithMeetings: Set<string>;
}

export function ClientsFilterStrip({
  filters,
  onFiltersChange,
  clientsWithReminders,
  clientsWithTasks,
  clientsWithMeetings,
}: ClientsFilterStripProps) {
  const [stageDefinitions, setStageDefinitions] = useState<ClientStageDefinition[]>([]);
  const [stagesDialogOpen, setStagesDialogOpen] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);

  // Fetch unique stages from all clients
  useEffect(() => {
    fetchStageDefinitions();
  }, []);

  const fetchStageDefinitions = async () => {
    try {
      // Get unique stages from client_stages table
      const { data, error } = await supabase
        .from('client_stages')
        .select('stage_id, stage_name, stage_icon')
        .order('sort_order');

      if (error) throw error;

      // Get unique stages by stage_id
      const uniqueStages = data?.reduce((acc, stage) => {
        if (!acc.find(s => s.stage_id === stage.stage_id)) {
          acc.push(stage);
        }
        return acc;
      }, [] as ClientStageDefinition[]) || [];

      setStageDefinitions(uniqueStages);
    } catch (error) {
      console.error('Error fetching stage definitions:', error);
    }
  };

  const toggleStage = (stageId: string) => {
    const newStages = filters.stages.includes(stageId)
      ? filters.stages.filter(s => s !== stageId)
      : [...filters.stages, stageId];
    onFiltersChange({ ...filters, stages: newStages });
  };

  const clearStages = () => {
    onFiltersChange({ ...filters, stages: [] });
  };

  const selectAllStages = () => {
    onFiltersChange({ ...filters, stages: stageDefinitions.map(s => s.stage_id) });
  };

  const setDateFilter = (value: ClientFilterState['dateFilter']) => {
    onFiltersChange({ ...filters, dateFilter: value });
    setDateDialogOpen(false);
  };

  const toggleHasReminders = () => {
    const newValue = filters.hasReminders === true ? null : true;
    onFiltersChange({ ...filters, hasReminders: newValue });
  };

  const toggleHasTasks = () => {
    const newValue = filters.hasTasks === true ? null : true;
    onFiltersChange({ ...filters, hasTasks: newValue });
  };

  const toggleHasMeetings = () => {
    const newValue = filters.hasMeetings === true ? null : true;
    onFiltersChange({ ...filters, hasMeetings: newValue });
  };

  const hasActiveFilters = 
    filters.stages.length > 0 || 
    filters.dateFilter !== 'all' || 
    filters.hasReminders !== null || 
    filters.hasTasks !== null || 
    filters.hasMeetings !== null;

  const clearAllFilters = () => {
    onFiltersChange({
      stages: [],
      dateFilter: 'all',
      hasReminders: null,
      hasTasks: null,
      hasMeetings: null,
    });
  };

  const dateFilterLabels = {
    all: 'כל התאריכים',
    today: 'היום',
    week: 'השבוע',
    month: 'החודש',
    older: 'ישן יותר',
  };

  return (
    <div 
      dir="rtl"
      style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '12px 16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {/* Filter Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
          <Filter style={{ width: '18px', height: '18px', color: '#64748b' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>סינון:</span>
        </div>

        {/* Stages Filter - Popover */}
        <Popover open={stagesDialogOpen} onOpenChange={setStagesDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 h-9",
                filters.stages.length > 0 && "bg-[#1e3a5f] text-white border-[#1e3a5f] hover:bg-[#2d4a6f] hover:text-white"
              )}
            >
              <Layers className="h-4 w-4" />
              שלבים
              {filters.stages.length > 0 && (
                <Badge variant="secondary" className="mr-1 bg-amber-500 text-white">
                  {filters.stages.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[350px] p-0" 
            dir="rtl" 
            align="end"
            onEscapeKeyDown={() => setStagesDialogOpen(false)}
          >
            <div className="p-4 border-b">
              <div className="flex flex-row-reverse items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-[#d4a843]" />
                <h3 className="font-semibold">סינון לפי שלבים</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-auto"
                  onClick={() => setStagesDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-row-reverse gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={selectAllStages}>
                  בחר הכל
                </Button>
                <Button variant="outline" size="sm" onClick={clearStages}>
                  נקה הכל
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-3">
                {stageDefinitions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין שלבים מוגדרים
                  </p>
                ) : (
                  stageDefinitions.map((stage) => (
                    <div
                      key={stage.stage_id}
                      className={cn(
                        "flex flex-row-reverse items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        filters.stages.includes(stage.stage_id)
                          ? "bg-[#1e3a5f]/10 border-[#1e3a5f]"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => toggleStage(stage.stage_id)}
                    >
                      <Checkbox
                        checked={filters.stages.includes(stage.stage_id)}
                        onCheckedChange={() => toggleStage(stage.stage_id)}
                      />
                      <span className="font-medium text-[#1e3a5f] flex-1">
                        {stage.stage_name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Date Filter - Dialog */}
        {/* Date Filter - Popover */}
        <Popover open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 h-9",
                filters.dateFilter !== 'all' && "bg-[#1e3a5f] text-white border-[#1e3a5f] hover:bg-[#2d4a6f] hover:text-white"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              {dateFilterLabels[filters.dateFilter]}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[280px] p-0" 
            dir="rtl" 
            align="end"
            onEscapeKeyDown={() => setDateDialogOpen(false)}
          >
            <div className="p-3 border-b">
              <div className="flex flex-row-reverse items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#d4a843]" />
                <h3 className="font-semibold">סינון לפי תאריך יצירה</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-auto"
                  onClick={() => setDateDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {Object.entries(dateFilterLabels).map(([value, label]) => (
                <Button
                  key={value}
                  variant={filters.dateFilter === value ? "default" : "outline"}
                  className={cn(
                    "w-full",
                    filters.dateFilter === value && "bg-[#1e3a5f]"
                  )}
                  onClick={() => {
                    setDateFilter(value as ClientFilterState['dateFilter']);
                    setDateDialogOpen(false);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Has Reminders Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleHasReminders}
          className={cn(
            "gap-2 h-9",
            filters.hasReminders === true && "bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:text-white"
          )}
        >
          <Bell className="h-4 w-4" />
          תזכורות
          <Badge variant="secondary" className="mr-1 bg-orange-100 text-orange-700">
            {clientsWithReminders.size}
          </Badge>
        </Button>

        {/* Has Tasks Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleHasTasks}
          className={cn(
            "gap-2 h-9",
            filters.hasTasks === true && "bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:text-white"
          )}
        >
          <CheckSquare className="h-4 w-4" />
          משימות
          <Badge variant="secondary" className="mr-1 bg-blue-100 text-blue-700">
            {clientsWithTasks.size}
          </Badge>
        </Button>

        {/* Has Meetings Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleHasMeetings}
          className={cn(
            "gap-2 h-9",
            filters.hasMeetings === true && "bg-green-500 text-white border-green-500 hover:bg-green-600 hover:text-white"
          )}
        >
          <Users className="h-4 w-4" />
          פגישות
          <Badge variant="secondary" className="mr-1 bg-green-100 text-green-700">
            {clientsWithMeetings.size}
          </Badge>
        </Button>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-1 h-9 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
            נקה פילטרים
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {filters.stages.length > 0 && (
            <Badge variant="secondary" className="bg-[#1e3a5f]/10 text-[#1e3a5f]">
              {filters.stages.length} שלבים נבחרו
            </Badge>
          )}
          {filters.dateFilter !== 'all' && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {dateFilterLabels[filters.dateFilter]}
            </Badge>
          )}
          {filters.hasReminders === true && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              עם תזכורות
            </Badge>
          )}
          {filters.hasTasks === true && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              עם משימות
            </Badge>
          )}
          {filters.hasMeetings === true && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              עם פגישות
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
