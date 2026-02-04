import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
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
  CalendarIcon,
  DollarSign,
  Users,
  PenTool,
  CreditCard,
  Image,
  Upload,
  X,
  Globe,
  Phone,
  Mail,
  MapPin,
  Hash,
  Landmark,
  Package,
} from 'lucide-react';
import { DocumentData, DocumentSettings, EditorPanel, CompanyBranding, PricingTier, Upgrade, DocumentSection, TimelineStep } from './types';
import { AdvancedPricingEditor } from './AdvancedPricingEditor';

interface EditorSidebarProps {
  document: DocumentData;
  onUpdateDocument: (updates: Partial<DocumentData>) => void;
  onUpdateSettings: (updates: Partial<DocumentSettings>) => void;
  collapsed: boolean;
  onToggle: () => void;
  activePanel: EditorPanel;
  onPanelChange: (panel: EditorPanel) => void;
  clients?: Array<{ id: string; name: string; company?: string; email?: string; phone?: string; address?: string }>;
  onClientSelect?: (clientId: string) => void;
}

const FONT_OPTIONS = [
  { value: 'Heebo', label: 'Heebo' },
  { value: 'Assistant', label: 'Assistant' },
  { value: 'Rubik', label: 'Rubik' },
  { value: 'Open Sans Hebrew', label: 'Open Sans' },
];

const COLOR_PRESETS = [
  { name: 'כחול כהה', primary: '#1e3a5f', secondary: '#d4a84b' },
  { name: 'ירוק', primary: '#166534', secondary: '#fbbf24' },
  { name: 'סגול', primary: '#6b21a8', secondary: '#f472b6' },
  { name: 'אפור', primary: '#374151', secondary: '#60a5fa' },
  { name: 'אדום', primary: '#991b1b', secondary: '#fcd34d' },
];

const panels = [
  { id: 'branding' as EditorPanel, icon: Building2, label: 'מיתוג' },
  { id: 'pricing' as EditorPanel, icon: Package, label: 'תמחור' },
  { id: 'settings' as EditorPanel, icon: Settings2, label: 'הגדרות' },
  { id: 'parties' as EditorPanel, icon: Users, label: 'צדדים' },
  { id: 'content' as EditorPanel, icon: FileText, label: 'תוכן' },
  { id: 'items' as EditorPanel, icon: DollarSign, label: 'פריטים' },
  { id: 'payments' as EditorPanel, icon: CreditCard, label: 'תשלומים' },
  { id: 'signatures' as EditorPanel, icon: PenTool, label: 'חתימות' },
];

export function EditorSidebar({
  document: doc,
  onUpdateDocument,
  onUpdateSettings,
  collapsed,
  onToggle,
  activePanel,
  onPanelChange,
  clients = [],
  onClientSelect,
}: EditorSidebarProps) {
  const [openSections, setOpenSections] = useState<string[]>(['general', 'display', 'logo', 'company']);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateBranding = (updates: Partial<CompanyBranding>) => {
    onUpdateDocument({
      branding: { ...doc.branding, ...updates }
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleUpdateBranding({ logo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    handleUpdateBranding({ logo: '' });
  };

  if (collapsed) {
    return (
      <div className="w-12 h-full bg-card border-l flex flex-col items-center py-3 gap-1">
        <Button variant="ghost" size="icon" onClick={onToggle} className="mb-2">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Separator className="w-8 mb-2" />
        {panels.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant={activePanel === id ? 'secondary' : 'ghost'}
            size="icon"
            title={label}
            onClick={() => {
              onPanelChange(id);
              onToggle();
            }}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full bg-card border-l flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <h3 className="font-semibold text-sm">הגדרות מסמך</h3>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Panel tabs */}
      <div className="flex flex-wrap gap-1 p-2 border-b shrink-0">
        {panels.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant={activePanel === id ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1 px-2"
            onClick={() => onPanelChange(id)}
          >
            <Icon className="h-3 w-3" />
            {label}
          </Button>
        ))}
      </div>

      {/* Panel content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Branding Panel - מיתוג */}
          {activePanel === 'branding' && (
            <Accordion
              type="multiple"
              value={openSections}
              onValueChange={setOpenSections}
              className="space-y-2"
            >
              {/* Logo Section */}
              <AccordionItem value="logo" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <span className="text-sm font-medium">לוגו</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-3">
                  {/* Logo Preview */}
                  <div className="flex justify-center">
                    {doc.branding?.logo ? (
                      <div className="relative group">
                        <img
                          src={doc.branding.logo}
                          alt="Logo"
                          className="max-h-24 max-w-full object-contain rounded border p-2"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">העלה לוגו</span>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>

                  {doc.branding?.logo && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3 ml-2" />
                      החלף לוגו
                    </Button>
                  )}

                  {/* Logo Position */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">מיקום לוגו</Label>
                    <Select
                      value={doc.branding?.logoPosition || 'right'}
                      onValueChange={(value: 'left' | 'center' | 'right') => 
                        handleUpdateBranding({ logoPosition: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">ימין</SelectItem>
                        <SelectItem value="center">מרכז</SelectItem>
                        <SelectItem value="left">שמאל</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Logo Size */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">גודל לוגו</Label>
                    <Select
                      value={doc.branding?.logoSize || 'medium'}
                      onValueChange={(value: 'small' | 'medium' | 'large') => 
                        handleUpdateBranding({ logoSize: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">קטן</SelectItem>
                        <SelectItem value="medium">בינוני</SelectItem>
                        <SelectItem value="large">גדול</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Company Details Section */}
              <AccordionItem value="company" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-medium">פרטי חברה</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      שם החברה
                    </Label>
                    <Input
                      value={doc.branding?.name || ''}
                      onChange={(e) => handleUpdateBranding({ name: e.target.value })}
                      placeholder="שם העסק / החברה"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">תת-כותרת / סלוגן</Label>
                    <Input
                      value={doc.branding?.tagline || ''}
                      onChange={(e) => handleUpdateBranding({ tagline: e.target.value })}
                      placeholder='למשל: "פתרונות מתקדמים לעסקים"'
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      כתובת
                    </Label>
                    <Textarea
                      value={doc.branding?.address || ''}
                      onChange={(e) => handleUpdateBranding({ address: e.target.value })}
                      placeholder="כתובת מלאה"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        טלפון
                      </Label>
                      <Input
                        value={doc.branding?.phone || ''}
                        onChange={(e) => handleUpdateBranding({ phone: e.target.value })}
                        placeholder="050-0000000"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        אימייל
                      </Label>
                      <Input
                        value={doc.branding?.email || ''}
                        onChange={(e) => handleUpdateBranding({ email: e.target.value })}
                        placeholder="email@company.com"
                        dir="ltr"
                        type="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      אתר אינטרנט
                    </Label>
                    <Input
                      value={doc.branding?.website || ''}
                      onChange={(e) => handleUpdateBranding({ website: e.target.value })}
                      placeholder="www.company.com"
                      dir="ltr"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Business Registration Section */}
              <AccordionItem value="registration" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span className="text-sm font-medium">פרטי רישום</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">ח.פ / ע.מ</Label>
                    <Input
                      value={doc.branding?.registrationNumber || ''}
                      onChange={(e) => handleUpdateBranding({ registrationNumber: e.target.value })}
                      placeholder="מספר רישום העסק"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">מספר עוסק מורשה</Label>
                    <Input
                      value={doc.branding?.taxId || ''}
                      onChange={(e) => handleUpdateBranding({ taxId: e.target.value })}
                      placeholder="מספר עוסק"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Landmark className="h-3 w-3" />
                      פרטי בנק להעברה
                    </Label>
                    <Textarea
                      value={doc.branding?.bankDetails || ''}
                      onChange={(e) => handleUpdateBranding({ bankDetails: e.target.value })}
                      placeholder="בנק: הפועלים, סניף: 123, חשבון: 456789"
                      rows={2}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Pricing Panel - תמחור מתקדם */}
          {activePanel === 'pricing' && (
            <AdvancedPricingEditor
              pricingTiers={doc.pricingTiers || []}
              upgrades={doc.upgrades || []}
              sections={doc.sections || []}
              timeline={doc.timeline || []}
              importantNotes={doc.importantNotes || []}
              onUpdateTiers={(tiers) => onUpdateDocument({ pricingTiers: tiers })}
              onUpdateUpgrades={(upgrades) => onUpdateDocument({ upgrades })}
              onUpdateSections={(sections) => onUpdateDocument({ sections })}
              onUpdateTimeline={(timeline) => onUpdateDocument({ timeline })}
              onUpdateNotes={(notes) => onUpdateDocument({ importantNotes: notes })}
            />
          )}

          {/* Settings Panel */}
          {activePanel === 'settings' && (
            <Accordion
              type="multiple"
              value={openSections}
              onValueChange={setOpenSections}
              className="space-y-2"
            >
              {/* General Settings */}
              <AccordionItem value="general" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">פרטי מסמך</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">כותרת ראשית</Label>
                    <Input
                      value={doc.title}
                      onChange={(e) => onUpdateDocument({ title: e.target.value })}
                      placeholder={doc.type === 'quote' ? 'הצעת מחיר לתוספת בניה' : 'חוזה התקשרות'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">תת-כותרת / תיאור</Label>
                    <Input
                      value={doc.subtitle || ''}
                      onChange={(e) => onUpdateDocument({ subtitle: e.target.value })}
                      placeholder="למשל: הוצאת היתר בניה לתוספת בניה"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">מיקום / כתובת הפרויקט</Label>
                    <Input
                      value={doc.location || ''}
                      onChange={(e) => onUpdateDocument({ location: e.target.value })}
                      placeholder="למשל: גוש 6273, חלקה 27 - כפר חב״ד"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">מספר מסמך</Label>
                    <Input
                      value={doc.number}
                      onChange={(e) => onUpdateDocument({ number: e.target.value })}
                      placeholder="יופק אוטומטית"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">תאריך</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                            <CalendarIcon className="h-3 w-3 ml-1" />
                            {doc.date ? format(new Date(doc.date), 'dd/MM/yyyy', { locale: he }) : 'בחר'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={doc.date ? new Date(doc.date) : undefined}
                            onSelect={(date) => date && onUpdateDocument({ date: format(date, 'yyyy-MM-dd') })}
                            locale={he}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {doc.type === 'quote' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">בתוקף עד</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                              <CalendarIcon className="h-3 w-3 ml-1" />
                              {doc.validUntil ? format(new Date(doc.validUntil), 'dd/MM/yyyy', { locale: he }) : 'בחר'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={doc.validUntil ? new Date(doc.validUntil) : undefined}
                              onSelect={(date) => date && onUpdateDocument({ validUntil: format(date, 'yyyy-MM-dd') })}
                              locale={he}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  {doc.type === 'contract' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">תאריך התחלה</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                              <CalendarIcon className="h-3 w-3 ml-1" />
                              {doc.startDate ? format(new Date(doc.startDate), 'dd/MM/yyyy', { locale: he }) : 'בחר'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={doc.startDate ? new Date(doc.startDate) : undefined}
                              onSelect={(date) => date && onUpdateDocument({ startDate: format(date, 'yyyy-MM-dd') })}
                              locale={he}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">תאריך סיום</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                              <CalendarIcon className="h-3 w-3 ml-1" />
                              {doc.endDate ? format(new Date(doc.endDate), 'dd/MM/yyyy', { locale: he }) : 'בחר'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={doc.endDate ? new Date(doc.endDate) : undefined}
                              onSelect={(date) => date && onUpdateDocument({ endDate: format(date, 'yyyy-MM-dd') })}
                              locale={he}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">מע"מ (%)</Label>
                      <Input
                        type="number"
                        value={doc.vatRate}
                        onChange={(e) => onUpdateDocument({ vatRate: Number(e.target.value) })}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">מטבע</Label>
                      <Select
                        value={doc.currency}
                        onValueChange={(value) => onUpdateDocument({ currency: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ILS">₪ שקל</SelectItem>
                          <SelectItem value="USD">$ דולר</SelectItem>
                          <SelectItem value="EUR">€ יורו</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Display Settings */}
              <AccordionItem value="display" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">תצוגה</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">לוגו</Label>
                      <Switch
                        checked={doc.settings.showLogo}
                        onCheckedChange={(checked) => onUpdateSettings({ showLogo: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">פרטי חברה</Label>
                      <Switch
                        checked={doc.settings.showCompanyDetails}
                        onCheckedChange={(checked) => onUpdateSettings({ showCompanyDetails: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">פרטי לקוח</Label>
                      <Switch
                        checked={doc.settings.showClientDetails}
                        onCheckedChange={(checked) => onUpdateSettings({ showClientDetails: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">מספור פריטים</Label>
                      <Switch
                        checked={doc.settings.showItemNumbers}
                        onCheckedChange={(checked) => onUpdateSettings({ showItemNumbers: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">מע"מ</Label>
                      <Switch
                        checked={doc.settings.showVat}
                        onCheckedChange={(checked) => onUpdateSettings({ showVat: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">תנאי תשלום</Label>
                      <Switch
                        checked={doc.settings.showPaymentTerms}
                        onCheckedChange={(checked) => onUpdateSettings({ showPaymentTerms: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">חתימות</Label>
                      <Switch
                        checked={doc.settings.showSignatures}
                        onCheckedChange={(checked) => onUpdateSettings({ showSignatures: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">ווטרמארק</Label>
                      <Switch
                        checked={doc.settings.showWatermark}
                        onCheckedChange={(checked) => onUpdateSettings({ showWatermark: checked })}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Style Settings */}
              <AccordionItem value="style" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="text-sm font-medium">עיצוב</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">ערכת צבעים</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                            doc.settings.primaryColor === preset.primary
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-transparent hover:border-muted-foreground/30'
                          )}
                          style={{ backgroundColor: preset.primary }}
                          onClick={() =>
                            onUpdateSettings({
                              primaryColor: preset.primary,
                              secondaryColor: preset.secondary,
                            })
                          }
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">צבע ראשי</Label>
                      <div className="flex gap-1">
                        <Input
                          type="color"
                          value={doc.settings.primaryColor}
                          onChange={(e) => onUpdateSettings({ primaryColor: e.target.value })}
                          className="w-10 h-8 p-0 border-0"
                        />
                        <Input
                          value={doc.settings.primaryColor}
                          onChange={(e) => onUpdateSettings({ primaryColor: e.target.value })}
                          className="flex-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">צבע משני</Label>
                      <div className="flex gap-1">
                        <Input
                          type="color"
                          value={doc.settings.secondaryColor}
                          onChange={(e) => onUpdateSettings({ secondaryColor: e.target.value })}
                          className="w-10 h-8 p-0 border-0"
                        />
                        <Input
                          value={doc.settings.secondaryColor}
                          onChange={(e) => onUpdateSettings({ secondaryColor: e.target.value })}
                          className="flex-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">גופן</Label>
                    <Select
                      value={doc.settings.fontFamily}
                      onValueChange={(value) => onUpdateSettings({ fontFamily: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">גודל גופן</Label>
                    <Select
                      value={doc.settings.fontSize}
                      onValueChange={(value: 'small' | 'medium' | 'large') =>
                        onUpdateSettings({ fontSize: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">קטן</SelectItem>
                        <SelectItem value="medium">בינוני</SelectItem>
                        <SelectItem value="large">גדול</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Content Panel */}
          {activePanel === 'content' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">פתיחה</Label>
                <Textarea
                  value={doc.introduction || ''}
                  onChange={(e) => onUpdateDocument({ introduction: e.target.value })}
                  placeholder="טקסט פתיחה..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">תנאים והתניות</Label>
                <Textarea
                  value={doc.terms || ''}
                  onChange={(e) => onUpdateDocument({ terms: e.target.value })}
                  placeholder="תנאים והתניות..."
                  rows={4}
                  className="text-sm"
                />
              </div>

              {doc.type === 'contract' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">סעיפים מיוחדים</Label>
                    <Textarea
                      value={doc.specialClauses || ''}
                      onChange={(e) => onUpdateDocument({ specialClauses: e.target.value })}
                      placeholder="סעיפים מיוחדים..."
                      rows={4}
                      className="text-sm"
                    />
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">הערות</Label>
                <Textarea
                  value={doc.notes || ''}
                  onChange={(e) => onUpdateDocument({ notes: e.target.value })}
                  placeholder="הערות נוספות..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">כותרת תחתונה</Label>
                <Textarea
                  value={doc.footer || ''}
                  onChange={(e) => onUpdateDocument({ footer: e.target.value })}
                  placeholder="כותרת תחתונה..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Parties Panel - placeholder */}
          {activePanel === 'parties' && (
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">ניהול צדדים למסמך</p>
              <p className="text-xs mt-1">בחר לקוחות ומזמינים</p>
            </div>
          )}

          {/* Items Panel - placeholder */}
          {activePanel === 'items' && (
            <div className="text-center text-muted-foreground py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">ניהול פריטים</p>
              <p className="text-xs mt-1">הוסף ערוך פריטים בטופס הראשי</p>
            </div>
          )}

          {/* Payments Panel - placeholder */}
          {activePanel === 'payments' && (
            <div className="text-center text-muted-foreground py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">לוח תשלומים</p>
              <p className="text-xs mt-1">הגדר שלבי תשלום</p>
            </div>
          )}

          {/* Signatures Panel - placeholder */}
          {activePanel === 'signatures' && (
            <div className="text-center text-muted-foreground py-8">
              <PenTool className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">חתימות</p>
              <p className="text-xs mt-1">ניהול חתימות דיגיטליות</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
