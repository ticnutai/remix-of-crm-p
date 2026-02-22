/**
 * ClientChatPanel - פאנל צ'אט מוטמע בדף לקוח
 * Embed in ClientProfile page to see/start conversation with a client
 */

import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { he } from "date-fns/locale";

interface ClientChatPanelProps {
  clientId: string;
  clientName: string;
  className?: string;
}

export function ClientChatPanel({
  clientId,
  clientName,
  className,
}: ClientChatPanelProps) {
  const { user, profile } = useAuth();
  const {
    conversations,
    messages,
    activeConversation,
    selectConversation,
    sendMessage,
    createConversation,
    sendingMessage,
    loading,
  } = useChat();

  const [input, setInput] = useState("");
  const [starting, setStarting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find existing conversation for this client
  const clientConv = conversations.find((c) => c.client_id === clientId);

  useEffect(() => {
    if (
      clientConv &&
      (!activeConversation || activeConversation.id !== clientConv.id)
    ) {
      selectConversation(clientConv);
    }
  }, [clientConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartConversation = async () => {
    setStarting(true);
    const conv = await createConversation("client", {
      title: `שיחה עם ${clientName}`,
      clientId,
    });
    if (conv) selectConversation(conv as any);
    setStarting(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    if (isToday(d)) return format(d, "HH:mm");
    return format(d, "dd/MM HH:mm");
  };

  if (!clientConv && !activeConversation) {
    return (
      <div
        className={cn(
          "border rounded-2xl p-6 flex flex-col items-center gap-3 text-center bg-muted/20",
          className,
        )}
      >
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
          <MessageCircle className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">פתח שיחה עם {clientName}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            ניהול שיחות וידוא מול הלקוח
          </p>
        </div>
        <Button
          onClick={handleStartConversation}
          disabled={starting}
          className="rounded-xl gap-2"
        >
          {starting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          התחל שיחה
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border rounded-2xl flex flex-col overflow-hidden bg-background",
        className,
      )}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b bg-muted/20">
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <MessageCircle className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{clientName}</div>
          <div className="text-[10px] text-muted-foreground">שיחת לקוח</div>
        </div>
        {(clientConv?.unread_count || 0) > 0 && (
          <Badge className="bg-destructive rounded-full text-[10px]">
            {clientConv!.unread_count}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2" style={{ height: "280px" }}>
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            שלח הודעה ראשונה ללקוח
          </div>
        ) : (
          <div className="space-y-1">
            {messages
              .filter((m) => !m.is_deleted)
              .map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-1.5",
                      isOwn ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    {!isOwn && (
                      <Avatar className="h-6 w-6 mt-0.5 shrink-0">
                        <AvatarFallback className="text-[9px] bg-blue-100">
                          {(msg.sender_name || "L").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-1.5 text-sm break-words",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm",
                      )}
                    >
                      {msg.content}
                      <div
                        className={cn(
                          "text-[9px] mt-0.5",
                          isOwn
                            ? "text-primary-foreground/60 text-left"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-2 border-t flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`הודעה ל${clientName}...`}
          rows={1}
          className="resize-none text-sm min-h-[36px] max-h-[80px] py-1.5 border-0 bg-muted/30 rounded-xl focus-visible:ring-0"
          style={{ fieldSizing: "content" } as any}
        />
        <Button
          size="icon"
          className="h-9 w-9 rounded-xl shrink-0"
          onClick={handleSend}
          disabled={!input.trim() || sendingMessage}
        >
          {sendingMessage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
