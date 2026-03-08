import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Mail, RefreshCw, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RateLimitInfo {
  allowed: boolean;
  hourly_limit: number;
  hourly_used: number;
  hourly_remaining: number;
  daily_limit: number;
  daily_used: number;
  daily_remaining: number;
  reset_hourly: string;
  reset_daily: string;
}

export function RateLimitMonitor() {
  const { user, profile, roles } = useAuth();
  const { toast } = useToast();
  const [rateLimits, setRateLimits] = useState<RateLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRateLimits();
      // Refresh every minute
      const interval = setInterval(fetchRateLimits, 60000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchRateLimits = async () => {
    try {
      const userRole = roles?.[0] || "employee";

      const { data, error } = await supabase.rpc(
        "check_email_rate_limit" as any,
        {
          p_user_id: user?.id,
          p_user_role: userRole,
        },
      );

      if (error) throw error;
      setRateLimits(data as RateLimitInfo);
    } catch (error: any) {
      console.error("Error fetching rate limits:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg"></div>;
  }

  if (!rateLimits) return null;

  const hourlyPercent =
    (rateLimits.hourly_used / rateLimits.hourly_limit) * 100;
  const dailyPercent = (rateLimits.daily_used / rateLimits.daily_limit) * 100;

  const isNearHourlyLimit = hourlyPercent >= 80;
  const isNearDailyLimit = dailyPercent >= 80;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                מגבלות שליחת אימיילים
              </CardTitle>
              <CardDescription>מעקב אחרי השימוש שלך</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchRateLimits}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hourly Limit */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">מגבלה שעתית</span>
              <Badge variant={isNearHourlyLimit ? "destructive" : "secondary"}>
                {rateLimits.hourly_used} / {rateLimits.hourly_limit}
              </Badge>
            </div>
            <Progress
              value={hourlyPercent}
              className={isNearHourlyLimit ? "[&>div]:bg-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              נותרו {rateLimits.hourly_remaining} אימיילים • מתחדש בעוד{" "}
              {new Date(rateLimits.reset_hourly).getMinutes() -
                new Date().getMinutes()}{" "}
              דקות
            </p>
          </div>

          {/* Daily Limit */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">מגבלה יומית</span>
              <Badge variant={isNearDailyLimit ? "destructive" : "secondary"}>
                {rateLimits.daily_used} / {rateLimits.daily_limit}
              </Badge>
            </div>
            <Progress
              value={dailyPercent}
              className={isNearDailyLimit ? "[&>div]:bg-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              נותרו {rateLimits.daily_remaining} אימיילים היום
            </p>
          </div>

          {/* Warning */}
          {(isNearHourlyLimit || isNearDailyLimit) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>התקרבת למגבלה!</AlertTitle>
              <AlertDescription>
                {isNearHourlyLimit && "השתמשת ביותר מ-80% מהמגבלה השעתית. "}
                {isNearDailyLimit && "השתמשת ביותר מ-80% מהמגבלה היומית. "}
                אימיילים חדשים עלולים להיכשל.
              </AlertDescription>
            </Alert>
          )}

          {/* Upgrade hint for non-admins */}
          {roles?.[0] !== "admin" && dailyPercent > 50 && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">זקוק ליותר אימיילים?</p>
                  <p className="text-xs text-muted-foreground">
                    פנה למנהל המערכת לשדרוג החשבון שלך ולהגדלת המגבלות.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
