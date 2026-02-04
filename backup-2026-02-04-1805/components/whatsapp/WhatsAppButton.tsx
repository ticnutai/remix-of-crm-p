// כפתור WhatsApp - שליחת הודעה ללקוח
// קומפוננטה לשליחת הודעות WhatsApp

import React, { useState } from 'react';
import { MessageCircle, Send, Copy, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  openWhatsApp,
  createWhatsAppLink,
  MESSAGE_TEMPLATES,
  fillTemplate,
} from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  phone: string;
  clientName?: string;
  projectName?: string;
  amount?: number;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function WhatsAppButton({
  phone,
  clientName,
  projectName,
  amount,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: WhatsAppButtonProps) {
  const { toast } = useToast();
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  // אם אין טלפון
  if (!phone) {
    return null;
  }

  // שליחה עם תבנית
  const handleTemplateClick = (templateId: string) => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    const values: Record<string, string> = {
      שם_לקוח: clientName || 'לקוח יקר',
      שם_פרויקט: projectName || '',
      סכום: amount?.toLocaleString() || '',
      שם_משרד: 'המשרד שלנו', // ניתן להחליף לערך דינמי
    };
    
    const message = fillTemplate(template.template, values);
    openWhatsApp(phone, message);
    
    toast({
      title: 'WhatsApp נפתח',
      description: 'ההודעה מוכנה לשליחה',
    });
  };

  // שליחה מהירה (בלי הודעה)
  const handleQuickSend = () => {
    openWhatsApp(phone);
  };

  // שליחת הודעה מותאמת אישית
  const handleCustomSend = () => {
    if (customMessage.trim()) {
      openWhatsApp(phone, customMessage);
      setCustomDialogOpen(false);
      setCustomMessage('');
    }
  };

  // העתקת קישור
  const handleCopyLink = () => {
    const link = createWhatsAppLink(phone);
    navigator.clipboard.writeText(link);
    toast({
      title: 'הקישור הועתק',
      description: 'ניתן להדביק בכל מקום',
    });
  };

  // קיבוץ תבניות לפי קטגוריה
  const templatesByCategory = MESSAGE_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, typeof MESSAGE_TEMPLATES>);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="gap-2">
            <MessageCircle className="h-4 w-4 text-green-600" />
            {showLabel && 'WhatsApp'}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>שלח ב-WhatsApp</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* שליחה מהירה */}
          <DropdownMenuItem onClick={handleQuickSend}>
            <MessageCircle className="h-4 w-4 ml-2 text-green-600" />
            פתח שיחה
          </DropdownMenuItem>
          
          {/* הודעה מותאמת */}
          <DropdownMenuItem onClick={() => setCustomDialogOpen(true)}>
            <Send className="h-4 w-4 ml-2" />
            הודעה מותאמת
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* תבניות לפי קטגוריה */}
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <React.Fragment key={category}>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {category}
              </DropdownMenuLabel>
              {templates.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
                >
                  {template.name}
                </DropdownMenuItem>
              ))}
            </React.Fragment>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* העתקת קישור */}
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="h-4 w-4 ml-2" />
            העתק קישור
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* דיאלוג הודעה מותאמת */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>שלח הודעת WhatsApp</DialogTitle>
            <DialogDescription>
              כתוב הודעה מותאמת אישית ל{clientName || 'לקוח'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>הודעה</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="הקלד את ההודעה..."
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomDialogOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleCustomSend}
              disabled={!customMessage.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 ml-2" />
              שלח ב-WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// כפתור קטן לטבלאות
export function WhatsAppIconButton({ phone }: { phone: string }) {
  const { toast } = useToast();
  
  if (!phone) return null;
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => {
        openWhatsApp(phone);
        toast({ title: 'WhatsApp נפתח' });
      }}
      title="שלח WhatsApp"
    >
      <MessageCircle className="h-4 w-4 text-green-600" />
    </Button>
  );
}

export default WhatsAppButton;
