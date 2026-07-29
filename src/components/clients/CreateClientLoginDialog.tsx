import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  isValidIsraeliPhone,
  normalizeIsraeliPhone,
  toWhatsAppPhone,
} from "@/lib/portalAccess";

interface CreateClientLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  onSuccess?: () => void;
}

type AccessMethod = "secure_link" | "phone_password";

function randomPassword(length = 20): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function CreateClientLoginDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  clientEmail = "",
  clientPhone = "",
  onSuccess,
}: CreateClientLoginDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(clientEmail);
  const [phone, setPhone] = useState(normalizeIsraeliPhone(clientPhone));
  const [password, setPassword] = useState(normalizeIsraeliPhone(clientPhone));
  const [method, setMethod] = useState<AccessMethod>("secure_link");
  const [sendNow, setSendNow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [created, setCreated] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const portalUrl = `${window.location.origin}/auth`;

  useEffect(() => {
    if (!open) return;
    const normalizedPhone = normalizeIsraeliPhone(clientPhone);
    setEmail(clientEmail);
    setPhone(normalizedPhone);
    setPassword(normalizedPhone);
    setMethod("secure_link");
    setSendNow(true);
    setCreated(false);
    setInviteSent(false);
  }, [open, clientEmail, clientPhone]);

  const sendInvite = async (temporaryPassword?: string) => {
    const { data, error } = await supabase.functions.invoke("invite-client", {
      body: { clientId, portalUrl, temporaryPassword },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    setInviteSent(true);
  };

  const handleCreate = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast({ title: "יש להזין כתובת אימייל תקינה", variant: "destructive" });
      return;
    }
    if (method === "phone_password" && (!isValidIsraeliPhone(phone) || password.length < 6)) {
      toast({
        title: "מספר הטלפון אינו תקין",
        description: "הסיסמה הזמנית צריכה להיות מספר הטלפון ללא מקפים או רווחים.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const accountPassword = method === "secure_link" ? randomPassword() : password;
      const { data, error } = await supabase.functions.invoke("create-client-account", {
        body: {
          clientId,
          email: normalizedEmail,
          password: accountPassword,
          clientName,
          accessMethod: method,
          phone,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setEmail(normalizedEmail);
      setCreated(true);
      onSuccess?.();
      if (sendNow) {
        try {
          await sendInvite(method === "phone_password" ? accountPassword : undefined);
          toast({
            title: "הגישה לפורטל הופעלה",
            description: `ההזמנה נשלחה אל ${normalizedEmail}`,
          });
        } catch (inviteError) {
          toast({
            title: "הגישה נוצרה, אך האימייל לא נשלח",
            description: inviteError instanceof Error ? inviteError.message : "אפשר לשלוח שוב מהחלון.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "הגישה לפורטל הופעלה",
          description: "אפשר להעתיק ולשלוח את פרטי הכניסה.",
        });
      }
    } catch (error) {
      toast({
        title: "לא ניתן להפעיל את הפורטל",
        description: error instanceof Error ? error.message : "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const credentialsText = method === "phone_password"
    ? `שלום ${clientName},\nהופעלה עבורך גישה לפורטל הלקוחות.\nשם משתמש: ${email}\nסיסמה זמנית: ${password}\nכניסה: ${portalUrl}\nבכניסה הראשונה תתבקש/י לבחור סיסמה חדשה.`
    : `שלום ${clientName},\nהופעלה עבורך גישה לפורטל הלקוחות.\nשם המשתמש הוא ${email}.\nקישור הכניסה: ${portalUrl}\nקישור מאובטח להגדרת סיסמה נשלח לאימייל.`;

  const copyCredentials = async () => {
    await navigator.clipboard.writeText(credentialsText);
    toast({ title: "פרטי הגישה הועתקו" });
  };

  const openWhatsApp = () => {
    if (!isValidIsraeliPhone(phone)) {
      toast({ title: "לא נמצא מספר טלפון תקין ללקוח", variant: "destructive" });
      return;
    }
    window.open(
      `https://wa.me/${toWhatsAppPhone(phone)}?text=${encodeURIComponent(credentialsText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const sendWhatsAppViaSystem = async () => {
    if (!isValidIsraeliPhone(phone)) {
      toast({ title: "לא נמצא מספר WhatsApp תקין ללקוח", variant: "destructive" });
      return;
    }
    setSendingWhatsApp(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-client", {
        body: {
          clientId,
          portalUrl,
          channel: "whatsapp",
          phoneNumber: phone,
          temporaryPassword: method === "phone_password" ? password : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.success) {
        toast({
          title: "פרטי הגישה נשלחו ב־WhatsApp",
          description: `נשלח באמצעות ${data.provider || "הספק המוגדר במערכת"}.`,
        });
        return;
      }
      if (data?.fallbackUrl) {
        window.open(data.fallbackUrl, "_blank", "noopener,noreferrer");
        toast({
          title: "לא הוגדר ספק לשליחה ישירה",
          description: "WhatsApp נפתח עם הודעה מוכנה לשליחה.",
        });
        return;
      }
      throw new Error("ספק ה-WhatsApp לא הצליח לשלוח את ההודעה");
    } catch (error) {
      toast({
        title: "שליחת ה-WhatsApp נכשלה",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const close = () => {
    if (!loading) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent dir="rtl" className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            הפעלת פורטל עבור {clientName}
          </DialogTitle>
          <DialogDescription>
            פרטי הלקוח מולאו אוטומטית. ניתן לערוך אותם לפני יצירת הגישה.
          </DialogDescription>
        </DialogHeader>

        {!created ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="portal-email">אימייל — שם המשתמש</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="portal-email"
                    type="email"
                    dir="ltr"
                    className="pr-9 text-left"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal-phone">טלפון הלקוח</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="portal-phone"
                    dir="ltr"
                    className="pr-9 text-left"
                    value={phone}
                    onChange={(event) => {
                      const next = normalizeIsraeliPhone(event.target.value);
                      setPhone(next);
                      if (method === "phone_password") setPassword(next);
                    }}
                    placeholder="0502857658"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>דרך ההפעלה</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMethod("secure_link")}
                  className={`rounded-xl border p-4 text-right transition-colors ${method === "secure_link" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Link2 className="h-4 w-4" /> קישור מאובטח
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">מומלץ</span>
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">הלקוח מקבל אימייל ובוחר סיסמה בעצמו.</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod("phone_password");
                    setPassword(normalizeIsraeliPhone(phone));
                  }}
                  className={`rounded-xl border p-4 text-right transition-colors ${method === "phone_password" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                >
                  <span className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" /> סיסמת טלפון זמנית</span>
                  <span className="mt-1 block text-xs text-muted-foreground">הלקוח חייב להחליף אותה בכניסה הראשונה.</span>
                </button>
              </div>
            </div>

            {method === "phone_password" && (
              <div className="space-y-2 rounded-xl bg-muted/40 p-4">
                <Label htmlFor="temporary-password">סיסמה זמנית</Label>
                <Input
                  id="temporary-password"
                  dir="ltr"
                  className="text-left font-mono"
                  value={password}
                  onChange={(event) => setPassword(event.target.value.replace(/\D/g, ""))}
                />
                <p className="text-xs text-muted-foreground">המספר נשמר ללא מקפים ורווחים, למשל 0502857658.</p>
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3">
              <Checkbox checked={sendNow} onCheckedChange={(value) => setSendNow(value === true)} />
              <span className="text-sm">שלח ללקוח הזמנה באימייל מיד לאחר יצירת הגישה</span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-800">
              <Check className="mx-auto mb-2 h-8 w-8" />
              <p className="font-semibold">הגישה הופעלה בהצלחה</p>
              <p className="mt-1 text-sm">{inviteSent ? `ההזמנה נשלחה אל ${email}` : "הגישה מוכנה לשליחה ללקוח."}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {!inviteSent && (
                <Button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await sendInvite(method === "phone_password" ? password : undefined);
                      toast({ title: "ההזמנה נשלחה" });
                    } catch (error) {
                      toast({ title: "שליחת ההזמנה נכשלה", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  שלח הזמנה
                </Button>
              )}
              <Button variant="outline" onClick={copyCredentials}><Copy className="h-4 w-4" /> העתק פרטים</Button>
              <Button variant="outline" onClick={sendWhatsAppViaSystem} disabled={sendingWhatsApp}>
                {sendingWhatsApp ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4 text-emerald-600" />}
                שלח דרך המערכת
              </Button>
              <Button variant="outline" onClick={openWhatsApp}><MessageCircle className="h-4 w-4 text-emerald-600" /> פתח ב-WhatsApp</Button>
              <Button variant="outline" onClick={() => window.open(portalUrl, "_blank", "noopener,noreferrer")}><ExternalLink className="h-4 w-4" /> פתח עמוד כניסה</Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row-reverse gap-2">
          {!created && (
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {sendNow ? "צור גישה ושלח" : "צור גישה"}
            </Button>
          )}
          <Button variant="outline" onClick={close} disabled={loading}>{created ? "סיום" : "ביטול"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
