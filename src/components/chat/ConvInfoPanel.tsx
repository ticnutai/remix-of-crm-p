/**
 * ConvInfoPanel - Right sidebar with conversation details
 * Participants, Labels, Theme, Stats, Archive
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Building2,
  FileText,
  Tag,
  Palette,
  Archive,
  Star,
  Bell,
  BellOff,
  X,
  Circle,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/hooks/useChat";
import type { ChatLabel } from "@/hooks/useChatExtras";

const THEME_COLORS = [
  { color: "#6366f1", label: "סגול" },
  { color: "#3b82f6", label: "כחול" },
  { color: "#10b981", label: "ירוק" },
  { color: "#f59e0b", label: "כתום" },
  { color: "#ef4444", label: "אדום" },
  { color: "#ec4899", label: "ורוד" },
  { color: "#8b5cf6", label: "ויולט" },
  { color: "#14b8a6", label: "טיל" },
];

interface ConvInfoPanelProps {
  conversation: ChatConversation;
  onClose: () => void;
  isMuted: boolean;
  isFavorite: boolean;
  onToggleMute: () => void;
  onToggleFavorite: () => void;
  themeColor: string | null;
  allLabels: ChatLabel[];
  convLabels: ChatLabel[];
  onAddLabel: (id: string) => void;
  onRemoveLabel: (id: string) => void;
  onSetTheme: (color?: string) => void;
  onArchive?: () => void;
}

export function ConvInfoPanel({
  conversation,
  onClose,
  isMuted,
  isFavorite,
  onToggleMute,
  onToggleFavorite,
  themeColor,
  allLabels,
  convLabels,
  onAddLabel,
  onRemoveLabel,
  onSetTheme,
  onArchive,
}: ConvInfoPanelProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  useEffect(() => {
    if (!conversation.id) return;
    // Load participants
    supabase
      .from("chat_participants")
      .select("*, profiles(full_name, avatar_url, email)")
      .eq("conversation_id", conversation.id)
      .then(({ data }) => setParticipants(data || []));
    // Load stats
    supabase
      .from("chat_files")
      .select("id", { count: "exact" })
      .eq("conversation_id", conversation.id)
      .then(({ count }) => setFileCount(count || 0));
    supabase
      .from("chat_messages")
      .select("id", { count: "exact" })
      .eq("conversation_id", conversation.id)
      .eq("is_deleted", false)
      .then(({ count }) => setMsgCount(count || 0));
  }, [conversation.id]);

  const unassignedLabels = allLabels.filter(
    (l) => !convLabels.find((cl) => cl.id === l.id),
  );

  return (
    <div className="w-72 shrink-0 border-r flex flex-col bg-muted/10" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <span className="font-semibold text-sm">פרטי שיחה</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Conv identity */}
          <div className="text-center py-2">
            <div
              className={cn(
                "h-14 w-14 rounded-2xl mx-auto mb-2 flex items-center justify-center text-white text-xl shadow-md",
              )}
              style={{
                background:
                  themeColor ||
                  (conversation.type === "client"
                    ? "#3b82f6"
                    : conversation.type === "group"
                      ? "#8b5cf6"
                      : "#10b981"),
              }}
            >
              {conversation.type === "client"
                ? "🏢"
                : conversation.type === "group"
                  ? "👥"
                  : "💬"}
            </div>
            <p className="font-semibold text-sm">
              {conversation.title || conversation.client_name || "שיחה פנימית"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {conversation.type === "client"
                ? "שיחת לקוח"
                : conversation.type === "group"
                  ? "קבוצה"
                  : "שיחה פנימית"}
            </p>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onToggleFavorite}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-colors",
                isFavorite
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "hover:bg-muted",
              )}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-amber-400")} />
              {isFavorite ? "מועדף" : "הוסף למועדפים"}
            </button>
            <button
              onClick={onToggleMute}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-colors",
                isMuted
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "hover:bg-muted",
              )}
            >
              {isMuted ? (
                <BellOff className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {isMuted ? "מושתק" : "השתק"}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: FileText, label: "הודעות", value: msgCount },
              { icon: FileText, label: "קבצים", value: fileCount },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-muted/40 rounded-xl p-2.5 text-center"
              >
                <p className="text-lg font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Participants */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">
                משתתפים ({participants.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={p.profiles?.avatar_url} />
                    <AvatarFallback className="text-[10px]">
                      {(p.profiles?.full_name || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {p.profiles?.full_name || "משתמש"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {p.profiles?.email || ""}
                    </p>
                  </div>
                  {p.is_admin && (
                    <Shield className="h-3 w-3 text-primary shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Labels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">תגיות</span>
              </div>
              <button
                onClick={() => setShowLabelPicker((s) => !s)}
                className="text-[10px] text-primary hover:underline"
              >
                {showLabelPicker ? "סגור" : "+ הוסף"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {convLabels.length === 0 && !showLabelPicker && (
                <p className="text-[11px] text-muted-foreground">אין תגיות</p>
              )}
              {convLabels.map((l) => (
                <Badge
                  key={l.id}
                  variant="secondary"
                  className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/10"
                  style={{
                    borderColor: l.color + "60",
                    backgroundColor: l.color + "18",
                    color: l.color,
                  }}
                  onClick={() => onRemoveLabel(l.id)}
                >
                  {l.emoji && <span>{l.emoji}</span>}
                  {l.name}
                  <X className="h-2.5 w-2.5" />
                </Badge>
              ))}
            </div>
            {showLabelPicker && unassignedLabels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {unassignedLabels.map((l) => (
                  <Badge
                    key={l.id}
                    variant="outline"
                    className="text-[10px] gap-1 cursor-pointer hover:bg-muted"
                    style={{ borderColor: l.color + "60", color: l.color }}
                    onClick={() => {
                      onAddLabel(l.id);
                      setShowLabelPicker(false);
                    }}
                  >
                    {l.emoji && <span>{l.emoji}</span>}
                    {l.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Theme color */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">צבע נושא</span>
              </div>
              {themeColor && (
                <button
                  onClick={() => onSetTheme()}
                  className="text-[10px] text-muted-foreground hover:text-destructive"
                >
                  נקה
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {THEME_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  title={label}
                  onClick={() => onSetTheme(color)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 shrink-0",
                    themeColor === color
                      ? "border-foreground scale-110 shadow-md"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Danger zone */}
          {onArchive && (
            <button
              onClick={onArchive}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
              העבר לארכיון
            </button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
