import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BookUser, BriefcaseBusiness, Check, Copy, MessageCircle, MessageSquareText, Plus, Save, Search, Send, Settings2, Star, Trash2, UserRound } from "lucide-react";
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
  normalizeTaskMessageTemplates,
  resolveDefaultTaskMessageTemplate,
  type TaskMessageTemplate,
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
  message_templates: TaskMessageTemplate[];
  default_template_id: string;
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

const DEFAULT_TEMPLATE: TaskMessageTemplate = {
  id: "default",
  name: "תבנית מרכזית",
  message_template:
    "שלום וברכה {client_name},\n{office_name} מבקש להשלים או לשלוח את הפריט הבא:\n{task_title}\nבמסגרת השלב: {stage_name}\nנשמח לעדכון לאחר הטיפול. תודה.",
  default_channel: "whatsapp",
};

const DEFAULT_SETTINGS: MessageSettings = {
  scope: "default",
  office_name: "משרד האדריכלים",
  message_template: DEFAULT_TEMPLATE.message_template,
  default_channel: "whatsapp",
  preview_before_send: true,
  message_templates: [DEFAULT_TEMPLATE],
  default_template_id: DEFAULT_TEMPLATE.id,
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
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE.id);
  const [editingTemplateId, setEditingTemplateId] = useState(DEFAULT_TEMPLATE.id);
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
    (nextSettings: MessageSettings, nextClient: ClientContact, template?: TaskMessageTemplate) =>
      fillTaskMessageTemplate(template?.message_template || nextSettings.message_template, {
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
          .select("scope,office_name,message_template,default_channel,preview_before_send,message_templates,default_template_id")
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
      const rawSettings = settingsResult.data
        ? ({ ...DEFAULT_SETTINGS, ...settingsResult.data } as MessageSettings)
        : DEFAULT_SETTINGS;
      const loadedTemplates = normalizeTaskMessageTemplates(rawSettings.message_templates, {
        ...DEFAULT_TEMPLATE,
        message_template: rawSettings.message_template || DEFAULT_TEMPLATE.message_template,
        default_channel: rawSettings.default_channel || DEFAULT_TEMPLATE.default_channel,
      });
      const loadedDefault = resolveDefaultTaskMessageTemplate(loadedTemplates, rawSettings.default_template_id);
      const loadedSettings: MessageSettings = {
        ...rawSettings,
        message_templates: loadedTemplates,
        default_template_id: loadedDefault.id,
        message_template: loadedDefault.message_template,
        default_channel: loadedDefault.default_channel,
      };
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
      setSelectedTemplateId(loadedDefault.id);
      setEditingTemplateId(loadedDefault.id);
      setChannel(loadedDefault.default_channel);
      setMessage(buildMessage(loadedSettings, loadedClient, loadedDefault));
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
    const cleanTemplates = settings.message_templates.map((template) => ({
      ...template,
      name: template.name.trim(),
      message_template: template.message_template.trim(),
    }));
    if (cleanTemplates.some((template) => !template.name || !template.message_template)) {
      toast({ title: "תבנית ההודעה לא יכולה להיות ריקה", variant: "destructive" });
      return;
    }
    const defaultTemplate = resolveDefaultTaskMessageTemplate(cleanTemplates, settings.default_template_id);
    const nextSettings = {
      ...settings,
      message_templates: cleanTemplates,
      default_template_id: defaultTemplate.id,
      message_template: defaultTemplate.message_template,
      default_channel: defaultTemplate.default_channel,
    };
    setSavingSettings(true);
    const { error } = await (supabase as any)
      .from("client_task_message_settings")
      .upsert(
        {
          ...nextSettings,
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
    setSettings(nextSettings);
    setSelectedTemplateId(defaultTemplate.id);
    if (client) setMessage(buildMessage(nextSettings, client, defaultTemplate));
    setChannel(defaultTemplate.default_channel);
    toast({ title: "ספריית התבניות וברירת המחדל נשמרו" });
  };

  const updateEditingTemplate = (patch: Partial<TaskMessageTemplate>) => {
    setSettings((current) => ({
      ...current,
      message_templates: current.message_templates.map((template) =>
        template.id === editingTemplateId ? { ...template, ...patch } : template,
      ),
    }));
  };

  const addTemplate = () => {
    const id = crypto.randomUUID();
    const template: TaskMessageTemplate = {
      ...DEFAULT_TEMPLATE,
      id,
      name: `תבנית חדשה ${settings.message_templates.length + 1}`,
    };
    setSettings((current) => ({ ...current, message_templates: [...current.message_templates, template] }));
    setEditingTemplateId(id);
  };

  const duplicateTemplate = () => {
    const source = settings.message_templates.find((template) => template.id === editingTemplateId);
    if (!source) return;
    const duplicate = { ...source, id: crypto.randomUUID(), name: `${source.name} - עותק` };
    setSettings((current) => ({ ...current, message_templates: [...current.message_templates, duplicate] }));
    setEditingTemplateId(duplicate.id);
  };

  const removeTemplate = () => {
    if (settings.message_templates.length <= 1) {
      toast({ title: "חייבת להישאר לפחות תבנית אחת", variant: "destructive" });
      return;
    }
    const remaining = settings.message_templates.filter((template) => template.id !== editingTemplateId);
    const nextDefaultId = settings.default_template_id === editingTemplateId ? remaining[0].id : settings.default_template_id;
    setSettings((current) => ({ ...current, message_templates: remaining, default_template_id: nextDefaultId }));
    setEditingTemplateId(remaining[0].id);
  };

  const chooseTemplateForMessage = (templateId: string) => {
    const template = settings.message_templates.find((item) => item.id === templateId);
    if (!template || !client) return;
    setSelectedTemplateId(template.id);
    setChannel(template.default_channel);
    setMessage(buildMessage(settings, client, template));
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

  const editingTemplate =
    settings.message_templates.find((template) => template.id === editingTemplateId) ||
    settings.message_templates[0];

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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-[#1e3a5f]">ספריית תבניות</h3>
                  <p className="text-xs text-slate-500">צור כמה תבניות ובחר איזו תיפתח אוטומטית.</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={addTemplate}>
                  <Plus className="h-3.5 w-3.5" /> תבנית חדשה
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {settings.message_templates.map((template) => {
                  const isDefault = settings.default_template_id === template.id;
                  const isEditing = editingTemplateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      className={cn(
                        "flex min-w-0 items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-right transition",
                        isEditing ? "border-[#d4a843] shadow-sm" : "hover:border-[#d4a843]/70",
                      )}
                      onClick={() => setEditingTemplateId(template.id)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#1e3a5f]">{template.name}</span>
                        <span className="block text-[11px] text-slate-500">{template.default_channel === "whatsapp" ? "WhatsApp" : "SMS"}</span>
                      </span>
                      {isDefault && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#f8e9b7] px-2 py-1 text-[10px] font-bold text-[#765b13]">
                          <Star className="h-3 w-3 fill-current" /> ברירת מחדל
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {editingTemplate && (
                <div className="space-y-4 rounded-xl border bg-white/70 p-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[220px] flex-1 space-y-1.5">
                      <Label htmlFor="task-message-template-name">שם התבנית</Label>
                      <Input
                        id="task-message-template-name"
                        value={editingTemplate.name}
                        onChange={(event) => updateEditingTemplate({ name: event.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={settings.default_template_id === editingTemplate.id ? "secondary" : "outline"}
                      className="gap-1.5"
                      onClick={() => setSettings((current) => ({ ...current, default_template_id: editingTemplate.id }))}
                    >
                      {settings.default_template_id === editingTemplate.id ? <Check className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                      {settings.default_template_id === editingTemplate.id ? "נבחרה כברירת מחדל" : "קבע כברירת מחדל"}
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="task-message-template">תוכן התבנית</Label>
                    <Textarea
                      id="task-message-template"
                      rows={7}
                      value={editingTemplate.message_template}
                      onChange={(event) => updateEditingTemplate({ message_template: event.target.value })}
                    />
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                      {["{client_name}", "{office_name}", "{task_title}", "{stage_name}"].map((placeholder) => (
                        <code key={placeholder} className="rounded bg-white px-1.5 py-0.5" dir="ltr">{placeholder}</code>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="task-message-default-channel">ערוץ של התבנית</Label>
                    <select
                      id="task-message-default-channel"
                      className="h-10 w-full rounded-md border bg-white px-3"
                      value={editingTemplate.default_channel}
                      onChange={(event) => updateEditingTemplate({ default_channel: event.target.value as MessageChannel })}
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={duplicateTemplate}>
                      <Copy className="h-3.5 w-3.5" /> שכפל
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="gap-1.5 text-red-600 hover:text-red-700" onClick={removeTemplate}>
                      <Trash2 className="h-3.5 w-3.5" /> מחק
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="task-message-office">שם המשרד</Label>
                <Input
                  id="task-message-office"
                  value={settings.office_name}
                  onChange={(event) => setSettings((current) => ({ ...current, office_name: event.target.value }))}
                />
              </div>
              <Button type="button" className="gap-2" disabled={savingSettings} onClick={() => void saveSettings()}>
                <Save className="h-4 w-4" />
                {savingSettings ? "שומר..." : "שמור את ספריית התבניות"}
              </Button>
            </div>
          ) : (
            <div className={cn("space-y-4", loading && "pointer-events-none opacity-60")}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="task-message-template-choice">תבנית הודעה</Label>
                  <span className="text-[11px] text-slate-500">אפשר להחליף בלי לשנות את ברירת המחדל</span>
                </div>
                <select
                  id="task-message-template-choice"
                  className="h-10 w-full rounded-md border bg-background px-3 font-medium text-[#1e3a5f]"
                  value={selectedTemplateId}
                  onChange={(event) => chooseTemplateForMessage(event.target.value)}
                >
                  {settings.message_templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}{settings.default_template_id === template.id ? " (ברירת מחדל)" : ""}
                    </option>
                  ))}
                </select>
              </div>
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
