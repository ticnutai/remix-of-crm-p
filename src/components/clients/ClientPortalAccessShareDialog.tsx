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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isValidIsraeliPhone, normalizeIsraeliPhone } from "@/lib/portalAccess";
import {
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

interface ClientPortalAccessShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
}

export function ClientPortalAccessShareDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  clientEmail = "",
  clientPhone = "",
}: ClientPortalAccessShareDialogProps) {
  const { toast } = useToast();
  const [phone, setPhone] = useState(normalizeIsraeliPhone(clientPhone));
  const [sending, setSending] = useState<"email" | "whatsapp" | null>(null);
  const portalUrl = `${window.location.origin}/auth`;

  useEffect(() => {
    if (open) setPhone(normalizeIsraeliPhone(clientPhone));
  }, [open, clientPhone]);

  const invokeInvite = async (channel: "email" | "whatsapp") => {
    if (channel === "whatsapp" && !isValidIsraeliPhone(phone)) {
      toast({ title: "מספר ה-WhatsApp אינו תקין", variant: "destructive" });
      return;
    }

    setSending(channel);
    try {
      const { data, error } = await supabase.functions.invoke("invite-client", {
        body: {
          clientId,
          portalUrl,
          channel,
          ...(channel === "whatsapp"
            ? {
                phoneNumber: phone,
                temporaryPassword: phone.replace(/\D/g, ""),
              }
            : {}),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.success) {
        toast({
          title: channel === "whatsapp"
            ? "קישור הכניסה נשלח ב־WhatsApp"
            : "קישור הכניסה נשלח באימייל",
          description: channel === "whatsapp"
            ? `נשלח באמצעות ${data.provider || "הספק המוגדר במערכת"}.`
            : `נשלח אל ${clientEmail}.`,
        });
      } else if (channel === "whatsapp" && data?.fallbackUrl) {
        window.open(data.fallbackUrl, "_blank", "noopener,noreferrer");
        toast({
          title: "לא הוגדר ספק לשליחה ישירה",
          description: "WhatsApp נפתח עם הודעה וקישור מאובטח המוכנים לשליחה.",
        });
      } else {
        throw new Error("השליחה לא הושלמה");
      }
    } catch (error) {
      toast({
        title: "שליחת פרטי הגישה נכשלה",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const copyDetails = async () => {
    await navigator.clipboard.writeText(
      `פורטל הלקוחות\nשם משתמש: ${clientEmail}\nכניסה: ${portalUrl}\nלבחירת סיסמה חדשה יש לשלוח קישור מאובטח מהמערכת.`,
    );
    toast({ title: "פרטי הגישה הועתקו" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            שליחת גישה לפורטל
          </DialogTitle>
          <DialogDescription>
            שלח ל{clientName} שם משתמש וסיסמה זמנית לכניסה ראשונה לפורטל.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">שם משתמש:</span>
              <span dir="ltr" className="font-medium">{clientEmail || "לא הוגדר אימייל"}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              הסיסמה הזמנית תהיה מספר ה־WhatsApp ללא מקפים. בכניסה הראשונה הלקוח יתבקש לבחור סיסמה חדשה.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portal-share-phone">מספר WhatsApp</Label>
            <Input
              id="portal-share-phone"
              dir="ltr"
              className="text-left"
              value={phone}
              onChange={(event) => setPhone(normalizeIsraeliPhone(event.target.value))}
              placeholder="0502857658"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => invokeInvite("whatsapp")} disabled={Boolean(sending)}>
              {sending === "whatsapp" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              שלח WhatsApp דרך המערכת
            </Button>
            <Button variant="outline" onClick={() => invokeInvite("email")} disabled={Boolean(sending) || !clientEmail}>
              {sending === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              שלח קישור באימייל
            </Button>
            <Button variant="outline" onClick={copyDetails}><Copy className="h-4 w-4" /> העתק פרטים</Button>
            <Button variant="outline" onClick={() => window.open(portalUrl, "_blank", "noopener,noreferrer")}>
              <ExternalLink className="h-4 w-4" /> פתח עמוד כניסה
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={Boolean(sending)}>סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
