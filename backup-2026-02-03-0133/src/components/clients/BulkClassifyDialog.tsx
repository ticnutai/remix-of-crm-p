// Bulk Classification Dialog - e-control CRM Pro
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface BulkClassifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClientIds: string[];
  categories: ClientCategory[];
  allTags: string[];
  onUpdate: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Building: <Building className="h-4 w-4" />,
  Handshake: <Handshake className="h-4 w-4" />,
  FolderOpen: <FolderOpen className="h-4 w-4" />,
};

type TagAction = 'add' | 'remove' | 'replace';

export function BulkClassifyDialog({
  isOpen,
  onClose,
  selectedClientIds,
  categories,
  allTags,
  onUpdate,
}: BulkClassifyDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagAction, setTagAction] = useState<TagAction>('add');
  const [newTagInput, setNewTagInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'category' | 'tags'>('category');

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTagInput.trim();
    if (!trimmedTag || selectedTags.includes(trimmedTag)) {
      setNewTagInput('');
      return;
    }
    setSelectedTags([...selectedTags, trimmedTag]);
    setNewTagInput('');
  };

  const handleApply = async () => {
    if (!selectedCategory && selectedTags.length === 0) {
      toast({
        title: 'בחר קטגוריה או תגיות',
        description: 'יש לבחור לפחות קטגוריה אחת או תגית אחת להחלה',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const clientIds = selectedClientIds;

      // Update categories if selected
      if (selectedCategory !== null) {
        const { error: categoryError } = await supabase
          .from('clients')
          .update({ category_id: selectedCategory || null })
          .in('id', clientIds);

        if (categoryError) throw categoryError;
      }

      // Update tags if selected
      if (selectedTags.length > 0) {
        // Get current tags for all selected clients
        const { data: clientsData, error: fetchError } = await supabase
          .from('clients')
          .select('id, tags')
          .in('id', clientIds);

        if (fetchError) throw fetchError;

        // Update each client based on tag action
        for (const client of clientsData || []) {
          let newTags: string[];
          const currentTags = client.tags || [];

          switch (tagAction) {
            case 'add':
              newTags = [...new Set([...currentTags, ...selectedTags])];
              break;
            case 'remove':
              newTags = currentTags.filter((t: string) => !selectedTags.includes(t));
              break;
            case 'replace':
              newTags = selectedTags;
              break;
            default:
              newTags = currentTags;
          }

          const { error: updateError } = await supabase
            .from('clients')
            .update({ tags: newTags.length > 0 ? newTags : null })
            .eq('id', client.id);

          if (updateError) throw updateError;
        }
      }

      const categoryName = categories.find(c => c.id === selectedCategory)?.name;
      
      toast({
        title: 'הסיווג הוחל בהצלחה',
        description: `${clientIds.length} לקוחות עודכנו${categoryName ? ` לקטגוריה "${categoryName}"` : ''}${selectedTags.length > 0 ? ` עם ${selectedTags.length} תגיות` : ''}`,
      });

      onUpdate();
      handleClose();
    } catch (error) {
      console.error('Error bulk classifying:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להחיל את הסיווג',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setTagAction('add');
    setNewTagInput('');
    setActiveTab('category');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            סיווג {selectedClientIds.length} לקוחות
          </DialogTitle>
          <DialogDescription>
            בחר קטגוריה ו/או תגיות להחלה על כל הלקוחות הנבחרים
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'category' | 'tags')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="category" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              קטגוריה
              {selectedCategory && <Check className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              תגיות
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {selectedTags.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Category Tab */}
          <TabsContent value="category" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all text-right",
                    selectedCategory === category.id
                      ? "border-2 bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                  style={selectedCategory === category.id ? { borderColor: category.color } : undefined}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: category.color }}
                  >
                    {iconMap[category.icon] || <FolderOpen className="h-4 w-4" />}
                  </div>
                  <span className="font-medium text-sm flex-1">{category.name}</span>
                  {selectedCategory === category.id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {selectedCategory && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-muted-foreground"
                onClick={() => setSelectedCategory(null)}
              >
                <X className="h-4 w-4 ml-1" />
                הסר קטגוריה
              </Button>
            )}
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="mt-4 space-y-4">
            {/* Tag Action Selection */}
            <div className="flex gap-2">
              <Button
                variant={tagAction === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTagAction('add')}
                className="flex-1"
              >
                <Plus className="h-4 w-4 ml-1" />
                הוסף
              </Button>
              <Button
                variant={tagAction === 'remove' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTagAction('remove')}
                className="flex-1"
              >
                <Minus className="h-4 w-4 ml-1" />
                הסר
              </Button>
              <Button
                variant={tagAction === 'replace' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTagAction('replace')}
                className="flex-1"
              >
                <Check className="h-4 w-4 ml-1" />
                החלף
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {tagAction === 'add' && 'התגיות הנבחרות יתווספו לכל הלקוחות'}
              {tagAction === 'remove' && 'התגיות הנבחרות יוסרו מכל הלקוחות'}
              {tagAction === 'replace' && 'התגיות של כל הלקוחות יוחלפו בתגיות הנבחרות'}
            </p>

            {/* Available Tags */}
            <ScrollArea className="h-[150px] border rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedTags.includes(tag)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-primary/10 hover:border-primary"
                    )}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                  </Badge>
                ))}
                {allTags.length === 0 && (
                  <p className="text-sm text-muted-foreground">אין תגיות קיימות</p>
                )}
              </div>
            </ScrollArea>

            {/* Add New Tag */}
            <div className="flex gap-2">
              <Input
                placeholder="תגית חדשה..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
              />
              <Button
                variant="outline"
                onClick={handleAddNewTag}
                disabled={!newTagInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected Tags Preview */}
            {selectedTags.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  תגיות נבחרות ({selectedTags.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleTagToggle(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            ביטול
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={isUpdating || (!selectedCategory && selectedTags.length === 0)}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                מחיל...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 ml-2" />
                החל על {selectedClientIds.length} לקוחות
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
