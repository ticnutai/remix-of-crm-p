// Category & Tags Manager Dialog - e-control CRM Pro
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Tag,
  FolderOpen,
  Users,
  Heart,
  Building,
  Handshake,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  Settings,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order?: number;
}

interface CategoryTagsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ClientCategory[];
  allTags: string[];
  onUpdate: () => void;
}

const availableIcons = [
  { value: 'Users', label: 'אנשים', icon: <Users className="h-4 w-4" /> },
  { value: 'Heart', label: 'לב', icon: <Heart className="h-4 w-4" /> },
  { value: 'Building', label: 'בניין', icon: <Building className="h-4 w-4" /> },
  { value: 'Handshake', label: 'לחיצת יד', icon: <Handshake className="h-4 w-4" /> },
  { value: 'FolderOpen', label: 'תיקייה', icon: <FolderOpen className="h-4 w-4" /> },
];

const availableColors = [
  '#1e3a5f', // Navy
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#6b7280', // Gray
];

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Building: <Building className="h-4 w-4" />,
  Handshake: <Handshake className="h-4 w-4" />,
  FolderOpen: <FolderOpen className="h-4 w-4" />,
};

export function CategoryTagsManager({
  isOpen,
  onClose,
  categories,
  allTags,
  onUpdate,
}: CategoryTagsManagerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [isLoading, setIsLoading] = useState(false);
  
  // Category form state
  const [editingCategory, setEditingCategory] = useState<ClientCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(availableColors[0]);
  const [newCategoryIcon, setNewCategoryIcon] = useState('Users');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Tags state
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      fetchTagCounts();
    }
  }, [isOpen, allTags]);

  const fetchTagCounts = async () => {
    try {
      const { data } = await supabase
        .from('clients')
        .select('tags')
        .not('tags', 'is', null);

      const counts: Record<string, number> = {};
      data?.forEach(client => {
        if (client.tags && Array.isArray(client.tags)) {
          client.tags.forEach((tag: string) => {
            counts[tag] = (counts[tag] || 0) + 1;
          });
        }
      });
      setTagCounts(counts);
    } catch (error) {
      console.error('Error fetching tag counts:', error);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor(availableColors[0]);
    setNewCategoryIcon('Users');
    setShowCategoryForm(false);
  };

  const handleEditCategory = (category: ClientCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setNewCategoryIcon(category.icon);
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם קטגוריה',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('client_categories')
          .update({
            name: newCategoryName.trim(),
            color: newCategoryColor,
            icon: newCategoryIcon,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: 'הקטגוריה עודכנה',
          description: `הקטגוריה "${newCategoryName}" עודכנה בהצלחה`,
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('client_categories')
          .insert({
            name: newCategoryName.trim(),
            color: newCategoryColor,
            icon: newCategoryIcon,
            sort_order: categories.length,
          });

        if (error) throw error;

        toast({
          title: 'קטגוריה נוספה',
          description: `הקטגוריה "${newCategoryName}" נוספה בהצלחה`,
        });
      }

      resetCategoryForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את הקטגוריה',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category: ClientCategory) => {
    if (!confirm(`האם למחוק את הקטגוריה "${category.name}"? לקוחות בקטגוריה זו יישארו ללא קטגוריה.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('client_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: 'הקטגוריה נמחקה',
        description: `הקטגוריה "${category.name}" נמחקה`,
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק את הקטגוריה',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (tag: string) => {
    const count = tagCounts[tag] || 0;
    if (!confirm(`האם להסיר את התגית "${tag}" מ-${count} לקוחות?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Get all clients with this tag
      const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('id, tags')
        .contains('tags', [tag]);

      if (fetchError) throw fetchError;

      // Remove tag from each client
      for (const client of clients || []) {
        const newTags = (client.tags as string[]).filter(t => t !== tag);
        await supabase
          .from('clients')
          .update({ tags: newTags.length > 0 ? newTags : null })
          .eq('id', client.id);
      }

      toast({
        title: 'התגית הוסרה',
        description: `התגית "${tag}" הוסרה מ-${count} לקוחות`,
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להסיר את התגית',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            ניהול קטגוריות ותגיות
          </DialogTitle>
          <DialogDescription>
            הוסף, ערוך או מחק קטגוריות ותגיות לסיווג לקוחות
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'categories' | 'tags')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              קטגוריות ({categories.length})
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              תגיות ({allTags.length})
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-4 space-y-4">
            {/* Category Form */}
            {showCategoryForm ? (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {editingCategory ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}
                  </h4>
                  <Button variant="ghost" size="icon" onClick={resetCategoryForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>שם הקטגוריה</Label>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="לדוגמה: לקוחות VIP"
                    />
                  </div>

                  <div>
                    <Label>אייקון</Label>
                    <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIcons.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center gap-2">
                              {icon.icon}
                              <span>{icon.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      צבע
                    </Label>
                    <div className="flex gap-2 mt-2">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewCategoryColor(color)}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            newCategoryColor === color && "ring-2 ring-offset-2 ring-primary"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="pt-2 border-t">
                    <Label className="text-xs text-muted-foreground">תצוגה מקדימה:</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: newCategoryColor }}
                      >
                        {iconMap[newCategoryIcon]}
                      </div>
                      <span className="font-medium">{newCategoryName || 'שם הקטגוריה'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveCategory} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                    {editingCategory ? 'עדכן' : 'הוסף'}
                  </Button>
                  <Button variant="outline" onClick={resetCategoryForm}>
                    ביטול
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowCategoryForm(true)}
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף קטגוריה חדשה
              </Button>
            )}

            {/* Categories List */}
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: category.color }}
                    >
                      {iconMap[category.icon] || <FolderOpen className="h-5 w-5" />}
                    </div>
                    <span className="font-medium flex-1">{category.name}</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    אין קטגוריות מוגדרות
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="mt-4">
            <ScrollArea className="h-[320px]">
              {allTags.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">אין תגיות</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    תגיות נוצרות אוטומטית כשמסווגים לקוחות
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                    >
                      <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium flex-1">{tag}</span>
                      <Badge variant="secondary" className="shrink-0">
                        {tagCounts[tag] || 0} לקוחות
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        onClick={() => handleDeleteTag(tag)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
