import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCheck } from 'lucide-react';

interface ReadUser {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  last_read_at: string;
}

interface ReadReceiptsProps {
  readBy: ReadUser[];
  messageCreatedAt: string;
  isOwnMessage: boolean;
}

export function ReadReceipts({ readBy, messageCreatedAt, isOwnMessage }: ReadReceiptsProps) {
  if (!isOwnMessage) return null;

  // Only include users who read AFTER this message was created
  const readers = readBy.filter(u => new Date(u.last_read_at) >= new Date(messageCreatedAt));

  if (readers.length === 0) {
    return (
      <span className="inline-flex items-center opacity-50 ml-1">
        <CheckCheck size={12} className="text-muted-foreground" />
      </span>
    );
  }

  const visible = readers.slice(0, 3);
  const extra = readers.length - visible.length;

  return (
    <TooltipProvider>
      <div className="inline-flex items-center gap-0.5 ml-1">
        {visible.map(u => (
          <Tooltip key={u.user_id}>
            <TooltipTrigger asChild>
              <Avatar className="w-3.5 h-3.5 border border-background cursor-default">
                <AvatarImage src={u.avatar_url} />
                <AvatarFallback className="text-[6px]">{(u.full_name || '?')[0]}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>{u.full_name}</p>
              <p className="text-muted-foreground">{format(new Date(u.last_read_at), 'HH:mm', { locale: he })}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {extra > 0 && (
          <span className="text-[8px] text-muted-foreground leading-none">+{extra}</span>
        )}
      </div>
    </TooltipProvider>
  );
}
