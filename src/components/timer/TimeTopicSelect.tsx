// TimeTopicSelect - pick the "topic" of a time entry: one of the selected
// client's folders (e.g. "שינוי תב״ע", "היתר בניה"). Stored in
// time_entries.folder_id.
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ClientFolderTopic {
  id: string;
  client_id: string;
  folder_name: string;
  sort_order: number | null;
}

const NONE = "__none__";

/** All client folders, used as time-entry topics. Cached for 5 minutes. */
export function useClientFolderTopics() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["client-folder-topics"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_folders")
        .select("id, client_id, folder_name, sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data || []) as ClientFolderTopic[];
    },
  });

  const topicNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of data) map[f.id] = f.folder_name;
    return map;
  }, [data]);

  return { topics: data, topicNames, isLoading };
}

interface Props {
  clientId: string | null | undefined;
  value: string | null | undefined;
  onChange: (folderId: string) => void;
  label?: string;
}

export function TimeTopicSelect({ clientId, value, onChange, label = "נושא (אופציונלי)" }: Props) {
  const { topics } = useClientFolderTopics();
  const clientTopics = useMemo(
    () => (clientId ? topics.filter((t) => t.client_id === clientId) : []),
    [topics, clientId],
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value || NONE}
        onValueChange={(v) => onChange(v === NONE ? "" : v)}
        disabled={!clientId}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={clientId ? "בחר נושא" : "בחר קודם לקוח"}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>ללא נושא</SelectItem>
          {clientTopics.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.folder_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {clientId && clientTopics.length === 0 && (
        <p className="text-xs text-muted-foreground">
          ללקוח הזה אין עדיין תיקיות. אפשר להוסיף תיקיות (כמו שינוי תב״ע או היתר בניה) בכרטיס הלקוח.
        </p>
      )}
    </div>
  );
}
