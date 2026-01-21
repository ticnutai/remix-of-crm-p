// דיאלוג יצירה/עריכה של תבנית מתקדמת
import React, { useState, useEffect } from 'react';
import { X, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { 
  QuoteTemplate, 
  CATEGORIES, 
  createEmptyTemplate,
  DEFAULT_DESIGN_SETTINGS 
} from './types';
import { DesignSettingsSection } from './DesignSettingsSection';
import { PaymentScheduleSection } from './PaymentScheduleSection';
import { TimelineSection } from './TimelineSection';
import { StagesEditor } from './StagesEditor';
import { ImportantNotesSection } from './ImportantNotesSection';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';

interface AdvancedTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  template: Partial<QuoteTemplate> | null;
  onSave: (template: Partial<QuoteTemplate>) => Promise<void>;
  isSaving: boolean;
}

export function AdvancedTemplateDialog({
  open,
  onClose,
  template,
  onSave,
  isSaving,
}: AdvancedTemplateDialogProps) {
  const [formData, setFormData] = useState<Partial<QuoteTemplate>>(createEmptyTemplate());
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        ...createEmptyTemplate(),
        ...template,
        design_settings: {
          ...DEFAULT_DESIGN_SETTINGS,
          ...(template.design_settings || {}),
        },
      });
    } else {
      setFormData(createEmptyTemplate());
    }
  }, [template]);

  const updateField = <K extends keyof QuoteTemplate>(field: K, value: QuoteTemplate[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await onSave(formData);
  };

  if (!open) return null;

  const primaryColor = formData.design_settings?.primary_color || '#d8ac27';

  return (
    <>
      <div className="fixed inset-0 z-50 flex" dir="rtl">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="relative w-full max-w-4xl mx-auto my-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div 
            className="relative px-6 py-5"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            }}
          >
            <button 
              onClick={onClose}
              className="absolute left-4 top-4 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">
                {formData.id ? 'עריכת תבנית' : 'הצעת מחיר חדשה'}
              </h2>
              <Input
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="מיקום / גוש וחלקה"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/50"
              />
            </div>

            {/* Total badge */}
            <div className="absolute left-6 bottom-5 flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                <Input
                  type="number"
                  value={0}
                  className="w-24 bg-transparent border-0 text-white font-bold text-lg text-center focus-visible:ring-0"
                  placeholder="0"
                />
                <span className="text-white/80">₪</span>
              </div>
              <span className="text-white/80 text-sm">+ מע"מ</span>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Accordion sections */}
              <Accordion type="multiple" defaultValue={['design', 'stages']}>
                {/* Design Settings */}
                <AccordionItem value="design" className="border-0">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="text-lg font-semibold">הגדרות עיצוב</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <DesignSettingsSection
                      settings={formData.design_settings || DEFAULT_DESIGN_SETTINGS}
                      onUpdate={(updates) => updateField('design_settings', {
                        ...formData.design_settings,
                        ...DEFAULT_DESIGN_SETTINGS,
                        ...updates,
                      })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Stages */}
                <AccordionItem value="stages" className="border-0">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="text-lg font-semibold">שלבי העבודה</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <StagesEditor
                      stages={formData.stages || []}
                      onUpdate={(stages) => updateField('stages', stages)}
                      primaryColor={primaryColor}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Payment Schedule */}
                <AccordionItem value="payment" className="border-0">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="text-lg font-semibold">לוח תשלומים</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <PaymentScheduleSection
                      steps={formData.payment_schedule || []}
                      onUpdate={(steps) => updateField('payment_schedule', steps)}
                      primaryColor={primaryColor}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Timeline */}
                <AccordionItem value="timeline" className="border-0">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="text-lg font-semibold">לוח זמנים</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TimelineSection
                      steps={formData.timeline || []}
                      onUpdate={(steps) => updateField('timeline', steps)}
                      primaryColor={primaryColor}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Important Notes */}
                <AccordionItem value="notes" className="border-0">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="text-lg font-semibold">הערות חשובות</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ImportantNotesSection
                      notes={formData.important_notes || []}
                      onUpdate={(notes) => updateField('important_notes', notes)}
                      primaryColor={primaryColor}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Additional fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>קטגוריה</Label>
                  <Select
                    value={formData.category || 'construction'}
                    onValueChange={(v) => updateField('category', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>תוקף ההצעה (ימים)</Label>
                  <Input
                    type="number"
                    value={formData.validity_days || 30}
                    onChange={(e) => updateField('validity_days', parseInt(e.target.value) || 30)}
                    min={1}
                  />
                </div>
              </div>

              {/* VAT settings */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.show_vat ?? true}
                      onCheckedChange={(v) => updateField('show_vat', v)}
                    />
                    <Label>הצג מע"מ</Label>
                  </div>
                  {formData.show_vat && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={formData.vat_rate || 17}
                        onChange={(e) => updateField('vat_rate', parseFloat(e.target.value) || 17)}
                        className="w-20"
                        min={0}
                        max={100}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-2">
                <Label>תנאים</Label>
                <Textarea
                  value={formData.terms || ''}
                  onChange={(e) => updateField('terms', e.target.value)}
                  rows={3}
                  placeholder="תנאי ההצעה..."
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>תיאור התבנית</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={2}
                  placeholder="תיאור קצר לזיהוי התבנית..."
                />
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4 flex items-center justify-between bg-white">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              תצוגה מקדימה
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                ביטול
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving || !formData.name}
                style={{ backgroundColor: primaryColor }}
                className="text-white"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                שמור תבנית
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      {showPreview && (
        <TemplatePreviewDialog
          template={formData as QuoteTemplate}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
