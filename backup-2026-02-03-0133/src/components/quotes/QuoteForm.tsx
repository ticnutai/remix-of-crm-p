import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { QuoteItems, QuoteItem } from './QuoteItems';
import { Quote, QuoteFormData } from '@/hooks/useQuotes';

const formSchema = z.object({
  client_id: z.string().min(1, 'יש לבחור לקוח'),
  project_id: z.string().optional(),
  title: z.string().min(1, 'יש להזין כותרת'),
  description: z.string().optional(),
  vat_rate: z.number().min(0).max(100),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
  terms_and_conditions: z.string().optional(),
});

interface QuoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: QuoteFormData) => void;
  initialData?: Quote;
  isLoading?: boolean;
}

export function QuoteForm({ open, onOpenChange, onSubmit, initialData, isLoading }: QuoteFormProps) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; client_id: string }[]>([]);
  const [items, setItems] = useState<QuoteItem[]>(initialData?.items || []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: initialData?.client_id || '',
      project_id: initialData?.project_id || '',
      title: initialData?.title || '',
      description: initialData?.description || '',
      vat_rate: initialData?.vat_rate || 18,
      valid_until: initialData?.valid_until || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      notes: initialData?.notes || '',
      terms_and_conditions: initialData?.terms_and_conditions || 
        'הצעת מחיר זו תקפה ל-30 יום מתאריך הנפקתה.\nמחירים אינם כוללים מע"מ אלא אם צוין אחרת.',
    },
  });

  const selectedClientId = form.watch('client_id');

  useEffect(() => {
    const fetchData = async () => {
      const [clientsRes, projectsRes] = await Promise.all([
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('projects').select('id, name, client_id').order('name'),
      ]);
      
      if (clientsRes.data) setClients(clientsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    };
    
    if (open) fetchData();
  }, [open]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        client_id: initialData.client_id,
        project_id: initialData.project_id || '',
        title: initialData.title,
        description: initialData.description || '',
        vat_rate: initialData.vat_rate,
        valid_until: initialData.valid_until || '',
        notes: initialData.notes || '',
        terms_and_conditions: initialData.terms_and_conditions || '',
      });
      setItems(initialData.items || []);
    }
  }, [initialData, form]);

  const filteredProjects = selectedClientId 
    ? projects.filter(p => p.client_id === selectedClientId)
    : projects;

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const vatRate = form.watch('vat_rate');
  const vatAmount = subtotal * (vatRate / 100);
  const totalAmount = subtotal + vatAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (items.length === 0) {
      form.setError('root', { message: 'יש להוסיף לפחות פריט אחד' });
      return;
    }
    
    onSubmit({
      client_id: values.client_id,
      project_id: values.project_id === 'none' ? undefined : values.project_id,
      title: values.title,
      description: values.description,
      vat_rate: values.vat_rate,
      valid_until: values.valid_until,
      notes: values.notes,
      terms_and_conditions: values.terms_and_conditions,
      items,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'עריכת הצעת מחיר' : 'הצעת מחיר חדשה'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Client & Project */}
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
                    <FormLabel>פרויקט (אופציונלי)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר פרויקט" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">ללא פרויקט</SelectItem>
                        {filteredProjects.map((project) => (
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

            {/* Title & Description */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כותרת ההצעה *</FormLabel>
                  <FormControl>
                    <Input placeholder="למשל: הצעת מחיר לתכנון דירה" {...field} />
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
                    <Textarea 
                      placeholder="תיאור כללי של ההצעה..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Items */}
            <QuoteItems items={items} onChange={setItems} />

            <Separator />

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vat_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אחוז מע"מ</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תוקף עד</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>סכום ביניים:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>מע"מ ({vatRate}%):</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>סה"כ לתשלום:</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>הערות</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="הערות פנימיות..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms_and_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תנאים והגבלות</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="תנאי ההצעה..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root && (
              <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'שומר...' : initialData ? 'עדכן הצעה' : 'צור הצעה'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
