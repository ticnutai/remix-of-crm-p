import { useClientCustomFields } from "@/hooks/useClientCustomFields";

/**
 * Loads the user's custom client field definitions once at app start so the
 * app-wide registry (quote tokens, contract placeholders, search) knows them
 * on every page — not only on pages that happen to mount the hook.
 */
export function CustomFieldRegistryInitializer() {
  useClientCustomFields();
  return null;
}
