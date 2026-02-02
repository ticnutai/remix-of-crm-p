// סקשן לוח זמנים
import React from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimelineStep } from './types';

interface TimelineSectionProps {
  steps: TimelineStep[];
  onUpdate: (steps: TimelineStep[]) => void;
  primaryColor?: string;
}

export function TimelineSection({
  steps,
  onUpdate,
  primaryColor = '#d8ac27',
}: TimelineSectionProps) {
  const addStep = () => {
    const newStep: TimelineStep = {
      id: crypto.randomUUID(),
      title: '',
      duration: '',
    };
    onUpdate([...steps, newStep]);
  };

  const updateStep = (id: string, field: keyof TimelineStep, value: any) => {
    onUpdate(
      steps.map(step => 
        step.id === id ? { ...step, [field]: value } : step
      )
    );
  };

  const removeStep = (id: string) => {
    onUpdate(steps.filter(step => step.id !== id));
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
        <span>לוח זמנים</span>
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
              value={step.title}
              onChange={(e) => updateStep(step.id, 'title', e.target.value)}
              placeholder="שם השלב"
              className="flex-1"
            />

            <Input
              value={step.duration || ''}
              onChange={(e) => updateStep(step.id, 'duration', e.target.value)}
              placeholder="משך זמן"
              className="w-32"
            />
          </div>
        ))}

        {steps.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            אין שלבים. הוסף שלב ראשון
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={addStep}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" />
        הוסף שלב
      </Button>
    </div>
  );
}
