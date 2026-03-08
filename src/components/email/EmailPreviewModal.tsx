import React, { useState } from "react";
import DOMPurify from "dompurify";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Eye, Send, Monitor, Smartphone, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  htmlContent: string;
  subject: string;
  variables?: Record<string, any>;
  onSendTest?: (email: string) => Promise<void>;
}

export function EmailPreviewModal({
  open,
  onOpenChange,
  htmlContent,
  subject,
  variables = {},
  onSendTest,
}: EmailPreviewModalProps) {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // Replace variables in content
  const renderContent = () => {
    let rendered = htmlContent;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      rendered = rendered.replace(regex, String(value));
    });
    return rendered;
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({
        title: "שגיאה",
        description: "אנא הזן כתובת אימייל",
        variant: "destructive",
      });
      return;
    }

    if (!onSendTest) return;

    setSending(true);
    try {
      await onSendTest(testEmail);
      toast({
        title: "נשלח בהצלחה",
        description: `אימייל הבדיקה נשלח ל-${testEmail}`,
      });
      setTestEmail("");
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לשלוח את האימייל",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>תצוגה מקדימה</DialogTitle>
              <DialogDescription className="mt-1">{subject}</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "desktop" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("desktop")}
                title="תצוגת דסקטופ"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "mobile" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("mobile")}
                title="תצוגת מובייל"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 ml-2" />
              תצוגה מקדימה
            </TabsTrigger>
            <TabsTrigger value="test">
              <Send className="h-4 w-4 ml-2" />
              שלח בדיקה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            {/* Variables Display */}
            {Object.keys(variables).length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/50">
                <span className="text-sm font-medium">משתנים:</span>
                {Object.entries(variables).map(([key, value]) => (
                  <Badge key={key} variant="secondary">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            )}

            {/* Email Preview */}
            <div className="border rounded-lg bg-white">
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">נושא:</span>
                  <span>{subject}</span>
                </div>
              </div>
              <ScrollArea
                className={`${
                  viewMode === "mobile" ? "max-w-[375px] mx-auto" : ""
                } h-[500px]`}
              >
                <div
                  className="p-4"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(renderContent()),
                  }}
                />
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4 p-6 border rounded-lg">
              <div className="space-y-2">
                <Label>כתובת אימייל לבדיקה</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendTest()}
                />
                <p className="text-sm text-muted-foreground">
                  האימייל יישלח עם כל המשתנים והעיצוב המוגדר
                </p>
              </div>

              <Button
                onClick={handleSendTest}
                disabled={!testEmail || sending || !onSendTest}
                className="w-full"
              >
                {sending ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full ml-2" />
                    שולח...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-2" />
                    שלח אימייל בדיקה
                  </>
                )}
              </Button>
            </div>

            {/* Info box */}
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>💡 טיפ:</strong> בדוק את האימייל במגוון לקוחות אימייל
                (Gmail, Outlook וכו') כדי לוודא שהוא נראה טוב בכולם.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
