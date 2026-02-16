// Contacts Page - Full standalone contacts management
// Smart import from Google, Gmail senders, client linking, smart matching
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  UserPlus,
  Search,
  Download,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Loader2,
  Link2,
  Unlink,
  ArrowRightLeft,
  Globe,
  UserCheck,
  X,
  Check,
  Sparkles,
  Filter,
  LogIn,
  LogOut,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useGoogleContacts, GoogleContact } from "@/hooks/useGoogleContacts";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { useClients, Client } from "@/hooks/useClients";
import type { GmailMessage } from "@/hooks/useGmailIntegration";
import { useGmailCache } from "@/hooks/useGmailCache";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────
interface EmailSender {
  email: string;
  name: string;
  count: number;
  lastDate: string;
  linkedClientId?: string;
  linkedClientName?: string;
}

interface SmartMatch {
  sender: EmailSender;
  client: Client;
  matchType: "exact-email" | "similar-email" | "name-match";
  confidence: number;
}

// ── Helpers ────────────────────────────────────────────────────
function extractSenders(messages: GmailMessage[]): EmailSender[] {
  const senderMap = new Map<string, EmailSender>();
  for (const msg of messages) {
    const email = msg.from?.toLowerCase().trim();
    if (!email) continue;
    const existing = senderMap.get(email);
    if (existing) {
      existing.count++;
      if (msg.date > existing.lastDate) {
        existing.lastDate = msg.date;
        existing.name = msg.fromName || existing.name;
      }
    } else {
      senderMap.set(email, {
        email,
        name: msg.fromName || email,
        count: 1,
        lastDate: msg.date,
      });
    }
  }
  return Array.from(senderMap.values()).sort((a, b) => b.count - a.count);
}

function findSmartMatches(
  senders: EmailSender[],
  clients: Client[],
): SmartMatch[] {
  const matches: SmartMatch[] = [];
  for (const sender of senders) {
    for (const client of clients) {
      if (
        client.email &&
        sender.email.toLowerCase() === client.email.toLowerCase()
      ) {
        matches.push({
          sender,
          client,
          matchType: "exact-email",
          confidence: 100,
        });
        continue;
      }
      if (client.email) {
        const [sLocal, sDomain] = sender.email.split("@");
        const [cLocal, cDomain] = client.email.toLowerCase().split("@");
        if (
          sDomain === cDomain &&
          (sLocal.includes(cLocal) || cLocal.includes(sLocal))
        ) {
          matches.push({
            sender,
            client,
            matchType: "similar-email",
            confidence: 60,
          });
          continue;
        }
      }
      if (client.name && sender.name) {
        const sName = sender.name.toLowerCase().trim();
        const cName = client.name.toLowerCase().trim();
        if (sName === cName || sName.includes(cName) || cName.includes(sName)) {
          matches.push({
            sender,
            client,
            matchType: "name-match",
            confidence: 50,
          });
        }
      }
    }
  }
  return matches.sort((a, b) => b.confidence - a.confidence);
}

// ── Main Page ──────────────────────────────────────────────────
export default function Contacts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    contacts: googleContacts,
    isLoading: isLoadingGoogle,
    isImporting,
    fetchContacts,
    importContactAsClient,
    importMultipleContacts,
    searchContacts,
  } = useGoogleContacts();
  const {
    isConnected: isGoogleConnected,
    isLoading: isGoogleConnecting,
    getAccessToken: connectGoogle,
    disconnect: disconnectGoogle,
  } = useGoogleServices();
  const {
    clients,
    loading: isLoadingClients,
    refetch: refetchClients,
  } = useClients();

  // Get cached Gmail messages for senders extraction
  const gmailCache = useGmailCache();
  const cachedMessages = useMemo(
    () => gmailCache.getCachedMessages("inbox") || [],
    [gmailCache],
  );

  // Direct Gmail message fetch for senders tab (when cache is empty)
  const [directMessages, setDirectMessages] = useState<GmailMessage[]>([]);
  const [isLoadingSenders, setIsLoadingSenders] = useState(false);
  const cloudLoadedRef = useRef(false);

  // ── Load cached Gmail messages + senders from Supabase on mount ──
  useEffect(() => {
    if (!user || cloudLoadedRef.current) return;
    cloudLoadedRef.current = true;

    (async () => {
      try {
        // Load cached email_messages from Supabase
        const { data: emailRows, error: emailErr } = await supabase
          .from("email_messages")
          .select("*")
          .eq("user_id", user.id)
          .order("received_at", { ascending: false })
          .limit(200);

        if (!emailErr && emailRows && emailRows.length > 0) {
          const msgs: GmailMessage[] = emailRows.map((row: any) => ({
            id: row.gmail_message_id,
            threadId: row.thread_id || "",
            subject: row.subject || "",
            from: row.from_email || "",
            fromName: row.from_name || row.from_email || "",
            to: row.to_emails || [],
            date: row.received_at || "",
            snippet: row.body_preview || "",
            isRead: row.is_read ?? true,
            isStarred: row.is_starred ?? false,
            labels: row.labels || [],
          }));
          setDirectMessages(msgs);
          gmailCache.cacheMessages(msgs, "inbox");
          console.log(
            `[Contacts] Loaded ${msgs.length} messages from cloud cache`,
          );
        }
      } catch (err) {
        console.warn("[Contacts] Cloud cache load failed:", err);
      }
    })();
  }, [user, gmailCache]);

  // ── Save Gmail messages to email_messages table ──────────────
  const saveMessagesToCloud = useCallback(
    async (messages: GmailMessage[]) => {
      if (!user || messages.length === 0) return;
      try {
        const rows = messages.map((msg) => ({
          user_id: user.id,
          gmail_message_id: msg.id,
          thread_id: msg.threadId || null,
          subject: msg.subject || null,
          from_email: msg.from || null,
          from_name: msg.fromName || null,
          to_emails: msg.to || [],
          body_preview: msg.snippet || null,
          received_at: msg.date ? new Date(msg.date).toISOString() : null,
          is_read: msg.isRead ?? true,
          is_starred: msg.isStarred ?? false,
          labels: msg.labels || [],
        }));

        // Upsert in batches of 25
        const BATCH = 25;
        for (let i = 0; i < rows.length; i += BATCH) {
          const batch = rows.slice(i, i + BATCH);
          const { error } = await supabase
            .from("email_messages")
            .upsert(batch, { onConflict: "user_id,gmail_message_id" });
          if (error) {
            console.error(
              "[Contacts] email_messages save error:",
              error.message,
            );
          }
        }
        console.log(`[Contacts] Saved ${rows.length} messages to cloud`);
      } catch (err) {
        console.error("[Contacts] Messages cloud save failed:", err);
      }
    },
    [user],
  );

  // ── Save senders to gmail_senders_cache ──────────────────────
  const saveSendersToCloud = useCallback(
    async (
      sendersList: {
        email: string;
        name: string;
        count: number;
        lastDate: string;
      }[],
    ) => {
      if (!user || sendersList.length === 0) return;
      try {
        const rows = sendersList.map((s) => ({
          user_id: user.id,
          sender_email: s.email,
          sender_name: s.name,
          message_count: s.count,
          last_message_date: s.lastDate
            ? new Date(s.lastDate).toISOString()
            : null,
          fetched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const BATCH = 50;
        for (let i = 0; i < rows.length; i += BATCH) {
          const batch = rows.slice(i, i + BATCH);
          const { error } = await supabase
            .from("gmail_senders_cache")
            .upsert(batch, { onConflict: "user_id,sender_email" });
          if (error) {
            console.error(
              "[Contacts] senders cache save error:",
              error.message,
            );
          }
        }
        console.log(`[Contacts] Saved ${rows.length} senders to cloud`);
      } catch (err) {
        console.error("[Contacts] Senders cloud save failed:", err);
      }
    },
    [user],
  );

  const fetchSendersFromGmail = useCallback(async () => {
    if (!isGoogleConnected) return;
    setIsLoadingSenders(true);
    try {
      const token = await connectGoogle(["gmail"]);
      if (!token) {
        setIsLoadingSenders(false);
        return;
      }
      // Fetch up to 100 messages to extract senders
      const listResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!listResp.ok) {
        const errData = await listResp.json().catch(() => ({}));
        toast({
          title: "שגיאה בטעינת הודעות Gmail",
          description: errData?.error?.message || `HTTP ${listResp.status}`,
          variant: "destructive",
        });
        setIsLoadingSenders(false);
        return;
      }
      const listData = await listResp.json();
      if (!listData.messages || listData.messages.length === 0) {
        toast({ title: "לא נמצאו הודעות ב-Gmail" });
        setIsLoadingSenders(false);
        return;
      }
      // Batch fetch message metadata
      const BATCH_SIZE = 8;
      const allMsgs: any[] = [];
      for (let i = 0; i < listData.messages.length; i += BATCH_SIZE) {
        const batch = listData.messages.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (m: any) => {
            const r = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            return r.json();
          }),
        );
        allMsgs.push(...results);
        if (i + BATCH_SIZE < listData.messages.length) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      const formatted: GmailMessage[] = allMsgs.map((msg: any) => {
        const headers = msg.payload?.headers || [];
        const getH = (n: string) =>
          headers.find((h: any) => h.name === n)?.value || "";
        const fromH = getH("From");
        const fromM = fromH.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
        return {
          id: msg.id,
          threadId: msg.threadId,
          subject: getH("Subject"),
          from: fromM?.[2] || fromH,
          fromName: fromM?.[1] || fromM?.[2] || fromH,
          to: getH("To")
            .split(",")
            .map((t: string) => t.trim()),
          date: getH("Date"),
          snippet: msg.snippet || "",
          isRead: !msg.labelIds?.includes("UNREAD"),
          isStarred: msg.labelIds?.includes("STARRED"),
          labels: msg.labelIds || [],
        };
      });
      setDirectMessages(formatted);
      // Also cache them for later
      gmailCache.cacheMessages(formatted, "inbox");
      // Save to cloud (fire-and-forget)
      saveMessagesToCloud(formatted);
      // Extract and save senders to cloud
      const extractedSenders = extractSenders(formatted);
      saveSendersToCloud(extractedSenders);
      toast({ title: `נטענו ${formatted.length} הודעות מ-Gmail` });
    } catch (err: any) {
      console.error("Error fetching Gmail messages:", err);
      toast({
        title: "שגיאה בטעינת Gmail",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingSenders(false);
    }
  }, [
    isGoogleConnected,
    connectGoogle,
    gmailCache,
    toast,
    saveMessagesToCloud,
    saveSendersToCloud,
  ]);

  // Combine cached + directly fetched messages
  const allMessages = useMemo(() => {
    if (cachedMessages.length > 0) return cachedMessages;
    return directMessages;
  }, [cachedMessages, directMessages]);

  // State
  const [activeTab, setActiveTab] = useState("senders");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGoogleContacts, setSelectedGoogleContacts] = useState<
    Set<string>
  >(new Set());
  const [selectedSenders, setSelectedSenders] = useState<Set<string>>(
    new Set(),
  );
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(
    new Set(),
  );
  const [googleFetched, setGoogleFetched] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkDialogSender, setLinkDialogSender] = useState<EmailSender | null>(
    null,
  );
  const [filterType, setFilterType] = useState<"all" | "unlinked" | "linked">(
    "all",
  );
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [expandedSenderEmail, setExpandedSenderEmail] = useState<string | null>(
    null,
  );

  // Get messages for a specific email address
  const getMessagesForEmail = useCallback(
    (email: string) => {
      if (!email) return [];
      const lowerEmail = email.toLowerCase();
      return allMessages.filter(
        (msg) =>
          msg.from.toLowerCase().includes(lowerEmail) ||
          msg.to.some((t) => t.toLowerCase().includes(lowerEmail)),
      );
    },
    [allMessages],
  );

  // Extract unique email senders from all messages
  const senders = useMemo(() => extractSenders(allMessages), [allMessages]);

  const linkedSenders = useMemo(() => {
    return senders.map((sender) => {
      const matchedClient = clients.find(
        (c) => c.email && c.email.toLowerCase() === sender.email.toLowerCase(),
      );
      return {
        ...sender,
        linkedClientId: matchedClient?.id,
        linkedClientName: matchedClient?.name,
      };
    });
  }, [senders, clients]);

  const smartMatches = useMemo(
    () =>
      findSmartMatches(
        linkedSenders.filter((s) => !s.linkedClientId),
        clients,
      ),
    [linkedSenders, clients],
  );

  const filteredSenders = useMemo(() => {
    let result = linkedSenders;
    if (filterType === "unlinked")
      result = result.filter((s) => !s.linkedClientId);
    else if (filterType === "linked")
      result = result.filter((s) => s.linkedClientId);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.email.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.linkedClientName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [linkedSenders, filterType, searchQuery]);

  const filteredGoogleContacts = useMemo(() => {
    if (!searchQuery) return googleContacts;
    return searchContacts(searchQuery);
  }, [googleContacts, searchQuery, searchContacts]);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q),
    );
  }, [clients, searchQuery]);

  // ── Handlers ────────────────────────────────────────────────
  const handleFetchGoogle = useCallback(async () => {
    await fetchContacts(500);
    setGoogleFetched(true);
  }, [fetchContacts]);

  const handleConnectGoogle = useCallback(async () => {
    const token = await connectGoogle(["contacts", "gmail"]);
    if (token) {
      // Auto-fetch contacts after connecting
      fetchContacts(500).then(() => setGoogleFetched(true));
      // Auto-fetch senders too
      fetchSendersFromGmail();
    }
  }, [connectGoogle, fetchContacts, fetchSendersFromGmail]);

  const handleImportSelected = useCallback(async () => {
    const toImport = googleContacts.filter((c) =>
      selectedGoogleContacts.has(c.resourceName),
    );
    if (toImport.length === 0) return;
    const count = await importMultipleContacts(toImport);
    if (count > 0) {
      setSelectedGoogleContacts(new Set());
      refetchClients();
    }
  }, [
    googleContacts,
    selectedGoogleContacts,
    importMultipleContacts,
    refetchClients,
  ]);

  const handleAddSenderAsClient = useCallback(
    async (sender: EmailSender) => {
      setIsLinking(true);
      try {
        const { data: existing } = await supabase
          .from("clients")
          .select("id")
          .eq("email", sender.email)
          .maybeSingle();
        if (existing) {
          toast({
            title: "לקוח קיים",
            description: `${sender.email} כבר קיים כלקוח`,
            variant: "destructive",
          });
          setIsLinking(false);
          return;
        }
        const { error } = await supabase.from("clients").insert({
          name: sender.name,
          email: sender.email,
          source: "gmail_sender",
          status: "active",
        });
        if (error) throw error;
        toast({ title: "איש קשר נוסף כלקוח", description: sender.name });
        refetchClients();
      } catch (err: any) {
        toast({
          title: "שגיאה",
          description: err.message,
          variant: "destructive",
        });
      }
      setIsLinking(false);
    },
    [refetchClients, toast],
  );

  const handleAddMultipleSendersAsClients = useCallback(async () => {
    const toAdd = linkedSenders.filter(
      (s) => selectedSenders.has(s.email) && !s.linkedClientId,
    );
    if (toAdd.length === 0) return;
    setIsLinking(true);
    let addedCount = 0;
    for (const sender of toAdd) {
      try {
        const { data: existing } = await supabase
          .from("clients")
          .select("id")
          .eq("email", sender.email)
          .maybeSingle();
        if (!existing) {
          const { error } = await supabase.from("clients").insert({
            name: sender.name,
            email: sender.email,
            source: "gmail_sender",
            status: "active",
          });
          if (!error) addedCount++;
        }
      } catch {
        /* skip */
      }
    }
    if (addedCount > 0) {
      toast({
        title: "ייבוא הושלם",
        description: `${addedCount} שולחים נוספו כלקוחות`,
      });
      refetchClients();
      setSelectedSenders(new Set());
    }
    setIsLinking(false);
  }, [linkedSenders, selectedSenders, refetchClients, toast]);

  const handleLinkSenderToClient = useCallback(
    async (sender: EmailSender, clientId: string) => {
      setIsLinking(true);
      try {
        const { error } = await supabase
          .from("clients")
          .update({ email: sender.email })
          .eq("id", clientId);
        if (error) throw error;
        toast({
          title: "קישור בוצע",
          description: `${sender.name} קושר ל${clients.find((c) => c.id === clientId)?.name}`,
        });
        refetchClients();
        setLinkDialogSender(null);
      } catch (err: any) {
        toast({
          title: "שגיאה בקישור",
          description: err.message,
          variant: "destructive",
        });
      }
      setIsLinking(false);
    },
    [clients, refetchClients, toast],
  );

  const handleApplySmartMatches = useCallback(async () => {
    const toLink = smartMatches.filter((m) =>
      selectedMatches.has(`${m.sender.email}::${m.client.id}`),
    );
    if (toLink.length === 0) return;
    setIsLinking(true);
    let linked = 0;
    for (const match of toLink) {
      try {
        const { error } = await supabase
          .from("clients")
          .update({ email: match.sender.email })
          .eq("id", match.client.id);
        if (!error) linked++;
      } catch {
        /* skip */
      }
    }
    if (linked > 0) {
      toast({
        title: "קישור חכם הושלם",
        description: `${linked} קישורים בוצעו`,
      });
      refetchClients();
      setSelectedMatches(new Set());
    }
    setIsLinking(false);
  }, [smartMatches, selectedMatches, refetchClients, toast]);

  // Toggle helpers
  const toggleGoogleContact = (resourceName: string) => {
    setSelectedGoogleContacts((prev) => {
      const n = new Set(prev);
      n.has(resourceName) ? n.delete(resourceName) : n.add(resourceName);
      return n;
    });
  };
  const toggleSender = (email: string) => {
    setSelectedSenders((prev) => {
      const n = new Set(prev);
      n.has(email) ? n.delete(email) : n.add(email);
      return n;
    });
  };
  const toggleMatch = (key: string) => {
    setSelectedMatches((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };
  const selectAllGoogleContacts = () => {
    setSelectedGoogleContacts((prev) =>
      prev.size === filteredGoogleContacts.length
        ? new Set()
        : new Set(filteredGoogleContacts.map((c) => c.resourceName)),
    );
  };
  const selectAllSenders = () => {
    const unlinked = filteredSenders.filter((s) => !s.linkedClientId);
    setSelectedSenders((prev) =>
      prev.size === unlinked.length
        ? new Set()
        : new Set(unlinked.map((s) => s.email)),
    );
  };
  const selectAllMatches = () => {
    setSelectedMatches((prev) =>
      prev.size === smartMatches.length
        ? new Set()
        : new Set(smartMatches.map((m) => `${m.sender.email}::${m.client.id}`)),
    );
  };

  // Stats
  const stats = useMemo(() => {
    const total = senders.length;
    const linked = linkedSenders.filter((s) => s.linkedClientId).length;
    return {
      total,
      linked,
      unlinked: total - linked,
      matchSuggestions: smartMatches.length,
    };
  }, [senders, linkedSenders, smartMatches]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <AppLayout>
      <div
        className="container mx-auto py-4 px-2 md:py-6 md:px-4 max-w-7xl"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">אנשי קשר</h1>
              <p className="text-muted-foreground text-sm">
                ייבוא, קישור וניהול אנשי קשר מ-Gmail, Google ולקוחות קיימים
              </p>
            </div>
          </div>
          {/* Google Connection Status */}
          <div className="flex items-center gap-2">
            {isGoogleConnected ? (
              <>
                <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
                  <Wifi className="h-3 w-3" />
                  מחובר ל-Google
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectGoogle}
                  className="text-xs gap-1"
                >
                  <LogOut className="h-3 w-3" />
                  נתק
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnectGoogle}
                disabled={isGoogleConnecting}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {isGoogleConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                התחבר ל-Google
              </Button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Mail className="h-3 w-3 ml-1" />
            {stats.total} שולחים
          </Badge>
          <Badge
            variant="outline"
            className="text-sm px-3 py-1 bg-green-50 text-green-700 border-green-200"
          >
            <Link2 className="h-3 w-3 ml-1" />
            {stats.linked} מקושרים
          </Badge>
          <Badge
            variant="outline"
            className="text-sm px-3 py-1 bg-orange-50 text-orange-700 border-orange-200"
          >
            <Unlink className="h-3 w-3 ml-1" />
            {stats.unlinked} לא מקושרים
          </Badge>
          {stats.matchSuggestions > 0 && (
            <Badge
              variant="outline"
              className="text-sm px-3 py-1 bg-purple-50 text-purple-700 border-purple-200 cursor-pointer"
              onClick={() => setActiveTab("smart")}
            >
              <Sparkles className="h-3 w-3 ml-1" />
              {stats.matchSuggestions} התאמות חכמות
            </Badge>
          )}
          <Badge variant="outline" className="text-sm px-3 py-1">
            <UserCheck className="h-3 w-3 ml-1" />
            {clients.length} לקוחות
          </Badge>
        </div>

        {/* Main Card */}
        <Card className="relative">
          <CardContent className="p-0">
            {/* Search Bar */}
            <div className="px-6 py-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש לפי שם, מייל, חברה..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mx-6 mt-4 grid grid-cols-4 h-10">
                <TabsTrigger value="senders" className="text-xs">
                  <Mail className="h-3.5 w-3.5 ml-1" />
                  שולחי מייל
                </TabsTrigger>
                <TabsTrigger value="google" className="text-xs">
                  <Globe className="h-3.5 w-3.5 ml-1" />
                  Google
                </TabsTrigger>
                <TabsTrigger value="clients" className="text-xs">
                  <UserCheck className="h-3.5 w-3.5 ml-1" />
                  לקוחות
                </TabsTrigger>
                <TabsTrigger value="smart" className="text-xs">
                  <Sparkles className="h-3.5 w-3.5 ml-1" />
                  התאמה חכמה
                  {smartMatches.length > 0 && (
                    <span className="mr-1 bg-purple-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {smartMatches.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ─── Tab: Email Senders ─────────────────────────── */}
              <TabsContent value="senders" className="mt-0">
                <div className="px-6 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Select
                      value={filterType}
                      onValueChange={(v) => setFilterType(v as any)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <Filter className="h-3 w-3 ml-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">הכל ({stats.total})</SelectItem>
                        <SelectItem value="unlinked">
                          לא מקושרים ({stats.unlinked})
                        </SelectItem>
                        <SelectItem value="linked">
                          מקושרים ({stats.linked})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllSenders}
                      className="text-xs h-8"
                    >
                      <Check className="h-3 w-3 ml-1" />
                      {selectedSenders.size > 0 ? "נקה בחירה" : "בחר הכל"}
                    </Button>
                  </div>
                  {selectedSenders.size > 0 && (
                    <Button
                      size="sm"
                      onClick={handleAddMultipleSendersAsClients}
                      disabled={isLinking}
                      className="text-xs h-8 bg-blue-600 hover:bg-blue-700"
                    >
                      {isLinking ? (
                        <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                      ) : (
                        <UserPlus className="h-3 w-3 ml-1" />
                      )}
                      הוסף {selectedSenders.size} כלקוחות
                    </Button>
                  )}
                </div>
                <div className="px-6 pb-4 space-y-1">
                  {filteredSenders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Mail className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>לא נמצאו שולחים</p>
                      {isGoogleConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          disabled={isLoadingSenders}
                          onClick={fetchSendersFromGmail}
                        >
                          {isLoadingSenders ? (
                            <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3 ml-1" />
                          )}
                          טען שולחים מ-Gmail
                        </Button>
                      ) : (
                        <p className="text-xs mt-1">
                          נדרש חיבור ל-Gmail כדי לטעון שולחים
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredSenders.map((sender) => (
                      <div key={sender.email} className="space-y-0">
                        <div
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${sender.linkedClientId ? "bg-green-50/50 border-green-200" : "hover:bg-muted/50 border-transparent"}`}
                        >
                          {!sender.linkedClientId && (
                            <Checkbox
                              checked={selectedSenders.has(sender.email)}
                              onCheckedChange={() => toggleSender(sender.email)}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {sender.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 cursor-pointer hover:bg-secondary/80"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedSenderEmail(
                                    expandedSenderEmail === sender.email
                                      ? null
                                      : sender.email,
                                  );
                                }}
                              >
                                {sender.count} הודעות
                                {expandedSenderEmail === sender.email ? (
                                  <ChevronUp className="h-2.5 w-2.5 mr-1" />
                                ) : (
                                  <ChevronDown className="h-2.5 w-2.5 mr-1" />
                                )}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {sender.email}
                            </div>
                          </div>
                          {sender.linkedClientId ? (
                            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                              <Link2 className="h-3 w-3 ml-1" />
                              {sender.linkedClientName}
                            </Badge>
                          ) : (
                            <div className="flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        handleAddSenderAsClient(sender)
                                      }
                                      disabled={isLinking}
                                    >
                                      <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    הוסף כלקוח חדש
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        setLinkDialogSender(sender)
                                      }
                                    >
                                      <Link2 className="h-3.5 w-3.5 text-purple-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    קשר ללקוח קיים
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                        {/* Expanded sender messages panel */}
                        {expandedSenderEmail === sender.email && (
                          <div className="mr-8 space-y-1 border-t pt-2 pb-1 px-2">
                            {(() => {
                              const senderMsgs = getMessagesForEmail(
                                sender.email,
                              );
                              if (senderMsgs.length === 0) {
                                return (
                                  <p className="text-xs text-muted-foreground py-2 text-center">
                                    לא נמצאו הודעות
                                  </p>
                                );
                              }
                              return senderMsgs.slice(0, 20).map((msg) => {
                                const msgDate = new Date(msg.date);
                                const dateStr = msgDate.toLocaleDateString(
                                  "he-IL",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                  },
                                );
                                return (
                                  <div
                                    key={msg.id}
                                    className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors text-xs"
                                    onClick={() => {
                                      window.open(
                                        `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
                                        "_blank",
                                      );
                                    }}
                                  >
                                    <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <span
                                          className={`truncate font-medium ${
                                            !msg.isRead
                                              ? "text-foreground"
                                              : "text-muted-foreground"
                                          }`}
                                        >
                                          {msg.subject || "(ללא נושא)"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                          {dateStr}
                                        </span>
                                      </div>
                                      <p className="text-muted-foreground truncate mt-0.5">
                                        {msg.snippet}
                                      </p>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                            {getMessagesForEmail(sender.email).length > 20 && (
                              <p className="text-[10px] text-muted-foreground text-center py-1">
                                מציג 20 מתוך{" "}
                                {getMessagesForEmail(sender.email).length}{" "}
                                הודעות
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* ─── Tab: Google Contacts ───────────────────────── */}
              <TabsContent value="google" className="mt-0">
                <div className="px-6 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!googleFetched ? (
                      <Button
                        size="sm"
                        onClick={handleFetchGoogle}
                        disabled={isLoadingGoogle}
                        className="text-xs h-8 bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoadingGoogle ? (
                          <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3 ml-1" />
                        )}
                        טען אנשי קשר מ-Google
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleFetchGoogle}
                          disabled={isLoadingGoogle}
                          className="text-xs h-8"
                        >
                          <RefreshCw
                            className={`h-3 w-3 ml-1 ${isLoadingGoogle ? "animate-spin" : ""}`}
                          />
                          רענון
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllGoogleContacts}
                          className="text-xs h-8"
                        >
                          <Check className="h-3 w-3 ml-1" />
                          {selectedGoogleContacts.size > 0
                            ? "נקה בחירה"
                            : "בחר הכל"}
                        </Button>
                        <Badge variant="secondary" className="text-xs">
                          {filteredGoogleContacts.length} אנשי קשר
                        </Badge>
                      </>
                    )}
                  </div>
                  {selectedGoogleContacts.size > 0 && (
                    <Button
                      size="sm"
                      onClick={handleImportSelected}
                      disabled={isImporting}
                      className="text-xs h-8 bg-green-600 hover:bg-green-700"
                    >
                      {isImporting ? (
                        <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                      ) : (
                        <UserPlus className="h-3 w-3 ml-1" />
                      )}
                      ייבא {selectedGoogleContacts.size} כלקוחות
                    </Button>
                  )}
                </div>
                <div className="px-6 pb-4 space-y-1">
                  {!isGoogleConnected && !isLoadingGoogle ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <WifiOff className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="mb-3 font-medium text-foreground">
                        לא מחובר ל-Google
                      </p>
                      <p className="text-xs mb-4">
                        יש להתחבר לחשבון Google כדי לטעון אנשי קשר
                      </p>
                      <Button
                        onClick={handleConnectGoogle}
                        disabled={isGoogleConnecting}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                      >
                        {isGoogleConnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogIn className="h-4 w-4" />
                        )}
                        התחבר ל-Google
                      </Button>
                    </div>
                  ) : !googleFetched && !isLoadingGoogle ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Globe className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="mb-2">לחץ כדי לטעון אנשי קשר מ-Google</p>
                      <p className="text-xs">נדרשת הרשאת גישה לאנשי הקשר שלך</p>
                    </div>
                  ) : isLoadingGoogle ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-blue-500" />
                      <p className="text-sm text-muted-foreground">
                        טוען אנשי קשר...
                      </p>
                    </div>
                  ) : filteredGoogleContacts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>לא נמצאו אנשי קשר</p>
                    </div>
                  ) : (
                    filteredGoogleContacts.map((contact) => {
                      const isAlreadyClient = clients.some(
                        (c) =>
                          c.email &&
                          contact.email &&
                          c.email.toLowerCase() === contact.email.toLowerCase(),
                      );
                      return (
                        <div
                          key={contact.resourceName}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isAlreadyClient ? "bg-green-50/50 border-green-200" : "hover:bg-muted/50 border-transparent"}`}
                        >
                          {!isAlreadyClient && (
                            <Checkbox
                              checked={selectedGoogleContacts.has(
                                contact.resourceName,
                              )}
                              onCheckedChange={() =>
                                toggleGoogleContact(contact.resourceName)
                              }
                            />
                          )}
                          {contact.photoUrl ? (
                            <img
                              src={contact.photoUrl}
                              alt={contact.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-700">
                                {contact.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {contact.name}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {contact.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3" />
                                  {contact.email}
                                </span>
                              )}
                              {contact.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {contact.phone}
                                </span>
                              )}
                              {contact.company && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {contact.company}
                                </span>
                              )}
                            </div>
                          </div>
                          {isAlreadyClient ? (
                            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                              <CheckCircle2 className="h-3 w-3 ml-1" />
                              לקוח קיים
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => importContactAsClient(contact)}
                              disabled={isImporting}
                            >
                              <UserPlus className="h-3 w-3 ml-1" />
                              ייבא
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* ─── Tab: Existing Clients ──────────────────────── */}
              <TabsContent value="clients" className="mt-0">
                <div className="px-6 py-2 flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {filteredClients.length} לקוחות
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchClients()}
                    disabled={isLoadingClients}
                    className="text-xs h-8"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ml-1 ${isLoadingClients ? "animate-spin" : ""}`}
                    />
                    רענון
                  </Button>
                </div>
                <div className="px-6 pb-4 space-y-1">
                  {isLoadingClients ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-blue-500" />
                      <p className="text-sm text-muted-foreground">
                        טוען לקוחות...
                      </p>
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>לא נמצאו לקוחות</p>
                    </div>
                  ) : (
                    filteredClients.map((client) => {
                      const senderData = senders.find(
                        (s) =>
                          client.email &&
                          s.email.toLowerCase() === client.email.toLowerCase(),
                      );
                      return (
                        <div key={client.id} className="space-y-0">
                          <div
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${senderData ? "bg-blue-50/50 border-blue-200" : "hover:bg-muted/50 border-transparent"}`}
                          >
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-indigo-700">
                                {client.name?.charAt(0) || "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {client.name}
                                </span>
                                {client.status && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5"
                                  >
                                    {client.status}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {client.email && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Mail className="h-3 w-3" />
                                    {client.email}
                                  </span>
                                )}
                                {client.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {client.phone}
                                  </span>
                                )}
                                {client.company && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {client.company}
                                  </span>
                                )}
                              </div>
                            </div>
                            {senderData ? (
                              <Badge
                                className="bg-blue-100 text-blue-700 border-blue-300 text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedClientId(
                                    expandedClientId === client.id
                                      ? null
                                      : client.id,
                                  );
                                }}
                              >
                                <Mail className="h-3 w-3 ml-1" />
                                {senderData.count} הודעות
                                {expandedClientId === client.id ? (
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                )}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs text-muted-foreground"
                              >
                                ללא מיילים
                              </Badge>
                            )}
                          </div>
                          {/* Expanded messages panel */}
                          {expandedClientId === client.id && client.email && (
                            <div className="mt-2 mr-11 space-y-1 border-t pt-2">
                              {(() => {
                                const clientMsgs = getMessagesForEmail(
                                  client.email!,
                                );
                                if (clientMsgs.length === 0) {
                                  return (
                                    <p className="text-xs text-muted-foreground py-2 text-center">
                                      לא נמצאו הודעות
                                    </p>
                                  );
                                }
                                return clientMsgs.slice(0, 20).map((msg) => {
                                  const isSent = !msg.from
                                    .toLowerCase()
                                    .includes(client.email!.toLowerCase());
                                  const msgDate = new Date(msg.date);
                                  const dateStr = msgDate.toLocaleDateString(
                                    "he-IL",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "2-digit",
                                    },
                                  );
                                  return (
                                    <div
                                      key={msg.id}
                                      className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors text-xs"
                                      onClick={() => {
                                        window.open(
                                          `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
                                          "_blank",
                                        );
                                      }}
                                    >
                                      <Mail
                                        className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                                          isSent
                                            ? "text-green-500"
                                            : "text-blue-500"
                                        }`}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <span
                                            className={`truncate font-medium ${
                                              !msg.isRead
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                            }`}
                                          >
                                            {msg.subject || "(ללא נושא)"}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground shrink-0">
                                            {dateStr}
                                          </span>
                                        </div>
                                        <p className="text-muted-foreground truncate mt-0.5">
                                          {msg.snippet}
                                        </p>
                                      </div>
                                      <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                    </div>
                                  );
                                });
                              })()}
                              {getMessagesForEmail(client.email!).length >
                                20 && (
                                <p className="text-[10px] text-muted-foreground text-center py-1">
                                  מציג 20 מתוך{" "}
                                  {getMessagesForEmail(client.email!).length}{" "}
                                  הודעות
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* ─── Tab: Smart Matching ────────────────────────── */}
              <TabsContent value="smart" className="mt-0">
                <div className="px-6 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllMatches}
                      className="text-xs h-8"
                      disabled={smartMatches.length === 0}
                    >
                      <Check className="h-3 w-3 ml-1" />
                      {selectedMatches.size > 0 ? "נקה בחירה" : "בחר הכל"}
                    </Button>
                    <Badge variant="secondary" className="text-xs">
                      {smartMatches.length} הצעות
                    </Badge>
                  </div>
                  {selectedMatches.size > 0 && (
                    <Button
                      size="sm"
                      onClick={handleApplySmartMatches}
                      disabled={isLinking}
                      className="text-xs h-8 bg-purple-600 hover:bg-purple-700"
                    >
                      {isLinking ? (
                        <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                      ) : (
                        <Link2 className="h-3 w-3 ml-1" />
                      )}
                      קשר {selectedMatches.size} נבחרים
                    </Button>
                  )}
                </div>
                <div className="px-6 pb-4 space-y-2">
                  {smartMatches.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="mb-2">לא נמצאו התאמות חכמות</p>
                      <p className="text-xs">
                        כל השולחים מקושרים, או שאין התאמות מתאימות
                      </p>
                    </div>
                  ) : (
                    smartMatches.map((match) => {
                      const key = `${match.sender.email}::${match.client.id}`;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-3 p-3 rounded-lg border border-purple-100 hover:bg-purple-50/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedMatches.has(key)}
                            onCheckedChange={() => toggleMatch(key)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {match.sender.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {match.sender.email}
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 ${match.confidence >= 80 ? "bg-green-50 text-green-700 border-green-300" : match.confidence >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-300" : "bg-orange-50 text-orange-700 border-orange-300"}`}
                            >
                              {match.confidence}%
                            </Badge>
                            <span className="text-[9px] text-muted-foreground">
                              {match.matchType === "exact-email"
                                ? "מייל זהה"
                                : match.matchType === "similar-email"
                                  ? "מייל דומה"
                                  : "שם דומה"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-medium truncate">
                              {match.client.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {match.client.email || "ללא מייל"}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* ─── Link to Client Overlay ─────────────────────── */}
            {linkDialogSender && (
              <div className="absolute inset-0 bg-background/95 flex flex-col z-10 rounded-lg">
                <div className="px-6 pt-6 pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Link2 className="h-5 w-5 text-purple-600" />
                      קישור {linkDialogSender.name} ללקוח
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLinkDialogSender(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    בחר לקוח לקישור עם {linkDialogSender.email}
                  </p>
                </div>
                <div className="px-6 py-2">
                  <Input
                    placeholder="חפש לקוח..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-1">
                  {filteredClients
                    .filter(
                      (c) => !c.email || c.email !== linkDialogSender.email,
                    )
                    .map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-purple-50/50 cursor-pointer transition-colors"
                        onClick={() =>
                          handleLinkSenderToClient(linkDialogSender, client.id)
                        }
                      >
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-indigo-700">
                            {client.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {client.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {client.email || "ללא מייל"}{" "}
                            {client.company && `• ${client.company}`}
                          </div>
                        </div>
                        <Link2 className="h-4 w-4 text-purple-500" />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
