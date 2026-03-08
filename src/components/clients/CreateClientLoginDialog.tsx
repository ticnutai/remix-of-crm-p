import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff, Copy, Check, Wand2 } from "lucide-react";

interface CreateClientLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  onSuccess?: () => void;
}

/**
 * Generate a username from client name:
 * - Transliterate Hebrew to English
 * - Add random digits for uniqueness
 */
function generateUsername(clientName: string): string {
  const hebrewToEnglish: Record<string, string> = {
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v',
    'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k',
    'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's',
    'ע': 'a', 'פ': 'p', 'ף': 'f', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k',
    'ר': 'r', 'ש': 'sh', 'ת': 't',
  };

  const transliterated = clientName
    .trim()
    .split('')
    .map(ch => hebrewToEnglish[ch] || ch)
    .join('')
    .replace(/\s+/g, '.')
    .replace(/[^a-zA-Z0-9.]/g, '')
    .toLowerCase();

  const suffix = Math.floor(Math.random() * 900 + 100);
  return transliterated ? `${transliterated}${suffix}` : `client${suffix}`;
}

function generatePassword(length = 12): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateEmailFromName(clientName: string, domain = "portal.tenarch.co.il"): string {
  const hebrewToEnglish: Record<string, string> = {
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v',
    'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k',
    'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's',
    'ע': 'a', 'פ': 'p', 'ף': 'f', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k',
    'ר': 'r', 'ש': 'sh', 'ת': 't',
  };

  const transliterated = clientName
    .trim()
    .split('')
    .map(ch => hebrewToEnglish[ch] || ch)
    .join('')
    .replace(/\s+/g, '.')
    .replace(/[^a-zA-Z0-9.]/g, '')
    .toLowerCase();

  const suffix = Math.floor(Math.random() * 900 + 100);
  const local = transliterated || `client${suffix}`;
  return `${local}@${domain}`;
}

export function CreateClientLoginDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  clientEmail = "",
  onSuccess,
}: CreateClientLoginDialogProps) {
  const [email, setEmail] = useState(clientEmail);
  const [password, setPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState(false);
  const { toast } = useToast();

  const suggestedUsername = useMemo(() => generateUsername(clientName), [clientName]);

  const handleAutoGenerate = () => {
    if (!email) {
      setEmail(clientEmail || generateEmailFromName(clientName));
    }
    setPassword(generatePassword());
    toast({ title: "פרטים נוצרו אוטומטית" });
  };

  const handleCreate = async () => {
    if (!email || !password) {
      toast({ title: "נא למלא אימייל וסיסמה", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-client-account", {
        body: { clientId, email, password, clientName },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCreated(true);
      toast({ title: "חשבון נוצר בהצלחה!", description: `חשבון כניסה נוצר עבור ${clientName}` });
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "שגיאה ביצירת החשבון";
      toast({ title: "שגיאה", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = async () => {
    const text = `פרטי כניסה לפורטל:\nאימייל: ${email}\nסיסמה: ${password}\nקישור: ${window.location.origin}/auth`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "פרטי הכניסה הועתקו!" });
  };

  const handleSendInvite = async () => {
    try {
      const portalUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.functions.invoke("invite-client", {
        body: {
          clientId,
          clientEmail: email,
          clientName,
          temporaryPassword: password,
          portalUrl,
        },
      });
      if (error) throw error;
      toast({ title: "הזמנה נשלחה!", description: `נשלח אימייל הזמנה ל-${email}` });
    } catch {
      toast({ title: "שגיאה בשליחת ההזמנה", variant: "destructive" });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCreated(false);
      setEmail(clientEmail);
      setPassword(generatePassword());
      setCopied(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>יצירת כניסה ללקוח</DialogTitle>
          <DialogDescription>
            יצירת שם משתמש וסיסמה עבור {clientName} לגישה לפורטל הלקוחות
          </DialogDescription>
        </DialogHeader>

        {!created ? (
          <div className="space-y-4">
            {/* Auto-generate button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAutoGenerate}
            >
              <Wand2 className="h-4 w-4 ml-2" />
              צור פרטים אוטומטית
            </Button>

            <div className="space-y-2">
              <Label>אימייל / שם משתמש</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={clientEmail || `${suggestedUsername}@example.com`}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                שם משתמש מוצע: <span className="font-mono text-foreground">{suggestedUsername}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label>סיסמה</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPassword(generatePassword())}
                >
                  חדש
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-800 dark:text-green-200">החשבון נוצר בהצלחה!</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm" dir="ltr">
              <div><strong>Email:</strong> {email}</div>
              <div><strong>Password:</strong> {password}</div>
              <div><strong>Portal:</strong> {window.location.origin}/auth</div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopyCredentials}>
                {copied ? <Check className="h-4 w-4 ml-1" /> : <Copy className="h-4 w-4 ml-1" />}
                {copied ? "הועתק!" : "העתק פרטים"}
              </Button>
              <Button className="flex-1" onClick={handleSendInvite}>
                שלח הזמנה באימייל
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row-reverse gap-2">
          {!created ? (
            <>
              <Button onClick={handleCreate} disabled={isLoading || !email}>
                {isLoading && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
                צור חשבון
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                ביטול
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              סגור
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
