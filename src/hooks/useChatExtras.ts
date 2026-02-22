/**
 * useChatExtras - Extended chat features hook
 * Mute, Favorites, Labels, Saved Messages, Templates, Threads,
 * SLA, Read Receipts, Translate, Analytics, WhatsApp/SMS
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ChatLabel {
  id: string;
  name: string;
  color: string;
  emoji?: string | null;
}

export interface ChatTemplate {
  id: string;
  title: string;
  content: string;
  shortcut?: string | null;
  category: string;
  use_count: number;
}

export interface SavedMessage {
  id: string;
  message_id: string;
  saved_at: string;
  message?: { content: string; sender_name?: string; created_at: string };
}

export interface SlaInfo {
  first_response_minutes: number;
  minutesElapsed: number;
  isBreached: boolean;
  percentUsed: number;
}

export function useChatExtras(conversationId?: string | null) {
  const { user } = useAuth();

  // --- Conv settings (mute / favorite / theme) ---
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [themeColor, setThemeColorState] = useState<string | null>(null);
  const [themeEmoji, setThemeEmojiState] = useState<string | null>(null);

  // --- Labels ---
  const [allLabels, setAllLabels] = useState<ChatLabel[]>([]);
  const [convLabels, setConvLabels] = useState<ChatLabel[]>([]);

  // --- Saved messages ---
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);

  // --- Templates ---
  const [templates, setTemplates] = useState<ChatTemplate[]>([]);

  // --- Read receipts (who read last) ---
  const [readBy, setReadBy] = useState<
    {
      user_id: string;
      full_name: string;
      avatar_url?: string;
      last_read_at: string;
    }[]
  >([]);

  // --- SLA ---
  const [slaInfo, setSlaInfo] = useState<SlaInfo | null>(null);

  // Load per-conversation settings
  useEffect(() => {
    if (!user || !conversationId) return;
    supabase
      .from("chat_conversation_settings")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setIsMuted(data?.is_muted || false);
        setIsFavorite(data?.is_favorite || false);
        setThemeColorState(data?.theme_color || null);
        setThemeEmojiState(data?.theme_emoji || null);
      });
  }, [user, conversationId]);

  // Load labels
  useEffect(() => {
    supabase
      .from("chat_labels")
      .select("*")
      .order("name")
      .then(({ data }) => setAllLabels(data || []));
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    supabase
      .from("chat_conversation_labels")
      .select("label_id, chat_labels(*)")
      .eq("conversation_id", conversationId)
      .then(({ data }) =>
        setConvLabels(
          (data || []).map((r: any) => r.chat_labels).filter(Boolean),
        ),
      );
  }, [conversationId]);

  // Load templates
  useEffect(() => {
    supabase
      .from("chat_message_templates")
      .select("*")
      .order("use_count", { ascending: false })
      .then(({ data }) => setTemplates(data || []));
  }, []);

  // Load saved messages
  const fetchSaved = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_saved_messages")
      .select("*, chat_messages(content, created_at, sender_id, sender_type)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })
      .limit(50);
    setSavedMessages(
      (data || []).map((r: any) => ({
        id: r.id,
        message_id: r.message_id,
        saved_at: r.saved_at,
        message: r.chat_messages,
      })),
    );
  }, [user]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  // Load read receipts for conversation
  useEffect(() => {
    if (!conversationId) return;
    supabase
      .from("chat_participants")
      .select("user_id, last_read_at, profiles(full_name, avatar_url)")
      .eq("conversation_id", conversationId)
      .neq("user_id", user?.id)
      .then(({ data }) => {
        setReadBy(
          (data || [])
            .map((p: any) => ({
              user_id: p.user_id,
              full_name: p.profiles?.full_name || "?",
              avatar_url: p.profiles?.avatar_url,
              last_read_at: p.last_read_at,
            }))
            .filter((p) => p.last_read_at),
        );
      });
  }, [conversationId, user?.id]);

  // Load SLA
  useEffect(() => {
    if (!conversationId) return;
    let timer: ReturnType<typeof setInterval>;
    const loadSla = async () => {
      const { data: conv } = await supabase
        .from("chat_conversations")
        .select("type, created_at, sla_first_response_at")
        .eq("id", conversationId)
        .single();
      if (!conv) return;

      const { data: sla } = await supabase
        .from("chat_sla_settings")
        .select("*")
        .eq("conversation_type", conv.type)
        .eq("is_active", true)
        .single();
      if (!sla) return;

      const targetMinutes = conv.sla_first_response_at
        ? null
        : sla.first_response_minutes;
      if (!targetMinutes) {
        setSlaInfo(null);
        return;
      }

      timer = setInterval(() => {
        const elapsed =
          (Date.now() - new Date(conv.created_at).getTime()) / 60000;
        setSlaInfo({
          first_response_minutes: targetMinutes,
          minutesElapsed: Math.floor(elapsed),
          isBreached: elapsed > targetMinutes,
          percentUsed: Math.min(100, (elapsed / targetMinutes) * 100),
        });
      }, 10000);
      // Fire immediately
      const elapsed =
        (Date.now() - new Date(conv.created_at).getTime()) / 60000;
      setSlaInfo({
        first_response_minutes: targetMinutes,
        minutesElapsed: Math.floor(elapsed),
        isBreached: elapsed > targetMinutes,
        percentUsed: Math.min(100, (elapsed / targetMinutes) * 100),
      });
    };
    loadSla();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [conversationId]);

  // --- Actions ---

  const upsertSetting = useCallback(
    async (patch: Record<string, any>) => {
      if (!user || !conversationId) return;
      await supabase.from("chat_conversation_settings").upsert(
        {
          conversation_id: conversationId,
          user_id: user.id,
          ...patch,
        },
        { onConflict: "conversation_id,user_id" },
      );
    },
    [user, conversationId],
  );

  const toggleMute = useCallback(async () => {
    const next = !isMuted;
    setIsMuted(next);
    await upsertSetting({ is_muted: next });
  }, [isMuted, upsertSetting]);

  const toggleFavorite = useCallback(async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    await upsertSetting({ is_favorite: next });
  }, [isFavorite, upsertSetting]);

  const setTheme = useCallback(
    async (color?: string, emoji?: string) => {
      setThemeColorState(color || null);
      setThemeEmojiState(emoji || null);
      await upsertSetting({
        theme_color: color || null,
        theme_emoji: emoji || null,
      });
    },
    [upsertSetting],
  );

  const addLabel = useCallback(
    async (labelId: string) => {
      if (!conversationId || !user) return;
      await supabase
        .from("chat_conversation_labels")
        .upsert({
          conversation_id: conversationId,
          label_id: labelId,
          added_by: user.id,
        });
      const label = allLabels.find((l) => l.id === labelId);
      if (label)
        setConvLabels((prev) => [
          ...prev.filter((l) => l.id !== labelId),
          label,
        ]);
    },
    [conversationId, user, allLabels],
  );

  const removeLabel = useCallback(
    async (labelId: string) => {
      if (!conversationId) return;
      await supabase
        .from("chat_conversation_labels")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("label_id", labelId);
      setConvLabels((prev) => prev.filter((l) => l.id !== labelId));
    },
    [conversationId],
  );

  const saveMessage = useCallback(
    async (messageId: string) => {
      if (!user) return;
      const existing = savedMessages.find((s) => s.message_id === messageId);
      if (existing) {
        await supabase
          .from("chat_saved_messages")
          .delete()
          .eq("id", existing.id);
        setSavedMessages((prev) => prev.filter((s) => s.id !== existing.id));
      } else {
        const { data } = await supabase
          .from("chat_saved_messages")
          .insert({ user_id: user.id, message_id: messageId })
          .select()
          .single();
        if (data)
          setSavedMessages((prev) => [
            { id: data.id, message_id: messageId, saved_at: data.saved_at },
            ...prev,
          ]);
      }
    },
    [user, savedMessages],
  );

  const isMessageSaved = useCallback(
    (messageId: string) =>
      savedMessages.some((s) => s.message_id === messageId),
    [savedMessages],
  );

  const useTemplate = useCallback(async (templateId: string) => {
    await supabase
      .from("chat_message_templates")
      .update({ use_count: supabase.rpc("increment" as any) })
      .eq("id", templateId);
  }, []);

  const createTemplate = useCallback(
    async (
      title: string,
      content: string,
      shortcut?: string,
      category = "general",
    ) => {
      const { data } = await supabase
        .from("chat_message_templates")
        .insert({ title, content, shortcut, category, created_by: user?.id })
        .select()
        .single();
      if (data) setTemplates((prev) => [data, ...prev]);
      return data;
    },
    [user],
  );

  const translateMessage = useCallback(
    async (text: string, targetLang: "he" | "en" = "he"): Promise<string> => {
      try {
        const { data } = await supabase.functions.invoke("ai-chat", {
          body: {
            messages: [
              {
                role: "system",
                content: `Translate the following text to ${targetLang === "he" ? "Hebrew" : "English"}. Return only the translation, nothing else.`,
              },
              { role: "user", content: text },
            ],
          },
        });
        return data?.choices?.[0]?.message?.content || data?.response || text;
      } catch {
        return text;
      }
    },
    [],
  );

  const sendWhatsApp = useCallback(
    async (phoneNumber: string, message: string, clientId?: string) => {
      if (!user || !conversationId) return false;
      const phone = phoneNumber.replace(/\D/g, "");
      const fullPhone = phone.startsWith("972")
        ? phone
        : phone.startsWith("0")
          ? `972${phone.slice(1)}`
          : `972${phone}`;
      await supabase.from("chat_whatsapp_queue").insert({
        conversation_id: conversationId,
        client_id: clientId || null,
        phone_number: fullPhone,
        message,
        channel: "whatsapp",
        created_by: user.id,
      });
      // Open WhatsApp web as fallback
      window.open(
        `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`,
        "_blank",
      );
      return true;
    },
    [user, conversationId],
  );

  const sendSMS = useCallback(
    async (phoneNumber: string, message: string, clientId?: string) => {
      if (!user || !conversationId) return false;
      const phone = phoneNumber.replace(/\D/g, "");
      await supabase.from("chat_whatsapp_queue").insert({
        conversation_id: conversationId,
        client_id: clientId || null,
        phone_number: phone,
        message,
        channel: "sms",
        created_by: user.id,
      });
      window.open(`sms:${phone}?body=${encodeURIComponent(message)}`);
      return true;
    },
    [user, conversationId],
  );

  return {
    // settings
    isMuted,
    isFavorite,
    themeColor,
    themeEmoji,
    toggleMute,
    toggleFavorite,
    setTheme,
    // labels
    allLabels,
    convLabels,
    addLabel,
    removeLabel,
    // saved
    savedMessages,
    saveMessage,
    isMessageSaved,
    fetchSaved,
    // templates
    templates,
    useTemplate,
    createTemplate,
    // read receipts
    readBy,
    // sla
    slaInfo,
    // extras
    translateMessage,
    sendWhatsApp,
    sendSMS,
  };
}
