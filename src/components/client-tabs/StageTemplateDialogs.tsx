import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  Layers, 
  FolderOpen, 
  Phone, 
  Send, 
  MapPin,
  FileText,
  Clock,
  CheckSquare,
  Loader2,
  Copy,
  Users,
  Search,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStageTemplates, StageTemplate, ClientStage } from '@/hooks/useStageTemplates';
import { cn } from '@/lib/utils';

// Icon mapping
const STAGE_ICONS: Record<string, React.ElementType> = {
  Phone,
  FolderOpen,
  Send,
  MapPin,
  FileText,
  Clock,
  CheckSquare,
  Layers,
};

// ============================================
// Save Stage As Template Dialog
// ============================================

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: ClientStage;
  onSaved?: () => void;
}

export function SaveAsTemplateDialog({ 
  open, 
  onOpenChange, 
  stage,
  onSaved,
}: SaveAsTemplateDialogProps) {
  const { saveStageAsTemplate } = useStageTemplates();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && stage) {
      setName(stage.stage_name);
      setDescription('');
    }
  }, [open, stage]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setSaving(true);
    const result = await saveStageAsTemplate(stage, name, description || undefined);
    setSaving(false);

    if (result) {
      onOpenChange(false);
      onSaved?.();
    }
  };

  const Icon = STAGE_ICONS[stage?.stage_icon || 'FolderOpen'] || FolderOpen;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            שמור כתבנית
          </DialogTitle>
          <DialogDescription>
            שמור את השלב והמשימות שלו כתבנית לשימוש חוזר
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <div className="bg-muted/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-medium">{stage?.stage_name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {stage?.tasks?.length || 0} משימות
            </div>
            {stage?.tasks && stage.tasks.length > 0 && (
              <div className="mt-2 space-y-1">
                {stage.tasks.slice(0, 3).map((task, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {task.title}
                  </div>
                ))}
                {stage.tasks.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{stage.tasks.length - 3} משימות נוספות
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="template-name">שם התבנית</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: תבנית התקשרות לקוח"
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <Label htmlFor="template-desc">תיאור (אופציונלי)</Label>
            <Textarea
              id="template-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של התבנית..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            שמור תבנית
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Save All Stages As Template Dialog
// ============================================

interface SaveAllStagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: ClientStage[];
  onSaved?: () => void;
}

export function SaveAllStagesDialog({ 
  open, 
  onOpenChange, 
  stages,
  onSaved,
}: SaveAllStagesDialogProps) {
  const { saveMultiStageTemplate } = useStageTemplates();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [includeTaskContent, setIncludeTaskContent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setIncludeTaskContent(false);
      // Select all by default
      setSelectedStages(new Set(stages.map(s => s.stage_id)));
    }
  }, [open, stages]);

  const toggleStage = (stageId: string) => {
    const newSet = new Set(selectedStages);
    if (newSet.has(stageId)) {
      newSet.delete(stageId);
    } else {
      newSet.add(stageId);
    }
    setSelectedStages(newSet);
  };

  const handleSave = async () => {
    if (!name.trim() || selectedStages.size === 0) {
      console.log('[SaveAllStagesDialog] Validation failed:', { name: name.trim(), selectedStagesCount: selectedStages.size });
      return;
    }
    
    const stagesToSave = stages.filter(s => selectedStages.has(s.stage_id));
    
    console.log('[SaveAllStagesDialog] Saving template:', {
      name,
      description,
      includeTaskContent,
      stagesToSave: stagesToSave.map(s => ({
        stage_id: s.stage_id,
        stage_name: s.stage_name,
        stage_icon: s.stage_icon,
        sort_order: s.sort_order,
        tasksCount: s.tasks?.length || 0,
        tasks: s.tasks,
      })),
    });
    
    setSaving(true);
    const result = await saveMultiStageTemplate(stagesToSave, name, description || undefined, includeTaskContent);
    setSaving(false);

    console.log('[SaveAllStagesDialog] Save result:', result);

    if (result) {
      onOpenChange(false);
      onSaved?.();
    }
  };

  const totalTasks = stages
    .filter(s => selectedStages.has(s.stage_id))
    .reduce((sum, s) => sum + (s.tasks?.length || 0), 0);

  // Count completed tasks for preview
  const completedTasks = stages
    .filter(s => selectedStages.has(s.stage_id))
    .reduce((sum, s) => sum + (s.tasks?.filter((t: any) => t.completed)?.length || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            שמור כל השלבים כתבנית
          </DialogTitle>
          <DialogDescription>
            בחר את השלבים לשמירה ותן שם לתבנית
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="multi-template-name">שם התבנית</Label>
            <Input
              id="multi-template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: תבנית לקוח חדש מלאה"
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <Label htmlFor="multi-template-desc">תיאור (אופציונלי)</Label>
            <Textarea
              id="multi-template-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של התבנית..."
              rows={2}
            />
          </div>

          {/* Include task content checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <Checkbox 
              id="include-task-content"
              checked={includeTaskContent}
              onCheckedChange={(checked) => setIncludeTaskContent(checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="include-task-content" className="font-medium cursor-pointer">
                שמור כולל המילוי
              </Label>
              <p className="text-xs text-muted-foreground">
                ישמור את סטטוס השלמת המשימות, צבעים ועיצוב
                {completedTasks > 0 && (
                  <span className="text-primary"> ({completedTasks} משימות מושלמות)</span>
                )}
              </p>
            </div>
          </div>

          <Separator />

          {/* Stages selection */}
          <div className="space-y-2">
            <Label>בחר שלבים ({selectedStages.size} נבחרו)</Label>
            <ScrollArea className="h-[200px] border rounded-lg p-2">
              <div className="space-y-2">
                {stages.map(stage => {
                  const Icon = STAGE_ICONS[stage.stage_icon || 'FolderOpen'] || FolderOpen;
                  return (
                    <div
                      key={stage.stage_id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedStages.has(stage.stage_id) 
                          ? "bg-primary/10 border border-primary/30" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleStage(stage.stage_id)}
                    >
                      <Checkbox 
                        checked={selectedStages.has(stage.stage_id)}
                        onCheckedChange={() => toggleStage(stage.stage_id)}
                      />
                      <Icon className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{stage.stage_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {stage.tasks?.length || 0} משימות
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <Badge variant="secondary">{selectedStages.size} שלבים</Badge>
            <Badge variant="secondary">{totalTasks} משימות</Badge>
            {includeTaskContent && (
              <Badge variant="default" className="bg-primary">כולל מילוי</Badge>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || selectedStages.size === 0}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {includeTaskContent ? 'שמור תבנית עם מילוי' : 'שמור תבנית'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Apply Template Dialog
// ============================================

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  existingStagesCount: number;
  onApplied?: () => void;
}

export function ApplyTemplateDialog({ 
  open, 
  onOpenChange, 
  clientId,
  existingStagesCount,
  onApplied,
}: ApplyTemplateDialogProps) {
  const { templates, loading, applyTemplate, deleteTemplate, updateTemplate } = useStageTemplates();
  const [applying, setApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAllTasks, setShowAllTasks] = useState<Record<string, boolean>>({});

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleApply = async (templateId: string) => {
    setApplying(true);
    const result = await applyTemplate(templateId, clientId, existingStagesCount);
    setApplying(false);

    if (result) {
      onOpenChange(false);
      onApplied?.();
    }
  };

  const handleDelete = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('האם למחוק את התבנית?')) {
      await deleteTemplate(templateId);
    }
  };

  const handleStartEdit = (template: StageTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(template.id);
    setEditName(template.name);
  };

  const handleSaveEdit = async (templateId: string) => {
    if (editName.trim()) {
      await updateTemplate(templateId, { name: editName });
    }
    setEditingTemplate(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            הוסף מתבנית
          </DialogTitle>
          <DialogDescription>
            בחר תבנית להוספה ללקוח
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש תבנית..."
              className="pr-9"
            />
          </div>

          {/* Templates list */}
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'לא נמצאו תבניות' : 'אין תבניות שמורות'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map(template => {
                  const isExpanded = expandedTemplate === template.id;
                  const isEditing = editingTemplate === template.id;
                  const Icon = STAGE_ICONS[template.icon] || Layers;
                  const totalTasks = template.stages?.reduce(
                    (sum, s) => sum + (s.tasks?.length || 0), 0
                  ) || template.tasks?.length || 0;

                  return (
                    <div
                      key={template.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div
                        className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(template.id);
                                  if (e.key === 'Escape') setEditingTemplate(null);
                                }}
                                autoFocus
                                className="h-7"
                              />
                            ) : (
                              <div className="font-medium truncate">{template.name}</div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              {template.is_multi_stage ? (
                                <>
                                  <Badge variant="outline" className="text-[10px]">
                                    {template.stages?.length || 0} שלבים
                                  </Badge>
                                  <span>{totalTasks} משימות</span>
                                </>
                              ) : (
                                <span>{totalTasks} משימות</span>
                              )}
                              {template.includes_task_content && (
                                <Badge variant="default" className="text-[10px] bg-primary">כולל מילוי</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit(template.id);
                                }}
                              >
                                שמור
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => handleStartEdit(template, e)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={(e) => handleDelete(template.id, e)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="border-t bg-muted/30 p-3 text-right" dir="rtl">
                          {template.description && (
                            <p className="text-sm text-muted-foreground mb-3 text-right">
                              {template.description}
                            </p>
                          )}
                          
                          {template.stages && template.stages.length > 0 && (
                            <div className="space-y-3 mb-3 max-h-[250px] overflow-y-auto">
                              {template.stages.map((stage, stageIndex) => {
                                const StageIcon = STAGE_ICONS[stage.stage_icon] || FolderOpen;
                                const stageKey = `${template.id}-${stage.id}`;
                                const showAll = showAllTasks[stageKey];
                                const tasksToShow = showAll ? stage.tasks : stage.tasks?.slice(0, 3);
                                
                                return (
                                  <div key={stage.id} className="text-sm text-right border-b border-muted pb-2 last:border-b-0">
                                    <div className="flex items-center gap-2 font-medium justify-start mb-1">
                                      <StageIcon className="h-4 w-4 text-primary" />
                                      <span>{stage.stage_name}</span>
                                      <Badge variant="outline" className="text-[10px] mr-auto">
                                        {stage.tasks?.length || 0} משימות
                                      </Badge>
                                    </div>
                                    {stage.tasks && stage.tasks.length > 0 && (
                                      <div className="mr-6 mt-1 space-y-1">
                                        {tasksToShow?.map(task => (
                                          <div key={task.id} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <CheckSquare className="h-3 w-3 text-muted-foreground/60" />
                                            <span>{task.title}</span>
                                          </div>
                                        ))}
                                        {stage.tasks.length > 3 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowAllTasks(prev => ({
                                                ...prev,
                                                [stageKey]: !prev[stageKey]
                                              }));
                                            }}
                                            className="text-xs text-primary hover:underline mt-1"
                                          >
                                            {showAll ? 'הסתר' : `+${stage.tasks.length - 3} נוספות`}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <Button 
                            className="w-full" 
                            onClick={() => handleApply(template.id)}
                            disabled={applying}
                          >
                            {applying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            החל תבנית ({template.stages?.length || 0} שלבים, {totalTasks} משימות)
                            {template.includes_task_content && ' - כולל מילוי'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Copy Stages From Client Dialog
// ============================================

interface CopyStagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetClientId: string;
  onCopied?: () => void;
}

export function CopyStagesDialog({ 
  open, 
  onOpenChange, 
  targetClientId,
  onCopied,
}: CopyStagesDialogProps) {
  const { getClientsForCopy, getClientStages, copyStagesFromClient } = useStageTemplates();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientStages, setClientStages] = useState<ClientStage[]>([]);
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load clients on open
  useEffect(() => {
    if (open) {
      loadClients();
      setSelectedClient(null);
      setClientStages([]);
      setSelectedStages(new Set());
      setSearchQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadClients = async () => {
    setLoading(true);
    const data = await getClientsForCopy(targetClientId);
    setClients(data);
    setLoading(false);
  };

  const handleClientSelect = async (clientId: string) => {
    setSelectedClient(clientId);
    setLoading(true);
    const stages = await getClientStages(clientId);
    setClientStages(stages);
    setSelectedStages(new Set(stages.map(s => s.stage_id)));
    setLoading(false);
  };

  const toggleStage = (stageId: string) => {
    const newSet = new Set(selectedStages);
    if (newSet.has(stageId)) {
      newSet.delete(stageId);
    } else {
      newSet.add(stageId);
    }
    setSelectedStages(newSet);
  };

  const handleCopy = async () => {
    if (!selectedClient || selectedStages.size === 0) return;

    setCopying(true);
    const result = await copyStagesFromClient(
      selectedClient,
      targetClientId,
      Array.from(selectedStages)
    );
    setCopying(false);

    if (result) {
      onOpenChange(false);
      onCopied?.();
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTasks = clientStages
    .filter(s => selectedStages.has(s.stage_id))
    .reduce((sum, s) => sum + (s.tasks?.length || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            העתק שלבים מלקוח אחר
          </DialogTitle>
          <DialogDescription>
            בחר לקוח להעתקת השלבים והמשימות שלו
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client selection */}
          <div className="space-y-2">
            <Label>בחר לקוח מקור</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לקוח..."
                className="pr-9"
              />
            </div>
            <ScrollArea className="h-[150px] border rounded-lg">
              {loading && !selectedClient ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredClients.map(client => (
                    <div
                      key={client.id}
                      className={cn(
                        "p-2 rounded cursor-pointer transition-colors flex items-center gap-2",
                        selectedClient === client.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted"
                      )}
                      onClick={() => handleClientSelect(client.id)}
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{client.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Stages selection */}
          {selectedClient && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>בחר שלבים להעתקה ({selectedStages.size} נבחרו)</Label>
                <ScrollArea className="h-[180px] border rounded-lg p-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : clientStages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      אין שלבים ללקוח זה
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientStages.map(stage => {
                        const Icon = STAGE_ICONS[stage.stage_icon || 'FolderOpen'] || FolderOpen;
                        return (
                          <div
                            key={stage.stage_id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                              selectedStages.has(stage.stage_id)
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted"
                            )}
                            onClick={() => toggleStage(stage.stage_id)}
                          >
                            <Checkbox
                              checked={selectedStages.has(stage.stage_id)}
                              onCheckedChange={() => toggleStage(stage.stage_id)}
                            />
                            <Icon className="h-4 w-4 text-primary" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{stage.stage_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {stage.tasks?.length || 0} משימות
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Summary */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="secondary">{selectedStages.size} שלבים</Badge>
                  <Badge variant="secondary">{totalTasks} משימות</Badge>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button 
            onClick={handleCopy} 
            disabled={copying || !selectedClient || selectedStages.size === 0}
          >
            {copying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            העתק שלבים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
