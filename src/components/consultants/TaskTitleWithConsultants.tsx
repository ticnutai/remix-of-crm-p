// Task Title with Consultant Keywords - Displays task title with highlighted keywords
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserCheck } from 'lucide-react';
import { ConsultantDialog } from './ConsultantDialog';
import { ConsultantPopup } from './ConsultantPopup';
import { 
  CONSULTANT_KEYWORDS, 
  detectConsultantKeywords,
  Consultant,
} from '@/hooks/useConsultants';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TaskConsultantLink {
  id: string;
  task_id: string;
  consultant_id: string;
  keyword: string;
  keyword_context: string | null;
  consultant: Consultant;
}

interface TaskTitleWithConsultantsProps {
  taskId: string;
  title: string;
  className?: string;
}

export function TaskTitleWithConsultants({
  taskId,
  title,
  className,
}: TaskTitleWithConsultantsProps) {
  const { toast } = useToast();
  const [taskConsultants, setTaskConsultants] = useState<TaskConsultantLink[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState({ keyword: '', context: '' });

  // Detect keywords in title
  const keywords = useMemo(() => detectConsultantKeywords(title), [title]);
  const hasKeywords = keywords.length > 0;

  // Load task consultants
  const loadTaskConsultants = useCallback(async () => {
    if (!taskId) return;
    
    try {
      const { data, error } = await supabase
        .from('task_consultants')
        .select(`
          id,
          task_id,
          consultant_id,
          keyword,
          keyword_context,
          consultant:consultants(*)
        `)
        .eq('task_id', taskId);

      if (error) throw error;
      
      // Transform data to expected format
      const transformed = (data || []).map((tc: any) => ({
        ...tc,
        consultant: tc.consultant as Consultant,
      }));
      
      setTaskConsultants(transformed);
    } catch (error) {
      console.error('Error loading task consultants:', error);
    }
  }, [taskId]);

  useEffect(() => {
    if (hasKeywords) {
      loadTaskConsultants();
    }
  }, [hasKeywords, loadTaskConsultants]);

  // Get consultant for a keyword
  const getConsultantForKeyword = (keyword: string): TaskConsultantLink | undefined => {
    return taskConsultants.find(tc => 
      tc.keyword.includes(keyword) || keyword.includes(tc.keyword)
    );
  };

  // Link consultant to task
  const handleSelectConsultant = async (consultant: Consultant) => {
    try {
      const { data, error } = await supabase
        .from('task_consultants')
        .insert({
          task_id: taskId,
          consultant_id: consultant.id,
          keyword: selectedKeyword.keyword,
          keyword_context: selectedKeyword.context,
        })
        .select(`
          id,
          task_id,
          consultant_id,
          keyword,
          keyword_context,
          consultant:consultants(*)
        `)
        .single();

      if (error) throw error;
      
      setTaskConsultants(prev => [...prev, {
        ...data,
        consultant: data.consultant as Consultant,
      }]);
      
      toast({
        title: 'הצלחה',
        description: `${consultant.profession} "${consultant.name}" קושר למשימה`,
      });
    } catch (error) {
      console.error('Error linking consultant:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לקשר יועץ למשימה',
        variant: 'destructive',
      });
    }
  };

  // Unlink consultant from task
  const handleUnlinkConsultant = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('task_consultants')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      
      setTaskConsultants(prev => prev.filter(tc => tc.id !== linkId));
      
      toast({
        title: 'הצלחה',
        description: 'היועץ הוסר מהמשימה',
      });
    } catch (error) {
      console.error('Error unlinking consultant:', error);
    }
  };

  // Open dialog to add consultant for keyword
  const handleKeywordClick = (keyword: string, context: string) => {
    const existingLink = getConsultantForKeyword(keyword);
    if (!existingLink) {
      setSelectedKeyword({ keyword, context });
      setDialogOpen(true);
    }
  };

  // Render title with highlighted keywords
  const renderTitle = () => {
    if (!hasKeywords) {
      return <span>{title}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Create regex pattern for all keywords
    const pattern = CONSULTANT_KEYWORDS.join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    
    let match;
    while ((match = regex.exec(title)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {title.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Find matching keyword
      const matchedText = match[1];
      const keywordLower = matchedText.toLowerCase();
      const matchedKeyword = CONSULTANT_KEYWORDS.find(k => 
        k === keywordLower || matchedText.includes(k) || k.includes(matchedText)
      ) || matchedText;
      
      // Check if this keyword has a linked consultant
      const link = getConsultantForKeyword(matchedKeyword);
      
      if (link?.consultant) {
        // Has consultant - show popup on click
        parts.push(
          <ConsultantPopup
            key={`keyword-${match.index}`}
            consultant={link.consultant}
            onUnlink={() => handleUnlinkConsultant(link.id)}
          >
            <span
              className={cn(
                "font-bold text-green-600 cursor-pointer hover:underline",
                "inline-flex items-center gap-1"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {matchedText}
              <UserCheck className="h-3 w-3 inline" />
            </span>
          </ConsultantPopup>
        );
      } else {
        // No consultant - show as clickable to add
        parts.push(
          <span
            key={`keyword-${match.index}`}
            className={cn(
              "font-bold text-primary cursor-pointer hover:underline",
              "inline-flex items-center gap-1"
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleKeywordClick(matchedKeyword, matchedText);
            }}
          >
            {matchedText}
            <UserPlus className="h-3 w-3 inline opacity-50" />
          </span>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < title.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {title.substring(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };

  return (
    <>
      <span className={className}>
        {renderTitle()}
      </span>

      {/* Consultant Selection Dialog */}
      <ConsultantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        keyword={selectedKeyword.keyword}
        keywordContext={selectedKeyword.context}
        onSelectConsultant={handleSelectConsultant}
      />
    </>
  );
}

export default TaskTitleWithConsultants;
