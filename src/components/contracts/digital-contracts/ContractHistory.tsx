import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, User, Calendar, FileEdit, Send, CheckCircle } from "lucide-react";

interface HistoryEvent {
  id: string;
  type: "created" | "updated" | "status_changed" | "sent" | "signed";
  description: string;
  timestamp: string;
  user?: string;
}

interface ContractHistoryProps {
  contractId: string;
  createdAt?: string;
  updatedAt?: string;
  sentAt?: string;
  approvedAt?: string;
  signedAt?: string;
  signedBy?: string;
}

export function ContractHistory({
  contractId,
  createdAt,
  updatedAt,
  sentAt,
  approvedAt,
  signedAt,
  signedBy,
}: ContractHistoryProps) {
  const events: HistoryEvent[] = [];

  if (createdAt) {
    events.push({
      id: "created",
      type: "created",
      description: "החוזה נוצר",
      timestamp: createdAt,
    });
  }

  if (sentAt) {
    events.push({
      id: "sent",
      type: "sent",
      description: "החוזה נשלח ללקוח",
      timestamp: sentAt,
    });
  }

  if (approvedAt) {
    events.push({
      id: "approved",
      type: "status_changed",
      description: "החוזה אושר",
      timestamp: approvedAt,
    });
  }

  if (signedAt) {
    events.push({
      id: "signed",
      type: "signed",
      description: `החוזה נחתם${signedBy ? ` על ידי ${signedBy}` : ""}`,
      timestamp: signedAt,
      user: signedBy,
    });
  }

  if (updatedAt && updatedAt !== createdAt) {
    events.push({
      id: "updated",
      type: "updated",
      description: "החוזה עודכן",
      timestamp: updatedAt,
    });
  }

  // Sort by timestamp (newest first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getEventIcon = (type: HistoryEvent["type"]) => {
    switch (type) {
      case "created":
        return <FileEdit className="w-4 h-4" />;
      case "sent":
        return <Send className="w-4 h-4" />;
      case "signed":
        return <CheckCircle className="w-4 h-4" />;
      case "status_changed":
        return <CheckCircle className="w-4 h-4" />;
      case "updated":
        return <FileEdit className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: HistoryEvent["type"]) => {
    switch (type) {
      case "created":
        return "text-blue-600 bg-blue-100";
      case "sent":
        return "text-cyan-600 bg-cyan-100";
      case "signed":
        return "text-green-600 bg-green-100";
      case "status_changed":
        return "text-purple-600 bg-purple-100";
      case "updated":
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-200">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">היסטוריית החוזה</h3>
        </div>

        <ScrollArea className="h-64 pr-4">
          <div className="space-y-3">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="relative flex gap-3 pb-3"
                style={{
                  borderBottom:
                    index < events.length - 1 ? "1px solid #e2e8f0" : "none",
                }}
              >
                {/* Timeline connector */}
                {index < events.length - 1 && (
                  <div className="absolute right-[15px] top-8 bottom-0 w-0.5 bg-slate-200" />
                )}

                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(
                    event.type
                  )}`}
                >
                  {getEventIcon(event.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {event.description}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs flex-shrink-0 bg-white"
                    >
                      {formatDate(event.timestamp)}
                    </Badge>
                  </div>
                  {event.user && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                      <User className="w-3 h-3" />
                      <span>{event.user}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {events.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין היסטוריה זמינה</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </Card>
  );
}
