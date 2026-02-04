import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Mail, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaymentStep } from "@/hooks/useDigitalContracts";

interface PaymentRemindersProps {
  contractId: string;
  payments: PaymentStep[];
  clientEmail?: string;
  contractTitle: string;
}

interface PaymentReminder {
  paymentIndex: number;
  description: string;
  percentage: string;
  reminderDate: Date;
  sent: boolean;
}

export function PaymentReminders({
  contractId,
  payments,
  clientEmail,
  contractTitle,
}: PaymentRemindersProps) {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize reminders for each payment
    const initialReminders = payments.map((payment, index) => ({
      paymentIndex: index,
      description: payment.description,
      percentage: payment.percentage,
      reminderDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000), // Each week
      sent: false,
    }));
    setReminders(initialReminders);
  }, [payments]);

  const sendReminder = async (reminder: PaymentReminder) => {
    if (!clientEmail) {
      toast({
        title: "שגיאה",
        description: "לא נמצאה כתובת דוא\"ל ללקוח",
        variant: "destructive",
      });
      return;
    }

    // Mark as sent
    setReminders((prev) =>
      prev.map((r) =>
        r.paymentIndex === reminder.paymentIndex ? { ...r, sent: true } : r
      )
    );

    toast({
      title: "תזכורת נשלחה",
      description: `נשלחה תזכורת עבור ${reminder.description} (${reminder.percentage})`,
    });

    // Here you would integrate with the actual email sending system
    console.log("Sending reminder:", {
      to: clientEmail,
      subject: `תזכורת תשלום - ${contractTitle}`,
      body: `שלום,\n\nתזכורת לתשלום: ${reminder.description} (${reminder.percentage})\n\nבברכה`,
    });
  };

  const dismissReminder = (paymentIndex: number) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.paymentIndex === paymentIndex ? { ...r, sent: true } : r
      )
    );
  };

  const pendingReminders = reminders.filter((r) => !r.sent);

  return (
    <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-900">תזכורות תשלום</h3>
          </div>
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-400"
          >
            {pendingReminders.length} ממתינות
          </Badge>
        </div>

        {!clientEmail && (
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ יש להזין כתובת דוא"ל כדי לשלוח תזכורות
          </div>
        )}

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {reminders.map((reminder) => (
            <Card
              key={reminder.paymentIndex}
              className={`p-3 ${
                reminder.sent
                  ? "bg-gray-50 border-gray-300"
                  : "bg-white border-yellow-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {reminder.description}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {reminder.percentage}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {reminder.reminderDate.toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  {reminder.sent ? (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 border-green-300"
                    >
                      <Check className="w-3 h-3 ml-1" />
                      נשלח
                    </Badge>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => sendReminder(reminder)}
                        disabled={!clientEmail}
                        className="h-7 px-2 text-xs"
                      >
                        <Mail className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissReminder(reminder.paymentIndex)}
                        className="h-7 px-2 text-xs text-gray-500"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {reminders.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">אין תזכורות פעילות</p>
          </div>
        )}
      </div>
    </Card>
  );
}
