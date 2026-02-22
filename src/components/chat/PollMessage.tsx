/**
 * PollMessage - Renders a poll inside a chat bubble with voting
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart2, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PollOption {
  id: string;
  text: string;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allow_multiple: boolean;
  ends_at?: string | null;
  is_closed?: boolean;
}

interface VoteCounts {
  [optionId: string]: number;
}

interface PollMessageProps {
  conversationId: string;
  question: string;          // extracted from message content
  isOwn: boolean;
}

export function PollMessage({ conversationId, question, isOwn }: PollMessageProps) {
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPoll = useCallback(async () => {
    // Match poll by conversation + question text
    const cleanQ = question.replace('📊 סקר: ', '').trim();
    const { data } = await supabase
      .from('chat_polls')
      .select('*')
      .eq('conversation_id', conversationId)
      .ilike('question', cleanQ)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) { setLoading(false); return; }
    setPoll(data as any);

    // Fetch all votes
    const { data: votes } = await supabase
      .from('chat_poll_votes')
      .select('*')
      .eq('poll_id', data.id);

    const counts: VoteCounts = {};
    for (const v of (votes || [])) {
      counts[v.option_id] = (counts[v.option_id] || 0) + 1;
    }
    setVoteCounts(counts);
    setTotalVotes(votes?.length || 0);

    // My votes
    const mine = (votes || []).filter((v: any) => v.user_id === user?.id).map((v: any) => v.option_id);
    setMyVotes(mine);
    setLoading(false);
  }, [conversationId, question, user?.id]);

  useEffect(() => { fetchPoll(); }, [fetchPoll]);

  const handleVote = async (optionId: string) => {
    if (!poll || !user || voting || poll.is_closed) return;
    setVoting(true);
    try {
      const alreadyVoted = myVotes.includes(optionId);
      if (alreadyVoted) {
        // Remove vote
        await supabase.from('chat_poll_votes').delete()
          .eq('poll_id', poll.id).eq('user_id', user.id).eq('option_id', optionId);
        setMyVotes(prev => prev.filter(v => v !== optionId));
        setVoteCounts(prev => ({ ...prev, [optionId]: Math.max(0, (prev[optionId] || 1) - 1) }));
        setTotalVotes(t => t - 1);
      } else {
        if (!poll.allow_multiple) {
          // Remove previous vote first
          for (const v of myVotes) {
            await supabase.from('chat_poll_votes').delete()
              .eq('poll_id', poll.id).eq('user_id', user.id).eq('option_id', v);
            setVoteCounts(prev => ({ ...prev, [v]: Math.max(0, (prev[v] || 1) - 1) }));
            setTotalVotes(t => t - 1);
          }
          setMyVotes([]);
        }
        await supabase.from('chat_poll_votes').upsert({
          poll_id: poll.id, user_id: user.id, option_id: optionId,
        }, { onConflict: 'poll_id,user_id,option_id' });
        setMyVotes(prev => poll.allow_multiple ? [...prev, optionId] : [optionId]);
        setVoteCounts(prev => ({ ...prev, [optionId]: (prev[optionId] || 0) + 1 }));
        setTotalVotes(t => t + 1);
      }
    } finally {
      setVoting(false);
    }
  };

  const textColor = isOwn ? 'text-primary-foreground' : 'text-foreground';
  const subColor = isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground';
  const barBg = isOwn ? 'bg-primary-foreground/20' : 'bg-muted';
  const barFill = isOwn ? 'bg-primary-foreground/70' : 'bg-primary';

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">טוען סקר...</span>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className={cn('flex items-center gap-2 text-xs', subColor)}>
        <BarChart2 className="h-4 w-4" />
        <span>{question}</span>
      </div>
    );
  }

  return (
    <div className="min-w-[200px] max-w-[260px] space-y-2">
      <div className={cn('flex items-center gap-1.5 text-xs font-semibold', textColor)}>
        <BarChart2 className="h-3.5 w-3.5 shrink-0" />
        <span>{poll.question}</span>
      </div>
      {poll.allow_multiple && <p className={cn('text-[10px]', subColor)}>ניתן לבחור מספר תשובות</p>}

      <div className="space-y-1.5">
        {((poll.options || []) as PollOption[]).map(opt => {
          const count = voteCounts[opt.id] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const voted = myVotes.includes(opt.id);
          return (
            <button key={opt.id}
              disabled={!!poll.is_closed || voting}
              onClick={() => handleVote(opt.id)}
              className={cn(
                'w-full text-right rounded-lg overflow-hidden relative transition-opacity',
                (poll.is_closed || voting) ? 'cursor-default' : 'hover:opacity-90 cursor-pointer',
              )}>
              <div className={cn('absolute inset-0 rounded-lg', barBg)} />
              <div className={cn('absolute inset-y-0 right-0 rounded-lg transition-all', barFill, voted && 'opacity-90')}
                style={{ width: `${pct}%` }} />
              <div className="relative flex items-center justify-between px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  {voted ? (
                    <CheckCircle2 className={cn('h-3 w-3 shrink-0', textColor)} />
                  ) : (
                    <div className={cn('h-3 w-3 rounded-full border shrink-0', isOwn ? 'border-primary-foreground/50' : 'border-muted-foreground/50')} />
                  )}
                  <span className={cn('text-xs', textColor)}>{opt.text}</span>
                </div>
                <span className={cn('text-[10px] shrink-0', subColor)}>{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>

      <p className={cn('text-[10px]', subColor)}>{totalVotes} {totalVotes === 1 ? 'מצביע' : 'מצביעים'}</p>
    </div>
  );
}
