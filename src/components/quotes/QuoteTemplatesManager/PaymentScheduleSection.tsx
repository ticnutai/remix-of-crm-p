// סקשן לוח תשלומים
import React from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentStep } from './types';

interface PaymentScheduleSectionProps {
  steps: PaymentStep[];
  onUpdate: (steps: PaymentStep[]) => void;
  primaryColor?: string;
}

export function PaymentScheduleSection({
  steps,
  onUpdate,
  primaryColor = '#d8ac27',
}: PaymentScheduleSectionProps) {
  const addStep = () => {
    const newStep: PaymentStep = {
      id: crypto.randomUUID(),
      percentage: 0,
      description: '',
    };
    onUpdate([...steps, newStep]);
  };

  const updateStep = (id: string, field: keyof PaymentStep, value: any) => {
    onUpdate(
      steps.map(step => 
        step.id === id ? { ...step, [field]: value } : step
      )
    );
  };

  const removeStep = (id: string) => {
    onUpdate(steps.filter(step => step.id !== id));
  };

  const totalPercentage = steps.reduce((sum, step) => sum + (step.percentage || 0), 0);

  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <CreditCard className="h-5 w-5" style={{ color: primaryColor }} />
        <span>לוח תשלומים</span>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className="flex items-center gap-3 bg-white rounded-lg p-3 border"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:bg-red-50"
              onClick={() => removeStep(step.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Input
              value={step.description}
              onChange={(e) => updateStep(step.id, 'description', e.target.value)}
              placeholder="תיאור שלב התשלום"
              className="flex-1"
            />

            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={step.percentage}
                onChange={(e) => updateStep(step.id, 'percentage', parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
                className="w-20 text-center"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
        ))}

        {steps.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            אין שלבי תשלום. הוסף שלב ראשון
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={addStep}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          הוסף שלב תשלום
        </Button>

        <div className={`text-sm font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-orange-500'}`}>
          סה"כ: {totalPercentage}%
          {totalPercentage !== 100 && (
            <span className="text-xs text-muted-foreground mr-2">
              (צריך להיות 100%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
