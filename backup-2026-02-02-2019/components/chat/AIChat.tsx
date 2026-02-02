/**
 * AI Chat Component - צ'אט AI חכם V2
 * מערכת משופרת עם הבנת עברית מתקדמת והצעות חכמות
 */

import { useState, useRef, useEffect } from 'react';
import { aiChatService, ChatMessage } from '@/services/aiChatServiceV2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  Loader2,
  User,
  Sparkles,
  TrendingUp,
  Zap,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SUGGESTED_QUERIES = [
  'כמה לקוחות יש במערכת?',
  'כמה שעות עבדתי היום?',
  'מה ההכנסות החודש?',
  'יש משימות באיחור?',
  'פגישות השבוע?',
  'סיכום יומי',
];

export function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 שלום! אני הצ\'אט החכם של המערכת.\n\nאני מבין עברית ומחובר לכל הנתונים!\n\nנסה לשאול אותי על לקוחות, פרויקטים, משימות, זמנים ועוד...',
      timestamp: new Date(),
      suggestions: ['כמה לקוחות יש?', 'משימות באיחור', 'סיכום יומי'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSuggestions, setLastSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // אתחול ה-AI בטעינת הקומפוננטה
    aiChatService.initialize().then(() => {
      setIsInitialized(true);
    });
  }, []);

  useEffect(() => {
    // גלילה אוטומטית למטה
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLastSuggestions([]);

    try {
      const response = await aiChatService.processQuery(input);
      setMessages(prev => [...prev, response]);
      // שמירת ההצעות מהתשובה
      if (response.suggestions && response.suggestions.length > 0) {
        setLastSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'מצטער, קרתה שגיאה. נסה שוב 😕',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
    // שליחה אוטומטית של ההצעה
    setTimeout(() => {
      const fakeEvent = { key: 'Enter', shiftKey: false } as React.KeyboardEvent;
      handleKeyPress(fakeEvent);
    }, 100);
  };

  const handleSuggestionClick = async (query: string) => {
    setInput(query);
    setLastSuggestions([]);
    // שליחה אוטומטית
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await aiChatService.processQuery(query);
      setMessages(prev => [...prev, response]);
      if (response.suggestions && response.suggestions.length > 0) {
        setLastSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="h-8 w-8 text-primary" />
            {isInitialized && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              צ'אט AI חכם
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </h2>
            <p className="text-sm text-muted-foreground">
              {isInitialized ? 'מחובר לכל הנתונים במערכת' : 'טוען נתונים...'}
            </p>
          </div>
        </div>

        <Badge variant="secondary" className="gap-1">
          <Zap className="h-3 w-3" />
          מהיר ומדויק
        </Badge>
      </div>

      {/* Chat Card */}
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-4 w-4" />
            שיחה
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {/* Messages */}
          <ScrollArea ref={scrollRef} className="h-[500px] p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3 animate-in slide-in-from-bottom-2',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                    </div>
                  )}

                  <div
                    className={cn(
                      'rounded-lg px-4 py-3 max-w-[80%]',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    <div
                      className={cn(
                        'text-xs mt-2 opacity-70',
                        message.role === 'user' ? 'text-left' : 'text-right'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce delay-100" />
                      <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Suggestions from last response */}
              {!isLoading && lastSuggestions.length > 0 && (
                <div className="flex gap-3 animate-in fade-in-50">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lastSuggestions.map((suggestion, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Initial Suggested Queries */}
          {messages.length <= 2 && lastSuggestions.length === 0 && (
            <div className="border-t p-4 bg-muted/20">
              <p className="text-xs text-muted-foreground mb-2">🚀 שאלות מוצעות:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUERIES.map((query, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(query)}
                    className="text-xs"
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="שאל משהו... (לדוגמה: 'כמה לקוחות יש?')"
                disabled={isLoading || !isInitialized}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !isInitialized}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {!isInitialized && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                טוען נתונים מהמערכת...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">💡 טיפ:</p>
              <p className="text-xs text-muted-foreground">
                הצ'אט מחובר לכל הנתונים במערכת ויכול לשלוף מידע מהר!
                נסה לשאול על לקוחות, פרויקטים, זמנים, הכנסות, משימות ועוד.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
