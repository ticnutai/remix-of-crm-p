// ניהול תבניות חוזים
// יצירה, עריכה ומחיקה של תבניות

import { useRegisteredCustomFields } from "@/lib/customFieldRegistry";
import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Pencil, 
  Trash2, 
  Copy,
  Star,
  StarOff,
  Eye,
  Loader2,
  Upload,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Palette,
  Wand2,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  useContractTemplates, 
  ContractTemplate,
  ContractTemplateFormData,
  TEMPLATE_CATEGORIES,
  TEMPLATE_VARIABLES,
  PaymentScheduleItem,
} from '@/hooks/useContractTemplates';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AdvancedContractEditor } from './AdvancedContractEditor';
import { ContractDocument, ContractBlock, COLOR_SCHEMES } from './AdvancedContractEditor/types';

// ============================================================================
// Main Component
// ============================================================================

interface ContractTemplatesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectionMode?: boolean;
  onSelect?: (template: ContractTemplate) => void;
}

export function ContractTemplatesManager({ open, onOpenChange, selectionMode = false, onSelect }: ContractTemplatesManagerProps) {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate, setAsDefault } = useContractTemplates();
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // עורך מתקדם
  const [advancedEditorOpen, setAdvancedEditorOpen] = useState(false);
  const [advancedEditorTemplate, setAdvancedEditorTemplate] = useState<ContractTemplate | null>(null);

  const handleEdit = (template: ContractTemplate) => {
    setEditingTemplate(template);
  };

  // פתיחת עורך מתקדם
  const handleAdvancedEdit = (template: ContractTemplate) => {
    setAdvancedEditorTemplate(template);
    setAdvancedEditorOpen(true);
  };

  const handleCreate = () => {
    setIsCreating(true);
  };

  // יצירה בעורך מתקדם
  const handleCreateAdvanced = () => {
    setAdvancedEditorTemplate(null);
    setAdvancedEditorOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateTemplate.mutateAsync(id);
  };

  const handleSetDefault = async (id: string) => {
    await setAsDefault.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate.mutateAsync(id);
    setDeleteConfirm(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-2 flex-row-reverse">
                <FileText className="h-5 w-5" />
                ניהול תבניות חוזים
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleCreateAdvanced} size="sm" variant="outline" className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  עורך מתקדם
                </Button>
                <Button onClick={handleCreate} size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  תבנית חדשה
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="grid gap-4 p-1">
                {templates.map(template => (
                  <TemplateListItem
                    key={template.id}
                    template={template}
                    onEdit={() => handleEdit(template)}
                    onAdvancedEdit={() => handleAdvancedEdit(template)}
                    onDuplicate={() => handleDuplicate(template.id)}
                    onSetDefault={() => handleSetDefault(template.id)}
                    onDelete={() => setDeleteConfirm(template.id)}
                    selectionMode={selectionMode}
                    onSelect={() => {
                      if (onSelect) {
                        onSelect(template);
                        onOpenChange(false);
                      }
                    }}
                  />
                ))}

                {templates.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>אין תבניות עדיין</p>
                    <Button onClick={handleCreate} variant="outline" className="mt-4">
                      <Plus className="h-4 w-4 ml-2" />
                      צור תבנית ראשונה
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* דיאלוג עריכה/יצירה */}
      <TemplateEditorDialog
        open={!!editingTemplate || isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTemplate(null);
            setIsCreating(false);
          }
        }}
        template={editingTemplate}
        onSave={async (data) => {
          if (editingTemplate) {
            await updateTemplate.mutateAsync({ id: editingTemplate.id, ...data });
          } else {
            await createTemplate.mutateAsync(data);
          }
          setEditingTemplate(null);
          setIsCreating(false);
        }}
      />

      {/* אישור מחיקה */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק את התבנית?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו לא ניתנת לביטול. התבנית תוסר מהמערכת.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* עורך מתקדם */}
      <Dialog open={advancedEditorOpen} onOpenChange={setAdvancedEditorOpen}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0" dir="rtl">
          <AdvancedContractEditor
            initialDocument={advancedEditorTemplate ? convertTemplateToDocument(advancedEditorTemplate) : undefined}
            documentId={advancedEditorTemplate?.id}
            onSave={async (document) => {
              // המרת המסמך לתבנית ושמירה
              const templateData = convertDocumentToTemplate(document, advancedEditorTemplate?.name || 'תבנית חדשה');
              if (advancedEditorTemplate) {
                await updateTemplate.mutateAsync({ id: advancedEditorTemplate.id, ...templateData });
              } else {
                await createTemplate.mutateAsync(templateData);
              }
              setAdvancedEditorOpen(false);
              setAdvancedEditorTemplate(null);
              toast({ title: 'התבנית נשמרה בהצלחה!' });
            }}
            onClose={() => {
              setAdvancedEditorOpen(false);
              setAdvancedEditorTemplate(null);
            }}
            className="h-full"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// פונקציות עזר להמרה בין תבנית למסמך
// ============================================================================

function convertTemplateToDocument(template: ContractTemplate): ContractDocument {
  return {
    id: template.id,
    title: template.name,
    colorScheme: 'gold',
    designTemplate: 'classic',
    blocks: [
      {
        id: 'header-1',
        type: 'header',
        title: 'כותרת',
        content: {
          title: template.name,
          subtitle: template.description || '',
          logo: template.logo_url || '',
        },
        visible: true,
        order: 0,
      },
      {
        id: 'parties-1',
        type: 'parties',
        title: 'צדדים',
        content: {
          parties: [
            { id: 'p1', type: 'client', name: '{{client.name}}' },
            { id: 'p2', type: 'provider', name: '{{company.name}}' },
          ],
        },
        visible: true,
        order: 1,
      },
      {
        id: 'terms-1',
        type: 'terms',
        title: 'תנאים',
        content: {
          terms: template.default_terms_and_conditions?.split('\n').filter(Boolean) || [],
          specialClauses: template.default_special_clauses?.split('\n').filter(Boolean) || [],
        },
        visible: true,
        order: 2,
      },
      {
        id: 'payments-1',
        type: 'payments',
        title: 'תשלומים',
        content: {
          steps: (template.default_payment_schedule || []).map((s, i) => ({
            id: `step-${i}`,
            percentage: s.percentage,
            description: s.description,
            daysOffset: s.days_offset,
          })),
          paymentTerms: template.default_payment_terms || '',
        },
        visible: true,
        order: 3,
      },
      {
        id: 'signatures-1',
        type: 'signatures',
        title: 'חתימות',
        content: {
          fields: [
            { id: 'sig1', label: 'חתימת המזמין' },
            { id: 'sig2', label: 'חתימת הספק' },
          ],
          showDate: true,
        },
        visible: true,
        order: 4,
      },
    ],
    metadata: {
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      status: 'draft',
    },
    settings: {
      showHeader: true,
      showFooter: true,
      showPageNumbers: true,
      darkMode: false,
    },
  };
}

function convertDocumentToTemplate(document: ContractDocument, name: string): ContractTemplateFormData {
  // מצא בלוקים רלוונטיים
  const headerBlock = document.blocks.find(b => b.type === 'header');
  const termsBlock = document.blocks.find(b => b.type === 'terms');
  const paymentsBlock = document.blocks.find(b => b.type === 'payments');

  // המר את המסמך ל-HTML
  const html_content = generateHtmlFromDocument(document);

  return {
    name: name || document.title,
    description: (headerBlock?.content as any)?.subtitle || '',
    category: 'כללי',
    html_content,
    css_styles: generateCssFromDocument(document),
    logo_url: (headerBlock?.content as any)?.logo || undefined,
    default_terms_and_conditions: ((termsBlock?.content as any)?.terms || []).join('\n'),
    default_special_clauses: ((termsBlock?.content as any)?.specialClauses || []).join('\n'),
    default_payment_terms: (paymentsBlock?.content as any)?.paymentTerms || '',
    default_payment_schedule: ((paymentsBlock?.content as any)?.steps || []).map((s: any) => ({
      description: s.description,
      percentage: s.percentage,
      days_offset: s.daysOffset || 0,
    })),
    default_duration_days: 90,
  };
}

function generateHtmlFromDocument(document: ContractDocument): string {
  const colorScheme = COLOR_SCHEMES[document.colorScheme];
  let html = `<div class="contract" style="font-family: David, Arial, sans-serif; direction: rtl; padding: 20px; background: ${colorScheme.background}; color: ${colorScheme.text};">`;

  for (const block of document.blocks.filter(b => b.visible).sort((a, b) => a.order - b.order)) {
    switch (block.type) {
      case 'header':
        const headerContent = block.content as any;
        html += `
          <div class="header" style="text-align: center; margin-bottom: 30px; padding: 20px; background: ${colorScheme.gradient}; color: white; border-radius: 8px;">
            ${headerContent.logo ? `<img src="${headerContent.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 15px;">` : ''}
            <h1 style="margin: 0; font-size: 28px;">${headerContent.title || '{{contract.title}}'}</h1>
            ${headerContent.subtitle ? `<p style="margin: 10px 0 0; opacity: 0.9;">${headerContent.subtitle}</p>` : ''}
            <p style="margin-top: 15px; font-size: 14px;">תאריך: {{today}}</p>
          </div>
        `;
        break;
      case 'parties':
        const partiesContent = block.content as any;
        html += `
          <div class="parties" style="margin-bottom: 20px;">
            <h2 style="color: ${colorScheme.primary}; border-bottom: 2px solid ${colorScheme.primary}; padding-bottom: 5px;">הצדדים להסכם</h2>
            ${(partiesContent.parties || []).map((p: any) => `
              <p><strong>${p.type === 'client' ? 'מזמין' : 'ספק'}:</strong> ${p.name}</p>
            `).join('')}
          </div>
        `;
        break;
      case 'terms':
        const termsContent = block.content as any;
        html += `
          <div class="terms" style="margin-bottom: 20px;">
            <h2 style="color: ${colorScheme.primary}; border-bottom: 2px solid ${colorScheme.primary}; padding-bottom: 5px;">תנאים והתניות</h2>
            <ul style="padding-right: 20px;">
              ${(termsContent.terms || []).map((t: string) => `<li style="margin-bottom: 8px;">${t}</li>`).join('')}
            </ul>
            ${termsContent.specialClauses?.length ? `
              <h3 style="color: ${colorScheme.secondary};">תנאים מיוחדים</h3>
              <ul style="padding-right: 20px;">
                ${termsContent.specialClauses.map((c: string) => `<li style="margin-bottom: 8px;">${c}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `;
        break;
      case 'payments':
        const paymentsContent = block.content as any;
        html += `
          <div class="payments" style="margin-bottom: 20px;">
            <h2 style="color: ${colorScheme.primary}; border-bottom: 2px solid ${colorScheme.primary}; padding-bottom: 5px;">תשלומים</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: ${colorScheme.primary}; color: white;">
                <th style="padding: 10px; text-align: right;">שלב</th>
                <th style="padding: 10px; text-align: center;">אחוז</th>
                <th style="padding: 10px; text-align: center;">ימים</th>
              </tr>
              ${(paymentsContent.steps || []).map((s: any, i: number) => `
                <tr style="background: ${i % 2 === 0 ? '#f9f9f9' : 'white'};">
                  <td style="padding: 10px; border: 1px solid #ddd;">${s.description}</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${s.percentage}%</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${s.daysOffset || 0}</td>
                </tr>
              `).join('')}
            </table>
            ${paymentsContent.paymentTerms ? `<p style="margin-top: 10px;">${paymentsContent.paymentTerms}</p>` : ''}
          </div>
        `;
        break;
      case 'signatures':
        html += `
          <div class="signatures" style="margin-top: 40px; page-break-inside: avoid;">
            <h2 style="color: ${colorScheme.primary}; border-bottom: 2px solid ${colorScheme.primary}; padding-bottom: 5px;">חתימות</h2>
            <table style="width: 100%;">
              <tr>
                <td style="width: 50%; padding: 20px;">
                  <p>שם: _________________</p>
                  <p>חתימה: _________________</p>
                  <p>תאריך: _________________</p>
                </td>
                <td style="width: 50%; padding: 20px;">
                  <p>שם: _________________</p>
                  <p>חתימה: _________________</p>
                  <p>תאריך: _________________</p>
                </td>
              </tr>
            </table>
          </div>
        `;
        break;
    }
  }

  html += '</div>';
  return html;
}

function generateCssFromDocument(document: ContractDocument): string {
  const colorScheme = COLOR_SCHEMES[document.colorScheme];
  return `
    .contract { 
      max-width: 800px; 
      margin: 0 auto;
      background: ${colorScheme.background};
      color: ${colorScheme.text};
    }
    .contract h1, .contract h2, .contract h3 { 
      color: ${colorScheme.primary}; 
    }
    .contract table {
      border-collapse: collapse;
    }
    .contract th {
      background: ${colorScheme.primary};
      color: white;
    }
    @media print {
      .contract { 
        max-width: none;
        box-shadow: none;
      }
    }
  `;
}

// ============================================================================
// Template List Item
// ============================================================================

interface TemplateListItemProps {
  template: ContractTemplate;
  onEdit: () => void;
  onAdvancedEdit: () => void;
  onDuplicate: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  selectionMode?: boolean;
  onSelect?: () => void;
}

function TemplateListItem({ 
  template, 
  onEdit, 
  onAdvancedEdit,
  onDuplicate, 
  onSetDefault, 
  onDelete,
  selectionMode = false,
  onSelect
}: TemplateListItemProps) {
  return (
    <Card dir="rtl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Badge className="shrink-0">{template.category}</Badge>
          <div className="flex-1 text-right mr-3">
            <CardTitle className="text-lg flex items-center gap-2 justify-end">
              {template.name}
              {template.is_default && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ברירת מחדל
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {template.description || 'ללא תיאור'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3 justify-end">
          {template.variables?.length > 0 && (
            <span>🔤 {template.variables.length} משתנים</span>
          )}
          {template.default_duration_days && (
            <span>📅 {template.default_duration_days} ימים</span>
          )}
          {template.default_payment_schedule?.length > 0 && (
            <span>💳 {template.default_payment_schedule.length} שלבי תשלום</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {selectionMode ? (
            <Button size="sm" onClick={onSelect}>
              בחר תבנית זו
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 ml-1" />
                מחק
              </Button>
              {!template.is_default && (
                <Button variant="outline" size="sm" onClick={onSetDefault}>
                  <Star className="h-4 w-4 ml-1" />
                  הגדר כברירת מחדל
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onDuplicate}>
                <Copy className="h-4 w-4 ml-1" />
                שכפול
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 ml-1" />
                עריכה
              </Button>
              <Button variant="default" size="sm" onClick={onAdvancedEdit} className="gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Wand2 className="h-4 w-4" />
                עורך מתקדם
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Template Editor Dialog
// ============================================================================

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ContractTemplate | null;
  onSave: (data: ContractTemplateFormData) => Promise<void>;
}

function TemplateEditorDialog({ 
  open, 
  onOpenChange, 
  template, 
  onSave 
}: TemplateEditorDialogProps) {
  const customFields = useRegisteredCustomFields();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('כללי');
  const [htmlContent, setHtmlContent] = useState('');
  const [cssStyles, setCssStyles] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [specialClauses, setSpecialClauses] = useState('');
  const [durationDays, setDurationDays] = useState<number | undefined>();
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [variablesOpen, setVariablesOpen] = useState(false);

  // אתחול טופס
  React.useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setCategory(template.category);
      setHtmlContent(template.html_content);
      setCssStyles(template.css_styles || '');
      setLogoUrl(template.logo_url || '');
      setTermsAndConditions(template.default_terms_and_conditions || '');
      setPaymentTerms(template.default_payment_terms || '');
      setSpecialClauses(template.default_special_clauses || '');
      setDurationDays(template.default_duration_days);
      setPaymentSchedule(template.default_payment_schedule || []);
    } else {
      // ערכי ברירת מחדל לתבנית חדשה
      setName('');
      setDescription('');
      setCategory('כללי');
      setHtmlContent(DEFAULT_TEMPLATE_HTML);
      setCssStyles('');
      setLogoUrl('');
      setTermsAndConditions('');
      setPaymentTerms('');
      setSpecialClauses('');
      setDurationDays(undefined);
      setPaymentSchedule([]);
    }
  }, [template, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'יש להזין שם לתבנית', variant: 'destructive' });
      return;
    }
    if (!htmlContent.trim()) {
      toast({ title: 'יש להזין תוכן לתבנית', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        description,
        category,
        html_content: htmlContent,
        css_styles: cssStyles || undefined,
        logo_url: logoUrl || undefined,
        default_terms_and_conditions: termsAndConditions || undefined,
        default_payment_terms: paymentTerms || undefined,
        default_special_clauses: specialClauses || undefined,
        default_duration_days: durationDays,
        default_payment_schedule: paymentSchedule.length > 0 ? paymentSchedule : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setHtmlContent(prev => prev + variable);
  };

  const addPaymentStep = () => {
    setPaymentSchedule(prev => [
      ...prev,
      { description: '', percentage: 0, days_offset: 0 }
    ]);
  };

  const updatePaymentStep = (index: number, updates: Partial<PaymentScheduleItem>) => {
    setPaymentSchedule(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const removePaymentStep = (index: number) => {
    setPaymentSchedule(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'עריכת תבנית' : 'יצירת תבנית חדשה'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[650px]">
          <TabsList className="mb-4">
            <TabsTrigger value="general">כללי</TabsTrigger>
            <TabsTrigger value="content">תוכן</TabsTrigger>
            <TabsTrigger value="payments">שלבי תשלום</TabsTrigger>
            <TabsTrigger value="terms">תנאים</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[550px]">
            {/* לשונית כללי */}
            <TabsContent value="general" className="space-y-4 p-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>שם התבנית *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="לדוגמה: חוזה שירותים כללי"
                  />
                </div>
                <div className="space-y-2">
                  <Label>קטגוריה</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>תיאור</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="תיאור קצר של התבנית"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>כתובת URL ללוגו</Label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    dir="ltr"
                  />
                  {logoUrl && (
                    <img 
                      src={logoUrl} 
                      alt="לוגו" 
                      className="h-12 object-contain mt-2"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>משך ברירת מחדל (ימים)</Label>
                  <Input
                    type="number"
                    value={durationDays || ''}
                    onChange={(e) => setDurationDays(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="90"
                  />
                </div>
              </div>
            </TabsContent>

            {/* לשונית תוכן */}
            <TabsContent value="content" className="space-y-4 p-1">
              {/* משתנים זמינים */}
              <Collapsible open={variablesOpen} onOpenChange={setVariablesOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    משתנים זמינים (לחץ להוספה)
                    {variablesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="grid grid-cols-3 gap-2 p-3 bg-muted rounded-lg">
                    {[
                      ...Object.entries(TEMPLATE_VARIABLES),
                      // שדות שהמשתמש הוסיף ללקוח מופיעים כאן אוטומטית
                      ...customFields.map((f) => [`{{client.custom.${f.key}}}`, f.label] as const),
                    ].map(([variable, label]) => (
                      <Button
                        key={variable}
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs"
                        onClick={() => insertVariable(variable)}
                      >
                        <code className="text-primary ml-2">{variable}</code>
                        <span className="text-muted-foreground">{label}</span>
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="space-y-2">
                <Label>תוכן HTML *</Label>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="font-mono text-sm h-[400px]"
                  dir="ltr"
                  placeholder="<div>...</div>"
                />
              </div>

              <div className="space-y-2">
                <Label>עיצוב CSS (אופציונלי)</Label>
                <Textarea
                  value={cssStyles}
                  onChange={(e) => setCssStyles(e.target.value)}
                  className="font-mono text-sm h-[100px]"
                  dir="ltr"
                  placeholder=".contract { ... }"
                />
              </div>
            </TabsContent>

            {/* לשונית שלבי תשלום */}
            <TabsContent value="payments" className="space-y-4 p-1">
              <div className="flex items-center justify-between">
                <Label>שלבי תשלום ברירת מחדל</Label>
                <Button variant="outline" size="sm" onClick={addPaymentStep}>
                  <Plus className="h-4 w-4 ml-1" />
                  הוסף שלב
                </Button>
              </div>

              {paymentSchedule.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  אין שלבי תשלום מוגדרים
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentSchedule.map((step, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-4 gap-3 items-end">
                          <div className="space-y-1">
                            <Label className="text-xs">תיאור</Label>
                            <Input
                              value={step.description}
                              onChange={(e) => updatePaymentStep(index, { description: e.target.value })}
                              placeholder="מקדמה"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">אחוז (%)</Label>
                            <Input
                              type="number"
                              value={step.percentage}
                              onChange={(e) => updatePaymentStep(index, { percentage: parseFloat(e.target.value) || 0 })}
                              min={0}
                              max={100}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">ימים מההתחלה</Label>
                            <Input
                              type="number"
                              value={step.days_offset}
                              onChange={(e) => updatePaymentStep(index, { days_offset: parseInt(e.target.value) || 0 })}
                              min={0}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePaymentStep(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* סיכום */}
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-sm">
                      סה״כ: {paymentSchedule.reduce((sum, s) => sum + s.percentage, 0)}%
                    </span>
                    {paymentSchedule.reduce((sum, s) => sum + s.percentage, 0) !== 100 && (
                      <span className="text-sm text-destructive mr-2">
                        (חייב להיות 100%)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>תנאי תשלום (טקסט)</Label>
                <Textarea
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="תשלום בהעברה בנקאית תוך 30 יום..."
                  rows={2}
                />
              </div>
            </TabsContent>

            {/* לשונית תנאים */}
            <TabsContent value="terms" className="space-y-4 p-1">
              <div className="space-y-2">
                <Label>תנאים והתניות</Label>
                <Textarea
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  placeholder="תנאים כלליים של החוזה..."
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label>תנאים מיוחדים</Label>
                <Textarea
                  value={specialClauses}
                  onChange={(e) => setSpecialClauses(e.target.value)}
                  placeholder="תנאים מיוחדים נוספים..."
                  rows={6}
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// תבנית HTML ברירת מחדל
// ============================================================================

const DEFAULT_TEMPLATE_HTML = `<div class="contract" style="font-family: David, Arial, sans-serif; direction: rtl; padding: 20px;">
  <div class="header" style="text-align: center; margin-bottom: 30px;">
    {{company.logo}}
    <h1 style="margin: 20px 0 10px;">חוזה</h1>
    <p>מספר חוזה: {{contract.number}}</p>
    <p>תאריך: {{today}}</p>
  </div>
  
  <div class="parties" style="margin-bottom: 20px;">
    <h2>הצדדים להסכם</h2>
    <p><strong>מזמין:</strong> {{client.name}}</p>
    <p><strong>טלפון:</strong> {{client.phone}}</p>
    <p><strong>אימייל:</strong> {{client.email}}</p>
    <p><strong>כתובת:</strong> {{client.address}}</p>
    <br>
    <p><strong>ספק:</strong> {{company.name}}</p>
  </div>
  
  <div class="scope" style="margin-bottom: 20px;">
    <h2>נושא ההסכם</h2>
    <p><strong>{{contract.title}}</strong></p>
    <p>{{contract.description}}</p>
  </div>
  
  <div class="financial" style="margin-bottom: 20px;">
    <h2>תמורה ותשלומים</h2>
    <p><strong>סכום החוזה:</strong> {{contract.value}} ₪</p>
    <p><strong>תנאי תשלום:</strong> {{payment.terms}}</p>
    {{payment.schedule}}
  </div>
  
  <div class="dates" style="margin-bottom: 20px;">
    <h2>מועדים</h2>
    <p><strong>תאריך התחלה:</strong> {{contract.start_date}}</p>
    <p><strong>תאריך סיום:</strong> {{contract.end_date}}</p>
  </div>
  
  <div class="terms" style="margin-bottom: 20px;">
    <h2>תנאים והתניות</h2>
    <div>{{terms_and_conditions}}</div>
  </div>
  
  <div class="signatures" style="margin-top: 40px;">
    <h2>חתימות</h2>
    <table style="width: 100%;">
      <tr>
        <td style="width: 50%;">
          <p>שם: _________________</p>
          <p>חתימה: _________________</p>
          <p>תאריך: _________________</p>
        </td>
        <td style="width: 50%;">
          <p>שם: _________________</p>
          <p>חתימה: _________________</p>
          <p>תאריך: _________________</p>
        </td>
      </tr>
    </table>
  </div>
</div>`;

export default ContractTemplatesManager;
