// אשף עריכת תבנית הצעת מחיר למובייל - צעדים אנכיים, ללא גלילה אופקית
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Loader2,
  CloudUpload,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CATEGORIES, DEFAULT_DESIGN_SETTINGS } from "../types";
import type {
  QuoteTemplate,
  TemplateStage,
  PaymentStep,
  TimelineStep as TimelineStepType,
} from "../types";
import { TemplatePreviewDialog } from "../TemplatePreviewDialog";

interface Props {
  template: QuoteTemplate;
  onSave: (t: Partial<QuoteTemplate>) => Promise<any>;
  onClose: () => void;
}

const STEPS = [
  { id: "basics", title: "פרטים בסיסיים", desc: "שם, תיאור וקטגוריה" },
  { id: "design", title: "עיצוב ומיתוג", desc: "לוגו, צבעים ופרטי חברה" },
  { id: "stages", title: "שלבי העבודה", desc: "השלבים שיוצגו בהצעה" },
  { id: "payments", title: "תשלומים", desc: "אבני דרך לתשלום" },
  { id: "timeline", title: "לוח זמנים", desc: "שלבי הביצוע" },
  { id: "notes", title: "הערות ותנאים", desc: "תנאים, הערות והערות חשובות" },
  { id: "preview", title: "סיכום ותצוגה", desc: "בדיקה אחרונה" },
] as const;

type SaveState = "idle" | "saving" | "saved";

export function MobileTemplateWizard({ template, onSave, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<QuoteTemplate>(template);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showPreview, setShowPreview] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Sync external template id updates (e.g. after first save returns DB id)
  useEffect(() => {
    if (template.id !== data.id) {
      setData((prev) => ({ ...prev, id: template.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  const update = useCallback(<K extends keyof QuoteTemplate>(
    patch: Partial<QuoteTemplate>,
  ) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  // Auto-save debounced
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!data.name?.trim()) return; // need a name minimum
      setSaveState("saving");
      try {
        await onSave(data);
        setSaveState("saved");
        toast.success("נשמר אוטומטית", { duration: 1200 });
        setTimeout(() => setSaveState("idle"), 1500);
      } catch (e: any) {
        setSaveState("idle");
        toast.error("שמירה נכשלה", { description: e?.message });
      }
    }, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, onSave]);

  const progress = ((step + 1) / STEPS.length) * 100;

  const goNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else onClose();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    >
      {/* Top bar */}
      <div className="shrink-0 border-b bg-card">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted"
            aria-label="סגור"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 mx-3 text-center">
            <div className="text-sm font-semibold truncate">
              {data.name || "תבנית חדשה"}
            </div>
            <SaveIndicator state={saveState} />
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted"
            aria-label="תצוגה מקדימה"
          >
            <Eye className="h-5 w-5" />
          </button>
        </div>
        {/* Progress */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step header */}
        <div className="px-4 py-3">
          <div className="text-[11px] text-muted-foreground">
            צעד {step + 1} מתוך {STEPS.length}
          </div>
          <div className="text-base font-bold text-foreground">
            {STEPS[step].title}
          </div>
          <div className="text-xs text-muted-foreground">
            {STEPS[step].desc}
          </div>
        </div>
      </div>

      {/* Content - vertical scroll only */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 pb-32 w-full max-w-full">
          {STEPS[step].id === "basics" && (
            <BasicsStep data={data} update={update} />
          )}
          {STEPS[step].id === "design" && (
            <DesignStep data={data} update={update} />
          )}
          {STEPS[step].id === "stages" && (
            <StagesStep data={data} update={update} />
          )}
          {STEPS[step].id === "payments" && (
            <PaymentsStep data={data} update={update} />
          )}
          {STEPS[step].id === "timeline" && (
            <TimelineStep data={data} update={update} />
          )}
          {STEPS[step].id === "notes" && (
            <NotesStep data={data} update={update} />
          )}
          {STEPS[step].id === "preview" && (
            <PreviewStep
              data={data}
              onOpenPreview={() => setShowPreview(true)}
            />
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 border-t bg-card px-4 py-3 flex items-center gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          variant="outline"
          className="flex-1 h-12"
          onClick={goBack}
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          {step === 0 ? "סגור" : "הקודם"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="flex-1 h-12" onClick={goNext}>
            הבא
            <ArrowLeft className="h-4 w-4 mr-1" />
          </Button>
        ) : (
          <Button
            className="flex-1 h-12"
            onClick={async () => {
              setSaveState("saving");
              try {
                await onSave(data);
                toast.success("התבנית נשמרה");
                onClose();
              } catch (e: any) {
                toast.error("שמירה נכשלה", { description: e?.message });
              } finally {
                setSaveState("idle");
              }
            }}
          >
            <Check className="h-4 w-4 ml-1" />
            סיים ושמור
          </Button>
        )}
      </div>

      {showPreview && (
        <TemplatePreviewDialog
          template={data}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving")
    return (
      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> שומר...
      </div>
    );
  if (state === "saved")
    return (
      <div className="text-[10px] text-emerald-600 flex items-center justify-center gap-1">
        <CloudCheck className="h-3 w-3" /> נשמר
      </div>
    );
  return (
    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
      <CloudUpload className="h-3 w-3" /> שמירה אוטומטית פעילה
    </div>
  );
}

// ============== Steps ==============

function BasicsStep({
  data,
  update,
}: {
  data: QuoteTemplate;
  update: (p: Partial<QuoteTemplate>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="שם התבנית *">
        <Input
          value={data.name || ""}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="לדוגמה: הצעת מחיר לתכנון פנים"
          className="h-12"
        />
      </Field>
      <Field label="תיאור">
        <Textarea
          value={data.description || ""}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="תיאור קצר של התבנית"
          rows={3}
        />
      </Field>
      <Field label="קטגוריה">
        <Select
          value={data.category}
          onValueChange={(v) => update({ category: v })}
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="בחר קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="תוקף ההצעה (ימים)">
        <Input
          type="number"
          inputMode="numeric"
          value={data.validity_days || 30}
          onChange={(e) =>
            update({ validity_days: parseInt(e.target.value) || 30 })
          }
          className="h-12"
        />
      </Field>
    </div>
  );
}

function DesignStep({
  data,
  update,
}: {
  data: QuoteTemplate;
  update: (p: Partial<QuoteTemplate>) => void;
}) {
  const design = data.design_settings || DEFAULT_DESIGN_SETTINGS;
  const setDesign = (patch: Partial<typeof design>) =>
    update({ design_settings: { ...design, ...patch } });
  const setContact = (patch: Partial<typeof design.contact_info>) =>
    setDesign({ contact_info: { ...design.contact_info, ...patch } });

  return (
    <div className="space-y-4">
      <Field label="שם החברה">
        <Input
          value={design.company_name}
          onChange={(e) => setDesign({ company_name: e.target.value })}
          className="h-12"
        />
      </Field>
      <Field label="כותרת משנה">
        <Input
          value={design.company_subtitle}
          onChange={(e) => setDesign({ company_subtitle: e.target.value })}
          className="h-12"
        />
      </Field>
      <Field label="לוגו (URL)">
        <Input
          value={design.logo_url || ""}
          onChange={(e) => setDesign({ logo_url: e.target.value || null })}
          placeholder="https://..."
          dir="ltr"
          className="h-12"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="צבע ראשי">
          <ColorInput
            value={design.primary_color}
            onChange={(v) => setDesign({ primary_color: v })}
          />
        </Field>
        <Field label="צבע משני">
          <ColorInput
            value={design.secondary_color}
            onChange={(v) => setDesign({ secondary_color: v })}
          />
        </Field>
      </div>

      <Card className="p-3 space-y-3">
        <div className="text-sm font-semibold">פרטי קשר</div>
        <Input
          placeholder="טלפון"
          value={design.contact_info.phone}
          onChange={(e) => setContact({ phone: e.target.value })}
          className="h-11"
        />
        <Input
          placeholder="אימייל"
          value={design.contact_info.email}
          onChange={(e) => setContact({ email: e.target.value })}
          className="h-11"
          dir="ltr"
        />
        <Input
          placeholder="כתובת"
          value={design.contact_info.address}
          onChange={(e) => setContact({ address: e.target.value })}
          className="h-11"
        />
        <Input
          placeholder="אתר"
          value={design.contact_info.website}
          onChange={(e) => setContact({ website: e.target.value })}
          className="h-11"
          dir="ltr"
        />
      </Card>
    </div>
  );
}

function StagesStep({
  data,
  update,
}: {
  data: QuoteTemplate;
  update: (p: Partial<QuoteTemplate>) => void;
}) {
  const stages = data.stages || [];
  const setStages = (s: TemplateStage[]) => update({ stages: s });

  const addStage = () => {
    setStages([
      ...stages,
      {
        id: crypto.randomUUID(),
        name: `שלב ${stages.length + 1}`,
        items: [],
      },
    ]);
  };
  const updateStage = (id: string, patch: Partial<TemplateStage>) =>
    setStages(stages.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeStage = (id: string) =>
    setStages(stages.filter((s) => s.id !== id));

  return (
    <div className="space-y-4">
      <Field label="כותרת קטע השלבים">
        <Input
          value={data.stagesTitle || ""}
          onChange={(e) => update({ stagesTitle: e.target.value })}
          placeholder="שלבי העבודה"
          className="h-12"
        />
      </Field>

      {stages.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          טרם הוגדרו שלבים
        </Card>
      )}

      {stages.map((stage, idx) => (
        <Card key={stage.id} className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground w-6">
              #{idx + 1}
            </span>
            <Input
              value={stage.name}
              onChange={(e) =>
                updateStage(stage.id, { name: e.target.value })
              }
              className="h-10 flex-1"
              placeholder="שם השלב"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeStage(stage.id)}
              className="h-9 w-9 text-destructive shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <StageItemsEditor
            items={stage.items || []}
            onChange={(items) => updateStage(stage.id, { items })}
          />
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={addStage}
        className="w-full h-12 border-dashed"
      >
        <Plus className="h-4 w-4 ml-1" />
        הוסף שלב
      </Button>
    </div>
  );
}

function StageItemsEditor({
  items,
  onChange,
}: {
  items: any[];
  onChange: (items: any[]) => void;
}) {
  const add = () =>
    onChange([...items, { id: crypto.randomUUID(), text: "" }]);
  const upd = (id: string, text: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));
  const del = (id: string) => onChange(items.filter((i) => i.id !== id));

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={item.text || ""}
            onChange={(e) => upd(item.id, e.target.value)}
            placeholder="פריט בשלב..."
            className="h-9 flex-1 text-sm"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => del(item.id)}
            className="h-8 w-8 text-destructive shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={add}
        className="w-full h-9 text-xs"
      >
        <Plus className="h-3.5 w-3.5 ml-1" />
        הוסף פריט
      </Button>
    </div>
  );
}

function PaymentsStep({
  data,
  update,
}: {
  data: QuoteTemplate;
  update: (p: Partial<QuoteTemplate>) => void;
}) {
  const payments = data.payment_schedule || [];
  const set = (s: PaymentStep[]) => update({ payment_schedule: s });
  const total = payments.reduce((sum, p) => sum + (p.percentage || 0), 0);

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">סה״כ באחוזים</span>
          <span
            className={`font-bold ${total === 100 ? "text-emerald-600" : "text-amber-600"}`}
          >
            {total}%
          </span>
        </div>
      </Card>

      {payments.map((p, i) => (
        <Card key={p.id} className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground w-6">
              #{i + 1}
            </span>
            <Input
              type="number"
              inputMode="numeric"
              value={p.percentage}
              onChange={(e) =>
                set(
                  payments.map((x) =>
                    x.id === p.id
                      ? { ...x, percentage: parseInt(e.target.value) || 0 }
                      : x,
                  ),
                )
              }
              className="h-10 w-20"
            />
            <span className="text-sm">%</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => set(payments.filter((x) => x.id !== p.id))}
              className="h-9 w-9 text-destructive mr-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Input
            value={p.description}
            onChange={(e) =>
              set(
                payments.map((x) =>
                  x.id === p.id ? { ...x, description: e.target.value } : x,
                ),
              )
            }
            placeholder="תיאור התשלום"
            className="h-10"
          />
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={() =>
          set([
            ...payments,
            { id: crypto.randomUUID(), percentage: 0, description: "" },
          ])
        }
        className="w-full h-12 border-dashed"
      >
        <Plus className="h-4 w-4 ml-1" />
        הוסף שלב תשלום
      </Button>
    </div>
  );
}

function TimelineStep({
  data,
  update,
}: {
  data: QuoteTemplate;
  update: (p: Partial<QuoteTemplate>) => void;
}) {
  const timeline = data.timeline || [];
  const set = (t: TimelineStep[]) => update({ timeline: t });

  return (
    <div className="space-y-4">
      {timeline.map((t, i) => (
        <Card key={t.id} className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground w-6">
              #{i + 1}
            </span>
            <Input
              value={t.title}
              onChange={(e) =>
                set(
                  timeline.map((x) =>
                    x.id === t.id ? { ...x, title: e.target.value } : x,
                  ),
                )
              }
              placeholder="כותרת השלב"
              className="h-10 flex-1"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => set(timeline.filter((x) => x.id !== t.id))}
              className="h-9 w-9 text-destructive shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Input
            value={t.duration || ""}
            onChange={(e) =>
              set(
                timeline.map((x) =>
                  x.id === t.id ? { ...x, duration: e.target.value } : x,
                ),
              )
            }
            placeholder="משך (לדוגמה: שבועיים)"
            className="h-10"
          />
        </Card>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          set([...timeline, { id: crypto.randomUUID(), title: "", duration: "" }])
        }
        className="w-full h-12 border-dashed"
      >
        <Plus className="h-4 w-4 ml-1" />
        הוסף שלב בלוח זמנים
      </Button>
    </div>
  );
}

function NotesStep({
  data,
  update,
}: {
  data: QuoteTemplate;
  update: (p: Partial<QuoteTemplate>) => void;
}) {
  const importantNotes = data.important_notes || [];
  return (
    <div className="space-y-4">
      <Field label="הערות כלליות">
        <Textarea
          value={data.notes || ""}
          onChange={(e) => update({ notes: e.target.value })}
          rows={4}
          placeholder="הערות שיוצגו בתחתית ההצעה"
        />
      </Field>
      <Field label="תנאים והגבלות">
        <Textarea
          value={data.terms || ""}
          onChange={(e) => update({ terms: e.target.value })}
          rows={5}
          placeholder="תנאי תשלום, ביטול וכו'"
        />
      </Field>

      <Field label="הערות חשובות">
        <div className="space-y-2">
          {importantNotes.map((note, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={note}
                onChange={(e) => {
                  const arr = [...importantNotes];
                  arr[idx] = e.target.value;
                  update({ important_notes: arr });
                }}
                className="h-10 flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  update({
                    important_notes: importantNotes.filter((_, i) => i !== idx),
                  })
                }
                className="h-9 w-9 text-destructive shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => update({ important_notes: [...importantNotes, ""] })}
            className="w-full h-10 border-dashed"
          >
            <Plus className="h-4 w-4 ml-1" />
            הוסף הערה
          </Button>
        </div>
      </Field>

      <Card className="p-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">הצג מע״מ בהצעה</div>
          <div className="text-xs text-muted-foreground">
            {data.vat_rate || 18}%
          </div>
        </div>
        <Switch
          checked={data.show_vat ?? true}
          onCheckedChange={(v) => update({ show_vat: v })}
        />
      </Card>
    </div>
  );
}

function PreviewStep({
  data,
  onOpenPreview,
}: {
  data: QuoteTemplate;
  onOpenPreview: () => void;
}) {
  const rows: Array<[string, string | number]> = [
    ["שם", data.name || "—"],
    ["קטגוריה", CATEGORIES.find((c) => c.value === data.category)?.label || "—"],
    ["שלבים", data.stages?.length || 0],
    ["שלבי תשלום", data.payment_schedule?.length || 0],
    ["שלבי לוח זמנים", data.timeline?.length || 0],
    ["תוקף ההצעה", `${data.validity_days || 30} ימים`],
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="text-base font-bold">סיכום התבנית</div>
        <div className="divide-y">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </div>
      </Card>

      <Button
        onClick={onOpenPreview}
        variant="outline"
        className="w-full h-12"
      >
        <Eye className="h-4 w-4 ml-2" />
        פתח תצוגה מקדימה מלאה
      </Button>

      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="text-xs text-muted-foreground">
          ✓ התבנית נשמרת אוטומטית. לחיצה על "סיים ושמור" תסגור את האשף.
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 border rounded-md h-12 px-2 bg-background">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 rounded cursor-pointer bg-transparent border-0"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-0 h-8 px-1 text-xs flex-1"
        dir="ltr"
      />
    </div>
  );
}
