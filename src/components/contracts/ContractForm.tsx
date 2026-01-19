import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Settings, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TemplateSelectDialog, GeneratedContractData } from './TemplateSelectDialog';
import { ContractTemplatesManager } from './ContractTemplatesManager';
import { ContractPartiesEditor } from './ContractPartiesEditor';
import { PaymentScheduleEditor, PaymentStep } from './PaymentScheduleEditor';
import { ContractTemplate, useContractTemplates, ClientData, ContractParty } from '@/hooks/useContractTemplates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Contract, ContractFormData } from '@/hooks/useContracts';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  client_id: z.string().min(1, 'יש לבחור לקוח'),
  project_id: z.string().optional(),
  title: z.string().min(1, 'יש להזין כותרת'),
  description: z.string().optional(),
  contract_type: z.enum(['fixed_price', 'hourly', 'milestone', 'retainer']),
  contract_value: z.number().min(0, 'ערך לא יכול להיות שלילי'),
  start_date: z.string().min(1, 'יש לבחור תאריך התחלה'),
  end_date: z.string().optional(),
  signed_date: z.string().min(1, 'יש לבחור תאריך חתימה'),
  payment_terms: z.string().optional(),
  payment_method: z.string().optional(),
  advance_payment_required: z.boolean().optional(),
  advance_payment_amount: z.number().optional(),
  terms_and_conditions: z.string().optional(),
  special_clauses: z.string().optional(),
  notes: z.string().optional(),
});

interface QuoteData {
  client_id: string;
  title: string;
  contract_value: number;
  quote_id: string;
}

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContractFormData) => Promise<void>;
  initialData?: Contract;
  quoteData?: QuoteData;
  isLoading?: boolean;
}

export function ContractForm({ open, onOpenChange, onSubmit, initialData, quoteData, isLoading }: ContractFormProps) {
  const [clients, setClients] = useState<{ id: string; name: string; email?: string; phone?: string; address?: string; company?: string; id_number?: string; gush?: string; helka?: string; migrash?: string; taba?: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templatesManagerOpen, setTemplatesManagerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [generatedPaymentSchedule, setGeneratedPaymentSchedule] = useState<GeneratedContractData['payment_schedule']>([]);
  // ניהול מזמינים מרובים
  const [contractParties, setContractParties] = useState<Omit<ContractParty, 'id' | 'contract_id' | 'created_at' | 'updated_at'>[]>([]);
  const [showPartiesEditor, setShowPartiesEditor] = useState(false);
  // לוח תשלומים דינמי
  const [paymentSteps, setPaymentSteps] = useState<PaymentStep[]>([]);
  const [showPaymentEditor, setShowPaymentEditor] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: '',
      project_id: '',
      title: '',
      description: '',
      contract_type: 'fixed_price',
      contract_value: 0,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      signed_date: format(new Date(), 'yyyy-MM-dd'),
      payment_terms: '',
      payment_method: 'bank_transfer',
      advance_payment_required: false,
      advance_payment_amount: 0,
      terms_and_conditions: '',
      special_clauses: '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const [clientsRes, projectsRes] = await Promise.all([
        supabase.from('clients').select('id, name, email, phone, address, company, id_number, gush, helka, migrash, taba').order('name'),
        supabase.from('projects').select('id, name').order('name'),
      ]);
      
      if (clientsRes.data) setClients(clientsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (initialData) {
      form.reset({
        client_id: initialData.client_id,
        project_id: initialData.project_id || '',
        title: initialData.title,
        description: initialData.description || '',
        contract_type: initialData.contract_type,
        contract_value: initialData.contract_value,
        start_date: initialData.start_date,
        end_date: initialData.end_date || '',
        signed_date: initialData.signed_date,
        payment_terms: initialData.payment_terms || '',
        payment_method: initialData.payment_method || 'bank_transfer',
        advance_payment_required: initialData.advance_payment_required,
        advance_payment_amount: initialData.advance_payment_amount || 0,
        terms_and_conditions: initialData.terms_and_conditions || '',
        special_clauses: initialData.special_clauses || '',
        notes: initialData.notes || '',
      });
    } else if (quoteData) {
      // Pre-fill from quote data
      form.reset({
        client_id: quoteData.client_id,
        project_id: '',
        title: quoteData.title,
        description: '',
        contract_type: 'fixed_price',
        contract_value: quoteData.contract_value,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        signed_date: format(new Date(), 'yyyy-MM-dd'),
        payment_terms: '',
        payment_method: 'bank_transfer',
        advance_payment_required: false,
        advance_payment_amount: 0,
        terms_and_conditions: '',
        special_clauses: '',
        notes: `נוצר מהצעת מחיר`,
      });
    } else {
      form.reset({
        client_id: '',
        project_id: '',
        title: '',
        description: '',
        contract_type: 'fixed_price',
        contract_value: 0,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        signed_date: format(new Date(), 'yyyy-MM-dd'),
        payment_terms: '',
        payment_method: 'bank_transfer',
        advance_payment_required: false,
        advance_payment_amount: 0,
        terms_and_conditions: '',
        special_clauses: '',
        notes: '',
      });
    }
  }, [initialData, quoteData, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    // יצירת לוח תשלומים מהשלבים אם יש
    let finalPaymentSchedule = generatedPaymentSchedule;
    if (paymentSteps.length > 0 && values.contract_value > 0) {
      const baseDate = values.start_date ? new Date(values.start_date) : new Date();
      finalPaymentSchedule = paymentSteps.map((step, index) => ({
        payment_number: index + 1,
        description: step.description,
        amount: Math.round((values.contract_value * step.percentage) / 100),
        due_date: format(new Date(baseDate.getTime() + step.days_offset * 86400000), 'yyyy-MM-dd'),
      }));
    }

    await onSubmit({
      client_id: values.client_id,
      title: values.title,
      contract_type: values.contract_type,
      contract_value: values.contract_value,
      start_date: values.start_date,
      signed_date: values.signed_date,
      project_id: values.project_id || undefined,
      template_id: selectedTemplate?.id,
      description: values.description || undefined,
      end_date: values.end_date || undefined,
      payment_terms: values.payment_terms || undefined,
      payment_method: values.payment_method || undefined,
      advance_payment_required: values.advance_payment_required,
      advance_payment_amount: values.advance_payment_amount,
      terms_and_conditions: values.terms_and_conditions || undefined,
      special_clauses: values.special_clauses || undefined,
      notes: values.notes || undefined,
      generated_payment_schedule: finalPaymentSchedule.length > 0 ? finalPaymentSchedule : undefined,
      // צדדים לחוזה
      contract_parties: contractParties.length > 0 ? contractParties : undefined,
    } as any);
  };

  const advanceRequired = form.watch('advance_payment_required');
  const watchedClientId = form.watch('client_id');
  const watchedContractValue = form.watch('contract_value');
  const watchedStartDate = form.watch('start_date');

  // מציאת הלקוח הנבחר
  const selectedClient = clients.find(c => c.id === watchedClientId) || null;

  // כאשר בוחרים לקוח - יצירת מזמין ראשי
  useEffect(() => {
    if (selectedClient && contractParties.length === 0) {
      setContractParties([{
        party_type: 'orderer',
        name: selectedClient.name,
        id_number: selectedClient.id_number || '',
        phone: selectedClient.phone || '',
        email: selectedClient.email || '',
        address: selectedClient.address || '',
        gush: selectedClient.gush || '',
        helka: selectedClient.helka || '',
        migrash: selectedClient.migrash || '',
        display_order: 1,
        is_primary: true,
        linked_client_id: selectedClient.id,
      }]);
    }
  }, [selectedClient?.id]);

  // טיפול בבחירת תבנית
  const handleTemplateSelect = (template: ContractTemplate, generatedData: GeneratedContractData) => {
    setSelectedTemplate(template);
    setGeneratedPaymentSchedule(generatedData.payment_schedule);
    
    // שמירת שלבי התשלום מהתבנית
    if (template.default_payment_schedule?.length > 0) {
      setPaymentSteps(template.default_payment_schedule);
      setShowPaymentEditor(true);
    }
    
    // מילוי אוטומטי של השדות מהתבנית
    if (generatedData.terms_and_conditions) {
      form.setValue('terms_and_conditions', generatedData.terms_and_conditions);
    }
    if (generatedData.special_clauses) {
      form.setValue('special_clauses', generatedData.special_clauses);
    }
    if (generatedData.payment_terms) {
      form.setValue('payment_terms', generatedData.payment_terms);
    }
    if (generatedData.end_date) {
      form.setValue('end_date', generatedData.end_date);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{initialData ? 'עריכת חוזה' : 'חוזה חדש'}</span>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setTemplateDialogOpen(true)}
              >
                <FileText className="h-4 w-4 ml-1" />
                {selectedTemplate ? selectedTemplate.name : 'בחר תבנית'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setTemplatesManagerOpen(true)}
                title="ניהול תבניות"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* הודעה על תבנית נבחרת */}
            {selectedTemplate && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                <span className="font-medium">תבנית: {selectedTemplate.name}</span>
                {generatedPaymentSchedule.length > 0 && (
                  <span className="text-muted-foreground mr-2">
                    • {generatedPaymentSchedule.length} שלבי תשלום יווצרו אוטומטית
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>לקוח *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר לקוח" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>פרויקט</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} 
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר פרויקט (אופציונלי)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">ללא פרויקט</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כותרת *</FormLabel>
                  <FormControl>
                    <Input placeholder="כותרת החוזה" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור</FormLabel>
                  <FormControl>
                    <Textarea placeholder="תיאור החוזה" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ניהול מזמינים */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">מזמינים ({contractParties.filter(p => p.party_type === 'orderer').length})</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPartiesEditor(!showPartiesEditor)}
                >
                  {showPartiesEditor ? 'הסתר' : 'הצג/ערוך'}
                </Button>
              </div>
              {showPartiesEditor && (
                <ContractPartiesEditor
                  parties={contractParties}
                  onChange={setContractParties}
                  showRealEstateFields={true}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סוג חוזה *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed_price">מחיר קבוע</SelectItem>
                        <SelectItem value="hourly">לפי שעה</SelectItem>
                        <SelectItem value="milestone">אבני דרך</SelectItem>
                        <SelectItem value="retainer">ריטיינר</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ערך החוזה (₪) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך התחלה *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-right font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : 'בחר תאריך'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך סיום</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-right font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : 'בחר תאריך'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="signed_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך חתימה *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-right font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : 'בחר תאריך'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אמצעי תשלום</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bank_transfer">העברה בנקאית</SelectItem>
                        <SelectItem value="credit_card">כרטיס אשראי</SelectItem>
                        <SelectItem value="check">צ'ק</SelectItem>
                        <SelectItem value="cash">מזומן</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תנאי תשלום</FormLabel>
                    <FormControl>
                      <Input placeholder="לדוגמה: שוטף + 30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <FormField
                control={form.control}
                name="advance_payment_required"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">נדרש תשלום מקדמה</FormLabel>
                  </FormItem>
                )}
              />

              {advanceRequired && (
                <FormField
                  control={form.control}
                  name="advance_payment_amount"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="סכום מקדמה" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* עורך לוח תשלומים */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">לוח תשלומים</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentEditor(!showPaymentEditor)}
                >
                  {showPaymentEditor ? 'הסתר' : 'הצג/ערוך'}
                </Button>
              </div>
              {paymentSteps.length > 0 && !showPaymentEditor && (
                <p className="text-sm text-muted-foreground">
                  {paymentSteps.length} שלבי תשלום מוגדרים
                </p>
              )}
              {showPaymentEditor && (
                <PaymentScheduleEditor
                  steps={paymentSteps}
                  onChange={setPaymentSteps}
                  contractValue={watchedContractValue || 0}
                  startDate={watchedStartDate}
                  showPreview={true}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="terms_and_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תנאים והגבלות</FormLabel>
                  <FormControl>
                    <Textarea placeholder="תנאים והגבלות" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea placeholder="הערות פנימיות" {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'שומר...' : (initialData ? 'עדכן חוזה' : 'צור חוזה')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* דיאלוג בחירת תבנית */}
    <TemplateSelectDialog
      open={templateDialogOpen}
      onOpenChange={setTemplateDialogOpen}
      onSelect={handleTemplateSelect}
      client={selectedClient as ClientData | null}
      contractValue={watchedContractValue || 0}
      startDate={watchedStartDate ? new Date(watchedStartDate) : new Date()}
    />

    {/* מנהל תבניות */}
    <ContractTemplatesManager
      open={templatesManagerOpen}
      onOpenChange={setTemplatesManagerOpen}
    />
    </>
  );
}
