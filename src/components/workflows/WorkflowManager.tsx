import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Settings2,
  ArrowRight,
  CheckCircle,
  FileText,
  Mail,
  MessageSquare,
  Bell,
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  last_run_at?: string;
  run_count: number;
  created_at: string;
}

const TRIGGERS = {
  quote_approved: { label: 'הצעת מחיר אושרה', icon: CheckCircle },
  quote_sent: { label: 'הצעת מחיר נשלחה', icon: FileText },
  contract_signed: { label: 'חוזה נחתם', icon: FileText },
  invoice_paid: { label: 'חשבונית שולמה', icon: CheckCircle },
  invoice_overdue: { label: 'חשבונית באיחור', icon: Bell },
  task_completed: { label: 'משימה הושלמה', icon: CheckCircle },
  client_created: { label: 'לקוח חדש נוצר', icon: Bell },
  project_started: { label: 'פרויקט התחיל', icon: Play },
  manual: { label: 'הפעלה ידנית', icon: Play },
};

const ACTIONS = {
  create_task: { label: 'צור משימה', icon: CheckCircle },
  send_email: { label: 'שלח אימייל', icon: Mail },
  send_sms: { label: 'שלח SMS', icon: MessageSquare },
  create_invoice: { label: 'צור חשבונית', icon: FileText },
  create_contract: { label: 'צור חוזה', icon: FileText },
  notify_user: { label: 'שלח התראה', icon: Bell },
};

function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Workflow[];
    }
  });
}

export function WorkflowManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: workflows = [], isLoading } = useWorkflows();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'quote_approved',
    actions: [{ type: 'create_task', config: {} }] as Array<{ type: string; config: Record<string, any> }>,
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await (supabase as any).from('workflows').insert({
        ...data,
        is_active: true,
        trigger_conditions: {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({ title: 'האוטומציה נוצרה בהצלחה' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'שגיאה ביצירת האוטומציה', variant: 'destructive' });
    }
  });
  
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('workflows')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('workflows')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({ title: 'האוטומציה נמחקה' });
    }
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'quote_approved',
      actions: [{ type: 'create_task', config: {} }],
    });
    setEditingWorkflow(null);
  };
  
  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'notify_user', config: {} }],
    });
  };
  
  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };
  
  const updateAction = (index: number, type: string) => {
    const newActions = [...formData.actions];
    newActions[index] = { type, config: {} };
    setFormData({ ...formData, actions: newActions });
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6" />
          אוטומציות
        </h1>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              אוטומציה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>יצירת אוטומציה חדשה</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }} className="space-y-4">
              <Input
                placeholder="שם האוטומציה"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              
              <Textarea
                placeholder="תיאור (אופציונלי)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
              
              <div>
                <label className="text-sm font-medium">כאשר קורה:</label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGERS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">בצע פעולות:</label>
                  <Button type="button" variant="outline" size="sm" onClick={addAction}>
                    <Plus className="h-3 w-3 ml-1" />
                    הוסף
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                      <Select
                        value={action.type}
                        onValueChange={(v) => updateAction(index, v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACTIONS).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.actions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAction(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'יוצר...' : 'צור אוטומציה'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Workflows List */}
      {isLoading ? (
        <div className="text-center py-8">טוען...</div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">אין אוטומציות</h3>
            <p className="text-muted-foreground mt-1">
              צור אוטומציה ראשונה כדי לחסוך זמן ולייעל תהליכים
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => {
            const trigger = TRIGGERS[workflow.trigger_type as keyof typeof TRIGGERS];
            const TriggerIcon = trigger?.icon || Zap;
            
            return (
              <Card key={workflow.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${workflow.is_active ? 'bg-green-100' : 'bg-muted'}`}>
                      <TriggerIcon className={`h-5 w-5 ${workflow.is_active ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{workflow.name}</h3>
                        <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                          {workflow.is_active ? 'פעיל' : 'מושהה'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {trigger?.label || workflow.trigger_type}
                        <ArrowRight className="inline h-3 w-3 mx-2" />
                        {workflow.actions.map((a) => ACTIONS[a.type as keyof typeof ACTIONS]?.label).join(', ')}
                      </p>
                      {workflow.run_count > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          הופעל {workflow.run_count} פעמים
                          {workflow.last_run_at && ` • לאחרונה ${new Date(workflow.last_run_at).toLocaleDateString('he-IL')}`}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={workflow.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: workflow.id, is_active: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('האם למחוק את האוטומציה?')) {
                            deleteMutation.mutate(workflow.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WorkflowManager;
