-- ============================================================
-- Quotes Pro — סטריפים (פסי כותרת עליון/תחתון)
-- Date: 2026-06-25
-- ============================================================
ALTER TABLE public.qp_documents ADD COLUMN IF NOT EXISTS strips jsonb NOT NULL DEFAULT '{}'::jsonb;
