// Admin Portal Management - Overview of all client portal activity
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClients } from "@/hooks/useClients";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Users,
  MessageSquare,
  FileText,
  CalendarDays,
  Bell,
  Shield,
  Eye,
  FolderKanban,
  Key,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  Activity,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Navy/Gold accent colors
const NAVY = "hsl(220, 60%, 20%)";
const GOLD = "hsl(40, 85%, 55%)";
const GOLD_BORDER = "hsl(40, 70%, 65%)";

interface PortalClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  user_id: string | null;
  status: string | null;
}

interface PortalMessage {
  id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
  client_id: string;
  client_name?: string;
}

interface PortalMeeting {
  id: string;
  title: string;
  meeting_type: string;
  status: string;
  requested_date: string;
  client_id: string;
  client_name?: string;
}

interface PortalFile {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  client_id: string;
  uploader_type: string;
  client_name?: string;
}

export default function PortalManagement() {
  const { user } = useAuth();
  const { clients } = useClients();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Stats
  const [portalClients, setPortalClients] = useState<PortalClient[]>([]);
  const [recentMessages, setRecentMessages] = useState<PortalMessage[]>([]);
  const [meetings, setMeetings] = useState<PortalMeeting[]>([]);
  const [files, setFiles] = useState<PortalFile[]>([]);
  const [stats, setStats] = useState({
    totalWithAccess: 0,
    totalWithoutAccess: 0,
    unreadMessages: 0,
    pendingMeetings: 0,
    totalFiles: 0,
    activeProjects: 0,
  });

  useEffect(() => {
    loadPortalData();
  }, [clients]);

  const loadPortalData = async () => {
    setLoading(true);
    try {
      // Get clients with user_id (have portal access)
      const clientsWithAccess = clients.filter((c: any) => c.user_id);
      const clientsWithoutAccess = clients.filter((c: any) => !c.user_id);

      // Create a client name map
      const clientMap = new Map(clients.map((c: any) => [c.id, c.name]));

      // Fetch portal messages
      const { data: msgs } = await supabase
        .from("client_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const messagesWithNames = (msgs || []).map((m: any) => ({
        ...m,
        client_name: clientMap.get(m.client_id) || "לקוח לא ידוע",
      }));

      // Fetch meetings
      const { data: mtgs } = await supabase
        .from("client_meeting_requests")
        .select("*")
        .order("requested_date", { ascending: false })
        .limit(50);

      const meetingsWithNames = (mtgs || []).map((m: any) => ({
        ...m,
        client_name: clientMap.get(m.client_id) || "לקוח לא ידוע",
      }));

      // Fetch client files
      const { data: fls } = await supabase
        .from("client_files")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const filesWithNames = (fls || []).map((f: any) => ({
        ...f,
        client_name: clientMap.get(f.client_id) || "לקוח לא ידוע",
      }));

      // Count unread messages
      const unreadCount = (msgs || []).filter(
        (m: any) => m.sender_type === "client" && !m.is_read
      ).length;

      // Count pending meetings
      const pendingCount = (mtgs || []).filter(
        (m: any) => m.status === "pending"
      ).length;

      // Count active projects
      const { count: projectCount } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      setPortalClients(clients as any);
      setRecentMessages(messagesWithNames);
      setMeetings(meetingsWithNames);
      setFiles(filesWithNames);
      setStats({
        totalWithAccess: clientsWithAccess.length,
        totalWithoutAccess: clientsWithoutAccess.length,
        unreadMessages: unreadCount,
        pendingMeetings: pendingCount,
        totalFiles: (fls || []).length,
        activeProjects: projectCount || 0,
      });
    } catch (err) {
      console.error("Error loading portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = portalClients.filter((c) =>
    searchTerm
      ? c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const clientsWithAccess = filteredClients.filter((c: any) => c.user_id);
  const clientsWithoutAccess = filteredClients.filter((c: any) => !c.user_id);

  // Stats cards data
  const statCards = [
    {
      label: "לקוחות עם גישה",
      value: stats.totalWithAccess,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "ללא גישה",
      value: stats.totalWithoutAccess,
      icon: UserX,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "הודעות שלא נקראו",
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "בקשות פגישה ממתינות",
      value: stats.pendingMeetings,
      icon: CalendarDays,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "קבצים שהועלו",
      value: stats.totalFiles,
      icon: FileText,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      label: "פרויקטים פעילים",
      value: stats.activeProjects,
      icon: FolderKanban,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <AppLayout title="פורטל לקוחות">
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ color: NAVY }}
            >
              🏢 ניהול פורטל לקוחות
            </h1>
            <p className="text-muted-foreground mt-1">
              תצוגה כוללת של כל הפעילות בפורטל הלקוחות
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadPortalData}
              className="border-[hsl(40,70%,65%)] hover:bg-[hsl(40,85%,95%)]"
            >
              <RefreshCw className="h-4 w-4 ml-1" />
              רענון
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/clients")}
              style={{ backgroundColor: NAVY }}
              className="text-white hover:opacity-90"
            >
              <Users className="h-4 w-4 ml-1" />
              ניהול לקוחות
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="border"
              style={{ borderColor: GOLD_BORDER }}
            >
              <CardContent className="p-3 text-center">
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${stat.bg} mb-2`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: NAVY }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 border" style={{ borderColor: GOLD_BORDER }}>
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Activity className="h-4 w-4 ml-1" />
              סקירה
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="h-4 w-4 ml-1" />
              לקוחות
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MessageSquare className="h-4 w-4 ml-1" />
              הודעות
              {stats.unreadMessages > 0 && (
                <Badge variant="destructive" className="mr-1 text-[10px] px-1.5 py-0 h-4">
                  {stats.unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="meetings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <CalendarDays className="h-4 w-4 ml-1" />
              פגישות
              {stats.pendingMeetings > 0 && (
                <Badge variant="destructive" className="mr-1 text-[10px] px-1.5 py-0 h-4">
                  {stats.pendingMeetings}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4 ml-1" />
              קבצים
            </TabsTrigger>
            <TabsTrigger value="access" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Shield className="h-4 w-4 ml-1" />
              גישות
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Messages */}
              <Card className="border" style={{ borderColor: GOLD_BORDER }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2" style={{ color: NAVY }}>
                    <MessageSquare className="h-4 w-4" style={{ color: GOLD }} />
                    הודעות אחרונות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    {recentMessages.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        אין הודעות
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {recentMessages.slice(0, 10).map((msg) => (
                          <div
                            key={msg.id}
                            className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                            style={{ borderColor: msg.is_read ? "hsl(var(--border))" : GOLD_BORDER }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold" style={{ color: NAVY }}>
                                  {msg.client_name}
                                </span>
                                <Badge
                                  variant={msg.sender_type === "client" ? "default" : "secondary"}
                                  className="text-[10px] px-1.5 py-0 h-4"
                                >
                                  {msg.sender_type === "client" ? "לקוח" : "צוות"}
                                </Badge>
                                {!msg.is_read && msg.sender_type === "client" && (
                                  <span className="w-2 h-2 rounded-full bg-destructive" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {msg.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: he })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Pending Meetings */}
              <Card className="border" style={{ borderColor: GOLD_BORDER }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2" style={{ color: NAVY }}>
                    <CalendarDays className="h-4 w-4" style={{ color: GOLD }} />
                    בקשות פגישה
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    {meetings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        אין בקשות פגישה
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {meetings.slice(0, 10).map((mtg) => (
                          <div
                            key={mtg.id}
                            className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                            style={{ borderColor: mtg.status === "pending" ? GOLD_BORDER : "hsl(var(--border))" }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold" style={{ color: NAVY }}>
                                  {mtg.client_name}
                                </span>
                                <Badge
                                  variant={mtg.status === "pending" ? "default" : mtg.status === "approved" ? "secondary" : "outline"}
                                  className="text-[10px] px-1.5 py-0 h-4"
                                >
                                  {mtg.status === "pending" ? "ממתין" : mtg.status === "approved" ? "אושר" : mtg.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {mtg.title} • {mtg.meeting_type === "video" ? "וידאו" : mtg.meeting_type === "phone" ? "טלפון" : "פרונטלי"}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                {format(new Date(mtg.requested_date), "dd/MM/yyyy HH:mm", { locale: he })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Files */}
              <Card className="border" style={{ borderColor: GOLD_BORDER }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2" style={{ color: NAVY }}>
                    <FileText className="h-4 w-4" style={{ color: GOLD }} />
                    קבצים אחרונים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    {files.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        אין קבצים
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {files.slice(0, 10).map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                          >
                            <FileText className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: NAVY }}>
                                {file.file_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {file.client_name} • {file.uploader_type === "client" ? "הועלה ע״י לקוח" : "הועלה ע״י צוות"} • {format(new Date(file.created_at), "dd/MM HH:mm", { locale: he })}
                              </p>
                            </div>
                            {file.file_size && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {(file.file_size / 1024).toFixed(0)} KB
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Clients with Access */}
              <Card className="border" style={{ borderColor: GOLD_BORDER }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2" style={{ color: NAVY }}>
                    <Shield className="h-4 w-4" style={{ color: GOLD }} />
                    לקוחות עם גישה לפורטל
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    {clientsWithAccess.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        אין לקוחות עם גישה
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {clientsWithAccess.slice(0, 15).map((client) => (
                          <div
                            key={client.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: NAVY }}>
                              {client.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold" style={{ color: NAVY }}>
                                {client.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {client.email || client.phone || "—"}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                              <Key className="h-3 w-3 ml-0.5" />
                              פעיל
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CLIENTS TAB */}
          <TabsContent value="clients" className="mt-4">
            <Card className="border" style={{ borderColor: GOLD_BORDER }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base" style={{ color: NAVY }}>
                    כל הלקוחות
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="חיפוש לקוח..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-8 text-sm h-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ backgroundColor: NAVY }}
                        >
                          {client.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: NAVY }}>
                            {client.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client.company && `${client.company} • `}
                            {client.email || client.phone || "—"}
                          </p>
                        </div>
                        {(client as any).user_id ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            <UserCheck className="h-3 w-3 ml-0.5" />
                            גישה פעילה
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            <UserX className="h-3 w-3 ml-0.5" />
                            ללא גישה
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${client.id}`);
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MESSAGES TAB */}
          <TabsContent value="messages" className="mt-4">
            <Card className="border" style={{ borderColor: GOLD_BORDER }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base" style={{ color: NAVY }}>
                  כל ההודעות מהפורטל
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {recentMessages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">אין הודעות</p>
                  ) : (
                    <div className="space-y-2">
                      {recentMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                          style={{ borderColor: !msg.is_read && msg.sender_type === "client" ? GOLD_BORDER : "hsl(var(--border))" }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: NAVY }}>
                                {msg.client_name}
                              </span>
                              <Badge
                                variant={msg.sender_type === "client" ? "default" : "secondary"}
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                {msg.sender_type === "client" ? "לקוח" : "צוות"}
                              </Badge>
                              {!msg.is_read && msg.sender_type === "client" && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                                  חדש
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MEETINGS TAB */}
          <TabsContent value="meetings" className="mt-4">
            <Card className="border" style={{ borderColor: GOLD_BORDER }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base" style={{ color: NAVY }}>
                  כל בקשות הפגישה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {meetings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">אין בקשות פגישה</p>
                  ) : (
                    <div className="space-y-2">
                      {meetings.map((mtg) => (
                        <div
                          key={mtg.id}
                          className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                          style={{ borderColor: mtg.status === "pending" ? GOLD_BORDER : "hsl(var(--border))" }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: NAVY }}>
                                {mtg.client_name}
                              </span>
                              <Badge
                                variant={mtg.status === "pending" ? "default" : "secondary"}
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                {mtg.status === "pending" ? "ממתין" : mtg.status === "approved" ? "אושר" : mtg.status === "rejected" ? "נדחה" : mtg.status}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {mtg.meeting_type === "video" ? "📹 וידאו" : mtg.meeting_type === "phone" ? "📞 טלפון" : "🏢 פרונטלי"}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(mtg.requested_date), "dd/MM/yyyy HH:mm", { locale: he })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80">{mtg.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FILES TAB */}
          <TabsContent value="files" className="mt-4">
            <Card className="border" style={{ borderColor: GOLD_BORDER }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base" style={{ color: NAVY }}>
                  כל הקבצים מהפורטל
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {files.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">אין קבצים</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                        >
                          <FileText className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: NAVY }}>
                              {file.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.client_name} • {file.uploader_type === "client" ? "לקוח" : "צוות"} • {format(new Date(file.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                            </p>
                          </div>
                          {file.file_size && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {file.file_size > 1048576
                                ? `${(file.file_size / 1048576).toFixed(1)} MB`
                                : `${(file.file_size / 1024).toFixed(0)} KB`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACCESS TAB */}
          <TabsContent value="access" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border" style={{ borderColor: GOLD_BORDER }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2" style={{ color: NAVY }}>
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    לקוחות עם גישה ({clientsWithAccess.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {clientsWithAccess.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg border bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors"
                          style={{ borderColor: "hsl(145, 60%, 80%)" }}
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-emerald-600">
                            {client.name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: NAVY }}>
                              {client.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{client.email || "—"}</p>
                          </div>
                          <Key className="h-4 w-4 text-emerald-500" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="border" style={{ borderColor: GOLD_BORDER }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2" style={{ color: NAVY }}>
                    <UserX className="h-4 w-4 text-orange-600" />
                    לקוחות ללא גישה ({clientsWithoutAccess.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {clientsWithoutAccess.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg border bg-orange-50/50 cursor-pointer hover:bg-orange-50 transition-colors"
                          style={{ borderColor: "hsl(30, 60%, 80%)" }}
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-orange-500">
                            {client.name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: NAVY }}>
                              {client.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{client.email || "—"}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 border-[hsl(40,70%,65%)]"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clients/${client.id}`);
                            }}
                          >
                            צור גישה
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
