import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Phone, FolderOpen, Send, MapPin, Plus, Hash, Loader2, Bell, Pencil, Trash2, ListPlus, X, Maximize2, CheckCircle2, GripVertical, LayoutList, Table2, Settings2, ChevronUp, ChevronDown, Save, Copy, Layers, BookTemplate, Eye, Clipboard, ClipboardPaste, Palette, Type, Bold, Timer, Play, Square, CalendarIcon } from 'lucide-react';
import { TaskTitleWithConsultants } from '@/components/consultants/TaskTitleWithConsultants';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { DayCounterCell } from '@/components/tables/DayCounterCell';
import { cn } from '@/lib/utils';
import { useClientStages, ClientStage, ClientStageTask } from '@/hooks/useClientStages';
import { AddReminderDialog } from '@/components/reminders/AddReminderDialog';
import { StageTaskActionsPopup, StageTaskIndicator } from './StageTaskActionsPopup';
import { StageTimerDisplay, TaskTimerBadge } from './StageTimerDisplay';
import { SaveAsTemplateDialog, SaveAllStagesDialog, ApplyTemplateDialog, CopyStagesDialog } from './StageTemplateDialogs';
interface ClientStagesBoardProps {
  clientId: string;
  filterByFolderId?: string | null;
  filterByFolderName?: string;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{
  className?: string;
}>> = {
  Phone: Phone,
  FolderOpen: FolderOpen,
  Send: Send,
  MapPin: MapPin
};
const iconOptions = [{
  value: 'Phone',
  icon: Phone,
  label: 'טלפון'
}, {
  value: 'FolderOpen',
  icon: FolderOpen,
  label: 'תיקיה'
}, {
  value: 'Send',
  icon: Send,
  label: 'שליחה'
}, {
  value: 'MapPin',
  icon: MapPin,
  label: 'מיקום'
}];

// Predefined colors for background and text
const BACKGROUND_COLORS = [{
  value: null,
  label: 'ללא',
  color: 'transparent'
}, {
  value: '#fef3c7',
  label: 'צהוב',
  color: '#fef3c7'
}, {
  value: '#dcfce7',
  label: 'ירוק',
  color: '#dcfce7'
}, {
  value: '#dbeafe',
  label: 'כחול',
  color: '#dbeafe'
}, {
  value: '#fce7f3',
  label: 'ורוד',
  color: '#fce7f3'
}, {
  value: '#fed7aa',
  label: 'כתום',
  color: '#fed7aa'
}, {
  value: '#e9d5ff',
  label: 'סגול',
  color: '#e9d5ff'
}, {
  value: '#fecaca',
  label: 'אדום',
  color: '#fecaca'
}, {
  value: '#d1d5db',
  label: 'אפור',
  color: '#d1d5db'
}];
const TEXT_COLORS = [{
  value: null,
  label: 'רגיל',
  color: 'inherit'
}, {
  value: '#dc2626',
  label: 'אדום',
  color: '#dc2626'
}, {
  value: '#16a34a',
  label: 'ירוק',
  color: '#16a34a'
}, {
  value: '#2563eb',
  label: 'כחול',
  color: '#2563eb'
}, {
  value: '#d97706',
  label: 'כתום',
  color: '#d97706'
}, {
  value: '#9333ea',
  label: 'סגול',
  color: '#9333ea'
}, {
  value: '#0891b2',
  label: 'טורקיז',
  color: '#0891b2'
}];

// Predefined target days for common task types
const TARGET_DAYS_OPTIONS = [{
  value: 7,
  label: '7 ימי עבודה'
}, {
  value: 14,
  label: '14 ימי עבודה'
}, {
  value: 21,
  label: '21 ימי עבודה'
}, {
  value: 30,
  label: '30 ימי עבודה'
}, {
  value: 45,
  label: '45 ימי עבודה (בקרה מרחבית)'
}, {
  value: 60,
  label: '60 ימי עבודה'
}, {
  value: 90,
  label: '90 ימי עבודה'
}];

// Sortable Task Item Component
interface SortableTaskProps {
  task: ClientStageTask;
  stage: ClientStage;
  index: number;
  showTaskCount: boolean;
  clientId: string;
  editingTask: {
    stageId: string;
    taskId: string;
    title: string;
  } | null;
  setEditingTask: React.Dispatch<React.SetStateAction<{
    stageId: string;
    taskId: string;
    title: string;
  } | null>>;
  handleToggleTask: (task: ClientStageTask) => void;
  handleUpdateTask: (taskId: string, title: string) => void;
  handleDeleteTask: (taskId: string) => void;
  updateTaskStyle?: (taskId: string, style: {
    background_color?: string | null;
    text_color?: string | null;
    is_bold?: boolean;
  }) => void;
  updateTaskCompletedDate?: (taskId: string, date: string | null) => void;
  startTaskTimer?: (taskId: string, targetDays: number) => void;
  stopTaskTimer?: (taskId: string) => void;
  cycleTaskTimerStyle?: (taskId: string) => void;
}
function SortableTaskItem({
  task,
  stage,
  index,
  showTaskCount,
  clientId,
  editingTask,
  setEditingTask,
  handleToggleTask,
  handleUpdateTask,
  handleDeleteTask,
  updateTaskStyle,
  updateTaskCompletedDate,
  startTaskTimer,
  stopTaskTimer,
  cycleTaskTimerStyle
}: SortableTaskProps) {
  const [editingDate, setEditingDate] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: task.background_color || undefined
  };
  return <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={setNodeRef} style={style} className={cn("flex items-start gap-2 p-2 rounded-md transition-all group cursor-context-menu", task.completed && !task.background_color ? "bg-white dark:bg-gray-900 border border-[#85868C]" : !task.background_color && "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-transparent", isDragging && "shadow-lg ring-2 ring-primary/20")}>
      {/* Drag Handle */}
      <button {...attributes} {...listeners} className="shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none">
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Completion Date on the right for completed tasks */}
      {task.completed && task.completed_at && <span className="text-[10px] text-[#E8D1B4] shrink-0 font-medium">
          {new Date(task.completed_at).toLocaleDateString('he-IL')}
        </span>}

      {/* Task Number (if enabled) */}
      {showTaskCount && <Badge variant="outline" className="shrink-0 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
          {index + 1}
        </Badge>}

      {/* Completion Toggle - Green glowing checkmark when completed */}
      <button onClick={() => handleToggleTask(task)} className="shrink-0 mt-0.5 focus:outline-none">
        {task.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" style={{
            filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))'
          }} /> : <div className="h-5 w-5 rounded-full border-2 border-slate-300 hover:border-emerald-400 transition-colors" />}
      </button>
      
      {editingTask?.taskId === task.id ? <div className="flex-1 flex gap-2">
          <Input value={editingTask.title} onChange={e => setEditingTask({
            ...editingTask,
            title: e.target.value
          })} onKeyDown={e => {
            if (e.key === 'Enter') {
              handleUpdateTask(task.id, editingTask.title);
            } else if (e.key === 'Escape') {
              setEditingTask(null);
            }
          }} className="h-7 text-right text-sm" autoFocus />
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleUpdateTask(task.id, editingTask.title)}>
            שמור
          </Button>
        </div> : <div className="flex-1 min-w-0">
          <p className={cn("text-sm text-right break-words text-[#1a2c5f] dark:text-slate-200", task.completed && "line-through text-emerald-600 dark:text-emerald-400", task.is_bold && "font-bold")} style={{
            color: task.text_color || undefined
          }}>
            <TaskTitleWithConsultants taskId={task.id} title={task.title} />
          </p>
          {/* Day Counter - if timer is active - click to change style */}
          {Boolean(task.started_at && task.target_working_days) && <div className="flex items-center gap-1 mt-1">
              <TaskTimerBadge startedAt={task.started_at} targetDays={task.target_working_days} displayStyle={task.timer_display_style} onStyleChange={() => cycleTaskTimerStyle?.(task.id)} />
            </div>}
        </div>}

      {/* Task Actions - visible on hover */}
      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Linked Items Indicator - always visible if has links */}
        <div className="opacity-100">
          <StageTaskIndicator stageTaskId={task.id} clientId={clientId} />
        </div>
        <Button size="sm" variant="ghost" onClick={() => setEditingTask({
            stageId: stage.stage_id,
            taskId: task.id,
            title: task.title
          })} className="h-6 w-6 p-0">
          <Pencil className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)} className="h-6 w-6 p-0 hover:text-destructive">
          <Trash2 className="h-3 w-3" />
        </Button>
        <StageTaskActionsPopup stageTaskId={task.id} stageTaskTitle={task.title} clientId={clientId} trigger={<Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:text-primary">
              <Bell className="h-3 w-3" />
            </Button>} />
      </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {/* Background Color Submenu */}
        {updateTaskStyle && <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>צבע רקע</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40">
              {BACKGROUND_COLORS.map(color => <ContextMenuItem key={color.value || 'none'} onClick={() => updateTaskStyle(task.id, {
            background_color: color.value
          })} className="flex items-center gap-2">
                  <div className={cn("h-4 w-4 rounded border", !color.value && "bg-background")} style={{
              backgroundColor: color.value || undefined
            }} />
                  <span>{color.label}</span>
                  {task.background_color === color.value && <CheckCircle2 className="h-3 w-3 mr-auto text-green-600" />}
                </ContextMenuItem>)}
            </ContextMenuSubContent>
          </ContextMenuSub>}
        
        {/* Text Color Submenu */}
        {updateTaskStyle && <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span>צבע טקסט</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40">
              {TEXT_COLORS.map(color => <ContextMenuItem key={color.value || 'none'} onClick={() => updateTaskStyle(task.id, {
            text_color: color.value
          })} className="flex items-center gap-2">
                  <div className={cn("h-4 w-4 rounded border flex items-center justify-center", !color.value && "bg-background")} style={{
              backgroundColor: color.value || undefined
            }}>
                    <span className="text-[8px] font-bold" style={{
                color: color.value ? '#fff' : '#000'
              }}>A</span>
                  </div>
                  <span>{color.label}</span>
                  {task.text_color === color.value && <CheckCircle2 className="h-3 w-3 mr-auto text-green-600" />}
                </ContextMenuItem>)}
            </ContextMenuSubContent>
          </ContextMenuSub>}
        
        {updateTaskStyle && <ContextMenuSeparator />}
        
        {/* Bold Toggle */}
        {updateTaskStyle && <ContextMenuItem onClick={() => updateTaskStyle(task.id, {
        is_bold: !task.is_bold
      })} className="flex items-center gap-2">
            <Bold className="h-4 w-4" />
            <span>טקסט מודגש</span>
            {task.is_bold && <CheckCircle2 className="h-3 w-3 mr-auto text-green-600" />}
          </ContextMenuItem>}
        
        {/* Timer Submenu */}
        {(startTaskTimer || stopTaskTimer) && <>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span>טיימר ימי עבודה</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-56 p-2">
                {task.started_at && stopTaskTimer ? <ContextMenuItem onClick={() => stopTaskTimer(task.id)} className="flex items-center gap-2 text-destructive">
                    <Square className="h-4 w-4" />
                    <span>עצור טיימר</span>
                  </ContextMenuItem> : startTaskTimer && <div className="space-y-2">
                    {/* Predefined options - compact grid */}
                    <div className="grid grid-cols-2 gap-1">
                      {TARGET_DAYS_OPTIONS.slice(0, 6).map(option => <Button key={option.value} variant="ghost" size="sm" className="h-7 text-xs justify-center" onClick={() => startTaskTimer(task.id, option.value)}>
                          {option.value} ימים
                        </Button>)}
                    </div>
                    
                    {/* Custom days input */}
                    <div className="border-t pt-2">
                      <p className="text-xs text-muted-foreground mb-1 text-center">מספר ימים אישי:</p>
                      <div className="flex gap-1">
                        <Input type="number" min="1" max="365" placeholder="ימים" className="h-7 text-xs text-center" onClick={e => e.stopPropagation()} onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      const days = Number.parseInt((e.target as HTMLInputElement).value);
                      if (days > 0 && days <= 365) {
                        startTaskTimer(task.id, days);
                      }
                    }
                  }} />
                        <Button size="sm" className="h-7 px-2" onClick={e => {
                    e.stopPropagation();
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input?.value) {
                      const days = Number.parseInt(input.value);
                      if (days > 0 && days <= 365) {
                        startTaskTimer(task.id, days);
                      }
                    }
                  }}>
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>}
        
        {/* Completion Date */}
        {updateTaskCompletedDate && <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => setEditingDate(true)} className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>שנה תאריך ביצוע</span>
            </ContextMenuItem>
          </>}
        
        <ContextMenuSeparator />
        
        {/* Edit Task */}
        <ContextMenuItem onClick={() => setEditingTask({
        stageId: stage.stage_id,
        taskId: task.id,
        title: task.title
      })} className="flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          <span>עריכת משימה</span>
        </ContextMenuItem>
        
        {/* Delete Task */}
        <ContextMenuItem onClick={() => handleDeleteTask(task.id)} className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-4 w-4" />
          <span>מחיקת משימה</span>
        </ContextMenuItem>
      </ContextMenuContent>
      
      {/* Date Picker Dialog */}
      {editingDate && updateTaskCompletedDate && <Dialog open={editingDate} onOpenChange={setEditingDate}>
          <DialogContent className="sm:max-w-[350px]">
            <DialogHeader>
              <DialogTitle>בחר תאריך ביצוע</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center">
              <Calendar mode="single" selected={task.completed_at ? parseISO(task.completed_at) : undefined} onSelect={date => {
            if (date) {
              updateTaskCompletedDate(task.id, date.toISOString());
            }
            setEditingDate(false);
          }} locale={he} initialFocus />
              {task.completed_at && <Button variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => {
            updateTaskCompletedDate(task.id, null);
            setEditingDate(false);
          }}>
                  <X className="h-4 w-4 ml-1" />
                  נקה תאריך
                </Button>}
            </div>
          </DialogContent>
        </Dialog>}
    </ContextMenu>;
}

// Sortable Task Item for Expanded Dialog
interface SortableExpandedTaskProps {
  task: ClientStageTask;
  stageId: string;
  index: number;
  showTaskCount: boolean;
  clientId: string;
  setEditingTask: React.Dispatch<React.SetStateAction<{
    stageId: string;
    taskId: string;
    title: string;
  } | null>>;
  handleToggleTask: (task: ClientStageTask) => void;
  handleDeleteTask: (taskId: string) => void;
}
function SortableExpandedTaskItem({
  task,
  stageId,
  index,
  showTaskCount,
  clientId,
  setEditingTask,
  handleToggleTask,
  handleDeleteTask
}: SortableExpandedTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} className={cn("flex items-center gap-3 p-4 rounded-lg transition-all group", task.completed ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900" : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700", isDragging && "shadow-lg ring-2 ring-primary/20")}>
      {/* Drag Handle */}
      <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none">
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Completion Date on the right */}
      {task.completed && task.completed_at && <span className="text-xs text-green-600 dark:text-green-400 shrink-0 font-medium min-w-[70px]">
          {new Date(task.completed_at).toLocaleDateString('he-IL')}
        </span>}

      {/* Task Number */}
      {showTaskCount && <Badge variant="outline" className="shrink-0 h-6 w-6 p-0 flex items-center justify-center text-xs">
          {index + 1}
        </Badge>}

      {/* Completion Toggle - Green glowing checkmark when completed */}
      <button onClick={() => handleToggleTask(task)} className="shrink-0 focus:outline-none">
        {task.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" style={{
        filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))'
      }} /> : <div className="h-5 w-5 rounded-full border-2 border-slate-300 hover:border-emerald-400 transition-colors" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-base text-right text-[#1a2c5f] dark:text-slate-200 font-medium", task.completed && "line-through text-emerald-600 dark:text-emerald-400")}>
          <TaskTitleWithConsultants taskId={task.id} title={task.title} />
        </p>
      </div>

      {/* Task Actions */}
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Linked Items Indicator - always visible if has links */}
        <div className="opacity-100">
          <StageTaskIndicator stageTaskId={task.id} clientId={clientId} />
        </div>
        <Button size="sm" variant="ghost" onClick={() => setEditingTask({
        stageId,
        taskId: task.id,
        title: task.title
      })} className="h-8 w-8 p-0">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)} className="h-8 w-8 p-0 hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
        <StageTaskActionsPopup stageTaskId={task.id} stageTaskTitle={task.title} clientId={clientId} trigger={<Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-primary">
              <Bell className="h-4 w-4" />
            </Button>} />
      </div>
    </div>;
}

// Sortable Stage Item for Manage Stages Dialog
interface SortableStageItemProps {
  stage: ClientStage;
  index: number;
  isEditing: boolean;
  editingStage: {
    stageId: string;
    name: string;
    icon: string;
  } | null;
  setEditingStage: React.Dispatch<React.SetStateAction<{
    stageId: string;
    name: string;
    icon: string;
  } | null>>;
  handleUpdateStage: () => void;
  handleDeleteStage: (stageId: string) => void;
  handleMoveStage: (stageId: string, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  Icon: React.ComponentType<{
    className?: string;
  }>;
  onAddTasks: (stageId: string) => void;
  addingTaskInManage: {
    stageId: string;
    mode: 'single' | 'bulk';
    value: string;
  } | null;
  setAddingTaskInManage: React.Dispatch<React.SetStateAction<{
    stageId: string;
    mode: 'single' | 'bulk';
    value: string;
  } | null>>;
  onSaveTask: (stageId: string, value: string, mode: 'single' | 'bulk') => void;
}
function SortableStageItem({
  stage,
  index,
  isEditing,
  editingStage,
  setEditingStage,
  handleUpdateStage,
  handleDeleteStage,
  handleMoveStage,
  isFirst,
  isLast,
  Icon,
  onAddTasks,
  addingTaskInManage,
  setAddingTaskInManage,
  onSaveTask
}: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: stage.stage_id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  const isAddingTask = addingTaskInManage?.stageId === stage.stage_id;
  return <div ref={setNodeRef} style={style} className={cn("flex flex-col gap-2 p-3 rounded-lg border bg-card transition-all", isDragging && "shadow-lg ring-2 ring-primary/20")}>
      <div className="flex items-center gap-3">
      {/* Drag Handle */}
      <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none">
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Stage Number */}
      <Badge variant="outline" className="shrink-0 h-7 w-7 p-0 flex items-center justify-center">
        {index + 1}
      </Badge>

      {/* Stage Icon */}
      <div className="shrink-0 p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>

      {/* Stage Name - Editable */}
      {isEditing ? <div className="flex-1 flex gap-2">
          <Input value={editingStage?.name || ''} onChange={e => setEditingStage(prev => prev ? {
          ...prev,
          name: e.target.value
        } : null)} className="flex-1 text-right" autoFocus onKeyDown={e => {
          if (e.key === 'Enter') handleUpdateStage();
          if (e.key === 'Escape') setEditingStage(null);
        }} />
          <div className="flex gap-1">
            {iconOptions.map(opt => {
            const IconOpt = opt.icon;
            return <Button key={opt.value} type="button" variant={editingStage?.icon === opt.value ? "default" : "outline"} size="sm" onClick={() => setEditingStage(prev => prev ? {
              ...prev,
              icon: opt.value
            } : null)} className="h-8 w-8 p-0" title={opt.label}>
                  <IconOpt className="h-4 w-4" />
                </Button>;
          })}
          </div>
          <Button size="sm" onClick={handleUpdateStage}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingStage(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div> : <span className="flex-1 font-medium text-right">{stage.stage_name}</span>}

      {/* Actions */}
      {!isEditing && <div className="flex items-center gap-1 shrink-0">
          {/* Arrow Up */}
          <Button size="sm" variant="ghost" onClick={() => handleMoveStage(stage.stage_id, 'up')} disabled={isFirst} className="h-8 w-8 p-0" title="הזז למעלה">
            <ChevronUp className="h-4 w-4" />
          </Button>
          
          {/* Arrow Down */}
          <Button size="sm" variant="ghost" onClick={() => handleMoveStage(stage.stage_id, 'down')} disabled={isLast} className="h-8 w-8 p-0" title="הזז למטה">
            <ChevronDown className="h-4 w-4" />
          </Button>

          {/* Edit */}
          <Button size="sm" variant="ghost" onClick={() => setEditingStage({
          stageId: stage.stage_id,
          name: stage.stage_name,
          icon: stage.stage_icon || 'Phone'
        })} className="h-8 w-8 p-0" title="ערוך">
            <Pencil className="h-4 w-4" />
          </Button>

          {/* Delete */}
          <Button size="sm" variant="ghost" onClick={() => handleDeleteStage(stage.stage_id)} className="h-8 w-8 p-0 hover:text-destructive" title="מחק">
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Add Tasks */}
          <Button size="sm" variant="ghost" onClick={() => setAddingTaskInManage({
          stageId: stage.stage_id,
          mode: 'single',
          value: ''
        })} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" title="הוסף משימות">
            <Plus className="h-4 w-4" />
          </Button>
        </div>}
      </div>

      {/* Task count info */}
      <div className="text-xs text-muted-foreground mr-10">
        {stage.tasks?.length || 0} משימות
      </div>

      {/* Add task input area */}
      {isAddingTask && <div className="mr-10 mt-2 space-y-2 border-t pt-2">
          <div className="flex gap-2 mb-2">
            <Button size="sm" variant={addingTaskInManage?.mode === 'single' ? 'default' : 'outline'} onClick={() => setAddingTaskInManage(prev => prev ? {
          ...prev,
          mode: 'single'
        } : null)} className="text-xs">
              משימה בודדת
            </Button>
            <Button size="sm" variant={addingTaskInManage?.mode === 'bulk' ? 'default' : 'outline'} onClick={() => setAddingTaskInManage(prev => prev ? {
          ...prev,
          mode: 'bulk'
        } : null)} className="text-xs">
              <ListPlus className="h-3 w-3 ml-1" />
              רשימת משימות
            </Button>
          </div>
          
          {addingTaskInManage?.mode === 'single' ? <div className="flex gap-2">
              <Input value={addingTaskInManage?.value || ''} onChange={e => setAddingTaskInManage(prev => prev ? {
          ...prev,
          value: e.target.value
        } : null)} placeholder="שם המשימה..." className="flex-1 text-right h-8" autoFocus onKeyDown={e => {
          if (e.key === 'Enter' && addingTaskInManage?.value.trim()) {
            onSaveTask(stage.stage_id, addingTaskInManage.value, 'single');
          }
          if (e.key === 'Escape') setAddingTaskInManage(null);
        }} />
              <Button size="sm" onClick={() => {
          if (addingTaskInManage?.value.trim()) {
            onSaveTask(stage.stage_id, addingTaskInManage.value, 'single');
          }
        }} disabled={!addingTaskInManage?.value.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingTaskInManage(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div> : <div className="space-y-2">
              <Textarea value={addingTaskInManage?.value || ''} onChange={e => setAddingTaskInManage(prev => prev ? {
          ...prev,
          value: e.target.value
        } : null)} placeholder="הכנס משימות, כל שורה משימה חדשה..." className="min-h-[100px] text-right" autoFocus />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {addingTaskInManage?.value.split('\n').filter(l => l.trim()).length || 0} משימות
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setAddingTaskInManage(null)}>
                    ביטול
                  </Button>
                  <Button size="sm" onClick={() => {
              if (addingTaskInManage?.value.trim()) {
                onSaveTask(stage.stage_id, addingTaskInManage.value, 'bulk');
              }
            }} disabled={!addingTaskInManage?.value.trim()}>
                    הוסף משימות
                  </Button>
                </div>
              </div>
            </div>}
        </div>}
    </div>;
}
export function ClientStagesBoard({
  clientId,
  filterByFolderId,
  filterByFolderName
}: ClientStagesBoardProps) {
  const {
    stages: allStages,
    loading,
    addTask,
    addBulkTasks,
    toggleTask,
    updateTask,
    updateTaskCompletedDate,
    updateTaskStyle,
    startTaskTimer,
    stopTaskTimer,
    cycleTaskTimerStyle,
    startStageTimer,
    stopStageTimer,
    cycleStageTimerStyle,
    deleteTask,
    bulkDeleteTasks,
    addStage,
    updateStage,
    deleteStage,
    bulkDeleteStages,
    reorderTasks,
    reorderStages,
    copyStageData,
    pasteStageData,
    refresh
  } = useClientStages(clientId);
  
  // Filter stages by folder if filter is provided
  const stages = filterByFolderId !== undefined
    ? allStages.filter(s => s.folder_id === filterByFolderId)
    : allStages;
    
  const [addingTask, setAddingTask] = useState<{
    stageId: string;
    title: string;
  } | null>(null);
  const [editingTask, setEditingTask] = useState<{
    stageId: string;
    taskId: string;
    title: string;
  } | null>(null);
  const [showTaskCount, setShowTaskCount] = useState<Record<string, boolean>>({});
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [bulkAddDialog, setBulkAddDialog] = useState<{
    stageId: string;
    tasks: string;
  } | null>(null);
  const [addStageDialog, setAddStageDialog] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageIcon, setNewStageIcon] = useState('Phone');
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [expandedViewMode, setExpandedViewMode] = useState<'cards' | 'table'>('cards');
  const [manageStagesDialog, setManageStagesDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<{
    stageId: string;
    name: string;
    icon: string;
  } | null>(null);

  // State for adding tasks from manage stages dialog
  const [addingTaskInManage, setAddingTaskInManage] = useState<{
    stageId: string;
    mode: 'single' | 'bulk';
    value: string;
  } | null>(null);

  // Show all stages by default
  const [showAllStages, setShowAllStages] = useState(true);

  // Template dialogs state
  const [applyTemplateDialog, setApplyTemplateDialog] = useState(false);
  const [saveAllStagesDialog, setSaveAllStagesDialog] = useState(false);
  const [copyStagesDialog, setCopyStagesDialog] = useState(false);
  const [saveAsTemplateDialog, setSaveAsTemplateDialog] = useState<string | null>(null);

  // Clipboard state for copy/paste
  const [copiedStage, setCopiedStage] = useState<{
    stage_name: string;
    stage_icon: string | null;
    tasks: {
      title: string;
      completed: boolean;
    }[];
  } | null>(null);

  // Custom timer days input state
  const [customTimerDays, setCustomTimerDays] = useState<{
    stageId: string;
    days: string;
  } | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // Handle drag end for task reordering
  const handleDragEnd = (event: DragEndEvent, stageId: string, stageTasks: ClientStageTask[]) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stageTasks.findIndex(t => t.id === active.id);
      const newIndex = stageTasks.findIndex(t => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(stageTasks, oldIndex, newIndex);
        const taskIds = newOrder.map(t => t.id);
        reorderTasks(stageId, taskIds);
      }
    }
  };
  const getStageIcon = (iconName: string | null) => {
    if (!iconName) return Phone;
    return iconMap[iconName] || Phone;
  };
  const handleToggleTask = async (task: ClientStageTask) => {
    await toggleTask(task.id);
  };
  const handleAddTask = async (stageId: string) => {
    if (!addingTask || !addingTask.title.trim()) return;
    await addTask(stageId, addingTask.title);
    setAddingTask(null);
  };
  const handleBulkAdd = async () => {
    if (!bulkAddDialog || !bulkAddDialog.tasks.trim()) return;
    const titles = bulkAddDialog.tasks.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    if (titles.length > 0) {
      await addBulkTasks(bulkAddDialog.stageId, titles);
      setBulkAddDialog(null);
    }
  };
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

  // Selection handlers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };
  const selectAllTasks = (tasks: ClientStageTask[]) => {
    setSelectedTasks(new Set(tasks.map(t => t.id)));
  };
  const clearSelection = () => {
    setSelectedTasks(new Set());
  };
  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    if (confirm(`האם אתה בטוח שברצונך למחוק ${selectedTasks.size} משימות?`)) {
      await bulkDeleteTasks(Array.from(selectedTasks));
      clearSelection();
    }
  };
  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    await addStage(newStageName, newStageIcon);
    setNewStageName('');
    setNewStageIcon('Phone');
    setAddStageDialog(false);
  };
  const handleDeleteStage = async (stageId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק שלב זה וכל המשימות שבו?')) {
      await deleteStage(stageId);
    }
  };

  // Stage selection handlers
  const toggleStageSelection = (stageId: string) => {
    setSelectedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };
  const selectAllStages = () => {
    setSelectedStages(new Set(sortedStages.map(s => s.stage_id)));
  };
  const clearStageSelection = () => {
    setSelectedStages(new Set());
  };
  const handleBulkDeleteStages = async () => {
    if (selectedStages.size === 0) return;
    if (confirm(`האם אתה בטוח שברצונך למחוק ${selectedStages.size} שלבים וכל המשימות שבהם?`)) {
      await bulkDeleteStages(Array.from(selectedStages));
      clearStageSelection();
    }
  };

  // Stage management handlers
  const handleUpdateStage = async () => {
    if (!editingStage || !editingStage.name.trim()) return;
    await updateStage(editingStage.stageId, editingStage.name, editingStage.icon);
    setEditingStage(null);
  };
  const handleMoveStage = (stageId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedStages.findIndex(s => s.stage_id === stageId);
    if (currentIndex === -1) return;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedStages.length) return;
    const newOrder = [...sortedStages];
    const [removed] = newOrder.splice(currentIndex, 1);
    newOrder.splice(newIndex, 0, removed);
    reorderStages(newOrder.map(s => s.stage_id));
  };
  const handleStageDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedStages.findIndex(s => s.stage_id === active.id);
      const newIndex = sortedStages.findIndex(s => s.stage_id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(sortedStages, oldIndex, newIndex);
        reorderStages(newOrder.map(s => s.stage_id));
      }
    }
  };
  const toggleTaskCount = (stageId: string) => {
    setShowTaskCount(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  // Copy stage handler
  const handleCopyStage = (stageId: string) => {
    const data = copyStageData(stageId);
    if (data) {
      setCopiedStage(data);
      // Also copy to system clipboard as JSON for cross-client paste
      navigator.clipboard.writeText(JSON.stringify(data)).catch(() => {});
    }
  };

  // Paste stage handler
  const handlePasteStage = async () => {
    if (copiedStage) {
      await pasteStageData(copiedStage);
    } else {
      // Try to read from system clipboard
      try {
        const text = await navigator.clipboard.readText();
        const data = JSON.parse(text);
        if (data.stage_name && Array.isArray(data.tasks)) {
          await pasteStageData(data);
        }
      } catch {
        // Clipboard doesn't contain valid stage data
      }
    }
  };

  // Keyboard shortcut for Ctrl+V to paste stage
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Only handle Ctrl+V when not in an input field
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const activeElement = document.activeElement;
        const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement?.getAttribute('contenteditable') === 'true';
        if (!isInput && copiedStage) {
          e.preventDefault();
          await handlePasteStage();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copiedStage, pasteStageData]);
  const calculateProgress = (stage: typeof stages[0]) => {
    if (!stage.tasks || stage.tasks.length === 0) return 0;
    const completed = stage.tasks.filter(t => t.completed).length;
    return Math.round(completed / stage.tasks.length * 100);
  };

  // Sort stages for RTL (reverse order so first stage appears on the right)
  const sortedStages = useMemo(() => [...stages].sort((a, b) => a.sort_order - b.sort_order), [stages]);

  // Calculate which stage is the first non-completed (active) stage
  const stageCompletionInfo = useMemo(() => {
    const info: Record<string, {
      isCompleted: boolean;
      progress: number;
    }> = {};
    sortedStages.forEach(stage => {
      const progress = calculateProgress(stage);
      const totalTasks = stage.tasks?.length || 0;
      const isCompleted = totalTasks > 0 && progress === 100;
      info[stage.stage_id] = {
        isCompleted,
        progress
      };
    });
    return info;
  }, [sortedStages]);

  // Find the active stage index (first non-completed stage)
  const activeStageIndex = useMemo(() => {
    return sortedStages.findIndex(stage => !stageCompletionInfo[stage.stage_id]?.isCompleted);
  }, [sortedStages, stageCompletionInfo]);

  // Get expanded stage data
  const expandedStageData = useMemo(() => expandedStage ? sortedStages.find(s => s.stage_id === expandedStage) : null, [expandedStage, sortedStages]);
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="space-y-4">
      {/* Folder Filter Indicator */}
      {filterByFolderName && (
        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">מציג שלבים מתיקייה: {filterByFolderName}</span>
          <Badge variant="secondary">{stages.length} שלבים</Badge>
        </div>
      )}
      
      {/* Stage Management Buttons */}
      <div className="flex justify-start gap-2 flex-wrap">
        <Button variant="outline" onClick={() => setAddStageDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          הוסף שלב חדש
        </Button>
        <Button variant="outline" onClick={() => setManageStagesDialog(true)} className="gap-2">
          <Settings2 className="h-4 w-4" />
          ניהול שלבים
        </Button>
        
        {/* Template Actions */}
        <div className="border-r border-border pr-2 mr-2" />
        <Button variant="outline" onClick={() => setApplyTemplateDialog(true)} className="gap-2">
          <BookTemplate className="h-4 w-4" />
          הוסף מתבנית
        </Button>
        <Button variant="outline" onClick={() => setSaveAllStagesDialog(true)} className="gap-2">
          <Layers className="h-4 w-4" />
          שמור כתבנית
        </Button>
        <Button variant="outline" onClick={() => setCopyStagesDialog(true)} className="gap-2">
          <Copy className="h-4 w-4" />
          העתק מלקוח
        </Button>
        
        {/* Paste Stage Button */}
        {copiedStage && <Button variant="outline" onClick={handlePasteStage} className="gap-2 bg-green-50 hover:bg-green-100 border-green-300 text-green-700">
            <ClipboardPaste className="h-4 w-4" />
            הדבק שלב ({copiedStage.stage_name})
          </Button>}
        
        {/* Toggle show all stages */}
        <div className="border-r border-border pr-2 mr-2" />
        <Button variant={showAllStages ? "default" : "outline"} onClick={() => setShowAllStages(!showAllStages)} className="gap-2" style={showAllStages ? {
        backgroundColor: '#d4a843',
        color: '#1e293b'
      } : {}}>
          {showAllStages ? <>
              <Eye className="h-4 w-4" />
              הסתר שלבים
            </> : <>
              <Layers className="h-4 w-4" />
              הצג כל השלבים ({sortedStages.length})
            </>}
        </Button>
      </div>

      {/* Multi-select Stage Actions */}
      {sortedStages.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-2 bg-muted/30 rounded-lg">
          <Checkbox
            checked={selectedStages.size === sortedStages.length && sortedStages.length > 0}
            onCheckedChange={(checked) => {
              if (checked) {
                selectAllStages();
              } else {
                clearStageSelection();
              }
            }}
          />
          <span className="text-sm text-muted-foreground">בחר הכל</span>
          
          {selectedStages.size > 0 && (
            <>
              <Badge variant="secondary">{selectedStages.size} שלבים נבחרו</Badge>
              <Button size="sm" variant="destructive" onClick={handleBulkDeleteStages} className="gap-1">
                <Trash2 className="h-4 w-4" />
                מחק נבחרים
              </Button>
              <Button size="sm" variant="outline" onClick={clearStageSelection}>
                בטל בחירה
              </Button>
            </>
          )}
        </div>
      )}

      {/* Stages Grid - RTL direction */}
      <div className={cn("grid gap-4", showAllStages ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1 max-w-md mr-0 ml-auto")} dir="rtl">
        {(showAllStages ? sortedStages : sortedStages.filter(s => s.stage_id === 'contact')).map((stage, index) => {
        const Icon = getStageIcon(stage.stage_icon);
        const progress = calculateProgress(stage);
        const completedTasks = stage.tasks?.filter(t => t.completed).length || 0;
        const totalTasks = stage.tasks?.length || 0;
        const isHovered = hoveredStage === stage.stage_id;
        const isCustomStage = stage.stage_id.startsWith('custom_');

        // New stage status logic
        const isStageCompleted = stageCompletionInfo[stage.stage_id]?.isCompleted || false;
        const isActiveStage = index === activeStageIndex;
        const isFutureStage = activeStageIndex !== -1 && index > activeStageIndex;
        return <Card key={stage.id} className={cn("relative flex flex-col h-full transition-all duration-300 border-2 border-amber-400/60",
        // Selected stage highlight
        selectedStages.has(stage.stage_id) && "ring-2 ring-primary ring-offset-2",
        // Completed stage: white background with thick gold border
        isStageCompleted && "bg-white dark:bg-gray-900 border-[3px] border-amber-500 shadow-md shadow-amber-500/20",
        // Active stage: gold gradient (current behavior for first stage)
        isActiveStage && !isStageCompleted && "border-yellow-500 shadow-lg shadow-yellow-500/10",
        // Future stages: thin gold border
        isFutureStage && "border-amber-400/60")} onMouseEnter={() => setHoveredStage(stage.stage_id)} onMouseLeave={() => setHoveredStage(null)}>
              {/* Selection Checkbox - Top Right, visible on hover or when selected */}
              {(isHovered || selectedStages.has(stage.stage_id)) && (
              <div className="absolute top-2 right-10 z-30">
                <Checkbox
                  checked={selectedStages.has(stage.stage_id)}
                  onCheckedChange={() => toggleStageSelection(stage.stage_id)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white border-2 border-gray-400 h-5 w-5 shadow-sm hover:border-blue-500 cursor-pointer"
                />
              </div>
              )}
              {/* Header - Clickable to expand */}
              <div className={cn("p-4 rounded-t-lg relative cursor-pointer transition-all hover:opacity-90",
          // Completed stage: white/light gradient with gold accent
          isStageCompleted && "bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-950/30 dark:via-gray-900 dark:to-amber-950/30 border-b-2 border-amber-400",
          // Active stage: gold gradient
          isActiveStage && !isStageCompleted && "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600",
          // Future stages: blue gradient
          !isStageCompleted && !isActiveStage && "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950")} onClick={() => setExpandedStage(stage.stage_id)}>
                {/* Completed indicator */}
                {isStageCompleted && <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-6 w-6 text-amber-500" />
                  </div>}

                {/* Timer Display - Top Left - Always visible if timer is active */}
                {Boolean(stage.started_at && stage.target_working_days) && <div className="absolute top-2 left-2 z-10 bg-transparent border-accent">
                    <StageTimerDisplay startedAt={stage.started_at} targetDays={stage.target_working_days} displayStyle={stage.timer_display_style} onStyleChange={() => cycleStageTimerStyle(stage.stage_id)} size="lg" />
                  </div>}

                {/* Header Actions - visible on hover - Bottom Right */}
                {isHovered && <div className={cn("absolute bottom-2 right-2 flex gap-1", isActiveStage && !isStageCompleted && "text-white")}>
                    {/* Edit Stage Button */}
                    <Button size="sm" variant="ghost" onClick={e => {
                e.stopPropagation();
                setEditingStage({
                  stageId: stage.stage_id,
                  name: stage.stage_name,
                  icon: stage.stage_icon || 'Phone'
                });
                setManageStagesDialog(true);
              }} className={cn("h-7 w-7 p-0", isActiveStage && !isStageCompleted && "hover:bg-white/20")} title="ערוך שלב">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {/* Delete Stage Button */}
                    <Button size="sm" variant="ghost" onClick={e => {
                e.stopPropagation();
                handleDeleteStage(stage.stage_id);
              }} className={cn("h-7 w-7 p-0 hover:text-destructive", isActiveStage && !isStageCompleted && "hover:bg-white/20")} title="מחק שלב">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {/* Copy Stage Button */}
                    <Button size="sm" variant="ghost" onClick={e => {
                e.stopPropagation();
                handleCopyStage(stage.stage_id);
              }} className={cn("h-7 w-7 p-0 hover:text-green-600", isActiveStage && !isStageCompleted && "hover:bg-white/20")} title="העתק שלב (Ctrl+C)">
                      <Clipboard className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={e => {
                e.stopPropagation();
                toggleTaskCount(stage.stage_id);
              }} className={cn("h-7 w-7 p-0", isActiveStage && !isStageCompleted && "hover:bg-white/20")} title="מספר משימות">
                      <Hash className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={e => {
                e.stopPropagation();
                setExpandedStage(stage.stage_id);
              }} className={cn("h-7 w-7 p-0", isActiveStage && !isStageCompleted && "hover:bg-white/20")} title="הרחב תצוגה">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={e => {
                e.stopPropagation();
                setSaveAsTemplateDialog(stage.stage_id);
              }} className={cn("h-7 w-7 p-0", isActiveStage && !isStageCompleted && "hover:bg-white/20")} title="שמור כתבנית">
                      <BookTemplate className="h-3.5 w-3.5" />
                    </Button>
                    
                    {/* Timer Controls - in hover actions */}
                    {!stage.started_at ? <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="ghost" className={cn("h-7 w-7 p-0", isActiveStage && !isStageCompleted && "hover:bg-white/20")} title="הפעל טיימר ימים">
                            <Timer className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-center mb-2">בחר ימי יעד</p>
                            
                            {/* Predefined options */}
                            <div className="grid grid-cols-2 gap-1">
                              {TARGET_DAYS_OPTIONS.map(option => <Button key={option.value} variant="ghost" size="sm" className="w-full justify-center text-xs h-7" onClick={() => startStageTimer(stage.stage_id, option.value)}>
                                  {option.value} ימים
                                </Button>)}
                            </div>
                            
                            {/* Custom days input */}
                            <div className="border-t pt-2 mt-2">
                              <p className="text-xs text-muted-foreground mb-1 text-center">או הזן מספר אישי:</p>
                              <div className="flex gap-1">
                                <Input type="number" min="1" max="365" placeholder="ימים" className="h-7 text-xs text-center" value={customTimerDays?.stageId === stage.stage_id ? customTimerDays.days : ''} onChange={e => setCustomTimerDays({
                          stageId: stage.stage_id,
                          days: e.target.value
                        })} onKeyDown={e => {
                          if (e.key === 'Enter' && customTimerDays?.days) {
                            const days = Number.parseInt(customTimerDays.days);
                            if (days > 0 && days <= 365) {
                              startStageTimer(stage.stage_id, days);
                              setCustomTimerDays(null);
                            }
                          }
                        }} />
                                <Button size="sm" className="h-7 px-2" disabled={!customTimerDays?.days || Number.parseInt(customTimerDays.days) <= 0} onClick={() => {
                          if (customTimerDays?.days) {
                            const days = Number.parseInt(customTimerDays.days);
                            if (days > 0 && days <= 365) {
                              startStageTimer(stage.stage_id, days);
                              setCustomTimerDays(null);
                            }
                          }
                        }}>
                                  <Play className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover> : <Button size="sm" variant="ghost" onClick={e => {
                e.stopPropagation();
                stopStageTimer(stage.stage_id);
              }} className={cn("h-7 w-7 p-0 hover:text-red-500", isActiveStage && !isStageCompleted && "hover:bg-white/20")} title="עצור טיימר">
                        <Square className="h-3.5 w-3.5" />
                      </Button>}
                  </div>}

                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-lg shadow-sm", isStageCompleted ? "bg-amber-100 dark:bg-amber-900/30" : isActiveStage ? "bg-white/90" : "bg-white dark:bg-gray-800")}>
                    <Icon className={cn("h-5 w-5", isStageCompleted ? "text-amber-600" : isActiveStage ? "text-yellow-600" : "text-primary")} />
                  </div>
                </div>

                <h3 className={cn("font-semibold text-lg mb-2 text-right", isStageCompleted ? "text-amber-700 dark:text-amber-400" : isActiveStage ? "text-white" : "text-foreground")}>
                  {stage.stage_name}
                </h3>

                <div className="flex items-center gap-2 justify-end">
                  {/* Progress Circle */}
                  <div className="relative w-12 h-12">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="none" className={cn(isStageCompleted ? "text-amber-200 dark:text-amber-900" : isActiveStage ? "text-white/30" : "text-gray-200 dark:text-gray-700")} />
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" className={cn("transition-all duration-500", isStageCompleted ? "text-amber-500" : isActiveStage ? "text-white" : progress === 100 ? "text-green-500" : "text-primary")} strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - progress / 100)} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn("text-xs font-bold", isStageCompleted ? "text-amber-600" : isActiveStage ? "text-white" : "text-foreground")}>
                        {progress}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={isStageCompleted ? "secondary" : isActiveStage ? "secondary" : "outline"} className={cn("text-xs", isStageCompleted && "bg-amber-100 text-amber-700 border-amber-300", isActiveStage && !isStageCompleted && "bg-white/90 text-yellow-700 border-0")}>
                      {completedTasks}/{totalTasks}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tasks List with Drag and Drop */}
              <CardContent className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[500px]">
                {stage.tasks && stage.tasks.length > 0 ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={event => handleDragEnd(event, stage.stage_id, stage.tasks || [])}>
                    <SortableContext items={stage.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {stage.tasks.map((task, index) => <SortableTaskItem key={task.id} task={task} stage={stage} index={index} showTaskCount={showTaskCount[stage.stage_id] || false} clientId={clientId} editingTask={editingTask} setEditingTask={setEditingTask} handleToggleTask={handleToggleTask} handleUpdateTask={handleUpdateTask} handleDeleteTask={handleDeleteTask} updateTaskStyle={updateTaskStyle} updateTaskCompletedDate={updateTaskCompletedDate} startTaskTimer={startTaskTimer} stopTaskTimer={stopTaskTimer} cycleTaskTimerStyle={cycleTaskTimerStyle} />)}
                      </div>
                    </SortableContext>
                  </DndContext> : <div className="text-center text-sm text-gray-500 py-8">
                    אין משימות
                  </div>}

                {/* Add Task Section */}
                <div className="pt-2 border-t">
                  {addingTask?.stageId === stage.stage_id ? <div className="flex gap-2">
                      <Input value={addingTask.title} onChange={e => setAddingTask({
                  ...addingTask,
                  title: e.target.value
                })} onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAddTask(stage.stage_id);
                  } else if (e.key === 'Escape') {
                    setAddingTask(null);
                  }
                }} placeholder="שם המשימה..." className="h-8 text-right" autoFocus />
                      <Button size="sm" onClick={() => handleAddTask(stage.stage_id)} className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div> : <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setAddingTask({
                  stageId: stage.stage_id,
                  title: ''
                })}>
                        <Plus className="h-4 w-4 ml-2" />
                        הוסף משימה
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setBulkAddDialog({
                  stageId: stage.stage_id,
                  tasks: ''
                })} title="הוסף משימות מרובות">
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>}
                </div>
              </CardContent>
            </Card>;
      })}
      </div>

      {/* Expanded Stage Dialog */}
      <Dialog open={expandedStage !== null} onOpenChange={() => {
      setExpandedStage(null);
      clearSelection();
    }}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
          {expandedStageData && (() => {
          const Icon = getStageIcon(expandedStageData.stage_icon);
          const progress = calculateProgress(expandedStageData);
          const completedTasks = expandedStageData.tasks?.filter(t => t.completed).length || 0;
          const totalTasks = expandedStageData.tasks?.length || 0;
          const isFirstStage = expandedStageData.sort_order === 0;
          const allSelected = expandedStageData.tasks && expandedStageData.tasks.length > 0 && expandedStageData.tasks.every(t => selectedTasks.has(t.id));
          return <>
                {/* Expanded Header */}
                <div className={cn("p-6 -m-6 mb-4 rounded-t-lg", isFirstStage ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600" : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950")}>
                  <div className="flex items-center justify-between">
                    <Button size="sm" variant="ghost" onClick={() => {
                  setExpandedStage(null);
                  clearSelection();
                }} className={cn("h-8 w-8 p-0", isFirstStage && "text-white hover:bg-white/20")}>
                      <X className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <h2 className={cn("text-2xl font-bold", isFirstStage ? "text-white" : "text-foreground")}>
                          {expandedStageData.stage_name}
                        </h2>
                        <p className={cn("text-sm", isFirstStage ? "text-white/80" : "text-muted-foreground")}>
                          {completedTasks} מתוך {totalTasks} משימות הושלמו ({progress}%)
                        </p>
                      </div>
                      
                      <div className={cn("p-3 rounded-lg shadow-sm", isFirstStage ? "bg-white/90" : "bg-white dark:bg-gray-800")}>
                        <Icon className={cn("h-8 w-8", isFirstStage ? "text-yellow-600" : "text-primary")} />
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className={cn("h-2 rounded-full overflow-hidden", isFirstStage ? "bg-white/30" : "bg-gray-200 dark:bg-gray-700")}>
                      <div className={cn("h-full rounded-full transition-all duration-500", isFirstStage ? "bg-white" : "bg-primary")} style={{
                    width: `${progress}%`
                  }} />
                    </div>
                  </div>
                  
                  {/* Stage Timer Controls */}
                  <div className="mt-4 flex items-center justify-end gap-2">
                    {expandedStageData.started_at && expandedStageData.target_working_days ? <>
                        <StageTimerDisplay startedAt={expandedStageData.started_at} targetDays={expandedStageData.target_working_days} displayStyle={expandedStageData.timer_display_style} onStyleChange={() => cycleStageTimerStyle(expandedStageData.stage_id)} size="lg" className={isFirstStage ? "bg-white/90 text-gray-800" : ""} />
                        <Button variant="ghost" size="sm" className={cn("text-xs", isFirstStage ? "text-white/80 hover:text-white hover:bg-white/20" : "text-muted-foreground hover:text-red-500")} onClick={() => stopStageTimer(expandedStageData.stage_id)}>
                          <Square className="h-3.5 w-3.5 ml-1" />
                          עצור טיימר
                        </Button>
                      </> : <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={isFirstStage ? "secondary" : "outline"} size="sm" className={cn("text-xs", isFirstStage && "bg-white/90 hover:bg-white text-gray-800")}>
                            <Timer className="h-3.5 w-3.5 ml-1" />
                            הפעל טיימר ימים
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-center mb-2">בחר ימי יעד לשלב</p>
                            
                            {/* Predefined options */}
                            <div className="grid grid-cols-2 gap-1">
                              {TARGET_DAYS_OPTIONS.map(option => <Button key={option.value} variant="ghost" size="sm" className="w-full justify-center text-xs h-7" onClick={() => {
                          startStageTimer(expandedStageData.stage_id, option.value);
                        }}>
                                  {option.value} ימים
                                </Button>)}
                            </div>
                            
                            {/* Custom days input */}
                            <div className="border-t pt-2 mt-2">
                              <p className="text-xs text-muted-foreground mb-1 text-center">או הזן מספר אישי:</p>
                              <div className="flex gap-1">
                                <Input type="number" min="1" max="365" placeholder="ימים" className="h-7 text-xs text-center" value={customTimerDays?.stageId === expandedStageData.stage_id ? customTimerDays.days : ''} onChange={e => setCustomTimerDays({
                            stageId: expandedStageData.stage_id,
                            days: e.target.value
                          })} onKeyDown={e => {
                            if (e.key === 'Enter' && customTimerDays?.days) {
                              const days = Number.parseInt(customTimerDays.days);
                              if (days > 0 && days <= 365) {
                                startStageTimer(expandedStageData.stage_id, days);
                                setCustomTimerDays(null);
                              }
                            }
                          }} />
                                <Button size="sm" className="h-7 px-2" disabled={!customTimerDays?.days || Number.parseInt(customTimerDays.days) <= 0} onClick={() => {
                            if (customTimerDays?.days) {
                              const days = Number.parseInt(customTimerDays.days);
                              if (days > 0 && days <= 365) {
                                startStageTimer(expandedStageData.stage_id, days);
                                setCustomTimerDays(null);
                              }
                            }
                          }}>
                                  <Play className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>}
                  </div>
                </div>

                {/* View Tabs */}
                <Tabs value={expandedViewMode} onValueChange={v => setExpandedViewMode(v as 'cards' | 'table')} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList>
                      <TabsTrigger value="cards" className="gap-2">
                        <LayoutList className="h-4 w-4" />
                        כרטיסים
                      </TabsTrigger>
                      <TabsTrigger value="table" className="gap-2">
                        <Table2 className="h-4 w-4" />
                        טבלה
                      </TabsTrigger>
                    </TabsList>

                    {/* Multi-select actions */}
                    {selectedTasks.size > 0 && <div className="flex items-center gap-2">
                        <Badge variant="secondary">{selectedTasks.size} נבחרו</Badge>
                        <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                          <Trash2 className="h-4 w-4 ml-2" />
                          מחק נבחרים
                        </Button>
                        <Button size="sm" variant="outline" onClick={clearSelection}>
                          בטל בחירה
                        </Button>
                      </div>}
                  </div>

                  {/* Cards View */}
                  <TabsContent value="cards" className="flex-1 overflow-y-auto space-y-3 mt-0">
                    {/* Select All */}
                    {expandedStageData.tasks && expandedStageData.tasks.length > 0 && <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox checked={allSelected} onCheckedChange={() => {
                    if (allSelected) {
                      clearSelection();
                    } else {
                      selectAllTasks(expandedStageData.tasks || []);
                    }
                  }} />
                        <span className="text-sm text-muted-foreground">בחר הכל</span>
                      </div>}
                    
                    {expandedStageData.tasks && expandedStageData.tasks.length > 0 ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={event => handleDragEnd(event, expandedStageData.stage_id, expandedStageData.tasks || [])}>
                        <SortableContext items={expandedStageData.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                          {expandedStageData.tasks.map((task, index) => <div key={task.id} className="flex items-center gap-2">
                              <Checkbox checked={selectedTasks.has(task.id)} onCheckedChange={() => toggleTaskSelection(task.id)} className="shrink-0" />
                              <div className="flex-1">
                                <SortableExpandedTaskItem task={task} stageId={expandedStageData.stage_id} index={index} showTaskCount={showTaskCount[expandedStageData.stage_id] || false} clientId={clientId} setEditingTask={setEditingTask} handleToggleTask={handleToggleTask} handleDeleteTask={handleDeleteTask} />
                              </div>
                            </div>)}
                        </SortableContext>
                      </DndContext> : <div className="text-center text-muted-foreground py-12">
                        אין משימות בשלב זה
                      </div>}
                  </TabsContent>

                  {/* Table View */}
                  <TabsContent value="table" className="flex-1 overflow-auto mt-0">
                    {expandedStageData.tasks && expandedStageData.tasks.length > 0 ? <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="p-3 text-right w-12">
                                <Checkbox checked={allSelected} onCheckedChange={() => {
                            if (allSelected) {
                              clearSelection();
                            } else {
                              selectAllTasks(expandedStageData.tasks || []);
                            }
                          }} />
                              </th>
                              <th className="p-3 text-right font-medium">#</th>
                              <th className="p-3 text-right font-medium">סטטוס</th>
                              <th className="p-3 text-right font-medium">משימה</th>
                              <th className="p-3 text-right font-medium">תאריך סיום</th>
                              <th className="p-3 text-right font-medium w-24">פעולות</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expandedStageData.tasks.map((task, index) => <tr key={task.id} className={cn("border-t transition-colors", task.completed ? "bg-green-50/50 dark:bg-green-950/20" : "hover:bg-muted/50", selectedTasks.has(task.id) && "bg-primary/10")}>
                                <td className="p-3">
                                  <Checkbox checked={selectedTasks.has(task.id)} onCheckedChange={() => toggleTaskSelection(task.id)} />
                                </td>
                                <td className="p-3 text-muted-foreground">{index + 1}</td>
                                <td className="p-3">
                                  <button onClick={() => handleToggleTask(task)} className="focus:outline-none">
                                    {task.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" style={{
                              filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))'
                            }} /> : <div className="h-5 w-5 rounded-full border-2 border-slate-300 hover:border-emerald-400 transition-colors" />}
                                  </button>
                                </td>
                                <td className="p-3">
                                  <p className={cn("text-[#1a2c5f] dark:text-slate-200 font-medium", task.completed && "line-through text-emerald-600 dark:text-emerald-400")}>
                                    <TaskTitleWithConsultants taskId={task.id} title={task.title} />
                                  </p>
                                </td>
                                <td className="p-3 text-muted-foreground text-sm">
                                  {task.completed && task.completed_at ? new Date(task.completed_at).toLocaleDateString('he-IL') : '-'}
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-1">
                                    <StageTaskIndicator stageTaskId={task.id} clientId={clientId} />
                                    <Button size="sm" variant="ghost" onClick={() => setEditingTask({
                              stageId: expandedStageData.stage_id,
                              taskId: task.id,
                              title: task.title
                            })} className="h-7 w-7 p-0">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)} className="h-7 w-7 p-0 hover:text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <StageTaskActionsPopup stageTaskId={task.id} stageTaskTitle={task.title} clientId={clientId} trigger={<Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-primary">
                                          <Bell className="h-3.5 w-3.5" />
                                        </Button>} />
                                  </div>
                                </td>
                              </tr>)}
                          </tbody>
                        </table>
                      </div> : <div className="text-center text-muted-foreground py-12">
                        אין משימות בשלב זה
                      </div>}
                  </TabsContent>
                </Tabs>

                {/* Expanded Footer - Add Tasks */}
                <div className="pt-4 border-t flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => {
                setAddingTask({
                  stageId: expandedStageData.stage_id,
                  title: ''
                });
              }}>
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף משימה
                  </Button>
                  <Button variant="outline" onClick={() => {
                setBulkAddDialog({
                  stageId: expandedStageData.stage_id,
                  tasks: ''
                });
              }}>
                    <ListPlus className="h-4 w-4 ml-2" />
                    הוספה מרובה
                  </Button>
                  <Button variant="ghost" onClick={() => toggleTaskCount(expandedStageData.stage_id)} className={showTaskCount[expandedStageData.stage_id] ? "bg-primary/10" : ""}>
                    <Hash className="h-4 w-4 ml-2" />
                    מספור
                  </Button>
                </div>
              </>;
        })()}
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkAddDialog !== null} onOpenChange={() => setBulkAddDialog(null)}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right">הוספת משימות מרובות</DialogTitle>
            <DialogDescription className="text-right">
              הזן משימה אחת בכל שורה
            </DialogDescription>
          </DialogHeader>
          <Textarea value={bulkAddDialog?.tasks || ''} onChange={e => setBulkAddDialog(bulkAddDialog ? {
          ...bulkAddDialog,
          tasks: e.target.value
        } : null)} placeholder="משימה 1&#10;משימה 2&#10;משימה 3" rows={10} className="font-mono text-right" />
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setBulkAddDialog(null)}>
              ביטול
            </Button>
            <Button onClick={handleBulkAdd}>
              הוסף {bulkAddDialog?.tasks.split('\n').filter(t => t.trim()).length || 0} משימות
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog open={addStageDialog} onOpenChange={setAddStageDialog}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right">הוספת שלב חדש</DialogTitle>
            <DialogDescription className="text-right">
              בחר שם ואייקון לשלב החדש
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-right">שם השלב</label>
              <Input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="הזן שם לשלב..." className="text-right" onKeyDown={e => {
              if (e.key === 'Enter') {
                handleAddStage();
              }
            }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right">אייקון</label>
              <div className="flex gap-2 justify-end">
                {iconOptions.map(opt => {
                const IconComponent = opt.icon;
                return <Button key={opt.value} type="button" variant={newStageIcon === opt.value ? "default" : "outline"} size="sm" onClick={() => setNewStageIcon(opt.value)} className="h-10 w-10 p-0" title={opt.label}>
                      <IconComponent className="h-5 w-5" />
                    </Button>;
              })}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setAddStageDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddStage} disabled={!newStageName.trim()}>
              הוסף שלב
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Stages Dialog */}
      <Dialog open={manageStagesDialog} onOpenChange={setManageStagesDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center justify-between">
              <span>ניהול שלבים</span>
              <Button size="sm" onClick={() => {
              setManageStagesDialog(false);
              setAddStageDialog(true);
            }} className="gap-1 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
                הוסף שלב חדש
              </Button>
            </DialogTitle>
            <DialogDescription className="text-right">
              ערוך, מחק או שנה את סדר השלבים. לחץ על + להוספת משימות לשלב.
            </DialogDescription>
          </DialogHeader>
          
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStageDragEnd}>
            <SortableContext items={sortedStages.map(s => s.stage_id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
                {sortedStages.map((stage, index) => {
                const Icon = getStageIcon(stage.stage_icon);
                const isEditing = editingStage?.stageId === stage.stage_id;
                const isFirst = index === 0;
                const isLast = index === sortedStages.length - 1;
                return <SortableStageItem key={stage.stage_id} stage={stage} index={index} isEditing={isEditing} editingStage={editingStage} setEditingStage={setEditingStage} handleUpdateStage={handleUpdateStage} handleDeleteStage={handleDeleteStage} handleMoveStage={handleMoveStage} isFirst={isFirst} isLast={isLast} Icon={Icon} onAddTasks={stageId => setAddingTaskInManage({
                  stageId,
                  mode: 'single',
                  value: ''
                })} addingTaskInManage={addingTaskInManage} setAddingTaskInManage={setAddingTaskInManage} onSaveTask={async (stageId, value, mode) => {
                  if (mode === 'single') {
                    await addTask(stageId, value.trim());
                  } else {
                    const tasks = value.split('\n').filter(t => t.trim());
                    if (tasks.length > 0) {
                      await addBulkTasks(stageId, tasks);
                    }
                  }
                  setAddingTaskInManage(null);
                }} />;
              })}
              </div>
            </SortableContext>
          </DndContext>

          <DialogFooter>
            <Button onClick={() => setManageStagesDialog(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialogs */}
      <ApplyTemplateDialog open={applyTemplateDialog} onOpenChange={setApplyTemplateDialog} clientId={clientId} existingStagesCount={sortedStages.length} onApplied={refresh} />
      
      <SaveAllStagesDialog open={saveAllStagesDialog} onOpenChange={setSaveAllStagesDialog} stages={sortedStages} onSaved={refresh} />
      
      <CopyStagesDialog open={copyStagesDialog} onOpenChange={setCopyStagesDialog} targetClientId={clientId} onCopied={refresh} />
      
      {saveAsTemplateDialog && <SaveAsTemplateDialog open={!!saveAsTemplateDialog} onOpenChange={open => !open && setSaveAsTemplateDialog(null)} stage={sortedStages.find(s => s.stage_id === saveAsTemplateDialog)!} />}
    </div>;
}