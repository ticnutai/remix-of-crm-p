import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DialogState {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

const LS_PREFIX = 'dialog_state::';
const SETTING_KEY_PREFIX = 'dialog_state_';

export function useDialogPersistence(dialogKey: string | undefined) {
  const { user } = useAuth();
  const [state, setState] = useState<DialogState>(() => {
    if (!dialogKey) return {};
    try {
      const raw = localStorage.getItem(LS_PREFIX + dialogKey);
      if (raw) return JSON.parse(raw) as DialogState;
    } catch { }
    return {};
  });
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from cloud (overrides local if available) and keep latest cloud value.
  useEffect(() => {
    let cancelled = false;
    if (!dialogKey || !user?.id) {
      setLoaded(true);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', SETTING_KEY_PREFIX + dialogKey)
          .maybeSingle();
        if (!cancelled && data?.setting_value) {
          const cloud = data.setting_value as DialogState;
          setState(cloud);
          try {
            localStorage.setItem(LS_PREFIX + dialogKey, JSON.stringify(cloud));
          } catch { }
        }
      } catch (err) {
        console.error('dialog persistence load failed', err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dialogKey, user?.id]);

  const persist = useCallback(
    (next: DialogState) => {
      if (!dialogKey) return;
      try {
        localStorage.setItem(LS_PREFIX + dialogKey, JSON.stringify(next));
      } catch { }
      if (!user?.id) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await supabase.from('user_settings').upsert(
            {
              user_id: user.id,
              setting_key: SETTING_KEY_PREFIX + dialogKey,
              setting_value: next as any,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,setting_key' },
          );
        } catch (err) {
          console.error('dialog persistence save failed', err);
        }
      }, 400);
    },
    [dialogKey, user?.id],
  );

  const update = useCallback(
    (patch: Partial<DialogState>) => {
      setState(prev => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return { state, update, loaded };
}
