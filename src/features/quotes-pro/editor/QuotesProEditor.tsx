// Quotes Pro — עורך המסמך: בלוקים + מפקח + תצוגה מקדימה חיה
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRight,
  Plus,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Eye,
  History,
  Share2,
  Palette,
  Layers,
  User,
  Pencil,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDocument, createDocument, updateDocument } from "../data/api";
import { createBlock, createEmptyDocument, QP_BLOCK_CATALOG } from "../model/defaults";
import { composeDocumentHtml } from "../render/composeDocument";
import { applyEditPath } from "../render/renderBlock";
import { BlockInspector } from "./BlockInspector";
import { InlineEditFrame } from "./InlineEditFrame";
import { BlockList } from "./BlockList";
import { ThemePanel } from "./ThemePanel";
import { StripsPanel } from "./StripsPanel";
import { MetaPanel } from "./MetaPanel";
import { ShareDialog } from "./ShareDialog";
import { PagedPreviewDialog } from "../preview/PagedPreviewDialog";
import { VersionsDialog } from "./VersionsDialog";
import type { QPBlock, QPBlockType, QPDocument, QPTheme } from "../model/types";

const BLOCK_LABEL: Record<QPBlockType, string> = QP_BLOCK_CATALOG.reduce(
  (acc, b) => ({ ...acc, [b.type]: b.label }),
  {} as Record<QPBlockType, string>,
);

export function QuotesProEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doc, setDoc] = useState<QPDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<"blocks" | "theme" | "details">("blocks");
  const [editMode, setEditMode] = useState(false);
  const [editSession, setEditSession] = useState(0); // refresh ה-frame בכניסה מחדש
  const dirtyRef = useRef(false);

  // טעינה
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!id || id === "new") {
          const created = await createDocument({
            ...createEmptyDocument(),
            name: "הצעת מחיר חדשה",
          });
          if (cancelled) return;
          navigate(`/quotes-pro/editor/${created.id}`, { replace: true });
          return;
        }
        const loaded = await getDocument(id);
        if (cancelled) return;
        if (!loaded) {
          toast({ title: "ההצעה לא נמצאה", variant: "destructive" });
          navigate("/quotes-pro", { replace: true });
          return;
        }
        setDoc(loaded);
        setSelectedId(loaded.blocks[0]?.id ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // שמירה אוטומטית (debounce)
  useEffect(() => {
    if (!doc || !dirtyRef.current) return;
    const t = setTimeout(() => void save(false), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  const previewHtml = useMemo(() => (doc ? composeDocumentHtml(doc) : ""), [doc]);

  const mutate = (patch: Partial<QPDocument>) => {
    dirtyRef.current = true;
    setDoc((d) => (d ? { ...d, ...patch } : d));
  };

  const updateBlock = (block: QPBlock) => {
    if (!doc) return;
    mutate({ blocks: doc.blocks.map((b) => (b.id === block.id ? block : b)) });
  };

  // עריכה ישירה מתוך התצוגה (inline) — מיישם נתיב על הבלוק
  const handleInlineEdit = (blockId: string, path: string, value: string) => {
    setDoc((d) => {
      if (!d) return d;
      dirtyRef.current = true;
      return {
        ...d,
        blocks: d.blocks.map((b) => (b.id === blockId ? applyEditPath(b, path, value) : b)),
      };
    });
  };

  const addBlock = (type: QPBlockType) => {
    if (!doc) return;
    const b = createBlock(type);
    mutate({ blocks: [...doc.blocks, b] });
    setSelectedId(b.id);
  };

  const removeBlock = (blockId: string) => {
    if (!doc) return;
    mutate({ blocks: doc.blocks.filter((b) => b.id !== blockId) });
    if (selectedId === blockId) setSelectedId(null);
  };

  const reorderBlocks = (blocks: QPBlock[]) => mutate({ blocks });

  const toggleHidden = (blockId: string) => {
    if (!doc) return;
    mutate({
      blocks: doc.blocks.map((b) => (b.id === blockId ? { ...b, hidden: !b.hidden } : b)),
    });
  };

  const setTheme = (theme: QPTheme) => mutate({ theme });
  const setStrips = (strips: QPDocument["strips"]) => mutate({ strips });
  const setMeta = (meta: QPDocument["meta"]) => mutate({ meta });
  const setPricing = (pricing: QPDocument["pricing"]) => mutate({ pricing });

  // שלבי עבודה זמינים (מכל בלוקי stages) — לקישור שלבי תשלום
  const availableStages = (doc?.blocks ?? []).flatMap((b) =>
    b.type === "stages"
      ? b.stages.filter((s) => !s.isSection).map((s) => ({ id: s.id, name: s.name }))
      : [],
  );

  const save = async (showToast = true) => {
    if (!doc) return;
    setSaving(true);
    try {
      await updateDocument(doc.id, doc);
      dirtyRef.current = false;
      if (showToast) toast({ title: "נשמר בהצלחה" });
    } catch (e: any) {
      toast({ title: "שגיאה בשמירה", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !doc) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedBlock = doc.blocks.find((b) => b.id === selectedId) || null;

  return (
    <div dir="rtl" className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 pb-3 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate("/quotes-pro")}>
          <ArrowRight className="h-4 w-4 ml-1" />
          חזרה
        </Button>
        <Input
          value={doc.name}
          onChange={(e) => mutate({ name: e.target.value })}
          className="max-w-xs font-semibold"
          placeholder="שם ההצעה"
        />
        <div className="flex-1" />
        {dirtyRef.current && <span className="text-xs text-muted-foreground">שינויים לא שמורים…</span>}
        <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
          <Share2 className="h-4 w-4 ml-1" />
          שתף
        </Button>
        <Button variant="outline" size="sm" onClick={() => setVersionsOpen(true)}>
          <History className="h-4 w-4 ml-1" />
          גרסאות
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
          <Eye className="h-4 w-4 ml-1" />
          תצוגה / PDF
        </Button>
        <Button
          onClick={() => save(true)}
          disabled={saving}
          className="bg-[#d8ac27] hover:bg-[#c49b22] text-white"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
          שמור
        </Button>
      </div>

      <PagedPreviewDialog doc={doc} open={previewOpen} onOpenChange={setPreviewOpen} />
      <VersionsDialog
        doc={doc}
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
        onRestore={(snapshot) => mutate(snapshot)}
      />
      <ShareDialog
        doc={doc}
        open={shareOpen}
        onOpenChange={setShareOpen}
        onChanged={(patch) => setDoc((d) => (d ? { ...d, ...patch } : d))}
      />

      {/* 3 panes */}
      <div className="flex-1 grid grid-cols-12 gap-3 pt-3 overflow-hidden">
        {/* Left panel: Blocks / Theme tabs */}
        <div className="col-span-3 flex flex-col overflow-hidden border rounded-md">
          <div className="flex items-center border-b bg-muted/40">
            <button
              onClick={() => setLeftTab("blocks")}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm ${
                leftTab === "blocks" ? "font-semibold border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              <Layers className="h-4 w-4" />
              בלוקים
            </button>
            <button
              onClick={() => setLeftTab("theme")}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm ${
                leftTab === "theme" ? "font-semibold border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              <Palette className="h-4 w-4" />
              עיצוב
            </button>
            <button
              onClick={() => setLeftTab("details")}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm ${
                leftTab === "details" ? "font-semibold border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              <User className="h-4 w-4" />
              לקוח
            </button>
          </div>

          {leftTab === "blocks" ? (
            <>
              <div className="flex items-center justify-end px-2 py-1.5 border-b">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7">
                      <Plus className="h-4 w-4 ml-1" />
                      הוסף בלוק
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
                    {QP_BLOCK_CATALOG.map((b) => (
                      <DropdownMenuItem key={b.type} onClick={() => addBlock(b.type)}>
                        <div>
                          <div className="text-sm font-medium">{b.label}</div>
                          <div className="text-xs text-muted-foreground">{b.description}</div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <BlockList
                  blocks={doc.blocks}
                  labels={BLOCK_LABEL}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRemove={removeBlock}
                  onToggleHidden={toggleHidden}
                  onReorder={reorderBlocks}
                />
              </div>
            </>
          ) : leftTab === "theme" ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <ThemePanel theme={doc.theme} onChange={setTheme} />
              <div className="border-t pt-4">
                <StripsPanel strips={doc.strips} onChange={setStrips} />
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3">
              <MetaPanel meta={doc.meta} onChange={setMeta} />
            </div>
          )}
        </div>

        {/* Inspector */}
        <div className="col-span-4 overflow-y-auto border rounded-md p-3">
          {selectedBlock ? (
            <>
              <div className="text-sm font-semibold mb-3 pb-2 border-b">
                עריכת: {BLOCK_LABEL[selectedBlock.type]}
              </div>
              <BlockInspector
                block={selectedBlock}
                onChange={updateBlock}
                availableStages={availableStages}
                pricing={doc.pricing}
                onPricingChange={setPricing}
              />
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">בחר בלוק לעריכה</div>
          )}
        </div>

        {/* Live preview / inline edit */}
        <div className="col-span-5 overflow-hidden border rounded-md bg-muted/30 flex flex-col">
          <div className="px-3 py-2 border-b bg-muted/40 flex items-center justify-between">
            <span className="text-sm font-semibold">{editMode ? "עריכה ישירה" : "תצוגה מקדימה"}</span>
            <Button
              size="sm"
              variant={editMode ? "default" : "outline"}
              className={`h-7 ${editMode ? "bg-[#d8ac27] hover:bg-[#c49b22] text-white" : ""}`}
              onClick={() => {
                if (!editMode) setEditSession((s) => s + 1);
                setEditMode((v) => !v);
              }}
            >
              <Pencil className="h-3.5 w-3.5 ml-1" />
              {editMode ? "סיים עריכה" : "עריכה ישירה"}
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {editMode ? (
              <InlineEditFrame key={editSession} doc={doc} onEdit={handleInlineEdit} />
            ) : (
              <iframe title="preview" srcDoc={previewHtml} className="w-full h-full bg-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
