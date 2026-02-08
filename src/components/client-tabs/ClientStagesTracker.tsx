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
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientStages } from '@/hooks/useClientStages';
import { AddReminderDialog } from '@/components/reminders/AddReminderDialog';

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
  const { stages, loading, addTask, addBulkTasks, toggleTask, updateTask, deleteTask } = useClientStages(clientId);
  
  const [editingTask, setEditingTask] = useState<{ stageId: string; taskId: string; title: string } | null>(null);
  const [addingTask, setAddingTask] = useState<{ stageId: string; title: string } | null>(null);
  const [bulkAddDialog, setBulkAddDialog] = useState<{ stageId: string; tasks: string } | null>(null);

  const getStageIcon = (iconName: string | null) => {
    if (!iconName) return Phone;
    return iconMap[iconName] || Phone;
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleTask(taskId);
  };

  const handleAddTask = async (stageId: string) => {
    if (!addingTask || !addingTask.title.trim()) return;
    await addTask(stageId, addingTask.title);
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
                        task.completed ? "bg-green-50 dark:bg-green-950/20" : "hover:bg-gray-50 dark:hover:bg-gray-800"
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
                          <span className={cn(
                            "flex-1 text-sm text-right",
                            task.completed && "line-through text-gray-500"
                          )}>
                            {task.title}
                          </span>
                          
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
                <div className="flex gap-2 pt-2 flex-row-reverse">
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
                    placeholder="שם המשימה..."
                    className="h-8 text-right"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddTask(stage.stage_id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 flex-row-reverse">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAddingTask({ stageId: stage.stage_id, title: '' })}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף משימה
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
