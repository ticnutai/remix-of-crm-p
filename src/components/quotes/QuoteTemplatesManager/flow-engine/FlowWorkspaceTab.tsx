// FlowWorkspaceTab — מאחד עורך עשיר + תצוגה מקדימה בטאב אחד.
// טאב הראשי החדש שמחליף את FlowPreviewTab הישיר ב-HtmlTemplateEditor.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Cloud, Columns2, Eye, FileText, GripHorizontal, Hash, ImagePlus, Layers, Loader2, Palette, Pencil, Receipt, RotateCcw, Rows3, SlidersHorizontal, Sparkles, SplitSquareHorizontal, Trash2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { QuoteTemplate } from "../types";
import FlowEditor from "./editor/FlowEditor";
import FlowPreviewTab from "./FlowPreviewTab";
import FlowCompareView from "./FlowCompareView";
import LiveSplitView from "./LiveSplitView";
import { templateToEditableHtml } from "./editor/templateToHtml";
import { paymentsSignature, syncPaymentsSection } from "./syncPayments";
import { structuredSectionsSignature, syncStructuredSections } from "./syncStructuredSections";
import PresetPicker from "./presets/PresetPicker";
import type { DesignPreset } from "./presets/types";
import { safeConfig, usePresets } from "./presets/usePresets";
import { projectToMergeData } from "./projectTokens";
import { htmlToFlowDoc } from "./editor/htmlToFlowDoc";
import { renderFlowToHtml } from "./renderer";
import { usePagedGuides } from "./editor/usePagedGuides";
import StripDesignerDialog, { type FlowStripDesignState, type StripPosition } from "./StripDesignerDialog";
import type { FlowPageSetup } from "./types";
import { FLOW_STRIP_LIMITS } from "./stripSettings";

interface Props {
  template: QuoteTemplate;
  projectDetails?: any;
  designSettings?: any;
  onDesignSettingsChange?: React.Dispatch<React.SetStateAction<any>>;
  workspaceActions?: React.ReactNode;
  /** טאב משני נשלט מההורה. אם לא מסופק — מצב פנימי. */
  subTab?: "edit" | "preview" | "split" | "compare";
  onSubTabChange?: (next: "edit" | "preview" | "split" | "compare") => void;
  /** אם true — אל תראה את ה-TabsList הפנימי (ההורה מציג שורה משלו). */
  hideInternalSubTabs?: boolean;
  /** Structured editor fields are the only source of truth; disables the legacy HTML draft editor. */
  structuredMode?: boolean;
  /** Registers the exact A4 print action so the parent export button uses this same renderer. */
  onPrintReady?: (handler: (() => Promise<void>) | null) => void;
}

const storageKey = (id?: string) => `flow-edit:${id || "untitled"}:v2`;
const structuredStorageKey = (id?: string) => `flow-edit:${id || "untitled"}:structured-v1`;
const styleKey = (id?: string) => `flow-edit:${id || "untitled"}:preserveStyles`;
const paymentsLayoutKey = (id?: string) => `flow-edit:${id || "untitled"}:paymentsLayout`;
type PaymentsLayout = "list" | "table" | "both";
const presetKey = (id?: string) => `flow-edit:${id || "untitled"}:presetId`;
const pageKey = (id?: string) => `flow-edit:${id || "untitled"}:pageSetup`;
const spacingPanelPositionKey = (id?: string) =>
  `flow-edit:${id || "untitled"}:spacingPanelPosition`;

interface FloatingPanelPosition {
  x: number;
  y: number;
}

function defaultSpacingPanelPosition(): FloatingPanelPosition {
  if (typeof window === "undefined") return { x: 24, y: 96 };
  return { x: Math.max(12, window.innerWidth - 444), y: 96 };
}

function loadSpacingPanelPosition(templateId?: string): FloatingPanelPosition {
  try {
    const parsed = JSON.parse(localStorage.getItem(spacingPanelPositionKey(templateId)) || "null");
    if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) {
      return { x: parsed.x, y: parsed.y };
    }
  } catch { /* Use the default position when storage is unavailable or malformed. */ }
  return defaultSpacingPanelPosition();
}
const DEFAULT_PAGE_SETUP: FlowPageSetup = {
  size: "A4",
  orientation: "portrait",
  customSizeMm: { width: 210, height: 297 },
  marginMm: { top: 32, right: 18, bottom: 28, left: 18 },
  showPageNumbers: true,
};

function boundedNumber(value: unknown, fallback: number, min = 0, max = Number.POSITIVE_INFINITY) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function looseNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : fallback;
}

function knownLogoSources(settings?: any, position?: StripPosition) {
  return [
    position === "header" ? settings?.logoUrl : undefined,
    position === "header" ? settings?.logo_url : undefined,
    position === "header" ? settings?.logoURL : undefined,
    position === "header" ? settings?.originalLogoUrl : undefined,
    position === "header" ? settings?.original_logo_url : undefined,
    position === "header" ? settings?.stripUrl : undefined,
    position === "header" ? settings?.strip_url : undefined,
    position === "header" ? settings?.headerStripUrl : undefined,
    position === "header" ? settings?.header_strip_url : undefined,
    position === "footer" ? settings?.footerStripUrl : undefined,
    position === "footer" ? settings?.footer_strip_url : undefined,
    position === "footer" ? settings?.footerLogoUrl : undefined,
    position === "footer" ? settings?.footer_logo_url : undefined,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);
}

function shouldReplaceLogoSrc(src: string, sources: string[], position: StripPosition) {
  if (sources.includes(src)) return true;
  if (position === "footer") return false;
  const lower = src.toLowerCase();
  return lower.includes("company-header") || lower.includes("logo") || lower.includes("header-strip");
}

function replaceLogoImagesInHtml(
  html: string,
  nextLogoUrl: string,
  sources: string[],
  position: StripPosition,
) {
  if (!html || !nextLogoUrl) return html;
  return html.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (match, prefix, src, suffix) => {
    if (!shouldReplaceLogoSrc(String(src), sources, position)) return match;
    return `${prefix}${nextLogoUrl}${suffix}`;
  });
}

function logoReplacementPatch(logoUrl: string, position: StripPosition) {
  if (position === "footer") {
    return {
      footerLogoUrl: logoUrl,
      footer_logo_url: logoUrl,
    };
  }
  const patch: Record<string, any> = {
    logoUrl,
    logo_url: logoUrl,
    originalLogoUrl: logoUrl,
    original_logo_url: logoUrl,
    showLogo: true,
  };
  return patch;
}

function normalizeA4PageSetup(value?: Partial<FlowPageSetup> | null): FlowPageSetup {
  const margin = value?.marginMm || DEFAULT_PAGE_SETUP.marginMm;
  return {
    ...DEFAULT_PAGE_SETUP,
    ...value,
    size: "A4",
    orientation: value?.orientation === "landscape" ? "landscape" : "portrait",
    customSizeMm: { width: 210, height: 297 },
    marginMm: {
      top: boundedNumber(margin.top, 32, 12, 60),
      right: boundedNumber(margin.right, 18, 8, 35),
      bottom: boundedNumber(margin.bottom, 28, 12, 60),
      left: boundedNumber(margin.left, 18, 8, 35),
    },
    showPageNumbers: value?.showPageNumbers !== false,
  };
}

function loadPageSetup(templateId?: string, designSettings?: any): FlowPageSetup {
  const savedInTemplate = designSettings?.flowPageSetup || designSettings?.flow_page_setup;
  if (savedInTemplate && typeof savedInTemplate === "object") {
    return normalizeA4PageSetup(savedInTemplate);
  }
  try {
    const raw = localStorage.getItem(pageKey(templateId));
    if (!raw) return DEFAULT_PAGE_SETUP;
    return normalizeA4PageSetup(JSON.parse(raw));
  } catch {
    return DEFAULT_PAGE_SETUP;
  }
}

export default function FlowWorkspaceTab({
  template,
  projectDetails,
  designSettings,
  onDesignSettingsChange,
  workspaceActions,
  subTab,
  onSubTabChange,
  hideInternalSubTabs,
  structuredMode = false,
  onPrintReady,
}: Props) {
  const designSettingsRef = useRef(designSettings);
  designSettingsRef.current = designSettings;
  // toggle: שמירת עיצוב מקורי מהתבנית (off = הזרימה הקיימת, on = שכבה 1)
  const [preserveStyles, setPreserveStyles] = useState<boolean>(() => {
    try {
      return localStorage.getItem(styleKey(template.id)) === "1";
    } catch {
      return false;
    }
  });

  // תצוגת לוח התשלומים: רשימה / טבלה / גם וגם
  const [paymentsLayout, setPaymentsLayoutState] = useState<PaymentsLayout>(() => {
    try {
      const v = localStorage.getItem(paymentsLayoutKey(template.id));
      return v === "table" || v === "both" ? v : "list";
    } catch {
      return "list";
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
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const selectedPreset = useMemo<DesignPreset | null>(
    () => presets.find((p) => p.id === selectedPresetId) || null,
    [presets, selectedPresetId],
  );
  const presetCfg = selectedPreset ? safeConfig(selectedPreset) : undefined;
  const [pageSetup, setPageSetup] = useState<FlowPageSetup>(() =>
    loadPageSetup(template.id, designSettings),
  );
  const headerStripInputRef = useRef<HTMLInputElement | null>(null);
  const footerStripInputRef = useRef<HTMLInputElement | null>(null);
  const [designerPosition, setDesignerPosition] = useState<StripPosition | null>(null);
  const spacingPanelRef = useRef<HTMLDivElement | null>(null);
  const [spacingPanelOpen, setSpacingPanelOpen] = useState(false);
  const [spacingPanelPosition, setSpacingPanelPosition] = useState<FloatingPanelPosition>(() =>
    loadSpacingPanelPosition(template.id),
  );
  const [spacingPanelDrag, setSpacingPanelDrag] = useState<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const headerContentGapPx = boundedNumber(
    designSettings?.headerStripContentGapPx ?? designSettings?.header_content_gap_px,
    18,
    0,
    FLOW_STRIP_LIMITS.contentGapPx.max,
  );
  const footerContentGapPx = boundedNumber(
    designSettings?.footerStripContentGapPx ?? designSettings?.footer_content_gap_px,
    18,
    0,
    FLOW_STRIP_LIMITS.contentGapPx.max,
  );
  const flowPageGapPx = boundedNumber(
    designSettings?.flowPageGapPx ?? designSettings?.flow_page_gap_px,
    18,
    0,
  );
  const headerStripWidthPercent = looseNumber(
    designSettings?.headerStripWidthPercent ?? designSettings?.header_strip_width_percent,
    100,
  );
  const footerStripWidthPercent = looseNumber(
    designSettings?.footerStripWidthPercent ?? designSettings?.footer_strip_width_percent,
    100,
  );

  const clampSpacingPanelPosition = (position: FloatingPanelPosition) => {
    if (typeof window === "undefined") return position;
    const panelWidth = spacingPanelRef.current?.offsetWidth || 420;
    const panelHeight = spacingPanelRef.current?.offsetHeight || 520;
    return {
      x: Math.max(8, Math.min(position.x, Math.max(8, window.innerWidth - panelWidth - 8))),
      y: Math.max(8, Math.min(position.y, Math.max(8, window.innerHeight - panelHeight - 8))),
    };
  };

  useEffect(() => {
    if (!spacingPanelOpen) return;
    const frame = window.requestAnimationFrame(() => {
      setSpacingPanelPosition((current) => clampSpacingPanelPosition(current));
    });
    const handleResize = () => {
      setSpacingPanelPosition((current) => clampSpacingPanelPosition(current));
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [spacingPanelOpen]);

  useEffect(() => {
    if (!spacingPanelOpen) return;
    try {
      localStorage.setItem(
        spacingPanelPositionKey(template.id),
        JSON.stringify(spacingPanelPosition),
      );
    } catch { /* Floating panel position persistence is best effort. */ }
  }, [spacingPanelOpen, spacingPanelPosition, template.id]);

  const updatePageSetup = (patch: Partial<FlowPageSetup>) => {
    setPageSetup((prev) => {
      const next = normalizeA4PageSetup({
        ...prev,
        ...patch,
        marginMm: { ...prev.marginMm, ...(patch.marginMm || {}) },
        customSizeMm: { ...prev.customSizeMm, ...(patch.customSizeMm || {}) },
      });
      try {
        localStorage.setItem(pageKey(template.id), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      onDesignSettingsChange?.((settings: any) => ({
        ...(settings || {}),
        flowPageSetup: next,
        flow_page_setup: next,
      }));
      return next;
    });
  };

  const updateDesignSettings = (patch: Record<string, any>) => {
    onDesignSettingsChange?.((prev: any) => ({ ...(prev || {}), ...patch }));
  };

  const replaceLogoEverywhere = (nextLogoUrl: string, position: StripPosition) => {
    const sources = knownLogoSources(designSettings, position);
    setHtml((prev) => {
      const next = replaceLogoImagesInHtml(prev, nextLogoUrl, sources, position);
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
          headerStripHeight: designSettings?.headerStripHeight ?? 150,
          headerStripWidthPercent,
          header_strip_width_percent: headerStripWidthPercent,
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
          footerStripHeight: designSettings?.footerStripHeight ?? 90,
          footerStripWidthPercent,
          footer_strip_width_percent: footerStripWidthPercent,
          stripBgColor: designSettings?.stripBgColor || "#ffffff",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const clearStrip = (position: "header" | "footer") => {
    const logoIsStrip =
      designSettings?.logoPosition === "custom-strip" ||
      designSettings?.logoPosition === "full-width" ||
      designSettings?.logo_position === "custom-strip" ||
      designSettings?.logo_position === "full-width";

    if (position === "header") {
      updateDesignSettings({
        stripUrl: null,
        strip_url: null,
        ...(logoIsStrip
          ? {
              logoUrl: null,
              logo_url: null,
              originalLogoUrl: null,
              original_logo_url: null,
              logoPosition: null,
              logo_position: null,
            }
          : {}),
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
      footerLogoUrl: null,
      footer_logo_url: null,
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
        headerStripWidthPercent,
        header_strip_width_percent: headerStripWidthPercent,
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
      footerStripWidthPercent,
      footer_strip_width_percent: footerStripWidthPercent,
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

    setPageSetup(loadPageSetup(template.id, designSettingsRef.current));
    try {
      const v = localStorage.getItem(paymentsLayoutKey(template.id));
      setPaymentsLayoutState(v === "table" || v === "both" ? v : "list");
    } catch {
      setPaymentsLayoutState("list");
    }
  }, [template.id]);

  const baseHtml = useMemo(() => {
    const generated = templateToEditableHtml(template, {
      preserveItemStyling: preserveStyles,
      projectDetails,
      keepFieldsAsPlaceholders: true,
      paymentsLayout,
      lockComputedSections: structuredMode,
    });
    if (structuredMode) {
      const structuredOverride =
        designSettings?.flowStructuredEditableHtml ||
        designSettings?.flow_structured_editable_html ||
        (template as any)?.design_settings?.flowStructuredEditableHtml ||
        (template as any)?.design_settings?.flow_structured_editable_html;
      if (typeof structuredOverride === "string" && structuredOverride.trim()) {
        return syncStructuredSections(structuredOverride, template, {
          preserveItemStyling: preserveStyles,
          projectDetails,
          paymentsLayout,
        });
      }
      return generated;
    }
    const override =
      (template as any)?.design_settings?.flowV2OverrideHtml ||
      (template as any)?.flowV2OverrideHtml ||
      null;
    return typeof override === "string" && override.trim() ? override : generated;
  }, [template, designSettings, preserveStyles, projectDetails, paymentsLayout, structuredMode]);

  const [html, setHtml] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(
        structuredMode ? structuredStorageKey(template.id) : storageKey(template.id),
      );
      return saved || baseHtml;
    } catch {
      return baseHtml;
    }
  });
  const [internalSubTab, setInternalSubTab] = useState<"edit" | "preview" | "compare" | "split">(
    structuredMode ? "preview" : "edit",
  );
  const activeTab = (structuredMode ? internalSubTab : (subTab ?? internalSubTab)) as "edit" | "preview" | "compare" | "split";
  const setActiveTab = (next: "edit" | "preview" | "compare" | "split") => {
    if (structuredMode) {
      if (next === "edit" || next === "preview") setInternalSubTab(next);
      return;
    }
    if (onSubTabChange) onSubTabChange(next);
    else setInternalSubTab(next);
  };

  // ==== מדריכי-עמוד מדויקים ע"י Paged.js (מקור אמת יחיד לשבירות) ====
  const pagedGuidesStorageKey = `flow-edit:${template.id || "untitled"}:pagedGuides`;
  const [pagedGuidesOn, setPagedGuidesOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(pagedGuidesStorageKey) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (structuredMode) return;
    try {
      localStorage.setItem(pagedGuidesStorageKey, pagedGuidesOn ? "1" : "0");
    } catch { /* ignore */ }
  }, [pagedGuidesOn, pagedGuidesStorageKey, structuredMode]);

  const [editorContentEl, setEditorContentEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (activeTab !== "edit") return;
    // ממתינים עד ש-TipTap ירנדר את .flow-editor-content לתוך ה-DOM
    let attempts = 0;
    const tick = () => {
      const el = document.querySelector<HTMLElement>(".flow-editor-content");
      if (el) {
        setEditorContentEl(el);
        return;
      }
      if (attempts++ < 20) window.setTimeout(tick, 100);
    };
    tick();
  }, [activeTab, html]);


  const previewHtml = useMemo(() => {
    if (!pagedGuidesOn) return "";
    try {
      const doc = htmlToFlowDoc(html, template, { designSettings });
      const finalDoc = { ...doc, page: { ...doc.page, ...pageSetup } };
      const merge = projectToMergeData(projectDetails);
      return renderFlowToHtml(finalDoc, presetCfg, merge);
    } catch {
      return "";
    }
  }, [html, template, designSettings, pageSetup, presetCfg, projectDetails, pagedGuidesOn]);

  const guides = usePagedGuides({
    html: previewHtml,
    enabled: pagedGuidesOn && activeTab === "edit",
    editorContentEl,
  });

  // אם החליפו תבנית — טען טיוטה שמורה או תוכן בסיס
  useEffect(() => {
    if (structuredMode) {
      try {
        const saved = localStorage.getItem(structuredStorageKey(template.id));
        setHtml(saved ? syncStructuredSections(saved, template, {
          preserveItemStyling: preserveStyles,
          projectDetails,
          paymentsLayout,
        }) : baseHtml);
      } catch {
        setHtml(baseHtml);
      }
      return;
    }
    try {
      const saved = localStorage.getItem(storageKey(template.id));
      setHtml(saved || baseHtml);
    } catch {
      setHtml(baseHtml);
    }
  }, [template.id, baseHtml, structuredMode, preserveStyles, projectDetails, paymentsLayout, template]);

  const structuredSig = useMemo(
    () => structuredSectionsSignature(template) + `|${paymentsLayout}`,
    [template, paymentsLayout],
  );
  const prevStructuredSigRef = useRef("");
  useEffect(() => {
    if (!structuredMode || prevStructuredSigRef.current === structuredSig) return;
    prevStructuredSigRef.current = structuredSig;
    setHtml((current) => {
      const next = syncStructuredSections(current || baseHtml, template, {
        preserveItemStyling: preserveStyles,
        projectDetails,
        paymentsLayout,
      });
      try { localStorage.setItem(structuredStorageKey(template.id), next); } catch { /* best effort */ }
      return next;
    });
  }, [structuredMode, structuredSig, baseHtml, template, preserveStyles, projectDetails, paymentsLayout]);

  // ===== סנכרון אוטומטי של "לוח תשלומים" מטאב "תוכן" לעורך =====
  // ברגע שמשתמש משנה את לוח התשלומים / מחיר בסיס / מע״מ בטאב תוכן —
  // מקטע התשלומים בעורך Flow מתעדכן מיידית, גם אם יש טיוטה שמורה.
  const paySig = useMemo(
    () => paymentsSignature(template) + `|${paymentsLayout}`,
    [template, paymentsLayout],
  );
  const prevPaySigRef = useRef<string>("");
  useEffect(() => {
    if (structuredMode) return;
    if (prevPaySigRef.current === paySig) return;
    prevPaySigRef.current = paySig;
    setHtml((prev) => {
      const next = syncPaymentsSection(prev, template, {
        preserveItemStyling: preserveStyles,
        projectDetails,
        paymentsLayout,
      });
      if (next === prev) return prev;
      try {
        localStorage.setItem(storageKey(template.id), next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [paySig, template, preserveStyles, projectDetails, paymentsLayout, structuredMode]);

  const handleChange = (next: string) => {
    setHtml(next);
    try {
      localStorage.setItem(
        structuredMode ? structuredStorageKey(template.id) : storageKey(template.id),
        next,
      );
    } catch {
      /* quota / private mode */
    }
    if (structuredMode && onDesignSettingsChange) {
      onDesignSettingsChange((previous: any) => ({
        ...(previous || {}),
        flowStructuredEditableHtml: next,
        flow_structured_editable_html: next,
      }));
    }
  };

  const handleReset = () => {
    if (!window.confirm("לאפס את העריכה לתוכן המקורי של התבנית?")) return;
    try {
      localStorage.removeItem(
        structuredMode ? structuredStorageKey(template.id) : storageKey(template.id),
      );
    } catch {
      /* ignore */
    }
    if (structuredMode && onDesignSettingsChange) {
      onDesignSettingsChange((previous: any) => {
        const next = { ...(previous || {}) };
        delete next.flowStructuredEditableHtml;
        delete next.flow_structured_editable_html;
        return next;
      });
    }
    const resetHtml = structuredMode
      ? templateToEditableHtml(template, {
          preserveItemStyling: preserveStyles,
          projectDetails,
          keepFieldsAsPlaceholders: true,
          paymentsLayout,
          lockComputedSections: true,
        })
      : baseHtml;
    setHtml(resetHtml);
  };

  const setPaymentsLayout = (value: PaymentsLayout) => {
    setPaymentsLayoutState(value);
    try {
      localStorage.setItem(paymentsLayoutKey(template.id), value);
    } catch {
      /* ignore */
    }
  };

  const handleTogglePreserve = (value: boolean) => {
    // החלפת מצב משכתבת את ה-base וגם את הטיוטה — לכן מאשרים אם יש שינויים
    const hasDraft = (() => {
      try {
        return !!localStorage.getItem(
          structuredMode ? structuredStorageKey(template.id) : storageKey(template.id),
        );
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
      localStorage.removeItem(
        structuredMode ? structuredStorageKey(template.id) : storageKey(template.id),
      );
    } catch {
      /* ignore */
    }
    if (structuredMode) {
      const nextHtml = templateToEditableHtml(template, {
        preserveItemStyling: value,
        projectDetails,
        keepFieldsAsPlaceholders: true,
        paymentsLayout,
        lockComputedSections: true,
      });
      setHtml(nextHtml);
      onDesignSettingsChange?.((previous: any) => {
        const next = { ...(previous || {}) };
        delete next.flowStructuredEditableHtml;
        delete next.flow_structured_editable_html;
        return next;
      });
    }
  };

  // ===== שמירה בענן: שתי אופציות —
  //   (1) שמור הצעה ללקוח (אל תעדכן תבנית)
  //   (2) שמור הצעה + עדכן תבנית
  // בשתיהן: מנקה רק את ערכי השדות החכמים שמגיעים מ"פרטי פרויקט"
  // (השדות עצמם נשארים כ-placeholder למילוי הבא).
  const [cloudSaving, setCloudSaving] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const lastSavedQuoteIdRef = useRef<string | null>(null);

  // ניקוי data-resolved-value מצ'יפים של שדות דינמיים — מחזיר את הצ'יפ
  // למצב placeholder כך שבטעינה הבאה ה-fieldResolver ימלא ערך חדש מפרטי פרויקט.
  const stripResolvedFromHtml = (raw: string): string => {
    try {
      const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, "text/html");
      const root = doc.body.firstElementChild as HTMLElement | null;
      if (!root) return raw;
      root.querySelectorAll("span[data-field]").forEach((el) => {
        el.removeAttribute("data-resolved-value");
        el.removeAttribute("data-resolved");
        const label = el.getAttribute("data-label") || el.getAttribute("data-field") || "";
        if (label) el.textContent = `{{${label}}}`;
      });
      return root.innerHTML;
    } catch {
      return raw;
    }
  };

  const performCloudSave = async (mode: "client-only" | "client-and-template") => {
    if (cloudSaving) return;
    setSaveMenuOpen(false);
    setCloudSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId) {
        toast.error("יש להתחבר כדי לשמור בענן");
        return;
      }
      const mergeData = projectToMergeData(projectDetails);
      const title =
        (projectDetails as any)?.clientName ||
        (projectDetails as any)?.family ||
        template.name ||
        "טיוטה ללא שם";

      // 1) שמירת ההצעה כטיוטה בענן (תמיד)
      const payload: any = {
        user_id: userId,
        template_id: template.id || null,
        title,
        status: "draft",
        template_data: {
          flow_html: html,
          resolved_values: mergeData,
          preserve_styles: preserveStyles,
          preset_id: selectedPresetId,
          page_setup: pageSetup,
          source: "flow-v2",
        },
        project_details: projectDetails || {},
        design_settings: designSettings || {},
      };
      const { data, error } = await (supabase.from("saved_quotes") as any)
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      lastSavedQuoteIdRef.current = data?.id || null;

      // 2) אם נבחר — עדכון התבנית עצמה (HTML override + design_settings)
      const cleanedHtml = stripResolvedFromHtml(html);
      if (mode === "client-and-template" && template.id) {
        const nextDesignSettings = {
          ...((template as any)?.design_settings || {}),
          ...(designSettings || {}),
          flowV2OverrideHtml: cleanedHtml,
        };
        const { error: tplErr } = await (supabase.from("quote_templates") as any)
          .update({
            html_content: cleanedHtml,
            design_settings: nextDesignSettings,
          })
          .eq("id", template.id);
        if (tplErr) throw tplErr;
      }

      // 3) ריקון פרטי לקוח בלבד — שאר התבנית נשארת
      try {
        localStorage.setItem(storageKey(template.id), cleanedHtml);
      } catch {
        /* ignore */
      }
      setHtml(cleanedHtml);

      toast.success(
        mode === "client-and-template"
          ? "נשמר ✓ ההצעה נשמרה והתבנית עודכנה"
          : "נשמר ✓ ההצעה נשמרה כטיוטה",
      );
    } catch (err: any) {
      console.error("[FlowWorkspace] cloud save failed", err);
      toast.error(err?.message || "שמירה בענן נכשלה");
    } finally {
      setCloudSaving(false);
    }
  };

  // ===== Render helpers: blocks reused in inline-full mode and Settings popover =====
  const renderStripsBlock = () => (
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
        onClick={() => clearStrip("header")}
        title="נקה סטריפ עליון מכל העמודים"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <input
        className="h-7 w-14 rounded border bg-background px-1 text-center text-xs"
        type="number"
        value={designSettings?.headerStripHeight ?? 150}
        onChange={(e) => updateDesignSettings({ headerStripHeight: looseNumber(e.target.value, 150) })}
        title="גובה סטריפ עליון בפיקסלים"
      />
      <span className="text-[10px] text-muted-foreground">px</span>
      <input
        className="h-7 w-12 rounded border bg-background px-1 text-center text-xs"
        type="number"
        value={headerStripWidthPercent}
        onChange={(e) => {
          const next = looseNumber(e.target.value, 100);
          updateDesignSettings({
            headerStripWidthPercent: next,
            header_strip_width_percent: next,
          });
        }}
        title="רוחב סטריפ עליון באחוזים מרוחב הדף"
      />
      <span className="text-[10px] text-muted-foreground">% רוחב עליון</span>
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
        onClick={() => clearStrip("footer")}
        title="נקה סטריפ תחתון מכל העמודים"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <span className="mx-1 h-5 w-px bg-border" />
      <Button
        type="button"
        variant={pageSetup.showPageNumbers ? "secondary" : "outline"}
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={() => updatePageSetup({ showPageNumbers: !pageSetup.showPageNumbers })}
        title={pageSetup.showPageNumbers ? "בטל מיספור עמודים" : "הפעל מיספור עמודים"}
      >
        <Hash className="h-3.5 w-3.5" />
        {pageSetup.showPageNumbers ? "מיספור פעיל" : "מיספור כבוי"}
      </Button>

      <input
        className="h-7 w-14 rounded border bg-background px-1 text-center text-xs"
        type="number"
        value={designSettings?.footerStripHeight ?? 90}
        onChange={(e) => updateDesignSettings({ footerStripHeight: looseNumber(e.target.value, 90) })}
        title="גובה סטריפ תחתון בפיקסלים"
      />
      <span className="text-[10px] text-muted-foreground">px</span>
      <input
        className="h-7 w-12 rounded border bg-background px-1 text-center text-xs"
        type="number"
        value={footerStripWidthPercent}
        onChange={(e) => {
          const next = looseNumber(e.target.value, 100);
          updateDesignSettings({
            footerStripWidthPercent: next,
            footer_strip_width_percent: next,
          });
        }}
        title="רוחב סטריפ תחתון באחוזים מרוחב הדף"
      />
      <span className="text-[10px] text-muted-foreground">% רוחב תחתון</span>
      <input
        className="h-7 w-8 cursor-pointer rounded border bg-background p-0.5"
        type="color"
        value={designSettings?.stripBgColor || "#ffffff"}
        onChange={(e) => updateDesignSettings({ stripBgColor: e.target.value })}
        title="צבע רקע מאחורי הסטריפים"
      />
    </div>
  );

  const renderPageBlock = () => (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1">
      <Label className="whitespace-nowrap text-xs font-medium">גודל דף</Label>
      <Badge variant="secondary" className="h-7 px-2 text-xs">A4 · 210×297 מ״מ</Badge>
      <select
        className="h-7 rounded border bg-background px-2 text-xs"
        value={pageSetup.orientation || "portrait"}
        onChange={(e) =>
          updatePageSetup({ orientation: e.target.value as FlowPageSetup["orientation"] })
        }
        title="כיוון דף A4"
      >
        <option value="portrait">לאורך</option>
        <option value="landscape">לרוחב</option>
      </select>
    </div>
  );

  const renderSpacingBlock = () => {
    const gapMax = FLOW_STRIP_LIMITS.contentGapPx.max;
    const updateHeaderGap = (value: unknown) => {
      const next = boundedNumber(value, 18, 0, gapMax);
      updateDesignSettings({
        headerStripContentGapPx: next,
        header_content_gap_px: next,
      });
    };
    const updateFooterGap = (value: unknown) => {
      const next = boundedNumber(value, 18, 0, gapMax);
      updateDesignSettings({
        footerStripContentGapPx: next,
        footer_content_gap_px: next,
      });
    };
    const updatePageGap = (value: unknown) => {
      const next = boundedNumber(value, 18, 0, gapMax);
      updateDesignSettings({
        flowPageGapPx: next,
        flow_page_gap_px: next,
      });
    };
    const controls = [
      {
        label: "מרווח מתחת ללוגו העליון",
        help: "קובע היכן יתחיל הטקסט מתחת לכותרת העליונה",
        value: headerContentGapPx,
        update: updateHeaderGap,
      },
      {
        label: "מרווח מעל הלוגו התחתון",
        help: "שומר את סוף הטקסט במרחק מהכותרת התחתונה",
        value: footerContentGapPx,
        update: updateFooterGap,
      },
      {
        label: "מרווח בין הדפים בתצוגת העריכה",
        help: "משפיע רק על המרחק החזותי בין הדפים בעורך",
        value: flowPageGapPx,
        update: updatePageGap,
      },
    ];

    return (
      <div className="space-y-4">
        {controls.map((control) => (
          <div key={control.label} className="space-y-1.5 rounded-md border bg-muted/30 p-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-xs font-medium">{control.label}</Label>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{control.help}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <input
                  aria-label={control.label}
                  className="h-8 w-16 rounded border bg-background px-1 text-center text-xs"
                  type="number"
                  min={0}
                  max={gapMax}
                  value={control.value}
                  onChange={(event) => control.update(event.target.value)}
                />
                <span className="text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
            <input
              aria-label={`${control.label} — מחוון`}
              className="h-2 w-full cursor-pointer accent-primary"
              type="range"
              min={0}
              max={gapMax}
              step={2}
              value={control.value}
              onChange={(event) => control.update(event.target.value)}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-full text-xs"
          onClick={() => {
            updateHeaderGap(FLOW_STRIP_LIMITS.contentGapPx.fallback);
            updateFooterGap(FLOW_STRIP_LIMITS.contentGapPx.fallback);
            updatePageGap(FLOW_STRIP_LIMITS.contentGapPx.fallback);
          }}
        >
          <RotateCcw className="ml-1 h-3.5 w-3.5" />
          אפס מרווחים לברירת המחדל
        </Button>
      </div>
    );
  };


  const toolbarActions = (
    <>
      <div className="flex shrink-0 items-center gap-1 pl-1">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">{structuredMode ? "מסמך A4 חי" : "Flow"}</span>
      </div>

      {structuredMode && (
        <>
          <Badge variant="outline" className="h-6 shrink-0 text-[10px] text-emerald-700">
            מקור הנתונים: תוכן, תשלומים ועיצוב
          </Badge>
          <Badge variant="secondary" className="h-6 shrink-0 text-[10px]">
            שמירה אוטומטית
          </Badge>
        </>
      )}

      {workspaceActions}

      {workspaceActions && <span className="h-5 w-px shrink-0 bg-border" />}

      {(!hideInternalSubTabs || structuredMode) && (
        <TabsList className="!h-8 !min-h-0 !w-auto shrink-0 p-0.5">
          <TabsTrigger value="edit" className="h-7 gap-1 px-2 text-xs">
            <Pencil className="h-3.5 w-3.5" />
            {structuredMode ? "עריכת מסמך" : "עריכה"}
          </TabsTrigger>
          <TabsTrigger value="preview" className="h-7 gap-1 px-2 text-xs">
            <Eye className="h-3.5 w-3.5" />
            {structuredMode ? "תצוגת A4" : "תצוגה"}
          </TabsTrigger>
          {!structuredMode && <TabsTrigger value="compare" className="h-7 gap-1 px-2 text-xs" title="השוואת עריכה מול תצוגה + זיהוי פערי שבירת עמודים">
            <Columns2 className="h-3.5 w-3.5" />
            השוואה
          </TabsTrigger>}
          {!structuredMode && <TabsTrigger value="split" className="h-7 gap-1 px-2 text-xs" title="פיצול מסך — עריכה + תצוגה חיה מיידית (ללא רינדור מורגש)">
            <SplitSquareHorizontal className="h-3.5 w-3.5" />
            פיצול
          </TabsTrigger>}
        </TabsList>
      )}

      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={pagedGuidesOn ? "default" : "outline"}
              size="sm"
              onClick={() => setPagedGuidesOn((v) => !v)}
              className={`${structuredMode ? "hidden" : ""} h-8 shrink-0 gap-1 px-2 text-xs`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              PDF מדויק
              {pagedGuidesOn && guides.loading && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {pagedGuidesOn && !guides.loading && guides.pageCount > 0 && (
                <span className="rounded bg-primary-foreground/20 px-1 text-[10px]">
                  {guides.pageCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-right">
            מציג במצב עריכה קווים מקווקווים בדיוק במקום שבו יישבר עמוד ב-PDF —
            מקור אמת יחיד (Paged.js). מתעדכן אוטומטית תוך ~500ms אחרי הקלדה.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>


      <Popover open={saveMenuOpen} onOpenChange={setSaveMenuOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={cloudSaving}
            title="שמור את ההצעה — בחר אם לעדכן גם את התבנית"
            className={`${structuredMode ? "hidden" : ""} h-8 shrink-0 gap-1 px-2 text-xs`}
          >
            {cloudSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Cloud className="h-3.5 w-3.5" />
            )}
            שמור
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          dir="rtl"
          className="w-72 p-2"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-1.5">
            <p className="px-1 pb-1 text-[11px] text-muted-foreground">
              ההצעה תישמר כטיוטה ללקוח. פרטי הלקוח בלבד יתרוקנו — שאר התבנית
              תישאר.
            </p>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              disabled={cloudSaving}
              onClick={() => performCloudSave("client-only")}
            >
              <Cloud className="h-3.5 w-3.5" />
              שמור הצעה ללקוח (אל תעדכן תבנית)
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              disabled={cloudSaving}
              onClick={() => performCloudSave("client-and-template")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              שמור הצעה + עדכן תבנית
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleReset}
            aria-label="אפס לתוכן התבנית המקורי"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>אפס לתוכן התבנית המקורי</TooltipContent>
      </Tooltip>

      {/* ===== Per-feature popovers: each icon+label opens its own panel ===== */}

      {/* עיצוב — toggle preserve styles */}
      <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2 h-8">
        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
        <Label
          htmlFor="preserve-styles"
          className="cursor-pointer text-xs font-medium"
          title="שמירת עיצוב מקורי מהתבנית"
        >
          עיצוב
        </Label>
        <Switch
          id="preserve-styles"
          checked={preserveStyles}
          onCheckedChange={handleTogglePreserve}
          className="scale-75"
        />
      </div>

      {/* ערכות */}
      <Popover
        open={presetsOpen}
        onOpenChange={(o) => {
          // אל תסגור את ה-Popover כל עוד דיאלוג עריכת ערכה פתוח —
          // אחרת הקומפוננטה מתפרקת והדיאלוג נסגר איתה
          if (!o && presetDialogOpen) return;
          setPresetsOpen(o);
        }}
      >
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1 px-2 text-xs">
            <Layers className="h-3.5 w-3.5" />
            ערכות
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={6}
          dir="rtl"
          className={`w-[340px] p-3 ${presetDialogOpen ? "invisible pointer-events-none" : ""}`}
          onInteractOutside={(e) => {
            if (presetDialogOpen) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (presetDialogOpen) e.preventDefault();
          }}
        >
          <div className="mb-2 text-xs font-medium text-muted-foreground">ערכות עיצוב</div>
          <PresetPicker
            selectedId={selectedPresetId}
            onSelect={(p) => {
              handlePresetSelect(p);
              setPresetsOpen(false);
            }}
            onDialogOpenChange={setPresetDialogOpen}
          />
        </PopoverContent>
      </Popover>

      {/* תשלומים */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1 px-2 text-xs">
            <Receipt className="h-3.5 w-3.5" />
            תשלומים
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={6} dir="rtl" className="w-[260px] p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">תצוגת לוח תשלומים</div>
          <div className="flex rounded-md border border-border overflow-hidden">
            {([
              { v: "list", l: "רשימה" },
              { v: "table", l: "טבלה" },
              { v: "both", l: "גם וגם" },
            ] as Array<{ v: PaymentsLayout; l: string }>).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setPaymentsLayout(opt.v)}
                className={`flex-1 px-2 py-1.5 text-xs transition-colors ${
                  paymentsLayout === opt.v
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* סטריפים */}
      {onDesignSettingsChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1 px-2 text-xs">
              <Rows3 className="h-3.5 w-3.5" />
              סטריפים
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={6} dir="rtl" className="w-[680px] max-w-[95vw] max-h-[70vh] overflow-auto p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">סטריפים וגבולות כתיבה</div>
            {renderStripsBlock()}
          </PopoverContent>
        </Popover>
      )}

      {/* מרווחים סביב הלוגואים */}
      {onDesignSettingsChange && (
        <Button
          type="button"
          variant={spacingPanelOpen ? "secondary" : "outline"}
          size="sm"
          className="h-8 shrink-0 gap-1 px-2 text-xs"
          aria-pressed={spacingPanelOpen}
          onClick={() => setSpacingPanelOpen((current) => !current)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          מרווחים
        </Button>
      )}

      {/* דף */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1 px-2 text-xs">
            <FileText className="h-3.5 w-3.5" />
            דף
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={6} dir="rtl" className="w-[360px] p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">גודל וכיוון דף</div>
          {renderPageBlock()}
        </PopoverContent>
      </Popover>

    </>
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "edit" | "preview" | "compare" | "split")}
      className="flex h-full flex-col"
    >
      <TabsContent value="edit" className="m-0 flex-1 overflow-hidden">
        <FlowEditor
          initialHtml={html}
          onChange={handleChange}
          preset={presetCfg}
          pageSetup={pageSetup}
          templateDesignSettings={template.design_settings}
          designSettings={designSettings}
          onDesignSettingsChange={updateDesignSettings}
          projectDetails={projectDetails}
          toolbarActions={toolbarActions}
          pagedGuides={{
            enabled: pagedGuidesOn,
            breakYs: guides.breakYs,
            loading: guides.loading,
            error: guides.error,
          }}
        />
      </TabsContent>
      <TabsContent value="preview" className="m-0 flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <TooltipProvider delayDuration={250}>
            <div className="shrink-0 border-b bg-background">
              <div className="flex max-h-[72px] flex-wrap items-center gap-1 overflow-y-auto px-2 py-1.5">
                {toolbarActions}
              </div>
            </div>
          </TooltipProvider>
          <div className="min-h-0 flex-1 overflow-hidden">
            <FlowPreviewTab
              template={template}
              editedHtml={html}
              preset={presetCfg}
              projectDetails={projectDetails}
              designSettings={designSettings}
              pageSetup={pageSetup}
              onPrintReady={onPrintReady}
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="compare" className="m-0 flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <TooltipProvider delayDuration={250}>
            <div className="shrink-0 border-b bg-background">
              <div className="flex max-h-[72px] flex-wrap items-center gap-1 overflow-y-auto px-2 py-1.5">
                {toolbarActions}
              </div>
            </div>
          </TooltipProvider>
          <div className="min-h-0 flex-1 overflow-hidden">
            <FlowCompareView
              template={template}
              html={html}
              onChange={handleChange}
              preset={presetCfg}
              pageSetup={pageSetup}
              projectDetails={projectDetails}
              designSettings={designSettings}
              onDesignSettingsChange={updateDesignSettings}
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="split" className="m-0 flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <TooltipProvider delayDuration={250}>
            <div className="shrink-0 border-b bg-background">
              <div className="flex max-h-[72px] flex-wrap items-center gap-1 overflow-y-auto px-2 py-1.5">
                {toolbarActions}
              </div>
            </div>
          </TooltipProvider>
          <div className="min-h-0 flex-1 overflow-hidden">
            <LiveSplitView
              template={template}
              html={html}
              onChange={handleChange}
              preset={presetCfg}
              pageSetup={pageSetup}
              projectDetails={projectDetails}
              designSettings={designSettings}
              onDesignSettingsChange={updateDesignSettings}
            />
          </div>
        </div>
      </TabsContent>






      {onDesignSettingsChange && spacingPanelOpen && (
        <div
          ref={spacingPanelRef}
          role="dialog"
          aria-modal="false"
          aria-label="מרווחי תוכן ולוגואים"
          data-testid="floating-spacing-panel"
          dir="rtl"
          className="fixed z-[120] flex w-[420px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-xl border-2 border-primary/30 bg-background shadow-2xl"
          style={{
            left: spacingPanelPosition.x,
            top: spacingPanelPosition.y,
            maxHeight: "calc(100vh - 16px)",
          }}
        >
          <div
            className="flex touch-none cursor-move select-none items-center gap-2 border-b bg-muted/80 px-3 py-2"
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest("button")) return;
              const rect = spacingPanelRef.current?.getBoundingClientRect();
              if (!rect) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              setSpacingPanelDrag({
                pointerId: event.pointerId,
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
              });
            }}
            onPointerMove={(event) => {
              if (!spacingPanelDrag || spacingPanelDrag.pointerId !== event.pointerId) return;
              setSpacingPanelPosition(
                clampSpacingPanelPosition({
                  x: event.clientX - spacingPanelDrag.offsetX,
                  y: event.clientY - spacingPanelDrag.offsetY,
                }),
              );
            }}
            onPointerUp={(event) => {
              if (spacingPanelDrag?.pointerId === event.pointerId) setSpacingPanelDrag(null);
            }}
            onPointerCancel={() => setSpacingPanelDrag(null)}
          >
            <GripHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">מרווחי תוכן ולוגואים</div>
              <p className="text-[10px] text-muted-foreground">גררו מכאן כדי להזיז · המיקום נשמר אוטומטית</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              aria-label="סגור חלון מרווחים"
              onClick={() => setSpacingPanelOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto p-3">
            <p className="mb-3 text-[11px] text-muted-foreground">
              השינויים מתעדכנים מיד במיקום הטקסט, בתצוגת A4 ובהדפסה.
            </p>
            {renderSpacingBlock()}
          </div>
        </div>
      )}

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
