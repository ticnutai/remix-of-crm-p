// BlockEditors - עורכי בלוקים לסוגי תוכן שונים
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  DollarSign,
  User,
  Building2,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  ContractBlock,
  HeaderContent,
  PartiesContent,
  SectionContent,
  ItemsContent,
  PaymentsContent,
  TimelineContent,
  TermsContent,
  SignaturesContent,
  NotesContent,
  CustomContent,
  PartyInfo,
  SectionItem,
  PricingTier,
  LineItem,
  PaymentStep,
  TimelineStep,
  TermItem,
  SignatureField,
} from './types';
import { cn } from '@/lib/utils';

// ============== Header Block Editor ==============
interface HeaderBlockEditorProps {
  content: HeaderContent;
  onChange: (content: HeaderContent) => void;
}

export function HeaderBlockEditor({ content, onChange }: HeaderBlockEditorProps) {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>כותרת ראשית</Label>
        <Input
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="חוזה שירותים"
          className="text-lg font-bold"
        />
      </div>
      <div className="space-y-2">
        <Label>כותרת משנית</Label>
        <Input
          value={content.subtitle || ''}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          placeholder="תיאור קצר..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>מספר חוזה</Label>
          <Input
            value={content.contractNumber || ''}
            onChange={(e) => onChange({ ...content, contractNumber: e.target.value })}
            placeholder="CON-001"
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
      {content.logo !== undefined && (
        <div className="space-y-2">
          <Label>לוגו (URL)</Label>
          <Input
            value={content.logo || ''}
            onChange={(e) => onChange({ ...content, logo: e.target.value })}
            placeholder="https://..."
          />
        </div>
      )}
    </div>
  );
}

// ============== Parties Block Editor ==============
interface PartiesBlockEditorProps {
  content: PartiesContent;
  onChange: (content: PartiesContent) => void;
}

export function PartiesBlockEditor({ content, onChange }: PartiesBlockEditorProps) {
  const addParty = () => {
    onChange({
      ...content,
      parties: [
        ...content.parties,
        { id: uuidv4(), type: 'other', name: '' },
      ],
    });
  };

  const updateParty = (id: string, updates: Partial<PartyInfo>) => {
    onChange({
      ...content,
      parties: content.parties.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    });
  };

  const removeParty = (id: string) => {
    onChange({
      ...content,
      parties: content.parties.filter((p) => p.id !== id),
    });
  };

  return (
    <div className="space-y-4 p-4">
      {content.parties.map((party, index) => (
        <Card key={party.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                {party.type === 'client' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                <span className="font-medium">צד {index + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeParty(party.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>סוג</Label>
                <Select
                  value={party.type}
                  onValueChange={(value: PartyInfo['type']) =>
                    updateParty(party.id, { type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">לקוח</SelectItem>
                    <SelectItem value="provider">ספק</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>שם מלא</Label>
                <Input
                  value={party.name}
                  onChange={(e) => updateParty(party.id, { name: e.target.value })}
                  placeholder="שם..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ח.פ / ת.ז</Label>
                <Input
                  value={party.idNumber || ''}
                  onChange={(e) => updateParty(party.id, { idNumber: e.target.value })}
                  placeholder="מספר..."
                />
              </div>
              <div className="space-y-2">
                <Label>כתובת</Label>
                <Input
                  value={party.address || ''}
                  onChange={(e) => updateParty(party.id, { address: e.target.value })}
                  placeholder="כתובת..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>טלפון</Label>
                <Input
                  value={party.phone || ''}
                  onChange={(e) => updateParty(party.id, { phone: e.target.value })}
                  placeholder="טלפון..."
                />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input
                  type="email"
                  value={party.email || ''}
                  onChange={(e) => updateParty(party.id, { email: e.target.value })}
                  placeholder="email@..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" className="w-full gap-2" onClick={addParty}>
        <Plus className="h-4 w-4" />
        הוסף צד
      </Button>
    </div>
  );
}

// ============== Section Block Editor ==============
interface SectionBlockEditorProps {
  content: SectionContent;
  onChange: (content: SectionContent) => void;
  title: string;
  onTitleChange: (title: string) => void;
}

export function SectionBlockEditor({
  content,
  onChange,
  title,
  onTitleChange,
}: SectionBlockEditorProps) {
  const addItem = () => {
    onChange({
      ...content,
      items: [...content.items, { id: uuidv4(), text: '', included: true }],
    });
  };

  const updateItem = (id: string, updates: Partial<SectionItem>) => {
    onChange({
      ...content,
      items: content.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    });
  };

  const removeItem = (id: string) => {
    onChange({
      ...content,
      items: content.items.filter((item) => item.id !== id),
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>כותרת הסעיף</Label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="שם הסעיף..."
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>הצג מחירים</Label>
        <Switch
          checked={content.showPrices || false}
          onCheckedChange={(checked) => onChange({ ...content, showPrices: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>הצג סימני V</Label>
        <Switch
          checked={content.showCheckmarks !== false}
          onCheckedChange={(checked) =>
            onChange({ ...content, showCheckmarks: checked })
          }
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>פריטים</Label>
        {content.items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 border rounded-md"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateItem(item.id, { included: !item.included })}
            >
              {item.included ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Input
              value={item.text}
              onChange={(e) => updateItem(item.id, { text: e.target.value })}
              placeholder={`פריט ${index + 1}...`}
              className="flex-1"
            />
            {content.showPrices && (
              <Input
                type="number"
                value={item.price || ''}
                onChange={(e) =>
                  updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                }
                placeholder="מחיר"
                className="w-24"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={() => removeItem(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={addItem}>
          <Plus className="h-3 w-3" />
          הוסף פריט
        </Button>
      </div>
    </div>
  );
}

// ============== Payments Block Editor ==============
interface PaymentsBlockEditorProps {
  content: PaymentsContent;
  onChange: (content: PaymentsContent) => void;
}

export function PaymentsBlockEditor({ content, onChange }: PaymentsBlockEditorProps) {
  const addStep = () => {
    onChange({
      ...content,
      steps: [
        ...content.steps,
        {
          id: uuidv4(),
          title: '',
          percentage: 0,
          dueDate: '',
          status: 'pending',
        },
      ],
    });
  };

  const updateStep = (id: string, updates: Partial<PaymentStep>) => {
    onChange({
      ...content,
      steps: content.steps.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const removeStep = (id: string) => {
    onChange({
      ...content,
      steps: content.steps.filter((s) => s.id !== id),
    });
  };

  const totalPercentage = content.steps.reduce((sum, s) => sum + (s.percentage || 0), 0);

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>תנאי תשלום</Label>
          <Input
            value={content.paymentTerms || ''}
            onChange={(e) => onChange({ ...content, paymentTerms: e.target.value })}
            placeholder="שוטף + 30..."
          />
        </div>
        <div className="space-y-2">
          <Label>מטבע</Label>
          <Select
            value={content.currency || '₪'}
            onValueChange={(value) => onChange({ ...content, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="₪">₪ שקל</SelectItem>
              <SelectItem value="$">$ דולר</SelectItem>
              <SelectItem value="€">€ יורו</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label>שלבי תשלום</Label>
        <Badge variant={totalPercentage === 100 ? 'default' : 'destructive'}>
          {totalPercentage}%
        </Badge>
      </div>

      <div className="space-y-2">
        {content.steps.map((step, index) => (
          <Card key={step.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">תשלום {index + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeStep(step.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">תיאור</Label>
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    placeholder="תיאור..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">אחוז</Label>
                  <Input
                    type="number"
                    value={step.percentage || ''}
                    onChange={(e) =>
                      updateStep(step.id, {
                        percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="%"
                    min={0}
                    max={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">תאריך יעד</Label>
                  <Input
                    type="date"
                    value={step.dueDate || ''}
                    onChange={(e) => updateStep(step.id, { dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">סכום קבוע (אופציונלי)</Label>
                <Input
                  type="number"
                  value={step.amount || ''}
                  onChange={(e) =>
                    updateStep(step.id, { amount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={`סכום ב${content.currency || '₪'}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" className="w-full gap-2" onClick={addStep}>
          <Plus className="h-4 w-4" />
          הוסף שלב תשלום
        </Button>
      </div>
    </div>
  );
}

// ============== Timeline Block Editor ==============
interface TimelineBlockEditorProps {
  content: TimelineContent;
  onChange: (content: TimelineContent) => void;
}

export function TimelineBlockEditor({ content, onChange }: TimelineBlockEditorProps) {
  const addStep = () => {
    onChange({
      ...content,
      steps: [
        ...content.steps,
        {
          id: uuidv4(),
          title: '',
          duration: '',
          status: 'pending',
        },
      ],
    });
  };

  const updateStep = (id: string, updates: Partial<TimelineStep>) => {
    onChange({
      ...content,
      steps: content.steps.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const removeStep = (id: string) => {
    onChange({
      ...content,
      steps: content.steps.filter((s) => s.id !== id),
    });
  };

  return (
    <div className="space-y-4 p-4">
      <Label>שלבי פרויקט</Label>
      <div className="space-y-2">
        {content.steps.map((step, index) => (
          <div
            key={step.id}
            className="flex items-start gap-2 p-3 border rounded-md"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab mt-2" />
            <Calendar className="h-4 w-4 mt-2" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{index + 1}</Badge>
                <Input
                  value={step.title}
                  onChange={(e) => updateStep(step.id, { title: e.target.value })}
                  placeholder="שם השלב..."
                  className="flex-1"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={step.duration || ''}
                  onChange={(e) => updateStep(step.id, { duration: e.target.value })}
                  placeholder="משך זמן (ימים)"
                />
                <Input
                  type="date"
                  value={step.startDate || ''}
                  onChange={(e) => updateStep(step.id, { startDate: e.target.value })}
                />
                <Input
                  type="date"
                  value={step.endDate || ''}
                  onChange={(e) => updateStep(step.id, { endDate: e.target.value })}
                />
              </div>
              <Textarea
                value={step.description || ''}
                onChange={(e) => updateStep(step.id, { description: e.target.value })}
                placeholder="תיאור השלב..."
                rows={2}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={() => removeStep(step.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" className="w-full gap-2" onClick={addStep}>
          <Plus className="h-4 w-4" />
          הוסף שלב
        </Button>
      </div>
    </div>
  );
}

// ============== Terms Block Editor ==============
interface TermsBlockEditorProps {
  content: TermsContent;
  onChange: (content: TermsContent) => void;
}

export function TermsBlockEditor({ content, onChange }: TermsBlockEditorProps) {
  const addTerm = () => {
    onChange({
      ...content,
      terms: [...content.terms, { id: uuidv4(), text: '' }],
    });
  };

  const updateTerm = (id: string, text: string) => {
    onChange({
      ...content,
      terms: content.terms.map((t) => (t.id === id ? { ...t, text } : t)),
    });
  };

  const removeTerm = (id: string) => {
    onChange({
      ...content,
      terms: content.terms.filter((t) => t.id !== id),
    });
  };

  const addClause = () => {
    onChange({
      ...content,
      specialClauses: [...(content.specialClauses || []), { id: uuidv4(), title: '', text: '' }],
    });
  };

  const updateClause = (id: string, updates: Partial<{ title: string; text: string }>) => {
    onChange({
      ...content,
      specialClauses: content.specialClauses?.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ) || [],
    });
  };

  const removeClause = (id: string) => {
    onChange({
      ...content,
      specialClauses: content.specialClauses?.filter((c) => c.id !== id) || [],
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>תנאים כלליים</Label>
        {content.terms.map((term, index) => (
          <div key={term.id} className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab mt-2" />
            <Badge variant="outline" className="mt-1">
              {index + 1}
            </Badge>
            <Textarea
              value={term.text}
              onChange={(e) => updateTerm(term.id, e.target.value)}
              placeholder="תנאי..."
              rows={2}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={() => removeTerm(term.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={addTerm}>
          <Plus className="h-3 w-3" />
          הוסף תנאי
        </Button>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>סעיפים מיוחדים</Label>
        {content.specialClauses?.map((clause) => (
          <Card key={clause.id}>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={clause.title || ''}
                  onChange={(e) => updateClause(clause.id, { title: e.target.value })}
                  placeholder="כותרת הסעיף..."
                  className="flex-1 font-medium"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeClause(clause.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Textarea
                value={clause.text || ''}
                onChange={(e) => updateClause(clause.id, { text: e.target.value })}
                placeholder="תוכן הסעיף..."
                rows={3}
              />
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={addClause}>
          <Plus className="h-3 w-3" />
          הוסף סעיף מיוחד
        </Button>
      </div>
    </div>
  );
}

// ============== Signatures Block Editor ==============
interface SignaturesBlockEditorProps {
  content: SignaturesContent;
  onChange: (content: SignaturesContent) => void;
}

export function SignaturesBlockEditor({ content, onChange }: SignaturesBlockEditorProps) {
  const addField = () => {
    onChange({
      ...content,
      fields: [...content.fields, { id: uuidv4(), label: '' }],
    });
  };

  const updateField = (id: string, updates: Partial<SignatureField>) => {
    onChange({
      ...content,
      fields: content.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  };

  const removeField = (id: string) => {
    onChange({
      ...content,
      fields: content.fields.filter((f) => f.id !== id),
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Label>הצג תאריך</Label>
        <Switch
          checked={content.showDate !== false}
          onCheckedChange={(checked) => onChange({ ...content, showDate: checked })}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>שדות חתימה</Label>
        {content.fields.map((field) => (
          <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <Input
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              placeholder="תווית (למשל: מזמין)..."
              className="flex-1"
            />
            <Input
              value={field.title || ''}
              onChange={(e) => updateField(field.id, { title: e.target.value })}
              placeholder="תפקיד..."
              className="w-32"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={() => removeField(field.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={addField}>
          <Plus className="h-3 w-3" />
          הוסף שדה חתימה
        </Button>
      </div>
    </div>
  );
}

// ============== Notes Block Editor ==============
interface NotesBlockEditorProps {
  content: NotesContent;
  onChange: (content: NotesContent) => void;
}

export function NotesBlockEditor({ content, onChange }: NotesBlockEditorProps) {
  const addNote = () => {
    onChange({
      ...content,
      notes: [...content.notes, { id: uuidv4(), text: '', type: 'info' }],
    });
  };

  const updateNote = (id: string, updates: Partial<{ text: string; type: string }>) => {
    onChange({
      ...content,
      notes: content.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    });
  };

  const removeNote = (id: string) => {
    onChange({
      ...content,
      notes: content.notes.filter((n) => n.id !== id),
    });
  };

  return (
    <div className="space-y-4 p-4">
      <Label>הערות</Label>
      {content.notes.map((note) => (
        <div key={note.id} className="space-y-2 p-3 border rounded-md">
          <div className="flex items-center gap-2">
            <Select
              value={note.type || 'info'}
              onValueChange={(value) => updateNote(note.id, { type: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">מידע</SelectItem>
                <SelectItem value="warning">אזהרה</SelectItem>
                <SelectItem value="important">חשוב</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive mr-auto"
              onClick={() => removeNote(note.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Textarea
            value={note.text}
            onChange={(e) => updateNote(note.id, { text: e.target.value })}
            placeholder="הערה..."
            rows={2}
          />
        </div>
      ))}
      <Button variant="outline" className="w-full gap-2" onClick={addNote}>
        <Plus className="h-4 w-4" />
        הוסף הערה
      </Button>
    </div>
  );
}

// ============== Custom Block Editor ==============
interface CustomBlockEditorProps {
  content: CustomContent;
  onChange: (content: CustomContent) => void;
}

export function CustomBlockEditor({ content, onChange }: CustomBlockEditorProps) {
  return (
    <div className="space-y-4 p-4">
      <Label>תוכן HTML מותאם</Label>
      <Textarea
        value={content.html}
        onChange={(e) => onChange({ ...content, html: e.target.value })}
        placeholder="<div>...</div>"
        rows={10}
        className="font-mono text-sm"
        dir="ltr"
      />
      <p className="text-xs text-muted-foreground">
        ניתן להזין קוד HTML מותאם אישית שיוצג בתצוגה המקדימה
      </p>
    </div>
  );
}

// ============== Block Editor Router ==============
interface BlockEditorProps {
  block: ContractBlock;
  onBlockChange: (updates: Partial<ContractBlock>) => void;
  onContentChange: (content: any) => void;
}

export function BlockEditor({ block, onBlockChange, onContentChange }: BlockEditorProps) {
  switch (block.type) {
    case 'header':
      return (
        <HeaderBlockEditor
          content={block.content as HeaderContent}
          onChange={onContentChange}
        />
      );
    case 'parties':
      return (
        <PartiesBlockEditor
          content={block.content as PartiesContent}
          onChange={onContentChange}
        />
      );
    case 'section':
      return (
        <SectionBlockEditor
          content={block.content as SectionContent}
          onChange={onContentChange}
          title={block.title}
          onTitleChange={(title) => onBlockChange({ title })}
        />
      );
    case 'payments':
      return (
        <PaymentsBlockEditor
          content={block.content as PaymentsContent}
          onChange={onContentChange}
        />
      );
    case 'timeline':
      return (
        <TimelineBlockEditor
          content={block.content as TimelineContent}
          onChange={onContentChange}
        />
      );
    case 'terms':
      return (
        <TermsBlockEditor
          content={block.content as TermsContent}
          onChange={onContentChange}
        />
      );
    case 'signatures':
      return (
        <SignaturesBlockEditor
          content={block.content as SignaturesContent}
          onChange={onContentChange}
        />
      );
    case 'notes':
      return (
        <NotesBlockEditor
          content={block.content as NotesContent}
          onChange={onContentChange}
        />
      );
    case 'custom':
      return (
        <CustomBlockEditor
          content={block.content as CustomContent}
          onChange={onContentChange}
        />
      );
    default:
      return (
        <div className="p-4 text-muted-foreground text-center">
          אין עורך זמין לסוג בלוק זה
        </div>
      );
  }
}

export default BlockEditor;
