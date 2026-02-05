// עורך HTML ויזואלי מתקדם לתבניות הצעות מחיר
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import {
  X, Save, Download, FileCode, Mail, ChevronDown, ChevronUp, Edit, Plus, Trash2,
  GripVertical, Image, Palette, Type, CreditCard, FileText, Settings, Upload, Copy, RotateCcw,
  User, MapPin, Search, Check, Send, File, Eye, Columns, Menu,
} from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useToast } from '@/hooks/use-toast';
import { QuoteTemplate, TemplateStage, TemplateStageItem } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';

interface HtmlTemplateEditorProps {
  open: boolean;
  onClose: () => void;
  template: QuoteTemplate;
  onSave: (template: Partial<QuoteTemplate>) => Promise<void>;
}

interface PaymentStep { id: string; name: string; percentage: number; description: string; }
interface DesignSettings { primaryColor: string; secondaryColor: string; accentColor: string; fontFamily: string; fontSize: number; logoUrl: string; headerBackground: string; showLogo: boolean; borderRadius: number; companyName: string; companyAddress: string; companyPhone: string; companyEmail: string; }
interface TextBox { id: string; title: string; content: string; position: 'before-stages' | 'after-stages' | 'before-payments' | 'after-payments'; style: 'default' | 'highlight' | 'warning' | 'info'; }
interface ProjectDetails { clientId: string; clientName: string; gush: string; helka: string; migrash: string; taba: string; address: string; projectType: string; }

// Client selector component with search
function ClientSelector({ clients, selectedClient, onSelect, open, onOpenChange }: { clients: Array<{ id: string; name: string; email?: string | null; phone?: string | null; gush?: string | null; helka?: string | null; migrash?: string | null; taba?: string | null; address?: string | null }>; selectedClient: string; onSelect: (client: any) => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => clients.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.gush?.includes(search) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  ), [clients, search]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><User className="h-5 w-5 text-[#B8860B]" />בחר לקוח</DialogTitle></DialogHeader>
        <div className="relative mb-3"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="חפש לפי שם, טלפון, גוש או כתובת..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" dir="rtl" /></div>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">{filtered.length === 0 ? (<div className="text-center py-8 text-gray-400">לא נמצאו לקוחות</div>) : (filtered.map((client) => (
            <div key={client.id} className={`p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${selectedClient === client.id ? 'bg-[#DAA520]/10 border-2 border-[#DAA520]' : 'border border-gray-200'}`} onClick={() => { onSelect(client); onOpenChange(false); }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] flex items-center justify-center">
                    <span className="text-xs font-medium text-white">{client.name?.charAt(0) || '?'}</span>
                  </div>
                  <span className="font-semibold text-lg">{client.name}</span>
                </div>
                {selectedClient === client.id && <Check className="h-5 w-5 text-[#B8860B]" />}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mr-10">
                {client.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</div>}
                {client.phone && <div className="flex items-center gap-1"><span className="text-xs">📞</span>{client.phone}</div>}
                {client.address && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{client.address}</div>}
                {client.gush && <div><span className="text-gray-400">גוש:</span> {client.gush}</div>}
                {client.helka && <div><span className="text-gray-400">חלקה:</span> {client.helka}</div>}
                {client.migrash && <div><span className="text-gray-400">מגרש:</span> {client.migrash}</div>}
                {client.taba && <div><span className="text-gray-400">תב"ע:</span> {client.taba}</div>}
              </div>
            </div>
          )))}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Email dialog component
function EmailDialog({ open, onOpenChange, clients, onSend, templateName }: { open: boolean; onOpenChange: (open: boolean) => void; clients: Array<{ id: string; name: string; email?: string | null }>; onSend: (to: string, subject: string, message: string) => void; templateName: string }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState(`הצעת מחיר - ${templateName}`);
  const [message, setMessage] = useState('שלום רב,\n\nמצורפת הצעת המחיר כמבוקש.\n\nבברכה');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [search, setSearch] = useState('');
  const clientsWithEmail = useMemo(() => clients.filter(c => c.email), [clients]);
  const filtered = useMemo(() => clientsWithEmail.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())), [clientsWithEmail, search]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-[#B8860B]" />שליחת הצעת מחיר במייל</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>נמען</Label>
            <div className="flex gap-2">
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="הזן כתובת מייל או בחר מלקוחות" className="flex-1" dir="ltr" />
              <Popover open={showClientPicker} onOpenChange={setShowClientPicker}>
                <PopoverTrigger asChild><Button variant="outline" size="icon"><User className="h-4 w-4" /></Button></PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end" dir="rtl">
                  <div className="p-2 border-b"><Input placeholder="חפש לקוח..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8" dir="rtl" /></div>
                  <ScrollArea className="h-[200px]">
                    {filtered.length === 0 ? <div className="text-center py-4 text-sm text-gray-400">אין לקוחות עם מייל</div> : (
                      <div className="p-1">{filtered.map((client) => (
                        <div key={client.id} className="p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between" onClick={() => { setTo(client.email || ''); setShowClientPicker(false); }}>
                          <div><div className="font-medium text-sm">{client.name}</div><div className="text-xs text-gray-500">{client.email}</div></div>
                          <Mail className="h-3 w-3 text-gray-400" />
                        </div>
                      ))}</div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2"><Label>נושא</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} dir="rtl" /></div>
          <div className="space-y-2"><Label>תוכן ההודעה</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[120px]" dir="rtl" /></div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={() => { onSend(to, subject, message); onOpenChange(false); }} className="bg-green-600 hover:bg-green-700" disabled={!to}><Send className="h-4 w-4 ml-2" />שלח</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Project Details Editor
function ProjectDetailsEditor({ details, onUpdate, clients, onOpenClientSelector }: { details: ProjectDetails; onUpdate: (details: ProjectDetails) => void; clients: any[]; onOpenClientSelector: () => void }) {
  const fields = [
    { key: 'clientName', label: 'שם הלקוח', icon: User },
    { key: 'gush', label: 'גוש', icon: MapPin },
    { key: 'helka', label: 'חלקה', icon: MapPin },
    { key: 'migrash', label: 'מגרש', icon: MapPin },
    { key: 'taba', label: 'תב"ע', icon: FileText },
    { key: 'address', label: 'כתובת/ישוב', icon: MapPin },
    { key: 'projectType', label: 'סוג הפרויקט', icon: FileText },
  ];
  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><User className="h-6 w-6 text-[#B8860B]" />פרטי הפרויקט והלקוח</h2>
        <Button variant="outline" size="sm" onClick={onOpenClientSelector}><User className="h-4 w-4 ml-1" />בחר לקוח</Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-sm text-gray-600 flex items-center gap-1"><field.icon className="h-3 w-3" />{field.label}</Label>
            <Input value={(details as any)[field.key] || ''} onChange={(e) => onUpdate({ ...details, [field.key]: e.target.value })} placeholder={`הזן ${field.label}...`} dir="rtl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableItem({ item, onUpdate, onDelete }: { item: TemplateStageItem; onUpdate: (text: string) => void; onDelete: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);
  const handleSave = () => { onUpdate(text); setIsEditing(false); };
  if (isEditing) return (
    <div className="flex items-center gap-2 py-2 px-3 bg-yellow-50 border border-yellow-300 rounded-lg">
      <Input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} onBlur={handleSave} className="flex-1 h-8 text-sm" dir="rtl" />
      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
    </div>
  );
  return (
    <div className="flex items-center gap-2 py-2 group hover:bg-gray-50 rounded-lg px-1">
      <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
      <span className="text-[#DAA520] text-lg">✓</span>
      <span className="flex-1 text-gray-700 cursor-pointer hover:text-[#B8860B]" onClick={() => setIsEditing(true)}>{item.text}</span>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(true)}><Edit className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

function StageEditor({ stage, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast }: { stage: TemplateStage; onUpdate: (stage: TemplateStage) => void; onDelete: () => void; onDuplicate: () => void; onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [stageName, setStageName] = useState(stage.name);
  const updateItem = (itemId: string, text: string) => { onUpdate({ ...stage, items: stage.items.map(item => item.id === itemId ? { ...item, text } : item) }); };
  const deleteItem = (itemId: string) => { onUpdate({ ...stage, items: stage.items.filter(item => item.id !== itemId) }); };
  const addItem = () => { onUpdate({ ...stage, items: [...stage.items, { id: Date.now().toString(), text: 'פריט חדש' }] }); };
  const saveNameChange = () => { onUpdate({ ...stage, name: stageName }); setIsEditingName(false); };
  const stageIcons = ['📋', '🔍', '📐', '✏️', '📁', '🏗️', '🔧', '✅', '📊', '🎯'];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-gradient-to-l from-gray-50 to-white">
        <Popover>
          <PopoverTrigger asChild><button className="text-xl hover:scale-110 transition-transform cursor-pointer">{stage.icon || '📋'}</button></PopoverTrigger>
          <PopoverContent className="w-auto p-2" dir="rtl"><div className="grid grid-cols-5 gap-1">{stageIcons.map((icon) => (<button key={icon} className="p-2 hover:bg-gray-100 rounded text-xl" onClick={() => onUpdate({ ...stage, icon })}>{icon}</button>))}</div></PopoverContent>
        </Popover>
        {isEditingName ? <Input value={stageName} onChange={(e) => setStageName(e.target.value)} onBlur={saveNameChange} onKeyDown={(e) => e.key === 'Enter' && saveNameChange()} className="flex-1 h-8 font-semibold" dir="rtl" /> : <h3 className="flex-1 font-semibold text-gray-800 hover:text-[#B8860B] cursor-pointer" onClick={() => setIsEditingName(true)}>{stage.name}</h3>}
        <Badge variant="outline" className="text-[#B8860B] border-[#DAA520]">{stage.items.length} פריטים</Badge>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onMoveUp} disabled={isFirst}><ChevronUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onMoveDown} disabled={isLast}><ChevronDown className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDuplicate}><Copy className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsExpanded(!isExpanded)}><ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></Button>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="p-4 space-y-1">{stage.items.map((item) => (<EditableItem key={item.id} item={item} onUpdate={(text) => updateItem(item.id, text)} onDelete={() => deleteItem(item.id)} />))}</div>
          <div className="px-4 pb-4"><Button variant="ghost" size="sm" className="text-[#B8860B] hover:bg-[#DAA520]/10 w-full justify-center" onClick={addItem}><Plus className="h-4 w-4 ml-1" />הוסף פריט</Button></div>
        </div>
      )}
    </div>
  );
}

function PaymentStepEditor({ step, onUpdate, onDelete }: { step: PaymentStep; onUpdate: (step: PaymentStep) => void; onDelete: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#DAA520]/10 text-[#B8860B] font-bold">{step.percentage}%</div>
        <div className="flex-1"><Input value={step.name} onChange={(e) => onUpdate({ ...step, name: e.target.value })} className="font-medium border-0 p-0 h-auto focus-visible:ring-0" placeholder="שם שלב התשלום" dir="rtl" /></div>
        <div className="flex items-center gap-2">
          <Input type="number" value={step.percentage} onChange={(e) => onUpdate({ ...step, percentage: parseInt(e.target.value) || 0 })} className="w-16 text-center" min={0} max={100} />
          <span className="text-gray-500">%</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsExpanded(!isExpanded)}><ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      {isExpanded && <div className="mt-3 pt-3 border-t"><Textarea value={step.description} onChange={(e) => onUpdate({ ...step, description: e.target.value })} placeholder="תיאור שלב התשלום..." className="min-h-[60px]" dir="rtl" /></div>}
    </div>
  );
}

function TextBoxEditor({ textBox, onUpdate, onDelete }: { textBox: TextBox; onUpdate: (textBox: TextBox) => void; onDelete: () => void }) {
  const styleColors: Record<string, string> = { default: 'bg-white border-gray-200', highlight: 'bg-yellow-50 border-yellow-300', warning: 'bg-red-50 border-red-300', info: 'bg-blue-50 border-blue-300' };
  return (
    <div className={`rounded-lg border-2 p-4 ${styleColors[textBox.style]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Input value={textBox.title} onChange={(e) => onUpdate({ ...textBox, title: e.target.value })} className="font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent" placeholder="כותרת הקטע" dir="rtl" />
        <Select value={textBox.style} onValueChange={(v) => onUpdate({ ...textBox, style: v as TextBox['style'] })}><SelectTrigger className="w-28 h-7"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="default">רגיל</SelectItem><SelectItem value="highlight">מודגש</SelectItem><SelectItem value="warning">אזהרה</SelectItem><SelectItem value="info">מידע</SelectItem></SelectContent></Select>
        <Select value={textBox.position} onValueChange={(v) => onUpdate({ ...textBox, position: v as TextBox['position'] })}><SelectTrigger className="w-36 h-7"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="before-stages">לפני השלבים</SelectItem><SelectItem value="after-stages">אחרי השלבים</SelectItem><SelectItem value="before-payments">לפני תשלומים</SelectItem><SelectItem value="after-payments">אחרי תשלומים</SelectItem></SelectContent></Select>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
      <Textarea value={textBox.content} onChange={(e) => onUpdate({ ...textBox, content: e.target.value })} placeholder="תוכן הקטע..." className="min-h-[80px] bg-transparent border-0 focus-visible:ring-0 p-0" dir="rtl" />
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  const presetColors = ['#B8860B', '#DAA520', '#F4C430', '#FFD700', '#1e40af', '#3b82f6', '#06b6d4', '#14b8a6', '#16a34a', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6b7280', '#374151', '#1f2937', '#000000'];
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Popover><PopoverTrigger asChild><button className="w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm" style={{ backgroundColor: value }} /></PopoverTrigger><PopoverContent className="w-auto p-3"><div className="grid grid-cols-5 gap-2">{presetColors.map((color) => (<button key={color} className="w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform" style={{ backgroundColor: color, borderColor: value === color ? '#000' : 'transparent' }} onClick={() => onChange(color)} />))}</div><div className="mt-3 pt-3 border-t"><Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-10 cursor-pointer" /></div></PopoverContent></Popover>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 font-mono text-sm" placeholder="#000000" />
      </div>
    </div>
  );
}

export function HtmlTemplateEditor({ open, onClose, template, onSave }: HtmlTemplateEditorProps) {
  const { toast } = useToast();
  const { clients } = useClients();
  const [editedTemplate, setEditedTemplate] = useState<QuoteTemplate>(template);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('מתקדם');
  const [activeTab, setActiveTab] = useState('project');
  const [paymentSteps, setPaymentSteps] = useState<PaymentStep[]>([{ id: '1', name: 'מקדמה בחתימה', percentage: 30, description: '' }, { id: '2', name: 'הגשה לרישוי', percentage: 25, description: '' }, { id: '3', name: 'אישור תב"ע', percentage: 25, description: '' }, { id: '4', name: 'היתר בנייה', percentage: 20, description: '' }]);
  const [designSettings, setDesignSettings] = useState<DesignSettings>({ primaryColor: '#B8860B', secondaryColor: '#DAA520', accentColor: '#F4C430', fontFamily: 'Heebo', fontSize: 16, logoUrl: '', headerBackground: 'linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #F4C430 100%)', showLogo: true, borderRadius: 12, companyName: 'שם החברה', companyAddress: 'כתובת החברה', companyPhone: '050-0000000', companyEmail: 'email@company.com' });
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [upgrades, setUpgrades] = useState([{ id: '1', name: 'יחידת דיור נוספת', price: 5000, enabled: true }, { id: '2', name: 'מרתף/חניה תת קרקעית', price: 6000, enabled: true }]);
  const [pricingTiers, setPricingTiers] = useState([{ id: '1', name: 'בסיסי', price: 30000 }, { id: '2', name: 'מתקדם', price: 35000 }, { id: '3', name: 'פרימיום', price: 48000 }]);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({ clientId: '', clientName: '', gush: '', helka: '', migrash: '', taba: '', address: '', projectType: '' });
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Extended clients data
  const [extendedClients, setExtendedClients] = useState<any[]>([]);
  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, name, email, phone, gush, helka, migrash, taba, address').order('name');
      if (data) setExtendedClients(data);
    };
    fetchClients();
  }, []);

  useEffect(() => { setEditedTemplate(template); }, [template]);

  const handleClientSelect = (client: any) => {
    setProjectDetails({
      clientId: client.id,
      clientName: client.name || '',
      gush: client.gush || '',
      helka: client.helka || '',
      migrash: client.migrash || '',
      taba: client.taba || '',
      address: client.address || '',
      projectType: projectDetails.projectType
    });
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave({ ...editedTemplate, payment_schedule: paymentSteps.map(s => ({ id: s.id, percentage: s.percentage, description: s.description || s.name })), design_settings: designSettings as any });
      toast({ title: 'נשמר בהצלחה', description: 'התבנית עודכנה' });
    } catch { toast({ title: 'שגיאה', description: 'לא ניתן לשמור', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  }, [editedTemplate, paymentSteps, designSettings, onSave, toast]);

  const generateHtmlContent = useCallback(() => {
    const stages = editedTemplate.stages.map(stage => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: ${designSettings.borderRadius}px;">
        <h3 style="color: ${designSettings.primaryColor}; font-family: ${designSettings.fontFamily};">${stage.icon || '📋'} ${stage.name}</h3>
        <ul style="list-style: none; padding: 0;">
          ${stage.items.map(item => `<li style="padding: 5px 0; color: #333;">✓ ${item.text}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const payments = paymentSteps.map(step => `
      <tr><td style="padding: 10px; border-bottom: 1px solid #eee;">${step.name}</td><td style="padding: 10px; text-align: center;">${step.percentage}%</td><td style="padding: 10px; text-align: left;">₪${Math.round((editedTemplate.base_price || 35000) * step.percentage / 100).toLocaleString()}</td></tr>
    `).join('');

    return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <title>${editedTemplate.name}</title>
  <style>
    body { font-family: '${designSettings.fontFamily}', sans-serif; font-size: ${designSettings.fontSize}px; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
    .header { background: ${designSettings.headerBackground}; color: white; padding: 40px; text-align: center; }
    .content { padding: 40px; }
    .project-details { background: #f9f9f9; padding: 20px; border-radius: ${designSettings.borderRadius}px; margin-bottom: 30px; }
    .project-details h2 { color: ${designSettings.primaryColor}; margin-top: 0; }
    .project-details table { width: 100%; }
    .project-details td { padding: 8px 0; }
    .project-details td:first-child { font-weight: 600; width: 120px; }
    table.payments { width: 100%; border-collapse: collapse; margin-top: 20px; }
    table.payments th { background: ${designSettings.primaryColor}; color: white; padding: 12px; text-align: right; }
    .footer { text-align: center; padding: 30px; background: #f9f9f9; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${designSettings.showLogo && designSettings.logoUrl ? `<img src="${designSettings.logoUrl}" alt="Logo" style="max-height: 80px; margin-bottom: 15px;">` : ''}
      <h1 style="margin: 0; font-size: 32px;">${editedTemplate.name}</h1>
      <p style="opacity: 0.9; margin: 10px 0 0;">${editedTemplate.description || ''}</p>
    </div>
    <div class="content">
      ${projectDetails.clientName ? `
      <div class="project-details">
        <h2>פרטי הפרויקט</h2>
        <table>
          ${projectDetails.clientName ? `<tr><td>לקוח:</td><td>${projectDetails.clientName}</td></tr>` : ''}
          ${projectDetails.address ? `<tr><td>כתובת:</td><td>${projectDetails.address}</td></tr>` : ''}
          ${projectDetails.gush ? `<tr><td>גוש:</td><td>${projectDetails.gush}</td></tr>` : ''}
          ${projectDetails.helka ? `<tr><td>חלקה:</td><td>${projectDetails.helka}</td></tr>` : ''}
          ${projectDetails.migrash ? `<tr><td>מגרש:</td><td>${projectDetails.migrash}</td></tr>` : ''}
          ${projectDetails.taba ? `<tr><td>תב"ע:</td><td>${projectDetails.taba}</td></tr>` : ''}
          ${projectDetails.projectType ? `<tr><td>סוג פרויקט:</td><td>${projectDetails.projectType}</td></tr>` : ''}
        </table>
      </div>` : ''}
      
      <h2 style="color: ${designSettings.primaryColor};">שלבי העבודה</h2>
      ${stages}
      
      <h2 style="color: ${designSettings.primaryColor}; margin-top: 40px;">סדר תשלומים</h2>
      <table class="payments">
        <thead><tr><th>שלב</th><th>אחוז</th><th>סכום</th></tr></thead>
        <tbody>${payments}</tbody>
        <tfoot><tr style="font-weight: bold; background: #f0f0f0;"><td style="padding: 12px;">סה"כ</td><td style="padding: 12px; text-align: center;">100%</td><td style="padding: 12px; text-align: left;">₪${(editedTemplate.base_price || 35000).toLocaleString()}</td></tr></tfoot>
      </table>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">* המחירים אינם כוללים מע"מ. תוקף ההצעה: ${editedTemplate.validity_days || 30} יום.</p>
    </div>
    <div class="footer">
      <strong>${designSettings.companyName}</strong><br>
      ${designSettings.companyAddress} | ${designSettings.companyPhone} | ${designSettings.companyEmail}
    </div>
  </div>
</body>
</html>`;
  }, [editedTemplate, designSettings, paymentSteps, projectDetails]);

  const handleExportWord = () => {
    const html = generateHtmlContent();
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editedTemplate.name || 'הצעת-מחיר'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'הקובץ הורד', description: 'קובץ Word נוצר בהצלחה' });
  };

  const handleExportPdf = () => {
    const html = generateHtmlContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
    }
    toast({ title: 'מייצא PDF', description: 'חלון הדפסה נפתח' });
  };

  const handleExportHtml = () => {
    const html = generateHtmlContent();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editedTemplate.name || 'הצעת-מחיר'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'יוצא HTML', description: 'הקובץ הורד' });
  };

  const handleSendEmail = async (to: string, subject: string, message: string) => {
    try {
      // Try to send via Supabase edge function
      const html = generateHtmlContent();
      const { error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html: `<div dir="rtl">${message.replace(/\n/g, '<br>')}</div><hr><br>${html}` }
      });
      if (error) throw error;
      toast({ title: 'נשלח בהצלחה', description: `הצעת המחיר נשלחה ל-${to}` });
    } catch (err) {
      // Fallback to mailto
      const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.open(mailtoUrl, '_blank');
      toast({ title: 'פתיחת אפליקציית מייל', description: 'המייל מוכן לשליחה' });
    }
  };

  const updateStage = (stageId: string, updatedStage: TemplateStage) => setEditedTemplate({ ...editedTemplate, stages: editedTemplate.stages.map(stage => stage.id === stageId ? updatedStage : stage) });
  const deleteStage = (stageId: string) => setEditedTemplate({ ...editedTemplate, stages: editedTemplate.stages.filter(stage => stage.id !== stageId) });
  const duplicateStage = (stageId: string) => { const idx = editedTemplate.stages.findIndex(s => s.id === stageId); if (idx === -1) return; const orig = editedTemplate.stages[idx]; const dup = { ...orig, id: Date.now().toString(), name: `${orig.name} (העתק)`, items: orig.items.map(item => ({ ...item, id: Date.now().toString() + Math.random() })) }; const newStages = [...editedTemplate.stages]; newStages.splice(idx + 1, 0, dup); setEditedTemplate({ ...editedTemplate, stages: newStages }); };
  const moveStage = (stageId: string, dir: 'up' | 'down') => { const idx = editedTemplate.stages.findIndex(s => s.id === stageId); if (idx === -1) return; const newIdx = dir === 'up' ? idx - 1 : idx + 1; if (newIdx < 0 || newIdx >= editedTemplate.stages.length) return; const ns = [...editedTemplate.stages]; [ns[idx], ns[newIdx]] = [ns[newIdx], ns[idx]]; setEditedTemplate({ ...editedTemplate, stages: ns }); };
  const addStage = () => setEditedTemplate({ ...editedTemplate, stages: [...editedTemplate.stages, { id: Date.now().toString(), name: 'שלב חדש', icon: '📋', items: [] }] });
  const addPaymentStep = () => setPaymentSteps([...paymentSteps, { id: Date.now().toString(), name: 'שלב תשלום חדש', percentage: 0, description: '' }]);
  const addTextBox = () => setTextBoxes([...textBoxes, { id: Date.now().toString(), title: 'כותרת חדשה', content: '', position: 'after-stages', style: 'default' }]);
  const addUpgrade = () => setUpgrades([...upgrades, { id: Date.now().toString(), name: 'שידורג חדש', price: 0, enabled: true }]);
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setDesignSettings({ ...designSettings, logoUrl: reader.result as string }); reader.readAsDataURL(file); } };

  const totalPaymentPercentage = paymentSteps.reduce((sum, s) => sum + s.percentage, 0);
  const basePrice = editedTemplate.base_price || 35000;
  const fontOptions = [{ value: 'Heebo', label: 'Heebo' }, { value: 'Assistant', label: 'Assistant' }, { value: 'Rubik', label: 'Rubik' }, { value: 'Varela Round', label: 'Varela Round' }];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" hideClose dir="rtl" className="flex flex-col gap-0 overflow-hidden border-0 p-0" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', maxWidth: 'none', zIndex: 300 }}>
        {/* Client Selector Dialog */}
        <ClientSelector clients={extendedClients} selectedClient={projectDetails.clientId} onSelect={handleClientSelect} open={showClientSelector} onOpenChange={setShowClientSelector} />
        
        {/* Email Dialog */}
        <EmailDialog open={showEmailDialog} onOpenChange={setShowEmailDialog} clients={extendedClients} onSend={handleSendEmail} templateName={editedTemplate.name} />

        {/* Gold Header */}
        <div className="shrink-0 text-white p-6" style={{ background: designSettings.headerBackground }}>
          <div className="flex justify-between items-start max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              {designSettings.showLogo && (<div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>{designSettings.logoUrl ? <img src={designSettings.logoUrl} alt="Logo" className="h-16 w-auto object-contain" /> : <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center"><Image className="h-8 w-8 text-white/60" /></div>}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"><Upload className="h-6 w-6" /></div></div>)}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <div className="flex-1">
                <Input value={editedTemplate.name} onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })} className="text-2xl font-bold bg-transparent border-0 text-white placeholder:text-white/60 p-0 h-auto focus-visible:ring-0" placeholder="כותרת ההצעה" dir="rtl" />
                <Input value={editedTemplate.description || ''} onChange={(e) => setEditedTemplate({ ...editedTemplate, description: e.target.value })} className="text-sm opacity-90 bg-transparent border-0 text-white placeholder:text-white/60 p-0 h-auto focus-visible:ring-0 mt-1" placeholder="תיאור ההצעה" dir="rtl" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-left"><div className="flex items-baseline gap-2"><span className="text-base opacity-80">₪</span><Input type="number" value={editedTemplate.base_price || 35000} onChange={(e) => setEditedTemplate({ ...editedTemplate, base_price: parseInt(e.target.value) || 0 })} className="text-3xl font-bold bg-transparent border-0 text-white p-0 h-auto focus-visible:ring-0 w-32 text-left" /><span className="text-base opacity-80">+ מע״מ</span></div></div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20"><X className="h-6 w-6" /></Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b bg-white px-6">
            <TabsList className="h-12 bg-transparent gap-2">
              <TabsTrigger value="project" className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"><User className="h-4 w-4 ml-2" />פרטי פרויקט</TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"><FileText className="h-4 w-4 ml-2" />תוכן</TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"><CreditCard className="h-4 w-4 ml-2" />תשלומים</TabsTrigger>
              <TabsTrigger value="design" className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"><Palette className="h-4 w-4 ml-2" />עיצוב</TabsTrigger>
              <TabsTrigger value="text-boxes" className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"><Type className="h-4 w-4 ml-2" />תיבות טקסט</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"><Settings className="h-4 w-4 ml-2" />הגדרות</TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"><Eye className="h-4 w-4 ml-2" />תצוגה מקדימה</TabsTrigger>
              <TabsTrigger value="split" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"><Columns className="h-4 w-4 ml-2" />עריכה + תצוגה</TabsTrigger>
            </TabsList>
          </div>

          {/* Project Details Tab */}
          <TabsContent value="project" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <ProjectDetailsEditor details={projectDetails} onUpdate={setProjectDetails} clients={extendedClients} onOpenClientSelector={() => setShowClientSelector(true)} />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">💡 טיפ</h3>
                  <p className="text-sm text-blue-700">לחץ על "בחר לקוח" כדי למלא את הפרטים אוטומטית מנתוני הלקוח במערכת. תוכל גם להזין את הפרטים ידנית.</p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* סיכום הצעה */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="text-2xl">📊</span>סיכום הצעה</h2>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-gray-600">בחר חבילה:</label><Button size="sm" variant="outline" onClick={() => setPricingTiers([...pricingTiers, { id: Date.now().toString(), name: 'חבילה חדשה', price: 0 }])}><Plus className="h-3 w-3 ml-1" />הוסף חבילה</Button></div>
                    <div className="grid grid-cols-3 gap-3">{pricingTiers.map((tier) => (
                      <div key={tier.id} className={`p-4 rounded-lg border-2 transition-all relative group cursor-pointer ${selectedTier === tier.name ? 'border-[#DAA520] bg-[#DAA520]/5' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setSelectedTier(tier.name)}>
                        <Button size="icon" variant="ghost" className="absolute top-1 left-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500" onClick={(e) => { e.stopPropagation(); setPricingTiers(pricingTiers.filter(t => t.id !== tier.id)); }}><Trash2 className="h-3 w-3" /></Button>
                        <Input value={tier.name} onChange={(e) => setPricingTiers(pricingTiers.map(t => t.id === tier.id ? { ...t, name: e.target.value } : t))} className="font-semibold border-0 p-0 h-auto text-center focus-visible:ring-0 bg-transparent" onClick={(e) => e.stopPropagation()} dir="rtl" />
                        <div className="flex items-center justify-center gap-1 mt-1"><span className="text-[#B8860B]">₪</span><Input type="number" value={tier.price} onChange={(e) => setPricingTiers(pricingTiers.map(t => t.id === tier.id ? { ...t, price: parseInt(e.target.value) || 0 } : t))} className="font-bold text-lg text-[#B8860B] border-0 p-0 h-auto text-center focus-visible:ring-0 bg-transparent w-24" onClick={(e) => e.stopPropagation()} /></div>
                      </div>
                    ))}</div>
                  </div>
                  {/* Upgrades */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-gray-600">שידורגים אופציונליים:</label><Button size="sm" variant="outline" onClick={addUpgrade}><Plus className="h-3 w-3 ml-1" />הוסף שידורג</Button></div>
                    <div className="space-y-2">{upgrades.map((upgrade) => (
                      <div key={upgrade.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 group">
                        <input type="checkbox" checked={upgrade.enabled} onChange={(e) => setUpgrades(upgrades.map(u => u.id === upgrade.id ? { ...u, enabled: e.target.checked } : u))} className="rounded border-gray-300 text-[#DAA520]" />
                        <Input value={upgrade.name} onChange={(e) => setUpgrades(upgrades.map(u => u.id === upgrade.id ? { ...u, name: e.target.value } : u))} className="flex-1 border-0 p-0 h-auto focus-visible:ring-0" dir="rtl" />
                        <div className="flex items-center gap-1"><span className="text-[#B8860B]">₪</span><Input type="number" value={upgrade.price} onChange={(e) => setUpgrades(upgrades.map(u => u.id === upgrade.id ? { ...u, price: parseInt(e.target.value) || 0 } : u))} className="w-20 text-[#B8860B] font-semibold border-0 p-0 h-auto focus-visible:ring-0" /></div>
                        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500" onClick={() => setUpgrades(upgrades.filter(u => u.id !== upgrade.id))}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}</div>
                  </div>
                </div>
                {/* Text boxes before stages */}
                {textBoxes.filter(tb => tb.position === 'before-stages').map(tb => (<TextBoxEditor key={tb.id} textBox={tb} onUpdate={(updated) => setTextBoxes(textBoxes.map(t => t.id === tb.id ? updated : t))} onDelete={() => setTextBoxes(textBoxes.filter(t => t.id !== tb.id))} />))}
                {/* Stages */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h2 className="text-xl font-bold">שלבי העבודה</h2><Button variant="outline" size="sm" className="border-[#DAA520] text-[#B8860B]" onClick={addStage}><Plus className="h-4 w-4 ml-1" />הוסף שלב</Button></div>
                  {editedTemplate.stages.map((stage, index) => (<StageEditor key={stage.id} stage={stage} onUpdate={(updated) => updateStage(stage.id, updated)} onDelete={() => deleteStage(stage.id)} onDuplicate={() => duplicateStage(stage.id)} onMoveUp={() => moveStage(stage.id, 'up')} onMoveDown={() => moveStage(stage.id, 'down')} isFirst={index === 0} isLast={index === editedTemplate.stages.length - 1} />))}
                </div>
                {/* Text boxes after stages */}
                {textBoxes.filter(tb => tb.position === 'after-stages').map(tb => (<TextBoxEditor key={tb.id} textBox={tb} onUpdate={(updated) => setTextBoxes(textBoxes.map(t => t.id === tb.id ? updated : t))} onDelete={() => setTextBoxes(textBoxes.filter(t => t.id !== tb.id))} />))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6 text-[#B8860B]" />סדר תשלומים</h2>
                    <div className="flex items-center gap-4"><Badge variant={totalPaymentPercentage === 100 ? 'default' : 'destructive'} className={totalPaymentPercentage === 100 ? 'bg-green-500' : ''}>סה"כ: {totalPaymentPercentage}%</Badge><Button variant="outline" size="sm" onClick={addPaymentStep}><Plus className="h-4 w-4 ml-1" />הוסף שלב</Button></div>
                  </div>
                  {totalPaymentPercentage !== 100 && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">⚠️ סכום האחוזים צריך להיות 100%. כרגע: {totalPaymentPercentage}%</div>}
                  <div className="space-y-3">{paymentSteps.map((step) => (<PaymentStepEditor key={step.id} step={step} onUpdate={(updated) => setPaymentSteps(paymentSteps.map(s => s.id === step.id ? updated : s))} onDelete={() => setPaymentSteps(paymentSteps.filter(s => s.id !== step.id))} />))}</div>
                  {/* Summary */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">סיכום תשלומים</h3>
                      <div className="space-y-2 text-sm">{paymentSteps.map((step) => (<div key={step.id} className="flex justify-between"><span>{step.name} ({step.percentage}%)</span><span className="font-semibold">₪{Math.round(basePrice * step.percentage / 100).toLocaleString()}</span></div>))}<div className="flex justify-between pt-2 border-t font-bold text-lg"><span>סה"כ</span><span>₪{basePrice.toLocaleString()}</span></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Logo */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Image className="h-6 w-6 text-[#B8860B]" />לוגו</h2>
                  <div className="flex items-start gap-6">
                    <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#DAA520] transition-colors" onClick={() => logoInputRef.current?.click()}>{designSettings.logoUrl ? <img src={designSettings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" /> : <div className="text-center text-gray-400"><Upload className="h-8 w-8 mx-auto mb-2" /><span className="text-xs">העלה לוגו</span></div>}</div>
                    <div className="flex-1 space-y-4"><div className="flex items-center gap-3"><Switch checked={designSettings.showLogo} onCheckedChange={(checked) => setDesignSettings({ ...designSettings, showLogo: checked })} /><Label>הצג לוגו בהצעה</Label></div>{designSettings.logoUrl && <Button variant="outline" size="sm" onClick={() => setDesignSettings({ ...designSettings, logoUrl: '' })}><Trash2 className="h-4 w-4 ml-1" />הסר לוגו</Button>}</div>
                  </div>
                </div>
                {/* Colors */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Palette className="h-6 w-6 text-[#B8860B]" />צבעים</h2>
                  <div className="grid grid-cols-2 gap-6"><ColorPicker label="צבע ראשי" value={designSettings.primaryColor} onChange={(color) => setDesignSettings({ ...designSettings, primaryColor: color })} /><ColorPicker label="צבע משני" value={designSettings.secondaryColor} onChange={(color) => setDesignSettings({ ...designSettings, secondaryColor: color })} /><ColorPicker label="צבע הדגשה" value={designSettings.accentColor} onChange={(color) => setDesignSettings({ ...designSettings, accentColor: color })} /></div>
                  <div className="mt-6 pt-4 border-t"><Label className="mb-2 block">רקע הכותרת</Label><div className="grid grid-cols-4 gap-2">{['linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #F4C430 100%)', 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', '#B8860B', '#1e40af', '#16a34a', '#374151'].map((bg, i) => (<button key={i} className={`h-12 rounded-lg border-2 transition-all ${designSettings.headerBackground === bg ? 'border-black scale-105' : 'border-transparent'}`} style={{ background: bg }} onClick={() => setDesignSettings({ ...designSettings, headerBackground: bg })} />))}</div></div>
                </div>
                {/* Typography */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Type className="h-6 w-6 text-[#B8860B]" />טיפוגרפיה</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>גופן</Label><Select value={designSettings.fontFamily} onValueChange={(v) => setDesignSettings({ ...designSettings, fontFamily: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fontOptions.map(font => (<SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.label}</SelectItem>))}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>גודל גופן בסיסי: {designSettings.fontSize}px</Label><Slider value={[designSettings.fontSize]} onValueChange={([v]) => setDesignSettings({ ...designSettings, fontSize: v })} min={12} max={20} step={1} /></div>
                  </div>
                  <div className="mt-4 space-y-2"><Label>עיגול פינות: {designSettings.borderRadius}px</Label><Slider value={[designSettings.borderRadius]} onValueChange={([v]) => setDesignSettings({ ...designSettings, borderRadius: v })} min={0} max={24} step={2} /></div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Text Boxes Tab */}
          <TabsContent value="text-boxes" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between"><h2 className="text-xl font-bold">תיבות טקסט מותאמות</h2><Button onClick={addTextBox} className="bg-[#DAA520] hover:bg-[#B8860B]"><Plus className="h-4 w-4 ml-2" />הוסף תיבת טקסט</Button></div>
                {textBoxes.length === 0 ? (<div className="bg-white rounded-xl border-2 border-dashed p-12 text-center text-gray-400"><Type className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>אין תיבות טקסט</p><p className="text-sm">הוסף תיבות טקסט כדי להוסיף תוכן מותאם להצעה</p></div>) : (<div className="space-y-4">{textBoxes.map(tb => (<TextBoxEditor key={tb.id} textBox={tb} onUpdate={(updated) => setTextBoxes(textBoxes.map(t => t.id === tb.id ? updated : t))} onDelete={() => setTextBoxes(textBoxes.filter(t => t.id !== tb.id))} />))}</div>)}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings className="h-6 w-6 text-[#B8860B]" />פרטי החברה</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>שם החברה</Label><Input value={designSettings.companyName} onChange={(e) => setDesignSettings({ ...designSettings, companyName: e.target.value })} dir="rtl" /></div>
                    <div className="space-y-2"><Label>טלפון</Label><Input value={designSettings.companyPhone} onChange={(e) => setDesignSettings({ ...designSettings, companyPhone: e.target.value })} dir="ltr" /></div>
                    <div className="space-y-2"><Label>כתובת</Label><Input value={designSettings.companyAddress} onChange={(e) => setDesignSettings({ ...designSettings, companyAddress: e.target.value })} dir="rtl" /></div>
                    <div className="space-y-2"><Label>אימייל</Label><Input value={designSettings.companyEmail} onChange={(e) => setDesignSettings({ ...designSettings, companyEmail: e.target.value })} dir="ltr" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">הגדרות הצעה</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>תוקף הצעת מחיר (ימים)</Label><Input type="number" value={editedTemplate.validity_days || 30} onChange={(e) => setEditedTemplate({ ...editedTemplate, validity_days: parseInt(e.target.value) || 30 })} min={1} max={365} /></div>
                    <div className="space-y-2"><Label>אחוז מע"מ</Label><Input type="number" value={editedTemplate.vat_rate || 17} onChange={(e) => setEditedTemplate({ ...editedTemplate, vat_rate: parseInt(e.target.value) || 17 })} min={0} max={50} /></div>
                  </div>
                </div>
                <div className="flex justify-center"><Button variant="outline" className="text-gray-500"><RotateCcw className="h-4 w-4 ml-2" />איפוס להגדרות ברירת מחדל</Button></div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Preview Tab - Full Preview */}
          <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
            <div className="h-full bg-gray-100 p-4">
              <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
                <iframe
                  srcDoc={generateHtmlContent()}
                  title="תצוגה מקדימה"
                  className="w-full h-full border-0"
                  style={{ minHeight: '100%' }}
                />
              </div>
            </div>
          </TabsContent>

          {/* Split View Tab - Editor + Live Preview */}
          <TabsContent value="split" className="flex-1 m-0 overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Editor Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <ScrollArea className="h-full bg-gray-50">
                  <div className="p-6 space-y-6">
                    {/* Quick Project Details */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                      <h3 className="font-semibold mb-3 flex items-center gap-2"><User className="h-4 w-4 text-[#B8860B]" />פרטי פרויקט מהירים</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Input value={projectDetails.clientName} onChange={(e) => setProjectDetails({ ...projectDetails, clientName: e.target.value })} placeholder="שם הלקוח" dir="rtl" />
                        <Input value={projectDetails.address} onChange={(e) => setProjectDetails({ ...projectDetails, address: e.target.value })} placeholder="כתובת" dir="rtl" />
                        <Input value={projectDetails.gush} onChange={(e) => setProjectDetails({ ...projectDetails, gush: e.target.value })} placeholder="גוש" dir="rtl" />
                        <Input value={projectDetails.helka} onChange={(e) => setProjectDetails({ ...projectDetails, helka: e.target.value })} placeholder="חלקה" dir="rtl" />
                      </div>
                    </div>
                    
                    {/* Stages Quick Edit */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-[#B8860B]" />שלבי העבודה</h3>
                        <Button variant="outline" size="sm" onClick={addStage}><Plus className="h-3 w-3 ml-1" />הוסף</Button>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {editedTemplate.stages.map((stage, index) => (
                          <div key={stage.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-lg">{stage.icon || '📋'}</span>
                            <Input 
                              value={stage.name} 
                              onChange={(e) => updateStage(stage.id, { ...stage, name: e.target.value })} 
                              className="flex-1 h-8 text-sm"
                              dir="rtl"
                            />
                            <Badge variant="outline" className="text-xs">{stage.items.length}</Badge>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => deleteStage(stage.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payments Quick Edit */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-[#B8860B]" />תשלומים</h3>
                        <Badge variant={totalPaymentPercentage === 100 ? 'default' : 'destructive'} className={totalPaymentPercentage === 100 ? 'bg-green-500 text-xs' : 'text-xs'}>{totalPaymentPercentage}%</Badge>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {paymentSteps.map((step) => (
                          <div key={step.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <Input value={step.name} onChange={(e) => setPaymentSteps(paymentSteps.map(s => s.id === step.id ? { ...s, name: e.target.value } : s))} className="flex-1 h-8 text-sm" dir="rtl" />
                            <div className="flex items-center gap-1">
                              <Input type="number" value={step.percentage} onChange={(e) => setPaymentSteps(paymentSteps.map(s => s.id === step.id ? { ...s, percentage: parseInt(e.target.value) || 0 } : s))} className="w-14 h-8 text-sm text-center" />
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => setPaymentSteps(paymentSteps.filter(s => s.id !== step.id))}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" className="w-full mt-2 text-[#B8860B]" onClick={addPaymentStep}><Plus className="h-3 w-3 ml-1" />הוסף שלב תשלום</Button>
                    </div>

                    {/* Price Edit */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                      <h3 className="font-semibold mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-[#B8860B]" />מחיר</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[#B8860B]">₪</span>
                        <Input type="number" value={editedTemplate.base_price || 35000} onChange={(e) => setEditedTemplate({ ...editedTemplate, base_price: parseInt(e.target.value) || 0 })} className="text-xl font-bold text-[#B8860B]" />
                        <span className="text-gray-500 text-sm">+ מע"מ</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Preview Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full bg-gray-100 p-4">
                  <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
                    <iframe
                      srcDoc={generateHtmlContent()}
                      title="תצוגה מקדימה חיה"
                      className="w-full h-full border-0"
                      style={{ minHeight: '100%' }}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="shrink-0 border-t bg-white p-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="text-sm text-gray-500">תוקף הצעת המחיר: {editedTemplate.validity_days || 30} יום</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>סגור</Button>
              <Button variant="outline" onClick={handleExportHtml}><FileCode className="h-4 w-4 ml-2" />הורד HTML</Button>
              <Button variant="outline" onClick={handleExportPdf}><Download className="h-4 w-4 ml-2" />הורד PDF</Button>
              <Button variant="outline" onClick={handleExportWord}><File className="h-4 w-4 ml-2" />הורד Word</Button>
              <Button className="bg-[#DAA520] hover:bg-[#B8860B] text-white" onClick={handleSave} disabled={isSaving}>{isSaving ? <span className="animate-spin">⏳</span> : <Save className="h-4 w-4 ml-2" />}שמור</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowEmailDialog(true)}><Mail className="h-4 w-4 ml-2" />שלח במייל</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default HtmlTemplateEditor;
