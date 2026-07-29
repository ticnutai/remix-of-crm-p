import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, MessageSquareText, Save, Send, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  extractTaskMessagePhones,
  fillTaskMessageTemplate,
  normalizeTaskMessagePhone,
} from "@/lib/taskMessage";

type MessageChannel = "whatsapp" | "sms";

interface ClientContact {
  id: string;
  name: string;
  phone: string | null;
  phone_secondary: string | null;
  whatsapp: string | null;
  additional_phones: unknown;
}

interface MessageSettings {
  scope: "default";
  office_name: string;
  message_template: string;
  default_channel: MessageChannel;
  preview_before_send: boolean;
}

interface TaskClientMessageButtonProps {
  clientId: string;
  taskId: string;
  taskTitle: string;
  stageName: string;
  className?: string;
}

const DEFAULT_SETTINGS: MessageSettings = {
  scope: "default",
  office_name: "משרד האדריכלים",
  message_template:
    "שלום וברכה {client_name},\n{office_name} מבקש להשלים או לשלוח את הפריט הבא:\n{task_title}\nבמסגרת השלב: {stage_name}\nנשמח לעדכון לאחר הטיפול. תודה.",
  default_channel: "whatsapp",
  preview_before_send: true,
};

export function TaskClientMessageButton({
  clientId,
  taskId,
  taskTitle,
  stageName,
  className,
}: TaskClientMessageButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [client, setClient] = useState<ClientContact | null>(null);
  const [settings, setSettings] = useState<MessageSettings>(DEFAULT_SETTINGS);
  const [channel, setChannel] = useState<MessageChannel>("whatsapp");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  const phones = useMemo(() => {
    if (!client) return [];
    const additional = Array.isArray(client.additional_phones)
      ? client.additional_phones.filter((phone): phone is string => typeof phone === "string")
      : [];
    const sources = [
      { value: client.whatsapp || "", label: "WhatsApp" },
      { value: client.phone || "", label: "טלפון ראשי" },
      { value: client.phone_secondary || "", label: "טלפון נוסף" },
      ...additional.map((phone, index) => ({
        value: phone,
        label: `מספר נוסף ${index + 1}`,
      })),
    ];
    const candidates = sources.flatMap(({ value, label }) =>
      extractTaskMessagePhones(value).map((phone, index, phonesInSource) => ({
        value: phone,
        label: phonesInSource.length > 1 ? `${label} ${index + 1}` : label,
      })),
    );
    const seen = new Set<string>();
    return candidates.filter(({ value }) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }, [client]);

  const buildMessage = useCallback(
    (nextSettings: MessageSettings, nextClient: ClientContact) =>
      fillTaskMessageTemplate(nextSettings.message_template, {
        client_name: nextClient.name || "לקוח/ה",
        office_name: nextSettings.office_name || "המשרד",
        task_title: taskTitle,
        stage_name: stageName,
      }),
    [stageName, taskTitle],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const [clientResult, settingsResult] = await Promise.all([
        supabase
          .from("clients")
          .select("id,name,phone,phone_secondary,whatsapp,additional_phones")
          .eq("id", clientId)
          .single(),
        (supabase as any)
          .from("client_task_message_settings")
          .select("scope,office_name,message_template,default_channel,preview_before_send")
          .eq("scope", "default")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (clientResult.error || !clientResult.data) {
        toast({
          title: "לא ניתן לטעון את פרטי הלקוח",
          description: clientResult.error?.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const loadedClient = clientResult.data as ClientContact;
      const loadedSettings = settingsResult.data
        ? ({ ...DEFAULT_SETTINGS, ...settingsResult.data } as MessageSettings)
        : DEFAULT_SETTINGS;
      setClient(loadedClient);
      setSettings(loadedSettings);
      setChannel(loadedSettings.default_channel);
      setMessage(buildMessage(loadedSettings, loadedClient));
      const preferred = loadedSettings.default_channel === "whatsapp"
        ? loadedClient.whatsapp || loadedClient.phone
        : loadedClient.phone || loadedClient.phone_secondary;
      setPhoneNumber(extractTaskMessagePhones(preferred || "")[0] || "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [buildMessage, clientId, open]);

  useEffect(() => {
    if (!client) return;
    const preferred = channel === "whatsapp"
      ? client.whatsapp || client.phone
      : client.phone || client.phone_secondary;
    const preferredPhone = extractTaskMessagePhones(preferred || "")[0] || "";
    if (preferredPhone && !phones.some(({ value }) => value === normalizeTaskMessagePhone(phoneNumber))) {
      setPhoneNumber(preferredPhone);
    }
  }, [channel, client, phoneNumber, phones]);

  const saveSettings = async () => {
    if (!settings.message_template.trim()) {
      toast({ title: "תבנית ההודעה לא יכולה להיות ריקה", variant: "destructive" });
      return;
    }
    setSavingSettings(true);
    const { error } = await (supabase as any)
      .from("client_task_message_settings")
      .upsert(
        {
          ...settings,
          scope: "default",
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "scope" },
      );
    setSavingSettings(false);
    if (error) {
      toast({
        title: "שמירת התבנית נכשלה",
        description: "רק מנהל מערכת או מנהל יכול לשנות את התבנית המרכזית.",
        variant: "destructive",
      });
      return;
    }
    if (client) setMessage(buildMessage(settings, client));
    setChannel(settings.default_channel);
    setShowSettings(false);
    toast({ title: "תבנית ההודעות נשמרה לכל כפתורי המשימות" });
  };

  const openInApp = async () => {
    const phone = normalizeTaskMessagePhone(phoneNumber);
    if (!phone || !message.trim()) return;
    const appUrl = channel === "whatsapp"
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message.trim())}`
      : `sms:+${phone}?body=${encodeURIComponent(message.trim())}`;
    window.open(appUrl, "_blank", "noopener,noreferrer");
    if (user?.id) {
      await (supabase as any).from("client_task_message_log").insert({
        client_id: clientId,
        task_id: taskId,
        stage_name: stageName,
        channel,
        phone_number: `+${phone}`,
        message: message.trim(),
        status: "opened",
        provider: channel === "whatsapp" ? "whatsapp_link" : "sms_link",
        sent_by: user.id,
      });
    }
    toast({ title: channel === "whatsapp" ? "WhatsApp נפתח עם ההודעה" : "אפליקציית SMS נפתחה" });
  };

  const sendViaProvider = async () => {
    if (!phoneNumber || !message.trim()) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-client-task-message", {
      body: {
        clientId,
        taskId,
        channel,
        phoneNumber,
        message: message.trim(),
      },
    });
    setSending(false);
    if (error || !data?.success) {
      toast({
        title: "הספק לא הצליח לשלוח את ההודעה",
        description: data?.error || error?.message || "אפשר להשתמש בכפתור פתיחה באפליקציה.",
        variant: "destructive",
      });
      return;
    }
    if (data.mode === "provider") {
      toast({ title: "ההודעה נשלחה", description: `נשלח באמצעות ${data.provider || "הספק המוגדר"}` });
      setOpen(false);
    } else {
      toast({
        title: "לא הוגדר ספק לשליחה ישירה",
        description: "ההודעה מוכנה. לחץ על פתיחה באפליקציה כדי לשלוח אותה.",
      });
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn("h-6 w-6 p-0 text-[#1e3a5f] hover:bg-emerald-50 hover:text-emerald-600", className)}
        title="שלח ללקוח WhatsApp או SMS"
        aria-label="שלח ללקוח WhatsApp או SMS"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <MessageCircle className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-xl overflow-y-auto text-right">
          <DialogHeader className="text-right">
            <div className="flex items-start justify-between gap-3 pl-8">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5 text-[#d4a843]" />
                  הודעה ללקוח מתוך משימה
                </DialogTitle>
                <DialogDescription className="mt-1 text-right">
                  {client?.name || "טוען לקוח..."} · {stageName} · {taskTitle}
                </DialogDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant={showSettings ? "secondary" : "outline"}
                className="h-8 gap-1.5"
                onClick={() => setShowSettings((value) => !value)}
              >
                <Settings2 className="h-3.5 w-3.5" />
                תבנית קבועה
              </Button>
            </div>
          </DialogHeader>

          {showSettings ? (
            <div className="space-y-4 rounded-xl border border-[#d4a843]/50 bg-[#fef9ee] p-4">
              <div className="space-y-1.5">
                <Label htmlFor="task-message-office">שם המשרד</Label>
                <Input
                  id="task-message-office"
                  value={settings.office_name}
                  onChange={(event) => setSettings((current) => ({ ...current, office_name: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-message-template">תבנית לכל כפתורי המשימות</Label>
                <Textarea
                  id="task-message-template"
                  rows={7}
                  value={settings.message_template}
                  onChange={(event) => setSettings((current) => ({ ...current, message_template: event.target.value }))}
                />
                <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                  {["{client_name}", "{office_name}", "{task_title}", "{stage_name}"].map((placeholder) => (
                    <code key={placeholder} className="rounded bg-white px-1.5 py-0.5" dir="ltr">{placeholder}</code>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-message-default-channel">ערוץ ברירת מחדל</Label>
                <select
                  id="task-message-default-channel"
                  className="h-10 w-full rounded-md border bg-white px-3"
                  value={settings.default_channel}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    default_channel: event.target.value as MessageChannel,
                  }))}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <Button type="button" className="gap-2" disabled={savingSettings} onClick={() => void saveSettings()}>
                <Save className="h-4 w-4" />
                {savingSettings ? "שומר..." : "שמור כתבנית מרכזית"}
              </Button>
            </div>
          ) : (
            <div className={cn("space-y-4", loading && "pointer-events-none opacity-60")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="task-message-channel">ערוץ שליחה</Label>
                  <select
                    id="task-message-channel"
                    className="h-10 w-full rounded-md border bg-background px-3"
                    value={channel}
                    onChange={(event) => setChannel(event.target.value as MessageChannel)}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="task-message-phone">מספר של הלקוח</Label>
                  <select
                    id="task-message-phone"
                    className="h-10 w-full rounded-md border bg-background px-3"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    disabled={phones.length === 0}
                  >
                    {phones.length === 0 && <option value="">לא הוגדר מספר ללקוח</option>}
                    {phones.map(({ value, label }) => (
                      <option key={`${label}-${value}`} value={value}>{label} — {value}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-message-body">הודעה לפני שליחה</Label>
                <Textarea
                  id="task-message-body"
                  rows={8}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="כתוב הודעה ללקוח..."
                />
                <p className="text-[11px] text-slate-500">אפשר לערוך את ההודעה הנוכחית בלי לשנות את התבנית המרכזית.</p>
              </div>
            </div>
          )}

          {!showSettings && (
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-start">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={loading || !phoneNumber || !message.trim()}
                onClick={() => void openInApp()}
              >
                <MessageCircle className="h-4 w-4" />
                פתח ב־{channel === "whatsapp" ? "WhatsApp" : "SMS"}
              </Button>
              <Button
                type="button"
                className="gap-2 bg-[#1e3a5f] hover:bg-[#172f4e]"
                disabled={loading || sending || !phoneNumber || !message.trim()}
                onClick={() => void sendViaProvider()}
              >
                <Send className="h-4 w-4" />
                {sending ? "שולח..." : "שלח דרך המערכת"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TaskClientMessageButton;
