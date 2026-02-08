import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Phone,
  MessageCircle,
  Send,
  Copy,
  ExternalLink,
  FileText,
  Link2,
} from 'lucide-react';
import { QuoteDocumentData } from './types';
import { toast } from 'sonner';

interface WhatsAppShareDialogProps {
  document: QuoteDocumentData;
  onGeneratePdf?: () => Promise<string | Blob | null>;
}

const MESSAGE_TEMPLATES = [
  {
    id: 'formal',
    name: 'רשמי',
    template: `שלום {{clientName}},

מצורפת הצעת מחיר מספר {{quoteNumber}} מתאריך {{date}}.

סה"כ: {{total}}

ההצעה תקפה עד {{validUntil}}.

בברכה,
{{companyName}}`,
  },
  {
    id: 'friendly',
    name: 'ידידותי',
    template: `היי {{clientName}}! 👋

שלחתי לך את הצעת המחיר שדיברנו עליה.

מספר הצעה: {{quoteNumber}}
סכום: {{total}}

אשמח לשמוע ממך!
{{companyName}}`,
  },
  {
    id: 'short',
    name: 'קצר',
    template: `{{clientName}}, הצעת מחיר {{quoteNumber}} - {{total}}. תקף עד {{validUntil}}.`,
  },
  {
    id: 'custom',
    name: 'מותאם אישית',
    template: '',
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('he-IL');
  } catch {
    return dateStr;
  }
};

export function WhatsAppShareDialog({ document, onGeneratePdf }: WhatsAppShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(document.clientPhone || '');
  const [selectedTemplate, setSelectedTemplate] = useState('formal');
  const [customMessage, setCustomMessage] = useState('');
  const [includeLink, setIncludeLink] = useState(false);
  const [documentLink, setDocumentLink] = useState('');
  const [isSending, setIsSending] = useState(false);

  const replaceVariables = useCallback((text: string): string => {
    return text
      .replace(/\{\{clientName\}\}/g, document.clientName || 'לקוח יקר')
      .replace(/\{\{companyName\}\}/g, document.companyName || '')
      .replace(/\{\{quoteNumber\}\}/g, document.quoteNumber || '')
      .replace(/\{\{date\}\}/g, formatDate(document.date))
      .replace(/\{\{validUntil\}\}/g, formatDate(document.validUntil))
      .replace(/\{\{total\}\}/g, formatCurrency(document.total));
  }, [document]);

  const getMessage = useCallback(() => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate);
    let message = selectedTemplate === 'custom' ? customMessage : (template?.template || '');
    message = replaceVariables(message);

    if (includeLink && documentLink) {
      message += `\n\n🔗 צפייה בהצעה: ${documentLink}`;
    }

    return message;
  }, [selectedTemplate, customMessage, includeLink, documentLink, replaceVariables]);

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Israeli numbers
    if (cleaned.startsWith('0')) {
      cleaned = '972' + cleaned.substring(1);
    } else if (!cleaned.startsWith('972')) {
      cleaned = '972' + cleaned;
    }
    
    return cleaned;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    // Israeli mobile numbers are typically 10 digits starting with 05
    return cleaned.length >= 9 && cleaned.length <= 15;
  };

  const openWhatsApp = useCallback(() => {
    if (!phoneNumber.trim()) {
      toast.error('יש להזין מספר טלפון');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast.error('מספר טלפון לא תקין');
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const message = encodeURIComponent(getMessage());
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;

    window.open(whatsappUrl, '_blank');
    toast.success('פותח WhatsApp...');
    setOpen(false);
  }, [phoneNumber, getMessage]);

  const copyMessage = useCallback(() => {
    navigator.clipboard.writeText(getMessage());
    toast.success('ההודעה הועתקה');
  }, [getMessage]);

  const copyLink = useCallback(() => {
    const whatsappUrl = `https://wa.me/${formatPhoneNumber(phoneNumber)}?text=${encodeURIComponent(getMessage())}`;
    navigator.clipboard.writeText(whatsappUrl);
    toast.success('הקישור הועתק');
  }, [phoneNumber, getMessage]);

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    if (value !== 'custom') {
      const template = MESSAGE_TEMPLATES.find(t => t.id === value);
      setCustomMessage(template?.template || '');
    }
  };

  const previewMessage = replaceVariables(
    selectedTemplate === 'custom' 
      ? customMessage 
      : MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.template || ''
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            שליחה ב-WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phone Number */}
          <div className="space-y-2">
            <Label>מספר טלפון *</Label>
            <div className="flex gap-2">
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="050-1234567"
                type="tel"
                dir="ltr"
                className="text-left"
              />
              {document.clientPhone && document.clientPhone !== phoneNumber && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPhoneNumber(document.clientPhone || '')}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Message Template */}
          <div className="space-y-2">
            <Label>תבנית הודעה</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Message */}
          {selectedTemplate === 'custom' && (
            <div className="space-y-2">
              <Label>הודעה מותאמת אישית</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="הקלד את ההודעה שלך..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                משתנים זמינים: {'{{clientName}}'}, {'{{companyName}}'}, {'{{quoteNumber}}'}, {'{{date}}'}, {'{{validUntil}}'}, {'{{total}}'}
              </p>
            </div>
          )}

          {/* Document Link Option */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeLink"
                checked={includeLink}
                onCheckedChange={(v) => setIncludeLink(v as boolean)}
              />
              <Label htmlFor="includeLink" className="text-sm cursor-pointer">
                צרף קישור למסמך
              </Label>
            </div>
            {includeLink && (
              <Input
                value={documentLink}
                onChange={(e) => setDocumentLink(e.target.value)}
                placeholder="https://..."
                dir="ltr"
                className="text-left"
              />
            )}
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <Label>תצוגה מקדימה</Label>
            <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {previewMessage}
                {includeLink && documentLink && (
                  <>
                    {'\n\n'}🔗 צפייה בהצעה: {documentLink}
                  </>
                )}
              </pre>
            </div>
          </div>

          {/* Document Info */}
          <div className="bg-card border rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">פרטי ההצעה:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>מספר: {document.quoteNumber}</div>
              <div>לקוח: {document.clientName}</div>
              <div>סכום: {formatCurrency(document.total)}</div>
              <div>תוקף: {formatDate(document.validUntil)}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={copyMessage}>
              <Copy className="h-4 w-4 ml-1" />
              העתק הודעה
            </Button>
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Link2 className="h-4 w-4 ml-1" />
              העתק קישור
            </Button>
          </div>
          <Button onClick={openWhatsApp} className="bg-green-600 hover:bg-green-700">
            <Send className="h-4 w-4 ml-2" />
            שלח ב-WhatsApp
            <ExternalLink className="h-3 w-3 mr-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WhatsAppShareDialog;
