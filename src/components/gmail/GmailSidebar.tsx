// Gmail Sidebar - Navigation, labels, priority filters, client filters, folders
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Inbox,
  Star,
  Send,
  Bell,
  FileText,
  Archive,
  Trash2,
  PenSquare,
  Settings,
  Tag,
  Building2,
  Users,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GmailMessage } from "@/hooks/useGmailIntegration";
import { EmailFoldersPanel } from "./EmailFoldersPanel";
import { Client, EmailLabel, Priority, PRIORITY_CONFIG } from "./gmail-types";

interface GmailSidebarProps {
  activeTab: string;
  onSetActiveTab: (tab: string) => void;
  filterByLabel: string | null;
  onSetFilterByLabel: (label: string | null) => void;
  filterByPriority: Priority | null;
  onSetFilterByPriority: (p: Priority | null) => void;
  filterByClient: string | null;
  onSetFilterByClient: (clientId: string | null) => void;
  customLabels: EmailLabel[];
  emailLabels: Record<string, string[]>;
  emailPriority: Record<string, Priority>;
  remindersForToday: number;
  unreadCount: number;
  clients: Client[];
  messages: GmailMessage[];
  autoTagEnabled: boolean;
  onSetAutoTagEnabled: (enabled: boolean) => void;
  onShowLabelManager: () => void;
  onCompose: () => void;
  onOpenClientEmails: () => void;
  onBatchAutoClassify: () => void;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  selectedEmail: GmailMessage | null;
  onAddEmailToFolder: (email: GmailMessage, folderId: string) => void;
  getClientForMessage: (msg: GmailMessage) => Client | null;
}

export function GmailSidebar({
  activeTab,
  onSetActiveTab,
  filterByLabel,
  onSetFilterByLabel,
  filterByPriority,
  onSetFilterByPriority,
  filterByClient,
  onSetFilterByClient,
  customLabels,
  emailLabels,
  emailPriority,
  remindersForToday,
  unreadCount,
  clients,
  messages,
  autoTagEnabled,
  onSetAutoTagEnabled,
  onShowLabelManager,
  onCompose,
  onOpenClientEmails,
  onBatchAutoClassify,
  selectedFolderId,
  onSelectFolder,
  selectedEmail,
  onAddEmailToFolder,
  getClientForMessage,
}: GmailSidebarProps) {
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(true);
  const [isPriorityExpanded, setIsPriorityExpanded] = useState(true);
  const [isClientsExpanded, setIsClientsExpanded] = useState(true);

  return (
    <Card
      className="lg:col-span-3 overflow-hidden"
      style={{ maxHeight: "calc(100vh - 160px)" }}
    >
      <ScrollArea className="h-[calc(100vh-180px)]">
        <CardContent className="p-4 text-right">
          <Button onClick={onCompose} className="w-full mb-4" size="lg">
            <PenSquare className="h-4 w-4 ml-2" />
            כתיבת הודעה
          </Button>

          <nav className="space-y-1">
            <Button
              variant={activeTab === "inbox" ? "secondary" : "ghost"}
              className="w-full justify-start text-right"
              onClick={() => {
                onSetActiveTab("inbox");
                onSetFilterByLabel(null);
              }}
            >
              <Inbox className="h-4 w-4 ml-2" />
              דואר נכנס
              {unreadCount > 0 && (
                <Badge variant="secondary" className="mr-auto">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === "starred" ? "secondary" : "ghost"}
              className="w-full justify-start text-right"
              onClick={() => {
                onSetActiveTab("starred");
                onSetFilterByLabel(null);
              }}
            >
              <Star className="h-4 w-4 ml-2" />
              מסומנים בכוכב
            </Button>
            <Button
              variant={activeTab === "sent" ? "secondary" : "ghost"}
              className="w-full justify-start text-right"
              onClick={() => {
                onSetActiveTab("sent");
                onSetFilterByLabel(null);
              }}
            >
              <Send className="h-4 w-4 ml-2" />
              נשלחו
            </Button>

            {/* Reminders */}
            <Button
              variant={activeTab === "reminders" ? "secondary" : "ghost"}
              className="w-full justify-start text-right"
              onClick={() => onSetActiveTab("reminders")}
            >
              <Bell className="h-4 w-4 ml-2 text-orange-500" />
              תזכורות
              {remindersForToday > 0 && (
                <Badge variant="destructive" className="mr-auto">
                  {remindersForToday}
                </Badge>
              )}
            </Button>

            <Separator className="my-2" />

            <Button
              variant={activeTab === "drafts" ? "secondary" : "ghost"}
              className="w-full justify-start text-right"
              onClick={() => {
                onSetActiveTab("drafts");
                onSetFilterByLabel(null);
              }}
            >
              <FileText className="h-4 w-4 ml-2 text-muted-foreground" />
              טיוטות
            </Button>
            <Button
              variant={activeTab === "spam" ? "secondary" : "ghost"}
              className="w-full justify-start text-right"
              onClick={() => {
                onSetActiveTab("spam");
                onSetFilterByLabel(null);
              }}
            >
              <ShieldAlert className="h-4 w-4 ml-2 text-yellow-600" />
              ספאם
            </Button>
            <Button
              variant={activeTab === "trash" ? "secondary" : "ghost"}
              className="w-full justify-start text-right"
              onClick={() => {
                onSetActiveTab("trash");
                onSetFilterByLabel(null);
              }}
            >
              <Trash2 className="h-4 w-4 ml-2 text-red-500" />
              אשפה
            </Button>
            <Button
              variant={activeTab === "archive" ? "secondary" : "ghost"}
              className="w-full justify-start text-right"
              onClick={() => {
                onSetActiveTab("archive");
                onSetFilterByLabel(null);
              }}
            >
              <Archive className="h-4 w-4 ml-2 text-blue-500" />
              ארכיון
            </Button>
          </nav>

          {/* Email Folders Panel - RIGHT AFTER NAVIGATION */}
          <Separator className="my-4" />
          <EmailFoldersPanel
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            currentEmail={selectedEmail}
            onAddEmailToFolder={onAddEmailToFolder}
          />

          <Separator className="my-4" />

          {/* Labels Section */}
          <Collapsible
            open={isLabelsExpanded}
            onOpenChange={setIsLabelsExpanded}
          >
            <div className="flex items-center justify-between w-full py-1 text-sm font-medium">
              <CollapsibleTrigger className="flex items-center gap-2 flex-1 cursor-pointer">
                <Tag className="h-3.5 w-3.5" />
                תוויות ({customLabels.length})
              </CollapsibleTrigger>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowLabelManager();
                  }}
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <CollapsibleTrigger className="cursor-pointer">
                  {isLabelsExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
              </div>
            </div>
            <CollapsibleContent className="space-y-1 mt-1">
              {customLabels.map((label) => {
                const count = Object.values(emailLabels).filter((labels) =>
                  labels.includes(label.id),
                ).length;
                return (
                  <Button
                    key={label.id}
                    variant={filterByLabel === label.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-right h-8"
                    onClick={() =>
                      onSetFilterByLabel(
                        filterByLabel === label.id ? null : label.id,
                      )
                    }
                  >
                    <div
                      className={cn("h-3 w-3 rounded-full ml-2", label.color)}
                    />
                    {label.name}
                    {count > 0 && (
                      <span className="mr-auto text-xs text-muted-foreground">
                        {count}
                      </span>
                    )}
                  </Button>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-4" />

          {/* Priority Filter */}
          <Collapsible
            open={isPriorityExpanded}
            onOpenChange={setIsPriorityExpanded}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-sm font-medium">
              <span className="flex items-center gap-2">סינון לפי עדיפות</span>
              {isPriorityExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {Object.entries(PRIORITY_CONFIG)
                .filter(([key]) => key !== "none")
                .map(([key, config]) => {
                  const count = Object.values(emailPriority).filter(
                    (p) => p === key,
                  ).length;
                  return (
                    <Button
                      key={key}
                      variant={filterByPriority === key ? "secondary" : "ghost"}
                      className="w-full justify-start text-right h-8"
                      onClick={() =>
                        onSetFilterByPriority(
                          filterByPriority === key ? null : (key as Priority),
                        )
                      }
                    >
                      {config.icon}
                      <span className="mr-2">{config.label}</span>
                      {count > 0 && (
                        <span className="mr-auto text-xs text-muted-foreground">
                          {count}
                        </span>
                      )}
                    </Button>
                  );
                })}
            </CollapsibleContent>
          </Collapsible>

          {/* Clients Filter */}
          {clients.length > 0 && (
            <>
              <Separator className="my-4" />
              <Collapsible
                open={isClientsExpanded}
                onOpenChange={setIsClientsExpanded}
              >
                <div className="flex items-center justify-between w-full py-1 text-sm font-medium">
                  <CollapsibleTrigger className="flex items-center gap-2 flex-1 cursor-pointer">
                    <Building2 className="h-3.5 w-3.5" />
                    סינון לפי לקוח
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetAutoTagEnabled(!autoTagEnabled);
                            }}
                          >
                            {autoTagEnabled ? (
                              <Tag className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Tag className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          {autoTagEnabled
                            ? "תיוג אוטומטי פעיל"
                            : "תיוג אוטומטי כבוי"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <CollapsibleTrigger className="cursor-pointer">
                      {isClientsExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent className="space-y-1 mt-1">
                  <ScrollArea className="h-32">
                    {clients.slice(0, 10).map((client) => {
                      const count = messages.filter((msg) => {
                        const c = getClientForMessage(msg);
                        return c && c.id === client.id;
                      }).length;
                      return (
                        <Button
                          key={client.id}
                          variant={
                            filterByClient === client.id ? "secondary" : "ghost"
                          }
                          className="w-full justify-start text-right h-8"
                          onClick={() =>
                            onSetFilterByClient(
                              filterByClient === client.id ? null : client.id,
                            )
                          }
                        >
                          <Building2 className="h-4 w-4 text-blue-500" />
                          <span className="mr-2 truncate">{client.name}</span>
                          {count > 0 && (
                            <span className="mr-auto text-xs text-muted-foreground">
                              {count}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </ScrollArea>

                  {/* Button to open client emails dialog */}
                  <Button
                    variant="outline"
                    className="w-full mt-2 text-sm"
                    onClick={onOpenClientEmails}
                  >
                    <Users className="h-4 w-4 ml-2" />
                    זיהוי מיילים לפי לקוחות
                  </Button>

                  {/* Auto-classify button */}
                  <Button
                    variant="outline"
                    className="w-full mt-1 text-sm"
                    onClick={onBatchAutoClassify}
                  >
                    <Sparkles className="h-4 w-4 ml-2" />
                    סיווג אוטומטי לתיקיות
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
