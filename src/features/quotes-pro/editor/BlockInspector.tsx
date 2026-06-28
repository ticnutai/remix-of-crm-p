// Quotes Pro — מפקח בלוק: עריכת שדות לפי סוג הבלוק
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { LogoUploadField } from "./LogoUploadField";
import type { QPBlock, QPPricingConfig } from "../model/types";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

interface Props {
  block: QPBlock;
  onChange: (block: QPBlock) => void;
  /** שלבי עבודה זמינים (מבלוקי stages) — לקישור שלבי תשלום */
  availableStages?: Array<{ id: string; name: string }>;
  /** תצורת תמחור ברמת המסמך (מע"מ) */
  pricing?: QPPricingConfig;
  onPricingChange?: (pricing: QPPricingConfig) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function BlockInspector({ block, onChange, availableStages = [], pricing, onPricingChange }: Props) {
  // עזר לעדכון שדה ברמת הבלוק
  const set = (patch: Partial<QPBlock>) => onChange({ ...block, ...patch } as QPBlock);

  switch (block.type) {
    case "header":
      return (
        <div className="space-y-3">
          <Field label="שם החברה">
            <Input value={block.companyName} onChange={(e) => set({ companyName: e.target.value } as any)} />
          </Field>
          <Field label="כותרת משנה">
            <Input value={block.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value } as any)} />
          </Field>
          <LogoUploadField
            value={block.logoUrl}
            onChange={(v) => set({ logoUrl: v } as any)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Field label="טלפון">
              <Input value={block.contact.phone || ""} onChange={(e) => set({ contact: { ...block.contact, phone: e.target.value } } as any)} />
            </Field>
            <Field label="אימייל">
              <Input value={block.contact.email || ""} onChange={(e) => set({ contact: { ...block.contact, email: e.target.value } } as any)} />
            </Field>
            <Field label="כתובת">
              <Input value={block.contact.address || ""} onChange={(e) => set({ contact: { ...block.contact, address: e.target.value } } as any)} />
            </Field>
            <Field label="אתר">
              <Input value={block.contact.website || ""} onChange={(e) => set({ contact: { ...block.contact, website: e.target.value } } as any)} />
            </Field>
          </div>
          <Field label="סגנון">
            <select
              className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              value={block.variant}
              onChange={(e) => set({ variant: e.target.value } as any)}
            >
              <option value="gradient">גרדיאנט</option>
              <option value="solid">צבע אחיד</option>
              <option value="minimal">מינימלי</option>
              <option value="modern">מודרני</option>
              <option value="classic">קלאסי</option>
            </select>
          </Field>
        </div>
      );

    case "stages":
      return (
        <div className="space-y-3">
          <Field label="כותרת">
            <Input value={block.title || ""} onChange={(e) => set({ title: e.target.value } as any)} />
          </Field>
          {block.stages.map((stage, si) => (
            <div key={stage.id} className="border rounded-md p-2 space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  className="h-8"
                  value={stage.name}
                  onChange={(e) => {
                    const stages = [...block.stages];
                    stages[si] = { ...stage, name: e.target.value };
                    set({ stages } as any);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => set({ stages: block.stages.filter((_, i) => i !== si) } as any)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {stage.items.map((it, ii) => (
                <div key={it.id} className="flex gap-2 items-center pr-3">
                  <Input
                    className="h-8 text-sm"
                    value={it.text}
                    onChange={(e) => {
                      const stages = [...block.stages];
                      const items = [...stage.items];
                      items[ii] = { ...it, text: e.target.value };
                      stages[si] = { ...stage, items };
                      set({ stages } as any);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => {
                      const stages = [...block.stages];
                      stages[si] = { ...stage, items: stage.items.filter((_, i) => i !== ii) };
                      set({ stages } as any);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const stages = [...block.stages];
                  stages[si] = { ...stage, items: [...stage.items, { id: uid(), text: "פריט חדש" }] };
                  set({ stages } as any);
                }}
              >
                <Plus className="h-3 w-3 ml-1" />
                פריט
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              set({
                stages: [
                  ...block.stages,
                  { id: uid(), name: "שלב חדש", itemDisplayMode: "check", items: [] },
                ],
              } as any)
            }
          >
            <Plus className="h-4 w-4 ml-1" />
            שלב חדש
          </Button>
        </div>
      );

    case "priceTable":
      return (
        <div className="space-y-3">
          <Field label="כותרת">
            <Input value={block.title || ""} onChange={(e) => set({ title: e.target.value } as any)} />
          </Field>
          <div className="flex items-center gap-2">
            <Switch checked={block.showVat} onCheckedChange={(v) => set({ showVat: v } as any)} />
            <Label className="text-sm">הצג מע״מ</Label>
          </div>
          {pricing && onPricingChange && (
            <div className="border rounded-md p-2 space-y-2 bg-muted/30">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">שיעור מע״מ %</Label>
                  <Input
                    type="number"
                    className="h-8"
                    value={pricing.vatRate}
                    onChange={(e) => onPricingChange({ ...pricing, vatRate: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">תצוגת מע״מ</Label>
                  <select
                    className="w-full h-8 rounded-md border bg-background px-2 text-sm"
                    value={pricing.vatDisplay}
                    onChange={(e) => onPricingChange({ ...pricing, vatDisplay: e.target.value as QPPricingConfig["vatDisplay"] })}
                  >
                    <option value="breakdown">פירוט מע״מ</option>
                    <option value="plus-vat">+ מע״מ</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          {block.items.map((it, i) => (
            <div key={it.id} className="border rounded-md p-2 space-y-1.5">
              <Input
                className="h-8"
                placeholder="תיאור"
                value={it.description}
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...it, description: e.target.value };
                  set({ items } as any);
                }}
              />
              <div className="grid grid-cols-3 gap-1.5">
                <Input
                  className="h-8" type="number" placeholder="כמות"
                  value={it.quantity}
                  onChange={(e) => {
                    const items = [...block.items];
                    const quantity = Number(e.target.value) || 0;
                    items[i] = { ...it, quantity, total: quantity * it.unitPrice };
                    set({ items } as any);
                  }}
                />
                <Input
                  className="h-8" placeholder="יחידה"
                  value={it.unit}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...it, unit: e.target.value };
                    set({ items } as any);
                  }}
                />
                <Input
                  className="h-8" type="number" placeholder="מחיר"
                  value={it.unitPrice}
                  onChange={(e) => {
                    const items = [...block.items];
                    const unitPrice = Number(e.target.value) || 0;
                    items[i] = { ...it, unitPrice, total: it.quantity * unitPrice };
                    set({ items } as any);
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">סה״כ: {it.total.toLocaleString()}</span>
                <Button
                  variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                  onClick={() => set({ items: block.items.filter((_, x) => x !== i) } as any)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline" size="sm"
            onClick={() =>
              set({
                items: [
                  ...block.items,
                  { id: uid(), description: "פריט", quantity: 1, unit: "יח׳", unitPrice: 0, total: 0 },
                ],
              } as any)
            }
          >
            <Plus className="h-4 w-4 ml-1" />
            פריט חדש
          </Button>
        </div>
      );

    case "paymentSchedule": {
      const totalPct = block.steps.reduce((a, s) => a + (s.percentage || 0), 0);
      return (
        <div className="space-y-3">
          <Field label="כותרת">
            <Input value={block.title || ""} onChange={(e) => set({ title: e.target.value } as any)} />
          </Field>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={!!block.showAmounts} onCheckedChange={(v) => set({ showAmounts: v } as any)} />
              <Label className="text-sm">הצג סכומים (₪)</Label>
            </div>
            <span className={`text-xs font-bold ${totalPct === 100 ? "text-green-600" : "text-destructive"}`}>
              סה״כ {totalPct}%
            </span>
          </div>
          {block.steps.map((s, i) => (
            <div key={s.id} className="border rounded-md p-2 space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  className="h-8 flex-1" placeholder="תיאור"
                  value={s.description}
                  onChange={(e) => {
                    const steps = [...block.steps];
                    steps[i] = { ...s, description: e.target.value };
                    set({ steps } as any);
                  }}
                />
                <Input
                  className="h-8 w-16" type="number" placeholder="%"
                  value={s.percentage}
                  onChange={(e) => {
                    const steps = [...block.steps];
                    steps[i] = { ...s, percentage: Number(e.target.value) || 0 };
                    set({ steps } as any);
                  }}
                />
                <Button
                  variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"
                  onClick={() => set({ steps: block.steps.filter((_, x) => x !== i) } as any)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {/* חיבור לשלב עבודה */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                  value={s.stageId || ""}
                  onChange={(e) => {
                    const stage = availableStages.find((st) => st.id === e.target.value);
                    const steps = [...block.steps];
                    steps[i] = { ...s, stageId: e.target.value || null, stageName: stage?.name || "" };
                    set({ steps } as any);
                  }}
                >
                  <option value="">ללא קישור לשלב</option>
                  {availableStages.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
                <select
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                  value={s.triggerMode || "manual"}
                  disabled={!s.stageId}
                  onChange={(e) => {
                    const steps = [...block.steps];
                    steps[i] = { ...s, triggerMode: e.target.value as "manual" | "stage_completion" };
                    set({ steps } as any);
                  }}
                >
                  <option value="manual">ידני</option>
                  <option value="stage_completion">עם השלמת השלב</option>
                </select>
              </div>
            </div>
          ))}
          {availableStages.length === 0 && (
            <p className="text-xs text-muted-foreground">הוסף בלוק "שלבי עבודה" כדי לקשר תשלומים לשלבים.</p>
          )}
          <Button
            variant="outline" size="sm"
            onClick={() => set({ steps: [...block.steps, { id: uid(), percentage: 0, description: "תשלום" }] } as any)}
          >
            <Plus className="h-4 w-4 ml-1" />
            שלב תשלום
          </Button>
        </div>
      );
    }

    case "importantNotes":
      return (
        <div className="space-y-3">
          <Field label="כותרת">
            <Input value={block.title || ""} onChange={(e) => set({ title: e.target.value } as any)} />
          </Field>
          <Field label="הערות (שורה לכל הערה)">
            <Textarea
              rows={5}
              value={block.notes.join("\n")}
              onChange={(e) => set({ notes: e.target.value.split("\n") } as any)}
            />
          </Field>
        </div>
      );

    case "timeline":
      return (
        <div className="space-y-3">
          <Field label="כותרת">
            <Input value={block.title || ""} onChange={(e) => set({ title: e.target.value } as any)} />
          </Field>
          {block.steps.map((s, i) => (
            <div key={s.id} className="flex gap-2 items-center">
              <Input
                className="h-8 flex-1" placeholder="שלב"
                value={s.title}
                onChange={(e) => {
                  const steps = [...block.steps];
                  steps[i] = { ...s, title: e.target.value };
                  set({ steps } as any);
                }}
              />
              <Input
                className="h-8 w-28" placeholder="משך"
                value={s.duration || ""}
                onChange={(e) => {
                  const steps = [...block.steps];
                  steps[i] = { ...s, duration: e.target.value };
                  set({ steps } as any);
                }}
              />
              <Button
                variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"
                onClick={() => set({ steps: block.steps.filter((_, x) => x !== i) } as any)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline" size="sm"
            onClick={() => set({ steps: [...block.steps, { id: uid(), title: "שלב", duration: "" }] } as any)}
          >
            <Plus className="h-4 w-4 ml-1" />
            שלב
          </Button>
        </div>
      );

    case "richText":
      return (
        <Field label="תוכן">
          <RichTextEditor value={block.html} onChange={(html) => set({ html } as any)} />
        </Field>
      );

    case "html":
      return (
        <Field label="HTML חופשי">
          <Textarea rows={10} className="font-mono text-xs" value={block.html} onChange={(e) => set({ html: e.target.value } as any)} />
        </Field>
      );

    case "spacer":
      return (
        <Field label="גובה (מ״מ)">
          <Input type="number" value={block.height} onChange={(e) => set({ height: Number(e.target.value) || 0 } as any)} />
        </Field>
      );

    case "image":
      return (
        <div className="space-y-3">
          <Field label="כתובת תמונה (URL)">
            <Input value={block.url} onChange={(e) => set({ url: e.target.value } as any)} />
          </Field>
          <Field label="רוחב (px, ריק = אוטומטי)">
            <Input type="number" value={block.width || ""} onChange={(e) => set({ width: e.target.value ? Number(e.target.value) : undefined } as any)} />
          </Field>
        </div>
      );

    case "pricingTiers":
      return (
        <div className="space-y-3">
          <Field label="כותרת">
            <Input value={block.title || ""} onChange={(e) => set({ title: e.target.value } as any)} />
          </Field>
          {block.tiers.map((tier, i) => (
            <div key={tier.id} className="border rounded-md p-2 space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  className="h-8 flex-1" placeholder="שם רמה"
                  value={tier.name}
                  onChange={(e) => {
                    const tiers = [...block.tiers];
                    tiers[i] = { ...tier, name: e.target.value };
                    set({ tiers } as any);
                  }}
                />
                <Input
                  className="h-8 w-24" type="number" placeholder="מחיר"
                  value={tier.price}
                  onChange={(e) => {
                    const tiers = [...block.tiers];
                    tiers[i] = { ...tier, price: Number(e.target.value) || 0 };
                    set({ tiers } as any);
                  }}
                />
                <Button
                  variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"
                  onClick={() => set({ tiers: block.tiers.filter((_, x) => x !== i) } as any)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Textarea
                rows={3} placeholder="תכונות (שורה לכל תכונה)"
                value={tier.features.join("\n")}
                onChange={(e) => {
                  const tiers = [...block.tiers];
                  tiers[i] = { ...tier, features: e.target.value.split("\n") };
                  set({ tiers } as any);
                }}
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!tier.highlighted}
                  onCheckedChange={(v) => {
                    const tiers = [...block.tiers];
                    tiers[i] = { ...tier, highlighted: v };
                    set({ tiers } as any);
                  }}
                />
                <Label className="text-sm">הדגש רמה זו</Label>
              </div>
            </div>
          ))}
          <Button
            variant="outline" size="sm"
            onClick={() => set({ tiers: [...block.tiers, { id: uid(), name: "רמה", price: 0, features: [] }] } as any)}
          >
            <Plus className="h-4 w-4 ml-1" />
            רמה חדשה
          </Button>
        </div>
      );

    case "upgrades":
      return (
        <div className="space-y-3">
          <Field label="כותרת">
            <Input value={block.title || ""} onChange={(e) => set({ title: e.target.value } as any)} />
          </Field>
          {block.items.map((it, i) => (
            <div key={it.id} className="flex gap-2 items-center">
              <Switch
                checked={!!it.selected}
                onCheckedChange={(v) => {
                  const items = [...block.items];
                  items[i] = { ...it, selected: v };
                  set({ items } as any);
                }}
              />
              <Input
                className="h-8 flex-1" placeholder="שם"
                value={it.name}
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...it, name: e.target.value };
                  set({ items } as any);
                }}
              />
              <Input
                className="h-8 w-24" type="number" placeholder="מחיר"
                value={it.price}
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...it, price: Number(e.target.value) || 0 };
                  set({ items } as any);
                }}
              />
              <Button
                variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"
                onClick={() => set({ items: block.items.filter((_, x) => x !== i) } as any)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline" size="sm"
            onClick={() => set({ items: [...block.items, { id: uid(), name: "תוספת", price: 0 }] } as any)}
          >
            <Plus className="h-4 w-4 ml-1" />
            תוספת
          </Button>
        </div>
      );

    case "signature":
      return (
        <div className="space-y-3">
          {block.parties.map((p, i) => (
            <div key={i} className="border rounded-md p-2 space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  className="h-8 flex-1" placeholder="תווית (לדוגמה: הלקוח)"
                  value={p.label}
                  onChange={(e) => {
                    const parties = [...block.parties];
                    parties[i] = { ...p, label: e.target.value };
                    set({ parties } as any);
                  }}
                />
                <Button
                  variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"
                  onClick={() => set({ parties: block.parties.filter((_, x) => x !== i) } as any)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm">
                  <Switch
                    checked={!!p.nameLine}
                    onCheckedChange={(v) => {
                      const parties = [...block.parties];
                      parties[i] = { ...p, nameLine: v };
                      set({ parties } as any);
                    }}
                  />
                  שורת שם
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <Switch
                    checked={!!p.dateLine}
                    onCheckedChange={(v) => {
                      const parties = [...block.parties];
                      parties[i] = { ...p, dateLine: v };
                      set({ parties } as any);
                    }}
                  />
                  שורת תאריך
                </label>
              </div>
            </div>
          ))}
          <Button
            variant="outline" size="sm"
            onClick={() => set({ parties: [...block.parties, { label: "צד", nameLine: true, dateLine: true }] } as any)}
          >
            <Plus className="h-4 w-4 ml-1" />
            צד חותם
          </Button>
        </div>
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          עורך מפורט לבלוק מסוג "{block.type}" יתווסף בקרוב. הבלוק כבר מוצג בתצוגה המקדימה.
        </div>
      );
  }
}
