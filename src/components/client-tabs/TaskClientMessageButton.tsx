import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BookUser, BriefcaseBusiness, MessageCircle, MessageSquareText, Plus, Save, Search, Send, Settings2, UserRound } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
type RecipientType = "client" | "manual" | "consultant";

interface ClientContact {
  id: string;
  name: string;
  phone: string | null;
  phone_secondary: string | null;
  whatsapp: string | null;
  additional_phones: unknown;
  custom_data: unknown;
}

interface MessageSettings {
  scope: "default";
  office_name: string;
  message_template: string;
  default_channel: MessageChannel;
  preview_before_send: boolean;
}

interface ConsultantContact {
  id: string;
  name: string;
  profession: string;
  phone: string | null;
}

interface DirectoryPhone {
  id: string;
  source: "client" | "contact";
  name: string;
  context: string;
  phone: string;
  normalizedPhone: string;
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
  const [recipientType, setRecipientType] = useState<RecipientType>("client");
  const [consultants, setConsultants] = useState<ConsultantContact[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState("");
  const [showAddClientPhone, setShowAddClientPhone] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientPhoneLabel, setNewClientPhoneLabel] = useState("");
  const [savingClientPhone, setSavingClientPhone] = useState(false);
  const [directoryPhones, setDirectoryPhones] = useState<DirectoryPhone[]>([]);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState("");
  const [selectedDirectoryLabel, setSelectedDirectoryLabel] = useState("");

  const phones = useMemo(() => {
    if (!client) return [];
    const customData =
      client.custom_data &&
      typeof client.custom_data === "object" &&
      !Array.isArray(client.custom_data)
        ? (client.custom_data as Record<string, any>)
        : {};
    const storedPhoneLabels =
      customData.phone_labels &&
      typeof customData.phone_labels === "object"
        ? customData.phone_labels
        : {};
    const primaryLabel =
      typeof storedPhoneLabels.primary === "string"
        ? storedPhoneLabels.primary.trim()
        : "";
    const additionalLabels = Array.isArray(storedPhoneLabels.additional)
      ? storedPhoneLabels.additional
      : [];
    const additional = Array.isArray(client.additional_phones)
      ? client.additional_phones.filter((phone): phone is string => typeof phone === "string")
      : [];
    const sources = [
      {
        value: client.phone || "",
        label: primaryLabel || "טלפון ראשי",
      },
      { value: client.whatsapp || "", label: "WhatsApp" },
      { value: client.phone_secondary || "", label: "טלפון נוסף" },
      ...additional.map((phone, index) => ({
        value: phone,
        label:
          typeof additionalLabels[index] === "string" &&
          additionalLabels[index].trim()
            ? additionalLabels[index].trim()
            : `מספר נוסף ${index + 1}`,
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
      const [clientResult, settingsResult, consultantsResult, clientsDirectoryResult, contactsDirectoryResult] = await Promise.all([
        supabase
          .from("clients")
          .select("id,name,phone,phone_secondary,whatsapp,additional_phones,custom_data")
          .eq("id", clientId)
          .single(),
        (supabase as any)
          .from("client_task_message_settings")
          .select("scope,office_name,message_template,default_channel,preview_before_send")
          .eq("scope", "default")
          .maybeSingle(),
        supabase
          .from("consultants")
          .select("id,name,profession,phone")
          .not("phone", "is", null)
          .order("name"),
        supabase
          .from("clients")
          .select("id,name,phone,phone_secondary,whatsapp,additional_phones")
          .order("name")
          .limit(1000),
        supabase
          .from("client_contacts")
          .select("id,name,position,phone,mobile,client_id")
          .order("name")
          .limit(1000),
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
      setConsultants((consultantsResult.data || []) as ConsultantContact[]);
      const directoryItems: DirectoryPhone[] = [];
      for (const directoryClient of clientsDirectoryResult.data || []) {
        const rawPhones = [
          directoryClient.phone,
          directoryClient.whatsapp,
          directoryClient.phone_secondary,
          ...(Array.isArray(directoryClient.additional_phones) ? directoryClient.additional_phones : []),
        ];
        const seen = new Set<string>();
        for (const rawPhone of rawPhones) {
          for (const normalizedPhone of extractTaskMessagePhones(typeof rawPhone === "string" ? rawPhone : "")) {
            if (seen.has(normalizedPhone)) continue;
            seen.add(normalizedPhone);
            directoryItems.push({
              id: `${directoryClient.id}-${normalizedPhone}`,
              source: "client",
              name: directoryClient.name || "לקוח ללא שם",
              context: "לקוח",
              phone: typeof rawPhone === "string" ? rawPhone : normalizedPhone,
              normalizedPhone,
            });
          }
        }
      }
      for (const contact of contactsDirectoryResult.data || []) {
        const seen = new Set<string>();
        for (const rawPhone of [contact.mobile, contact.phone]) {
          for (const normalizedPhone of extractTaskMessagePhones(rawPhone || "")) {
            if (seen.has(normalizedPhone)) continue;
            seen.add(normalizedPhone);
            directoryItems.push({
              id: `${contact.id}-${normalizedPhone}`,
              source: "contact",
              name: contact.name || "איש קשר ללא שם",
              context: contact.position?.trim() || "איש קשר",
              phone: rawPhone || normalizedPhone,
              normalizedPhone,
            });
          }
        }
      }
      setDirectoryPhones(directoryItems);
      setRecipientType("client");
      setSelectedConsultantId("");
      setShowAddClientPhone(false);
      setDirectoryOpen(false);
      setDirectorySearch("");
      setSelectedDirectoryLabel("");
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
    if (!client || recipientType !== "client") return;
    const preferred = channel === "whatsapp"
      ? client.whatsapp || client.phone
      : client.phone || client.phone_secondary;
    const preferredPhone = extractTaskMessagePhones(preferred || "")[0] || "";
    if (preferredPhone && !phones.some(({ value }) => value === normalizeTaskMessagePhone(phoneNumber))) {
      setPhoneNumber(preferredPhone);
    }
  }, [channel, client, phoneNumber, phones, recipientType]);

  const selectConsultant = (consultantId: string) => {
    setSelectedConsultantId(consultantId);
    const consultant = consultants.find((item) => item.id === consultantId);
    setPhoneNumber(extractTaskMessagePhones(consultant?.phone || "")[0] || "");
  };

  const filteredDirectoryPhones = useMemo(() => {
    const query = directorySearch.trim().toLocaleLowerCase("he");
    if (!query) return directoryPhones;
    return directoryPhones.filter((entry) =>
      entry.name.toLocaleLowerCase("he").includes(query) ||
      entry.context.toLocaleLowerCase("he").includes(query) ||
      entry.phone.includes(query) ||
      entry.normalizedPhone.includes(query.replace(/\D/g, "")),
    );
  }, [directoryPhones, directorySearch]);

  const selectDirectoryPhone = (entry: DirectoryPhone) => {
    setPhoneNumber(entry.normalizedPhone);
    setSelectedDirectoryLabel(`${entry.name} · ${entry.context}`);
    setDirectoryOpen(false);
    setDirectorySearch("");
  };

  const saveClientPhone = async () => {
    if (!client) return;
    const normalized = normalizeTaskMessagePhone(newClientPhone);
    if (!normalized) {
      toast({ title: "יש להזין מספר טלפון תקין", variant: "destructive" });
      return;
    }
    const localPhone = normalized.startsWith("972")
      ? `0${normalized.slice(3)}`
      : newClientPhone.replace(/[^\d+]/g, "");
    const existing = Array.isArray(client.additional_phones)
      ? client.additional_phones.filter((value): value is string => typeof value === "string")
      : [];
    if (existing.some((value) => normalizeTaskMessagePhone(value) === normalized) ||
        phones.some(({ value }) => normalizeTaskMessagePhone(value) === normalized)) {
      setPhoneNumber(normalized);
      setShowAddClientPhone(false);
      toast({ title: "המספר כבר קיים אצל הלקוח ונבחר לשליחה" });
      return;
    }
    const customData = client.custom_data && typeof client.custom_data === "object" && !Array.isArray(client.custom_data)
      ? { ...(client.custom_data as Record<string, any>) }
      : {};
    const phoneLabels = customData.phone_labels && typeof customData.phone_labels === "object"
      ? { ...customData.phone_labels }
      : {};
    const labels = Array.isArray(phoneLabels.additional) ? [...phoneLabels.additional] : [];
    labels.push(newClientPhoneLabel.trim() || `מספר נוסף ${existing.length + 1}`);
    phoneLabels.additional = labels;
    customData.phone_labels = phoneLabels;

    setSavingClientPhone(true);
    const { error } = await supabase
      .from("clients")
      .update({ additional_phones: [...existing, localPhone], custom_data: customData } as any)
      .eq("id", client.id);
    setSavingClientPhone(false);
    if (error) {
      toast({ title: "שמירת המספר נכשלה", description: error.message, variant: "destructive" });
      return;
    }
    setClient({ ...client, additional_phones: [...existing, localPhone], custom_data: customData });
    setPhoneNumber(normalized);
    setNewClientPhone("");
    setNewClientPhoneLabel("");
    setShowAddClientPhone(false);
    toast({ title: "המספר נוסף ללקוח ונבחר לשליחה" });
  };

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
        recipientType,
        consultantId: recipientType === "consultant" ? selectedConsultantId : null,
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
              <div className="space-y-2">
                <Label>שליחה אל</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["client", "לקוח", UserRound],
                    ["manual", "מספר ידני", MessageCircle],
                    ["consultant", "בעל מקצוע", BriefcaseBusiness],
                  ] as const).map(([value, label, Icon]) => (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition",
                        recipientType === value
                          ? "border-[#d4a843] bg-[#1e3a5f] text-white"
                          : "bg-white text-[#1e3a5f] hover:bg-[#fef9ee]",
                      )}
                      onClick={() => {
                        setRecipientType(value);
                        if (value === "manual") {
                          setPhoneNumber("");
                          setSelectedDirectoryLabel("");
                        }
                        if (value === "client") setPhoneNumber(phones[0]?.value || "");
                        if (value === "consultant") selectConsultant(selectedConsultantId);
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
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
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="task-message-phone">
                      {recipientType === "client" ? "מספר של הלקוח" : recipientType === "consultant" ? "בחירת בעל מקצוע" : "מספר לשליחה"}
                    </Label>
                    {recipientType === "client" && (
                      <button type="button" className="flex items-center gap-1 text-[11px] font-semibold text-[#1e3a5f] hover:text-[#d4a843]" onClick={() => setShowAddClientPhone((value) => !value)}>
                        <Plus className="h-3 w-3" /> הוסף מספר
                      </button>
                    )}
                  </div>
                  {recipientType === "client" ? (
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
                  ) : recipientType === "consultant" ? (
                    <select
                      id="task-message-phone"
                      className="h-10 w-full rounded-md border bg-background px-3"
                      value={selectedConsultantId}
                      onChange={(event) => selectConsultant(event.target.value)}
                    >
                      <option value="">בחר בעל מקצוע...</option>
                      {consultants.map((consultant) => (
                        <option key={consultant.id} value={consultant.id}>
                          {consultant.name} · {consultant.profession} · {consultant.phone}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <Input
                          id="task-message-phone"
                          dir="ltr"
                          value={phoneNumber}
                          onChange={(event) => {
                            setPhoneNumber(event.target.value);
                            setSelectedDirectoryLabel("");
                          }}
                          placeholder="0501234567 או +972501234567"
                        />
                        <Popover open={directoryOpen} onOpenChange={setDirectoryOpen}>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" title="בחר מלקוחות או מאנשי קשר" aria-label="בחר מלקוחות או מאנשי קשר">
                              <BookUser className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent dir="rtl" align="end" keepInsideDialog className="w-[340px] p-0">
                            <div className="border-b p-3">
                              <div className="relative">
                                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                  autoFocus
                                  className="pr-9"
                                  value={directorySearch}
                                  onChange={(event) => setDirectorySearch(event.target.value)}
                                  placeholder="חפש לקוח, איש קשר או מספר..."
                                />
                              </div>
                            </div>
                            <ScrollArea className="h-72">
                              {filteredDirectoryPhones.length === 0 ? (
                                <div className="p-6 text-center text-sm text-slate-500">לא נמצאו מספרים תואמים</div>
                              ) : (
                                <div className="space-y-1 p-2">
                                  {filteredDirectoryPhones.map((entry) => (
                                    <button
                                      key={entry.id}
                                      type="button"
                                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-right transition hover:bg-[#fef9ee]"
                                      onClick={() => selectDirectoryPhone(entry)}
                                    >
                                      <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold text-[#1e3a5f]">{entry.name}</span>
                                        <span className="block truncate text-[11px] text-slate-500">{entry.source === "client" ? "לקוח" : entry.context}</span>
                                      </span>
                                      <span dir="ltr" className="shrink-0 text-xs font-medium text-slate-600">{entry.phone}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                            <div className="border-t px-3 py-2 text-[11px] text-slate-500">
                              {directoryPhones.length} מספרים מלקוחות ומאנשי קשר
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      {selectedDirectoryLabel && <p className="text-[11px] font-medium text-emerald-700">נבחר: {selectedDirectoryLabel}</p>}
                    </div>
                  )}
                </div>
              </div>
              {recipientType === "client" && showAddClientPhone && (
                <div className="grid gap-2 rounded-xl border border-[#d4a843]/50 bg-[#fef9ee] p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Input dir="ltr" value={newClientPhone} onChange={(event) => setNewClientPhone(event.target.value)} placeholder="מספר טלפון" />
                  <Input value={newClientPhoneLabel} onChange={(event) => setNewClientPhoneLabel(event.target.value)} placeholder="שם ליד המספר (אופציונלי)" />
                  <Button type="button" disabled={savingClientPhone || !newClientPhone.trim()} onClick={() => void saveClientPhone()}>
                    {savingClientPhone ? "שומר..." : "הוסף ובחר"}
                  </Button>
                </div>
              )}
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
