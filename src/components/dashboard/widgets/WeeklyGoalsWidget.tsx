// Widget: Weekly Goals - יעדים שבועיים
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Check, Trash2, Edit2, Save, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WeeklyGoal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  week_start: string;
  category: 'revenue' | 'clients' | 'projects' | 'tasks' | 'custom';
}

const CATEGORY_COLORS = {
  revenue: 'bg-green-500',
  clients: 'bg-blue-500',
  projects: 'bg-purple-500',
  tasks: 'bg-orange-500',
  custom: 'bg-gray-500',
};

const CATEGORY_LABELS = {
  revenue: 'הכנסות',
  clients: 'לקוחות',
  projects: 'פרויקטים',
  tasks: 'משימות',
  custom: 'מותאם אישית',
};

function getWeekStart() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(today.setDate(diff)).toISOString().split('T')[0];
}

export function WeeklyGoalsWidget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const weekStart = getWeekStart();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    target_value: 0,
    unit: '',
    category: 'custom' as const,
  });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['weekly_goals', weekStart],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('weekly_goals')
        .select('*')
        .eq('week_start', weekStart)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as WeeklyGoal[];
    }
  });

  const addGoalMutation = useMutation({
    mutationFn: async (goal: Partial<WeeklyGoal>) => {
      const { data, error } = await (supabase as any)
        .from('weekly_goals')
        .insert([{ ...goal, week_start: weekStart, current_value: 0 }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly_goals'] });
      setIsAdding(false);
      setNewGoal({ title: '', target_value: 0, unit: '', category: 'custom' });
      toast({ title: 'יעד נוסף בהצלחה' });
    },
    onError: () => {
      toast({ title: 'שגיאה בהוספת יעד', variant: 'destructive' });
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, current_value }: { id: string; current_value: number }) => {
      const { error } = await (supabase as any)
        .from('weekly_goals')
        .update({ current_value })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly_goals'] });
      setEditingId(null);
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('weekly_goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly_goals'] });
      toast({ title: 'יעד נמחק' });
    }
  });

  const handleAddGoal = () => {
    if (!newGoal.title || newGoal.target_value <= 0) return;
    addGoalMutation.mutate(newGoal);
  };

  const totalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.current_value / g.target_value) * 100, 0) / goals.length)
    : 0;

  const completedGoals = goals.filter(g => g.current_value >= g.target_value).length;

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          יעדים שבועיים
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">התקדמות כוללת</span>
          <Badge variant={totalProgress >= 100 ? 'default' : 'secondary'}>
            {completedGoals}/{goals.length} הושלמו
          </Badge>
        </div>
        <Progress value={totalProgress} className="h-2" />
        
        {/* Add New Goal Form */}
        {isAdding && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <Input
              placeholder="שם היעד"
              value={newGoal.title}
              onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="ערך יעד"
                value={newGoal.target_value || ''}
                onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: Number(e.target.value) }))}
              />
              <Input
                placeholder="יחידה (₪, לקוחות...)"
                value={newGoal.unit}
                onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
              />
            </div>
            <Button 
              size="sm" 
              className="w-full" 
              onClick={handleAddGoal}
              disabled={!newGoal.title || newGoal.target_value <= 0}
            >
              הוסף יעד
            </Button>
          </div>
        )}
        
        {/* Goals List */}
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-4">טוען...</div>
        ) : goals.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            אין יעדים לשבוע זה. לחץ + להוספה
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const progress = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
              const isComplete = progress >= 100;
              
              return (
                <div key={goal.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[goal.category]}`} />
                      <span className={`text-sm ${isComplete ? 'line-through text-muted-foreground' : ''}`}>
                        {goal.title}
                      </span>
                      {isComplete && <Check className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingId === goal.id ? (
                        <>
                          <Input
                            type="number"
                            className="w-20 h-7 text-xs"
                            defaultValue={goal.current_value}
                            onBlur={(e) => {
                              updateGoalMutation.mutate({
                                id: goal.id,
                                current_value: Number(e.target.value)
                              });
                            }}
                            autoFocus
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">
                            {goal.current_value}/{goal.target_value} {goal.unit}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => setEditingId(goal.id)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteGoalMutation.mutate(goal.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WeeklyGoalsWidget;
