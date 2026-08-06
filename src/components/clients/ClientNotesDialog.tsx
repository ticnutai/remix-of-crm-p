// Multi-notes dialog for client profile - add / edit / delete notes with timestamps and categories
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Check, X, Pencil, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ClientNote {
  id: string;
  text: string;
  category: string;
  created_at: string;
  updated_at?: string;
}

export const NOTE_CATEGORIES = [
  "כללי",
  "חשוב",
  "פגישה",
  "שיחת טלפון",
  "תשלום",
  "מסמכים",
  "תכנון",
] as const;

const CATEGORY_CLASS: Record<string, string> = {
  "כללי": "bg-muted text-muted-foreground border-border",
  "חשוב": "bg-destructive/10 text-destructive border-destructive/30",
  "פגישה": "bg-primary/10 text-primary border-primary/30",
  "שיחת טלפון": "bg-accent text-accent-foreground border-border",
  "תשלום": "bg-secondary text-secondary-foreground border-border",
  "מסמכים": "bg-muted text-foreground border-border",
  "תכנון": "bg-border-gold/15 text-border-gold border-border-gold/40",
};

/** Parses the raw notes column: JSON array (new format) or plain text (legacy). */
export function parseClientNotes(raw?: string | null): ClientNote[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        return arr
          .filter((n) => n && typeof n.text === "string")
          .map((n, i) => ({
            id: String(n.id ?? `${i}-${n.created_at ?? ""}`),
            text: n.text,
            category: n.category || "כללי",
            created_at: n.created_at || new Date().toISOString(),
            updated_at: n.updated_at,
          }));
      }
    } catch {
      /* fall through to legacy */
    }
  }
  return [
    {
      id: "legacy",
      text: raw,
      category: "כללי",
      created_at: new Date(0).toISOString(),
    },
  ];
}

export function serializeClientNotes(notes: ClientNote[]): string | null {
  return notes.length ? JSON.stringify(notes) : null;
}

function formatStamp(iso: string) {
  const d = new Date(iso);
  if (!iso || d.getTime() <= 0) return "ללא תאריך";
  const date = d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric" });
  const time = `${d.getHours()}:${d.getMinutes()}`;
  return `${date} • ${time}`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: ClientNote[];
  onSave: (notes: ClientNote[]) => Promise<void> | void;
}

export function ClientNotesDialog({ open, onOpenChange, notes, onSave }: Props) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftCategory, setDraftCategory] = useState<string>("כללי");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState<string>("כללי");
  const [filter, setFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () => [...notes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [notes],
  );
  const visible = filter === "all" ? sorted : sorted.filter((n) => n.category === filter);

  const persist = async (next: ClientNote[], msg: string) => {
    setSaving(true);
    try {
      await onSave(next);
      toast({ title: msg });
    } catch {
      toast({ title: "שגיאה", description: "לא ניתן לשמור הערות", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!draft.trim()) return;
    const now = new Date().toISOString();
    const note: ClientNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: draft.trim(),
      category: draftCategory,
      created_at: now,
    };
    await persist([note, ...notes], "ההערה נוספה");
    setDraft("");
    setAdding(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editText.trim()) return;
    const next = notes.map((n) =>
      n.id === id ? { ...n, text: editText.trim(), category: editCategory, updated_at: new Date().toISOString() } : n,
    );
    await persist(next, "ההערה עודכנה");
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await persist(notes.filter((n) => n.id !== id), "ההערה נמחקה");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] rtl" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>הערות לקוח ({notes.length})</span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 border-border-gold/40 text-border-gold hover:bg-border-gold/10"
              onClick={() => setAdding((v) => !v)}
            >
              <Plus className="h-4 w-4" />
              הערה חדשה
            </Button>
          </DialogTitle>
        </DialogHeader>

        {adding && (
          <div className="space-y-2 rounded-lg border border-border-gold/40 bg-muted/30 p-3">
            <Select value={draftCategory} onValueChange={setDraftCategory}>
              <SelectTrigger className="h-9 text-right">
                <SelectValue placeholder="סיווג" />
              </SelectTrigger>
              <SelectContent className="rtl">
                {NOTE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="כתוב הערה..."
              className="min-h-[90px] resize-none text-right"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving || !draft.trim()}>
                <Check className="h-4 w-4" /> שמור
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
              >
                <X className="h-4 w-4" /> ביטול
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge
            onClick={() => setFilter("all")}
            className={`cursor-pointer border ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            הכל
          </Badge>
          {NOTE_CATEGORIES.filter((c) => notes.some((n) => n.category === c)).map((c) => (
            <Badge
              key={c}
              onClick={() => setFilter(c)}
              className={`cursor-pointer border ${filter === c ? "bg-primary text-primary-foreground" : CATEGORY_CLASS[c]}`}
            >
              {c}
            </Badge>
          ))}
        </div>

        <ScrollArea className="h-[340px] pl-2">
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">אין הערות - לחץ על "הערה חדשה"</p>
          ) : (
            <div className="space-y-2">
              {visible.map((note) => (
                <div key={note.id} className="rounded-lg border border-border/60 bg-card p-3 text-right">
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Select value={editCategory} onValueChange={setEditCategory}>
                        <SelectTrigger className="h-9 text-right">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rtl">
                          {NOTE_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[80px] resize-none text-right"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(note.id)} disabled={saving}>
                          <Check className="h-4 w-4" /> עדכן
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" /> ביטול
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <Badge className={`border text-xs ${CATEGORY_CLASS[note.category] || CATEGORY_CLASS["כללי"]}`}>
                          {note.category}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditingId(note.id);
                              setEditText(note.text);
                              setEditCategory(note.category);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(note.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{note.text}</p>
                      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatStamp(note.created_at)}</span>
                        {note.updated_at && <span>(עודכן {formatStamp(note.updated_at)})</span>}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default ClientNotesDialog;
