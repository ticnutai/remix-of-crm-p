// Gmail Components - Quick Actions and Smart Suggestions
import React from "react";
import { GmailMessage } from "@/hooks/useGmailIntegration";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CheckSquare,
  Building2,
  Link2,
  Sparkles,
  Clock,
  AlertCircle,
  FileText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Export ComposeEmailDialog
export { ComposeEmailDialog } from "./ComposeEmailDialog";

// Export EmailThreadChat
export { EmailThreadChat } from "./EmailThreadChat";

// Export EmailSenderChatView
export { EmailSenderChatView } from "./EmailSenderChatView";

// Export ClientEmailsDialog
export { ClientEmailsDialog } from "./ClientEmailsDialog";

// Export EmailFoldersPanel
export { EmailFoldersPanel, QuickClassifyButton } from "./EmailFoldersPanel";

// Export Date Navigation components
export {
  EmailDateNavigator,
  FloatingDateIndicator,
  LoadMoreTrigger,
  DateSeparator,
  useScrollDateTracker,
} from "./EmailDateNavigator";

// Export Gmail page sub-components
export { GmailSidebar } from "./GmailSidebar";
export { LabelManagerDialog } from "./LabelManagerDialog";
export { EmailReminderDialog } from "./EmailReminderDialog";
export { EmailNoteDialog } from "./EmailNoteDialog";
export { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
export { UndoSendBar } from "./UndoSendBar";
export { BulkActionsBar } from "./BulkActionsBar";
export { EmailListItem } from "./EmailListItem";
export { EmailDetailView } from "./EmailDetailView";
export { AdvancedSearchPanel } from "./AdvancedSearchPanel";
export { GmailContactsPanel } from "./GmailContactsPanel";

// Export shared types and constants
export {
  type Client,
  type EmailLabel,
  type Priority,
  DEFAULT_LABELS,
  PRIORITY_CONFIG,
} from "./gmail-types";

// Import Client type for local use
import { Client } from "./gmail-types";

// Props interfaces
interface EmailQuickActionsProps {
  email: GmailMessage;
  clients: Client[];
  linkedClientId: string | null;
  autoDetectedClient: Client | null | undefined;
  onCreateTask: (email: GmailMessage, clientId?: string) => void;
  onCreateMeeting: (email: GmailMessage, clientId?: string) => void;
  onCreateReminder: (email: GmailMessage) => void;
  onLinkClient: (emailId: string, clientId: string) => Promise<void>;
}

interface EmailSmartSuggestionsProps {
  email: GmailMessage;
  clients: Client[];
  onCreateTask: (email: GmailMessage, clientId?: string) => void;
  onCreateMeeting: (email: GmailMessage, clientId?: string) => void;
  onLinkClient: (emailId: string, clientId: string) => Promise<void>;
}

// Email Quick Actions Component
export const EmailQuickActions = ({
  email,
  clients,
  linkedClientId,
  autoDetectedClient,
  onCreateTask,
  onCreateMeeting,
  onCreateReminder,
  onLinkClient,
}: EmailQuickActionsProps) => {
  const [selectedClientId, setSelectedClientId] = React.useState<string>(
    linkedClientId || autoDetectedClient?.id || "",
  );

  const activeClient = React.useMemo(() => {
    if (selectedClientId) {
      return clients.find((c) => c.id === selectedClientId);
    }
    return autoDetectedClient || null;
  }, [selectedClientId, clients, autoDetectedClient]);

  const handleLinkClient = async () => {
    if (selectedClientId && selectedClientId !== linkedClientId) {
      await onLinkClient(email.id, selectedClientId);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          פעולות מהירות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Client Linking */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            קישור ללקוח
          </label>
          <div className="flex gap-2">
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="בחר לקוח..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      <span>{client.name}</span>
                      {client.email && (
                        <span className="text-xs text-muted-foreground">
                          ({client.email})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClientId && selectedClientId !== linkedClientId && (
              <Button size="sm" onClick={handleLinkClient}>
                <Link2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {autoDetectedClient && !linkedClientId && (
            <Badge variant="outline" className="text-xs gap-1">
              <AlertCircle className="h-3 w-3" />
              זוהה אוטומטית: {autoDetectedClient.name}
            </Badge>
          )}
        </div>

        {/* Quick Actions Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-3"
            onClick={() => onCreateTask(email, activeClient?.id)}
          >
            <CheckSquare className="h-5 w-5 mb-1 text-green-600" />
            <span className="text-xs">משימה</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-3"
            onClick={() => onCreateMeeting(email, activeClient?.id)}
          >
            <Calendar className="h-5 w-5 mb-1 text-blue-600" />
            <span className="text-xs">פגישה</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-3"
            onClick={() => onCreateReminder(email)}
          >
            <Clock className="h-5 w-5 mb-1 text-orange-600" />
            <span className="text-xs">תזכורת</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Smart Suggestions Component
export const EmailSmartSuggestions = ({
  email,
  clients,
  onCreateTask,
  onCreateMeeting,
  onLinkClient,
}: EmailSmartSuggestionsProps) => {
  // Analyze email content for smart suggestions
  const suggestions = React.useMemo(() => {
    const content = (email.subject + " " + email.snippet).toLowerCase();
    const results: Array<{
      type: "task" | "meeting" | "client";
      title: string;
      description: string;
      icon: React.ReactNode;
      action: () => void;
      priority: number;
    }> = [];

    // Keywords for different suggestion types
    const taskKeywords = [
      "משימה",
      "לעשות",
      "להכין",
      "לבדוק",
      "לשלוח",
      "task",
      "todo",
    ];
    const meetingKeywords = [
      "פגישה",
      "מפגש",
      "נפגש",
      "meeting",
      "zoom",
      "teams",
    ];
    const urgentKeywords = ["דחוף", "urgent", "asap", "חשוב", "important"];
    const questionKeywords = ["?", "שאלה", "האם", "מה", "איך", "למה"];

    // Check for task indicators
    if (taskKeywords.some((kw) => content.includes(kw))) {
      const isUrgent = urgentKeywords.some((kw) => content.includes(kw));
      results.push({
        type: "task",
        title: "צור משימה ממייל זה",
        description: isUrgent
          ? "נראה שזו משימה דחופה"
          : "נמצאו אינדיקטורים למשימה",
        icon: <CheckSquare className="h-4 w-4 text-green-600" />,
        action: () => onCreateTask(email),
        priority: isUrgent ? 1 : 2,
      });
    }

    // Check for meeting indicators
    if (meetingKeywords.some((kw) => content.includes(kw))) {
      results.push({
        type: "meeting",
        title: "קבע פגישה",
        description: "המייל מזכיר פגישה או מפגש",
        icon: <Calendar className="h-4 w-4 text-blue-600" />,
        action: () => onCreateMeeting(email),
        priority: 1,
      });
    }

    // Check if sender matches any client
    const matchedClient = clients.find(
      (c) =>
        c.email && email.from.toLowerCase().includes(c.email.toLowerCase()),
    );
    if (matchedClient) {
      results.push({
        type: "client",
        title: `קשר ל${matchedClient.name}`,
        description: "כתובת המייל תואמת ללקוח במערכת",
        icon: <Building2 className="h-4 w-4 text-purple-600" />,
        action: () => onLinkClient(email.id, matchedClient.id),
        priority: 0,
      });
    }

    // Check for questions
    if (questionKeywords.some((kw) => content.includes(kw))) {
      results.push({
        type: "task",
        title: "תשובה נדרשת",
        description: "המייל כולל שאלות שדורשות תשובה",
        icon: <AlertCircle className="h-4 w-4 text-orange-600" />,
        action: () => onCreateTask(email),
        priority: 1,
      });
    }

    return results.sort((a, b) => a.priority - b.priority);
  }, [email, clients, onCreateTask, onCreateMeeting, onLinkClient]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          הצעות חכמות
        </CardTitle>
        <CardDescription className="text-xs">על סמך תוכן המייל</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <Button
            key={idx}
            variant="ghost"
            className="w-full justify-start h-auto py-3 px-3 text-right"
            onClick={suggestion.action}
          >
            <div className="flex items-start gap-3 w-full">
              {suggestion.icon}
              <div className="flex-1 text-right">
                <div className="font-medium text-sm">{suggestion.title}</div>
                <div className="text-xs text-muted-foreground">
                  {suggestion.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
