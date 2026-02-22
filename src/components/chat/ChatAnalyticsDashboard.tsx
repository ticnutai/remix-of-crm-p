import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart2,
  MessageSquare,
  Clock,
  Users,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface AnalyticsRow {
  conversation_id: string;
  title: string | null;
  message_count: number;
  participant_count: number;
  avg_response_minutes: number | null;
  file_count: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color = "text-primary",
}: StatCardProps) {
  return (
    <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
      <div className={`mt-0.5 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-2xl font-bold leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

interface ChatAnalyticsDashboardProps {
  open: boolean;
  onClose: () => void;
}

export function ChatAnalyticsDashboard({
  open,
  onClose,
}: ChatAnalyticsDashboardProps) {
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("chat_analytics" as any)
      .select("*")
      .order("message_count", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setRows((data || []) as AnalyticsRow[]);
        setLoading(false);
      });
  }, [open]);

  const totals = rows.reduce(
    (acc, r) => ({
      messages: acc.messages + (r.message_count || 0),
      files: acc.files + (r.file_count || 0),
      conversations: acc.conversations + 1,
      avgResp: acc.avgResp + (r.avg_response_minutes || 0),
      participants: acc.participants + (r.participant_count || 0),
    }),
    { messages: 0, files: 0, conversations: 0, avgResp: 0, participants: 0 },
  );

  const avgResp =
    totals.conversations > 0
      ? Math.round(totals.avgResp / totals.conversations)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 size={18} />
            אנליטיקס צ&apos;אט
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <StatCard
                icon={<MessageSquare size={20} />}
                label="סה״כ הודעות"
                value={totals.messages.toLocaleString()}
              />
              <StatCard
                icon={<Users size={20} />}
                label="שיחות פעילות"
                value={totals.conversations}
              />
              <StatCard
                icon={<Clock size={20} />}
                label="זמן תגובה ממוצע"
                value={avgResp > 0 ? `${avgResp} דק'` : "N/A"}
                color="text-amber-500"
              />
              <StatCard
                icon={<FileText size={20} />}
                label="קבצים שותפו"
                value={totals.files}
              />
              <StatCard
                icon={<TrendingUp size={20} />}
                label="משתתפים"
                value={totals.participants}
              />
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">שיחות לפי פעילות</h3>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {rows.map((r, i) => (
                  <div
                    key={r.conversation_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50"
                  >
                    <span className="text-xs text-muted-foreground w-4 text-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.title || "ללא שם"}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{r.message_count} הודעות</span>
                        <span>{r.participant_count} משתתפים</span>
                        {r.file_count > 0 && <span>{r.file_count} קבצים</span>}
                        {r.avg_response_minutes && (
                          <span>
                            ~{Math.round(r.avg_response_minutes)} דק&apos; תגובה
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${Math.min(100, (r.message_count / (rows[0]?.message_count || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {rows.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    אין נתונים עדיין
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
