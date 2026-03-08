// Reports Page - tenarch CRM Pro
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  FileSpreadsheet,
  Clock,
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
  Download,
  Loader2,
} from "lucide-react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { he } from "date-fns/locale";

interface TimeEntry {
  id: string;
  start_time: string;
  duration_minutes: number | null;
  project_id: string | null;
  client_id: string | null;
  user_id: string;
}

interface Project {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
}

const COLORS = [
  "hsl(220, 60%, 25%)",
  "hsl(45, 80%, 45%)",
  "hsl(0, 0%, 50%)",
  "hsl(220, 60%, 45%)",
  "hsl(45, 80%, 65%)",
  "hsl(180, 50%, 40%)",
];

type DateRange = "week" | "month" | "quarter" | "year";

const Reports = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    return (localStorage.getItem("reports-date-range") as DateRange) || "month";
  });
  const [loading, setLoading] = useState(true);

  // Save date range to localStorage
  useEffect(() => {
    localStorage.setItem("reports-date-range", dateRange);
  }, [dateRange]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, dateRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "week":
        return {
          start: startOfWeek(now, { locale: he }),
          end: endOfWeek(now, { locale: he }),
        };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "quarter":
        return { start: subDays(now, 90), end: now };
      case "year":
        return { start: subDays(now, 365), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    const [entriesRes, projectsRes, clientsRes, profilesRes] =
      await Promise.all([
        supabase
          .from("time_entries")
          .select(
            "id, start_time, duration_minutes, project_id, client_id, user_id",
          )
          .gte("start_time", start.toISOString())
          .lte("start_time", end.toISOString()),
        supabase.from("projects").select("id, name"),
        supabase.from("clients").select("id, name"),
        supabase.from("profiles").select("id, full_name"),
      ]);

    if (entriesRes.data) setTimeEntries(entriesRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);

    setLoading(false);
  };

  const totalHours = Math.round(
    timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60,
  );

  const avgDailyHours = Math.round(totalHours / 30);

  // Data by project
  const projectData = projects
    .map((project) => {
      const minutes = timeEntries
        .filter((e) => e.project_id === project.id)
        .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      return { name: project.name, hours: Math.round(minutes / 60), minutes };
    })
    .filter((p) => p.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 6);

  // Data by client
  const clientData = clients
    .map((client) => {
      const minutes = timeEntries
        .filter((e) => e.client_id === client.id)
        .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      return { name: client.name, hours: Math.round(minutes / 60), minutes };
    })
    .filter((c) => c.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 6);

  // Data by employee
  const employeeData = profiles
    .map((profile) => {
      const minutes = timeEntries
        .filter((e) => e.user_id === profile.id)
        .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      return {
        name: profile.full_name,
        hours: Math.round(minutes / 60),
        minutes,
      };
    })
    .filter((e) => e.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  // Daily trend (last 7 days)
  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayEntries = timeEntries.filter((e) => {
      const entryDate = new Date(e.start_time);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
    const minutes = dayEntries.reduce(
      (sum, e) => sum + (e.duration_minutes || 0),
      0,
    );
    return {
      day: format(date, "EEE", { locale: he }),
      hours: Math.round((minutes / 60) * 10) / 10,
    };
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout title="דוחות">
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-[hsl(45,80%,45%)]" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                דוחות וסטטיסטיקות
              </h1>
              <p className="text-sm text-muted-foreground">
                סקירה מקיפה של שעות העבודה והפרודוקטיביות
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={dateRange}
              onValueChange={(v) => setDateRange(v as DateRange)}
            >
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">שבוע נוכחי</SelectItem>
                <SelectItem value="month">חודש נוכחי</SelectItem>
                <SelectItem value="quarter">3 חודשים</SelectItem>
                <SelectItem value="year">שנה</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 ml-2" />
              ייצוא
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card dir="rtl" className="border-2 border-[hsl(220,60%,25%)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">סה"כ שעות</p>
                      <p className="text-3xl font-bold text-[hsl(220,60%,25%)]">
                        {totalHours}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-[hsl(220,60%,25%)]" />
                  </div>
                </CardContent>
              </Card>
              <Card dir="rtl" className="border-2 border-[hsl(45,80%,45%)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        ממוצע יומי
                      </p>
                      <p className="text-3xl font-bold text-[hsl(45,80%,45%)]">
                        {avgDailyHours}h
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-[hsl(45,80%,45%)]" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        פרויקטים פעילים
                      </p>
                      <p className="text-3xl font-bold">{projectData.length}</p>
                    </div>
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        לקוחות פעילים
                      </p>
                      <p className="text-3xl font-bold">{clientData.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    מגמה יומית (7 ימים אחרונים)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${value} שעות`, "שעות"]}
                          labelFormatter={(label) => `יום ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="hours"
                          stroke="hsl(220, 60%, 25%)"
                          strokeWidth={3}
                          dot={{
                            fill: "hsl(45, 80%, 45%)",
                            strokeWidth: 2,
                            r: 5,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* By Project */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">שעות לפי פרויקט</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {projectData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip
                            formatter={(value) => [`${value} שעות`, "שעות"]}
                          />
                          <Bar
                            dataKey="hours"
                            fill="hsl(220, 60%, 25%)"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        אין נתונים להצגה
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Client (Pie) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">חלוקה לפי לקוח</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {clientData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={clientData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="hours"
                            label={({ name, percent }) =>
                              `${name} (${(percent * 100).toFixed(0)}%)`
                            }
                          >
                            {clientData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} שעות`, "שעות"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        אין נתונים להצגה
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* By Employee */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">שעות לפי עובד</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {employeeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={employeeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`${value} שעות`, "שעות"]}
                          />
                          <Bar
                            dataKey="hours"
                            fill="hsl(45, 80%, 45%)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        אין נתונים להצגה
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Reports;
