-- ============================================================
-- Quotes Pro — שיתוף ציבורי של מסמכים (לינק ללקוח)
-- Date: 2026-06-25
-- מוסיף is_public + share_token, ומדיניות SELECT ל-anon על מסמכים ציבוריים בלבד.
-- ============================================================

ALTER TABLE public.qp_documents ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE public.qp_documents ADD COLUMN IF NOT EXISTS share_token uuid DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_qp_documents_share_token ON public.qp_documents(share_token);

-- אנונימי יכול לקרוא רק מסמכים שסומנו ציבוריים
DROP POLICY IF EXISTS qp_documents_public_select ON public.qp_documents;
CREATE POLICY qp_documents_public_select
  ON public.qp_documents
  FOR SELECT
  TO anon
  USING (is_public = true);
