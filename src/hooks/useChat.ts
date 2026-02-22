/**
 * useChat - Real-time Chat Hook
 * מערכת צ'אט בזמן אמת - שיחות פנימיות ועם לקוחות
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_client_id: string | null;
  sender_type: "user" | "client";
  content: string;
  message_type: "text" | "image" | "file" | "voice" | "system";
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  is_edited: boolean;
  edited_at?: string | null;
  is_deleted: boolean;
  reply_to_id?: string | null;
  reply_to?: ChatMessage | null;
  reactions: Record<string, string[]>;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id?: string | null;
  client_id?: string | null;
  participant_type: "user" | "client";
  joined_at: string;
  last_read_at?: string | null;
  is_admin: boolean;
  profile?: {
    full_name: string;
    avatar_url?: string;
    email?: string;
  };
}

export interface ChatConversation {
  id: string;
  title: string | null;
  type: "internal" | "client" | "group";
  client_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  last_message?: string | null;
  last_message_at?: string | null;
  is_archived: boolean;
  participants?: ChatParticipant[];
  unread_count?: number;
  client_name?: string;
}

export interface TypingUser {
  user_id: string;
  name: string;
}

export function useChat() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // -----------------------------------------------------------
  // Fetch all conversations for current user
  // -----------------------------------------------------------
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get conversations where user is a participant
      const { data: participantData, error: pErr } = await supabase
        .from("chat_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (pErr) throw pErr;
      const convIds = (participantData || []).map(
        (p: any) => p.conversation_id,
      );

      if (convIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: convData, error: cErr } = await supabase
        .from("chat_conversations")
        .select("*")
        .in("id", convIds)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false });

      if (cErr) throw cErr;

      // Get unread counts
      const convList: ChatConversation[] = await Promise.all(
        (convData || []).map(async (conv: any) => {
          // Get last read time for current user
          const { data: partData } = await supabase
            .from("chat_participants")
            .select("last_read_at")
            .eq("conversation_id", conv.id)
            .eq("user_id", user.id)
            .single();

          const lastReadAt = partData?.last_read_at;

          let unread = 0;
          if (lastReadAt) {
            const { count } = await supabase
              .from("chat_messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .neq("sender_id", user.id)
              .gt("created_at", lastReadAt)
              .eq("is_deleted", false);
            unread = count || 0;
          } else {
            const { count } = await supabase
              .from("chat_messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .neq("sender_id", user.id)
              .eq("is_deleted", false);
            unread = count || 0;
          }

          // Get client name if client conversation
          let client_name = "";
          if (conv.client_id) {
            const { data: clientData } = await supabase
              .from("clients")
              .select("name")
              .eq("id", conv.client_id)
              .single();
            client_name = clientData?.name || "";
          }

          return {
            ...conv,
            unread_count: unread,
            client_name,
          };
        }),
      );

      setConversations(convList);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // -----------------------------------------------------------
  // Fetch messages for a conversation
  // -----------------------------------------------------------
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Enrich with sender names (batch fetch profiles)
        const senderIds = [
          ...new Set(
            (data || [])
              .filter((m: any) => m.sender_type === "user" && m.sender_id)
              .map((m: any) => m.sender_id),
          ),
        ];

        let profilesMap: Record<
          string,
          { full_name: string; avatar_url?: string }
        > = {};
        if (senderIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", senderIds);
          (profilesData || []).forEach((p: any) => {
            profilesMap[p.id] = p;
          });
        }

        const enriched: ChatMessage[] = (data || []).map((m: any) => ({
          ...m,
          reactions: m.reactions || {},
          sender_name:
            m.sender_type === "user"
              ? profilesMap[m.sender_id]?.full_name || "משתמש"
              : "לקוח",
          sender_avatar:
            m.sender_type === "user"
              ? profilesMap[m.sender_id]?.avatar_url
              : undefined,
        }));

        setMessages(enriched);

        // Mark as read
        await markAsRead(conversationId);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // -----------------------------------------------------------
  // Mark conversation as read
  // -----------------------------------------------------------
  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!user) return;
      await supabase
        .from("chat_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      // Update local unread count
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c,
        ),
      );
    },
    [user],
  );

  // -----------------------------------------------------------
  // Select a conversation
  // -----------------------------------------------------------
  const selectConversation = useCallback(
    async (conv: ChatConversation) => {
      setActiveConversation(conv);
      setMessages([]);
      await fetchMessages(conv.id);
    },
    [fetchMessages],
  );

  // -----------------------------------------------------------
  // Send a message
  // -----------------------------------------------------------
  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        messageType?: "text" | "file" | "image";
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        fileType?: string;
        replyToId?: string;
      },
    ) => {
      if (!user || !activeConversation || !content.trim()) return;
      setSendingMessage(true);
      try {
        const msgData: any = {
          conversation_id: activeConversation.id,
          sender_id: user.id,
          sender_type: "user",
          content: content.trim(),
          message_type: options?.messageType || "text",
          file_url: options?.fileUrl || null,
          file_name: options?.fileName || null,
          file_size: options?.fileSize || null,
          file_type: options?.fileType || null,
          reply_to_id: options?.replyToId || null,
        };

        const { data, error } = await supabase
          .from("chat_messages")
          .insert(msgData)
          .select()
          .single();

        if (error) throw error;

        // Optimistic UI
        const newMsg: ChatMessage = {
          ...data,
          reactions: {},
          sender_name: profile?.full_name || "אתה",
          is_edited: false,
          is_deleted: false,
        };
        setMessages((prev) => [...prev, newMsg]);
      } catch (err) {
        console.error("Error sending message:", err);
      } finally {
        setSendingMessage(false);
      }
    },
    [user, profile, activeConversation],
  );

  // -----------------------------------------------------------
  // Create new conversation
  // -----------------------------------------------------------
  const createConversation = useCallback(
    async (
      type: "internal" | "client" | "group",
      options: {
        title?: string;
        participantIds?: string[];
        clientId?: string;
      },
    ) => {
      if (!user) return null;
      try {
        // Create conversation
        const { data: conv, error: cErr } = await supabase
          .from("chat_conversations")
          .insert({
            type,
            title: options.title || null,
            client_id: options.clientId || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (cErr) throw cErr;

        // Add current user as admin participant
        const participants: any[] = [
          {
            conversation_id: conv.id,
            user_id: user.id,
            participant_type: "user",
            is_admin: true,
          },
        ];

        // Add other participants
        (options.participantIds || []).forEach((uid) => {
          if (uid !== user.id) {
            participants.push({
              conversation_id: conv.id,
              user_id: uid,
              participant_type: "user",
              is_admin: false,
            });
          }
        });

        await supabase.from("chat_participants").insert(participants);

        await fetchConversations();
        return conv;
      } catch (err) {
        console.error("Error creating conversation:", err);
        return null;
      }
    },
    [user, fetchConversations],
  );

  // -----------------------------------------------------------
  // Add emoji reaction
  // -----------------------------------------------------------
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;

      const reactions = { ...(msg.reactions || {}) };
      const users = reactions[emoji] || [];
      if (users.includes(user.id)) {
        // Remove reaction
        reactions[emoji] = users.filter((u: string) => u !== user.id);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...users, user.id];
      }

      await supabase
        .from("chat_messages")
        .update({ reactions })
        .eq("id", messageId);

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
      );
    },
    [user, messages],
  );

  // -----------------------------------------------------------
  // Delete message
  // -----------------------------------------------------------
  const deleteMessage = useCallback(async (messageId: string) => {
    await supabase
      .from("chat_messages")
      .update({ is_deleted: true })
      .eq("id", messageId);

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  // -----------------------------------------------------------
  // Typing indicator
  // -----------------------------------------------------------
  const sendTyping = useCallback(async () => {
    if (!user || !activeConversation) return;

    // Upsert typing record
    await supabase.from("chat_typing").upsert({
      conversation_id: activeConversation.id,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    });

    // Auto-clear after 3 seconds
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      await supabase
        .from("chat_typing")
        .delete()
        .eq("conversation_id", activeConversation.id)
        .eq("user_id", user.id);
    }, 3000);
  }, [user, activeConversation]);

  // -----------------------------------------------------------
  // Real-time subscription
  // -----------------------------------------------------------
  useEffect(() => {
    if (!user || !activeConversation) return;

    const channelName = `chat-${activeConversation.id}`;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        async (payload: any) => {
          const newMsg = payload.new;
          // Don't add own messages (already added optimistically)
          if (newMsg.sender_id === user.id) return;

          // Fetch sender name
          let senderName = "משתמש";
          if (newMsg.sender_type === "user" && newMsg.sender_id) {
            const { data } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", newMsg.sender_id)
              .single();
            senderName = data?.full_name || "משתמש";
          }

          setMessages((prev) => [
            ...prev,
            {
              ...newMsg,
              reactions: newMsg.reactions || {},
              sender_name: senderName,
              is_edited: false,
              is_deleted: false,
            },
          ]);

          // Mark as read
          await markAsRead(activeConversation.id);
        },
      )
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload: any) => {
          const updated = payload.new;
          if (updated.is_deleted) {
            setMessages((prev) => prev.filter((m) => m.id !== updated.id));
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === updated.id
                  ? { ...m, ...updated, reactions: updated.reactions || {} }
                  : m,
              ),
            );
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    // Presence channel for online users
    const presenceChannel = supabase
      .channel(`presence-chat-${activeConversation.id}`)
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState<{ user_id: string }>();
        const online = Object.values(state)
          .flat()
          .map((p: any) => p.user_id);
        setOnlineUsers(online);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: user.id });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user, activeConversation, markAsRead]);

  // Subscribe to conversation list updates
  useEffect(() => {
    if (!user) return;

    const listChannel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "chat_conversations",
        },
        () => {
          fetchConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(listChannel);
    };
  }, [user, fetchConversations]);

  // Initial load
  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0,
  );

  // -----------------------------------------------------------
  // Edit message
  // -----------------------------------------------------------
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!user || !newContent.trim()) return;
      const { error } = await supabase
        .from("chat_messages")
        .update({
          content: newContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .eq("sender_id", user.id);
      if (!error) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: newContent.trim(),
                  is_edited: true,
                  edited_at: new Date().toISOString(),
                }
              : m,
          ),
        );
      }
    },
    [user],
  );

  // -----------------------------------------------------------
  // Pin / unpin message in conversation
  // -----------------------------------------------------------
  const pinMessage = useCallback(
    async (conversationId: string, messageId: string | null) => {
      await supabase
        .from("chat_conversations")
        .update({ pinned_message_id: messageId })
        .eq("id", conversationId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? ({ ...c, pinned_message_id: messageId } as any)
            : c,
        ),
      );
    },
    [],
  );

  // -----------------------------------------------------------
  // Forward message to another conversation
  // -----------------------------------------------------------
  const forwardMessage = useCallback(
    async (messageId: string, targetConversationId: string) => {
      if (!user) return;
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;

      await supabase.from("chat_messages").insert({
        conversation_id: targetConversationId,
        sender_id: user.id,
        sender_type: "user",
        content: msg.content,
        message_type: msg.message_type,
        file_url: msg.file_url,
        file_name: msg.file_name,
        file_size: msg.file_size,
        file_type: msg.file_type,
        forwarded_from_id: messageId,
      });
    },
    [user, messages],
  );

  // -----------------------------------------------------------
  // Search messages in active conversation
  // -----------------------------------------------------------
  const searchMessages = useCallback(
    async (query: string): Promise<ChatMessage[]> => {
      if (!activeConversation || !query.trim()) return [];
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", activeConversation.id)
        .eq("is_deleted", false)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []).map((m: any) => ({
        ...m,
        reactions: m.reactions || {},
        is_edited: m.is_edited || false,
        is_deleted: false,
      }));
    },
    [activeConversation],
  );

  // -----------------------------------------------------------
  // Create poll
  // -----------------------------------------------------------
  const createPoll = useCallback(
    async (question: string, options: string[], allowMultiple = false) => {
      if (!user || !activeConversation) return;
      // Insert poll
      const { data: poll } = await supabase
        .from("chat_polls")
        .insert({
          conversation_id: activeConversation.id,
          created_by: user.id,
          question,
          options: options.map((text, i) => ({ id: String(i), text })),
          allow_multiple: allowMultiple,
        })
        .select()
        .single();

      if (!poll) return;

      // Create system message to hold poll
      await sendMessage(`📊 סקר: ${question}`, {
        messageType: "text",
      });
    },
    [user, activeConversation, sendMessage],
  );

  // -----------------------------------------------------------
  // Convert message to task
  // -----------------------------------------------------------
  const convertToTask = useCallback(
    async (messageId: string, taskTitle: string, assignedTo?: string) => {
      if (!user || !activeConversation) return;
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;

      // Insert into tasks table if it exists
      let taskId: string | undefined;
      const { data: task } = await supabase
        .from("tasks")
        .insert({
          title: taskTitle,
          description: msg.content,
          assigned_to: assignedTo || user.id,
          created_by: user.id,
          status: "pending",
        })
        .select("id")
        .single()
        .catch(() => ({ data: null }));

      taskId = task?.id;

      // Record the link
      await supabase.from("chat_message_tasks").insert({
        message_id: messageId,
        conversation_id: activeConversation.id,
        created_by: user.id,
        task_title: taskTitle,
        assigned_to: assignedTo || null,
        task_id: taskId || null,
      });

      return taskId;
    },
    [user, activeConversation, messages],
  );

  // -----------------------------------------------------------
  // Schedule message
  // -----------------------------------------------------------
  const scheduleMessage = useCallback(
    async (content: string, scheduledAt: Date) => {
      if (!user || !activeConversation) return;
      await supabase.from("chat_scheduled_messages").insert({
        conversation_id: activeConversation.id,
        sender_id: user.id,
        content,
        scheduled_at: scheduledAt.toISOString(),
      });
    },
    [user, activeConversation],
  );

  // -----------------------------------------------------------
  // Get media gallery for active conversation
  // -----------------------------------------------------------
  const getMediaGallery = useCallback(
    async (type: "images" | "files" | "all" = "all") => {
      if (!activeConversation) return [];
      let query = supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", activeConversation.id)
        .eq("is_deleted", false)
        .not("file_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (type === "images") query = query.eq("message_type", "image");
      else if (type === "files") query = query.neq("message_type", "image");

      const { data } = await query;
      return (data || []).map((m: any) => ({
        ...m,
        reactions: m.reactions || {},
        is_edited: false,
        is_deleted: false,
      }));
    },
    [activeConversation],
  );

  // -----------------------------------------------------------
  // AI Summary of conversation
  // -----------------------------------------------------------
  const summarizeConversation = useCallback(async (): Promise<string> => {
    if (!activeConversation || messages.length === 0)
      return "אין הודעות לסיכום";
    const last50 = messages.slice(-50).filter((m) => m.message_type === "text");
    const chatText = last50
      .map((m) => `${m.sender_name}: ${m.content}`)
      .join("\n");

    try {
      const { data } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [
            {
              role: "system",
              content:
                "אתה עוזר עסקי. סכם את השיחה הבאה בנקודות עיקריות בעברית. תהיה קצר וברור.",
            },
            { role: "user", content: `סכם את השיחה הזו:\n\n${chatText}` },
          ],
        },
      });
      return (
        data?.choices?.[0]?.message?.content || data?.response || "לא ניתן לסכם"
      );
    } catch {
      return "שגיאה בסיכום";
    }
  }, [activeConversation, messages]);

  return {
    conversations,
    activeConversation,
    messages,
    typingUsers,
    loading,
    sendingMessage,
    onlineUsers,
    totalUnread,
    fetchConversations,
    fetchMessages,
    selectConversation,
    sendMessage,
    createConversation,
    addReaction,
    deleteMessage,
    sendTyping,
    markAsRead,
    editMessage,
    pinMessage,
    forwardMessage,
    searchMessages,
    createPoll,
    convertToTask,
    scheduleMessage,
    getMediaGallery,
    summarizeConversation,
  };
}
