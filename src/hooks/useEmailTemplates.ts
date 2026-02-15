// Email templates, signatures, and drafts management hook
import { useState, useCallback, useEffect } from "react";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface EmailSignature {
  id: string;
  name: string;
  html: string;
  isDefault: boolean;
}

export interface EmailDraft {
  id: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  attachmentNames: string[];
  savedAt: string;
}

const TEMPLATES_KEY = "email_templates";
const SIGNATURES_KEY = "email_signatures";
const DRAFTS_KEY = "email_drafts";

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem(TEMPLATES_KEY);
      if (savedTemplates) setTemplates(JSON.parse(savedTemplates));

      const savedSignatures = localStorage.getItem(SIGNATURES_KEY);
      if (savedSignatures) setSignatures(JSON.parse(savedSignatures));

      const savedDrafts = localStorage.getItem(DRAFTS_KEY);
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    } catch (e) {
      console.error("Error loading email templates data:", e);
    }
  }, []);

  // === TEMPLATES ===
  const saveTemplate = useCallback(
    (template: Omit<EmailTemplate, "id" | "createdAt">) => {
      const newTemplate: EmailTemplate = {
        ...template,
        id: `tpl_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setTemplates((prev) => {
        const updated = [...prev, newTemplate];
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
        return updated;
      });
      return newTemplate;
    },
    [],
  );

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateTemplate = useCallback(
    (id: string, data: Partial<EmailTemplate>) => {
      setTemplates((prev) => {
        const updated = prev.map((t) => (t.id === id ? { ...t, ...data } : t));
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  // === SIGNATURES ===
  const saveSignature = useCallback((signature: Omit<EmailSignature, "id">) => {
    const newSig: EmailSignature = {
      ...signature,
      id: `sig_${Date.now()}`,
    };
    setSignatures((prev) => {
      // If this is default, unset others
      let updated = signature.isDefault
        ? prev.map((s) => ({ ...s, isDefault: false }))
        : [...prev];
      updated = [...updated, newSig];
      localStorage.setItem(SIGNATURES_KEY, JSON.stringify(updated));
      return updated;
    });
    return newSig;
  }, []);

  const deleteSignature = useCallback((id: string) => {
    setSignatures((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(SIGNATURES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSignature = useCallback(
    (id: string, data: Partial<EmailSignature>) => {
      setSignatures((prev) => {
        let updated = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
        // If setting as default, unset others
        if (data.isDefault) {
          updated = updated.map((s) =>
            s.id === id ? s : { ...s, isDefault: false },
          );
        }
        localStorage.setItem(SIGNATURES_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  const getDefaultSignature = useCallback((): EmailSignature | null => {
    return signatures.find((s) => s.isDefault) || null;
  }, [signatures]);

  // === DRAFTS ===
  const saveDraft = useCallback(
    (draft: Omit<EmailDraft, "id" | "savedAt">, existingId?: string) => {
      const draftData: EmailDraft = {
        ...draft,
        id: existingId || `draft_${Date.now()}`,
        savedAt: new Date().toISOString(),
      };
      setDrafts((prev) => {
        const updated = existingId
          ? prev.map((d) => (d.id === existingId ? draftData : d))
          : [...prev, draftData];
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
        return updated;
      });
      return draftData;
    },
    [],
  );

  const deleteDraft = useCallback((id: string) => {
    setDrafts((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    // Templates
    templates,
    saveTemplate,
    deleteTemplate,
    updateTemplate,
    // Signatures
    signatures,
    saveSignature,
    deleteSignature,
    updateSignature,
    getDefaultSignature,
    // Drafts
    drafts,
    saveDraft,
    deleteDraft,
  };
}
