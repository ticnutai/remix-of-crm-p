// עמוד עורך תבנית הצעת מחיר - תצוגת דף מלאה (לא דיאלוג)
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { HtmlTemplateEditor } from "@/components/quotes/QuoteTemplatesManager/HtmlTemplateEditor";
import { MobileTemplateWizard } from "@/components/quotes/QuoteTemplatesManager/mobile/MobileTemplateWizard";
import {
  QuoteTemplate,
  createEmptyTemplate,
  DEFAULT_DESIGN_SETTINGS,
} from "@/components/quotes/QuoteTemplatesManager/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";

function normalizeTemplate(t: any): QuoteTemplate {
  return {
    ...t,
    items: t.items || [],
    stages: t.stages || [],
    stagesTitle: t.stages_title || undefined,
    payment_schedule: t.payment_schedule || [],
    timeline: t.timeline || [],
    important_notes: t.important_notes || [],
    design_settings: t.design_settings || DEFAULT_DESIGN_SETTINGS,
    validity_days: t.validity_days || 30,
    show_vat: t.show_vat ?? true,
    vat_rate: t.vat_rate || 18,
    html_content: t.html_content || null,
    text_boxes: t.text_boxes || [],
    upgrades: t.upgrades || [],
    project_details: t.project_details || {},
    pricing_tiers: t.pricing_tiers || [],
    base_price: t.base_price || 0,
    folder_id: t.folder_id || null,
  } as QuoteTemplate;
}

export default function QuoteTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [template, setTemplate] = useState<QuoteTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // New template flow
        if (!id || id === "new") {
          const stateTemplate = (location.state as any)?.template as
            | QuoteTemplate
            | undefined;
          const folderId = (location.state as any)?.folderId as
            | string
            | null
            | undefined;
          const base =
            stateTemplate ||
            ({
              ...createEmptyTemplate(),
              id: "",
              folder_id: folderId ?? null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as QuoteTemplate);
          if (!cancelled) setTemplate(base);
          return;
        }

        const { data, error } = await (supabase as any)
          .from("quote_templates")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast({
            title: "התבנית לא נמצאה",
            variant: "destructive",
          });
          navigate("/quote-templates", { replace: true });
          return;
        }
        if (!cancelled) setTemplate(normalizeTemplate(data));
      } catch (err: any) {
        toast({
          title: "שגיאה בטעינת התבנית",
          description: err?.message,
          variant: "destructive",
        });
        navigate("/quote-templates", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (t: Partial<QuoteTemplate>) => {
    const payload: any = {
      name: t.name,
      description: t.description,
      category: t.category,
      items: t.items || [],
      stages: t.stages || [],
      stages_title: t.stagesTitle || null,
      payment_schedule: t.payment_schedule || [],
      timeline: t.timeline || [],
      terms: t.terms,
      notes: t.notes,
      important_notes: t.important_notes || [],
      validity_days: t.validity_days || 30,
      design_settings: t.design_settings || DEFAULT_DESIGN_SETTINGS,
      show_vat: t.show_vat ?? true,
      vat_rate: t.vat_rate || 18,
      is_active: t.is_active ?? true,
      html_content: t.html_content || null,
      text_boxes: t.text_boxes || [],
      upgrades: t.upgrades || [],
      project_details: t.project_details || {},
      base_price: t.base_price || 0,
      pricing_tiers: t.pricing_tiers || [],
      folder_id: t.folder_id || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (t.id) {
        const { error } = await (supabase as any)
          .from("quote_templates")
          .update(payload)
          .eq("id", t.id);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any)
          .from("quote_templates")
          .insert([payload])
          .select("id")
          .single();
        if (error) throw error;
        // Update URL to the persisted id without reloading
        if (data?.id) {
          setTemplate((prev) =>
            prev ? ({ ...prev, ...t, id: data.id } as QuoteTemplate) : prev,
          );
          navigate(`/quote-templates/editor/${data.id}`, { replace: true });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["quote-templates-advanced"] });
    } catch (err: any) {
      toast({
        title: "שגיאה בשמירה",
        description: err?.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  return (
    <AppLayout title="עריכת תבנית הצעת מחיר">
      {loading || !template ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <HtmlTemplateEditor
          asPage
          open
          onClose={() => navigate("/quote-templates")}
          template={template}
          onSave={handleSave}
        />
      )}
    </AppLayout>
  );
}
