// Compose Email Dialog Component
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Loader2, X, Plus, User } from 'lucide-react';
import { useGmailIntegration } from '@/hooks/useGmailIntegration';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendSuccess?: () => void;
  replyTo?: {
    to: string;
    subject: string;
  };
}

export const ComposeEmailDialog = ({ 
  open, 
  onOpenChange, 
  onSendSuccess,
  replyTo 
}: ComposeEmailDialogProps) => {
  const { sendEmail, isSending } = useGmailIntegration();
  const { toast } = useToast();
  
  const [to, setTo] = useState(replyTo?.to || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(replyTo?.subject || '');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setTo(replyTo?.to || '');
      setSubject(replyTo?.subject || '');
      setBody('');
      setCc('');
      setBcc('');
      setShowCc(false);
      setShowBcc(false);
    }
  }, [open, replyTo]);

  const handleSend = async () => {
    // Validation
    if (!to.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין כתובת נמען',
        variant: 'destructive',
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין נושא',
        variant: 'destructive',
      });
      return;
    }

    if (!body.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין תוכן להודעה',
        variant: 'destructive',
      });
      return;
    }

    // Send email
    const success = await sendEmail({
      to,
      subject,
      body,
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
    });

    if (success) {
      onSendSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {replyTo ? 'תשובה למייל' : 'הודעה חדשה'}
          </DialogTitle>
          <DialogDescription>
            שלח מייל ישירות דרך חשבון Gmail שלך
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* To Field */}
          <div className="space-y-2">
            <Label htmlFor="to" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              אל <span className="text-red-500">*</span>
            </Label>
            <Input
              id="to"
              type="email"
              placeholder="example@email.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              dir="ltr"
              className="text-left"
              disabled={isSending}
            />
            <p className="text-xs text-muted-foreground">
              ניתן להזין מספר כתובות מופרדות בפסיק
            </p>
          </div>

          {/* CC/BCC Toggle Buttons */}
          <div className="flex gap-2">
            {!showCc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 ml-1" />
                הוסף CC
              </Button>
            )}
            {!showBcc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 ml-1" />
                הוסף BCC
              </Button>
            )}
          </div>

          {/* CC Field */}
          {showCc && (
            <div className="space-y-2">
              <Label htmlFor="cc" className="flex items-center justify-between">
                <span>עותק (CC)</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setShowCc(false);
                    setCc('');
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Label>
              <Input
                id="cc"
                type="email"
                placeholder="example@email.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                dir="ltr"
                className="text-left"
                disabled={isSending}
              />
            </div>
          )}

          {/* BCC Field */}
          {showBcc && (
            <div className="space-y-2">
              <Label htmlFor="bcc" className="flex items-center justify-between">
                <span>עותק סמוי (BCC)</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setShowBcc(false);
                    setBcc('');
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Label>
              <Input
                id="bcc"
                type="email"
                placeholder="example@email.com"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                dir="ltr"
                className="text-left"
                disabled={isSending}
              />
            </div>
          )}

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              נושא <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="נושא ההודעה"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <Label htmlFor="body">
              תוכן <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="body"
              placeholder="כתוב את תוכן ההודעה כאן..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="resize-none"
              disabled={isSending}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{body.length} תווים</span>
              <Badge variant="secondary" className="text-xs">
                תומך ב-HTML
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t">
          <div className="flex gap-2">
            <Button 
              onClick={handleSend} 
              disabled={isSending || !to.trim() || !subject.trim() || !body.trim()}
              className="min-w-24"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  שלח
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              ביטול
            </Button>
          </div>
          
          {/* Character count warning */}
          {body.length > 5000 && (
            <Badge variant="destructive" className="text-xs">
              הודעה ארוכה מאוד ({body.length} תווים)
            </Badge>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
