// Client Portal - Payments & Payment Stages (Read-Only)
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  TrendingUp,
  Banknote,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import PortalNavigation from "@/components/client-portal/PortalNavigation";

interface PaymentStage {
  id: string;
  stage_name: string;
  stage_number: number;
  description: string | null;
  amount: number;
  vat_rate: number | null;
  amount_with_vat: number | null;
  is_paid: boolean | null;
  paid_date: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  notes: string | null;
}

const paymentMethodLabels: Record<string, string> = {
  cash: "מזומן",
  bank_transfer: "העברה בנקאית",
  check: "צ'ק",
  credit_card: "כרטיס אשראי",
  bit: "ביט",
  paypal: "פייפאל",
  other: "אחר",
};

export default function ClientPayments() {
  const { user, isClient, isLoading, clientId } = useAuth();
  const navigate = useNavigate();
  const [stages, setStages] = useState<PaymentStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    else if (!isLoading && user && !isClient) navigate("/");
  }, [isLoading, user, isClient, navigate]);

  const fetchPayments = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_payment_stages")
        .select("*")
        .eq("client_id", clientId)
        .order("stage_number", { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) fetchPayments();
  }, [clientId, fetchPayments]);

  const summary = useMemo(() => {
    const totalAmount = stages.reduce(
      (sum, s) => sum + (s.amount_with_vat ?? s.amount),
      0,
    );
    const paidAmount = stages
      .filter((s) => s.is_paid)
      .reduce(
        (sum, s) => sum + (s.paid_amount ?? s.amount_with_vat ?? s.amount),
        0,
      );
    const paidCount = stages.filter((s) => s.is_paid).length;
    const pendingCount = stages.filter((s) => !s.is_paid).length;
    const progressPercent =
      totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
    return {
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount,
      paidCount,
      pendingCount,
      progressPercent,
    };
  }, [stages]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(amount);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">תשלומים</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/client-portal")}
          >
            <ArrowLeft className="h-4 w-4 ml-1" />
            חזרה
          </Button>
        </div>
      </header>

      <main className="container px-4 py-4 space-y-4">
        {stages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">אין שלבי תשלום להצגה</p>
              <p className="text-xs text-muted-foreground mt-1">
                שלבי התשלום יופיעו כאן כשהצוות יוסיף אותם
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <Banknote className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">סה"כ עסקה</p>
                  <p className="text-sm font-bold mt-0.5">
                    {formatCurrency(summary.totalAmount)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-1" />
                  <p className="text-xs text-muted-foreground">שולם</p>
                  <p className="text-sm font-bold mt-0.5 text-green-600 dark:text-green-400">
                    {formatCurrency(summary.paidAmount)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Clock className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                  <p className="text-xs text-muted-foreground">יתרה</p>
                  <p className="text-sm font-bold mt-0.5 text-orange-600 dark:text-orange-400">
                    {formatCurrency(summary.remainingAmount)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-xs text-muted-foreground">התקדמות</p>
                  <p className="text-sm font-bold mt-0.5">
                    {summary.progressPercent}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">התקדמות תשלומים</span>
                  <span className="text-sm text-muted-foreground">
                    {summary.paidCount}/{stages.length} שלבים
                  </span>
                </div>
                <Progress value={summary.progressPercent} className="h-3" />
              </CardContent>
            </Card>

            {/* Payment Stages List */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                פירוט שלבי תשלום
              </h2>
              {stages.map((stage) => (
                <Card
                  key={stage.id}
                  className={`transition-all ${stage.is_paid ? "border-green-200 dark:border-green-900/30" : "border-orange-200 dark:border-orange-900/30"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                            stage.is_paid
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}
                        >
                          {stage.stage_number}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {stage.stage_name}
                          </p>
                          {stage.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {stage.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={stage.is_paid ? "default" : "outline"}
                        className={
                          stage.is_paid ? "bg-green-600 hover:bg-green-700" : ""
                        }
                      >
                        {stage.is_paid ? "שולם" : "ממתין"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-muted-foreground">
                          סכום (ללא מע"מ)
                        </span>
                        <p className="font-semibold mt-0.5">
                          {formatCurrency(stage.amount)}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-muted-foreground">
                          סכום כולל מע"מ
                        </span>
                        <p className="font-semibold mt-0.5">
                          {formatCurrency(
                            stage.amount_with_vat ?? stage.amount,
                          )}
                        </p>
                      </div>
                    </div>

                    {stage.is_paid && (
                      <div className="mt-3 pt-3 border-t border-dashed text-xs space-y-1">
                        {stage.paid_date && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              תאריך תשלום
                            </span>
                            <span className="font-medium">
                              {format(new Date(stage.paid_date), "dd/MM/yyyy", {
                                locale: he,
                              })}
                            </span>
                          </div>
                        )}
                        {stage.payment_method && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              אמצעי תשלום
                            </span>
                            <span className="font-medium">
                              {paymentMethodLabels[stage.payment_method] ||
                                stage.payment_method}
                            </span>
                          </div>
                        )}
                        {stage.paid_amount != null && stage.paid_amount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              סכום ששולם
                            </span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {formatCurrency(stage.paid_amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {stage.notes && (
                      <p className="mt-2 text-xs text-muted-foreground italic border-t pt-2">
                        {stage.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <PortalNavigation />
    </div>
  );
}
