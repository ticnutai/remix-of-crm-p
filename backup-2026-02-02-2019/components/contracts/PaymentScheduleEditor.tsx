// עורך לוח תשלומים דינמי
// מאפשר עריכת אחוזים, שלבים ותאריכים

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Calculator, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PaymentStep {
  description: string;
  percentage: number;
  days_offset: number;
  milestone_type?: 'signing' | 'approval' | 'completion' | 'delivery' | 'custom';
}

export interface GeneratedPayment {
  payment_number: number;
  description: string;
  amount: number;
  percentage: number;
  due_date: string;
}

interface PaymentScheduleEditorProps {
  steps: PaymentStep[];
  onChange: (steps: PaymentStep[]) => void;
  contractValue?: number;
  startDate?: string;
  showPreview?: boolean;
}

const MILESTONE_TYPES = [
  { value: 'signing', label: 'חתימת חוזה' },
  { value: 'approval', label: 'אישור' },
  { value: 'completion', label: 'סיום עבודה' },
  { value: 'delivery', label: 'מסירה' },
  { value: 'custom', label: 'מותאם אישית' },
];

const DEFAULT_STEPS: PaymentStep[] = [
  { description: 'עם חתימת חוזה', percentage: 30, days_offset: 0, milestone_type: 'signing' },
  { description: 'באמצע העבודה', percentage: 40, days_offset: 30, milestone_type: 'approval' },
  { description: 'בסיום העבודה', percentage: 30, days_offset: 60, milestone_type: 'completion' },
];

export function PaymentScheduleEditor({
  steps,
  onChange,
  contractValue = 0,
  startDate,
  showPreview = true,
}: PaymentScheduleEditorProps) {
  const [localSteps, setLocalSteps] = useState<PaymentStep[]>(steps.length > 0 ? steps : DEFAULT_STEPS);

  // סנכרון עם props
  useEffect(() => {
    if (steps.length > 0) {
      setLocalSteps(steps);
    }
  }, [steps]);

  // עדכון ההורה
  const updateSteps = (newSteps: PaymentStep[]) => {
    setLocalSteps(newSteps);
    onChange(newSteps);
  };

  // הוספת שלב
  const addStep = () => {
    const lastStep = localSteps[localSteps.length - 1];
    const newStep: PaymentStep = {
      description: 'שלב חדש',
      percentage: 0,
      days_offset: (lastStep?.days_offset || 0) + 30,
      milestone_type: 'custom',
    };
    updateSteps([...localSteps, newStep]);
  };

  // מחיקת שלב
  const deleteStep = (index: number) => {
    const newSteps = localSteps.filter((_, i) => i !== index);
    updateSteps(newSteps);
  };

  // עדכון שלב
  const updateStep = (index: number, updates: Partial<PaymentStep>) => {
    const newSteps = [...localSteps];
    newSteps[index] = { ...newSteps[index], ...updates };
    updateSteps(newSteps);
  };

  // חישוב סה"כ אחוזים
  const totalPercentage = localSteps.reduce((sum, s) => sum + (s.percentage || 0), 0);
  const isValidTotal = totalPercentage === 100;

  // יצירת תצוגה מקדימה
  const generatePreview = (): GeneratedPayment[] => {
    const baseDate = startDate ? new Date(startDate) : new Date();
    
    return localSteps.map((step, index) => ({
      payment_number: index + 1,
      description: step.description,
      percentage: step.percentage,
      amount: Math.round((contractValue * step.percentage) / 100),
      due_date: format(addDays(baseDate, step.days_offset), 'yyyy-MM-dd'),
    }));
  };

  const preview = generatePreview();

  // חלוקה שווה
  const distributeEvenly = () => {
    const count = localSteps.length;
    if (count === 0) return;
    
    const basePercentage = Math.floor(100 / count);
    const remainder = 100 - (basePercentage * count);
    
    const newSteps = localSteps.map((step, index) => ({
      ...step,
      percentage: basePercentage + (index === 0 ? remainder : 0),
    }));
    
    updateSteps(newSteps);
  };

  return (
    <div className="space-y-4">
      {/* כותרת */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-base font-semibold">לוח תשלומים</Label>
          <Badge 
            variant={isValidTotal ? 'default' : 'destructive'}
            className="text-xs"
          >
            {totalPercentage}%
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={distributeEvenly}
            title="חלוקה שווה"
          >
            <Calculator className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStep}
          >
            <Plus className="h-4 w-4 ml-1" />
            הוסף שלב
          </Button>
        </div>
      </div>

      {/* הודעת שגיאה */}
      {!isValidTotal && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          סה"כ האחוזים צריך להיות 100% (כרגע: {totalPercentage}%)
        </div>
      )}

      {/* רשימת שלבים */}
      <div className="space-y-2">
        {localSteps.map((step, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move flex-shrink-0" />
            
            <span className="text-sm font-medium text-muted-foreground w-6">
              {index + 1}.
            </span>

            {/* תיאור */}
            <Input
              value={step.description}
              onChange={(e) => updateStep(index, { description: e.target.value })}
              placeholder="תיאור השלב"
              className="flex-1 min-w-[150px]"
            />

            {/* אחוז */}
            <div className="flex items-center gap-1 w-20">
              <Input
                type="number"
                value={step.percentage}
                onChange={(e) => updateStep(index, { percentage: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                className="w-16 text-center"
              />
              <span className="text-sm">%</span>
            </div>

            {/* ימים מההתחלה */}
            <div className="flex items-center gap-1 w-24">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={step.days_offset}
                onChange={(e) => updateStep(index, { days_offset: parseInt(e.target.value) || 0 })}
                min={0}
                className="w-16 text-center"
                title="ימים מתאריך התחלה"
              />
            </div>

            {/* סוג אבן דרך */}
            <Select
              value={step.milestone_type || 'custom'}
              onValueChange={(v) => updateStep(index, { milestone_type: v as PaymentStep['milestone_type'] })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MILESTONE_TYPES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* מחיקה */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => deleteStep(index)}
              className="text-destructive hover:text-destructive flex-shrink-0"
              disabled={localSteps.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* תצוגה מקדימה */}
      {showPreview && contractValue > 0 && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/20">
          <Label className="text-sm font-medium mb-2 block">תצוגה מקדימה</Label>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right py-1 px-2">מס'</th>
                <th className="text-right py-1 px-2">תיאור</th>
                <th className="text-right py-1 px-2">אחוז</th>
                <th className="text-right py-1 px-2">סכום</th>
                <th className="text-right py-1 px-2">תאריך</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((payment) => (
                <tr key={payment.payment_number} className="border-b last:border-0">
                  <td className="py-1 px-2">{payment.payment_number}</td>
                  <td className="py-1 px-2">{payment.description}</td>
                  <td className="py-1 px-2">{payment.percentage}%</td>
                  <td className="py-1 px-2 font-medium">₪{payment.amount.toLocaleString('he-IL')}</td>
                  <td className="py-1 px-2">{format(new Date(payment.due_date), 'dd/MM/yyyy')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2">
                <td colSpan={2} className="py-2 px-2">סה"כ</td>
                <td className="py-2 px-2">{totalPercentage}%</td>
                <td className="py-2 px-2">₪{contractValue.toLocaleString('he-IL')}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// פונקציה ליצירת לוח תשלומים מוכן לשמירה
export function generatePaymentSchedule(
  steps: PaymentStep[],
  startDate: Date,
  totalValue: number
): GeneratedPayment[] {
  return steps.map((step, index) => ({
    payment_number: index + 1,
    description: step.description,
    percentage: step.percentage,
    amount: Math.round((totalValue * step.percentage) / 100),
    due_date: format(addDays(startDate, step.days_offset), 'yyyy-MM-dd'),
  }));
}

export default PaymentScheduleEditor;
