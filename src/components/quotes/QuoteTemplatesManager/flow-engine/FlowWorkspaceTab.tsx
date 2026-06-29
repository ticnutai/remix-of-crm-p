// FlowWorkspaceTab — מאחד עורך עשיר + תצוגה מקדימה בטאב אחד.
// טאב הראשי החדש שמחליף את FlowPreviewTab הישיר ב-HtmlTemplateEditor.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, ImagePlus, Pencil, RotateCcw, SlidersHorizontal, Sparkles, Trash2 } from "lucide-react";
import type { QuoteTemplate } from "../types";
import FlowEditor from "./editor/FlowEditor";
import FlowPreviewTab from "./FlowPreviewTab";
import { templateToEditableHtml } from "./editor/templateToHtml";
import PresetPicker from "./presets/PresetPicker";
import type { DesignPreset } from "./presets/types";
import { safeConfig, usePresets } from "./presets/usePresets";
import StripDesignerDialog, { type FlowStripDesignState, type StripPosition } from "./StripDesignerDialog";
import type { FlowPageSetup, FlowPageSizePreset } from "./types";

interface Props {
  template: QuoteTemplate;
  projectDetails?: any;
  designSettings?: any;
  onDesignSettingsChange?: React.Dispatch<React.SetStateAction<any>>;
}

const storageKey = (id?: string) => `flow-edit:${id || "untitled"}`;
const styleKey = (id?: string) => `flow-edit:${id || "untitled"}:preserveStyles`;
const presetKey = (id?: string) => `flow-edit:${id || "untitled"}:presetId`;
const pageKey = (id?: string) => `flow-edit:${id || "untitled"}:pageSetup`;

const DEFAULT_PAGE_SETUP: FlowPageSetup = {
  size: "A4",
  orientation: "portrait",
  customSizeMm: { width: 210, height: 297 },
  marginMm: { top: 32, right: 18, bottom: 28, left: 18 },
  showPageNumbers: true,
};

const PAGE_OPTIONS: Array<{ value: FlowPageSizePreset; label: string }> = [
  { value: "none", label: "ללא חלוקה" },
  { value: "A4", label: "A4" },
  { value: "A3", label: "A3" },
  { value: "A5", label: "A5" },
  { value: "Letter", label: "Letter" },
  { value: "Legal", label: "Legal" },
  { value: "custom", label: "מותאם" },
];

function boundedNumber(value: unknown, fallback: number, min = 0, max = Number.POSITIVE_INFINITY) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function knownLogoSources(settings?: any, position?: StripPosition) {
  return [
    settings?.logoUrl,
    settings?.logo_url,
    settings?.logoURL,
    settings?.originalLogoUrl,
    settings?.original_logo_url,
    settings?.stripUrl,
    settings?.strip_url,
    position === "header" ? settings?.headerStripUrl : undefined,
    position === "header" ? settings?.header_strip_url : undefined,
    position === "footer" ? settings?.footerStripUrl : undefined,
    position === "footer" ? settings?.footer_strip_url : undefined,
    position === "footer" ? settings?.footerLogoUrl : undefined,
    position === "footer" ? settings?.footer_logo_url : undefined,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);
}

function shouldReplaceLogoSrc(src: string, sources: string[]) {
  if (sources.includes(src)) return true;
  const lower = src.toLowerCase();
  return lower.includes("company-header") || lower.includes("logo") || lower.includes("header-strip");
}

function replaceLogoImagesInHtml(html: string, nextLogoUrl: string, sources: string[]) {
  if (!html || !nextLogoUrl) return html;
  return html.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (match, prefix, src, suffix) => {
    if (!shouldReplaceLogoSrc(String(src), sources)) return match;
    return `${prefix}${nextLogoUrl}${suffix}`;
  });
}

function logoReplacementPatch(logoUrl: string, position: StripPosition) {
  const patch: Record<string, any> = {
    logoUrl,
    logo_url: logoUrl,
    originalLogoUrl: logoUrl,
    original_logo_url: logoUrl,
    showLogo: true,
  };
  if (position === "footer") {
    patch.footerLogoUrl = logoUrl;
    patch.footer_logo_url = logoUrl;
  }
  return patch;
}

function loadPageSetup(templateId?: string): FlowPageSetup {
  try {
    const raw = localStorage.getItem(pageKey(templateId));
    if (!raw) return DEFAULT_PAGE_SETUP;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PAGE_SETUP,
      ...parsed,
      marginMm: { ...DEFAULT_PAGE_SETUP.marginMm, ...(parsed.marginMm || {}) },
      customSizeMm: { ...DEFAULT_PAGE_SETUP.customSizeMm, ...(parsed.customSizeMm || {}) },
    };
  } catch {
    return DEFAULT_PAGE_SETUP;
  }
}

export default function FlowWorkspaceTab({
  template,
  projectDetails,
  designSettings,
  onDesignSettingsChange,
}: Props) {
  // toggle: שמירת עיצוב מקורי מהתבנית (off = הזרימה הקיימת, on = שכבה 1)
  const [preserveStyles, setPreserveStyles] = useState<boolean>(() => {
    try {
      return localStorage.getItem(styleKey(template.id)) === "1";
    } catch {
      return false;
    }
  });

  // ערכת עיצוב נבחרת — נשמרת לפי תבנית
  const { presets } = usePresets();
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(presetKey(template.id));
    } catch {
      return null;
    }
  });
  const selectedPreset = useMemo<DesignPreset | null>(
    () => presets.find((p) => p.id === selectedPresetId) || null,
    [presets, selectedPresetId],
  );
  const presetCfg = selectedPreset ? safeConfig(selectedPreset) : undefined;
  const [pageSetup, setPageSetup] = useState<FlowPageSetup>(() => loadPageSetup(template.id));
  const headerStripInputRef = useRef<HTMLInputElement | null>(null);
  const footerStripInputRef = useRef<HTMLInputElement | null>(null);
  const [designerPosition, setDesignerPosition] = useState<StripPosition | null>(null);
  const headerContentGapPx = boundedNumber(
    designSettings?.headerStripContentGapPx ?? designSettings?.header_content_gap_px,
    18,
    0,
    240,
  );
  const footerContentGapPx = boundedNumber(
    designSettings?.footerStripContentGapPx ?? designSettings?.footer_content_gap_px,
    18,
    0,
    240,
  );
  const flowPageGapPx = boundedNumber(
    designSettings?.flowPageGapPx ?? designSettings?.flow_page_gap_px,
    18,
    0,
    120,
  );

  const updatePageSetup = (patch: Partial<FlowPageSetup>) => {
    setPageSetup((prev) => {
      const next: FlowPageSetup = {
        ...prev,
        ...patch,
        marginMm: { ...prev.marginMm, ...(patch.marginMm || {}) },
        customSizeMm: { ...prev.customSizeMm, ...(patch.customSizeMm || {}) },
      };
      try {
        localStorage.setItem(pageKey(template.id), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const updateDesignSettings = (patch: Record<string, any>) => {
    onDesignSettingsChange?.((prev: any) => ({ ...(prev || {}), ...patch }));
  };

  const replaceLogoEverywhere = (nextLogoUrl: string, position: StripPosition) => {
    const sources = knownLogoSources(designSettings, position);
    setHtml((prev) => {
      const next = replaceLogoImagesInHtml(prev, nextLogoUrl, sources);
      if (next !== prev) {
        try {
          localStorage.setItem(storageKey(template.id), next);
        } catch {
          /* quota / private mode */
        }
      }
      return next;
    });
  };

  const handleStripUpload = (position: "header" | "footer", file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      replaceLogoEverywhere(dataUrl, position);
      if (position === "header") {
        updateDesignSettings({
          ...logoReplacementPatch(dataUrl, "header"),
          headerStripUrl: dataUrl,
          header_strip_url: dataUrl,
          headerStripDesign: null,
          header_strip_design: null,
          repeatHeaderOnAllPages: true,
          headerStripHeight: designSettings?.headerStripHeight || 150,
          stripBgColor: designSettings?.stripBgColor || "#ffffff",
        });
      } else {
        updateDesignSettings({
          ...logoReplacementPatch(dataUrl, "footer"),
          footerStripUrl: dataUrl,
          footer_strip_url: dataUrl,
          footerStripDesign: null,
          footer_strip_design: null,
          repeatFooterOnAllPages: true,
          footerStripHeight: designSettings?.footerStripHeight || 90,
          stripBgColor: designSettings?.stripBgColor || "#ffffff",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const clearStrip = (position: "header" | "footer") => {
    if (position === "header") {
      updateDesignSettings({
        headerStripUrl: null,
        header_strip_url: null,
        headerStripDesign: null,
        header_strip_design: null,
        repeatHeaderOnAllPages: false,
      });
      return;
    }
    updateDesignSettings({
      footerStripUrl: null,
      footer_strip_url: null,
      footerStripDesign: null,
      footer_strip_design: null,
      repeatFooterOnAllPages: false,
    });
  };

  const applyDesignedStrip = ({
    position,
    dataUrl,
    state,
    logoSourceUrl,
  }: {
    position: StripPosition;
    dataUrl: string;
    state: FlowStripDesignState;
    logoSourceUrl?: string;
  }) => {
    const logoPatch = logoSourceUrl ? logoReplacementPatch(logoSourceUrl, position) : {};
    if (logoSourceUrl) replaceLogoEverywhere(logoSourceUrl, position);
    if (position === "header") {
      updateDesignSettings({
        ...logoPatch,
        headerStripUrl: dataUrl,
        header_strip_url: dataUrl,
        headerStripDesign: state,
        header_strip_design: state,
        headerStripHeight: state.canvas.height,
        stripBgColor: state.canvas.backgroundColor || designSettings?.stripBgColor || "#ffffff",
        repeatHeaderOnAllPages: true,
      });
      return;
    }
    updateDesignSettings({
      ...logoPatch,
      footerStripUrl: dataUrl,
      footer_strip_url: dataUrl,
      footerStripDesign: state,
      footer_strip_design: state,
      footerStripHeight: state.canvas.height,
      stripBgColor: state.canvas.backgroundColor || designSettings?.stripBgColor || "#ffffff",
      repeatFooterOnAllPages: true,
    });
  };

  const handlePresetSelect = (p: DesignPreset | null) => {
    setSelectedPresetId(p?.id || null);
    try {
      if (p) localStorage.setItem(presetKey(template.id), p.id);
      else localStorage.removeItem(presetKey(template.id));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    try {
      setPreserveStyles(localStorage.getItem(styleKey(template.id)) === "1");
    } catch {
      setPreserveStyles(false);
    }

    try {
      setSelectedPresetId(localStorage.getItem(presetKey(template.id)));
    } catch {
      setSelectedPresetId(null);
    }

    setPageSetup(loadPageSetup(template.id));
  }, [template.id]);

  const baseHtml = useMemo(
    () =>
      templateToEditableHtml(template, {
        preserveItemStyling: preserveStyles,
        projectDetails,
      }),
    [template, preserveStyles, projectDetails],
  );

  const [html, setHtml] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey(template.id));
      return saved || baseHtml;
    } catch {
      return baseHtml;
    }
  });
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // אם החליפו תבנית — טען טיוטה שמורה או תוכן בסיס
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(template.id));
      setHtml(saved || baseHtml);
    } catch {
      setHtml(baseHtml);
    }
  }, [template.id, baseHtml]);

  const handleChange = (next: string) => {
    setHtml(next);
    try {
      localStorage.setItem(storageKey(template.id), next);
    } catch {
      /* quota / private mode */
    }
  };

  const handleReset = () => {
    if (!window.confirm("לאפס את העריכה לתוכן המקורי של התבנית?")) return;
    try {
      localStorage.removeItem(storageKey(template.id));
    } catch {
      /* ignore */
    }
    setHtml(baseHtml);
  };

  const handleTogglePreserve = (value: boolean) => {
    // החלפת מצב משכתבת את ה-base וגם את הטיוטה — לכן מאשרים אם יש שינויים
    const hasDraft = (() => {
      try {
        return !!localStorage.getItem(storageKey(template.id));
      } catch {
        return false;
      }
    })();
    if (
      hasDraft &&
      !window.confirm(
        "שינוי המצב יטען מחדש את התוכן מהתבנית ויאבד את העריכה הנוכחית. להמשיך?",
      )
    ) {
      return;
    }
    setPreserveStyles(value);
    try {
      localStorage.setItem(styleKey(template.id), value ? "1" : "0");
      localStorage.removeItem(storageKey(template.id));
    } catch {
      /* ignore */
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
      className="flex h-full flex-col"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Flow V2 — עורך ועימוד נקי</span>
          <Badge variant="outline" className="h-5 text-[10px]">
            מבודד מהמערכת הישנה
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* טוגל שמירת עיצוב מקורי */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1">
            <Switch
              id="preserve-styles"
              checked={preserveStyles}
              onCheckedChange={handleTogglePreserve}
            />
            <Label
              htmlFor="preserve-styles"
              className="cursor-pointer text-xs font-medium"
              title="טוען צבעים, פונטים, גדלים והדגשות שהוגדרו בעורך התבניות המקורי"
            >
              שמור עיצוב מקורי מהתבנית
            </Label>
          </div>
          <PresetPicker selectedId={selectedPresetId} onSelect={handlePresetSelect} />
          {onDesignSettingsChange && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1">
              <Label className="whitespace-nowrap text-xs font-medium">סטריפים</Label>
              <input
                ref={headerStripInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleStripUpload("header", e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
              <input
                ref={footerStripInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleStripUpload("footer", e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={designSettings?.repeatHeaderOnAllPages !== false}
                  onChange={(e) => updateDesignSettings({ repeatHeaderOnAllPages: e.target.checked })}
                />
                עליון
              </label>
              <Button
                type="button"
                variant={designSettings?.headerStripUrl || designSettings?.header_strip_url ? "secondary" : "outline"}
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => headerStripInputRef.current?.click()}
                title="העלה או החלף סטריפ עליון"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                העלה עליון
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setDesignerPosition("header")}
                title="עיצוב מתקדם לסטריפ העליון"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                עצב
              </Button>
              {(designSettings?.headerStripUrl || designSettings?.header_strip_url) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => clearStrip("header")}
                  title="נקה סטריפ עליון"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <input
                className="h-7 w-14 rounded border bg-background px-1 text-center text-xs"
                type="number"
                min={24}
                max={400}
                value={designSettings?.headerStripHeight || 150}
                onChange={(e) => updateDesignSettings({ headerStripHeight: Number(e.target.value) || 150 })}
                title="גובה סטריפ עליון בפיקסלים"
              />
              <span className="text-[10px] text-muted-foreground">px</span>
              <span className="mx-1 h-5 w-px bg-border" />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={designSettings?.repeatFooterOnAllPages !== false}
                  onChange={(e) => updateDesignSettings({ repeatFooterOnAllPages: e.target.checked })}
                />
                תחתון
              </label>
              <Button
                type="button"
                variant={designSettings?.footerStripUrl || designSettings?.footer_strip_url ? "secondary" : "outline"}
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => footerStripInputRef.current?.click()}
                title="העלה או החלף סטריפ תחתון"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                העלה תחתון
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setDesignerPosition("footer")}
                title="עיצוב מתקדם לסטריפ התחתון"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                עצב
              </Button>
              {(designSettings?.footerStripUrl || designSettings?.footer_strip_url) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => clearStrip("footer")}
                  title="נקה סטריפ תחתון"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <input
                className="h-7 w-14 rounded border bg-background px-1 text-center text-xs"
                type="number"
                min={24}
                max={300}
                value={designSettings?.footerStripHeight || 90}
                onChange={(e) => updateDesignSettings({ footerStripHeight: Number(e.target.value) || 90 })}
                title="גובה סטריפ תחתון בפיקסלים"
              />
              <span className="text-[10px] text-muted-foreground">px</span>
              <input
                className="h-7 w-8 cursor-pointer rounded border bg-background p-0.5"
                type="color"
                value={designSettings?.stripBgColor || "#ffffff"}
                onChange={(e) => updateDesignSettings({ stripBgColor: e.target.value })}
                title="צבע רקע מאחורי הסטריפים"
              />
              <span className="mx-1 h-5 w-px bg-border" />
              <Label className="whitespace-nowrap text-xs font-medium">גבולות כתיבה</Label>
              <input
                className="h-7 w-12 rounded border bg-background px-1 text-center text-xs"
                type="number"
                min={0}
                max={240}
                value={headerContentGapPx}
                onChange={(e) => {
                  const next = boundedNumber(e.target.value, 18, 0, 240);
                  updateDesignSettings({
                    headerStripContentGapPx: next,
                    header_content_gap_px: next,
                  });
                }}
                title="רווח כתיבה מתחת לסטריפ העליון בפיקסלים"
              />
              <span className="text-[10px] text-muted-foreground">מתחת לעליון</span>
              <input
                className="h-7 w-12 rounded border bg-background px-1 text-center text-xs"
                type="number"
                min={0}
                max={240}
                value={footerContentGapPx}
                onChange={(e) => {
                  const next = boundedNumber(e.target.value, 18, 0, 240);
                  updateDesignSettings({
                    footerStripContentGapPx: next,
                    footer_content_gap_px: next,
                  });
                }}
                title="רווח כתיבה מעל הסטריפ התחתון בפיקסלים"
              />
              <span className="text-[10px] text-muted-foreground">מעל תחתון</span>
              <input
                className="h-7 w-12 rounded border bg-background px-1 text-center text-xs"
                type="number"
                min={0}
                max={120}
                value={flowPageGapPx}
                onChange={(e) => {
                  const next = boundedNumber(e.target.value, 18, 0, 120);
                  updateDesignSettings({
                    flowPageGapPx: next,
                    flow_page_gap_px: next,
                  });
                }}
                title="רווח חזותי בין הדפים בפיקסלים"
              />
              <span className="text-[10px] text-muted-foreground">בין דפים</span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1">
            <Label className="whitespace-nowrap text-xs font-medium">גודל דף</Label>
            <select
              className="h-7 rounded border bg-background px-2 text-xs"
              value={pageSetup.size}
              onChange={(e) => updatePageSetup({ size: e.target.value as FlowPageSizePreset })}
              title="גודל הדף של הצעת המחיר ב-Flow V2"
            >
              {PAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {pageSetup.size !== "custom" && pageSetup.size !== "none" ? (
              <select
                className="h-7 rounded border bg-background px-2 text-xs"
                value={pageSetup.orientation || "portrait"}
                onChange={(e) =>
                  updatePageSetup({ orientation: e.target.value as FlowPageSetup["orientation"] })
                }
                title="כיוון הדף"
              >
                <option value="portrait">לאורך</option>
                <option value="landscape">לרוחב</option>
              </select>
            ) : pageSetup.size === "custom" ? (
              <div className="flex items-center gap-1" dir="ltr">
                <input
                  className="h-7 w-14 rounded border bg-background px-1 text-center text-xs"
                  type="number"
                  min={50}
                  value={pageSetup.customSizeMm?.width || 210}
                  onChange={(e) =>
                    updatePageSetup({
                      customSizeMm: {
                        ...(pageSetup.customSizeMm || DEFAULT_PAGE_SETUP.customSizeMm),
                        width: Number(e.target.value) || 210,
                      },
                    })
                  }
                  title="רוחב במילימטרים"
                />
                <span className="text-xs text-muted-foreground">×</span>
                <input
                  className="h-7 w-14 rounded border bg-background px-1 text-center text-xs"
                  type="number"
                  min={50}
                  value={pageSetup.customSizeMm?.height || 297}
                  onChange={(e) =>
                    updatePageSetup({
                      customSizeMm: {
                        ...(pageSetup.customSizeMm || DEFAULT_PAGE_SETUP.customSizeMm),
                        height: Number(e.target.value) || 297,
                      },
                    })
                  }
                  title="גובה במילימטרים"
                />
                <span className="text-[10px] text-muted-foreground">mm</span>
              </div>
            ) : null}
          </div>
          <TabsList className="h-8">
            <TabsTrigger value="edit" className="h-7 gap-1 text-xs">
              <Pencil className="h-3.5 w-3.5" />
              עריכה
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-7 gap-1 text-xs">
              <Eye className="h-3.5 w-3.5" />
              תצוגה מקדימה
            </TabsTrigger>
          </TabsList>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            title="אפס לתוכן התבנית המקורי"
          >
            <RotateCcw className="ml-1 h-3.5 w-3.5" />
            אפס
          </Button>
        </div>
      </div>

      <TabsContent value="edit" className="m-0 flex-1 overflow-hidden">
        <FlowEditor
          initialHtml={html}
          onChange={handleChange}
          preset={presetCfg}
          pageSetup={pageSetup}
          templateDesignSettings={template.design_settings}
          designSettings={designSettings}
          onDesignSettingsChange={updateDesignSettings}
        />
      </TabsContent>
      <TabsContent value="preview" className="m-0 flex-1 overflow-hidden">
        <FlowPreviewTab
          template={template}
          editedHtml={html}
          preset={presetCfg}
          projectDetails={projectDetails}
          designSettings={designSettings}
          pageSetup={pageSetup}
        />
      </TabsContent>
      {onDesignSettingsChange && designerPosition && (
        <StripDesignerDialog
          open={Boolean(designerPosition)}
          position={designerPosition}
          designSettings={designSettings}
          onApply={applyDesignedStrip}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setDesignerPosition(null);
          }}
        />
      )}
    </Tabs>
  );
}
