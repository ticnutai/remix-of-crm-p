
-- Add workflow columns to client_folder_tasks
ALTER TABLE public.client_folder_tasks 
ADD COLUMN IF NOT EXISTS task_owner text NOT NULL DEFAULT 'office',
ADD COLUMN IF NOT EXISTS office_timer_started_at timestamptz,
ADD COLUMN IF NOT EXISTS office_timer_total_seconds integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS client_timer_started_at timestamptz,
ADD COLUMN IF NOT EXISTS client_timer_total_seconds integer NOT NULL DEFAULT 0;

-- Add file support for workflow tasks
CREATE TABLE IF NOT EXISTS public.client_task_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.client_folder_tasks(id) ON DELETE CASCADE NOT NULL,
  stage_id uuid REFERENCES public.client_folder_stages(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  file_type text,
  uploaded_by text NOT NULL DEFAULT 'office',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_task_files ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can manage task files
CREATE POLICY "Authenticated users can manage task files" ON public.client_task_files
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
