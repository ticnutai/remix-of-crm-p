// FlowWorkspaceTab — מאחד עורך עשיר + תצוגה מקדימה בטאב אחד.
// טאב הראשי החדש שמחליף את FlowPreviewTab הישיר ב-HtmlTemplateEditor.

import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil, Eye, RotateCcw, Sparkles } from "lucide-react";
import type { QuoteTemplate } from "../types";
import FlowEditor from "./editor/FlowEditor";
import FlowPreviewTab from "./FlowPreviewTab";
import { templateToEditableHtml } from "./editor/templateToHtml";
import PresetPicker from "./presets/PresetPicker";
import type { DesignPreset } from "./presets/types";
import { safeConfig, usePresets } from "./presets/usePresets";

interface Props {
  template: QuoteTemplate;
  projectDetails?: any;
}

const storageKey = (id?: string) => `flow-edit:${id || "untitled"}`;
const styleKey = (id?: string) => `flow-edit:${id || "untitled"}:preserveStyles`;
const presetKey = (id?: string) => `flow-edit:${id || "untitled"}:presetId`;

export default function FlowWorkspaceTab({ template, projectDetails }: Props) {
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
        <FlowEditor initialHtml={html} onChange={handleChange} preset={presetCfg} />
      </TabsContent>
      <TabsContent value="preview" className="m-0 flex-1 overflow-hidden">
        <FlowPreviewTab
          template={template}
          editedHtml={html}
          preset={presetCfg}
          projectDetails={projectDetails}
        />
      </TabsContent>
    </Tabs>
  );
}
