import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Phone, 
  FolderOpen, 
  Send, 
  MapPin,
  Pencil,
  Trash2,
  Plus,
  ListPlus,
  Loader2,
  Bell,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientStages } from '@/hooks/useClientStages';
import { AddReminderDialog } from '@/components/reminders/AddReminderDialog';
import { TaskTimerBadge } from './StageTimerDisplay';

interface ClientStagesTrackerProps {
  clientId: string;
  onTaskComplete?: (stageId: string, taskId: string) => void;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone: Phone,
  FolderOpen: FolderOpen,
  Send: Send,
  MapPin: MapPin,
};

export function ClientStagesTracker({ clientId, onTaskComplete }: ClientStagesTrackerProps) {
  const { stages, loading, addTask, addBulkTasks, toggleTask, updateTask, deleteTask, startTaskTimer } = useClientStages(clientId);
  
  const [editingTask, setEditingTask] = useState<{ stageId: string; taskId: string; title: string } | null>(null);
  const [addingTask, setAddingTask] = useState<{ stageId: string; title: string; taskType: 'task' | 'timer_tab'; autoTimerDays: string } | null>(null);
  const [bulkAddDialog, setBulkAddDialog] = useState<{ stageId: string; tasks: string } | null>(null);

  const isTimerTabTask = (task: { task_type?: string | null; auto_timer_days?: number | null }) =>
    task.task_type === 'timer_tab' && Boolean(task.auto_timer_days);

  const getStageIcon = (iconName: string | null) => {
    if (!iconName) return Phone;
    return iconMap[iconName] || Phone;
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleTask(taskId);
  };

  const handleAddTask = async (stageId: string) => {
    if (!addingTask || !addingTask.title.trim()) return;
    const autoTimerDays = Number.parseInt(addingTask.autoTimerDays, 10);
    if (addingTask.taskType === 'timer_tab') {
      if (!Number.isFinite(autoTimerDays) || autoTimerDays <= 0) return;
      await addTask(stageId, addingTask.title, {
        taskType: 'timer_tab',
        autoTimerDays,
      });
    } else {
      await addTask(stageId, addingTask.title);
    }
    setAddingTask(null);
  };

  const handleBulkAdd = async () => {
    if (!bulkAddDialog || !bulkAddDialog.tasks.trim()) return;
    
    const titles = bulkAddDialog.tasks
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
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

  const calculateProgress = (stage: typeof stages[0]) => {
    if (!stage.tasks || stage.tasks.length === 0) return 0;
    const completed = stage.tasks.filter(t => t.completed).length;
    return Math.round((completed / stage.tasks.length) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {stages.map((stage) => {
        const Icon = getStageIcon(stage.stage_icon);
        const progress = calculateProgress(stage);
        const completedTasks = stage.tasks?.filter(t => t.completed).length || 0;
        const totalTasks = stage.tasks?.length || 0;

        return (
          <Card key={stage.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-lg text-right">{stage.stage_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-row-reverse">
                      <Badge variant="secondary" className="text-xs">
                        {completedTasks}/{totalTasks} משימות
                      </Badge>
                      <Badge 
                        variant={progress === 100 ? "default" : "outline"}
                        className="text-xs"
                      >
                        {progress}%
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Progress Circle */}
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      className={cn(
                        "transition-all duration-500",
                        progress === 100 ? "text-green-500" : "text-primary"
                      )}
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{progress}%</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-2">
              {/* Tasks List */}
              {stage.tasks && stage.tasks.length > 0 ? (
                <div className="space-y-2">
                  {stage.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md transition-colors flex-row-reverse",
                        task.completed
                          ? "bg-green-50 dark:bg-green-950/20"
                          : isTimerTabTask(task) && task.started_at && task.target_working_days
                            ? "bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900"
                            : isTimerTabTask(task)
                              ? "border border-dashed border-slate-300 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/10"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id)}
                        className="shrink-0"
                      />
                      
                      {editingTask?.taskId === task.id ? (
                        <div className="flex-1 flex gap-2 flex-row-reverse">
                          <Input
                            value={editingTask.title}
                            onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateTask(task.id, editingTask.title);
                              } else if (e.key === 'Escape') {
                                setEditingTask(null);
                              }
                            }}
                            className="h-8 text-right"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateTask(task.id, editingTask.title)}
                          >
                            שמור
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div
                            className={cn(
                              "flex-1 text-right",
                              isTimerTabTask(task) &&
                                !task.completed &&
                                !task.started_at &&
                                task.auto_timer_days &&
                                'cursor-pointer'
                            )}
                            onClick={() => {
                              if (
                                isTimerTabTask(task) &&
                                !task.completed &&
                                !task.started_at &&
                                task.auto_timer_days
                              ) {
                                startTaskTimer(task.id, task.auto_timer_days);
                              }
                            }}
                          >
                            <span className={cn(
                              "flex items-center justify-end gap-1.5 text-sm",
                              task.completed && "line-through text-gray-500"
                            )}>
                              {isTimerTabTask(task) && <Timer className="h-3.5 w-3.5 text-sky-600 shrink-0" />}
                              <span>{task.title}</span>
                            </span>
                            {isTimerTabTask(task) && task.auto_timer_days && !task.started_at && (
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                לחץ להפעלת {task.auto_timer_days} ימי עבודה
                              </div>
                            )}
                            {task.started_at && task.target_working_days && (
                              <div className="mt-1 flex justify-end">
                                <TaskTimerBadge
                                  startedAt={task.started_at}
                                  targetDays={task.target_working_days}
                                  displayStyle={task.timer_display_style}
                                />
                              </div>
                            )}
                          </div>
                          
                          {task.completed && task.completed_at && (
                            <Badge variant="outline" className="text-xs">
                              {new Date(task.completed_at).toLocaleDateString('he-IL')}
                            </Badge>
                          )}
                        </>
                      )}

                      <div className="flex gap-1 shrink-0 flex-row-reverse">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTask({ stageId: stage.stage_id, taskId: task.id, title: task.title })}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AddReminderDialog
                          entityType="client_stage_task"
                          entityId={task.id}
                          trigger={
                            <Button size="sm" variant="ghost" className="hover:text-primary">
                              <Bell className="h-3 w-3" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  אין משימות בשלב זה
                </div>
              )}

              {/* Add Task Input */}
              {addingTask?.stageId === stage.stage_id ? (
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2 flex-row-reverse">
                    <Button
                      size="sm"
                      variant={addingTask.taskType === 'task' ? 'default' : 'outline'}
                      onClick={() => setAddingTask({ ...addingTask, taskType: 'task', autoTimerDays: '' })}
                    >
                      משימה
                    </Button>
                    <Button
                      size="sm"
                      variant={addingTask.taskType === 'timer_tab' ? 'default' : 'outline'}
                      onClick={() => setAddingTask({ ...addingTask, taskType: 'timer_tab' })}
                    >
                      טאב טיימר
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-row-reverse">
                    <Input
                      value={addingTask.title}
                      onChange={(e) => setAddingTask({ ...addingTask, title: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTask(stage.stage_id);
                        } else if (e.key === 'Escape') {
                          setAddingTask(null);
                        }
                      }}
                      placeholder={addingTask.taskType === 'timer_tab' ? 'שם טאב הטיימר...' : 'שם המשימה...'}
                      className="h-8 text-right"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddTask(stage.stage_id)}
                      disabled={
                        !addingTask.title.trim() ||
                        (addingTask.taskType === 'timer_tab' &&
                          (!addingTask.autoTimerDays.trim() || Number.parseInt(addingTask.autoTimerDays, 10) <= 0))
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {addingTask.taskType === 'timer_tab' && (
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={addingTask.autoTimerDays}
                      onChange={(e) => setAddingTask({ ...addingTask, autoTimerDays: e.target.value })}
                      placeholder="ימי עבודה להפעלה"
                      className="h-8 text-right"
                    />
                  )}
                </div>
              ) : (
                <div className="flex gap-2 pt-2 flex-row-reverse">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAddingTask({ stageId: stage.stage_id, title: '', taskType: 'task', autoTimerDays: '' })}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף משימה / טאב
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkAddDialog({ stageId: stage.stage_id, tasks: '' })}
                  >
                    <ListPlus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Bulk Add Dialog */}
      <Dialog open={bulkAddDialog !== null} onOpenChange={() => setBulkAddDialog(null)}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right">הוספת משימות מרובות</DialogTitle>
            <DialogDescription className="text-right">
              הזן משימה אחת בכל שורה
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={bulkAddDialog?.tasks || ''}
            onChange={(e) => setBulkAddDialog(bulkAddDialog ? { ...bulkAddDialog, tasks: e.target.value } : null)}
            placeholder="משימה 1&#10;משימה 2&#10;משימה 3"
            rows={10}
            className="font-mono text-right"
          />
          <DialogFooter className="flex-row-reverse">
            <Button variant="outline" onClick={() => setBulkAddDialog(null)}>
              ביטול
            </Button>
            <Button onClick={handleBulkAdd}>
              הוסף {bulkAddDialog?.tasks.split('\n').filter(t => t.trim()).length || 0} משימות
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
