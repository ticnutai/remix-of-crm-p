-- Track template lineage and safely synchronize structural template changes to clients.
ALTER TABLE public.stage_templates
  ADD COLUMN IF NOT EXISTS structure_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sync_required boolean NOT NULL DEFAULT false;

ALTER TABLE public.client_stages
  ADD COLUMN IF NOT EXISTS source_template_id uuid,
  ADD COLUMN IF NOT EXISTS source_template_stage_id uuid;

ALTER TABLE public.client_stage_tasks
  ADD COLUMN IF NOT EXISTS source_template_id uuid,
  ADD COLUMN IF NOT EXISTS source_template_task_id uuid;

CREATE INDEX IF NOT EXISTS idx_client_stages_template_source
  ON public.client_stages(source_template_id, source_template_stage_id);
CREATE INDEX IF NOT EXISTS idx_client_stage_tasks_template_source
  ON public.client_stage_tasks(source_template_id, source_template_task_id);

CREATE TABLE IF NOT EXISTS public.client_stage_template_assignments (
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.stage_templates(id) ON DELETE CASCADE,
  synced_version integer NOT NULL DEFAULT 1,
  applied_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, template_id)
);

ALTER TABLE public.client_stage_template_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users manage template assignments" ON public.client_stage_template_assignments;
CREATE POLICY "Authenticated users manage template assignments"
  ON public.client_stage_template_assignments FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.mark_stage_template_structure_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_template_id := OLD.template_id;
  ELSE
    v_template_id := NEW.template_id;
  END IF;
  UPDATE public.stage_templates
  SET structure_version = structure_version + 1,
      sync_required = EXISTS (
        SELECT 1 FROM public.client_stage_template_assignments a
        WHERE a.template_id = v_template_id
      ),
      updated_at = now()
  WHERE id = v_template_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS mark_template_changed_from_stage ON public.stage_template_stages;
CREATE TRIGGER mark_template_changed_from_stage
AFTER INSERT OR UPDATE OR DELETE ON public.stage_template_stages
FOR EACH ROW EXECUTE FUNCTION public.mark_stage_template_structure_changed();

DROP TRIGGER IF EXISTS mark_template_changed_from_task ON public.stage_template_tasks;
CREATE TRIGGER mark_template_changed_from_task
AFTER INSERT OR UPDATE OR DELETE ON public.stage_template_tasks
FOR EACH ROW EXECUTE FUNCTION public.mark_stage_template_structure_changed();

-- Older atomic client-creation paths use deterministic stage IDs. Infer lineage
-- automatically so those clients also participate in future synchronization.
CREATE OR REPLACE FUNCTION public.infer_client_stage_template_source()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.source_template_stage_id IS NULL THEN
    SELECT sts.template_id, sts.id
      INTO NEW.source_template_id, NEW.source_template_stage_id
    FROM public.stage_template_stages sts
    WHERE NEW.stage_id LIKE 'template_' || sts.template_id::text || '_' || sts.id::text || '%'
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS infer_client_stage_template_source ON public.client_stages;
CREATE TRIGGER infer_client_stage_template_source
BEFORE INSERT ON public.client_stages
FOR EACH ROW EXECUTE FUNCTION public.infer_client_stage_template_source();

CREATE OR REPLACE FUNCTION public.track_client_stage_template_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.source_template_id IS NOT NULL THEN
    INSERT INTO public.client_stage_template_assignments (
      client_id, template_id, synced_version, applied_at, last_synced_at
    )
    SELECT NEW.client_id, st.id, st.structure_version, now(), now()
    FROM public.stage_templates st WHERE st.id = NEW.source_template_id
    ON CONFLICT (client_id, template_id) DO UPDATE
      SET synced_version = EXCLUDED.synced_version,
          last_synced_at = EXCLUDED.last_synced_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS track_client_stage_template_assignment ON public.client_stages;
CREATE TRIGGER track_client_stage_template_assignment
AFTER INSERT ON public.client_stages
FOR EACH ROW EXECUTE FUNCTION public.track_client_stage_template_assignment();

CREATE OR REPLACE FUNCTION public.infer_client_task_template_source()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.source_template_task_id IS NULL THEN
    SELECT cs.source_template_id, stt.id
      INTO NEW.source_template_id, NEW.source_template_task_id
    FROM public.client_stages cs
    JOIN public.stage_template_tasks stt
      ON stt.template_id = cs.source_template_id
     AND stt.template_stage_id = cs.source_template_stage_id
    WHERE cs.client_id = NEW.client_id
      AND cs.stage_id = NEW.stage_id
      AND lower(trim(stt.title)) = lower(trim(NEW.title))
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS infer_client_task_template_source ON public.client_stage_tasks;
CREATE TRIGGER infer_client_task_template_source
BEFORE INSERT ON public.client_stage_tasks
FOR EACH ROW EXECUTE FUNCTION public.infer_client_task_template_source();

-- Backfill clients created through deterministic template stage IDs.
INSERT INTO public.client_stage_template_assignments (client_id, template_id, synced_version)
SELECT DISTINCT cs.client_id, sts.template_id, st.structure_version
FROM public.client_stages cs
JOIN public.stage_template_stages sts
  ON cs.stage_id LIKE 'template_' || sts.template_id::text || '_' || sts.id::text || '%'
JOIN public.stage_templates st ON st.id = sts.template_id
ON CONFLICT (client_id, template_id) DO NOTHING;

UPDATE public.client_stages cs
SET source_template_id = sts.template_id,
    source_template_stage_id = sts.id
FROM public.stage_template_stages sts
WHERE cs.stage_id LIKE 'template_' || sts.template_id::text || '_' || sts.id::text || '%'
  AND cs.source_template_stage_id IS NULL;

UPDATE public.client_stage_tasks ct
SET source_template_id = cs.source_template_id,
    source_template_task_id = stt.id
FROM public.client_stages cs
JOIN public.stage_template_tasks stt
  ON stt.template_id = cs.source_template_id
 AND stt.template_stage_id = cs.source_template_stage_id
WHERE ct.client_id = cs.client_id
  AND ct.stage_id = cs.stage_id
  AND lower(trim(ct.title)) = lower(trim(stt.title))
  AND ct.source_template_task_id IS NULL;

CREATE OR REPLACE FUNCTION public.sync_stage_template_to_clients(p_template_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_version integer;
  v_client record;
  v_stage record;
  v_task record;
  v_client_stage_id text;
  v_added_stages integer := 0;
  v_added_tasks integer := 0;
  v_updated_stages integer := 0;
  v_updated_tasks integer := 0;
  v_removed_stages integer := 0;
  v_removed_tasks integer := 0;
  v_client_removed_stages integer := 0;
  v_client_removed_tasks integer := 0;
  v_clients integer := 0;
BEGIN
  SELECT structure_version INTO v_version
  FROM public.stage_templates WHERE id = p_template_id;
  IF v_version IS NULL THEN RAISE EXCEPTION 'Template not found'; END IF;

  FOR v_client IN
    SELECT client_id FROM public.client_stage_template_assignments
    WHERE template_id = p_template_id
  LOOP
    v_clients := v_clients + 1;

    FOR v_stage IN
      SELECT * FROM public.stage_template_stages
      WHERE template_id = p_template_id ORDER BY sort_order
    LOOP
      SELECT stage_id INTO v_client_stage_id
      FROM public.client_stages
      WHERE client_id = v_client.client_id
        AND source_template_id = p_template_id
        AND source_template_stage_id = v_stage.id
      LIMIT 1;

      IF v_client_stage_id IS NULL THEN
        v_client_stage_id := 'template_' || p_template_id::text || '_' || v_stage.id::text;
        INSERT INTO public.client_stages (
          client_id, stage_id, stage_name, stage_icon, sort_order,
          source_template_id, source_template_stage_id
        ) VALUES (
          v_client.client_id, v_client_stage_id, v_stage.stage_name,
          v_stage.stage_icon, v_stage.sort_order, p_template_id, v_stage.id
        ) ON CONFLICT DO NOTHING;
        v_added_stages := v_added_stages + 1;
      ELSE
        UPDATE public.client_stages
        SET stage_name = v_stage.stage_name,
            stage_icon = v_stage.stage_icon,
            sort_order = v_stage.sort_order
        WHERE client_id = v_client.client_id AND stage_id = v_client_stage_id;
        v_updated_stages := v_updated_stages + 1;
      END IF;

      FOR v_task IN
        SELECT * FROM public.stage_template_tasks
        WHERE template_id = p_template_id
          AND template_stage_id = v_stage.id
        ORDER BY sort_order
      LOOP
        IF EXISTS (
          SELECT 1 FROM public.client_stage_tasks
          WHERE client_id = v_client.client_id
            AND source_template_id = p_template_id
            AND source_template_task_id = v_task.id
        ) THEN
          UPDATE public.client_stage_tasks
          SET stage_id = v_client_stage_id,
              title = v_task.title,
              sort_order = v_task.sort_order,
              task_type = COALESCE(v_task.task_type, 'task'),
              auto_timer_days = CASE WHEN v_task.task_type = 'timer_tab' THEN v_task.auto_timer_days ELSE NULL END
          WHERE client_id = v_client.client_id
            AND source_template_id = p_template_id
            AND source_template_task_id = v_task.id;
          v_updated_tasks := v_updated_tasks + 1;
        ELSE
          INSERT INTO public.client_stage_tasks (
            client_id, stage_id, title, sort_order, task_type, auto_timer_days,
            source_template_id, source_template_task_id
          ) VALUES (
            v_client.client_id, v_client_stage_id, v_task.title, v_task.sort_order,
            COALESCE(v_task.task_type, 'task'),
            CASE WHEN v_task.task_type = 'timer_tab' THEN v_task.auto_timer_days ELSE NULL END,
            p_template_id, v_task.id
          );
          v_added_tasks := v_added_tasks + 1;
        END IF;
      END LOOP;
    END LOOP;

    WITH deleted AS (
      DELETE FROM public.client_stage_tasks ct
      WHERE ct.client_id = v_client.client_id
        AND ct.source_template_id = p_template_id
        AND NOT EXISTS (
          SELECT 1 FROM public.stage_template_tasks stt
          WHERE stt.id = ct.source_template_task_id AND stt.template_id = p_template_id
        )
      RETURNING 1
    ) SELECT count(*) INTO v_client_removed_tasks FROM deleted;
    v_removed_tasks := v_removed_tasks + v_client_removed_tasks;

    WITH deleted AS (
      DELETE FROM public.client_stages cs
      WHERE cs.client_id = v_client.client_id
        AND cs.source_template_id = p_template_id
        AND NOT EXISTS (
          SELECT 1 FROM public.stage_template_stages sts
          WHERE sts.id = cs.source_template_stage_id AND sts.template_id = p_template_id
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.client_stage_tasks ct
          WHERE ct.client_id = cs.client_id AND ct.stage_id = cs.stage_id
        )
      RETURNING 1
    ) SELECT count(*) INTO v_client_removed_stages FROM deleted;
    v_removed_stages := v_removed_stages + v_client_removed_stages;

    UPDATE public.client_stage_template_assignments
    SET synced_version = v_version, last_synced_at = now()
    WHERE client_id = v_client.client_id AND template_id = p_template_id;
  END LOOP;

  UPDATE public.stage_templates SET sync_required = false WHERE id = p_template_id;

  RETURN jsonb_build_object(
    'clients_updated', v_clients,
    'added_stages', v_added_stages,
    'updated_stages', v_updated_stages,
    'removed_stages', v_removed_stages,
    'added_tasks', v_added_tasks,
    'updated_tasks', v_updated_tasks,
    'removed_tasks', v_removed_tasks
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_stage_template_to_clients(uuid) TO authenticated;
