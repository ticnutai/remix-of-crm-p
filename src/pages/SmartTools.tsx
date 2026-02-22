/**
 * Smart Tools Page - עמוד כלים חכמים
 * התראות חכמות + צ'אט AI + מרכז שיחות
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmartAlerts } from "@/components/alerts/SmartAlerts";
import { AIChat } from "@/components/chat/AIChat";
import { ChatMessenger } from "@/components/chat/ChatMessenger";
import { Bell, Bot, MessageCircle } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { useChat } from "@/hooks/useChat";
import { Badge } from "@/components/ui/badge";

function SmartToolsInner() {
  const { totalUnread } = useChat();

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">כלים חכמים</h1>
          <p className="text-muted-foreground">
            התראות אוטומטיות, צ'אט AI ומרכז שיחות מלא
          </p>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            התראות חכמות
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <Bot className="h-4 w-4" />
            צ'אט AI
          </TabsTrigger>
          <TabsTrigger value="messenger" className="gap-2 relative">
            <MessageCircle className="h-4 w-4" />
            שיחות וידוא
            {totalUnread > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 text-[10px] rounded-full bg-primary text-primary-foreground px-1">
                {totalUnread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <SmartAlerts />
        </TabsContent>

        <TabsContent value="chat">
          <AIChat />
        </TabsContent>

        <TabsContent value="messenger">
          <ChatMessenger />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SmartTools() {
  return (
    <AppLayout>
      <SmartToolsInner />
    </AppLayout>
  );
}
