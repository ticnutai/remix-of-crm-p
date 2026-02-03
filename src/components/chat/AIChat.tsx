/**
 * AI Chat Component - צ'אט AI חכם עם Lovable AI
 * Streaming responses + Hebrew support
 */

import { useState, useRef, useEffect } from 'react';
import { useAIChat, ChatMessage } from '@/hooks/useAIChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Send,
  Loader2,
  User,
  Sparkles,
  TrendingUp,
  Zap,
  Lightbulb,
  Trash2,
  StopCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SUGGESTED_QUERIES = [
  { text: 'כמה לקוחות יש במערכת?', icon: '👥' },
  { text: 'מה המשימות באיחור?', icon: '⚠️' },
  { text: 'פגישות להיום', icon: '📅' },
  { text: 'סיכום הכנסות החודש', icon: '💰' },
  { text: 'כמה שעות עבדתי היום?', icon: '⏱️' },
  { text: 'תן לי סיכום כללי', icon: '📊' },
];

export function AIChat() {
  const { messages, isLoading, error, sendMessage, stopStreaming, clearChat } = useAIChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput('');
    await sendMessage(message);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = async (query: string) => {
    setInput('');
    await sendMessage(query);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              צ'אט AI חכם
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </h2>
            <p className="text-sm text-muted-foreground">
              מופעל על ידי Lovable AI • עברית מלאה
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            נקה צ'אט
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            מהיר
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Chat Card */}
      <Card className="shadow-lg border-2">
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            שיחה
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {/* Messages */}
          <ScrollArea ref={scrollRef} className="h-[450px]">
            <div className="p-4 space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role === 'assistant' && 
               messages[messages.length - 1]?.isStreaming && (
                <div className="flex justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopStreaming}
                    className="text-muted-foreground gap-1"
                  >
                    <StopCircle className="h-4 w-4" />
                    עצור
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Queries - Show only at start */}
          {messages.length <= 2 && (
            <div className="border-t p-4 bg-muted/20">
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                שאלות מוצעות:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUERIES.map((query, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(query.text)}
                    disabled={isLoading}
                    className="text-xs gap-1.5 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                  >
                    <span>{query.icon}</span>
                    {query.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4 bg-background">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="שאל משהו... (לדוגמה: 'כמה לקוחות יש?')"
                disabled={isLoading}
                className="flex-1"
                autoComplete="off"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-l from-primary/5 to-background border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">💡 טיפים לשימוש</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• שאל על לקוחות, פרויקטים, משימות, פגישות והכנסות</li>
                <li>• השתמש בעברית טבעית - ה-AI מבין עברית מלאה</li>
                <li>• התשובות מבוססות על נתונים אמיתיים מהמערכת</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div
      className={cn(
        'flex gap-3 animate-in slide-in-from-bottom-2 duration-300',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center',
            isUser ? 'bg-primary' : 'bg-gradient-to-br from-primary/20 to-primary/5'
          )}
        >
          {isUser ? (
            <User className="h-4 w-4 text-primary-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-primary" />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'rounded-2xl px-4 py-3 max-w-[85%] shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 list-disc list-inside">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 list-decimal list-inside">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>
                ),
              }}
            >
              {message.content || (message.isStreaming ? '...' : '')}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Timestamp */}
        <div
          className={cn(
            'text-[10px] mt-2 opacity-60',
            isUser ? 'text-left' : 'text-right'
          )}
        >
          {message.timestamp.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        
        {/* Streaming indicator */}
        {message.isStreaming && (
          <div className="flex items-center gap-1 mt-1">
            <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
            <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
            <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
        )}
      </div>
    </div>
  );
}
