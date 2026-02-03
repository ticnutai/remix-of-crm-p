import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Folder, 
  FolderOpen, 
  FolderPlus, 
  Plus,
  Loader2,
  Edit,
  Trash2,
  Copy,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ListPlus,
  FileText,
  Clock,
  CheckCircle,
  Phone,
  Send,
  MapPin,
  Building,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientFolders, ClientFolder, ClientFolderStage, ClientFolderTask } from '@/hooks/useClientFolders';

interface ClientFoldersManagerProps {
  clientId: string;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Folder: Folder,
  FolderOpen: FolderOpen,
  FileText: FileText,
  Clock: Clock,
  CheckCircle: CheckCircle,
  Phone: Phone,
  Send: Send,
  MapPin: MapPin,
  Building: Building,
};

const ICON_OPTIONS = [
  { value: 'Folder', label: 'תיקייה' },
  { value: 'FolderOpen', label: 'תיקייה פתוחה' },
  { value: 'FileText', label: 'מסמך' },
  { value: 'Building', label: 'בניין' },
  { value: 'Clock', label: 'שעון' },
  { value: 'CheckCircle', label: 'אישור' },
  { value: 'Phone', label: 'טלפון' },
  { value: 'Send', label: 'שליחה' },
  { value: 'MapPin', label: 'מיקום' },
];

// Sortable Task Component
function SortableTask({ 
  task, 
  onToggle, 
  onDelete, 
  onUpdate 
}: { 
  task: ClientFolderTask; 
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<ClientFolderTask>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdate({ title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border bg-card",
        task.completed && "opacity-60",
        task.background_color && `bg-[${task.background_color}]`
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Checkbox 
        checked={task.completed} 
        onCheckedChange={onToggle}
      />
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
          />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveEdit}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setIsEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span 
            className={cn(
              "flex-1 text-sm",
              task.completed && "line-through",
              task.is_bold && "font-bold"
            )}
            style={{ color: task.text_color || undefined }}
            onDoubleClick={() => setIsEditing(true)}
          >
            {task.title}
          </span>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}

// Stage Card Component
function StageCard({
  stage,
  onUpdate,
  onDelete,
  onAddTask,
  onAddBulkTasks,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
}: {
  stage: ClientFolderStage & { tasks: ClientFolderTask[] };
  onUpdate: (stageId: string, updates: { stage_name?: string; stage_icon?: string }) => void;
  onDelete: (stageId: string) => void;
  onAddTask: (stageId: string, title: string) => void;
  onAddBulkTasks: (stageId: string, titles: string[]) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<ClientFolderTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks: (stageId: string, newOrder: ClientFolderTask[]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(stage.stage_name);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkTasks, setBulkTasks] = useState('');

  const IconComponent = iconMap[stage.stage_icon || 'FileText'] || FileText;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stage.tasks.findIndex((t) => t.id === active.id);
      const newIndex = stage.tasks.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(stage.tasks, oldIndex, newIndex);
      onReorderTasks(stage.id, newOrder);
    }
  };

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdate(stage.id, { stage_name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(stage.id, newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const handleAddBulkTasks = () => {
    const titles = bulkTasks.split('\n').filter(t => t.trim());
    if (titles.length > 0) {
      onAddBulkTasks(stage.id, titles);
      setBulkTasks('');
      setIsBulkMode(false);
    }
  };

  const completedCount = stage.tasks.filter(t => t.completed).length;
  const totalCount = stage.tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="border bg-card/50">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            <div className="p-1.5 rounded-lg bg-primary/10">
              <IconComponent className="h-4 w-4 text-primary" />
            </div>
            
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 text-sm w-40"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span 
                className="font-medium cursor-pointer hover:text-primary"
                onDoubleClick={() => setIsEditingName(true)}
              >
                {stage.stage_name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {completedCount}/{totalCount}
            </Badge>
            {progress > 0 && (
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => onDelete(stage.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <CardContent className="p-3 space-y-2">
          {/* Tasks List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stage.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1 group">
                {stage.tasks.map((task) => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleTask(task.id)}
                    onDelete={() => onDeleteTask(task.id)}
                    onUpdate={(updates) => onUpdateTask(task.id, updates)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add Task */}
          {isBulkMode ? (
            <div className="space-y-2 pt-2 border-t">
              <Textarea
                placeholder="הוסף משימות מרובות (שורה לכל משימה)"
                value={bulkTasks}
                onChange={(e) => setBulkTasks(e.target.value)}
                className="min-h-[80px] text-sm"
                dir="rtl"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddBulkTasks}>
                  הוסף משימות
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsBulkMode(false)}>
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 pt-2 border-t">
              <Input
                placeholder="הוסף משימה חדשה..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="h-8 text-sm"
                dir="rtl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                }}
              />
              <Button size="sm" className="h-8" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={() => setIsBulkMode(true)}>
                <ListPlus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Main Component
export function ClientFoldersManager({ clientId }: ClientFoldersManagerProps) {
  const {
    folders,
    stages,
    activeFolderId,
    setActiveFolderId,
    loading,
    addFolder,
    updateFolder,
    deleteFolder,
    duplicateFolder,
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
    addTask,
    addBulkTasks,
    toggleTask,
    updateTask,
    deleteTask,
    reorderTasks,
  } = useClientFolders(clientId);

  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('Folder');
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageIcon, setNewStageIcon] = useState('FileText');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);
  const [duplicateDialog, setDuplicateDialog] = useState<{ id: string; name: string } | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  const handleAddFolder = async () => {
    if (newFolderName.trim()) {
      await addFolder(newFolderName.trim(), newFolderIcon);
      setNewFolderName('');
      setNewFolderIcon('Folder');
      setIsAddFolderOpen(false);
    }
  };

  const handleAddStage = async () => {
    if (newStageName.trim()) {
      await addStage(newStageName.trim(), newStageIcon);
      setNewStageName('');
      setNewStageIcon('FileText');
      setIsAddStageOpen(false);
    }
  };

  const handleDuplicateFolder = async () => {
    if (duplicateDialog && duplicateName.trim()) {
      await duplicateFolder(duplicateDialog.id, duplicateName.trim());
      setDuplicateDialog(null);
      setDuplicateName('');
    }
  };

  const activeFolder = folders.find(f => f.id === activeFolderId);

  if (loading && folders.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Folders Tabs */}
      <div className="flex items-center gap-2 flex-wrap border-b pb-2">
        {folders.map((folder) => {
          const IconComponent = iconMap[folder.folder_icon || 'Folder'] || Folder;
          return (
            <ContextMenu key={folder.id}>
              <ContextMenuTrigger>
                <Button
                  variant={activeFolderId === folder.id ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => setActiveFolderId(folder.id)}
                >
                  <IconComponent className="h-4 w-4" />
                  {editingFolder?.id === folder.id ? (
                    <Input
                      value={editingFolder.name}
                      onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                      className="h-6 w-24 text-xs"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          updateFolder(folder.id, { folder_name: editingFolder.name });
                          setEditingFolder(null);
                        }
                        if (e.key === 'Escape') {
                          setEditingFolder(null);
                        }
                      }}
                      onBlur={() => {
                        updateFolder(folder.id, { folder_name: editingFolder.name });
                        setEditingFolder(null);
                      }}
                    />
                  ) : (
                    folder.folder_name
                  )}
                </Button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => setEditingFolder({ id: folder.id, name: folder.folder_name })}>
                  <Edit className="h-4 w-4 ml-2" />
                  שנה שם
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                  setDuplicateDialog({ id: folder.id, name: folder.folder_name });
                  setDuplicateName(`${folder.folder_name} - העתק`);
                }}>
                  <Copy className="h-4 w-4 ml-2" />
                  שכפל תיקייה
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem 
                  className="text-destructive"
                  onClick={() => setDeleteConfirm(folder.id)}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק תיקייה
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
        
        {/* Add Folder Button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 border-2 border-dashed"
          onClick={() => setIsAddFolderOpen(true)}
        >
          <FolderPlus className="h-4 w-4" />
          תיקייה חדשה
        </Button>
      </div>

      {/* Active Folder Content */}
      {activeFolder ? (
        <div className="space-y-4">
          {/* Folder Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{activeFolder.folder_name}</h3>
              <Badge variant="secondary">{stages.length} שלבים</Badge>
            </div>
            <Button size="sm" onClick={() => setIsAddStageOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              הוסף שלב
            </Button>
          </div>

          {/* Stages */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {stages.map((stage) => (
                <StageCard
                  key={stage.id}
                  stage={stage as ClientFolderStage & { tasks: ClientFolderTask[] }}
                  onUpdate={updateStage}
                  onDelete={deleteStage}
                  onAddTask={addTask}
                  onAddBulkTasks={addBulkTasks}
                  onToggleTask={toggleTask}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  onReorderTasks={reorderTasks}
                />
              ))}
              
              {stages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>אין שלבים בתיקייה זו</p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsAddStageOpen(true)}
                  >
                    הוסף שלב ראשון
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Folder className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">אין תיקיות עדיין</h3>
          <p className="mb-4">צור תיקייה ראשונה כדי לארגן את השלבים של הלקוח</p>
          <Button onClick={() => setIsAddFolderOpen(true)} className="gap-2">
            <FolderPlus className="h-4 w-4" />
            צור תיקייה ראשונה
          </Button>
        </div>
      )}

      {/* Add Folder Dialog */}
      <Dialog open={isAddFolderOpen} onOpenChange={setIsAddFolderOpen}>
        <DialogContent dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>תיקייה חדשה</DialogTitle>
            <DialogDescription>
              צור תיקייה חדשה לניהול שלבים ומשימות
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">שם התיקייה</label>
              <Input
                placeholder='למשל: היתר בניה, שינוי תב"ע...'
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFolder();
                }}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">אייקון</label>
              <div className="grid grid-cols-5 gap-2">
                {ICON_OPTIONS.map((option) => {
                  const Icon = iconMap[option.value] || Folder;
                  return (
                    <Button
                      key={option.value}
                      variant={newFolderIcon === option.value ? 'default' : 'outline'}
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => setNewFolderIcon(option.value)}
                      title={option.label}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setIsAddFolderOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddFolder} disabled={!newFolderName.trim()}>
              צור תיקייה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog open={isAddStageOpen} onOpenChange={setIsAddStageOpen}>
        <DialogContent dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>שלב חדש</DialogTitle>
            <DialogDescription>
              הוסף שלב חדש לתיקייה "{activeFolder?.folder_name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">שם השלב</label>
              <Input
                placeholder="למשל: הגשת בקשה, אישור..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStage();
                }}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">אייקון</label>
              <div className="grid grid-cols-5 gap-2">
                {ICON_OPTIONS.map((option) => {
                  const Icon = iconMap[option.value] || FileText;
                  return (
                    <Button
                      key={option.value}
                      variant={newStageIcon === option.value ? 'default' : 'outline'}
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => setNewStageIcon(option.value)}
                      title={option.label}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setIsAddStageOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddStage} disabled={!newStageName.trim()}>
              הוסף שלב
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Folder Dialog */}
      <Dialog open={!!duplicateDialog} onOpenChange={() => setDuplicateDialog(null)}>
        <DialogContent dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>שכפול תיקייה</DialogTitle>
            <DialogDescription>
              שכפל את "{duplicateDialog?.name}" כולל כל השלבים והמשימות
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">שם התיקייה החדשה</label>
            <Input
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDuplicateFolder();
              }}
            />
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setDuplicateDialog(null)}>
              ביטול
            </Button>
            <Button onClick={handleDuplicateFolder} disabled={!duplicateName.trim()}>
              שכפל תיקייה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>האם למחוק את התיקייה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את התיקייה וכל השלבים והמשימות שבה. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm) {
                  deleteFolder(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
            >
              מחק תיקייה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
