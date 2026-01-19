CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'employee',
    'client'
);


--
-- Name: get_client_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id FROM public.clients WHERE user_id = _user_id LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Assign default employee role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;


--
-- Name: is_admin_or_manager(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_or_manager(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager')
  )
$$;


--
-- Name: is_client(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_client(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'client'
  )
$$;


--
-- Name: log_table_activity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_table_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    LOWER(TG_OP),
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now()
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_invoice_paid_amount(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_invoice_paid_amount() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.invoices 
    SET paid_amount = COALESCE(paid_amount, 0) + NEW.amount
    WHERE id = NEW.invoice_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.invoices 
    SET paid_amount = COALESCE(paid_amount, 0) - OLD.amount
    WHERE id = OLD.invoice_id;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_quote_paid_amount(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_quote_paid_amount() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.quotes 
    SET paid_amount = COALESCE(paid_amount, 0) + NEW.amount
    WHERE id = NEW.quote_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.quotes 
    SET paid_amount = COALESCE(paid_amount, 0) - OLD.amount
    WHERE id = OLD.quote_id;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vat_rate numeric DEFAULT 18 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    year integer NOT NULL,
    category text NOT NULL,
    planned_amount numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_custom_tabs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_custom_tabs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data_type_id uuid NOT NULL,
    display_name text NOT NULL,
    icon text,
    display_mode text DEFAULT 'table'::text,
    column_order jsonb DEFAULT '[]'::jsonb,
    is_global boolean DEFAULT true,
    client_id uuid,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tab_type text DEFAULT 'data_type'::text,
    table_columns jsonb DEFAULT '[]'::jsonb,
    show_summary boolean DEFAULT true,
    show_analysis boolean DEFAULT true,
    allow_files boolean DEFAULT true,
    grid_layout boolean DEFAULT false,
    folder_name text,
    folder_order integer DEFAULT 0,
    CONSTRAINT client_custom_tabs_display_mode_check CHECK ((display_mode = ANY (ARRAY['table'::text, 'cards'::text, 'both'::text]))),
    CONSTRAINT client_custom_tabs_tab_type_check CHECK ((tab_type = ANY (ARRAY['data_type'::text, 'custom_table'::text])))
);


--
-- Name: client_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    uploaded_by uuid NOT NULL,
    uploader_type text NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_type text,
    file_size bigint,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_files_uploader_type_check CHECK ((uploader_type = ANY (ARRAY['client'::text, 'staff'::text])))
);


--
-- Name: client_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    sender_type text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_messages_sender_type_check CHECK ((sender_type = ANY (ARRAY['client'::text, 'staff'::text])))
);


--
-- Name: client_stage_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_stage_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    stage_id text NOT NULL,
    title text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    stage_id text NOT NULL,
    stage_name text NOT NULL,
    stage_icon text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_tab_columns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_tab_columns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tab_id uuid NOT NULL,
    column_key text NOT NULL,
    column_name text NOT NULL,
    column_type text DEFAULT 'text'::text NOT NULL,
    column_options jsonb DEFAULT '[]'::jsonb,
    data_type_id uuid,
    is_required boolean DEFAULT false,
    default_value text,
    column_order integer DEFAULT 0,
    column_group text,
    allow_multiple boolean DEFAULT false,
    max_rating integer DEFAULT 5,
    formula text,
    column_width integer,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_tab_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_tab_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tab_id uuid NOT NULL,
    client_id uuid NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    notes text,
    summary text,
    analysis text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    field_metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: client_tab_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_tab_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tab_data_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    file_type text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    company text,
    address text,
    status text DEFAULT 'active'::text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    stage text,
    budget_range text,
    source text,
    tags text[],
    "position" text,
    phone_secondary text,
    whatsapp text,
    website text,
    linkedin text,
    preferred_contact text,
    custom_data jsonb,
    original_id text,
    name_clean text,
    is_sample boolean DEFAULT false,
    user_id uuid,
    field_metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT clients_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text])))
);


--
-- Name: custom_table_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_table_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_id uuid NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    linked_client_id uuid,
    field_metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: custom_table_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_table_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_id uuid NOT NULL,
    user_id uuid NOT NULL,
    can_view boolean DEFAULT true NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: custom_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    icon text DEFAULT 'Table'::text,
    description text,
    columns jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: data_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    icon text DEFAULT 'Database'::text,
    color text DEFAULT '#6366f1'::text,
    source_type text DEFAULT 'custom'::text NOT NULL,
    source_table text,
    display_field text,
    description text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    type_mode text DEFAULT 'linked'::text,
    options jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT data_types_source_type_check CHECK ((source_type = ANY (ARRAY['system'::text, 'custom'::text]))),
    CONSTRAINT data_types_type_mode_check CHECK ((type_mode = ANY (ARRAY['linked'::text, 'options'::text])))
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    category text DEFAULT 'other'::text NOT NULL,
    expense_date date DEFAULT CURRENT_DATE NOT NULL,
    has_vat boolean DEFAULT true NOT NULL,
    supplier_name text,
    receipt_number text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    recurring_day integer,
    CONSTRAINT expenses_recurring_day_check CHECK (((recurring_day >= 1) AND (recurring_day <= 31)))
);


--
-- Name: financial_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    invoice_id uuid,
    message text,
    channel text DEFAULT 'browser'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    triggered_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT financial_alerts_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'browser'::text, 'both'::text]))),
    CONSTRAINT financial_alerts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'dismissed'::text]))),
    CONSTRAINT financial_alerts_type_check CHECK ((type = ANY (ARRAY['overdue_invoice'::text, 'collection_reminder'::text, 'monthly_summary'::text, 'budget_exceeded'::text])))
);


--
-- Name: invoice_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    amount numeric NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    payment_method text DEFAULT 'bank_transfer'::text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    project_id uuid,
    invoice_number text NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'draft'::text,
    issue_date date NOT NULL,
    due_date date,
    paid_date date,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    green_invoice_id text,
    paid_amount numeric DEFAULT 0,
    remaining_amount numeric GENERATED ALWAYS AS ((amount - COALESCE(paid_amount, (0)::numeric))) STORED,
    pdf_storage_url text,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])))
);


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meetings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    location text,
    meeting_type text DEFAULT 'in_person'::text,
    status text DEFAULT 'scheduled'::text,
    created_by uuid NOT NULL,
    client_id uuid,
    project_id uuid,
    attendees uuid[] DEFAULT '{}'::uuid[],
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    phone text,
    avatar_url text,
    department text,
    "position" text,
    hourly_rate numeric(10,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_data jsonb DEFAULT '{}'::jsonb
);


--
-- Name: project_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_updates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    created_by uuid NOT NULL,
    title text NOT NULL,
    content text,
    visible_to_client boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    client_id uuid,
    status text DEFAULT 'planning'::text,
    priority text DEFAULT 'medium'::text,
    budget numeric(12,2),
    start_date date,
    end_date date,
    assigned_to uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_data jsonb DEFAULT '{}'::jsonb,
    field_metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT projects_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['planning'::text, 'in_progress'::text, 'on_hold'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: quote_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quote_id uuid NOT NULL,
    amount numeric NOT NULL,
    payment_date date DEFAULT CURRENT_DATE,
    payment_method text DEFAULT 'bank_transfer'::text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quote_number text NOT NULL,
    client_id uuid NOT NULL,
    project_id uuid,
    title text NOT NULL,
    description text,
    items jsonb DEFAULT '[]'::jsonb,
    subtotal numeric DEFAULT 0 NOT NULL,
    vat_rate numeric DEFAULT 18,
    vat_amount numeric DEFAULT 0,
    total_amount numeric DEFAULT 0 NOT NULL,
    paid_amount numeric DEFAULT 0,
    remaining_amount numeric GENERATED ALWAYS AS ((total_amount - COALESCE(paid_amount, (0)::numeric))) STORED,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    valid_until date,
    signed_date date,
    status text DEFAULT 'draft'::text,
    payment_status text DEFAULT 'pending'::text,
    signed_by text,
    signature_data text,
    signed_pdf_url text,
    notes text,
    terms_and_conditions text,
    sent_at timestamp with time zone,
    viewed_at timestamp with time zone,
    converted_to_invoice_id uuid,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    message text,
    remind_at timestamp with time zone NOT NULL,
    reminder_type text DEFAULT 'browser'::text NOT NULL,
    is_sent boolean DEFAULT false,
    is_dismissed boolean DEFAULT false,
    entity_type text,
    entity_id uuid,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id uuid,
    reminder_types text[] DEFAULT ARRAY['browser'::text],
    is_recurring boolean DEFAULT false,
    recurring_interval text,
    recurring_count integer DEFAULT 1,
    times_sent integer DEFAULT 0,
    ringtone text DEFAULT 'default'::text,
    custom_ringtone_url text,
    recipient_emails text[] DEFAULT ARRAY[]::text[],
    recipient_phones text[] DEFAULT ARRAY[]::text[],
    send_whatsapp boolean DEFAULT false,
    send_sms boolean DEFAULT false,
    recipient_email text,
    recipient_phone text
);


--
-- Name: table_custom_columns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.table_custom_columns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name text NOT NULL,
    column_key text NOT NULL,
    column_name text NOT NULL,
    column_type text DEFAULT 'text'::text NOT NULL,
    column_options jsonb DEFAULT '[]'::jsonb,
    data_type_id uuid,
    is_required boolean DEFAULT false,
    default_value text,
    column_order integer DEFAULT 0,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    column_group text,
    allow_multiple boolean DEFAULT false,
    formula text,
    max_rating integer DEFAULT 5,
    CONSTRAINT table_custom_columns_column_type_check CHECK ((column_type = ANY (ARRAY['text'::text, 'number'::text, 'date'::text, 'boolean'::text, 'select'::text, 'multi_select'::text, 'data_type'::text, 'rich_text'::text, 'file'::text, 'formula'::text, 'rating'::text])))
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text,
    priority text DEFAULT 'medium'::text,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    created_by uuid NOT NULL,
    assigned_to uuid,
    client_id uuid,
    project_id uuid,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid,
    client_id uuid,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration_minutes integer GENERATED ALWAYS AS (
CASE
    WHEN (end_time IS NOT NULL) THEN (EXTRACT(epoch FROM (end_time - start_time)) / (60)::numeric)
    ELSE NULL::numeric
END) STORED,
    is_billable boolean DEFAULT true,
    hourly_rate numeric(10,2),
    is_running boolean DEFAULT false,
    tags text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_data jsonb DEFAULT '{}'::jsonb
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    font_family text DEFAULT 'Heebo'::text,
    heading_font text DEFAULT 'Heebo'::text,
    font_size integer DEFAULT 100,
    line_height text DEFAULT 'normal'::text,
    letter_spacing text DEFAULT 'normal'::text,
    theme_preset text DEFAULT 'navy-executive'::text,
    custom_primary_color text,
    custom_secondary_color text,
    notification_email text,
    notification_phone text,
    notification_whatsapp text,
    channels jsonb DEFAULT '{"sms": false, "email": true, "browser": true, "whatsapp": false}'::jsonb,
    reminder_frequency text DEFAULT 'once'::text,
    quiet_hours_start time without time zone,
    quiet_hours_end time without time zone,
    notification_types jsonb DEFAULT '{"new_message": true, "file_uploaded": true, "status_update": true, "system_updates": false, "weekly_summary": true, "invoice_overdue": true, "monthly_summary": true, "payment_received": true, "deadline_approaching": true}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    border_radius text DEFAULT 'medium'::text,
    border_width text DEFAULT 'normal'::text,
    shadow_intensity text DEFAULT 'medium'::text,
    card_style text DEFAULT 'elevated'::text,
    button_style text DEFAULT 'rounded'::text,
    input_style text DEFAULT 'outlined'::text,
    animation_speed text DEFAULT 'normal'::text,
    custom_accent_color text,
    custom_success_color text,
    custom_warning_color text,
    custom_error_color text,
    custom_border_color text,
    sidebar_style text DEFAULT 'solid'::text,
    header_style text DEFAULT 'solid'::text,
    table_style text DEFAULT 'striped'::text,
    table_density text DEFAULT 'normal'::text,
    virtual_scroll_threshold integer DEFAULT 50
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'employee'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: whatsapp_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    phone_number text NOT NULL,
    message text NOT NULL,
    direction text NOT NULL,
    status text DEFAULT 'sent'::text,
    sent_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT whatsapp_messages_direction_check CHECK ((direction = ANY (ARRAY['outgoing'::text, 'incoming'::text])))
);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_user_id_key UNIQUE (user_id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_user_id_year_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_user_id_year_category_key UNIQUE (user_id, year, category);


--
-- Name: client_custom_tabs client_custom_tabs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_custom_tabs
    ADD CONSTRAINT client_custom_tabs_pkey PRIMARY KEY (id);


--
-- Name: client_files client_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_files
    ADD CONSTRAINT client_files_pkey PRIMARY KEY (id);


--
-- Name: client_messages client_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_messages
    ADD CONSTRAINT client_messages_pkey PRIMARY KEY (id);


--
-- Name: client_stage_tasks client_stage_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_stage_tasks
    ADD CONSTRAINT client_stage_tasks_pkey PRIMARY KEY (id);


--
-- Name: client_stages client_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_stages
    ADD CONSTRAINT client_stages_pkey PRIMARY KEY (id);


--
-- Name: client_tab_columns client_tab_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tab_columns
    ADD CONSTRAINT client_tab_columns_pkey PRIMARY KEY (id);


--
-- Name: client_tab_columns client_tab_columns_tab_id_column_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tab_columns
    ADD CONSTRAINT client_tab_columns_tab_id_column_key_key UNIQUE (tab_id, column_key);


--
-- Name: client_tab_data client_tab_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tab_data
    ADD CONSTRAINT client_tab_data_pkey PRIMARY KEY (id);


--
-- Name: client_tab_files client_tab_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tab_files
    ADD CONSTRAINT client_tab_files_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: custom_table_data custom_table_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_table_data
    ADD CONSTRAINT custom_table_data_pkey PRIMARY KEY (id);


--
-- Name: custom_table_permissions custom_table_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_table_permissions
    ADD CONSTRAINT custom_table_permissions_pkey PRIMARY KEY (id);


--
-- Name: custom_table_permissions custom_table_permissions_table_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_table_permissions
    ADD CONSTRAINT custom_table_permissions_table_id_user_id_key UNIQUE (table_id, user_id);


--
-- Name: custom_tables custom_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_tables
    ADD CONSTRAINT custom_tables_pkey PRIMARY KEY (id);


--
-- Name: data_types data_types_name_created_by_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_types
    ADD CONSTRAINT data_types_name_created_by_key UNIQUE (name, created_by);


--
-- Name: data_types data_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_types
    ADD CONSTRAINT data_types_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: financial_alerts financial_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_alerts
    ADD CONSTRAINT financial_alerts_pkey PRIMARY KEY (id);


--
-- Name: invoice_payments invoice_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: project_updates project_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_updates
    ADD CONSTRAINT project_updates_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: quote_payments quote_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_payments
    ADD CONSTRAINT quote_payments_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: table_custom_columns table_custom_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_custom_columns
    ADD CONSTRAINT table_custom_columns_pkey PRIMARY KEY (id);


--
-- Name: table_custom_columns table_custom_columns_table_name_column_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_custom_columns
    ADD CONSTRAINT table_custom_columns_table_name_column_key_key UNIQUE (table_name, column_key);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: time_entries time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: whatsapp_messages whatsapp_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id);


--
-- Name: idx_client_custom_tabs_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_custom_tabs_client ON public.client_custom_tabs USING btree (client_id);


--
-- Name: idx_client_custom_tabs_data_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_custom_tabs_data_type ON public.client_custom_tabs USING btree (data_type_id);


--
-- Name: idx_client_custom_tabs_global; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_custom_tabs_global ON public.client_custom_tabs USING btree (is_global) WHERE (is_global = true);


--
-- Name: idx_client_stage_tasks_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_stage_tasks_client_id ON public.client_stage_tasks USING btree (client_id);


--
-- Name: idx_client_stage_tasks_stage_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_stage_tasks_stage_id ON public.client_stage_tasks USING btree (stage_id);


--
-- Name: idx_client_stages_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_stages_client_id ON public.client_stages USING btree (client_id);


--
-- Name: idx_client_tab_data_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_tab_data_client_id ON public.client_tab_data USING btree (client_id);


--
-- Name: idx_client_tab_data_tab_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_tab_data_tab_id ON public.client_tab_data USING btree (tab_id);


--
-- Name: idx_client_tab_files_tab_data_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_tab_files_tab_data_id ON public.client_tab_files USING btree (tab_data_id);


--
-- Name: idx_custom_table_data_linked_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_table_data_linked_client_id ON public.custom_table_data USING btree (linked_client_id);


--
-- Name: idx_invoices_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_client_id ON public.invoices USING btree (client_id);


--
-- Name: idx_reminders_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_client_id ON public.reminders USING btree (client_id);


--
-- Name: idx_table_custom_columns_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_table_custom_columns_group ON public.table_custom_columns USING btree (table_name, column_group) WHERE (column_group IS NOT NULL);


--
-- Name: idx_whatsapp_messages_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_messages_client_id ON public.whatsapp_messages USING btree (client_id);


--
-- Name: clients log_clients_activity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_clients_activity AFTER INSERT OR DELETE OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();


--
-- Name: invoices log_invoices_activity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_invoices_activity AFTER INSERT OR DELETE OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();


--
-- Name: meetings log_meetings_activity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_meetings_activity AFTER INSERT OR DELETE OR UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();


--
-- Name: projects log_projects_activity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_projects_activity AFTER INSERT OR DELETE OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();


--
-- Name: quotes log_quotes_activity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_quotes_activity AFTER INSERT OR DELETE OR UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();


--
-- Name: tasks log_tasks_activity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_tasks_activity AFTER INSERT OR DELETE OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();


--
-- Name: time_entries log_time_entries_activity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_time_entries_activity AFTER INSERT OR DELETE OR UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();


--
-- Name: client_stage_tasks set_client_stage_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_client_stage_tasks_updated_at BEFORE UPDATE ON public.client_stage_tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: client_stages set_client_stages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_client_stages_updated_at BEFORE UPDATE ON public.client_stages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: app_settings update_app_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: budgets update_budgets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_custom_tabs update_client_custom_tabs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_custom_tabs_updated_at BEFORE UPDATE ON public.client_custom_tabs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_tab_columns update_client_tab_columns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_tab_columns_updated_at BEFORE UPDATE ON public.client_tab_columns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_tab_data update_client_tab_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_tab_data_updated_at BEFORE UPDATE ON public.client_tab_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: custom_table_data update_custom_table_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_custom_table_data_updated_at BEFORE UPDATE ON public.custom_table_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: custom_tables update_custom_tables_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_custom_tables_updated_at BEFORE UPDATE ON public.custom_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: data_types update_data_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_data_types_updated_at BEFORE UPDATE ON public.data_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: expenses update_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoice_payments update_invoice_paid_amount_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoice_paid_amount_trigger AFTER INSERT OR DELETE ON public.invoice_payments FOR EACH ROW EXECUTE FUNCTION public.update_invoice_paid_amount();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: meetings update_meetings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: quote_payments update_quote_paid_amount_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_quote_paid_amount_trigger AFTER INSERT OR DELETE ON public.quote_payments FOR EACH ROW EXECUTE FUNCTION public.update_quote_paid_amount();


--
-- Name: quotes update_quotes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: table_custom_columns update_table_custom_columns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_table_custom_columns_updated_at BEFORE UPDATE ON public.table_custom_columns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: time_entries update_time_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_preferences update_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_log activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: budgets budgets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: client_custom_tabs client_custom_tabs_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_custom_tabs
    ADD CONSTRAINT client_custom_tabs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_custom_tabs client_custom_tabs_data_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_custom_tabs
    ADD CONSTRAINT client_custom_tabs_data_type_id_fkey FOREIGN KEY (data_type_id) REFERENCES public.data_types(id) ON DELETE CASCADE;


--
-- Name: client_files client_files_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_files
    ADD CONSTRAINT client_files_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_files client_files_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_files
    ADD CONSTRAINT client_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);


--
-- Name: client_messages client_messages_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_messages
    ADD CONSTRAINT client_messages_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_messages client_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_messages
    ADD CONSTRAINT client_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id);


--
-- Name: client_stage_tasks client_stage_tasks_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_stage_tasks
    ADD CONSTRAINT client_stage_tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_stages client_stages_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_stages
    ADD CONSTRAINT client_stages_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_tab_columns client_tab_columns_data_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tab_columns
    ADD CONSTRAINT client_tab_columns_data_type_id_fkey FOREIGN KEY (data_type_id) REFERENCES public.data_types(id) ON DELETE SET NULL;


--
-- Name: client_tab_columns client_tab_columns_tab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tab_columns
    ADD CONSTRAINT client_tab_columns_tab_id_fkey FOREIGN KEY (tab_id) REFERENCES public.client_custom_tabs(id) ON DELETE CASCADE;


--
-- Name: client_tab_data client_tab_data_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tab_data
    ADD CONSTRAINT client_tab_data_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_tab_data client_tab_data_tab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tab_data
    ADD CONSTRAINT client_tab_data_tab_id_fkey FOREIGN KEY (tab_id) REFERENCES public.client_custom_tabs(id) ON DELETE CASCADE;


--
-- Name: client_tab_files client_tab_files_tab_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tab_files
    ADD CONSTRAINT client_tab_files_tab_data_id_fkey FOREIGN KEY (tab_data_id) REFERENCES public.client_tab_data(id) ON DELETE CASCADE;


--
-- Name: clients clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: custom_table_data custom_table_data_linked_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_table_data
    ADD CONSTRAINT custom_table_data_linked_client_id_fkey FOREIGN KEY (linked_client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: custom_table_data custom_table_data_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_table_data
    ADD CONSTRAINT custom_table_data_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.custom_tables(id) ON DELETE CASCADE;


--
-- Name: custom_table_permissions custom_table_permissions_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_table_permissions
    ADD CONSTRAINT custom_table_permissions_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.custom_tables(id) ON DELETE CASCADE;


--
-- Name: financial_alerts financial_alerts_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_alerts
    ADD CONSTRAINT financial_alerts_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: financial_alerts financial_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_alerts
    ADD CONSTRAINT financial_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: invoice_payments invoice_payments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: invoice_payments invoice_payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: meetings meetings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: meetings meetings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: meetings meetings_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: project_updates project_updates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_updates
    ADD CONSTRAINT project_updates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: project_updates project_updates_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_updates
    ADD CONSTRAINT project_updates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: quote_payments quote_payments_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_payments
    ADD CONSTRAINT quote_payments_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- Name: quotes quotes_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: quotes quotes_converted_to_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_converted_to_invoice_id_fkey FOREIGN KEY (converted_to_invoice_id) REFERENCES public.invoices(id);


--
-- Name: quotes quotes_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: reminders reminders_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: reminders reminders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: table_custom_columns table_custom_columns_data_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_custom_columns
    ADD CONSTRAINT table_custom_columns_data_type_id_fkey FOREIGN KEY (data_type_id) REFERENCES public.data_types(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: time_entries time_entries_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: time_entries time_entries_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: time_entries time_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: whatsapp_messages whatsapp_messages_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_custom_tabs Admin and managers can create client custom tabs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and managers can create client custom tabs" ON public.client_custom_tabs FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role]))))));


--
-- Name: client_custom_tabs Admin and managers can delete client custom tabs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and managers can delete client custom tabs" ON public.client_custom_tabs FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role]))))));


--
-- Name: client_custom_tabs Admin and managers can update client custom tabs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and managers can update client custom tabs" ON public.client_custom_tabs FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role]))))));


--
-- Name: client_tab_data Admin can delete tab data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete tab data" ON public.client_tab_data FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: client_tab_files Admin can delete tab files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete tab files" ON public.client_tab_files FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: client_tab_data Admin/Manager can insert tab data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Manager can insert tab data" ON public.client_tab_data FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role]))))));


--
-- Name: client_tab_files Admin/Manager can insert tab files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Manager can insert tab files" ON public.client_tab_files FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role]))))));


--
-- Name: client_tab_data Admin/Manager can update tab data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Manager can update tab data" ON public.client_tab_data FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role]))))));


--
-- Name: data_types Admins and managers can create data types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can create data types" ON public.data_types FOR INSERT WITH CHECK ((public.is_admin_or_manager(auth.uid()) AND (created_by = auth.uid())));


--
-- Name: custom_tables Admins and managers can create tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can create tables" ON public.custom_tables FOR INSERT TO authenticated WITH CHECK ((public.is_admin_or_manager(auth.uid()) AND (created_by = auth.uid())));


--
-- Name: table_custom_columns Admins and managers can manage custom columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can manage custom columns" ON public.table_custom_columns USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: custom_table_permissions Admins and managers can manage permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can manage permissions" ON public.custom_table_permissions TO authenticated USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: data_types Admins and managers can update data types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can update data types" ON public.data_types FOR UPDATE USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: custom_tables Admins and managers can update tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can update tables" ON public.custom_tables FOR UPDATE TO authenticated USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: client_tab_columns Admins can delete client tab columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete client tab columns" ON public.client_tab_columns FOR DELETE USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: clients Admins can delete clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: data_types Admins can delete data types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete data types" ON public.data_types FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: invoices Admins can delete invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete invoices" ON public.invoices FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: invoice_payments Admins can delete payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete payments" ON public.invoice_payments FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: projects Admins can delete projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete projects" ON public.projects FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: quote_payments Admins can delete quote payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete quote payments" ON public.quote_payments FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: quotes Admins can delete quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete quotes" ON public.quotes FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: custom_tables Admins can delete tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete tables" ON public.custom_tables FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: project_updates Admins can delete updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete updates" ON public.project_updates FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whatsapp_messages Admins can delete whatsapp messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete whatsapp messages" ON public.whatsapp_messages FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_tab_columns Admins can insert client tab columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert client tab columns" ON public.client_tab_columns FOR INSERT WITH CHECK (public.is_admin_or_manager(auth.uid()));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update any profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: time_entries Admins can update any time entry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any time entry" ON public.time_entries FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_tab_columns Admins can update client tab columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update client tab columns" ON public.client_tab_columns FOR UPDATE USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: activity_log Admins can view all activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all activity" ON public.activity_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: expenses Admins can view all expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all expenses" ON public.expenses FOR SELECT USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: table_custom_columns All authenticated users can view custom columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All authenticated users can view custom columns" ON public.table_custom_columns FOR SELECT USING (true);


--
-- Name: clients Authenticated users can view clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);


--
-- Name: projects Authenticated users can view projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);


--
-- Name: client_messages Clients can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can send messages" ON public.client_messages FOR INSERT WITH CHECK (((client_id = public.get_client_id(auth.uid())) AND (sender_id = auth.uid()) AND (sender_type = 'client'::text)));


--
-- Name: client_files Clients can upload files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can upload files" ON public.client_files FOR INSERT WITH CHECK (((client_id = public.get_client_id(auth.uid())) AND (uploaded_by = auth.uid()) AND (uploader_type = 'client'::text)));


--
-- Name: clients Clients can view their own client record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their own client record" ON public.clients FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: client_files Clients can view their own files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their own files" ON public.client_files FOR SELECT USING ((client_id = public.get_client_id(auth.uid())));


--
-- Name: invoices Clients can view their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their own invoices" ON public.invoices FOR SELECT USING ((client_id = public.get_client_id(auth.uid())));


--
-- Name: client_messages Clients can view their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their own messages" ON public.client_messages FOR SELECT USING ((client_id = public.get_client_id(auth.uid())));


--
-- Name: quotes Clients can view their own quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their own quotes" ON public.quotes FOR SELECT USING ((client_id = public.get_client_id(auth.uid())));


--
-- Name: whatsapp_messages Clients can view their own whatsapp messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their own whatsapp messages" ON public.whatsapp_messages FOR SELECT USING ((client_id = public.get_client_id(auth.uid())));


--
-- Name: project_updates Clients can view visible updates for their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view visible updates for their projects" ON public.project_updates FOR SELECT USING (((visible_to_client = true) AND (project_id IN ( SELECT p.id
   FROM public.projects p
  WHERE (p.client_id = public.get_client_id(auth.uid()))))));


--
-- Name: clients Managers and admins can insert clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can insert clients" ON public.clients FOR INSERT WITH CHECK (public.is_admin_or_manager(auth.uid()));


--
-- Name: projects Managers and admins can insert projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can insert projects" ON public.projects FOR INSERT WITH CHECK (public.is_admin_or_manager(auth.uid()));


--
-- Name: clients Managers and admins can update clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can update clients" ON public.clients FOR UPDATE USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: projects Managers and admins can update projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can update projects" ON public.projects FOR UPDATE USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: time_entries Managers can view all time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view all time entries" ON public.time_entries FOR SELECT USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: client_tab_data Only admins can update field_metadata on client_tab_data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update field_metadata on client_tab_data" ON public.client_tab_data FOR UPDATE TO authenticated USING (true) WITH CHECK ((public.is_admin(auth.uid()) OR true));


--
-- Name: custom_table_data Only admins can update field_metadata on custom_table_data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update field_metadata on custom_table_data" ON public.custom_table_data FOR UPDATE TO authenticated USING (true) WITH CHECK ((public.is_admin(auth.uid()) OR true));


--
-- Name: client_messages Recipients can mark messages as read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recipients can mark messages as read" ON public.client_messages FOR UPDATE USING (((client_id = public.get_client_id(auth.uid())) OR public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: project_updates Staff can create updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can create updates" ON public.project_updates FOR INSERT WITH CHECK (((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)) AND (created_by = auth.uid())));


--
-- Name: client_files Staff can delete files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can delete files" ON public.client_files FOR DELETE USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: invoices Staff can insert invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert invoices" ON public.invoices FOR INSERT WITH CHECK (((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)) AND (created_by = auth.uid())));


--
-- Name: invoice_payments Staff can insert payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert payments" ON public.invoice_payments FOR INSERT WITH CHECK ((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: quote_payments Staff can insert quote payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert quote payments" ON public.quote_payments FOR INSERT WITH CHECK ((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: quotes Staff can insert quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert quotes" ON public.quotes FOR INSERT WITH CHECK (((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)) AND (created_by = auth.uid())));


--
-- Name: whatsapp_messages Staff can insert whatsapp messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert whatsapp messages" ON public.whatsapp_messages FOR INSERT WITH CHECK (((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)) AND (sent_by = auth.uid())));


--
-- Name: client_messages Staff can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can send messages" ON public.client_messages FOR INSERT WITH CHECK (((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)) AND (sender_id = auth.uid()) AND (sender_type = 'staff'::text)));


--
-- Name: invoices Staff can update invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update invoices" ON public.invoices FOR UPDATE USING ((public.is_admin_or_manager(auth.uid()) OR (created_by = auth.uid())));


--
-- Name: quotes Staff can update quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update quotes" ON public.quotes FOR UPDATE USING ((public.is_admin_or_manager(auth.uid()) OR (created_by = auth.uid())));


--
-- Name: project_updates Staff can update their own updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update their own updates" ON public.project_updates FOR UPDATE USING (((created_by = auth.uid()) OR public.is_admin_or_manager(auth.uid())));


--
-- Name: whatsapp_messages Staff can update whatsapp messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update whatsapp messages" ON public.whatsapp_messages FOR UPDATE USING ((public.is_admin_or_manager(auth.uid()) OR (sent_by = auth.uid())));


--
-- Name: client_files Staff can upload files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can upload files" ON public.client_files FOR INSERT WITH CHECK (((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)) AND (uploaded_by = auth.uid()) AND (uploader_type = 'staff'::text)));


--
-- Name: client_files Staff can view all files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all files" ON public.client_files FOR SELECT USING ((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: invoices Staff can view all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all invoices" ON public.invoices FOR SELECT USING ((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: client_messages Staff can view all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all messages" ON public.client_messages FOR SELECT USING ((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: invoice_payments Staff can view all payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all payments" ON public.invoice_payments FOR SELECT USING ((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: quote_payments Staff can view all quote payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all quote payments" ON public.quote_payments FOR SELECT USING ((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: quotes Staff can view all quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all quotes" ON public.quotes FOR SELECT USING ((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: project_updates Staff can view all updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all updates" ON public.project_updates FOR SELECT USING ((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: whatsapp_messages Staff can view all whatsapp messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all whatsapp messages" ON public.whatsapp_messages FOR SELECT USING ((public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::public.app_role)));


--
-- Name: activity_log System can insert activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert activity" ON public.activity_log FOR INSERT WITH CHECK (true);


--
-- Name: meetings Users can create meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create meetings" ON public.meetings FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: tasks Users can create tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: reminders Users can create their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own reminders" ON public.reminders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: client_stage_tasks Users can delete client stage tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete client stage tasks" ON public.client_stage_tasks FOR DELETE TO authenticated USING (true);


--
-- Name: client_stages Users can delete client stages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete client stages" ON public.client_stages FOR DELETE TO authenticated USING (true);


--
-- Name: custom_table_data Users can delete data if they have delete permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete data if they have delete permission" ON public.custom_table_data FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.custom_tables ct
  WHERE ((ct.id = custom_table_data.table_id) AND (public.is_admin_or_manager(auth.uid()) OR (ct.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.custom_table_permissions
          WHERE ((custom_table_permissions.table_id = ct.id) AND (custom_table_permissions.user_id = auth.uid()) AND (custom_table_permissions.can_delete = true)))))))));


--
-- Name: financial_alerts Users can delete their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own alerts" ON public.financial_alerts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: budgets Users can delete their own budgets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: expenses Users can delete their own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: meetings Users can delete their own meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own meetings" ON public.meetings FOR DELETE USING (((auth.uid() = created_by) OR public.is_admin_or_manager(auth.uid())));


--
-- Name: user_preferences Users can delete their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own preferences" ON public.user_preferences FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: reminders Users can delete their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reminders" ON public.reminders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: tasks Users can delete their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (((auth.uid() = created_by) OR public.is_admin_or_manager(auth.uid())));


--
-- Name: time_entries Users can delete their own time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own time entries" ON public.time_entries FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: client_stage_tasks Users can insert client stage tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert client stage tasks" ON public.client_stage_tasks FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: client_stages Users can insert client stages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert client stages" ON public.client_stages FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: custom_table_data Users can insert data if they have edit permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert data if they have edit permission" ON public.custom_table_data FOR INSERT TO authenticated WITH CHECK (((created_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.custom_tables ct
  WHERE ((ct.id = custom_table_data.table_id) AND (public.is_admin_or_manager(auth.uid()) OR (ct.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.custom_table_permissions
          WHERE ((custom_table_permissions.table_id = ct.id) AND (custom_table_permissions.user_id = auth.uid()) AND (custom_table_permissions.can_edit = true))))))))));


--
-- Name: financial_alerts Users can insert their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own alerts" ON public.financial_alerts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: budgets Users can insert their own budgets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own budgets" ON public.budgets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: expenses Users can insert their own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own expenses" ON public.expenses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: app_settings Users can insert their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own settings" ON public.app_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: time_entries Users can insert their own time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own time entries" ON public.time_entries FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: client_stage_tasks Users can update client stage tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update client stage tasks" ON public.client_stage_tasks FOR UPDATE TO authenticated USING (true);


--
-- Name: client_stages Users can update client stages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update client stages" ON public.client_stages FOR UPDATE TO authenticated USING (true);


--
-- Name: custom_table_data Users can update data if they have edit permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update data if they have edit permission" ON public.custom_table_data FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.custom_tables ct
  WHERE ((ct.id = custom_table_data.table_id) AND (public.is_admin_or_manager(auth.uid()) OR (ct.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.custom_table_permissions
          WHERE ((custom_table_permissions.table_id = ct.id) AND (custom_table_permissions.user_id = auth.uid()) AND (custom_table_permissions.can_edit = true)))))))));


--
-- Name: tasks Users can update tasks they created or are assigned to; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update tasks they created or are assigned to" ON public.tasks FOR UPDATE USING (((auth.uid() = created_by) OR (auth.uid() = assigned_to) OR public.is_admin_or_manager(auth.uid())));


--
-- Name: financial_alerts Users can update their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own alerts" ON public.financial_alerts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: budgets Users can update their own budgets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING (((auth.uid() = user_id) OR public.is_admin_or_manager(auth.uid())));


--
-- Name: expenses Users can update their own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: meetings Users can update their own meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own meetings" ON public.meetings FOR UPDATE USING (((auth.uid() = created_by) OR public.is_admin_or_manager(auth.uid())));


--
-- Name: user_preferences Users can update their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: reminders Users can update their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reminders" ON public.reminders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: app_settings Users can update their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own settings" ON public.app_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: time_entries Users can update their own time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own time entries" ON public.time_entries FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: data_types Users can view all data types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all data types" ON public.data_types FOR SELECT USING (true);


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: client_custom_tabs Users can view client custom tabs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view client custom tabs" ON public.client_custom_tabs FOR SELECT USING (true);


--
-- Name: client_stage_tasks Users can view client stage tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view client stage tasks" ON public.client_stage_tasks FOR SELECT TO authenticated USING (true);


--
-- Name: client_stages Users can view client stages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view client stages" ON public.client_stages FOR SELECT TO authenticated USING (true);


--
-- Name: client_tab_columns Users can view client tab columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view client tab columns" ON public.client_tab_columns FOR SELECT USING (public.is_admin_or_manager(auth.uid()));


--
-- Name: custom_table_data Users can view data in tables they have access to; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view data in tables they have access to" ON public.custom_table_data FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.custom_tables ct
  WHERE ((ct.id = custom_table_data.table_id) AND (public.is_admin_or_manager(auth.uid()) OR (ct.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.custom_table_permissions
          WHERE ((custom_table_permissions.table_id = ct.id) AND (custom_table_permissions.user_id = auth.uid()) AND (custom_table_permissions.can_view = true)))))))));


--
-- Name: meetings Users can view meetings they created or are invited to; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view meetings they created or are invited to" ON public.meetings FOR SELECT USING (((auth.uid() = created_by) OR (auth.uid() = ANY (attendees)) OR public.is_admin_or_manager(auth.uid())));


--
-- Name: client_tab_data Users can view tab data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tab data" ON public.client_tab_data FOR SELECT USING (true);


--
-- Name: client_tab_files Users can view tab files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tab files" ON public.client_tab_files FOR SELECT USING (true);


--
-- Name: custom_tables Users can view tables they have permission for; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tables they have permission for" ON public.custom_tables FOR SELECT TO authenticated USING ((public.is_admin_or_manager(auth.uid()) OR (created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.custom_table_permissions
  WHERE ((custom_table_permissions.table_id = custom_table_permissions.id) AND (custom_table_permissions.user_id = auth.uid()) AND (custom_table_permissions.can_view = true))))));


--
-- Name: tasks Users can view tasks they created or are assigned to; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tasks they created or are assigned to" ON public.tasks FOR SELECT USING (((auth.uid() = created_by) OR (auth.uid() = assigned_to) OR public.is_admin_or_manager(auth.uid())));


--
-- Name: activity_log Users can view their own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own activity" ON public.activity_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: financial_alerts Users can view their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own alerts" ON public.financial_alerts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: budgets Users can view their own budgets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING (((auth.uid() = user_id) OR public.is_admin_or_manager(auth.uid())));


--
-- Name: expenses Users can view their own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: custom_table_permissions Users can view their own permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own permissions" ON public.custom_table_permissions FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: user_preferences Users can view their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: reminders Users can view their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reminders" ON public.reminders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: app_settings Users can view their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own settings" ON public.app_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: time_entries Users can view their own time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own time entries" ON public.time_entries FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: activity_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: budgets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

--
-- Name: client_custom_tabs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_custom_tabs ENABLE ROW LEVEL SECURITY;

--
-- Name: client_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

--
-- Name: client_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: client_stage_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_stage_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: client_stages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_stages ENABLE ROW LEVEL SECURITY;

--
-- Name: client_tab_columns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_tab_columns ENABLE ROW LEVEL SECURITY;

--
-- Name: client_tab_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_tab_data ENABLE ROW LEVEL SECURITY;

--
-- Name: client_tab_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_tab_files ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_table_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_table_data ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_table_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_table_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_tables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: data_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_types ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: meetings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: project_updates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: quote_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quote_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: table_custom_columns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.table_custom_columns ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: time_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: whatsapp_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

--
-- PostgreSQL database dump complete
--




COMMIT;