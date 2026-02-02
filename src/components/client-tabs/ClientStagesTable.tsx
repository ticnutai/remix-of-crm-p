// ClientStagesTable - Table view for client stages and tasks
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  Circle, 
  Edit, 
  Trash2, 
  Bell,
  Filter,
  Loader2,
  Search,
  MoreHorizontal,
  CalendarIcon,
  X,
  Palette,
  Type,
  Bold,
  Timer,
  Play,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientStages, ClientStageTask } from '@/hooks/useClientStages';
import { AddReminderDialog } from '@/components/reminders/AddReminderDialog';
import { StageTaskActionsPopup, StageTaskIndicator } from './StageTaskActionsPopup';
import { DayCounterCell } from '@/components/tables/DayCounterCell';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

// Predefined colors for background and text
const BACKGROUND_COLORS = [
  { value: null, label: 'ללא', color: 'transparent' },
  { value: '#fef3c7', label: 'צהוב', color: '#fef3c7' },
  { value: '#dcfce7', label: 'ירוק', color: '#dcfce7' },
  { value: '#dbeafe', label: 'כחול', color: '#dbeafe' },
  { value: '#fce7f3', label: 'ורוד', color: '#fce7f3' },
  { value: '#fed7aa', label: 'כתום', color: '#fed7aa' },
  { value: '#e9d5ff', label: 'סגול', color: '#e9d5ff' },
  { value: '#fecaca', label: 'אדום', color: '#fecaca' },
  { value: '#d1d5db', label: 'אפור', color: '#d1d5db' },
];

const TEXT_COLORS = [
  { value: null, label: 'רגיל', color: 'inherit' },
  { value: '#dc2626', label: 'אדום', color: '#dc2626' },
  { value: '#16a34a', label: 'ירוק', color: '#16a34a' },
  { value: '#2563eb', label: 'כחול', color: '#2563eb' },
  { value: '#d97706', label: 'כתום', color: '#d97706' },
  { value: '#9333ea', label: 'סגול', color: '#9333ea' },
  { value: '#0891b2', label: 'טורקיז', color: '#0891b2' },
];

// Predefined target days for common task types
const TARGET_DAYS_OPTIONS = [
  { value: 7, label: '7 ימי עבודה' },
  { value: 14, label: '14 ימי עבודה' },
  { value: 21, label: '21 ימי עבודה' },
  { value: 30, label: '30 ימי עבודה' },
  { value: 45, label: '45 ימי עבודה (בקרה מרחבית)' },
  { value: 60, label: '60 ימי עבודה' },
  { value: 90, label: '90 ימי עבודה' },
];

interface ClientStagesTableProps {
  clientId: string;
}

export function ClientStagesTable({ clientId }: ClientStagesTableProps) {
  const { 
    stages, 
    loading, 
    toggleTask, 
    updateTask,
    updateTaskCompletedDate,
    updateTaskStyle,
    startTaskTimer,
    stopTaskTimer,
    deleteTask,
  } = useClientStages(clientId);
  
  const { profile } = useAuth();
  const isManager = profile?.role === 'admin' || profile?.role === 'manager';
  
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState<{ taskId: string; title: string } | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Flatten all tasks with stage info
  const allTasks = useMemo(() => {
    const tasks: (ClientStageTask & { stageName: string; stageIcon: string | null; stageOrder: number })[] = [];
    
    stages.forEach(stage => {
      stage.tasks?.forEach(task => {
        tasks.push({
          ...task,
          stageName: stage.stage_name,
          stageIcon: stage.stage_icon,
          stageOrder: stage.sort_order,
        });
      });
    });

    // Sort by stage order, then by task sort_order
    return tasks.sort((a, b) => {
      if (a.stageOrder !== b.stageOrder) return a.stageOrder - b.stageOrder;
      return a.sort_order - b.sort_order;
    });
  }, [stages]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      // Stage filter
      if (filterStage !== 'all' && task.stage_id !== filterStage) return false;
      
      // Status filter
      if (filterStatus === 'completed' && !task.completed) return false;
      if (filterStatus === 'pending' && task.completed) return false;
      
      // Search filter
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      return true;
    });
  }, [allTasks, filterStage, filterStatus, searchQuery]);

  const handleUpdateTask = async (taskId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    await updateTask(taskId, newTitle);
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
      await deleteTask(taskId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border border-[hsl(222,47%,25%)]/50">
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg">טבלת משימות שלבים</CardTitle>
          
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש משימה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 h-9 w-48 text-right"
              />
            </div>

            {/* Stage Filter */}
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="h-9 w-40">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="כל השלבים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל השלבים</SelectItem>
                {stages.map(stage => (
                  <SelectItem key={stage.stage_id} value={stage.stage_id}>
                    {stage.stage_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="pending">בתהליך</SelectItem>
                <SelectItem value="completed">הושלם</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="text-right w-36">שלב</TableHead>
                <TableHead className="text-right">משימה</TableHead>
                <TableHead className="text-center w-24">סטטוס</TableHead>
                <TableHead className="text-center w-40">ימי עבודה</TableHead>
                <TableHead className="text-center w-32">תאריך השלמה</TableHead>
                <TableHead className="text-center w-24">קשורים</TableHead>
                <TableHead className="text-center w-32">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    {allTasks.length === 0 ? 'אין משימות' : 'לא נמצאו משימות התואמות לחיפוש'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task, index) => (
                  <ContextMenu key={task.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow 
                        className={cn(
                          "transition-colors cursor-context-menu",
                          task.completed && !task.background_color && "bg-green-50/50 dark:bg-green-950/10"
                        )}
                        style={{ 
                          backgroundColor: task.background_color || undefined,
                        }}
                      >
                        <TableCell className="text-center text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-xs",
                              task.stageOrder === 0 && "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20"
                            )}
                          >
                            {task.stageName}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          {editingTask?.taskId === task.id ? (
                            <Input
                              value={editingTask.title}
                              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  handleUpdateTask(task.id, editingTask.title);
                                }
                              }}
                              onBlur={() => handleUpdateTask(task.id, editingTask.title)}
                              className="h-8 text-right flex-1"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className={cn(
                                task.completed && "line-through text-muted-foreground",
                                task.is_bold && "font-bold"
                              )}
                              style={{ color: task.text_color || undefined }}
                            >
                              {task.title}
                            </span>
                          )}
                        </TableCell>
                    
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => toggleTask(task.id)}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    
                    {/* Working Days Timer Cell */}
                    <TableCell className="text-center">
                      {task.started_at && task.target_working_days ? (
                        <div className="flex items-center justify-center gap-1">
                          <DayCounterCell 
                            startDate={task.started_at}
                            config={{ targetDays: task.target_working_days }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-destructive"
                            onClick={() => stopTaskTimer(task.id)}
                            title="עצור טיימר"
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-primary"
                            >
                              <Timer className="h-4 w-4 ml-1" />
                              <span className="text-xs">הפעל</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2" align="center">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-center mb-2">בחר ימי יעד</p>
                              {TARGET_DAYS_OPTIONS.map(option => (
                                <Button
                                  key={option.value}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-xs h-7"
                                  onClick={() => startTaskTimer(task.id, option.value)}
                                >
                                  <Play className="h-3 w-3 ml-2 text-green-600" />
                                  {option.label}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-center text-sm">
                      {isManager ? (
                        <Popover open={editingDate === task.id} onOpenChange={(open) => setEditingDate(open ? task.id : null)}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-8 px-2 text-sm font-normal hover:bg-muted",
                                task.completed && task.completed_at && "text-green-600 dark:text-green-400"
                              )}
                            >
                              {task.completed && task.completed_at ? (
                                <>
                                  {format(new Date(task.completed_at), 'dd/MM/yyyy', { locale: he })}
                                  <CalendarIcon className="h-3 w-3 mr-1 opacity-50" />
                                </>
                              ) : (
                                <>
                                  <span className="text-muted-foreground">-</span>
                                  <CalendarIcon className="h-3 w-3 mr-1 opacity-50" />
                                </>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="center">
                            <div className="p-2 border-b flex items-center justify-between">
                              <span className="text-sm font-medium">בחר תאריך</span>
                              {task.completed_at && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                  onClick={() => {
                                    updateTaskCompletedDate(task.id, null);
                                    setEditingDate(null);
                                  }}
                                >
                                  <X className="h-3 w-3 ml-1" />
                                  נקה
                                </Button>
                              )}
                            </div>
                            <Calendar
                              mode="single"
                              selected={task.completed_at ? parseISO(task.completed_at) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  updateTaskCompletedDate(task.id, date.toISOString());
                                }
                                setEditingDate(null);
                              }}
                              locale={he}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      ) : (
                        task.completed && task.completed_at ? (
                          <span className="text-green-600 dark:text-green-400">
                            {format(new Date(task.completed_at), 'dd/MM/yyyy', { locale: he })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )
                      )}
                    </TableCell>
                    
                    {/* Linked Items Indicator */}
                    <TableCell className="text-center">
                      <StageTaskIndicator 
                        stageTaskId={task.id} 
                        clientId={clientId}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTask({ taskId: task.id, title: task.title })}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-7 w-7 p-0 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {/* Actions Popup with Tabs */}
                        <StageTaskActionsPopup
                          stageTaskId={task.id}
                          stageTaskTitle={task.title}
                          clientId={clientId}
                          trigger={
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 hover:text-primary"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <AddReminderDialog
                          entityType="client_stage_task"
                          entityId={task.id}
                          trigger={
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 hover:text-primary"
                            >
                              <Bell className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      {/* Background Color Submenu */}
                      <ContextMenuSub>
                        <ContextMenuSubTrigger className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          <span>צבע רקע</span>
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-40">
                          {BACKGROUND_COLORS.map((color) => (
                            <ContextMenuItem 
                              key={color.value || 'none'} 
                              onClick={() => updateTaskStyle(task.id, { background_color: color.value })}
                              className="flex items-center gap-2"
                            >
                              <div 
                                className={cn(
                                  "h-4 w-4 rounded border",
                                  !color.value && "bg-background"
                                )}
                                style={{ backgroundColor: color.value || undefined }}
                              />
                              <span>{color.label}</span>
                              {task.background_color === color.value && (
                                <CheckCircle2 className="h-3 w-3 mr-auto text-green-600" />
                              )}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      
                      {/* Text Color Submenu */}
                      <ContextMenuSub>
                        <ContextMenuSubTrigger className="flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          <span>צבע טקסט</span>
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-40">
                          {TEXT_COLORS.map((color) => (
                            <ContextMenuItem 
                              key={color.value || 'none'} 
                              onClick={() => updateTaskStyle(task.id, { text_color: color.value })}
                              className="flex items-center gap-2"
                            >
                              <div 
                                className={cn(
                                  "h-4 w-4 rounded border flex items-center justify-center",
                                  !color.value && "bg-background"
                                )}
                                style={{ backgroundColor: color.value || undefined }}
                              >
                                <span className="text-[8px] font-bold" style={{ color: color.value ? '#fff' : '#000' }}>A</span>
                              </div>
                              <span>{color.label}</span>
                              {task.text_color === color.value && (
                                <CheckCircle2 className="h-3 w-3 mr-auto text-green-600" />
                              )}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      
                      <ContextMenuSeparator />
                      
                      {/* Bold Toggle */}
                      <ContextMenuItem 
                        onClick={() => updateTaskStyle(task.id, { is_bold: !task.is_bold })}
                        className="flex items-center gap-2"
                      >
                        <Bold className="h-4 w-4" />
                        <span>טקסט מודגש</span>
                        {task.is_bold && (
                          <CheckCircle2 className="h-3 w-3 mr-auto text-green-600" />
                        )}
                      </ContextMenuItem>
                      
                      <ContextMenuSeparator />
                      
                      {/* Timer Submenu */}
                      <ContextMenuSub>
                        <ContextMenuSubTrigger className="flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          <span>טיימר ימי עבודה</span>
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48">
                          {task.started_at ? (
                            <ContextMenuItem 
                              onClick={() => stopTaskTimer(task.id)}
                              className="flex items-center gap-2 text-destructive"
                            >
                              <Square className="h-4 w-4" />
                              <span>עצור טיימר</span>
                            </ContextMenuItem>
                          ) : (
                            TARGET_DAYS_OPTIONS.map(option => (
                              <ContextMenuItem 
                                key={option.value}
                                onClick={() => startTaskTimer(task.id, option.value)}
                                className="flex items-center gap-2"
                              >
                                <Play className="h-4 w-4 text-green-600" />
                                <span>{option.label}</span>
                              </ContextMenuItem>
                            ))
                          )}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    </ContextMenuContent>
                  </ContextMenu>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        {/* Summary Footer */}
        <div className="p-3 border-t bg-muted/30 flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            סה"כ: {filteredTasks.length} משימות
            {filterStage !== 'all' || filterStatus !== 'all' || searchQuery ? ` (מסוננות מ-${allTasks.length})` : ''}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-600">
              <CheckCircle2 className="h-4 w-4 inline ml-1" />
              {filteredTasks.filter(t => t.completed).length} הושלמו
            </span>
            <span className="text-muted-foreground">
              <Circle className="h-4 w-4 inline ml-1" />
              {filteredTasks.filter(t => !t.completed).length} בתהליך
            </span>
            <span className="text-amber-600">
              <Timer className="h-4 w-4 inline ml-1" />
              {filteredTasks.filter(t => t.started_at && t.target_working_days).length} עם טיימר
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
