/**
 * Network Recovery Initializer
 * Mounts the useNetworkRecovery hook at the app root level.
 * Handles Supabase Realtime reconnection after device sleep / tab background.
 */
import { useNetworkRecovery } from "@/hooks/useNetworkRecovery";

export function NetworkRecoveryInitializer() {
  useNetworkRecovery();
  return null;
}
