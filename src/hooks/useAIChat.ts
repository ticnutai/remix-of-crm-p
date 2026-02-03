/**
 * AI Chat Hook - שימוש ב-Lovable AI Gateway עם Streaming
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  tasksCount: number;
  overdueTasks: number;
  meetingsToday: number;
  monthlyRevenue: number;
  hoursToday: number;
  recentClients?: string;
  upcomingMeetings?: string;
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

// Smart name matching - handles reversed names
function normalizeNameForSearch(name: string): string[] {
  // Remove extra spaces and normalize
  const clean = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  
  // Return original and reversed versions
  const variations: string[] = [clean];
  
  if (parts.length >= 2) {
    // Add reversed version: "יוסי אשכנזי" => "אשכנזי יוסי"
    variations.push(parts.reverse().join(' '));
    
    // Add individual parts for partial matching
    parts.forEach(part => {
      if (part.length >= 2) variations.push(part);
    });
  }
  
  return [...new Set(variations)];
}

// Extract client name from user message
function extractClientNameFromMessage(message: string): string | null {
  // Patterns to extract client names
  const patterns = [
    /פגישה\s+(?:עם|ל)\s+(.+?)(?:\s+ב|\s+מחר|\s+היום|$)/i,
    /לקבוע\s+(?:פגישה\s+)?(?:עם|ל)\s+(.+?)(?:\s+ב|\s+מחר|\s+היום|$)/i,
    /(?:מצא|חפש|מידע על|פרטים של|פרטי)\s+(?:לקוח\s+)?(.+?)(?:\s+בבקשה|$)/i,
    /(?:התקשר|שלח מייל|שלח הודעה)\s+(?:ל|אל)\s+(.+?)(?:\s+בבקשה|$)/i,
    /(?:מי זה|מה עם|סטטוס של)\s+(.+?)(?:\?|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted name
      return match[1].trim().replace(/[?,!.]+$/, '');
    }
  }
  
  return null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 שלום! אני העוזר החכם של המערכת.\n\nאני יכול לעזור לך עם מידע על לקוחות, פרויקטים, משימות, פגישות והכנסות.\n\nשאל אותי משהו! 🚀',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch CRM context for the AI
  const fetchContext = useCallback(async (userMessage?: string): Promise<CRMContext> => {
    try {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfToday = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      const [
        clientsRes,
        projectsRes,
        tasksRes,
        overdueTasksRes,
        meetingsTodayRes,
        invoicesRes,
        timeEntriesTodayRes,
        recentClientsRes,
      ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true })
          .lt('due_date', new Date().toISOString())
          .neq('status', 'completed'),
        supabase.from('meetings').select('id', { count: 'exact', head: true })
          .gte('start_time', startOfToday)
          .lte('start_time', endOfToday),
        supabase.from('invoices').select('amount')
          .gte('created_at', startOfMonth)
          .eq('status', 'paid'),
        supabase.from('time_entries').select('duration_minutes')
          .gte('start_time', startOfToday),
        supabase.from('clients').select('name')
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const monthlyRevenue = (invoicesRes.data || []).reduce(
        (sum, inv) => sum + (inv.amount || 0),
        0
      );

      const hoursToday = (timeEntriesTodayRes.data || []).reduce(
        (sum, entry) => sum + ((entry as any).duration_minutes || 0) / 60,
        0
      );

      const recentClients = (recentClientsRes.data || [])
        .map(c => c.name)
        .join(', ');

      // Smart client search if user message contains a name
      let clientSearch: string | undefined;
      let searchedClients: ClientSearchResult[] = [];
      
      if (userMessage) {
        const extractedName = extractClientNameFromMessage(userMessage);
        if (extractedName) {
          clientSearch = extractedName;
          const nameVariations = normalizeNameForSearch(extractedName);
          
          // Search for clients with any of the name variations
          const { data: clients } = await supabase
            .from('clients')
            .select('id, name, email, phone, company');
          
          if (clients) {
            // Score each client based on name match
            const scoredClients = clients.map(client => {
              const clientNameLower = client.name.toLowerCase();
              let score = 0;
              
              for (const variation of nameVariations) {
                if (clientNameLower === variation) {
                  score = 100; // Exact match
                  break;
                } else if (clientNameLower.includes(variation)) {
                  score = Math.max(score, 80); // Contains variation
                } else if (variation.split(' ').some(part => 
                  part.length >= 2 && clientNameLower.includes(part)
                )) {
                  score = Math.max(score, 60); // Partial match
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
        tasksCount: tasksRes.count || 0,
        overdueTasks: overdueTasksRes.count || 0,
        meetingsToday: meetingsTodayRes.count || 0,
        monthlyRevenue,
        hoursToday,
        recentClients,
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
      // Fetch context with user message for smart search
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
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: assistantContent }
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

      // Final update - remove streaming flag
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: assistantContent || 'מצטער, לא הצלחתי לעבד את הבקשה.', isStreaming: false }
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
  }, [messages, isLoading, fetchContext]);

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
        content: '👋 שלום! אני העוזר החכם של המערכת.\n\nאני יכול לעזור לך עם מידע על לקוחות, פרויקטים, משימות, פגישות והכנסות.\n\nשאל אותי משהו! 🚀',
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
