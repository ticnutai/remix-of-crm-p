// עורכי בלוקים מתקדמים - גרסה 2.0
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  DollarSign,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContractBlock } from './types';

interface BlockEditorProps {
  block: ContractBlock;
  onChange: (content: any) => void;
}

// Rich Text Toolbar
function RichTextToolbar() {
  return (
    <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg mb-2 border">
      <Button variant="ghost" size="sm">
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Underline className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button variant="ghost" size="sm">
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <AlignLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Header Block Editor
export function HeaderBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content || {
    title: '',
    subtitle: '',
    documentNumber: '',
    date: new Date().toISOString().split('T')[0],
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>כותרת ראשית</Label>
        <Input
          value={content.title || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="כותרת המסמך"
          className="text-2xl font-bold"
        />
      </div>

      <div className="space-y-2">
        <Label>כותרת משנית</Label>
        <Input
          value={content.subtitle || ''}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          placeholder="תיאור נוסף"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>מספר מסמך</Label>
          <Input
            value={content.documentNumber || ''}
            onChange={(e) => onChange({ ...content, documentNumber: e.target.value })}
            placeholder="מספר ייחודי"
          />
        </div>

        <div className="space-y-2">
          <Label>תאריך</Label>
          <Input
            type="date"
            value={content.date || ''}
            onChange={(e) => onChange({ ...content, date: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// Parties Block Editor
export function PartiesBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content || {
    parties: [
      { name: '', idNumber: '', address: '', phone: '', email: '', role: 'client' },
    ],
  };

  const addParty = () => {
    const newParties = [
      ...content.parties,
      { name: '', idNumber: '', address: '', phone: '', email: '', role: 'client' },
    ];
    onChange({ ...content, parties: newParties });
  };

  const removeParty = (index: number) => {
    const newParties = content.parties.filter((_: any, i: number) => i !== index);
    onChange({ ...content, parties: newParties });
  };

  const updateParty = (index: number, field: string, value: string) => {
    const newParties = [...content.parties];
    newParties[index] = { ...newParties[index], [field]: value };
    onChange({ ...content, parties: newParties });
  };

  return (
    <div className="space-y-4">
      {content.parties.map((party: any, index: number) => (
        <div key={index} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">
              <Users className="h-3 w-3 ml-1" />
              צד {index + 1}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeParty(index)}
              disabled={content.parties.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">שם מלא</Label>
              <Input
                value={party.name || ''}
                onChange={(e) => updateParty(index, 'name', e.target.value)}
                placeholder="שם מלא"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">תפקיד</Label>
              <Select
                value={party.role || 'client'}
                onValueChange={(value) => updateParty(index, 'role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">לקוח</SelectItem>
                  <SelectItem value="contractor">קבלן</SelectItem>
                  <SelectItem value="consultant">יועץ</SelectItem>
                  <SelectItem value="supplier">ספק</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">ת.ז / ח.פ</Label>
              <Input
                value={party.idNumber || ''}
                onChange={(e) => updateParty(index, 'idNumber', e.target.value)}
                placeholder="מספר זהות"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">טלפון</Label>
              <Input
                value={party.phone || ''}
                onChange={(e) => updateParty(index, 'phone', e.target.value)}
                placeholder="מספר טלפון"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="text-xs">כתובת</Label>
              <Input
                value={party.address || ''}
                onChange={(e) => updateParty(index, 'address', e.target.value)}
                placeholder="כתובת מלאה"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="text-xs">דוא"ל</Label>
              <Input
                type="email"
                value={party.email || ''}
                onChange={(e) => updateParty(index, 'email', e.target.value)}
                placeholder="כתובת מייל"
              />
            </div>
          </div>
        </div>
      ))}

      <Button onClick={addParty} variant="outline" className="w-full">
        <Plus className="h-4 w-4 ml-2" />
        הוסף צד
      </Button>
    </div>
  );
}

// Section Block Editor
export function SectionBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content || {
    sectionNumber: '',
    title: '',
    content: '',
    subsections: [],
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>מספר סעיף</Label>
          <Input
            value={content.sectionNumber || ''}
            onChange={(e) => onChange({ ...content, sectionNumber: e.target.value })}
            placeholder="1.1"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label>כותרת הסעיף</Label>
          <Input
            value={content.title || ''}
            onChange={(e) => onChange({ ...content, title: e.target.value })}
            placeholder="כותרת"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>תוכן</Label>
        <RichTextToolbar />
        <Textarea
          value={content.content || ''}
          onChange={(e) => onChange({ ...content, content: e.target.value })}
          placeholder="תוכן הסעיף..."
          rows={6}
          className="font-sans"
        />
      </div>
    </div>
  );
}

// Items/Pricing Block Editor
export function ItemsBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content || {
    items: [],
    showVat: true,
    vatRate: 17,
    currency: 'ILS',
  };

  const addItem = () => {
    const newItems = [
      ...content.items,
      { description: '', quantity: 1, unit: 'יח׳', price: 0, total: 0 },
    ];
    onChange({ ...content, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = content.items.filter((_: any, i: number) => i !== index);
    onChange({ ...content, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...content.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'price') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      const price = field === 'price' ? value : newItems[index].price;
      newItems[index].total = quantity * price;
    }
    
    onChange({ ...content, items: newItems });
  };

  const subtotal = content.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
  const vat = content.showVat ? subtotal * (content.vatRate / 100) : 0;
  const total = subtotal + vat;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>פריטים ומחירים</Label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs">מע"מ</Label>
            <Switch
              checked={content.showVat}
              onCheckedChange={(checked) => onChange({ ...content, showVat: checked })}
            />
          </div>
          <Select
            value={content.currency}
            onValueChange={(value) => onChange({ ...content, currency: value })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ILS">₪</SelectItem>
              <SelectItem value="USD">$</SelectItem>
              <SelectItem value="EUR">€</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">תיאור</TableHead>
            <TableHead className="w-[15%]">כמות</TableHead>
            <TableHead className="w-[15%]">יחידה</TableHead>
            <TableHead className="w-[15%]">מחיר</TableHead>
            <TableHead className="w-[15%]">סה"כ</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {content.items.map((item: any, index: number) => (
            <TableRow key={index}>
              <TableCell>
                <Input
                  value={item.description || ''}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="תיאור הפריט"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.quantity || 0}
                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={item.unit || ''}
                  onChange={(e) => updateItem(index, 'unit', e.target.value)}
                  placeholder="יחידה"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.price || 0}
                  onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                  className="h-8"
                />
              </TableCell>
              <TableCell className="font-semibold">
                {item.total?.toLocaleString('he-IL') || 0}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button onClick={addItem} variant="outline" className="w-full" size="sm">
        <Plus className="h-4 w-4 ml-2" />
        הוסף פריט
      </Button>

      <Separator />

      <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
        <div className="flex justify-between text-sm">
          <span>סכום ביניים:</span>
          <span className="font-semibold">
            {subtotal.toLocaleString('he-IL')} {content.currency === 'ILS' ? '₪' : content.currency}
          </span>
        </div>
        {content.showVat && (
          <div className="flex justify-between text-sm">
            <span>מע"מ ({content.vatRate}%):</span>
            <span className="font-semibold">
              {vat.toLocaleString('he-IL')} {content.currency === 'ILS' ? '₪' : content.currency}
            </span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>סה"כ לתשלום:</span>
          <span className="text-blue-600 dark:text-blue-400">
            {total.toLocaleString('he-IL')} {content.currency === 'ILS' ? '₪' : content.currency}
          </span>
        </div>
      </div>
    </div>
  );
}

// Payments Block Editor
export function PaymentsBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content || {
    payments: [],
    totalAmount: 0,
    currency: 'ILS',
  };

  const addPayment = () => {
    const newPayments = [
      ...content.payments,
      {
        description: '',
        amount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
      },
    ];
    onChange({ ...content, payments: newPayments });
  };

  const removePayment = (index: number) => {
    const newPayments = content.payments.filter((_: any, i: number) => i !== index);
    onChange({ ...content, payments: newPayments });
  };

  const updatePayment = (index: number, field: string, value: any) => {
    const newPayments = [...content.payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    onChange({ ...content, payments: newPayments });
  };

  const totalPayments = content.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>תשלומים</Label>
        <Badge variant="outline">
          <DollarSign className="h-3 w-3 ml-1" />
          {totalPayments.toLocaleString('he-IL')} ₪
        </Badge>
      </div>

      <div className="space-y-3">
        {content.payments.map((payment: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="flex items-start justify-between mb-3">
              <Badge>תשלום {index + 1}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePayment(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">תיאור</Label>
                <Input
                  value={payment.description || ''}
                  onChange={(e) => updatePayment(index, 'description', e.target.value)}
                  placeholder="תיאור התשלום"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">סכום</Label>
                <Input
                  type="number"
                  value={payment.amount || 0}
                  onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">תאריך</Label>
                <Input
                  type="date"
                  value={payment.dueDate || ''}
                  onChange={(e) => updatePayment(index, 'dueDate', e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label className="text-xs">סטטוס</Label>
                <Select
                  value={payment.status || 'pending'}
                  onValueChange={(value) => updatePayment(index, 'status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">ממתין</SelectItem>
                    <SelectItem value="paid">שולם</SelectItem>
                    <SelectItem value="overdue">באיחור</SelectItem>
                    <SelectItem value="cancelled">בוטל</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={addPayment} variant="outline" className="w-full">
        <Plus className="h-4 w-4 ml-2" />
        הוסף תשלום
      </Button>
    </div>
  );
}

// Timeline Block Editor
export function TimelineBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content || {
    milestones: [],
  };

  const addMilestone = () => {
    const newMilestones = [
      ...content.milestones,
      {
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
      },
    ];
    onChange({ ...content, milestones: newMilestones });
  };

  const removeMilestone = (index: number) => {
    const newMilestones = content.milestones.filter((_: any, i: number) => i !== index);
    onChange({ ...content, milestones: newMilestones });
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    const newMilestones = [...content.milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    onChange({ ...content, milestones: newMilestones });
  };

  return (
    <div className="space-y-4">
      <Label>לוח זמנים ואבני דרך</Label>

      <div className="space-y-3">
        {content.milestones.map((milestone: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="flex items-start justify-between mb-3">
              <Badge variant="outline">
                <Calendar className="h-3 w-3 ml-1" />
                אבן דרך {index + 1}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeMilestone(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">כותרת</Label>
                <Input
                  value={milestone.title || ''}
                  onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                  placeholder="שם אבן הדרך"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">תיאור</Label>
                <Textarea
                  value={milestone.description || ''}
                  onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                  placeholder="פרטים נוספים"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">תאריך יעד</Label>
                  <Input
                    type="date"
                    value={milestone.date || ''}
                    onChange={(e) => updateMilestone(index, 'date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">סטטוס</Label>
                  <Select
                    value={milestone.status || 'pending'}
                    onValueChange={(value) => updateMilestone(index, 'status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">ממתין</SelectItem>
                      <SelectItem value="in-progress">בתהליך</SelectItem>
                      <SelectItem value="completed">הושלם</SelectItem>
                      <SelectItem value="delayed">באיחור</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={addMilestone} variant="outline" className="w-full">
        <Plus className="h-4 w-4 ml-2" />
        הוסף אבן דרך
      </Button>
    </div>
  );
}

// Terms Block Editor
export function TermsBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content || {
    terms: [],
  };

  const addTerm = () => {
    const newTerms = [
      ...content.terms,
      { title: '', content: '', important: false },
    ];
    onChange({ ...content, terms: newTerms });
  };

  const removeTerm = (index: number) => {
    const newTerms = content.terms.filter((_: any, i: number) => i !== index);
    onChange({ ...content, terms: newTerms });
  };

  const updateTerm = (index: number, field: string, value: any) => {
    const newTerms = [...content.terms];
    newTerms[index] = { ...newTerms[index], [field]: value };
    onChange({ ...content, terms: newTerms });
  };

  return (
    <div className="space-y-4">
      <Label>תנאים והתניות</Label>

      <div className="space-y-3">
        {content.terms.map((term: any, index: number) => (
          <div
            key={index}
            className={cn(
              'p-4 border rounded-lg',
              term.important
                ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300'
                : 'bg-slate-50 dark:bg-slate-800'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant={term.important ? 'default' : 'outline'}>
                  תנאי {index + 1}
                </Badge>
                {term.important && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 ml-1" />
                    חשוב
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={term.important}
                  onCheckedChange={(checked) => updateTerm(index, 'important', checked)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTerm(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">כותרת התנאי</Label>
                <Input
                  value={term.title || ''}
                  onChange={(e) => updateTerm(index, 'title', e.target.value)}
                  placeholder="כותרת"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">תוכן</Label>
                <Textarea
                  value={term.content || ''}
                  onChange={(e) => updateTerm(index, 'content', e.target.value)}
                  placeholder="תוכן התנאי..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={addTerm} variant="outline" className="w-full">
        <Plus className="h-4 w-4 ml-2" />
        הוסף תנאי
      </Button>
    </div>
  );
}

// Signatures Block Editor
export function SignaturesBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content || {
    signatures: [
      { name: '', role: '', date: new Date().toISOString().split('T')[0] },
      { name: '', role: '', date: new Date().toISOString().split('T')[0] },
    ],
  };

  const addSignature = () => {
    const newSignatures = [
      ...content.signatures,
      { name: '', role: '', date: new Date().toISOString().split('T')[0] },
    ];
    onChange({ ...content, signatures: newSignatures });
  };

  const removeSignature = (index: number) => {
    const newSignatures = content.signatures.filter((_: any, i: number) => i !== index);
    onChange({ ...content, signatures: newSignatures });
  };

  const updateSignature = (index: number, field: string, value: string) => {
    const newSignatures = [...content.signatures];
    newSignatures[index] = { ...newSignatures[index], [field]: value };
    onChange({ ...content, signatures: newSignatures });
  };

  return (
    <div className="space-y-4">
      <Label>חתימות</Label>

      <div className="grid grid-cols-2 gap-4">
        {content.signatures.map((signature: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline">חותם {index + 1}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSignature(index)}
                disabled={content.signatures.length <= 2}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">שם</Label>
                <Input
                  value={signature.name || ''}
                  onChange={(e) => updateSignature(index, 'name', e.target.value)}
                  placeholder="שם החותם"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">תפקיד</Label>
                <Input
                  value={signature.role || ''}
                  onChange={(e) => updateSignature(index, 'role', e.target.value)}
                  placeholder="תפקיד"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">תאריך</Label>
                <Input
                  type="date"
                  value={signature.date || ''}
                  onChange={(e) => updateSignature(index, 'date', e.target.value)}
                />
              </div>

              <div className="h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                חתימה
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={addSignature} variant="outline" className="w-full">
        <Plus className="h-4 w-4 ml-2" />
        הוסף חותם
      </Button>
    </div>
  );
}

// Notes Block Editor
export function NotesBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content || {
    notes: '',
    showInDocument: true,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>הערות</Label>
        <div className="flex items-center gap-2">
          <Label className="text-xs">הצג במסמך</Label>
          <Switch
            checked={content.showInDocument}
            onCheckedChange={(checked) => onChange({ ...content, showInDocument: checked })}
          />
        </div>
      </div>

      <Textarea
        value={content.notes || ''}
        onChange={(e) => onChange({ ...content, notes: e.target.value })}
        placeholder="הערות והארות..."
        rows={8}
        className="font-sans"
      />
    </div>
  );
}

// Custom Block Editor
export function CustomBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content || {
    html: '',
    text: '',
  };

  return (
    <div className="space-y-4">
      <Label>בלוק מותאם אישית</Label>

      <div className="space-y-2">
        <Label className="text-xs">תוכן טקסט</Label>
        <RichTextToolbar />
        <Textarea
          value={content.text || ''}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          placeholder="כתוב כאן את התוכן..."
          rows={10}
          className="font-sans"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">HTML מתקדם (אופציונלי)</Label>
        <Textarea
          value={content.html || ''}
          onChange={(e) => onChange({ ...content, html: e.target.value })}
          placeholder="<div>תוכן HTML...</div>"
          rows={6}
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}

// Main Block Editor Switch
export function BlockEditor({ block, onChange }: BlockEditorProps) {
  switch (block.type) {
    case 'header':
      return <HeaderBlockEditor block={block} onChange={onChange} />;
    case 'parties':
      return <PartiesBlockEditor block={block} onChange={onChange} />;
    case 'section':
      return <SectionBlockEditor block={block} onChange={onChange} />;
    case 'items':
      return <ItemsBlockEditor block={block} onChange={onChange} />;
    case 'payments':
      return <PaymentsBlockEditor block={block} onChange={onChange} />;
    case 'timeline':
      return <TimelineBlockEditor block={block} onChange={onChange} />;
    case 'terms':
      return <TermsBlockEditor block={block} onChange={onChange} />;
    case 'signatures':
      return <SignaturesBlockEditor block={block} onChange={onChange} />;
    case 'notes':
      return <NotesBlockEditor block={block} onChange={onChange} />;
    case 'custom':
      return <CustomBlockEditor block={block} onChange={onChange} />;
    default:
      return <CustomBlockEditor block={block} onChange={onChange} />;
  }
}
