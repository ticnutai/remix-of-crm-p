import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TypingUser {
  userId: string;
  displayName: string;
  typingAt: Date;
}

interface TypingIndicatorProps {
  conversationId: string;
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);

    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.userId === user?.id) return;
      setTypingUsers(prev => {
        const others = prev.filter(u => u.userId !== payload.userId);
        if (!payload.isTyping) return others;
        return [...others, { userId: payload.userId, displayName: payload.displayName || 'מישהו', typingAt: new Date() }];
      });
    });

    channel.subscribe();

    // Clear stale typers every 4s
    const interval = setInterval(() => {
      const cutoff = new Date(Date.now() - 4000);
      setTypingUsers(prev => prev.filter(u => u.typingAt > cutoff));
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [conversationId, user?.id]);

  if (typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.displayName).join(', ');
  const label = typingUsers.length === 1 ? `${names} מקליד...` : `${names} מקלידים...`;

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground select-none" dir="rtl">
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
      <span>{label}</span>
    </div>
  );
}
