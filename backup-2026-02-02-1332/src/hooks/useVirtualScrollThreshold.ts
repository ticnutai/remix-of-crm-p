// Hook to get the user's virtual scroll threshold preference
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const DEFAULT_THRESHOLD = 50;

export function useVirtualScrollThreshold() {
  const { user } = useAuth();
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);

  useEffect(() => {
    const loadThreshold = async () => {
      if (!user?.id) {
        setThreshold(DEFAULT_THRESHOLD);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('virtual_scroll_threshold')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.virtual_scroll_threshold) {
          setThreshold(data.virtual_scroll_threshold);
        }
      } catch (error) {
        console.error('Error loading virtual scroll threshold:', error);
      }
    };

    loadThreshold();
  }, [user?.id]);

  return threshold;
}
