// רכיב בחירת תבנית חוזה
// מאפשר בחירת תבנית ומילוי אוטומטי של נתונים

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Check, 
  Star, 
  Copy, 
  Eye,
  Loader2,
  Building2,
  Hammer,
  Briefcase,
  Code,
  Palette,
  Megaphone,
  MoreHorizontal
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useContractTemplates, 
  ContractTemplate,
  replaceTemplateVariables,
  generatePaymentScheduleFromTemplate,
  generatePaymentScheduleHtml,
  calculateEndDate,
  ClientData,
  CompanyData,
} from '@/hooks/useContractTemplates';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';

// ============================================================================
// אייקונים לפי קטגוריה
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'כללי': <FileText className="h-5 w-5" />,
  'שירותים': <Briefcase className="h-5 w-5" />,
  'בנייה': <Hammer className="h-5 w-5" />,
  'ייעוץ': <Building2 className="h-5 w-5" />,
  'פיתוח תוכנה': <Code className="h-5 w-5" />,
  'עיצוב': <Palette className="h-5 w-5" />,
  'שיווק': <Megaphone className="h-5 w-5" />,
  'אחר': <MoreHorizontal className="h-5 w-5" />,
};

// ============================================================================
// Props
// ============================================================================

interface TemplateSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: ContractTemplate, generatedData: GeneratedContractData) => void;
  client: ClientData | null;
  company?: CompanyData;
  contractValue?: number;
  startDate?: Date;
}

export interface GeneratedContractData {
  terms_and_conditions: string;
  special_clauses: string;
  payment_terms: string;
  end_date: string | null;
  payment_schedule: Array<{
    payment_number: number;
    description: string;
    amount: number;
    due_date: string;
  }>;
}

// ============================================================================
// Main Component
// ============================================================================

export function TemplateSelectDialog({
  open,
  onOpenChange,
  onSelect,
  client,
  company,
  contractValue = 0,
  startDate = new Date(),
}: TemplateSelectDialogProps) {
  const { templates, isLoading } = useContractTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('הכל');
  const [previewOpen, setPreviewOpen] = useState(false);

  // קטגוריות ייחודיות
  const categories = ['הכל', ...new Set(templates.map(t => t.category))];

  // סינון לפי קטגוריה
  const filteredTemplates = activeCategory === 'הכל'
    ? templates
    : templates.filter(t => t.category === activeCategory);

  // איפוס בחירה כשנפתח
  useEffect(() => {
    if (open) {
      const defaultTemplate = templates.find(t => t.is_default);
      setSelectedTemplate(defaultTemplate || null);
    }
  }, [open, templates]);

  // אישור בחירה
  const handleConfirm = () => {
    if (!selectedTemplate) return;

    // יצירת נתונים מהתבנית
    const endDate = calculateEndDate(startDate, selectedTemplate);
    const paymentSchedule = generatePaymentScheduleFromTemplate(
      selectedTemplate,
      startDate,
      contractValue
    );

    const generatedData: GeneratedContractData = {
      terms_and_conditions: selectedTemplate.default_terms_and_conditions || '',
      special_clauses: selectedTemplate.default_special_clauses || '',
      payment_terms: selectedTemplate.default_payment_terms || '',
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      payment_schedule: paymentSchedule,
    };

    onSelect(selectedTemplate, generatedData);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              בחירת תבנית חוזה
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* טאבים לקטגוריות */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="flex-wrap h-auto gap-1 p-1">
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat} className="text-sm">
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* רשימת תבניות */}
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
                  {filteredTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplate?.id === template.id}
                      onSelect={() => setSelectedTemplate(template)}
                      onPreview={() => {
                        setSelectedTemplate(template);
                        setPreviewOpen(true);
                      }}
                    />
                  ))}

                  {filteredTemplates.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                      אין תבניות בקטגוריה זו
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* פרטי תבנית נבחרת */}
              {selectedTemplate && (
                <SelectedTemplateInfo 
                  template={selectedTemplate}
                  contractValue={contractValue}
                  startDate={startDate}
                />
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedTemplate}>
              <Check className="h-4 w-4 ml-2" />
              בחר תבנית
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* תצוגה מקדימה */}
      {selectedTemplate && (
        <TemplatePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          template={selectedTemplate}
          client={client}
          company={company}
          contractValue={contractValue}
          startDate={startDate}
        />
      )}
    </>
  );
}

// ============================================================================
// Template Card
// ============================================================================

interface TemplateCardProps {
  template: ContractTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

function TemplateCard({ template, isSelected, onSelect, onPreview }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {CATEGORY_ICONS[template.category] || <FileText className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {template.name}
                {template.is_default && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                )}
              </CardTitle>
              <Badge variant="secondary" className="mt-1 text-xs">
                {template.category}
              </Badge>
            </div>
          </div>
          {isSelected && (
            <div className="p-1 rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm line-clamp-2">
          {template.description || 'ללא תיאור'}
        </CardDescription>
        
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          {template.default_payment_schedule?.length > 0 && (
            <span className="flex items-center gap-1">
              💳 {template.default_payment_schedule.length} שלבי תשלום
            </span>
          )}
          {template.default_duration_days && (
            <span className="flex items-center gap-1">
              📅 {template.default_duration_days} ימים
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
        >
          <Eye className="h-4 w-4 ml-2" />
          תצוגה מקדימה
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Selected Template Info
// ============================================================================

interface SelectedTemplateInfoProps {
  template: ContractTemplate;
  contractValue: number;
  startDate: Date;
}

function SelectedTemplateInfo({ template, contractValue, startDate }: SelectedTemplateInfoProps) {
  // וידוא שתאריך ההתחלה תקין
  const validStartDate = (() => {
    try {
      if (startDate instanceof Date && !isNaN(startDate.getTime())) {
        return startDate;
      }
      if (typeof startDate === 'string' || typeof startDate === 'number') {
        const parsed = new Date(startDate);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      }
      return new Date();
    } catch {
      return new Date();
    }
  })();

  const paymentSchedule = generatePaymentScheduleFromTemplate(template, validStartDate, contractValue);
  const endDate = calculateEndDate(validStartDate, template);

  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        תבנית נבחרת: {template.name}
      </h4>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {endDate && (
          <div>
            <span className="text-muted-foreground">תאריך סיום משוער:</span>
            <p className="font-medium">{format(endDate, 'dd/MM/yyyy')}</p>
          </div>
        )}
        
        {paymentSchedule.length > 0 && (
          <div className="col-span-2 md:col-span-3">
            <span className="text-muted-foreground">לוח תשלומים:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {paymentSchedule.map((p, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {p.description}: ₪{p.amount.toLocaleString()}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Template Preview Dialog
// ============================================================================

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ContractTemplate;
  client: ClientData | null;
  company?: CompanyData;
  contractValue: number;
  startDate: Date;
}

function TemplatePreviewDialog({
  open,
  onOpenChange,
  template,
  client,
  company,
  contractValue,
  startDate,
}: TemplatePreviewDialogProps) {
  // וידוא שתאריך ההתחלה תקין
  const validStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
    ? startDate 
    : new Date();
  
  // יצירת לוח תשלומים
  const paymentSchedule = generatePaymentScheduleFromTemplate(template, validStartDate, contractValue);
  const paymentScheduleHtml = generatePaymentScheduleHtml(paymentSchedule);
  const endDate = calculateEndDate(validStartDate, template);

  // החלפת משתנים
  const previewHtml = replaceTemplateVariables(
    template.html_content,
    client,
    {
      number: 'C2026-XXXX',
      title: 'חוזה לדוגמה',
      value: contractValue,
      description: 'תיאור הפרויקט יופיע כאן',
      start_date: format(validStartDate, 'yyyy-MM-dd'),
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      payment_terms: template.default_payment_terms,
      terms_and_conditions: template.default_terms_and_conditions,
      special_clauses: template.default_special_clauses,
    },
    company,
    paymentScheduleHtml
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            תצוגה מקדימה: {template.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px] border rounded-lg">
          <div 
            className="p-8 bg-white text-black"
            style={{ 
              fontFamily: 'David, Arial, sans-serif',
              direction: 'rtl',
            }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
          />
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateSelectDialog;
