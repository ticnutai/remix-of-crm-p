// Gmail Settings Component
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  RefreshCw, 
  Star, 
  StarOff,
  ExternalLink,
  User,
  Clock
} from 'lucide-react';
import { useGmailIntegration, GmailMessage } from '@/hooks/useGmailIntegration';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export function GmailSettings() {
  const { messages, isLoading, fetchEmails } = useGmailIntegration();
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleConnect = async () => {
    await fetchEmails(20);
    setHasLoaded(true);
  };

  const handleRefresh = async () => {
    await fetchEmails(20);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: he });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Mail className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle>Gmail</CardTitle>
              <CardDescription>צפייה ושליחת מיילים ישירות מהמערכת</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {hasLoaded && (
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                רענון
              </Button>
            )}
            {!hasLoaded && (
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? 'מתחבר...' : 'התחבר ל-Gmail'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !hasLoaded && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {!hasLoaded && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>לחץ על "התחבר ל-Gmail" כדי לראות את המיילים שלך</p>
          </div>
        )}

        {hasLoaded && messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>לא נמצאו מיילים</p>
          </div>
        )}

        {hasLoaded && messages.length > 0 && (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {messages.map((message) => (
                <EmailItem key={message.id} message={message} formatDate={formatDate} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function EmailItem({ 
  message, 
  formatDate 
}: { 
  message: GmailMessage; 
  formatDate: (date: string) => string;
}) {
  return (
    <div
      className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
        !message.isRead ? 'bg-primary/5 border-primary/20' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{message.fromName}</span>
            {!message.isRead && (
              <Badge variant="secondary" className="text-xs">חדש</Badge>
            )}
          </div>
          <h4 className={`text-sm mb-1 truncate ${!message.isRead ? 'font-semibold' : ''}`}>
            {message.subject || '(ללא נושא)'}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {message.snippet}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(message.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            {message.isStarred ? (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4 text-muted-foreground/50" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${message.id}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
