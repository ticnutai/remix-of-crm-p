import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  User,
  FileText,
  Palette,
  Settings2,
  Eye,
  Type,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { QuoteDocumentData } from './types';

interface EditorSidebarProps {
  document: QuoteDocumentData;
  onUpdate: (updates: Partial<QuoteDocumentData>) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const FONT_OPTIONS = [
  { value: 'Heebo', label: 'Heebo' },
  { value: 'Assistant', label: 'Assistant' },
  { value: 'Rubik', label: 'Rubik' },
  { value: 'Open Sans Hebrew', label: 'Open Sans' },
];

const UNITS = [
  { value: 'יח\'', label: 'יחידה' },
  { value: 'מ"ר', label: 'מ"ר' },
  { value: 'מ"א', label: 'מ"א' },
  { value: 'שעה', label: 'שעה' },
  { value: 'יום', label: 'יום' },
  { value: 'חודש', label: 'חודש' },
  { value: 'קומפלט', label: 'קומפלט' },
];

export function EditorSidebar({ document, onUpdate, collapsed, onToggle }: EditorSidebarProps) {
  const [openSections, setOpenSections] = useState<string[]>(['company', 'client']);

  if (collapsed) {
    return (
      <div className="w-12 bg-card border-l flex flex-col items-center py-4 gap-2">
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Separator className="my-2" />
        <Button variant="ghost" size="icon" title="פרטי חברה">
          <Building2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="פרטי לקוח">
          <User className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="תוכן">
          <FileText className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="עיצוב">
          <Palette className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="הגדרות">
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-l flex flex-col" dir="rtl">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">הגדרות מסמך</h3>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="px-3"
        >
          {/* Company Details */}
          <AccordionItem value="company">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                פרטי החברה
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div>
                <Label className="text-xs">שם החברה</Label>
                <Input
                  value={document.companyName}
                  onChange={(e) => onUpdate({ companyName: e.target.value })}
                  placeholder="שם החברה"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">כתובת</Label>
                <Input
                  value={document.companyAddress}
                  onChange={(e) => onUpdate({ companyAddress: e.target.value })}
                  placeholder="כתובת החברה"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">טלפון</Label>
                  <Input
                    value={document.companyPhone}
                    onChange={(e) => onUpdate({ companyPhone: e.target.value })}
                    placeholder="טלפון"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">אימייל</Label>
                  <Input
                    value={document.companyEmail}
                    onChange={(e) => onUpdate({ companyEmail: e.target.value })}
                    placeholder="אימייל"
                    className="mt-1"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Client Details */}
          <AccordionItem value="client">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                פרטי הלקוח
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div>
                <Label className="text-xs">שם הלקוח</Label>
                <Input
                  value={document.clientName}
                  onChange={(e) => onUpdate({ clientName: e.target.value })}
                  placeholder="שם הלקוח"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">חברה</Label>
                <Input
                  value={document.clientCompany || ''}
                  onChange={(e) => onUpdate({ clientCompany: e.target.value })}
                  placeholder="שם החברה"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">כתובת</Label>
                <Input
                  value={document.clientAddress || ''}
                  onChange={(e) => onUpdate({ clientAddress: e.target.value })}
                  placeholder="כתובת"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">טלפון</Label>
                  <Input
                    value={document.clientPhone || ''}
                    onChange={(e) => onUpdate({ clientPhone: e.target.value })}
                    placeholder="טלפון"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">אימייל</Label>
                  <Input
                    value={document.clientEmail || ''}
                    onChange={(e) => onUpdate({ clientEmail: e.target.value })}
                    placeholder="אימייל"
                    className="mt-1"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Content */}
          <AccordionItem value="content">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                תוכן
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div>
                <Label className="text-xs">כותרת</Label>
                <Input
                  value={document.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">פתיחה</Label>
                <Textarea
                  value={document.introduction || ''}
                  onChange={(e) => onUpdate({ introduction: e.target.value })}
                  rows={3}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">תנאים</Label>
                <Textarea
                  value={document.terms || ''}
                  onChange={(e) => onUpdate({ terms: e.target.value })}
                  rows={3}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">הערות</Label>
                <Textarea
                  value={document.notes || ''}
                  onChange={(e) => onUpdate({ notes: e.target.value })}
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">חתימה</Label>
                <Textarea
                  value={document.footer || ''}
                  onChange={(e) => onUpdate({ footer: e.target.value })}
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Styling */}
          <AccordionItem value="styling">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                עיצוב
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">צבע ראשי</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={document.primaryColor}
                      onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                      className="w-10 h-8 p-0 border-0"
                    />
                    <Input
                      value={document.primaryColor}
                      onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">צבע משני</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={document.secondaryColor}
                      onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                      className="w-10 h-8 p-0 border-0"
                    />
                    <Input
                      value={document.secondaryColor}
                      onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">גופן</Label>
                <Select
                  value={document.fontFamily}
                  onValueChange={(v) => onUpdate({ fontFamily: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(font => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Settings */}
          <AccordionItem value="settings">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                הגדרות
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג לוגו</Label>
                <Switch
                  checked={document.showLogo}
                  onCheckedChange={(v) => onUpdate({ showLogo: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג פרטי חברה</Label>
                <Switch
                  checked={document.showCompanyDetails}
                  onCheckedChange={(v) => onUpdate({ showCompanyDetails: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג פרטי לקוח</Label>
                <Switch
                  checked={document.showClientDetails}
                  onCheckedChange={(v) => onUpdate({ showClientDetails: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג מספרי פריטים</Label>
                <Switch
                  checked={document.showItemNumbers}
                  onCheckedChange={(v) => onUpdate({ showItemNumbers: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג מע"מ</Label>
                <Switch
                  checked={document.showVat}
                  onCheckedChange={(v) => onUpdate({ showVat: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג תנאי תשלום</Label>
                <Switch
                  checked={document.showPaymentTerms}
                  onCheckedChange={(v) => onUpdate({ showPaymentTerms: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג חתימה</Label>
                <Switch
                  checked={document.showSignature}
                  onCheckedChange={(v) => onUpdate({ showSignature: v })}
                />
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-xs">אחוז מע"מ</Label>
                <Input
                  type="number"
                  value={document.vatRate}
                  onChange={(e) => onUpdate({ vatRate: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs">הנחה</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    value={document.discount}
                    onChange={(e) => onUpdate({ discount: parseFloat(e.target.value) || 0 })}
                    min={0}
                    className="flex-1"
                  />
                  <Select
                    value={document.discountType}
                    onValueChange={(v: 'percent' | 'fixed') => onUpdate({ discountType: v })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="fixed">₪</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
}
