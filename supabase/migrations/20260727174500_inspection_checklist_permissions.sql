-- Make the new checklist module visible to existing staff.
-- Existing explicit choices are preserved by ON CONFLICT DO NOTHING.
INSERT INTO public.user_permissions (
  user_id,
  module,
  can_view,
  can_edit,
  can_delete
)
SELECT
  p.id,
  'inspection-forms',
  true,
  true,
  false
FROM public.profiles p
WHERE COALESCE(p.is_active, true) = true
ON CONFLICT (user_id, module) DO NOTHING;
