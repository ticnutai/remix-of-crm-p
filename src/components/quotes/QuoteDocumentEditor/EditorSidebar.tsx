import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Building2,
  User,
  FileText,
  Palette,
  Settings2,
  Eye,
  Type,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FormInput,
  Image,
} from "lucide-react";
import { QuoteDocumentData } from "./types";
import { ClientCombobox } from "./ClientCombobox";
import { Client } from "@/hooks/useClients";
import { LogoUploadSection } from "./LogoUploadSection";
import { AdvancedDesignSettings } from "./AdvancedDesignSettings";
import { CustomFieldsEditor } from "./CustomFieldsEditor";
import { FrameDesignPanel } from "../QuoteTemplatesManager/FrameDesignPanel";
import { DEFAULT_FRAME_SETTINGS } from "../QuoteTemplatesManager/frameStyles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles as SparkleIcon, RotateCcw, Upload as UploadIcon } from "lucide-react";

interface EditorSidebarProps {
  document: QuoteDocumentData;
  onUpdate: (updates: Partial<QuoteDocumentData>) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const FONT_OPTIONS = [
  { value: "Heebo", label: "Heebo" },
  { value: "Assistant", label: "Assistant" },
  { value: "Rubik", label: "Rubik" },
  { value: "Open Sans Hebrew", label: "Open Sans" },
];

const UNITS = [
  { value: "יח'", label: "יחידה" },
  { value: 'מ"ר', label: 'מ"ר' },
  { value: 'מ"א', label: 'מ"א' },
  { value: "שעה", label: "שעה" },
  { value: "יום", label: "יום" },
  { value: "חודש", label: "חודש" },
  { value: "קומפלט", label: "קומפלט" },
];

export function EditorSidebar({
  document,
  onUpdate,
  collapsed,
  onToggle,
}: EditorSidebarProps) {
  const [openSections, setOpenSections] = useState<string[]>([
    "company",
    "client",
  ]);

  const handleClientSelect = (client: Client) => {
    onUpdate({
      clientName: client.name,
      clientCompany: client.company || "",
      clientEmail: client.email || "",
      clientPhone: client.phone || "",
      clientAddress: client.address || "",
    });
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-card border-l flex flex-col items-center py-4 gap-2">
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Separator className="my-2" />
        <Button variant="ghost" size="icon" title="פרטי חברה">
          <Building2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="פרטי לקוח">
          <User className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="תוכן">
          <FileText className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="עיצוב">
          <Palette className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="הגדרות">
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full bg-card border-l flex flex-col overflow-hidden"
      dir="rtl"
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-sm">הגדרות מסמך</h3>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 h-full overflow-auto">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="px-3"
        >
          {/* Company Details */}
          <AccordionItem value="company">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                פרטי החברה
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              {/* Logo Upload Section */}
              <TooltipProvider>
                <LogoUploadSection
                  logo={document.companyLogo}
                  onLogoChange={(logo) => onUpdate({ companyLogo: logo })}
                />
              </TooltipProvider>

              {/* Logo Settings */}
              {document.companyLogo && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs font-medium">הגדרות לוגו</Label>

                  {/* Logo Size */}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      גודל לוגו: {document.logoSize || 120}px
                    </Label>
                    <Input
                      type="range"
                      min="60"
                      max="400"
                      step="10"
                      value={document.logoSize || 120}
                      onChange={(e) =>
                        onUpdate({ logoSize: Number(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>

                  {/* Logo Position */}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      מיקום לוגו
                    </Label>
                    <Select
                      value={document.logoPosition || "inside-header"}
                      onValueChange={(value: any) =>
                        onUpdate({ logoPosition: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inside-header">
                          בתוך הסטריפ
                        </SelectItem>
                        <SelectItem value="above-header">מעל הסטריפ</SelectItem>
                        <SelectItem value="centered-above">
                          ממורכז מעל הסטריפ
                        </SelectItem>
                        <SelectItem value="full-width">
                          רוחב מלא בסטריפ
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Header Strip Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג סטריפ כותרת צבעוני</Label>
                <Switch
                  checked={document.showHeaderStrip !== false}
                  onCheckedChange={(checked) =>
                    onUpdate({ showHeaderStrip: checked })
                  }
                />
              </div>

              <Separator />

              <div>
                <Label className="text-xs">שם החברה</Label>
                <Input
                  value={document.companyName}
                  onChange={(e) => onUpdate({ companyName: e.target.value })}
                  placeholder="שם החברה"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">כתובת</Label>
                <Input
                  value={document.companyAddress}
                  onChange={(e) => onUpdate({ companyAddress: e.target.value })}
                  placeholder="כתובת החברה"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">טלפון</Label>
                  <Input
                    value={document.companyPhone}
                    onChange={(e) => onUpdate({ companyPhone: e.target.value })}
                    placeholder="טלפון"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">אימייל</Label>
                  <Input
                    value={document.companyEmail}
                    onChange={(e) => onUpdate({ companyEmail: e.target.value })}
                    placeholder="אימייל"
                    className="mt-1"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Client Details */}
          <AccordionItem value="client">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                פרטי הלקוח
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div>
                <Label className="text-xs">שם הלקוח</Label>
                <div className="mt-1">
                  <ClientCombobox
                    value={document.clientName}
                    onChange={(value) => onUpdate({ clientName: value })}
                    onClientSelect={handleClientSelect}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">חברה</Label>
                <Input
                  value={document.clientCompany || ""}
                  onChange={(e) => onUpdate({ clientCompany: e.target.value })}
                  placeholder="שם החברה"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">כתובת</Label>
                <Input
                  value={document.clientAddress || ""}
                  onChange={(e) => onUpdate({ clientAddress: e.target.value })}
                  placeholder="כתובת"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">טלפון</Label>
                  <Input
                    value={document.clientPhone || ""}
                    onChange={(e) => onUpdate({ clientPhone: e.target.value })}
                    placeholder="טלפון"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">אימייל</Label>
                  <Input
                    value={document.clientEmail || ""}
                    onChange={(e) => onUpdate({ clientEmail: e.target.value })}
                    placeholder="אימייל"
                    className="mt-1"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Content */}
          <AccordionItem value="content">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                תוכן
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div>
                <Label className="text-xs">כותרת</Label>
                <Input
                  value={document.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">פתיחה</Label>
                <Textarea
                  value={document.introduction || ""}
                  onChange={(e) => onUpdate({ introduction: e.target.value })}
                  rows={3}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">תנאים</Label>
                <Textarea
                  value={document.terms || ""}
                  onChange={(e) => onUpdate({ terms: e.target.value })}
                  rows={3}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">הערות</Label>
                <Textarea
                  value={document.notes || ""}
                  onChange={(e) => onUpdate({ notes: e.target.value })}
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">חתימה</Label>
                <Textarea
                  value={document.footer || ""}
                  onChange={(e) => onUpdate({ footer: e.target.value })}
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advanced Styling */}
          <AccordionItem value="styling">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                עיצוב מתקדם
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <TooltipProvider>
                <AdvancedDesignSettings
                  document={document}
                  onUpdate={onUpdate}
                />
              </TooltipProvider>
            </AccordionContent>
          </AccordionItem>

          {/* Frame Design Override (per-quote) */}
          <AccordionItem value="frame-design">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                מסגרות ורקע (התאמה להצעה זו)
                {(document as any).frameDesign && (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#d8ac27]" aria-label="override פעיל" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <FrameDesignOverrideSection
                document={document}
                onUpdate={onUpdate}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="customFields">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <FormInput className="h-4 w-4" />
                שדות מותאמים
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CustomFieldsEditor document={document} onUpdate={onUpdate} />
            </AccordionContent>
          </AccordionItem>

          {/* Settings */}
          <AccordionItem value="settings">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                הגדרות
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג לוגו</Label>
                <Switch
                  checked={document.showLogo}
                  onCheckedChange={(v) => onUpdate({ showLogo: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג פרטי חברה</Label>
                <Switch
                  checked={document.showCompanyDetails}
                  onCheckedChange={(v) => onUpdate({ showCompanyDetails: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג פרטי לקוח</Label>
                <Switch
                  checked={document.showClientDetails}
                  onCheckedChange={(v) => onUpdate({ showClientDetails: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג מספרי פריטים</Label>
                <Switch
                  checked={document.showItemNumbers}
                  onCheckedChange={(v) => onUpdate({ showItemNumbers: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג מע"מ</Label>
                <Switch
                  checked={document.showVat}
                  onCheckedChange={(v) => onUpdate({ showVat: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג תנאי תשלום</Label>
                <Switch
                  checked={document.showPaymentTerms}
                  onCheckedChange={(v) => onUpdate({ showPaymentTerms: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">הצג חתימה</Label>
                <Switch
                  checked={document.showSignature}
                  onCheckedChange={(v) => onUpdate({ showSignature: v })}
                />
              </div>

              <Separator />

              <div>
                <Label className="text-xs">אחוז מע"מ</Label>
                <Input
                  type="number"
                  value={document.vatRate}
                  onChange={(e) =>
                    onUpdate({ vatRate: parseFloat(e.target.value) || 0 })
                  }
                  min={0}
                  max={100}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">הנחה</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    value={document.discount}
                    onChange={(e) =>
                      onUpdate({ discount: parseFloat(e.target.value) || 0 })
                    }
                    min={0}
                    className="flex-1"
                  />
                  <Select
                    value={document.discountType}
                    onValueChange={(v: "percent" | "fixed") =>
                      onUpdate({ discountType: v })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="fixed">₪</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Per-quote frame design override section: banner + reset + apply-to-template
// ──────────────────────────────────────────────────────────────────
function FrameDesignOverrideSection({
  document,
  onUpdate,
}: {
  document: QuoteDocumentData;
  onUpdate: (updates: Partial<QuoteDocumentData>) => void;
}) {
  const { toast } = useToast();
  const [applying, setApplying] = useState(false);
  const hasOverride = !!(document as any).frameDesign;
  const currentValue = (document as any).frameDesign || DEFAULT_FRAME_SETTINGS;

  const handleReset = () => {
    onUpdate({ frameDesign: undefined } as any);
    toast({ title: "אופס לעיצוב התבנית", description: "ההצעה תשתמש כעת בעיצוב ברירת המחדל של התבנית" });
  };

  const handleApplyToTemplate = async () => {
    if (!document.id) {
      toast({ title: "שמרי תחילה את ההצעה", variant: "destructive" });
      return;
    }
    setApplying(true);
    try {
      const { data: quote, error: qErr } = await (supabase as any)
        .from("quotes")
        .select("quote_template_id")
        .eq("id", document.id)
        .single();
      if (qErr) throw qErr;
      const templateId = quote?.quote_template_id;
      if (!templateId) {
        toast({
          title: "אין תבנית מקושרת",
          description: "ההצעה הזו לא נוצרה מתבנית. לא ניתן להחיל על תבנית.",
          variant: "destructive",
        });
        setApplying(false);
        return;
      }
      const { data: tpl, error: tErr } = await (supabase as any)
        .from("quote_templates")
        .select("design_settings")
        .eq("id", templateId)
        .single();
      if (tErr) throw tErr;
      const nextDesign = { ...(tpl?.design_settings || {}), frameDesign: currentValue };
      const { error: uErr } = await (supabase as any)
        .from("quote_templates")
        .update({ design_settings: nextDesign })
        .eq("id", templateId);
      if (uErr) throw uErr;
      toast({ title: "הוחל על התבנית", description: "כל הצעה חדשה מהתבנית תקבל את העיצוב הזה" });
    } catch (e: any) {
      toast({ title: "שגיאה בהחלה על התבנית", description: e?.message || "נסי שוב", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-3">
      {hasOverride && (
        <div
          className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs"
          style={{ borderColor: "#d8ac27", backgroundColor: "rgba(216,172,39,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <SparkleIcon className="h-4 w-4" style={{ color: "#d8ac27" }} />
            <span>עיצוב מותאם להצעה זו פעיל</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            איפוס
          </Button>
        </div>
      )}

      <FrameDesignPanel
        value={currentValue}
        onChange={(v) => onUpdate({ frameDesign: v } as any)}
      />

      <Separator />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleApplyToTemplate}
        disabled={applying || !document.id || !hasOverride}
        title={!hasOverride ? "אין שינוי להחיל" : !document.id ? "שמרי תחילה את ההצעה" : ""}
      >
        <UploadIcon className="h-3.5 w-3.5" />
        {applying ? "מחיל..." : "החל עיצוב זה על כל ההצעות מהתבנית"}
      </Button>
    </div>
  );
}
