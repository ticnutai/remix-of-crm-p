-- Make quote -> client-file creation atomic and keep payment/task linkage explicit.

ALTER TABLE public.client_payment_stages
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.saved_quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_step_id text,
  ADD COLUMN IF NOT EXISTS percentage numeric(7,3),
  ADD COLUMN IF NOT EXISTS linked_stage_id text,
  ADD COLUMN IF NOT EXISTS linked_task_id uuid REFERENCES public.client_stage_tasks(id) ON DELETE SET NULL;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS saved_quote_id uuid REFERENCES public.saved_quotes(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_client_payment_quote_step
  ON public.client_payment_stages (quote_id, payment_step_id)
  WHERE quote_id IS NOT NULL AND payment_step_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_payment_linked_task
  ON public.client_payment_stages (linked_task_id)
  WHERE linked_task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_saved_quote_id
  ON public.contracts (saved_quote_id)
  WHERE saved_quote_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.quote_client_creation_operations (
  idempotency_key uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  saved_quote_id uuid NOT NULL REFERENCES public.saved_quotes(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_client_creation_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quote client operations"
  ON public.quote_client_creation_operations;
CREATE POLICY "Users can view own quote client operations"
  ON public.quote_client_creation_operations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_client_file_from_quote(p_request jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_idempotency_key uuid;
  v_existing_result jsonb;
  v_client jsonb := COALESCE(p_request->'client', '{}'::jsonb);
  v_quote jsonb := COALESCE(p_request->'quote', '{}'::jsonb);
  v_schedule jsonb := COALESCE(p_request->'payment_schedule', '[]'::jsonb);
  v_client_id uuid;
  v_quote_id uuid := gen_random_uuid();
  v_contract_id uuid := gen_random_uuid();
  v_stage_template_id uuid;
  v_base_price numeric(14,2);
  v_vat_rate numeric(7,3);
  v_total_with_vat numeric(14,2);
  v_stage record;
  v_task record;
  v_step record;
  v_client_stage_id text;
  v_source_stage_id text;
  v_task_title text;
  v_task_id uuid;
  v_payment_id uuid;
  v_payment_gross numeric(14,2);
  v_percentage numeric(7,3);
  v_step_vat numeric(7,3);
  v_net_amount numeric(14,2);
  v_allocated_net numeric(14,2) := 0;
  v_total_percentage numeric(10,3) := 0;
  v_payment_count integer := 0;
  v_linked_count integer := 0;
  v_stages_added integer := 0;
  v_tasks_added integer := 0;
  v_next_stage_number integer := 1;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'AUTH_SESSION_EXPIRED';
  END IF;

  BEGIN
    v_idempotency_key := NULLIF(p_request->>'idempotency_key', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_IDEMPOTENCY_KEY';
  END;
  IF v_idempotency_key IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'IDEMPOTENCY_KEY_REQUIRED';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_idempotency_key::text, 0));
  SELECT result INTO v_existing_result
  FROM public.quote_client_creation_operations
  WHERE idempotency_key = v_idempotency_key AND user_id = v_user_id;
  IF v_existing_result IS NOT NULL THEN
    RETURN v_existing_result || jsonb_build_object('idempotent_replay', true);
  END IF;

  v_base_price := ROUND(COALESCE(NULLIF(v_quote->>'base_price', '')::numeric, 0), 2);
  v_vat_rate := COALESCE(NULLIF(v_quote->>'vat_rate', '')::numeric, 18);
  v_total_with_vat := ROUND(v_base_price * (1 + v_vat_rate / 100), 2);
  IF v_base_price <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'QUOTE_PRICE_MUST_BE_POSITIVE';
  END IF;
  IF jsonb_typeof(v_schedule) <> 'array' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'PAYMENT_SCHEDULE_MUST_BE_ARRAY';
  END IF;

  BEGIN
    v_client_id := NULLIF(p_request->>'existing_client_id', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_CLIENT_ID';
  END;

  IF v_client_id IS NULL THEN
    IF NULLIF(BTRIM(v_client->>'name'), '') IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'CLIENT_NAME_REQUIRED';
    END IF;
    INSERT INTO public.clients (
      name, gush, helka, migrash, taba, address, phone, email,
      user_id, created_by, source, status, notes
    ) VALUES (
      BTRIM(v_client->>'name'), NULLIF(v_client->>'gush', ''), NULLIF(v_client->>'helka', ''),
      NULLIF(v_client->>'migrash', ''), NULLIF(v_client->>'taba', ''), NULLIF(v_client->>'address', ''),
      NULLIF(v_client->>'phone', ''), NULLIF(v_client->>'email', ''), v_user_id, v_user_id,
      'הצעת מחיר', 'active', NULLIF(v_client->>'notes', '')
    ) RETURNING id INTO v_client_id;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = v_client_id) THEN
      RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'CLIENT_NOT_FOUND';
    END IF;
    UPDATE public.clients SET
      gush = COALESCE(NULLIF(v_client->>'gush', ''), gush),
      helka = COALESCE(NULLIF(v_client->>'helka', ''), helka),
      migrash = COALESCE(NULLIF(v_client->>'migrash', ''), migrash),
      taba = COALESCE(NULLIF(v_client->>'taba', ''), taba),
      address = COALESCE(NULLIF(v_client->>'address', ''), address),
      phone = COALESCE(NULLIF(v_client->>'phone', ''), phone),
      email = COALESCE(NULLIF(v_client->>'email', ''), email),
      updated_at = now()
    WHERE id = v_client_id;
  END IF;

  INSERT INTO public.saved_quotes (
    id, user_id, client_id, template_id, title, description, status,
    base_price, vat_rate, total_with_vat, template_data, project_details,
    payment_schedule, design_settings, text_boxes, upgrades, pricing_tiers, notes
  ) VALUES (
    v_quote_id, v_user_id, v_client_id, NULLIF(v_quote->>'template_id', '')::uuid,
    COALESCE(NULLIF(v_quote->>'title', ''), 'הצעת מחיר'), v_quote->>'description', 'signed',
    v_base_price, v_vat_rate, v_total_with_vat, COALESCE(v_quote->'template_data', '{}'::jsonb),
    COALESCE(v_quote->'project_details', '{}'::jsonb), v_schedule,
    COALESCE(v_quote->'design_settings', '{}'::jsonb), COALESCE(v_quote->'text_boxes', '[]'::jsonb),
    COALESCE(v_quote->'upgrades', '[]'::jsonb), COALESCE(v_quote->'pricing_tiers', '[]'::jsonb),
    v_quote->>'notes'
  );

  BEGIN
    v_stage_template_id := NULLIF(p_request->>'stage_template_id', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_STAGE_TEMPLATE_ID';
  END;

  IF v_stage_template_id IS NOT NULL THEN
    FOR v_stage IN
      SELECT id, stage_name, stage_icon, sort_order
      FROM public.stage_template_stages
      WHERE template_id = v_stage_template_id
      ORDER BY sort_order, created_at
    LOOP
      v_client_stage_id := 'template_' || v_stage_template_id::text || '_' || v_stage.id::text;
      IF NOT EXISTS (
        SELECT 1 FROM public.client_stages
        WHERE client_id = v_client_id
          AND (stage_id = v_client_stage_id OR lower(btrim(stage_name)) = lower(btrim(v_stage.stage_name)))
      ) THEN
        INSERT INTO public.client_stages (client_id, stage_id, stage_name, stage_icon, sort_order)
        VALUES (v_client_id, v_client_stage_id, v_stage.stage_name, v_stage.stage_icon, v_stage.sort_order);
        v_stages_added := v_stages_added + 1;
      ELSE
        SELECT stage_id INTO v_client_stage_id
        FROM public.client_stages
        WHERE client_id = v_client_id
          AND (stage_id = v_client_stage_id OR lower(btrim(stage_name)) = lower(btrim(v_stage.stage_name)))
        ORDER BY (stage_id = v_client_stage_id) DESC
        LIMIT 1;
      END IF;

      FOR v_task IN
        SELECT * FROM public.stage_template_tasks
        WHERE template_id = v_stage_template_id AND template_stage_id = v_stage.id
        ORDER BY sort_order, created_at
      LOOP
        IF NOT EXISTS (
          SELECT 1 FROM public.client_stage_tasks
          WHERE client_id = v_client_id AND stage_id = v_client_stage_id
            AND lower(btrim(title)) = lower(btrim(v_task.title))
        ) THEN
          INSERT INTO public.client_stage_tasks (
            client_id, stage_id, title, task_type, completed, sort_order,
            auto_timer_days, target_working_days, background_color, text_color, is_bold
          ) VALUES (
            v_client_id, v_client_stage_id, v_task.title, v_task.task_type,
            COALESCE(v_task.completed, false), v_task.sort_order, v_task.auto_timer_days,
            v_task.target_working_days, v_task.background_color, v_task.text_color, v_task.is_bold
          );
          v_tasks_added := v_tasks_added + 1;
        END IF;
      END LOOP;
    END LOOP;
  END IF;

  SELECT COALESCE(MAX(stage_number), 0) + 1 INTO v_next_stage_number
  FROM public.client_payment_stages WHERE client_id = v_client_id;

  SELECT COUNT(*), COALESCE(SUM((item->>'percentage')::numeric), 0)
    INTO v_payment_count, v_total_percentage
  FROM jsonb_array_elements(v_schedule) item
  WHERE COALESCE(NULLIF(item->>'percentage', '')::numeric, 0) > 0;

  v_payment_count := 0;
  FOR v_step IN
    SELECT item, ordinality
    FROM jsonb_array_elements(v_schedule) WITH ORDINALITY AS x(item, ordinality)
    WHERE COALESCE(NULLIF(item->>'percentage', '')::numeric, 0) > 0
    ORDER BY ordinality
  LOOP
    v_payment_count := v_payment_count + 1;
    v_percentage := (v_step.item->>'percentage')::numeric;
    v_step_vat := CASE WHEN COALESCE((v_step.item->>'useCustomVat')::boolean, false)
      THEN COALESCE(NULLIF(v_step.item->>'customVat', '')::numeric, NULLIF(v_step.item->>'vatRate', '')::numeric, v_vat_rate)
      ELSE COALESCE(NULLIF(v_step.item->>'vatRate', '')::numeric, v_vat_rate)
    END;
    v_net_amount := ROUND(v_base_price * v_percentage / 100, 2);
    IF v_total_percentage = 100 AND v_payment_count = (
      SELECT COUNT(*) FROM jsonb_array_elements(v_schedule) s
      WHERE COALESCE(NULLIF(s->>'percentage', '')::numeric, 0) > 0
    ) THEN
      v_net_amount := v_base_price - v_allocated_net;
    END IF;
    v_allocated_net := v_allocated_net + v_net_amount;

    v_source_stage_id := COALESCE(NULLIF(v_step.item->>'templateStageId', ''), NULLIF(v_step.item->>'quoteTemplateStageId', ''));
    v_task_title := COALESCE(NULLIF(v_step.item->>'templateTaskName', ''), NULLIF(v_step.item->>'quoteTemplateItemText', ''), NULLIF(v_step.item->>'description', ''));
    v_client_stage_id := NULL;
    v_task_id := NULL;

    IF v_source_stage_id IS NOT NULL AND v_stage_template_id IS NOT NULL THEN
      SELECT stage_id INTO v_client_stage_id FROM public.client_stages
      WHERE client_id = v_client_id
        AND stage_id = 'template_' || v_stage_template_id::text || '_' || v_source_stage_id
      LIMIT 1;
    END IF;
    IF v_client_stage_id IS NULL THEN
      SELECT stage_id INTO v_client_stage_id FROM public.client_stages
      WHERE client_id = v_client_id AND lower(btrim(stage_name)) = lower(btrim(COALESCE(
        NULLIF(v_step.item->>'templateStageName', ''), NULLIF(v_step.item->>'quoteTemplateStageName', '')
      ))) LIMIT 1;
    END IF;
    IF v_task_title IS NOT NULL THEN
      SELECT id, stage_id INTO v_task_id, v_client_stage_id
      FROM public.client_stage_tasks
      WHERE client_id = v_client_id
        AND lower(btrim(title)) = lower(btrim(v_task_title))
        AND (v_client_stage_id IS NULL OR stage_id = v_client_stage_id)
      ORDER BY (stage_id = v_client_stage_id) DESC
      LIMIT 1;
    END IF;

    INSERT INTO public.client_payment_stages (
      client_id, stage_name, stage_number, description, amount, vat_rate, created_by,
      quote_id, payment_step_id, percentage, linked_stage_id, linked_task_id
    ) VALUES (
      v_client_id, COALESCE(v_task_title, 'תשלום ' || v_percentage || '%'), v_next_stage_number,
      COALESCE(NULLIF(v_step.item->>'description', ''), v_task_title), v_net_amount, v_step_vat, v_user_id,
      v_quote_id, COALESCE(NULLIF(v_step.item->>'id', ''), 'step-' || v_step.ordinality),
      v_percentage, v_client_stage_id, v_task_id
    ) RETURNING id, amount_with_vat INTO v_payment_id, v_payment_gross;

    IF v_task_id IS NOT NULL THEN
      UPDATE public.client_stage_tasks SET
        payment_amount = v_payment_gross,
        payment_percentage = v_percentage,
        payment_quote_id = v_quote_id,
        payment_step_id = COALESCE(NULLIF(v_step.item->>'id', ''), 'step-' || v_step.ordinality),
        updated_at = now()
      WHERE id = v_task_id;
      v_linked_count := v_linked_count + 1;
    END IF;
    v_next_stage_number := v_next_stage_number + 1;
  END LOOP;

  INSERT INTO public.contracts (
    id, contract_number, saved_quote_id, client_id, title, description, contract_type,
    contract_value, currency, start_date, signed_date, payment_terms,
    terms_and_conditions, notes, created_by, status
  ) VALUES (
    v_contract_id,
    'CNT-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    v_quote_id, v_client_id, COALESCE(NULLIF(v_quote->>'title', ''), 'חוזה מהצעת מחיר'),
    v_quote->>'description', 'fixed_price', v_total_with_vat, 'ILS', current_date, current_date,
    v_quote->>'payment_terms', v_quote->>'terms_and_conditions',
    'נוצר אוטומטית מהצעת מחיר ' || COALESCE(v_quote->>'title', ''), v_user_id, 'active'
  );

  v_result := jsonb_build_object(
    'client_id', v_client_id,
    'saved_quote_id', v_quote_id,
    'contract_id', v_contract_id,
    'stages_added', v_stages_added,
    'tasks_added', v_tasks_added,
    'payments_added', v_payment_count,
    'payments_linked', v_linked_count,
    'idempotent_replay', false
  );

  INSERT INTO public.quote_client_creation_operations (
    idempotency_key, user_id, client_id, saved_quote_id, contract_id, result
  ) VALUES (
    v_idempotency_key, v_user_id, v_client_id, v_quote_id, v_contract_id, v_result
  );
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.create_client_file_from_quote(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_client_file_from_quote(jsonb) TO authenticated;

COMMENT ON FUNCTION public.create_client_file_from_quote(jsonb) IS
  'Atomically creates/updates a client, clones stage-template tasks, stores a signed quote and contract, and links payment rows to their actual client tasks. Safe to retry with the same idempotency_key.';
