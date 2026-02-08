import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  Plus, 
  Pencil, 
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Budget, EXPENSE_CATEGORIES, formatCurrency } from '@/hooks/useFinanceCalculations';

interface BudgetManagerProps {
  expenses: { category: string; amount: number }[];
  year: number;
}

export default function BudgetManager({ expenses, year }: BudgetManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    planned_amount: '',
  });

  useEffect(() => {
    fetchBudgets();
  }, [user, year]);

  const fetchBudgets = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year);

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !formData.category || !formData.planned_amount) {
      toast({ title: 'נא למלא את כל השדות', variant: 'destructive' });
      return;
    }

    try {
      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({ 
            planned_amount: parseFloat(formData.planned_amount),
          })
          .eq('id', editingBudget.id);

        if (error) throw error;
        toast({ title: 'התקציב עודכן בהצלחה' });
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            year,
            category: formData.category,
            planned_amount: parseFloat(formData.planned_amount),
          });

        if (error) throw error;
        toast({ title: 'התקציב נוצר בהצלחה' });
      }

      setIsDialogOpen(false);
      setEditingBudget(null);
      setFormData({ category: '', planned_amount: '' });
      fetchBudgets();
    } catch (error: any) {
      toast({ title: 'שגיאה בשמירת תקציב', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
      toast({ title: 'התקציב נמחק' });
      fetchBudgets();
    } catch (error: any) {
      toast({ title: 'שגיאה במחיקת תקציב', description: error.message, variant: 'destructive' });
    }
  };

  const openEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      planned_amount: budget.planned_amount.toString(),
    });
    setIsDialogOpen(true);
  };

  const getActualExpense = (category: string) => {
    const expense = expenses.find(e => e.category === category);
    return expense?.amount || 0;
  };

  const getCategoryLabel = (category: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const categoriesWithoutBudget = EXPENSE_CATEGORIES.filter(
    cat => !budgets.some(b => b.category === cat.value)
  );

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.planned_amount), 0);
  const totalActual = budgets.reduce((sum, b) => sum + getActualExpense(b.category), 0);
  const overBudgetItems = budgets.filter(b => getActualExpense(b.category) > Number(b.planned_amount));

  return (
    <Card className="border-2 border-yellow-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-600" />
              ניהול תקציבים
            </CardTitle>
            <CardDescription>הגדרת תקציבים לפי קטגוריה והשוואה לביצוע בפועל</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{year}</Badge>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingBudget(null);
                setFormData({ category: '', planned_amount: '' });
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={categoriesWithoutBudget.length === 0}>
                  <Plus className="h-4 w-4 ml-1" />
                  הוסף תקציב
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader className="text-right">
                  <DialogTitle>{editingBudget ? 'עריכת תקציב' : 'הוספת תקציב'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>קטגוריה</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      disabled={!!editingBudget}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                      </SelectTrigger>
                      <SelectContent>
                        {(editingBudget ? EXPENSE_CATEGORIES : categoriesWithoutBudget).map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>תקציב שנתי (₪)</Label>
                    <Input
                      type="number"
                      value={formData.planned_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, planned_amount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleSave}>
                    {editingBudget ? 'עדכן' : 'שמור'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerts */}
        {overBudgetItems.length > 0 && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              חריגת תקציב ב-{overBudgetItems.length} קטגוריות: {overBudgetItems.map(b => getCategoryLabel(b.category)).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        {budgets.length > 0 && (
          <div className="p-4 bg-accent/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">סה"כ תקציבים</span>
              <div className="text-end">
                <span className={`font-bold ${totalActual > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(totalActual)}
                </span>
                <span className="text-muted-foreground mx-1">/</span>
                <span>{formatCurrency(totalBudget)}</span>
              </div>
            </div>
            <Progress 
              value={Math.min((totalActual / totalBudget) * 100, 100)} 
              className={totalActual > totalBudget ? '[&>div]:bg-red-500' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{Math.round((totalActual / totalBudget) * 100)}% ניצול</span>
              <span>יתרה: {formatCurrency(totalBudget - totalActual)}</span>
            </div>
          </div>
        )}

        {/* Budget list */}
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">טוען...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>אין תקציבים מוגדרים</p>
            <p className="text-sm">הוסף תקציב לפי קטגוריה כדי להתחיל במעקב</p>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const actual = getActualExpense(budget.category);
              const planned = Number(budget.planned_amount);
              const percentage = planned > 0 ? (actual / planned) * 100 : 0;
              const isOverBudget = actual > planned;

              return (
                <div 
                  key={budget.id} 
                  className={`p-4 border rounded-lg ${isOverBudget ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isOverBudget ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : percentage >= 80 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <span className="font-medium">{getCategoryLabel(budget.category)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEdit(budget)}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(budget.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={isOverBudget ? 'text-red-600 font-medium' : ''}>
                        {formatCurrency(actual)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(planned)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={isOverBudget ? '[&>div]:bg-red-500' : percentage >= 80 ? '[&>div]:bg-yellow-500' : ''}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{Math.round(percentage)}% ניצול</span>
                      {isOverBudget ? (
                        <span className="text-red-600">חריגה: {formatCurrency(actual - planned)}</span>
                      ) : (
                        <span>יתרה: {formatCurrency(planned - actual)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
