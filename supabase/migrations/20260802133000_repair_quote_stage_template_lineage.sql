-- Repair and continuously track stage-template lineage for clients created
-- from quote templates. Category membership remains classification-only.

CREATE OR REPLACE FUNCTION public.track_quote_stage_template_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
BEGIN
  IF NEW.client_id IS NULL OR NEW.project_details IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_template_id := NULLIF(
      COALESCE(
        NEW.project_details->>'stageTemplateId',
        NEW.project_details->>'stage_template_id'
      ),
      ''
    )::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_template_id := NULL;
  END;

  IF v_template_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.stage_templates WHERE id = v_template_id) THEN
    INSERT INTO public.client_stage_template_assignments (
      client_id, template_id, synced_version, applied_at, last_synced_at
    )
    SELECT NEW.client_id, st.id, st.structure_version, now(), now()
    FROM public.stage_templates st
    WHERE st.id = v_template_id
    ON CONFLICT (client_id, template_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS track_quote_stage_template_assignment ON public.saved_quotes;
CREATE TRIGGER track_quote_stage_template_assignment
AFTER INSERT OR UPDATE OF client_id, project_details ON public.saved_quotes
FOR EACH ROW EXECUTE FUNCTION public.track_quote_stage_template_assignment();

-- Backfill only when a saved quote explicitly records the selected workflow
-- template. This avoids treating manual category membership as template origin.
WITH quote_lineage AS (
  SELECT DISTINCT
    sq.client_id,
    CASE
      WHEN COALESCE(
        sq.project_details->>'stageTemplateId',
        sq.project_details->>'stage_template_id'
      ) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN COALESCE(
        sq.project_details->>'stageTemplateId',
        sq.project_details->>'stage_template_id'
      )::uuid
      ELSE NULL
    END AS template_id
  FROM public.saved_quotes sq
  WHERE sq.client_id IS NOT NULL
    AND sq.project_details IS NOT NULL
)
INSERT INTO public.client_stage_template_assignments (
  client_id, template_id, synced_version, applied_at, last_synced_at
)
SELECT q.client_id, st.id, st.structure_version, now(), now()
FROM quote_lineage q
JOIN public.stage_templates st ON st.id = q.template_id
WHERE q.template_id IS NOT NULL
ON CONFLICT (client_id, template_id) DO NOTHING;

-- Attach exact stage-name matches for quote-proven clients. Existing completion
-- state and all client-specific fields remain untouched.
UPDATE public.client_stages cs
SET source_template_id = a.template_id,
    source_template_stage_id = sts.id
FROM public.client_stage_template_assignments a
JOIN public.stage_template_stages sts ON sts.template_id = a.template_id
WHERE cs.client_id = a.client_id
  AND cs.source_template_stage_id IS NULL
  AND lower(btrim(cs.stage_name)) = lower(btrim(sts.stage_name));

-- Attach exact task-title matches inside already matched stages, without
-- changing completion, notes, dates, payments, or any other client state.
UPDATE public.client_stage_tasks ct
SET source_template_id = cs.source_template_id,
    source_template_task_id = stt.id
FROM public.client_stages cs
JOIN public.stage_template_tasks stt
  ON stt.template_id = cs.source_template_id
 AND stt.template_stage_id = cs.source_template_stage_id
WHERE ct.client_id = cs.client_id
  AND ct.stage_id = cs.stage_id
  AND ct.source_template_task_id IS NULL
  AND lower(btrim(ct.title)) = lower(btrim(stt.title));

-- A repaired assignment may now be behind the current template version. Mark
-- only templates with linked clients as requiring an explicit user sync.
UPDATE public.stage_templates st
SET sync_required = true
WHERE EXISTS (
  SELECT 1
  FROM public.client_stage_template_assignments a
  WHERE a.template_id = st.id
    AND a.synced_version < st.structure_version
);

