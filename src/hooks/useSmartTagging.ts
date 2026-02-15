// Auto Smart Tagging System
// מערכת תיוג אוטומטי חכם ללקוחות

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";

export interface SmartTag {
  id: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
  criteria: TagCriteria;
}

export interface TagCriteria {
  type: "revenue" | "activity" | "age" | "tasks" | "meetings" | "custom";
  operator: "gt" | "lt" | "eq" | "between";
  value: number;
  value2?: number; // For 'between'
}

export interface TaggedClient {
  clientId: string;
  clientName: string;
  tags: string[];
  autoTags: string[];
}

// Built-in smart tag rules
const BUILT_IN_TAGS: SmartTag[] = [
  {
    id: "vip",
    label: "VIP",
    emoji: "⭐",
    color: "#d4a843",
    description: "לקוח עם הכנסות מעל ₪100,000",
    criteria: { type: "revenue", operator: "gt", value: 100000 },
  },
  {
    id: "premium",
    label: "פרמיום",
    emoji: "💎",
    color: "#8b5cf6",
    description: "לקוח עם הכנסות מעל ₪50,000",
    criteria: {
      type: "revenue",
      operator: "between",
      value: 50000,
      value2: 100000,
    },
  },
  {
    id: "new",
    label: "חדש",
    emoji: "🆕",
    color: "#3b82f6",
    description: "לקוח שנוצר ב-30 הימים האחרונים",
    criteria: { type: "age", operator: "lt", value: 30 },
  },
  {
    id: "at-risk",
    label: "בסיכון",
    emoji: "⚠️",
    color: "#ef4444",
    description: "לקוח ללא פעילות מעל 60 יום",
    criteria: { type: "activity", operator: "gt", value: 60 },
  },
  {
    id: "dormant",
    label: "רדום",
    emoji: "💤",
    color: "#6b7280",
    description: "לקוח ללא פעילות מעל 90 יום",
    criteria: { type: "activity", operator: "gt", value: 90 },
  },
  {
    id: "active-tasker",
    label: "פעיל במשימות",
    emoji: "🎯",
    color: "#10b981",
    description: "לקוח עם 5+ משימות פתוחות",
    criteria: { type: "tasks", operator: "gt", value: 5 },
  },
  {
    id: "frequent-meetings",
    label: "פגישות תכופות",
    emoji: "📅",
    color: "#0ea5e9",
    description: "לקוח עם 3+ פגישות החודש",
    criteria: { type: "meetings", operator: "gt", value: 3 },
  },
];

const STORAGE_KEY = "auto_smart_tags_config";

interface SmartTagConfig {
  enabled: boolean;
  autoApply: boolean;
  tags: SmartTag[];
  customTags: SmartTag[];
}

function loadConfig(): SmartTagConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    enabled: true,
    autoApply: false,
    tags: BUILT_IN_TAGS,
    customTags: [],
  };
}

function saveConfig(config: SmartTagConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function useSmartTagging() {
  const [config, setConfig] = useState<SmartTagConfig>(loadConfig);
  const [taggedClients, setTaggedClients] = useState<TaggedClient[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const updateConfig = useCallback((updates: Partial<SmartTagConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  const addCustomTag = useCallback((tag: SmartTag) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        customTags: [...prev.customTags, tag],
      };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  const removeCustomTag = useCallback((tagId: string) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        customTags: prev.customTags.filter((t) => t.id !== tagId),
      };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  const analyzeClients = useCallback(async () => {
    if (!config.enabled) return;

    setIsAnalyzing(true);

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch data
      const [
        { data: clients },
        { data: timeEntries },
        { data: tasks },
        { data: meetings },
        { data: invoices },
      ] = await Promise.all([
        supabase.from("clients").select("id, name, status, created_at, tags"),
        supabase.from("time_entries").select("client_id, start_time"),
        supabase.from("tasks").select("client_id, status, created_at"),
        supabase.from("meetings").select("client_id, date"),
        supabase.from("invoices").select("client_id, amount, status"),
      ]);

      // Pre-compute per-client data
      const clientRevenue = new Map<string, number>();
      const clientLastActivity = new Map<string, Date>();
      const clientOpenTasks = new Map<string, number>();
      const clientRecentMeetings = new Map<string, number>();

      // Revenue from invoices
      for (const inv of invoices || []) {
        if (
          inv.client_id &&
          (inv.status === "paid" || inv.status === "completed")
        ) {
          clientRevenue.set(
            inv.client_id,
            (clientRevenue.get(inv.client_id) || 0) + (inv.amount || 0),
          );
        }
      }

      // Last activity from time entries
      for (const entry of timeEntries || []) {
        if (entry.client_id) {
          const date = new Date(entry.start_time);
          const current = clientLastActivity.get(entry.client_id);
          if (!current || date > current) {
            clientLastActivity.set(entry.client_id, date);
          }
        }
      }

      // Open tasks count
      for (const task of tasks || []) {
        if (
          task.client_id &&
          task.status !== "completed" &&
          task.status !== "done"
        ) {
          clientOpenTasks.set(
            task.client_id,
            (clientOpenTasks.get(task.client_id) || 0) + 1,
          );
        }
      }

      // Recent meetings (last 30 days)
      for (const meeting of meetings || []) {
        if (meeting.client_id) {
          const date = new Date(meeting.date);
          if (date >= thirtyDaysAgo) {
            clientRecentMeetings.set(
              meeting.client_id,
              (clientRecentMeetings.get(meeting.client_id) || 0) + 1,
            );
          }
        }
      }

      // Apply tags to each client
      const allTags = [...config.tags, ...config.customTags];
      const results: TaggedClient[] = [];

      for (const client of clients || []) {
        const revenue = clientRevenue.get(client.id) || 0;
        const lastActivity = clientLastActivity.get(client.id);
        const daysSinceActivity = lastActivity
          ? differenceInDays(now, lastActivity)
          : differenceInDays(now, new Date(client.created_at));
        const clientAge = differenceInDays(now, new Date(client.created_at));
        const openTasks = clientOpenTasks.get(client.id) || 0;
        const recentMeetings = clientRecentMeetings.get(client.id) || 0;

        const matchedTags: string[] = [];

        for (const tag of allTags) {
          let value: number;
          switch (tag.criteria.type) {
            case "revenue":
              value = revenue;
              break;
            case "activity":
              value = daysSinceActivity;
              break;
            case "age":
              value = clientAge;
              break;
            case "tasks":
              value = openTasks;
              break;
            case "meetings":
              value = recentMeetings;
              break;
            default:
              continue;
          }

          let matches = false;
          switch (tag.criteria.operator) {
            case "gt":
              matches = value > tag.criteria.value;
              break;
            case "lt":
              matches = value < tag.criteria.value;
              break;
            case "eq":
              matches = value === tag.criteria.value;
              break;
            case "between":
              matches =
                value >= tag.criteria.value &&
                value <= (tag.criteria.value2 || Infinity);
              break;
          }

          if (matches) {
            matchedTags.push(`${tag.emoji} ${tag.label}`);
          }
        }

        if (matchedTags.length > 0) {
          results.push({
            clientId: client.id,
            clientName: client.name || "ללא שם",
            tags: client.tags || [],
            autoTags: matchedTags,
          });
        }
      }

      setTaggedClients(results);

      // Auto-apply tags to Supabase if enabled
      if (config.autoApply) {
        let updated = 0;
        for (const result of results) {
          const existingTags = result.tags || [];
          const newTags = result.autoTags.filter(
            (t) => !existingTags.includes(t),
          );

          if (newTags.length > 0) {
            const { error } = await supabase
              .from("clients")
              .update({ tags: [...existingTags, ...newTags] })
              .eq("id", result.clientId);

            if (!error) updated++;
          }
        }

        if (updated > 0) {
          toast({
            title: `תיוג אוטומטי הושלם`,
            description: `עודכנו ${updated} לקוחות עם תגיות חדשות`,
          });
        }
      }

      return results;
    } catch (err) {
      console.error("[SmartTagging] Error:", err);
      toast({
        title: "שגיאה בתיוג אוטומטי",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [config, toast]);

  // Run analysis on mount if enabled
  useEffect(() => {
    if (config.enabled) {
      analyzeClients();
    }
  }, []);

  return {
    config,
    taggedClients,
    isAnalyzing,
    updateConfig,
    addCustomTag,
    removeCustomTag,
    analyzeClients,
    allTags: [...config.tags, ...config.customTags],
    tagSummary: {
      vip: taggedClients.filter((c) =>
        c.autoTags.some((t) => t.includes("VIP")),
      ).length,
      atRisk: taggedClients.filter((c) =>
        c.autoTags.some((t) => t.includes("בסיכון")),
      ).length,
      newClients: taggedClients.filter((c) =>
        c.autoTags.some((t) => t.includes("חדש")),
      ).length,
      total: taggedClients.length,
    },
  };
}
