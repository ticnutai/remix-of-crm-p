/**
 * Smart Tools Page - עמוד כלים חכמים
 * התראות חכמות + צ'אט AI
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartAlerts } from '@/components/alerts/SmartAlerts';
import { AIChat } from '@/components/chat/AIChat';
import { Bell, Bot } from 'lucide-react';
import { AppLayout } from '@/components/layout';

export default function SmartTools() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">כלים חכמים</h1>
            <p className="text-muted-foreground">
              התראות אוטומטיות וצ'אט AI לשליפת מידע מהיר
            </p>
          </div>
        </div>

        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              התראות חכמות
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <Bot className="h-4 w-4" />
              צ'אט AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <SmartAlerts />
          </TabsContent>

          <TabsContent value="chat">
            <AIChat />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
