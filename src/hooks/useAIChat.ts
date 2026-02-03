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

// Smart action detection
interface SmartAction {
  type: 'send_email' | 'create_task' | 'schedule_meeting' | 'search_client' | 'none';
  data: Record<string, any>;
}

function detectSmartAction(message: string): SmartAction {
  const lowerMessage = message.toLowerCase();
  
  // Email patterns: "שלח מייל ל[לקוח] על [נושא]" or "שלח אימייל ל[כתובת]"
  const emailPatterns = [
    /שלח\s+(?:מייל|אימייל|דואר)\s+(?:ל|אל)\s*([^\s,]+(?:@[^\s,]+)?)\s*(?:על|בנושא|עם הודעה)?\s*(.*)?/i,
    /(?:מייל|אימייל)\s+(?:ל|אל)\s*([^\s,]+(?:@[^\s,]+)?)\s*(?:על|בנושא|עם הודעה)?\s*(.*)?/i,
  ];
  
  for (const pattern of emailPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        type: 'send_email',
        data: {
          recipient: match[1]?.trim(),
          subject: match[2]?.trim() || '',
        }
      };
    }
  }
  
  // Task patterns: "צור משימה [תיאור]" or "הוסף משימה [תיאור]"
  const taskPatterns = [
    /(?:צור|הוסף|תוסיף)\s+משימה\s*:?\s*(.+)/i,
    /משימה\s+(?:חדשה|ל)\s*:?\s*(.+)/i,
  ];
  
  for (const pattern of taskPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        type: 'create_task',
        data: {
          title: match[1]?.trim(),
        }
      };
    }
  }
  
  // Meeting patterns: "קבע פגישה עם [לקוח] מחר/היום"
  const meetingPatterns = [
    /(?:קבע|תקבע|קבעי)\s+פגישה\s+(?:עם|ל)\s+(.+?)(?:\s+(?:מחר|היום|ב|ל)(.*))?$/i,
    /פגישה\s+(?:עם|ל)\s+(.+?)(?:\s+(?:מחר|היום|ב|ל)(.*))?$/i,
  ];
  
  for (const pattern of meetingPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        type: 'schedule_meeting',
        data: {
          clientName: match[1]?.trim(),
          when: match[2]?.trim() || 'מחר',
        }
      };
    }
  }
  
  return { type: 'none', data: {} };
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
const SEND_EMAIL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reminder-email`;

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 שלום! אני העוזר החכם של המערכת.\n\n**מה אני יכול לעשות:**\n- 📊 מידע על לקוחות, פרויקטים, משימות, פגישות והכנסות\n- 📧 **שלח מייל ל[שם/כתובת]** - שליחת אימייל ללקוח\n- ✅ **צור משימה: [תיאור]** - יצירת משימה חדשה\n- 📅 **קבע פגישה עם [לקוח] מחר** - קביעת פגישה\n\nשאל אותי משהו! 🚀',
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

  // Handle smart actions (email, task, meeting)
  const handleSmartAction = useCallback(async (action: SmartAction, assistantId: string): Promise<boolean> => {
    if (action.type === 'none') return false;
    
    try {
      switch (action.type) {
        case 'send_email': {
          const { recipient, subject } = action.data;
          
          // First, try to find client by name if not an email address
          let email = recipient;
          let clientName = recipient;
          
          if (!recipient.includes('@')) {
            // Search for client
            const { data: clients } = await supabase
              .from('clients')
              .select('id, name, email')
              .ilike('name', `%${recipient}%`)
              .limit(1);
            
            if (clients && clients.length > 0 && clients[0].email) {
              email = clients[0].email;
              clientName = clients[0].name;
            } else {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: `⚠️ לא מצאתי את הלקוח "${recipient}" או שאין לו כתובת מייל במערכת.\n\nאנא ציין כתובת מייל מלאה או בדוק את שם הלקוח.`, isStreaming: false }
                    : m
                )
              );
              return true;
            }
          }
          
          // Send email
          const response = await fetch(SEND_EMAIL_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              to: email,
              title: subject || 'הודעה ממערכת CRM',
              message: subject || 'שלום, זוהי הודעה אוטומטית ממערכת ה-CRM.',
              userName: clientName,
            }),
          });
          
          if (response.ok) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: `✅ **המייל נשלח בהצלחה!**\n\n📧 **נמען:** ${clientName} (${email})\n📝 **נושא:** ${subject || 'הודעה ממערכת CRM'}\n\nהמייל נשלח לכתובת הלקוח.`, isStreaming: false }
                  : m
              )
            );
          } else {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: `❌ שגיאה בשליחת המייל. נסה שוב מאוחר יותר.`, isStreaming: false }
                  : m
              )
            );
          }
          return true;
        }
        
        case 'create_task': {
          const { title } = action.data;
          
          const { data, error } = await supabase
            .from('tasks')
            .insert({
              title: title,
              status: 'pending',
              priority: 'medium',
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Week from now
            })
            .select()
            .single();
          
          if (data && !error) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: `✅ **משימה נוצרה בהצלחה!**\n\n📋 **כותרת:** ${title}\n📅 **תאריך יעד:** שבוע מהיום\n⚡ **עדיפות:** בינונית\n\nתוכל לצפות במשימה בדף המשימות.`, isStreaming: false }
                  : m
              )
            );
          } else {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: `❌ שגיאה ביצירת המשימה: ${error?.message || 'שגיאה לא ידועה'}`, isStreaming: false }
                  : m
              )
            );
          }
          return true;
        }
        
        case 'schedule_meeting': {
          const { clientName, when } = action.data;
          
          // Find client
          const { data: clients } = await supabase
            .from('clients')
            .select('id, name')
            .ilike('name', `%${clientName}%`)
            .limit(1);
          
          if (!clients || clients.length === 0) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: `⚠️ לא מצאתי את הלקוח "${clientName}" במערכת.\n\nאנא בדוק את שם הלקוח ונסה שוב.`, isStreaming: false }
                  : m
              )
            );
            return true;
          }
          
          // Calculate meeting time
          let startTime = new Date();
          if (when.includes('מחר')) {
            startTime.setDate(startTime.getDate() + 1);
          }
          startTime.setHours(10, 0, 0, 0); // Default to 10:00
          
          const endTime = new Date(startTime);
          endTime.setHours(endTime.getHours() + 1);
          
          const { data, error } = await supabase
            .from('meetings')
            .insert({
              title: `פגישה עם ${clients[0].name}`,
              client_id: clients[0].id,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              status: 'scheduled',
            })
            .select()
            .single();
          
          if (data && !error) {
            const dateStr = startTime.toLocaleDateString('he-IL', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            });
            const timeStr = startTime.toLocaleTimeString('he-IL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: `✅ **פגישה נקבעה בהצלחה!**\n\n👤 **לקוח:** ${clients[0].name}\n📅 **תאריך:** ${dateStr}\n🕐 **שעה:** ${timeStr}\n⏱️ **משך:** שעה\n\nהפגישה נוספה ליומן.`, isStreaming: false }
                  : m
              )
            );
          } else {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: `❌ שגיאה בקביעת הפגישה: ${error?.message || 'שגיאה לא ידועה'}`, isStreaming: false }
                  : m
              )
            );
          }
          return true;
        }
        
        default:
          return false;
      }
    } catch (err) {
      console.error('Smart action error:', err);
      return false;
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
      // Detect smart actions first
      const smartAction = detectSmartAction(content.trim());
      
      // Handle smart action if detected
      if (smartAction.type !== 'none') {
        const handled = await handleSmartAction(smartAction, assistantId);
        if (handled) {
          setIsLoading(false);
          return;
        }
      }
      
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
  }, [messages, isLoading, fetchContext, handleSmartAction]);

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
