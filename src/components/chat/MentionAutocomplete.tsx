/**
 * MentionAutocomplete - @mention dropdown for chat input
 * Shows participants matching the @query, inserts @name
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Participant {
  user_id: string;
  full_name: string;
  avatar_url?: string;
}

interface MentionAutocompleteProps {
  conversationId: string;
  query: string; // text after @ (empty = show all)
  onSelect: (name: string, userId: string) => void;
  onClose: () => void;
}

export function MentionAutocomplete({
  conversationId,
  query,
  onSelect,
  onClose,
}: MentionAutocompleteProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selected, setSelected] = useState(0);

  const fetchParticipants = useCallback(async () => {
    const { data } = await supabase
      .from("chat_participants")
      .select("user_id, profiles(full_name, avatar_url)")
      .eq("conversation_id", conversationId)
      .eq("participant_type", "user");
    const list: Participant[] = (data || [])
      .map((p: any) => ({
        user_id: p.user_id,
        full_name: p.profiles?.full_name || "משתמש",
        avatar_url: p.profiles?.avatar_url,
      }))
      .filter(
        (p) =>
          !query || p.full_name.toLowerCase().includes(query.toLowerCase()),
      );
    setParticipants(list);
    setSelected(0);
  }, [conversationId, query]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, participants.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const p = participants[selected];
        if (p) onSelect(p.full_name, p.user_id);
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [participants, selected, onSelect, onClose]);

  if (participants.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-0 mb-1 z-50 bg-background border rounded-xl shadow-xl py-1 min-w-[180px] max-w-[240px] max-h-48 overflow-y-auto"
      dir="rtl"
    >
      <p className="text-[10px] text-muted-foreground px-3 py-1 border-b">
        תייג משתתף
      </p>
      {participants.map((p, i) => (
        <button
          key={p.user_id}
          onClick={() => onSelect(p.full_name, p.user_id)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-right transition-colors hover:bg-muted",
            i === selected && "bg-muted",
          )}
        >
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={p.avatar_url} />
            <AvatarFallback className="text-[9px]">
              {p.full_name[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm truncate">{p.full_name}</span>
        </button>
      ))}
    </div>
  );
}
