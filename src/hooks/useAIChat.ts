/**
 * AI Chat Hook V2 - Enhanced with ACTION parsing and full CRM capabilities
 * Uses Lovable AI Gateway with streaming + aiChatActionsService for action execution
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { aiChatActionsService } from '@/services/aiChatActionsService';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface CRMContext {
  clientsCount: number;
  projectsCount: number;
  activeProjectsCount?: number;
  tasksCount: number;
  pendingTasksCount?: number;
  overdueTasks: number;
  overdueTasksList?: string;
  todaysTasks?: string;
  meetingsToday: number;
  upcomingMeetings?: string;
  monthlyRevenue: number;
  hoursToday: number;
  weeklyHours?: number;
  recentClients?: string;
  recentActivity?: string;
  clientSearch?: string;
  searchedClients?: ClientSearchResult[];
}

interface ClientSearchResult {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface ParsedAction {
  actionName: string;
  params: Record<string, any>;
  raw: string;
}

// Parse [ACTION:name:{...}] blocks from AI response
function parseActionsFromResponse(text: string): { cleanText: string; actions: ParsedAction[] } {
  const actionRegex = /\[ACTION:(\w+):(\{[^[\]]*?\})\]/g;
  const actions: ParsedAction[] = [];
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const params = JSON.parse(match[2]);
      actions.push({
        actionName: match[1],
        params,
        raw: match[0],
      });
    } catch (e) {
      console.error('Failed to parse action params:', match[0], e);
    }
  }

  // Strip action blocks from display text
  const cleanText = text.replace(/\[ACTION:\w+:\{[^[\]]*?\}]\s*/g, '').trim();

  return { cleanText, actions };
}

// Smart name matching - handles reversed names
function normalizeNameForSearch(name: string): string[] {
  const clean = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  const variations: string[] = [clean];

  if (parts.length >= 2) {
    variations.push([...parts].reverse().join(' '));
    parts.forEach(part => {
      if (part.length >= 2) variations.push(part);
    });
  }

  return [...new Set(variations)];
}

// Extract client name from user message for context search
function extractClientNameFromMessage(message: string): string | null {
  const patterns = [
    /פגישה\s+(?:עם|ל)\s+(.+?)(?:\s+ב|\s+מחר|\s+היום|$)/i,
    /לקבוע\s+(?:פגישה\s+)?(?:עם|ל)\s+(.+?)(?:\s+ב|\s+מחר|\s+היום|$)/i,
    /(?:מצא|חפש|מידע על|פרטים של|פרטי)\s+(?:לקוח\s+)?(.+?)(?:\s+בבקשה|$)/i,
    /(?:התקשר|שלח מייל|שלח הודעה)\s+(?:ל|אל)\s+(.+?)(?:\s+בבקשה|$)/i,
    /(?:מי זה|מה עם|סטטוס של)\s+(.+?)(?:\?|$)/i,
    /(?:משימה|פרויקט|שעות)\s+(?:ל|של|עבור)\s+(.+?)(?:\s|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/[?,!.]+$/, '');
    }
  }

  return null;
}

// Kept for reference but no longer used as fast-path
// All actions now go through AI → ACTION parsing → aiChatActionsService

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 שלום! אני העוזר החכם של המערכת.\n\n**מה אני יכול לעשות:**\n- 📊 מידע על לקוחות, פרויקטים, משימות ופגישות\n- ✅ ליצור, לעדכן ולמחוק משימות\n- 📅 לקבוע, לעדכן ולבטל פגישות\n- 👥 ליצור לקוחות חדשים ולחפש קיימים\n- 📁 ליצור פרויקטים\n- 📧 לשלוח מיילים ללקוחות\n- 🔔 ליצור תזכורות\n- ⏱️ לרשום שעות עבודה\n- 💰 דוחות הכנסות ותובנות עסקיות\n\n**דוגמאות:**\n"צור משימה להתקשר ללקוח עם עדיפות גבוהה"\n"קבע פגישה עם דוד כהן מחר ב-14:00"\n"שלח מייל לישראל ישראלי על עדכון הפרויקט"\n"כמה שעות עבדתי השבוע?"\n\nשאל אותי משהו! 🚀',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch comprehensive CRM context for the AI
  const fetchContext = useCallback(async (userMessage?: string): Promise<CRMContext> => {
    try {
      const now = new Date();
      const today = new Date(now);
      const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfToday = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Start of week (Sunday)
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const [
        clientsRes,
        projectsRes,
        activeProjectsRes,
        tasksRes,
        pendingTasksRes,
        overdueTasksRes,
        overdueTasksListRes,
        todaysTasksRes,
        meetingsTodayRes,
        upcomingMeetingsRes,
        invoicesRes,
        timeEntriesTodayRes,
        weeklyTimeRes,
        recentClientsRes,
        recentActivityRes,
      ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('tasks').select('id', { count: 'exact', head: true })
          .lt('due_date', new Date().toISOString())
          .neq('status', 'completed'),
        supabase.from('tasks').select('title, due_date, priority')
          .lt('due_date', new Date().toISOString())
          .neq('status', 'completed')
          .order('due_date', { ascending: true })
          .limit(5),
        supabase.from('tasks').select('title, priority, status')
          .gte('due_date', startOfToday)
          .lte('due_date', endOfToday)
          .neq('status', 'completed')
          .limit(5),
        supabase.from('meetings').select('id', { count: 'exact', head: true })
          .gte('start_time', startOfToday)
          .lte('start_time', endOfToday),
        supabase.from('meetings').select('title, start_time, client_id')
          .gte('start_time', startOfToday)
          .order('start_time', { ascending: true })
          .limit(5),
        supabase.from('invoices').select('amount')
          .gte('created_at', startOfMonth)
          .eq('status', 'paid'),
        supabase.from('time_entries').select('duration_minutes')
          .gte('start_time', startOfToday),
        supabase.from('time_entries').select('duration_minutes')
          .gte('start_time', startOfWeek.toISOString()),
        supabase.from('clients').select('name')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('tasks').select('title, status, updated_at')
          .order('updated_at', { ascending: false })
          .limit(3),
      ]);

      const monthlyRevenue = (invoicesRes.data || []).reduce(
        (sum, inv) => sum + (inv.amount || 0), 0
      );

      const hoursToday = (timeEntriesTodayRes.data || []).reduce(
        (sum, entry) => sum + ((entry as any).duration_minutes || 0) / 60, 0
      );

      const weeklyHours = (weeklyTimeRes.data || []).reduce(
        (sum, entry) => sum + ((entry as any).duration_minutes || 0) / 60, 0
      );

      const recentClients = (recentClientsRes.data || [])
        .map(c => c.name).join(', ');

      // Format overdue tasks list
      const overdueTasksList = (overdueTasksListRes.data || [])
        .map(t => `- ${t.title} (עדיפות: ${t.priority || 'רגילה'}, יעד: ${t.due_date ? new Date(t.due_date).toLocaleDateString('he-IL') : 'לא נקבע'})`)
        .join('\n');

      // Format today's tasks
      const todaysTasks = (todaysTasksRes.data || [])
        .map(t => `- ${t.title} (${t.status === 'pending' ? 'ממתינה' : t.status === 'in_progress' ? 'בביצוע' : t.status})`)
        .join('\n');

      // Format upcoming meetings
      const upcomingMeetings = (upcomingMeetingsRes.data || [])
        .map(m => {
          const time = new Date(m.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
          return `- ${m.title} ב-${time}`;
        })
        .join('\n');

      // Format recent activity
      const recentActivity = (recentActivityRes.data || [])
        .map(t => `- ${t.title}: ${t.status === 'completed' ? 'הושלמה' : t.status}`)
        .join('\n');

      // Smart client search
      let clientSearch: string | undefined;
      let searchedClients: ClientSearchResult[] = [];

      if (userMessage) {
        const extractedName = extractClientNameFromMessage(userMessage);
        if (extractedName) {
          clientSearch = extractedName;
          const nameVariations = normalizeNameForSearch(extractedName);
          const { data: clients } = await supabase
            .from('clients')
            .select('id, name, email, phone, company');

          if (clients) {
            const scoredClients = clients.map(client => {
              const clientNameLower = client.name.toLowerCase();
              let score = 0;
              for (const variation of nameVariations) {
                if (clientNameLower === variation) { score = 100; break; }
                else if (clientNameLower.includes(variation)) { score = Math.max(score, 80); }
                else if (variation.split(' ').some(part => part.length >= 2 && clientNameLower.includes(part))) {
                  score = Math.max(score, 60);
                }
              }
              return { ...client, score };
            }).filter(c => c.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 5);

            searchedClients = scoredClients.map(({ score, ...client }) => client);
          }
        }
      }

      return {
        clientsCount: clientsRes.count || 0,
        projectsCount: projectsRes.count || 0,
        activeProjectsCount: activeProjectsRes.count || 0,
        tasksCount: tasksRes.count || 0,
        pendingTasksCount: pendingTasksRes.count || 0,
        overdueTasks: overdueTasksRes.count || 0,
        overdueTasksList: overdueTasksList || undefined,
        todaysTasks: todaysTasks || undefined,
        meetingsToday: meetingsTodayRes.count || 0,
        upcomingMeetings: upcomingMeetings || undefined,
        monthlyRevenue,
        hoursToday,
        weeklyHours,
        recentClients,
        recentActivity: recentActivity || undefined,
        clientSearch,
        searchedClients,
      };
    } catch (err) {
      console.error('Error fetching context:', err);
      return {
        clientsCount: 0,
        projectsCount: 0,
        tasksCount: 0,
        overdueTasks: 0,
        meetingsToday: 0,
        monthlyRevenue: 0,
        hoursToday: 0,
      };
    }
  }, []);

  // Execute parsed actions from AI response via aiChatActionsService
  const executeActions = useCallback(async (actions: ParsedAction[]): Promise<string[]> => {
    const results: string[] = [];

    for (const action of actions) {
      try {
        console.log(`Executing AI action: ${action.actionName}`, action.params);
        const result = await aiChatActionsService.executeAction(action.actionName, action.params);

        if (result.success) {
          toast.success(result.message);
          results.push(`✅ ${result.message}`);
        } else {
          toast.error(result.message);
          results.push(`❌ ${result.message}`);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
        console.error(`Action ${action.actionName} failed:`, err);
        toast.error(`שגיאה בביצוע פעולה: ${errMsg}`);
        results.push(`❌ שגיאה: ${errMsg}`);
      }
    }

    return results;
  }, []);

  // Send message with streaming
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantId = crypto.randomUUID();
    setMessages(prev => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    try {
      // Fetch rich context with user message for smart search
      const context = await fetchContext(content.trim());

      // Prepare messages for API (excluding streaming flags)
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Create abort controller
      abortControllerRef.current = new AbortController();

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, context }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'שגיאה בשליחת ההודעה');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Process streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              // Display text while streaming - strip any partial ACTION blocks for cleaner display
              const displayText = assistantContent.replace(/\[ACTION:\w+:\{[^[\]]*?\}]\s*/g, '').trim();
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: displayText || assistantContent }
                    : m
                )
              );
            }
          } catch {
            // Incomplete JSON, put back and wait
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // After streaming is complete, parse actions from the full response
      const { cleanText, actions } = parseActionsFromResponse(assistantContent);

      // Execute any actions detected
      let actionResultsText = '';
      if (actions.length > 0) {
        const results = await executeActions(actions);
        if (results.length > 0) {
          actionResultsText = '\n\n---\n' + results.join('\n');
        }
      }

      // Final update - show clean text + action results
      const finalContent = (cleanText || 'מצטער, לא הצלחתי לעבד את הבקשה.') + actionResultsText;
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: finalContent, isStreaming: false }
            : m
        )
      );
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(errorMsg);

      // Update assistant message with error
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `😕 ${errorMsg}`, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, fetchContext, executeActions]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '👋 שלום! אני העוזר החכם של המערכת.\n\nאני יכול לעזור לך עם מידע, לבצע פעולות ולנתח נתונים.\n\nשאל אותי משהו! 🚀',
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopStreaming,
    clearChat,
  };
}
