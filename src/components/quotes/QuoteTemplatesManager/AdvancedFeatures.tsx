// תכונות מתקדמות לעורך הצעות מחיר
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Palette,
  PenTool,
  QrCode,
  FileText,
  Clock,
  Eye,
  History,
  Calculator,
  CreditCard,
  Layers,
  MessageSquare,
  Calendar,
  Check,
  X,
  Send,
  Smartphone,
  Link,
  Copy,
  Download,
  Trash2,
  RotateCcw,
  DollarSign,
  ArrowRight,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Pencil,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ============================================
// 1. Design Templates - תבניות עיצוב מוכנות
// ============================================

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  settings: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    fontSize: number;
    headerBackground: string;
    borderRadius: number;
    headerStyle: 'gradient' | 'solid' | 'pattern';
    tableStyle: 'striped' | 'bordered' | 'minimal';
    accentPosition: 'top' | 'side' | 'both';
  };
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: 'professional-blue',
    name: 'כחול מקצועי',
    description: 'עיצוב נקי ומקצועי לעסקים',
    thumbnail: '🔵',
    settings: {
      primaryColor: '#1e40af',
      secondaryColor: '#3b82f6',
      accentColor: '#60a5fa',
      fontFamily: 'Heebo',
      fontSize: 16,
      headerBackground: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      borderRadius: 12,
      headerStyle: 'gradient',
      tableStyle: 'striped',
      accentPosition: 'top',
    },
  },
  {
    id: 'elegant-gold',
    name: 'זהב אלגנטי',
    description: 'עיצוב יוקרתי ומרשים',
    thumbnail: '🥇',
    settings: {
      primaryColor: '#B8860B',
      secondaryColor: '#DAA520',
      accentColor: '#F4C430',
      fontFamily: 'Frank Ruhl Libre',
      fontSize: 16,
      headerBackground: 'linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #F4C430 100%)',
      borderRadius: 8,
      headerStyle: 'gradient',
      tableStyle: 'bordered',
      accentPosition: 'both',
    },
  },
  {
    id: 'nature-green',
    name: 'ירוק טבע',
    description: 'עיצוב רענן ואקולוגי',
    thumbnail: '🌿',
    settings: {
      primaryColor: '#059669',
      secondaryColor: '#10b981',
      accentColor: '#34d399',
      fontFamily: 'Assistant',
      fontSize: 16,
      headerBackground: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      borderRadius: 16,
      headerStyle: 'gradient',
      tableStyle: 'minimal',
      accentPosition: 'side',
    },
  },
  {
    id: 'royal-purple',
    name: 'סגול מלכותי',
    description: 'עיצוב יוקרתי ומודרני',
    thumbnail: '👑',
    settings: {
      primaryColor: '#7c3aed',
      secondaryColor: '#8b5cf6',
      accentColor: '#a78bfa',
      fontFamily: 'Rubik',
      fontSize: 16,
      headerBackground: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
      borderRadius: 20,
      headerStyle: 'gradient',
      tableStyle: 'striped',
      accentPosition: 'top',
    },
  },
  {
    id: 'minimal-gray',
    name: 'אפור מינימלי',
    description: 'עיצוב נקי ופשוט',
    thumbnail: '⬜',
    settings: {
      primaryColor: '#374151',
      secondaryColor: '#4b5563',
      accentColor: '#6b7280',
      fontFamily: 'Heebo',
      fontSize: 15,
      headerBackground: '#374151',
      borderRadius: 4,
      headerStyle: 'solid',
      tableStyle: 'minimal',
      accentPosition: 'top',
    },
  },
  {
    id: 'warm-earth',
    name: 'חום אדמה',
    description: 'עיצוב חם ונעים',
    thumbnail: '🏜️',
    settings: {
      primaryColor: '#92400e',
      secondaryColor: '#b45309',
      accentColor: '#d97706',
      fontFamily: 'David Libre',
      fontSize: 16,
      headerBackground: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)',
      borderRadius: 10,
      headerStyle: 'gradient',
      tableStyle: 'bordered',
      accentPosition: 'both',
    },
  },
  {
    id: 'ocean-teal',
    name: 'טורקיז אוקיינוס',
    description: 'עיצוב רגוע ומקצועי',
    thumbnail: '🌊',
    settings: {
      primaryColor: '#0891b2',
      secondaryColor: '#06b6d4',
      accentColor: '#22d3ee',
      fontFamily: 'Assistant',
      fontSize: 16,
      headerBackground: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
      borderRadius: 14,
      headerStyle: 'gradient',
      tableStyle: 'striped',
      accentPosition: 'side',
    },
  },
  {
    id: 'bold-red',
    name: 'אדום נועז',
    description: 'עיצוב בולט ודינמי',
    thumbnail: '🔴',
    settings: {
      primaryColor: '#dc2626',
      secondaryColor: '#ef4444',
      accentColor: '#f87171',
      fontFamily: 'Secular One',
      fontSize: 16,
      headerBackground: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      borderRadius: 8,
      headerStyle: 'gradient',
      tableStyle: 'bordered',
      accentPosition: 'top',
    },
  },
  {
    id: 'soft-pink',
    name: 'ורוד עדין',
    description: 'עיצוב רך ונשי',
    thumbnail: '🌸',
    settings: {
      primaryColor: '#db2777',
      secondaryColor: '#ec4899',
      accentColor: '#f472b6',
      fontFamily: 'Varela Round',
      fontSize: 16,
      headerBackground: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)',
      borderRadius: 20,
      headerStyle: 'gradient',
      tableStyle: 'minimal',
      accentPosition: 'both',
    },
  },
  {
    id: 'tech-dark',
    name: 'טכנולוגי כהה',
    description: 'עיצוב מודרני להייטק',
    thumbnail: '💻',
    settings: {
      primaryColor: '#18181b',
      secondaryColor: '#27272a',
      accentColor: '#3b82f6',
      fontFamily: 'Heebo',
      fontSize: 15,
      headerBackground: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
      borderRadius: 8,
      headerStyle: 'gradient',
      tableStyle: 'minimal',
      accentPosition: 'side',
    },
  },
  {
    id: 'construction',
    name: 'בנייה מקצועית',
    description: 'מושלם לקבלני בנייה',
    thumbnail: '🏗️',
    settings: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fbbf24',
      accentColor: '#374151',
      fontFamily: 'Heebo',
      fontSize: 16,
      headerBackground: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      borderRadius: 6,
      headerStyle: 'gradient',
      tableStyle: 'bordered',
      accentPosition: 'top',
    },
  },
  {
    id: 'legal-classic',
    name: 'משפטי קלאסי',
    description: 'עיצוב רשמי למשרדים',
    thumbnail: '⚖️',
    settings: {
      primaryColor: '#1e3a5f',
      secondaryColor: '#2d5a8f',
      accentColor: '#b8860b',
      fontFamily: 'David Libre',
      fontSize: 15,
      headerBackground: '#1e3a5f',
      borderRadius: 0,
      headerStyle: 'solid',
      tableStyle: 'bordered',
      accentPosition: 'top',
    },
  },
];

interface DesignTemplatesSelectorProps {
  onSelect: (template: DesignTemplate) => void;
  currentTemplate?: string;
}

export function DesignTemplatesSelector({ onSelect, currentTemplate }: DesignTemplatesSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        תבניות עיצוב מוכנות
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {DESIGN_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={cn(
              'p-4 rounded-xl border-2 transition-all hover:scale-105 text-right',
              currentTemplate === template.id
                ? 'border-primary bg-primary/10'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="text-3xl mb-2">{template.thumbnail}</div>
            <div className="font-medium text-sm">{template.name}</div>
            <div className="text-xs text-gray-500 mt-1">{template.description}</div>
            <div className="flex gap-1 mt-2 justify-end">
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: template.settings.primaryColor }}
              />
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: template.settings.secondaryColor }}
              />
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: template.settings.accentColor }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 2. Digital Signature - חתימה דיגיטלית
// ============================================

interface DigitalSignatureProps {
  onSave: (signatureData: string) => void;
  onClear: () => void;
  existingSignature?: string;
}

export function DigitalSignature({ onSave, onClear, existingSignature }: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!existingSignature);
  const { toast } = useToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature
    if (existingSignature) {
      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
      };
      img.src = existingSignature;
    }
  }, [existingSignature]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onClear();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    toast({ title: 'החתימה נשמרה', description: 'החתימה הדיגיטלית נשמרה בהצלחה' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <PenTool className="h-5 w-5 text-primary" />
          חתימה דיגיטלית
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearSignature}>
            <Trash2 className="h-4 w-4 ml-1" />
            נקה
          </Button>
          <Button size="sm" onClick={saveSignature} disabled={!hasSignature}>
            <Check className="h-4 w-4 ml-1" />
            שמור חתימה
          </Button>
        </div>
      </div>
      <div className="border-2 border-dashed rounded-lg bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-40 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-xs text-gray-500 text-center">
        חתום באמצעות העכבר או מסך מגע
      </p>
    </div>
  );
}

// ============================================
// 3. QR Code Generator - יצירת קוד QR
// ============================================

interface QRCodeGeneratorProps {
  quoteId: string;
  quoteName: string;
}

export function QRCodeGenerator({ quoteId, quoteName }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const quoteUrl = `${window.location.origin}/quotes/view/${quoteId}`;

  useEffect(() => {
    // Generate QR code using Google Charts API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(quoteUrl)}`;
    setQrCodeUrl(qrUrl);
  }, [quoteUrl]);

  const copyLink = () => {
    navigator.clipboard.writeText(quoteUrl);
    setCopied(true);
    toast({ title: 'הקישור הועתק', description: 'הקישור להצעת המחיר הועתק ללוח' });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-${quoteName}.png`;
    link.click();
    toast({ title: 'QR הורד', description: 'קוד ה-QR הורד בהצלחה' });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <QrCode className="h-5 w-5 text-primary" />
        קוד QR להצעה
      </h3>
      <div className="flex gap-6 items-start">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <Label className="text-sm text-gray-500">קישור להצעה:</Label>
            <div className="flex gap-2 mt-1">
              <Input value={quoteUrl} readOnly className="text-xs" dir="ltr" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={downloadQR} className="w-full">
            <Download className="h-4 w-4 ml-2" />
            הורד קוד QR
          </Button>
          <p className="text-xs text-gray-500">
            שתף את קוד ה-QR כדי שהלקוח יוכל לצפות בהצעה בנייד
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 4. Quote Status Tracker - מעקב סטטוס
// ============================================

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired';

interface QuoteStatusTrackerProps {
  status: QuoteStatus;
  onStatusChange: (status: QuoteStatus) => void;
  viewedAt?: Date;
  sentAt?: Date;
  expiresAt?: Date;
}

const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  draft: { label: 'טיוטה', color: 'bg-gray-500', icon: <FileText className="h-4 w-4" />, description: 'ההצעה עדיין בעריכה' },
  sent: { label: 'נשלח', color: 'bg-blue-500', icon: <Send className="h-4 w-4" />, description: 'ההצעה נשלחה ללקוח' },
  viewed: { label: 'נצפה', color: 'bg-yellow-500', icon: <Eye className="h-4 w-4" />, description: 'הלקוח צפה בהצעה' },
  approved: { label: 'מאושר', color: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" />, description: 'הלקוח אישר את ההצעה' },
  rejected: { label: 'נדחה', color: 'bg-red-500', icon: <XCircle className="h-4 w-4" />, description: 'הלקוח דחה את ההצעה' },
  expired: { label: 'פג תוקף', color: 'bg-gray-400', icon: <Clock className="h-4 w-4" />, description: 'תוקף ההצעה פג' },
};

export function QuoteStatusTracker({ status, onStatusChange, viewedAt, sentAt, expiresAt }: QuoteStatusTrackerProps) {
  const statuses: QuoteStatus[] = ['draft', 'sent', 'viewed', 'approved'];
  const currentIndex = statuses.indexOf(status);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileCheck className="h-5 w-5 text-primary" />
        סטטוס הצעה
      </h3>
      
      {/* Status Timeline */}
      <div className="flex items-center justify-between relative">
        {statuses.map((s, index) => {
          const config = STATUS_CONFIG[s];
          const isActive = index <= currentIndex;
          const isCurrent = s === status;
          
          return (
            <React.Fragment key={s}>
              <button
                onClick={() => onStatusChange(s)}
                className={cn(
                  'flex flex-col items-center gap-1 z-10 transition-all',
                  isCurrent && 'scale-110'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white transition-all',
                    isActive ? config.color : 'bg-gray-200'
                  )}
                >
                  {config.icon}
                </div>
                <span className={cn('text-xs font-medium', isActive ? 'text-gray-900' : 'text-gray-400')}>
                  {config.label}
                </span>
              </button>
              {index < statuses.length - 1 && (
                <div className={cn(
                  'flex-1 h-1 mx-2',
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Badge className={cn('text-white', STATUS_CONFIG[status].color)}>
            {STATUS_CONFIG[status].label}
          </Badge>
          <span className="text-sm text-gray-600">{STATUS_CONFIG[status].description}</span>
        </div>
        {sentAt && (
          <p className="text-xs text-gray-500">נשלח: {new Date(sentAt).toLocaleString('he-IL')}</p>
        )}
        {viewedAt && (
          <p className="text-xs text-gray-500">נצפה: {new Date(viewedAt).toLocaleString('he-IL')}</p>
        )}
        {expiresAt && (
          <p className="text-xs text-gray-500">תוקף: {new Date(expiresAt).toLocaleDateString('he-IL')}</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        {status === 'draft' && (
          <Button size="sm" onClick={() => onStatusChange('sent')} className="bg-blue-500 hover:bg-blue-600">
            <Send className="h-4 w-4 ml-1" />
            סמן כנשלח
          </Button>
        )}
        {status === 'viewed' && (
          <>
            <Button size="sm" onClick={() => onStatusChange('approved')} className="bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="h-4 w-4 ml-1" />
              אושר
            </Button>
            <Button size="sm" variant="outline" onClick={() => onStatusChange('rejected')} className="text-red-500 border-red-500">
              <XCircle className="h-4 w-4 ml-1" />
              נדחה
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// 5. Change History - היסטוריית שינויים
// ============================================

export interface ChangeRecord {
  id: string;
  timestamp: Date;
  user: string;
  action: 'create' | 'edit' | 'send' | 'view' | 'approve' | 'reject';
  field?: string;
  oldValue?: string;
  newValue?: string;
}

interface ChangeHistoryProps {
  changes: ChangeRecord[];
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  create: { label: 'נוצרה', icon: <Plus className="h-3 w-3" />, color: 'text-green-600' },
  edit: { label: 'נערכה', icon: <Pencil className="h-3 w-3" />, color: 'text-blue-600' },
  send: { label: 'נשלחה', icon: <Send className="h-3 w-3" />, color: 'text-purple-600' },
  view: { label: 'נצפתה', icon: <Eye className="h-3 w-3" />, color: 'text-yellow-600' },
  approve: { label: 'אושרה', icon: <Check className="h-3 w-3" />, color: 'text-green-600' },
  reject: { label: 'נדחתה', icon: <X className="h-3 w-3" />, color: 'text-red-600' },
};

export function ChangeHistory({ changes }: ChangeHistoryProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        היסטוריית שינויים
      </h3>
      <ScrollArea className="h-64">
        <div className="space-y-3">
          {changes.length === 0 ? (
            <p className="text-center text-gray-400 py-8">אין היסטוריה</p>
          ) : (
            changes.map((change) => {
              const actionConfig = ACTION_LABELS[change.action];
              return (
                <div key={change.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={cn('mt-0.5', actionConfig.color)}>
                    {actionConfig.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{actionConfig.label}</span>
                      <span className="text-xs text-gray-500">ע"י {change.user}</span>
                    </div>
                    {change.field && (
                      <p className="text-xs text-gray-600 mt-1">
                        שדה: {change.field}
                        {change.oldValue && ` | מ: ${change.oldValue}`}
                        {change.newValue && ` | ל: ${change.newValue}`}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(change.timestamp).toLocaleString('he-IL')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// 6. SMS Sharing Dialog - שליחה ב-SMS
// ============================================

interface SMSShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteName: string;
  quoteId: string;
  clientPhone?: string;
  totalPrice: number;
}

export function SMSShareDialog({ open, onOpenChange, quoteName, quoteId, clientPhone, totalPrice }: SMSShareDialogProps) {
  const [phone, setPhone] = useState(clientPhone || '');
  const [messageType, setMessageType] = useState<'link' | 'full'>('link');
  const { toast } = useToast();

  const quoteUrl = `${window.location.origin}/q/${quoteId}`;
  
  const messages = {
    link: `שלום, מצורף קישור להצעת מחיר: ${quoteName}\n${quoteUrl}`,
    full: `שלום,\nמצורפת הצעת מחיר: ${quoteName}\nסה"כ: ₪${totalPrice.toLocaleString()} + מע"מ\nלצפייה: ${quoteUrl}`,
  };

  const formatPhone = (phoneNumber: string): string => {
    let cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '972' + cleaned.substring(1);
    }
    return cleaned;
  };

  const handleSend = () => {
    if (!phone) {
      toast({ title: 'שגיאה', description: 'יש להזין מספר טלפון', variant: 'destructive' });
      return;
    }
    
    const formattedPhone = formatPhone(phone);
    const message = encodeURIComponent(messages[messageType]);
    
    // Open SMS app
    window.open(`sms:+${formattedPhone}?body=${message}`, '_blank');
    
    toast({ title: 'SMS', description: 'אפליקציית ההודעות נפתחה' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            שליחה ב-SMS
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>מספר טלפון</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>סוג הודעה</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={messageType === 'link' ? 'default' : 'outline'}
                onClick={() => setMessageType('link')}
                size="sm"
              >
                קישור בלבד
              </Button>
              <Button
                variant={messageType === 'full' ? 'default' : 'outline'}
                onClick={() => setMessageType('full')}
                size="sm"
              >
                הודעה מלאה
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>תצוגה מקדימה</Label>
            <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap border">
              {messages[messageType]}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSend} disabled={!phone}>
            <MessageSquare className="h-4 w-4 ml-2" />
            שלח SMS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 7. Calendar Sync - סנכרון ליומן
// ============================================

interface CalendarSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteName: string;
  clientName: string;
  expiresAt?: Date;
}

export function CalendarSyncDialog({ open, onOpenChange, quoteName, clientName, expiresAt }: CalendarSyncDialogProps) {
  const [reminderType, setReminderType] = useState<'followup' | 'expiry'>('followup');
  const [daysFromNow, setDaysFromNow] = useState(3);
  const { toast } = useToast();

  const createGoogleCalendarLink = () => {
    const date = reminderType === 'expiry' && expiresAt 
      ? new Date(expiresAt)
      : new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    
    const title = reminderType === 'expiry' 
      ? `תוקף הצעה: ${quoteName}`
      : `מעקב הצעה: ${quoteName}`;
    
    const description = `תזכורת לטפל בהצעת המחיר "${quoteName}" עבור ${clientName}`;
    
    const startDate = date.toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(description)}`;
    
    window.open(url, '_blank');
    toast({ title: 'הועבר ליומן', description: 'נפתח Google Calendar להוספת התזכורת' });
    onOpenChange(false);
  };

  const downloadICS = () => {
    const date = reminderType === 'expiry' && expiresAt 
      ? new Date(expiresAt)
      : new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    
    const title = reminderType === 'expiry' 
      ? `תוקף הצעה: ${quoteName}`
      : `מעקב הצעה: ${quoteName}`;
    
    const description = `תזכורת לטפל בהצעת המחיר "${quoteName}" עבור ${clientName}`;
    
    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDate(date)}
DTEND:${formatDate(new Date(date.getTime() + 60 * 60 * 1000))}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reminder-${quoteName}.ics`;
    link.click();
    
    toast({ title: 'קובץ הורד', description: 'הורד קובץ ICS לייבוא ליומן' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            הוסף תזכורת ליומן
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>סוג תזכורת</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={reminderType === 'followup' ? 'default' : 'outline'}
                onClick={() => setReminderType('followup')}
                size="sm"
              >
                <Clock className="h-4 w-4 ml-1" />
                מעקב
              </Button>
              <Button
                variant={reminderType === 'expiry' ? 'default' : 'outline'}
                onClick={() => setReminderType('expiry')}
                size="sm"
                disabled={!expiresAt}
              >
                <AlertCircle className="h-4 w-4 ml-1" />
                תפוגה
              </Button>
            </div>
          </div>
          
          {reminderType === 'followup' && (
            <div className="space-y-2">
              <Label>תזכיר לי בעוד {daysFromNow} ימים</Label>
              <Slider
                value={[daysFromNow]}
                onValueChange={([v]) => setDaysFromNow(v)}
                min={1}
                max={14}
                step={1}
              />
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium">פרטי התזכורת:</p>
            <p className="text-sm text-gray-600">הצעה: {quoteName}</p>
            <p className="text-sm text-gray-600">לקוח: {clientName}</p>
            <p className="text-sm text-gray-600">
              תאריך: {new Date(
                reminderType === 'expiry' && expiresAt 
                  ? expiresAt
                  : Date.now() + daysFromNow * 24 * 60 * 60 * 1000
              ).toLocaleDateString('he-IL')}
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button variant="outline" onClick={downloadICS}>
            <Download className="h-4 w-4 ml-2" />
            הורד ICS
          </Button>
          <Button onClick={createGoogleCalendarLink}>
            <Calendar className="h-4 w-4 ml-2" />
            Google Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 8. Alternative Pricing - הצעות חלופיות
// ============================================

export interface PricingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  isRecommended?: boolean;
}

interface AlternativePricingProps {
  options: PricingOption[];
  onOptionsChange: (options: PricingOption[]) => void;
}

export function AlternativePricing({ options, onOptionsChange }: AlternativePricingProps) {
  const [editingOption, setEditingOption] = useState<PricingOption | null>(null);
  const { toast } = useToast();

  const addOption = () => {
    const newOption: PricingOption = {
      id: Date.now().toString(),
      name: 'מסלול חדש',
      description: '',
      price: 0,
      features: [],
      isRecommended: false,
    };
    onOptionsChange([...options, newOption]);
    setEditingOption(newOption);
  };

  const updateOption = (updated: PricingOption) => {
    onOptionsChange(options.map(o => o.id === updated.id ? updated : o));
    setEditingOption(null);
  };

  const deleteOption = (id: string) => {
    onOptionsChange(options.filter(o => o.id !== id));
    toast({ title: 'נמחק', description: 'המסלול הוסר' });
  };

  const setRecommended = (id: string) => {
    onOptionsChange(options.map(o => ({ ...o, isRecommended: o.id === id })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          מסלולי מחיר
        </h3>
        <Button size="sm" onClick={addOption}>
          <Plus className="h-4 w-4 ml-1" />
          הוסף מסלול
        </Button>
      </div>

      {options.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Layers className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">אין מסלולי מחיר</p>
          <Button variant="link" onClick={addOption}>הוסף מסלול ראשון</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((option) => (
            <div
              key={option.id}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all',
                option.isRecommended
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {option.isRecommended && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  מומלץ
                </Badge>
              )}
              <div className="text-center mb-4">
                <h4 className="font-bold text-lg">{option.name}</h4>
                <p className="text-sm text-gray-500">{option.description}</p>
                <div className="text-2xl font-bold mt-2 text-primary">
                  ₪{option.price.toLocaleString()}
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {option.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditingOption(option)}
                >
                  <Pencil className="h-3 w-3 ml-1" />
                  ערוך
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecommended(option.id)}
                  disabled={option.isRecommended}
                >
                  <Sparkles className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => deleteOption(option.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingOption} onOpenChange={() => setEditingOption(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת מסלול מחיר</DialogTitle>
          </DialogHeader>
          {editingOption && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>שם המסלול</Label>
                <Input
                  value={editingOption.name}
                  onChange={(e) => setEditingOption({ ...editingOption, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>תיאור</Label>
                <Input
                  value={editingOption.description}
                  onChange={(e) => setEditingOption({ ...editingOption, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>מחיר (₪)</Label>
                <Input
                  type="number"
                  value={editingOption.price}
                  onChange={(e) => setEditingOption({ ...editingOption, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>תכונות (אחת בכל שורה)</Label>
                <Textarea
                  value={editingOption.features.join('\n')}
                  onChange={(e) => setEditingOption({ 
                    ...editingOption, 
                    features: e.target.value.split('\n').filter(f => f.trim()) 
                  })}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOption(null)}>ביטול</Button>
            <Button onClick={() => editingOption && updateOption(editingOption)}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// 9. Auto Calculator - מחשבון אוטומטי
// ============================================

interface CalculatorProps {
  basePrice: number;
  vatRate: number;
  discount: number;
  discountType: 'percent' | 'fixed';
  onCalculate: (result: CalculationResult) => void;
}

export interface CalculationResult {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  vatAmount: number;
  total: number;
}

export function AutoCalculator({ basePrice, vatRate, discount, discountType, onCalculate }: CalculatorProps) {
  const [customItems, setCustomItems] = useState<Array<{ name: string; price: number }>>([]);

  const calculate = useCallback(() => {
    const itemsTotal = customItems.reduce((sum, item) => sum + item.price, 0);
    const subtotal = basePrice + itemsTotal;
    const discountAmount = discountType === 'percent' 
      ? subtotal * (discount / 100) 
      : discount;
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = afterDiscount * (vatRate / 100);
    const total = afterDiscount + vatAmount;

    const result = { subtotal, discountAmount, afterDiscount, vatAmount, total };
    onCalculate(result);
    return result;
  }, [basePrice, vatRate, discount, discountType, customItems, onCalculate]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const result = calculate();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        חישוב מחיר
      </h3>
      
      {/* Custom Items */}
      <div className="space-y-2">
        <Label>פריטים נוספים</Label>
        {customItems.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item.name}
              onChange={(e) => {
                const updated = [...customItems];
                updated[index].name = e.target.value;
                setCustomItems(updated);
              }}
              placeholder="שם הפריט"
              className="flex-1"
            />
            <Input
              type="number"
              value={item.price}
              onChange={(e) => {
                const updated = [...customItems];
                updated[index].price = parseInt(e.target.value) || 0;
                setCustomItems(updated);
              }}
              placeholder="מחיר"
              className="w-32"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCustomItems(customItems.filter((_, i) => i !== index))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCustomItems([...customItems, { name: '', price: 0 }])}
        >
          <Plus className="h-4 w-4 ml-1" />
          הוסף פריט
        </Button>
      </div>

      {/* Calculation Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>מחיר בסיס:</span>
          <span>₪{basePrice.toLocaleString()}</span>
        </div>
        {customItems.length > 0 && (
          <div className="flex justify-between text-sm">
            <span>פריטים נוספים:</span>
            <span>₪{customItems.reduce((s, i) => s + i.price, 0).toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-sm border-t pt-2">
          <span>סה"כ לפני הנחה:</span>
          <span>₪{result.subtotal.toLocaleString()}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-red-600">
            <span>הנחה ({discountType === 'percent' ? `${discount}%` : `₪${discount}`}):</span>
            <span>-₪{result.discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>לפני מע"מ:</span>
          <span>₪{result.afterDiscount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>מע"מ ({vatRate}%):</span>
          <span>₪{result.vatAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>סה"כ לתשלום:</span>
          <span className="text-primary">₪{result.total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 10. Payment Link - קישור לתשלום
// ============================================

interface PaymentLinkProps {
  quoteId: string;
  totalAmount: number;
  clientName: string;
  clientEmail?: string;
}

export function PaymentLink({ quoteId, totalAmount, clientName, clientEmail }: PaymentLinkProps) {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'bit' | 'custom'>('custom');
  const [customUrl, setCustomUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generatePaymentUrl = () => {
    switch (paymentMethod) {
      case 'stripe':
        return `https://checkout.stripe.com/pay/${quoteId}?amount=${totalAmount}`;
      case 'paypal':
        return `https://paypal.me/yourcompany/${totalAmount}`;
      case 'bit':
        return `https://www.bitpay.co.il/app/`;
      default:
        return customUrl;
    }
  };

  const copyLink = () => {
    const url = generatePaymentUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'הועתק', description: 'קישור התשלום הועתק ללוח' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        קישור לתשלום
      </h3>
      
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: 'stripe', label: 'Stripe', icon: '💳' },
          { value: 'paypal', label: 'PayPal', icon: '🅿️' },
          { value: 'bit', label: 'Bit', icon: '📱' },
          { value: 'custom', label: 'מותאם', icon: '🔗' },
        ].map((method) => (
          <Button
            key={method.value}
            variant={paymentMethod === method.value ? 'default' : 'outline'}
            onClick={() => setPaymentMethod(method.value as any)}
            className="flex-col h-auto py-3"
          >
            <span className="text-2xl mb-1">{method.icon}</span>
            <span className="text-xs">{method.label}</span>
          </Button>
        ))}
      </div>

      {paymentMethod === 'custom' && (
        <div className="space-y-2">
          <Label>קישור מותאם</Label>
          <Input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://..."
            dir="ltr"
          />
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm font-medium mb-2">סיכום תשלום:</p>
        <p className="text-sm">לקוח: {clientName}</p>
        <p className="text-sm">סכום: ₪{totalAmount.toLocaleString()}</p>
        {clientEmail && <p className="text-sm">אימייל: {clientEmail}</p>}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4 ml-2" /> : <Copy className="h-4 w-4 ml-2" />}
          העתק קישור
        </Button>
        <Button variant="outline" onClick={() => window.open(generatePaymentUrl(), '_blank')}>
          <Link className="h-4 w-4 ml-2" />
          פתח
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Export All Components
// ============================================

export {
  Pencil,
  Plus,
};
