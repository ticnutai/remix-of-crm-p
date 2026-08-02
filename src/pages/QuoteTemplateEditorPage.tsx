// עמוד עורך תבנית הצעת מחיר - תצוגת דף מלאה (לא דיאלוג)
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { HtmlTemplateEditor } from "@/components/quotes/QuoteTemplatesManager/HtmlTemplateEditor";
import {
  QuoteTemplate,
  createEmptyTemplate,
  DEFAULT_DESIGN_SETTINGS,
} from "@/components/quotes/QuoteTemplatesManager/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
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
    vat_rate: t.vat_rate ?? 18,
    html_content: t.html_content || null,
    text_boxes: t.text_boxes || [],
    upgrades: t.upgrades || [],
    project_details: t.project_details || {},
    pricing_tiers: t.pricing_tiers || [],
    base_price: t.base_price || 0,
    folder_id: t.folder_id || null,
  } as QuoteTemplate;
}

function withoutTemplateClientFields(details: any) {
  return {
    ...(details && typeof details === "object" ? details : {}),
    clientId: "",
    clientName: "",
    gush: "",
    helka: "",
    migrash: "",
  };
}

export default function QuoteTemplateEditorPage() {
  const { id, savedQuoteId, contractId } = useParams<{
    id?: string;
    savedQuoteId?: string;
    contractId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [template, setTemplate] = useState<QuoteTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSavedQuoteId, setActiveSavedQuoteId] = useState<string | null>(
    savedQuoteId || null,
  );

  const templateFromSavedQuote = (savedQuote: any): QuoteTemplate => {
    const templateData =
      savedQuote?.template_data &&
      typeof savedQuote.template_data === "object"
        ? savedQuote.template_data
        : {};

    return normalizeTemplate({
      ...templateData,
      id:
        savedQuote.template_id ||
        templateData.id ||
        `saved_quote_${savedQuote.id}`,
      name: savedQuote.title || templateData.name || "חוזה",
      description:
        templateData.description || savedQuote.description || "",
      payment_schedule:
        savedQuote.payment_schedule || templateData.payment_schedule || [],
      design_settings:
        savedQuote.design_settings ||
        templateData.design_settings ||
        DEFAULT_DESIGN_SETTINGS,
      text_boxes: savedQuote.text_boxes || templateData.text_boxes || [],
      upgrades: savedQuote.upgrades || templateData.upgrades || [],
      pricing_tiers:
        savedQuote.pricing_tiers || templateData.pricing_tiers || [],
      project_details: {
        ...(templateData.project_details || {}),
        ...(savedQuote.project_details || {}),
        clientId:
          savedQuote.project_details?.clientId ||
          templateData.project_details?.clientId ||
          savedQuote.client_id ||
          "",
        clientName:
          savedQuote.project_details?.clientName ||
          templateData.project_details?.clientName ||
          savedQuote.clients?.name ||
          "",
      },
      base_price:
        savedQuote.base_price ?? templateData.base_price ?? 0,
      vat_rate: savedQuote.vat_rate ?? templateData.vat_rate ?? 18,
      created_at:
        templateData.created_at ||
        savedQuote.created_at ||
        new Date().toISOString(),
      updated_at: savedQuote.updated_at || new Date().toISOString(),
    });
  };

  const templateFromContract = (contract: any): QuoteTemplate =>
    normalizeTemplate({
      ...createEmptyTemplate(),
      id: contract.template_id || `contract_${contract.id}`,
      name: contract.title || contract.contract_number || "חוזה",
      description: contract.description || "",
      items: [],
      stages: [],
      payment_schedule: [],
      terms: contract.terms_and_conditions || "",
      notes: contract.notes || "",
      base_price: Number(contract.contract_value || 0),
      show_vat: false,
      vat_rate: 0,
      project_details: {
        clientId: contract.client_id || "",
        clientName: contract.clients?.name || "",
        phone: contract.clients?.phone || "",
        email: contract.clients?.email || "",
      },
      created_at: contract.created_at || new Date().toISOString(),
      updated_at: contract.updated_at || new Date().toISOString(),
    });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (savedQuoteId) {
          const { data: savedQuote, error: savedQuoteError } = await (
            supabase as any
          )
            .from("saved_quotes")
            .select("*, clients:client_id(id, name, phone, email)")
            .eq("id", savedQuoteId)
            .maybeSingle();

          if (savedQuoteError) throw savedQuoteError;
          if (!savedQuote) {
            toast({
              title: "החוזה המקושר לא נמצא",
              variant: "destructive",
            });
            navigate("/quotes", { replace: true });
            return;
          }

          if (!cancelled) {
            setActiveSavedQuoteId(savedQuote.id);
            setTemplate(templateFromSavedQuote(savedQuote));
          }
          return;
        }

        if (contractId) {
          const { data: contract, error: contractError } = await (
            supabase as any
          )
            .from("contracts")
            .select("*, clients:client_id(id, name, phone, email)")
            .eq("id", contractId)
            .maybeSingle();

          if (contractError) throw contractError;
          if (!contract) {
            toast({
              title: "החוזה לא נמצא",
              variant: "destructive",
            });
            navigate("/quotes", { replace: true });
            return;
          }

          let linkedSavedQuote = null;
          if (contract.saved_quote_id) {
            const { data } = await (supabase as any)
              .from("saved_quotes")
              .select("*, clients:client_id(id, name, phone, email)")
              .eq("id", contract.saved_quote_id)
              .maybeSingle();
            linkedSavedQuote = data || null;
          }

          if (!linkedSavedQuote) {
            // Older contracts can point to a quote that was removed. Rebuild a
            // durable editable document from the contract metadata and repair
            // the link so every later click opens the same Flow V2 document.
            const restoredTemplate = templateFromContract(contract);
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("נדרשת התחברות כדי לשחזר את החוזה");

            const restoredQuotePayload = {
              user_id: user.id,
              client_id: contract.client_id,
              template_id: contract.template_id || null,
              title: contract.title || contract.contract_number || "חוזה",
              description: contract.description || "",
              status: "signed",
              base_price: Number(contract.contract_value || 0),
              vat_rate: 0,
              total_with_vat: Number(contract.contract_value || 0),
              template_data: restoredTemplate as any,
              project_details: restoredTemplate.project_details as any,
              payment_schedule: [],
              design_settings: restoredTemplate.design_settings as any,
              text_boxes: restoredTemplate.text_boxes || [],
              upgrades: restoredTemplate.upgrades || [],
              pricing_tiers: restoredTemplate.pricing_tiers || [],
              notes: contract.notes || "",
            };

            const { data: restoredQuote, error: restoreError } = await (
              supabase as any
            )
              .from("saved_quotes")
              .insert(restoredQuotePayload)
              .select("*, clients:client_id(id, name, phone, email)")
              .single();
            if (restoreError) throw restoreError;

            const { error: linkError } = await (supabase as any)
              .from("contracts")
              .update({ saved_quote_id: restoredQuote.id })
              .eq("id", contract.id);
            if (linkError) throw linkError;

            linkedSavedQuote = restoredQuote;
            toast({
              title: "קישור החוזה תוקן",
              description: "החוזה שוחזר ונפתח בעורך Flow V2",
            });
          }

          if (!cancelled) {
            setActiveSavedQuoteId(linkedSavedQuote.id);
            setTemplate(templateFromSavedQuote(linkedSavedQuote));
          }
          return;
        }

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
        if (!cancelled) {
          const normalized = normalizeTemplate(data);
          setTemplate({
            ...normalized,
            project_details: withoutTemplateClientFields(normalized.project_details),
          });
        }
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
  }, [id, savedQuoteId, contractId]);

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
      vat_rate: t.vat_rate ?? 18,
      is_active: t.is_active ?? true,
      html_content: t.html_content || null,
      text_boxes: t.text_boxes || [],
      upgrades: t.upgrades || [],
      project_details: withoutTemplateClientFields(t.project_details),
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

  const handleSaveAsNewTemplate = async (t: Partial<QuoteTemplate>) => {
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
      vat_rate: t.vat_rate ?? 18,
      is_active: t.is_active ?? true,
      html_content: t.html_content || null,
      text_boxes: t.text_boxes || [],
      upgrades: t.upgrades || [],
      project_details: withoutTemplateClientFields(t.project_details),
      base_price: t.base_price || 0,
      pricing_tiers: t.pricing_tiers || [],
      folder_id: t.folder_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as any)
      .from("quote_templates")
      .insert([payload]);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["quote-templates-advanced"] });
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
          savedQuoteId={activeSavedQuoteId || undefined}
          onSave={handleSave}
          templateEditorMode={!savedQuoteId && !contractId}
          onSaveAsNewTemplate={handleSaveAsNewTemplate}
        />
      )}
    </AppLayout>
  );
}
