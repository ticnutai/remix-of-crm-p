
-- Add approval workflow to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS requested_role text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Validation trigger for approval_status
CREATE OR REPLACE FUNCTION public.validate_approval_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.approval_status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'invalid approval_status: %', NEW.approval_status;
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS validate_approval_status_trg ON public.profiles;
CREATE TRIGGER validate_approval_status_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_approval_status();

-- Replace handle_new_user: first user = admin approved, others = pending no role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;

  IF user_count = 0 THEN
    INSERT INTO public.profiles (id, email, full_name, is_active, approval_status, approved_at)
    VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
      true, 'approved', now()
    );
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.profiles (id, email, full_name, is_active, approval_status)
    VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
      false, 'pending'
    );
    -- No role assigned yet — admin will assign on approval
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin approve function: sets profile approved + assigns role
CREATE OR REPLACE FUNCTION public.approve_user(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;

  UPDATE public.profiles
  SET approval_status = 'approved',
      approved_at = now(),
      approved_by = auth.uid(),
      is_active = true
  WHERE id = _user_id;

  -- Remove any existing roles, set the new one
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject users';
  END IF;

  UPDATE public.profiles
  SET approval_status = 'rejected', is_active = false
  WHERE id = _user_id;

  DELETE FROM public.user_roles WHERE user_id = _user_id;
END;
$$;
