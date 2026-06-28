-- ============================================================
-- Migration: Quotes Pro — block-based quote system (isolated)
-- Date: 2026-06-25
-- מנותק לחלוטין מ-quote_templates. ראו docs/quotes-pro/00-spec.md
-- ============================================================

-- ---------- qp_themes : ערכות עיצוב לשימוש חוזר ----------
CREATE TABLE IF NOT EXISTS public.qp_themes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    theme jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- ---------- qp_folders : תיקיות מקוננות ----------
CREATE TABLE IF NOT EXISTS public.qp_folders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    color text DEFAULT '#d8ac27',
    icon text DEFAULT 'folder',
    parent_id uuid REFERENCES public.qp_folders(id) ON DELETE SET NULL,
    sort_order integer DEFAULT 0,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ---------- qp_documents : המסמך כ-JSON בלוקים ----------
CREATE TABLE IF NOT EXISTS public.qp_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL DEFAULT '',
    description text,
    category text NOT NULL DEFAULT 'construction',
    folder_id uuid REFERENCES public.qp_folders(id) ON DELETE SET NULL,
    blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
    theme jsonb NOT NULL DEFAULT '{}'::jsonb,
    theme_id uuid REFERENCES public.qp_themes(id) ON DELETE SET NULL,
    page jsonb NOT NULL DEFAULT '{}'::jsonb,
    pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
    meta jsonb NOT NULL DEFAULT '{}'::jsonb,
    validity_days integer DEFAULT 30,
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ---------- qp_versions : היסטוריית גרסאות ----------
CREATE TABLE IF NOT EXISTS public.qp_versions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id uuid NOT NULL REFERENCES public.qp_documents(id) ON DELETE CASCADE,
    version_number integer NOT NULL DEFAULT 1,
    label text NOT NULL DEFAULT 'גרסה',
    snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE (document_id, version_number)
);

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_qp_documents_folder ON public.qp_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_qp_documents_created ON public.qp_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qp_folders_parent ON public.qp_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_qp_versions_document ON public.qp_versions(document_id);

-- ---------- RLS ----------
ALTER TABLE public.qp_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qp_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qp_versions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['qp_themes', 'qp_folders', 'qp_documents', 'qp_versions']
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_select') THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', t || '_select', t);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_insert') THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t || '_insert', t);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_update') THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true)', t || '_update', t);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_delete') THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (true)', t || '_delete', t);
        END IF;
    END LOOP;
END $$;

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION public.qp_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_qp_documents_updated_at ON public.qp_documents;
CREATE TRIGGER trg_qp_documents_updated_at
    BEFORE UPDATE ON public.qp_documents
    FOR EACH ROW EXECUTE FUNCTION public.qp_set_updated_at();

DROP TRIGGER IF EXISTS trg_qp_folders_updated_at ON public.qp_folders;
CREATE TRIGGER trg_qp_folders_updated_at
    BEFORE UPDATE ON public.qp_folders
    FOR EACH ROW EXECUTE FUNCTION public.qp_set_updated_at();

-- ---------- next version helper ----------
CREATE OR REPLACE FUNCTION public.qp_next_version_number(p_document_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(MAX(version_number), 0) + 1
    FROM public.qp_versions
    WHERE document_id = p_document_id;
$$;
