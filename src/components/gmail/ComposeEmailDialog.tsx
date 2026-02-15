// Enhanced Compose Email Dialog with:
// - Rich text editor
// - File attachments (any type including video, zip, etc.)
// - Voice recording
// - Email templates
// - Auto signature
// - Contact autocomplete
// - Emoji picker
// - Drag & drop files
// - Scheduled send
// - Drafts auto-save
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import DOMPurify from "dompurify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  Loader2,
  X,
  Plus,
  User,
  Paperclip,
  Mic,
  MicOff,
  Clock,
  FileText,
  Trash2,
  Square,
  LayoutTemplate,
  Pen,
  Save,
  ChevronDown,
  Volume2,
  File,
  Image,
  Film,
  Archive,
  FileSpreadsheet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  useGmailIntegration,
  EmailAttachment,
} from "@/hooks/useGmailIntegration";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { RichTextEditor, RichTextEditorRef } from "./RichTextEditor";
import { EmojiPicker } from "./EmojiPicker";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendSuccess?: () => void;
  replyTo?: {
    to: string;
    subject: string;
    quotedBody?: string;
    mode?: "reply" | "forward" | "replyAll";
  };
  draftId?: string;
}

// File type to icon mapping
const getFileIcon = (type: string) => {
  if (type.startsWith("image/"))
    return <Image className="h-4 w-4 text-green-500" />;
  if (type.startsWith("video/"))
    return <Film className="h-4 w-4 text-purple-500" />;
  if (type.startsWith("audio/"))
    return <Volume2 className="h-4 w-4 text-blue-500" />;
  if (
    type.includes("zip") ||
    type.includes("rar") ||
    type.includes("7z") ||
    type.includes("tar")
  )
    return <Archive className="h-4 w-4 text-yellow-500" />;
  if (type.includes("pdf"))
    return <FileText className="h-4 w-4 text-red-500" />;
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv"))
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  return <File className="h-4 w-4 text-gray-500" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface ContactSuggestion {
  email: string;
  name: string;
}

export const ComposeEmailDialog = ({
  open,
  onOpenChange,
  onSendSuccess,
  replyTo,
  draftId: initialDraftId,
}: ComposeEmailDialogProps) => {
  const { sendEmail, isSending } = useGmailIntegration();
  const { toast } = useToast();
  const voiceRecorder = useVoiceRecorder();
  const emailTemplates = useEmailTemplates();
  const editorRef = useRef<RichTextEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [to, setTo] = useState(replyTo?.to || "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(replyTo?.subject || "");
  const [bodyHtml, setBodyHtml] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);

  // Schedule state
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState("09:00");

  // Contact autocomplete
  const [contacts, setContacts] = useState<ContactSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<ContactSuggestion[]>([]);
  const [ccSuggestions, setCcSuggestions] = useState<ContactSuggestion[]>([]);
  const [bccSuggestions, setBccSuggestions] = useState<ContactSuggestion[]>([]);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [showCcSuggestions, setShowCcSuggestions] = useState(false);
  const [showBccSuggestions, setShowBccSuggestions] = useState(false);

  // Template save dialog
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Signature
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureHtml, setSignatureHtml] = useState("");

  // Drag & drop
  const [isDragOver, setIsDragOver] = useState(false);

  // Draft
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(
    initialDraftId,
  );

  // Load contacts from Supabase
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const { data: clients } = await supabase
          .from("clients")
          .select("name, email")
          .not("email", "is", null)
          .limit(500);
        if (clients) {
          setContacts(
            (clients as any[])
              .map((c: any) => ({
                email: c.email || "",
                name: c.name || "",
              }))
              .filter((c) => c.email),
          );
        }
      } catch (e) {
        // Silently fail
      }
    };
    if (open) loadContacts();
  }, [open]);

  // Apply default signature on open
  useEffect(() => {
    if (open && !replyTo && !initialDraftId) {
      const defaultSig = emailTemplates.getDefaultSignature();
      if (defaultSig && editorRef.current) {
        setTimeout(() => {
          editorRef.current?.setHTML(
            `<br/><br/><div style="border-top:1px solid #ccc;margin-top:16px;padding-top:8px;color:#666;">${defaultSig.html}</div>`,
          );
        }, 100);
      }
    }
  }, [open, replyTo, initialDraftId, emailTemplates]);

  // Load draft on open
  useEffect(() => {
    if (open && initialDraftId) {
      const draft = emailTemplates.drafts.find((d) => d.id === initialDraftId);
      if (draft) {
        setTo(draft.to);
        setCc(draft.cc);
        setBcc(draft.bcc);
        setSubject(draft.subject);
        if (draft.cc) setShowCc(true);
        if (draft.bcc) setShowBcc(true);
        setTimeout(() => editorRef.current?.setHTML(draft.body), 100);
      }
    }
  }, [open, initialDraftId, emailTemplates.drafts]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!open) return;
    autoSaveTimerRef.current = setInterval(() => {
      if (to || subject || bodyHtml) {
        const draft = emailTemplates.saveDraft(
          {
            to,
            cc,
            bcc,
            subject,
            body: bodyHtml,
            attachmentNames: attachments.map((a) => a.name),
          },
          currentDraftId,
        );
        setCurrentDraftId(draft.id);
      }
    }, 30000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [
    open,
    to,
    cc,
    bcc,
    subject,
    bodyHtml,
    attachments,
    currentDraftId,
    emailTemplates,
  ]);

  // Set replyTo data when dialog opens, reset when it closes
  useEffect(() => {
    if (open) {
      // When opening with replyTo data (reply/forward), populate fields
      if (replyTo) {
        setTo(replyTo.to || "");
        setSubject(replyTo.subject || "");
        // Set quoted body for reply/forward
        if (replyTo.quotedBody) {
          setBodyHtml(replyTo.quotedBody);
        }
      }
    } else {
      // Reset everything when closing
      setTo("");
      setSubject("");
      setBodyHtml("");
      setCc("");
      setBcc("");
      setShowCc(false);
      setShowBcc(false);
      setAttachments([]);
      setShowSchedule(false);
      setScheduleDate(undefined);
      setShowTemplateSave(false);
      setCurrentDraftId(initialDraftId);
      voiceRecorder.cancelRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, replyTo, initialDraftId]);

  // Contact filtering
  const filterContacts = useCallback(
    (query: string): ContactSuggestion[] => {
      if (!query || query.length < 2) return [];
      const lastEmail = query.split(",").pop()?.trim().toLowerCase() || "";
      if (!lastEmail || lastEmail.length < 2) return [];
      return contacts
        .filter(
          (c) =>
            c.email.toLowerCase().includes(lastEmail) ||
            c.name.toLowerCase().includes(lastEmail),
        )
        .slice(0, 5);
    },
    [contacts],
  );

  const handleToChange = (value: string) => {
    setTo(value);
    const suggestions = filterContacts(value);
    setToSuggestions(suggestions);
    setShowToSuggestions(suggestions.length > 0);
  };

  // Chip helpers: parse comma-separated into chips array + current typing text
  const parseChips = (value: string) => {
    const parts = value.split(",").map((p) => p.trim());
    const chips = parts.slice(0, -1).filter(Boolean);
    const typing = parts[parts.length - 1] || "";
    return { chips, typing };
  };

  const removeChip = (field: "to" | "cc" | "bcc", index: number) => {
    const setter = field === "to" ? setTo : field === "cc" ? setCc : setBcc;
    setter((prev) => {
      const { chips, typing } = parseChips(prev);
      chips.splice(index, 1);
      const base = chips.length > 0 ? chips.join(", ") + ", " : "";
      return base + typing;
    });
  };

  const handleChipKeyDown = (
    field: "to" | "cc" | "bcc",
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    const value = (e.target as HTMLInputElement).value;
    if ((e.key === "Enter" || e.key === "Tab") && value) {
      e.preventDefault();
      const setter = field === "to" ? setTo : field === "cc" ? setCc : setBcc;
      const { chips, typing } = parseChips(
        field === "to" ? to : field === "cc" ? cc : bcc,
      );
      if (typing.trim() && typing.includes("@")) {
        chips.push(typing.trim());
        setter(chips.join(", ") + ", ");
        if (field === "to") {
          setShowToSuggestions(false);
        }
        if (field === "cc") {
          setShowCcSuggestions(false);
        }
        if (field === "bcc") {
          setShowBccSuggestions(false);
        }
      }
    }
    if (e.key === "Backspace" && !value) {
      // Remove last chip if input empty
      const setter = field === "to" ? setTo : field === "cc" ? setCc : setBcc;
      const current = field === "to" ? to : field === "cc" ? cc : bcc;
      const { chips } = parseChips(current);
      if (chips.length > 0) {
        chips.pop();
        setter(chips.length > 0 ? chips.join(", ") + ", " : "");
      }
    }
  };

  // Render chip-style field
  const renderChipField = (
    field: "to" | "cc" | "bcc",
    value: string,
    onChange: (v: string) => void,
    suggestions: ContactSuggestion[],
    showSuggestions: boolean,
    onFocus: () => void,
    onBlur: () => void,
  ) => {
    const { chips, typing } = parseChips(value);
    return (
      <div className="relative">
        <div
          className="flex flex-wrap items-center gap-1 border rounded-md px-2 py-1 min-h-[36px] bg-background focus-within:ring-1 focus-within:ring-ring"
          dir="ltr"
        >
          {chips.map((chip, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="gap-1 text-xs h-6 px-2 shrink-0"
            >
              {chip}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(field, i);
                }}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <input
            type="text"
            value={typing}
            onChange={(e) => {
              const newVal =
                chips.length > 0
                  ? chips.join(", ") + ", " + e.target.value
                  : e.target.value;
              onChange(newVal);
            }}
            onKeyDown={(e) => handleChipKeyDown(field, e)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={chips.length === 0 ? "example@email.com" : ""}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm h-6"
            dir="ltr"
            disabled={isSending}
          />
        </div>
        {renderSuggestions(suggestions, showSuggestions, field)}
      </div>
    );
  };

  const selectContact = (
    field: "to" | "cc" | "bcc",
    contact: ContactSuggestion,
  ) => {
    const setter = field === "to" ? setTo : field === "cc" ? setCc : setBcc;
    setter((prev) => {
      const parts = prev
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      parts.pop();
      parts.push(contact.email);
      return parts.join(", ") + ", ";
    });
    setShowToSuggestions(false);
    setShowCcSuggestions(false);
    setShowBccSuggestions(false);
  };

  // File handling
  const readFileAsBase64 = (
    file: globalThis.File,
  ): Promise<EmailAttachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] || "";
        resolve({
          name: file.name,
          type: file.type || "application/octet-stream",
          data: base64,
          size: file.size,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addFiles = useCallback(
    async (files: FileList | globalThis.File[]) => {
      const fileArray = Array.from(files);
      const totalSize = attachments.reduce((s, a) => s + a.size, 0);
      const newSize = fileArray.reduce((s, f) => s + f.size, 0);

      if (totalSize + newSize > 25 * 1024 * 1024) {
        toast({
          title: "חריגה מגודל מקסימלי",
          description: "הגודל המקסימלי לקבצים מצורפים הוא 25MB",
          variant: "destructive",
        });
        return;
      }

      try {
        const newAttachments = await Promise.all(
          fileArray.map(readFileAsBase64),
        );
        setAttachments((prev) => [...prev, ...newAttachments]);
        toast({ title: `${newAttachments.length} קבצים צורפו בהצלחה` });
      } catch (error) {
        toast({ title: "שגיאה בקריאת קובץ", variant: "destructive" });
      }
    },
    [attachments, toast],
  );

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      await addFiles(e.dataTransfer.files);
    }
  };

  // Voice recording
  const handleVoiceRecord = async () => {
    if (voiceRecorder.isRecording) {
      voiceRecorder.stopRecording();
    } else {
      const started = await voiceRecorder.startRecording();
      if (!started) {
        toast({
          title: "שגיאה בגישה למיקרופון",
          description: "יש לאפשר גישה למיקרופון בדפדפן",
          variant: "destructive",
        });
      }
    }
  };

  const attachVoiceRecording = async () => {
    const base64 = await voiceRecorder.getBase64();
    if (base64 && voiceRecorder.audioBlob) {
      const attachment: EmailAttachment = {
        name: `voice_message_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")}.webm`,
        type: voiceRecorder.audioBlob.type || "audio/webm",
        data: base64,
        size: voiceRecorder.audioBlob.size,
      };
      setAttachments((prev) => [...prev, attachment]);
      voiceRecorder.cancelRecording();
      toast({ title: "הקלטה קולית צורפה" });
    }
  };

  // Template operations
  const applyTemplate = (template: (typeof emailTemplates.templates)[0]) => {
    setSubject(template.subject);
    editorRef.current?.setHTML(template.body);
    setBodyHtml(template.body);
  };

  const saveAsTemplate = () => {
    if (!templateName.trim()) return;
    emailTemplates.saveTemplate({
      name: templateName,
      subject,
      body: bodyHtml,
    });
    setShowTemplateSave(false);
    setTemplateName("");
    toast({ title: "תבנית נשמרה בהצלחה" });
  };

  // Signature operations
  const saveSignature = () => {
    if (!signatureName.trim() || !signatureHtml.trim()) return;
    emailTemplates.saveSignature({
      name: signatureName,
      html: signatureHtml,
      isDefault: emailTemplates.signatures.length === 0,
    });
    setShowSignatureEditor(false);
    setSignatureName("");
    setSignatureHtml("");
    toast({ title: "חתימה נשמרה" });
  };

  const insertSignature = (sig: (typeof emailTemplates.signatures)[0]) => {
    const current = editorRef.current?.getHTML() || "";
    editorRef.current?.setHTML(
      current +
        `<br/><div style="border-top:1px solid #ccc;margin-top:16px;padding-top:8px;color:#666;">${sig.html}</div>`,
    );
  };

  // Send handler
  const handleSend = async (scheduled?: boolean) => {
    if (!to.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין כתובת נמען",
        variant: "destructive",
      });
      return;
    }
    if (!subject.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין נושא",
        variant: "destructive",
      });
      return;
    }

    const htmlBody = editorRef.current?.getHTML() || bodyHtml;
    if (!htmlBody.trim() || htmlBody === "<br>") {
      toast({
        title: "שגיאה",
        description: "יש להזין תוכן להודעה",
        variant: "destructive",
      });
      return;
    }

    let scheduledAt: Date | undefined;
    if (scheduled && scheduleDate) {
      scheduledAt = new Date(scheduleDate);
      const [hours, minutes] = scheduleTime.split(":").map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);
    }

    const success = await sendEmail({
      to: to.trim(),
      subject: subject.trim(),
      body: htmlBody,
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      scheduledAt,
    });

    if (success) {
      if (currentDraftId) {
        emailTemplates.deleteDraft(currentDraftId);
      }
      onSendSuccess?.();
      onOpenChange(false);
    }
  };

  // Manual draft save
  const saveDraftManually = () => {
    const draft = emailTemplates.saveDraft(
      {
        to,
        cc,
        bcc,
        subject,
        body: editorRef.current?.getHTML() || bodyHtml,
        attachmentNames: attachments.map((a) => a.name),
      },
      currentDraftId,
    );
    setCurrentDraftId(draft.id);
    toast({ title: "טיוטה נשמרה" });
  };

  // Emoji insert
  const handleEmojiSelect = (emoji: string) => {
    editorRef.current?.insertText(emoji);
  };

  // Total attachment size
  const totalAttachmentSize = useMemo(
    () => attachments.reduce((sum, a) => sum + a.size, 0),
    [attachments],
  );

  // Render contact suggestions dropdown
  const renderSuggestions = (
    suggestions: ContactSuggestion[],
    show: boolean,
    field: "to" | "cc" | "bcc",
  ) => {
    if (!show || suggestions.length === 0) return null;
    return (
      <div className="absolute z-50 top-full left-0 right-0 bg-background border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
        {suggestions.map((contact, i) => (
          <button
            key={i}
            className="w-full text-right px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
            onClick={() => selectContact(field, contact)}
            type="button"
          >
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{contact.name}</span>
            <span className="text-muted-foreground text-xs" dir="ltr">
              {contact.email}
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-4xl max-h-[95vh] overflow-hidden flex flex-col",
          isDragOver && "ring-2 ring-primary ring-dashed",
        )}
        dir="rtl"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {replyTo
              ? replyTo.mode === "forward"
                ? "העברת מייל"
                : replyTo.mode === "replyAll"
                  ? "השב לכולם"
                  : "תשובה למייל"
              : "הודעה חדשה"}
          </DialogTitle>
          <DialogDescription>
            שלח מייל ישירות דרך חשבון Gmail שלך
          </DialogDescription>
        </DialogHeader>

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-primary/10 z-40 flex items-center justify-center rounded-lg border-2 border-dashed border-primary pointer-events-none">
            <div className="bg-background/90 rounded-lg p-6 text-center">
              <Paperclip className="h-10 w-10 mx-auto mb-2 text-primary" />
              <p className="text-lg font-medium">שחרר כאן לצירוף הקובץ</p>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-2">
            {/* Toolbar row */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* Templates dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    תבניות
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {emailTemplates.templates.length === 0 && (
                    <DropdownMenuItem disabled>
                      אין תבניות שמורות
                    </DropdownMenuItem>
                  )}
                  {emailTemplates.templates.map((tpl) => (
                    <DropdownMenuItem
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                    >
                      <FileText className="h-3.5 w-3.5 ml-2" />
                      {tpl.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 mr-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          emailTemplates.deleteTemplate(tpl.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowTemplateSave(true)}>
                    <Save className="h-3.5 w-3.5 ml-2" />
                    שמור כתבנית
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Signature dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                  >
                    <Pen className="h-3.5 w-3.5" />
                    חתימה
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {emailTemplates.signatures.map((sig) => (
                    <DropdownMenuItem
                      key={sig.id}
                      onClick={() => insertSignature(sig)}
                    >
                      {sig.name}
                      {sig.isDefault && (
                        <Badge variant="secondary" className="mr-2 text-[10px]">
                          ברירת מחדל
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 mr-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          emailTemplates.deleteSignature(sig.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowSignatureEditor(true)}
                  >
                    <Plus className="h-3.5 w-3.5 ml-2" />
                    חתימה חדשה
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Save draft */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={saveDraftManually}
                    >
                      <Save className="h-3.5 w-3.5" />
                      טיוטה
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    שמירה ידנית כטיוטה (שמירה אוטומטית כל 30 שניות)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Drafts list */}
              {emailTemplates.drafts.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      טיוטות ({emailTemplates.drafts.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-w-xs">
                    {emailTemplates.drafts.map((draft) => (
                      <DropdownMenuItem
                        key={draft.id}
                        onClick={() => {
                          setTo(draft.to);
                          setCc(draft.cc);
                          setBcc(draft.bcc);
                          setSubject(draft.subject);
                          setTimeout(
                            () => editorRef.current?.setHTML(draft.body),
                            50,
                          );
                          setCurrentDraftId(draft.id);
                        }}
                      >
                        <div className="truncate">
                          <p className="text-xs font-medium truncate">
                            {draft.subject || "(ללא נושא)"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(draft.savedAt).toLocaleString("he-IL")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 mr-auto flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            emailTemplates.deleteDraft(draft.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Template save inline */}
            {showTemplateSave && (
              <div className="flex items-center gap-2 bg-accent/50 p-2 rounded-md">
                <Input
                  placeholder="שם התבנית..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="h-7 text-sm flex-1"
                />
                <Button
                  size="sm"
                  className="h-7"
                  onClick={saveAsTemplate}
                  disabled={!templateName.trim()}
                >
                  שמור
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => setShowTemplateSave(false)}
                >
                  ביטול
                </Button>
              </div>
            )}

            {/* Signature editor inline - WYSIWYG */}
            {showSignatureEditor && (
              <div className="bg-accent/50 p-3 rounded-md space-y-2">
                <Input
                  placeholder="שם החתימה..."
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="h-7 text-sm"
                />
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[80px] border rounded bg-background p-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                  dir="rtl"
                  data-placeholder="כתוב כאן את החתימה..."
                  style={{ direction: "rtl" }}
                  onInput={(e) =>
                    setSignatureHtml((e.target as HTMLDivElement).innerHTML)
                  }
                  dangerouslySetInnerHTML={
                    signatureHtml ? undefined : { __html: "" }
                  }
                />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>עיצוב: Ctrl+B מודגש, Ctrl+I נטוי, Ctrl+U קו תחתון</span>
                </div>
                {signatureHtml && (
                  <div
                    className="p-2 border rounded bg-background text-sm border-dashed"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(signatureHtml),
                    }}
                  />
                )}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="h-7"
                    onClick={saveSignature}
                    disabled={!signatureName.trim() || !signatureHtml.trim()}
                  >
                    שמור חתימה
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => setShowSignatureEditor(false)}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            )}

            {/* To Field with chips + autocomplete */}
            <div className="space-y-1">
              <Label htmlFor="to" className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5" />
                אל <span className="text-red-500">*</span>
              </Label>
              {renderChipField(
                "to",
                to,
                handleToChange,
                toSuggestions,
                showToSuggestions,
                () => setShowToSuggestions(toSuggestions.length > 0),
                () => setTimeout(() => setShowToSuggestions(false), 200),
              )}
            </div>

            {/* CC/BCC Toggle */}
            <div className="flex gap-2">
              {!showCc && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(true)}
                  className="text-xs h-6"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  CC
                </Button>
              )}
              {!showBcc && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBcc(true)}
                  className="text-xs h-6"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  BCC
                </Button>
              )}
            </div>

            {/* CC Field */}
            {showCc && (
              <div className="space-y-1">
                <Label className="flex items-center justify-between text-sm">
                  <span>עותק (CC)</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      setShowCc(false);
                      setCc("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Label>
                {renderChipField(
                  "cc",
                  cc,
                  (v) => {
                    setCc(v);
                    const s = filterContacts(v);
                    setCcSuggestions(s);
                    setShowCcSuggestions(s.length > 0);
                  },
                  ccSuggestions,
                  showCcSuggestions,
                  () => {},
                  () => setTimeout(() => setShowCcSuggestions(false), 200),
                )}
              </div>
            )}

            {/* BCC Field */}
            {showBcc && (
              <div className="space-y-1">
                <Label className="flex items-center justify-between text-sm">
                  <span>עותק סמוי (BCC)</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      setShowBcc(false);
                      setBcc("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Label>
                {renderChipField(
                  "bcc",
                  bcc,
                  (v) => {
                    setBcc(v);
                    const s = filterContacts(v);
                    setBccSuggestions(s);
                    setShowBccSuggestions(s.length > 0);
                  },
                  bccSuggestions,
                  showBccSuggestions,
                  () => {},
                  () => setTimeout(() => setShowBccSuggestions(false), 200),
                )}
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1">
              <Label htmlFor="subject" className="text-sm">
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

            {/* Rich Text Editor */}
            <div className="space-y-1">
              <Label className="text-sm">
                תוכן <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                ref={editorRef}
                onChange={setBodyHtml}
                placeholder="כתוב את תוכן ההודעה כאן..."
                disabled={isSending}
                minHeight="200px"
              />
            </div>

            {/* Voice recorder */}
            {(voiceRecorder.isRecording || voiceRecorder.audioUrl) && (
              <div className="bg-accent/50 rounded-lg p-3 space-y-2">
                {voiceRecorder.isRecording ? (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium">מקליט...</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {Math.floor(voiceRecorder.duration / 60)}:
                      {(voiceRecorder.duration % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                    <div className="mr-auto flex gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => voiceRecorder.cancelRecording()}
                      >
                        <X className="h-3.5 w-3.5 ml-1" />
                        ביטול
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => voiceRecorder.stopRecording()}
                      >
                        <Square className="h-3.5 w-3.5 ml-1" />
                        עצור
                      </Button>
                    </div>
                  </div>
                ) : (
                  voiceRecorder.audioUrl && (
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-4 w-4 text-blue-500" />
                      <audio
                        src={voiceRecorder.audioUrl}
                        controls
                        className="flex-1 h-8"
                      />
                      <Button
                        variant="default"
                        size="sm"
                        onClick={attachVoiceRecording}
                      >
                        <Paperclip className="h-3.5 w-3.5 ml-1" />
                        צרף
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => voiceRecorder.cancelRecording()}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Attachments list */}
            {attachments.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    קבצים מצורפים ({attachments.length})
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(totalAttachmentSize)} / 25 MB
                  </span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-accent/30 rounded px-2 py-1.5 text-sm"
                    >
                      {getFileIcon(att.type)}
                      <span className="truncate flex-1">{att.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatFileSize(att.size)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 flex-shrink-0"
                        onClick={() => removeAttachment(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="w-full h-1.5 bg-accent rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      totalAttachmentSize > 20 * 1024 * 1024
                        ? "bg-red-500"
                        : totalAttachmentSize > 15 * 1024 * 1024
                          ? "bg-yellow-500"
                          : "bg-green-500",
                    )}
                    style={{
                      width: `${Math.min((totalAttachmentSize / (25 * 1024 * 1024)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Scheduled send */}
            {showSchedule && (
              <div className="bg-accent/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">שליחה מתוזמנת</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 mr-auto"
                    onClick={() => setShowSchedule(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-2 items-start">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                  <div className="space-y-1">
                    <Label className="text-xs">שעה</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="h-8 w-28"
                    />
                    {scheduleDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ישלח ב-{scheduleDate.toLocaleDateString("he-IL")} בשעה{" "}
                        {scheduleTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="*/*"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {/* Bottom action bar */}
        <div className="flex items-center gap-1 pt-3 border-t flex-shrink-0">
          <Button
            onClick={() => handleSend(showSchedule)}
            disabled={isSending || !to.trim() || !subject.trim()}
            className="min-w-20"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                שולח...
              </>
            ) : showSchedule && scheduleDate ? (
              <>
                <Clock className="h-4 w-4 ml-1" />
                תזמן
              </>
            ) : (
              <>
                <Send className="h-4 w-4 ml-1" />
                שלח
              </>
            )}
          </Button>

          <Separator orientation="vertical" className="h-8 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>צרף קובץ (כל סוג)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={voiceRecorder.isRecording ? "destructive" : "ghost"}
                  size="icon"
                  onClick={handleVoiceRecord}
                  disabled={isSending}
                >
                  {voiceRecorder.isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {voiceRecorder.isRecording ? "עצור הקלטה" : "הקלט הודעה קולית"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <EmojiPicker onSelect={handleEmojiSelect} />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showSchedule ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setShowSchedule(!showSchedule)}
                  disabled={isSending}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>שליחה מתוזמנת</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="mr-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
