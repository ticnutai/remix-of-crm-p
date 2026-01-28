// Quick Classification Popover - e-control CRM Pro
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import {
  Tag,
  FolderOpen,
  Users,
  Heart,
  Building,
  Handshake,
  Plus,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ClientQuickClassifyProps {
  clientId: string;
  clientName: string;
  currentCategoryId: string | null;
  currentTags: string[] | null;
  categories: ClientCategory[];
  allTags: string[];
  onUpdate: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-3.5 w-3.5" />,
  Heart: <Heart className="h-3.5 w-3.5" />,
  Building: <Building className="h-3.5 w-3.5" />,
  Handshake: <Handshake className="h-3.5 w-3.5" />,
  FolderOpen: <FolderOpen className="h-3.5 w-3.5" />,
};

export function ClientQuickClassify({
  clientId,
  clientName,
  currentCategoryId,
  currentTags,
  categories,
  allTags,
  onUpdate,
}: ClientQuickClassifyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [localTags, setLocalTags] = useState<string[]>(currentTags || []);

  const handleCategoryChange = async (categoryId: string | null) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ category_id: categoryId })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: 'הקטגוריה עודכנה',
        description: categoryId 
          ? `הלקוח "${clientName}" סווג לקטגוריה חדשה`
          : `הקטגוריה הוסרה מהלקוח "${clientName}"`,
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את הקטגוריה',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTagToggle = async (tag: string) => {
    const newTags = localTags.includes(tag)
      ? localTags.filter(t => t !== tag)
      : [...localTags, tag];
    
    setLocalTags(newTags);
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({ tags: newTags.length > 0 ? newTags : null })
        .eq('id', clientId);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating tags:', error);
      // Revert on error
      setLocalTags(currentTags || []);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את התגיות',
        variant: 'destructive',
      });
    }
  };

  const handleAddNewTag = async () => {
    const trimmedTag = newTagInput.trim();
    if (!trimmedTag) return;
    
    if (localTags.includes(trimmedTag)) {
      setNewTagInput('');
      return;
    }

    const newTags = [...localTags, trimmedTag];
    setLocalTags(newTags);
    setNewTagInput('');

    try {
      const { error } = await supabase
        .from('clients')
        .update({ tags: newTags })
        .eq('id', clientId);

      if (error) throw error;
      
      toast({
        title: 'תגית נוספה',
        description: `התגית "${trimmedTag}" נוספה ללקוח`,
      });
      onUpdate();
    } catch (error) {
      console.error('Error adding tag:', error);
      setLocalTags(localTags);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף את התגית',
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewTag();
    }
  };

  const currentCategory = categories.find(c => c.id === currentCategoryId);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10",
            "bg-white/90 hover:bg-white border-2 shadow-sm",
            currentCategory 
              ? "border-current" 
              : "border-muted-foreground/30 hover:border-primary"
          )}
          style={currentCategory ? { borderColor: currentCategory.color } : undefined}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          title="סווג לקוח"
        >
          {currentCategory ? (
            <div 
              className="w-4 h-4 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: currentCategory.color }}
            >
              {iconMap[currentCategory.icon] || <FolderOpen className="h-2.5 w-2.5" />}
            </div>
          ) : (
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[280px] p-0" 
        dir="rtl" 
        align="start"
        side="bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">סיווג מהיר</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {clientName}
          </p>
        </div>

        {/* Categories Section */}
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            קטגוריה
          </p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                disabled={isUpdating}
                onClick={() => handleCategoryChange(
                  currentCategoryId === category.id ? null : category.id
                )}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border text-sm transition-all",
                  currentCategoryId === category.id
                    ? "border-2 bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                style={currentCategoryId === category.id ? { borderColor: category.color } : undefined}
              >
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: category.color }}
                >
                  {iconMap[category.icon] || <FolderOpen className="h-2.5 w-2.5" />}
                </div>
                <span className="truncate text-xs">{category.name}</span>
                {currentCategoryId === category.id && (
                  <Check className="h-3 w-3 text-primary mr-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            תגיות
          </p>
          
          {/* Existing Tags */}
          <ScrollArea className="max-h-[120px]">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={localTags.includes(tag) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all text-xs py-0.5",
                    localTags.includes(tag) 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-primary/10 hover:border-primary"
                  )}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                  {localTags.includes(tag) && (
                    <X className="h-2.5 w-2.5 mr-1" />
                  )}
                </Badge>
              ))}
            </div>
          </ScrollArea>

          {/* Add New Tag */}
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="תגית חדשה..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 shrink-0"
              onClick={handleAddNewTag}
              disabled={!newTagInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading Overlay */}
        {isUpdating && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
