// CommitteeQuestionsBoard - "שאלות לוועדה" board shown at the bottom of every
// client folder (e.g. "שינוי תב״ע", "היתר בניה"). Each question has the
// committee's answer, an open/answered status and attached files.
// Files go to the public "client-files" bucket; their metadata is kept in the
// row's `attachments` json array.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  CircleHelp,
  FileText,
  Loader2,
  MessageSquareText,
  Paperclip,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABLE = "client_folder_committee_questions";
const BUCKET = "client-files";

export interface CommitteeAttachment {
  path: string;
  url: string;
  name: string;
  size: number;
  type: string;
  uploaded_at: string;
}

export interface CommitteeQuestion {
  id: string;
  client_id: string;
  folder_id: string;
  question: string;
  answer: string | null;
  status: "open" | "answered";
  attachments: CommitteeAttachment[];
  sort_order: number;
  created_at: string;
}

function safeStorageName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot + 1).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) : "";
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand}${ext ? `.${ext}` : ""}`;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} ב׳`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ק״ב`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} מ״ב`;
}

interface Props {
  clientId: string;
  folderId: string;
  folderName?: string;
}

export function CommitteeQuestionsBoard({ clientId, folderId, folderName }: Props) {
  const [questions, setQuestions] = useState<CommitteeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [adding, setAdding] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(TABLE as any)
      .select("*")
      .eq("folder_id", folderId)
      .order("sort_order")
      .order("created_at");
    if (error) {
      console.error("[CommitteeQuestions] load failed", error);
      setQuestions([]);
    } else {
      setQuestions(
        ((data as any[]) || []).map((q) => ({
          ...q,
          attachments: Array.isArray(q.attachments) ? q.attachments : [],
        })),
      );
    }
    setLoading(false);
  }, [folderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchLocal = (id: string, patch: Partial<CommitteeQuestion>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const save = async (id: string, patch: Partial<CommitteeQuestion>) => {
    patchLocal(id, patch);
    const { error } = await supabase.from(TABLE as any).update(patch as any).eq("id", id);
    if (error) {
      console.error("[CommitteeQuestions] update failed", error);
      toast({ title: "שגיאה", description: "השינוי לא נשמר", variant: "destructive" });
      void load();
    }
  };

  const addQuestion = async () => {
    const text = newQuestion.trim();
    if (!text) return;
    setAdding(true);
    const nextOrder = questions.reduce((m, q) => Math.max(m, q.sort_order), -1) + 1;
    const { data, error } = await supabase
      .from(TABLE as any)
      .insert({ client_id: clientId, folder_id: folderId, question: text, sort_order: nextOrder } as any)
      .select()
      .single();
    setAdding(false);
    if (error || !data) {
      console.error("[CommitteeQuestions] insert failed", error);
      toast({ title: "שגיאה", description: "לא ניתן להוסיף את השאלה", variant: "destructive" });
      return;
    }
    setQuestions((prev) => [...prev, { ...(data as any), attachments: [] }]);
    setNewQuestion("");
  };

  const deleteQuestion = async (q: CommitteeQuestion) => {
    if (!window.confirm("למחוק את השאלה וכל הקבצים שלה?")) return;
    const { error } = await supabase.from(TABLE as any).delete().eq("id", q.id);
    if (error) {
      toast({ title: "שגיאה", description: "לא ניתן למחוק את השאלה", variant: "destructive" });
      return;
    }
    if (q.attachments.length > 0) {
      await supabase.storage.from(BUCKET).remove(q.attachments.map((a) => a.path));
    }
    setQuestions((prev) => prev.filter((x) => x.id !== q.id));
  };

  const uploadFiles = async (q: CommitteeQuestion, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingId(q.id);
    const added: CommitteeAttachment[] = [];
    for (const file of Array.from(files)) {
      const path = `committee/${clientId}/${folderId}/${q.id}/${safeStorageName(file.name)}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (error) {
        console.error("[CommitteeQuestions] upload failed", error);
        toast({ title: "שגיאה בהעלאה", description: file.name, variant: "destructive" });
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      added.push({
        path,
        url: data.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploaded_at: new Date().toISOString(),
      });
    }
    setUploadingId(null);
    if (added.length > 0) {
      await save(q.id, { attachments: [...q.attachments, ...added] });
      toast({ title: added.length === 1 ? "הקובץ הועלה" : `${added.length} קבצים הועלו` });
    }
  };

  const removeAttachment = async (q: CommitteeQuestion, att: CommitteeAttachment) => {
    if (!window.confirm(`להסיר את הקובץ "${att.name}"?`)) return;
    await save(q.id, { attachments: q.attachments.filter((a) => a.path !== att.path) });
    await supabase.storage.from(BUCKET).remove([att.path]);
  };

  const openCount = questions.filter((q) => q.status === "open").length;

  return (
    <Card dir="rtl" className="border-2 border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareText className="h-5 w-5 text-amber-600" />
          שאלות לוועדה{folderName ? ` – ${folderName}` : ""}
          <Badge variant="secondary" className="mr-1">{questions.length}</Badge>
          {openCount > 0 && (
            <Badge className="bg-amber-500 text-white hover:bg-amber-500">{openCount} פתוחות</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> טוען שאלות...
          </div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">עדיין אין שאלות לוועדה בתיקייה הזו.</p>
        ) : (
          <ol className="space-y-3">
            {questions.map((q, index) => {
              const answered = q.status === "answered";
              return (
                <li
                  key={q.id}
                  className={cn(
                    "rounded-lg border bg-background p-3 space-y-2",
                    answered ? "border-green-500/40" : "border-amber-500/40",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-2 text-sm font-bold text-muted-foreground w-6 shrink-0">{index + 1}.</span>
                    <Textarea
                      defaultValue={q.question}
                      rows={2}
                      className="flex-1 min-h-0 resize-y font-medium"
                      placeholder="השאלה לוועדה..."
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== q.question) void save(q.id, { question: v });
                      }}
                    />
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={cn(
                          "h-8 gap-1 text-xs",
                          answered
                            ? "border-green-500/50 text-green-700 bg-green-500/10"
                            : "border-amber-500/50 text-amber-700 bg-amber-500/10",
                        )}
                        title="לחץ לשינוי המצב"
                        onClick={() => void save(q.id, { status: answered ? "open" : "answered" })}
                      >
                        {answered ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleHelp className="h-3.5 w-3.5" />}
                        {answered ? "נענתה" : "פתוחה"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-destructive hover:text-destructive"
                        title="מחק שאלה"
                        onClick={() => void deleteQuestion(q)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pr-8">
                    <Textarea
                      defaultValue={q.answer || ""}
                      rows={2}
                      className="min-h-0 resize-y text-sm bg-muted/30"
                      placeholder="תשובת הוועדה..."
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (v !== (q.answer || "")) {
                          void save(q.id, {
                            answer: v || null,
                            ...(v.trim() && !answered ? { status: "answered" as const } : {}),
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="pr-8 flex flex-wrap items-center gap-2">
                    {q.attachments.map((att) => (
                      <span
                        key={att.path}
                        className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-1 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-48 truncate hover:underline"
                          title={`${att.name} (${formatSize(att.size)})`}
                        >
                          {att.name}
                        </a>
                        <button
                          type="button"
                          className="opacity-60 hover:opacity-100 hover:text-destructive"
                          title="הסר קובץ"
                          onClick={() => void removeAttachment(q, att)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      ref={(el) => (fileInputs.current[q.id] = el)}
                      onChange={(e) => {
                        void uploadFiles(q, e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      disabled={uploadingId === q.id}
                      onClick={() => fileInputs.current[q.id]?.click()}
                    >
                      {uploadingId === q.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Paperclip className="h-3.5 w-3.5" />
                      )}
                      {uploadingId === q.id ? "מעלה..." : "צרף קבצים"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {/* New question */}
        <div className="flex items-start gap-2 pt-1">
          <Textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            rows={2}
            className="flex-1 min-h-0 resize-y"
            placeholder="שאלה חדשה לוועדה..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void addQuestion();
              }
            }}
          />
          <Button
            type="button"
            className="gap-1 bg-amber-500 hover:bg-amber-600 text-white"
            disabled={adding || !newQuestion.trim()}
            onClick={() => void addQuestion()}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            הוסף שאלה
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
