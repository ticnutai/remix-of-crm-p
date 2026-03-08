import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGmailIntegration } from "@/hooks/useGmailIntegration";

interface ContractEmailSenderProps {
  contractId: string;
  contractTitle: string;
  clientEmail?: string;
  onEmailChange: (contractId: string, field: keyof any, value: string) => void;
  onStatusChange: (contractId: string, status: "draft" | "sent" | "approved" | "in_progress" | "completed" | "cancelled") => void;
}

export function ContractEmailSender({
  contractId,
  contractTitle,
  clientEmail = "",
  onEmailChange,
  onStatusChange,
}: ContractEmailSenderProps) {
  const [emailSubject, setEmailSubject] = useState(`הצעת מחיר - ${contractTitle}`);
  const [emailBody, setEmailBody] = useState(
    `שלום רב,\n\nמצורפת הצעת מחיר עבור "${contractTitle}".\n\nנשמח לקבל את המשובים שלך.\n\nבברכה,`
  );
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { sendEmail } = useGmailIntegration();

  const handleSendEmail = async () => {
    if (!clientEmail) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת דוא\"ל של הלקוח",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const success = await sendEmail({
        to: clientEmail,
        subject: emailSubject,
        body: emailBody,
      });

      if (success) {
        setSent(true);
        onStatusChange(contractId, "sent");
        toast({
          title: "הודעה נשלחה בהצלחה",
          description: `הצעת המחיר נשלחה ל-${clientEmail}`,
        });
        setTimeout(() => setSent(false), 3000);
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      toast({
        title: "שגיאה בשליחת הודעה",
        description: "לא הצלחנו לשלוח את ההודעה. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">שליחת הצעה בדוא"ל</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-email">דוא"ל לקוח</Label>
          <Input
            id="client-email"
            type="email"
            placeholder="client@example.com"
            value={clientEmail}
            onChange={(e) => onEmailChange(contractId, "clientEmail", e.target.value)}
            className="text-left"
            dir="ltr"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-subject">נושא</Label>
          <Input
            id="email-subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-body">תוכן ההודעה</Label>
          <Textarea
            id="email-body"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleSendEmail}
          disabled={isSending || !clientEmail || sent}
          className={`w-full ${
            sent
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSending ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              שולח...
            </>
          ) : sent ? (
            <>
              <CheckCircle className="ml-2 h-4 w-4" />
              נשלח בהצלחה!
            </>
          ) : (
            <>
              <Send className="ml-2 h-4 w-4" />
              שלח הצעה
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
