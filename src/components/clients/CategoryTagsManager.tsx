// Category & Tags Manager Dialog - tenarch CRM Pro
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Settings,
  Palette,
  Search,
  UserRoundCog,
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
  tagDefinitions?: ClientTagDefinition[];
  initialTab?: 'categories' | 'tags';
  onTagDefinitionsChange?: (definitions: ClientTagDefinition[]) => void;
  onUpdate: () => void;
}

interface ClientTagDefinition {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

interface TagClient {
  id: string;
  name: string;
  tags: string[] | null;
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
  tagDefinitions = [],
  initialTab = 'categories',
  onTagDefinitionsChange,
  onUpdate,
}: CategoryTagsManagerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  
  // Category form state
  const [editingCategory, setEditingCategory] = useState<ClientCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(availableColors[0]);
  const [newCategoryIcon, setNewCategoryIcon] = useState('Users');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Tags state
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [clients, setClients] = useState<TagClient[]>([]);
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState<ClientTagDefinition | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(availableColors[0]);
  const [managingTag, setManagingTag] = useState<ClientTagDefinition | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      fetchTagData();
    }
  }, [isOpen, initialTab, allTags]);

  const fetchTagData = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, tags')
        .order('name');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(client => {
        if (client.tags && Array.isArray(client.tags)) {
          client.tags.forEach((tag: string) => {
            counts[tag] = (counts[tag] || 0) + 1;
          });
        }
      });
      setTagCounts(counts);
      setClients((data || []) as TagClient[]);
    } catch (error) {
      console.error('Error fetching tag counts:', error);
    }
  };

  const displayedTagDefinitions = allTags.map((name, index) => {
    const definition = tagDefinitions.find((tag) => tag.name === name);
    return definition || {
      id: `legacy:${name}`,
      name,
      color: availableColors[index % availableColors.length],
      sort_order: index,
    };
  });

  const isMissingTagDefinitionsTable = (error: unknown) => {
    const code = (error as { code?: string } | null)?.code;
    return code === '42P01' || code === 'PGRST205';
  };

  const resetTagForm = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor(availableColors[0]);
    setShowTagForm(false);
  };

  const handleEditTag = (tag: ClientTagDefinition) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setShowTagForm(true);
  };

  const replaceTagOnClients = async (oldName: string, newName: string | null) => {
    const affectedClients = clients.filter((client) => client.tags?.includes(oldName));
    await Promise.all(
      affectedClients.map((client) => {
        const nextTags = (client.tags || [])
          .filter((tag) => tag !== oldName)
          .concat(newName ? [newName] : []);
        return supabase
          .from('clients')
          .update({ tags: nextTags.length > 0 ? Array.from(new Set(nextTags)) : null })
          .eq('id', client.id);
      }),
    );
  };

  const handleSaveTag = async () => {
    const normalizedName = tagName.trim();
    if (!normalizedName) {
      toast({ title: 'יש להזין שם לתגית', variant: 'destructive' });
      return;
    }
    if (
      allTags.some(
        (existing) =>
          existing.toLocaleLowerCase('he') === normalizedName.toLocaleLowerCase('he') &&
          existing !== editingTag?.name,
      )
    ) {
      toast({ title: 'כבר קיימת תגית בשם הזה', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const nextDefinition: ClientTagDefinition = {
        id: editingTag?.id.startsWith('legacy:')
          ? `local:${crypto.randomUUID()}`
          : editingTag?.id || `local:${crypto.randomUUID()}`,
        name: normalizedName,
        color: tagColor,
        sort_order: editingTag?.sort_order ?? displayedTagDefinitions.length,
      };
      const nextDefinitions = editingTag
        ? displayedTagDefinitions.map((tag) =>
            tag.name === editingTag.name ? nextDefinition : tag,
          )
        : [...displayedTagDefinitions, nextDefinition];

      if (editingTag && !editingTag.id.startsWith('legacy:')) {
        const { error } = await supabase
          .from('client_tag_definitions')
          .update({ name: normalizedName, color: tagColor })
          .eq('id', editingTag.id);
        if (error && !isMissingTagDefinitionsTable(error)) throw error;
        if (editingTag.name !== normalizedName) {
          await replaceTagOnClients(editingTag.name, normalizedName);
        }
        toast({ title: 'התגית עודכנה', description: `"${normalizedName}" נשמרה בהצלחה` });
      } else {
        const { error } = await supabase
          .from('client_tag_definitions')
          .insert({
            name: normalizedName,
            color: tagColor,
            sort_order: tagDefinitions.length,
          });
        if (error && !isMissingTagDefinitionsTable(error)) throw error;
        if (editingTag?.id.startsWith('legacy:') && editingTag.name !== normalizedName) {
          await replaceTagOnClients(editingTag.name, normalizedName);
        }
        toast({ title: 'תגית חדשה נוספה', description: `"${normalizedName}" זמינה כעת לשיוך` });
      }
      onTagDefinitionsChange?.(nextDefinitions);
      resetTagForm();
      await fetchTagData();
      onUpdate();
    } catch (error) {
      console.error('Error saving tag:', error);
      toast({
        title: 'לא ניתן לשמור את התגית',
        description: 'ודא שמסד הנתונים מעודכן ונסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openClientAssignment = (tag: ClientTagDefinition) => {
    setManagingTag(tag);
    setSelectedClientIds(
      new Set(
        clients
          .filter((client) => client.tags?.includes(tag.name))
          .map((client) => client.id),
      ),
    );
    setClientSearch('');
  };

  const handleSaveClientAssignments = async () => {
    if (!managingTag) return;
    setIsLoading(true);
    try {
      const changedClients = clients.filter((client) => {
        const hadTag = Boolean(client.tags?.includes(managingTag.name));
        return hadTag !== selectedClientIds.has(client.id);
      });
      await Promise.all(
        changedClients.map((client) => {
          const nextTags = selectedClientIds.has(client.id)
            ? Array.from(new Set([...(client.tags || []), managingTag.name]))
            : (client.tags || []).filter((tag) => tag !== managingTag.name);
          return supabase
            .from('clients')
            .update({ tags: nextTags.length > 0 ? nextTags : null })
            .eq('id', client.id);
        }),
      );
      toast({
        title: 'שיוכי הלקוחות עודכנו',
        description: `${selectedClientIds.size} לקוחות משויכים כעת לתגית "${managingTag.name}"`,
      });
      setManagingTag(null);
      await fetchTagData();
      onUpdate();
    } catch (error) {
      console.error('Error assigning clients to tag:', error);
      toast({ title: 'לא ניתן לעדכן את הלקוחות', variant: 'destructive' });
    } finally {
      setIsLoading(false);
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

  const handleDeleteTag = async (tag: ClientTagDefinition) => {
    const count = tagCounts[tag.name] || 0;
    if (!confirm(`האם למחוק את התגית "${tag.name}" ולהסיר אותה מ-${count} לקוחות?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await replaceTagOnClients(tag.name, null);
      if (!tag.id.startsWith('legacy:')) {
        const { error } = await supabase
          .from('client_tag_definitions')
          .delete()
          .eq('id', tag.id);
        if (error && !isMissingTagDefinitionsTable(error)) throw error;
      }
      onTagDefinitionsChange?.(
        displayedTagDefinitions.filter((definition) => definition.name !== tag.name),
      );

      toast({
        title: 'התגית הוסרה',
        description: `התגית "${tag.name}" הוסרה מ-${count} לקוחות`,
      });
      await fetchTagData();
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
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden" dir="rtl">
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
                        <Pencil className="h-4 w-4" />
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
          <TabsContent value="tags" className="mt-4 min-h-0">
            {managingTag ? (
              <div className="space-y-4">
                <div
                  className="flex items-center justify-between rounded-xl border p-3"
                  style={{ borderColor: managingTag.color, backgroundColor: `${managingTag.color}12` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-9 w-9 rounded-full shadow-sm"
                      style={{ backgroundColor: managingTag.color }}
                    />
                    <div>
                      <h4 className="font-semibold">לקוחות בתגית „{managingTag.name}”</h4>
                      <p className="text-xs text-muted-foreground">
                        סמן לקוחות כדי לשייך; הסר סימון כדי להסיר מהתגית
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setManagingTag(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pr-9"
                    placeholder="חיפוש לקוח..."
                    value={clientSearch}
                    onChange={(event) => setClientSearch(event.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{selectedClientIds.size} לקוחות מסומנים</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedClientIds(new Set(clients.map((client) => client.id)))}
                    >
                      בחר הכל
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedClientIds(new Set())}>
                      נקה בחירה
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[310px] rounded-xl border">
                  <div className="divide-y p-1">
                    {clients
                      .filter((client) =>
                        client.name.toLocaleLowerCase('he').includes(clientSearch.trim().toLocaleLowerCase('he')),
                      )
                      .map((client) => {
                        const checked = selectedClientIds.has(client.id);
                        return (
                          <button
                            type="button"
                            key={client.id}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg p-3 text-right transition-colors',
                              checked ? 'bg-primary/10' : 'hover:bg-muted/60',
                            )}
                            onClick={() =>
                              setSelectedClientIds((current) => {
                                const next = new Set(current);
                                if (next.has(client.id)) next.delete(client.id);
                                else next.add(client.id);
                                return next;
                              })
                            }
                          >
                            <Checkbox checked={checked} />
                            <span className="min-w-0 flex-1 truncate font-medium">{client.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {(client.tags || []).length} תגיות
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Button onClick={handleSaveClientAssignments} disabled={isLoading}>
                    <Check className="ml-2 h-4 w-4" />
                    שמור שיוכים
                  </Button>
                  <Button variant="outline" onClick={() => setManagingTag(null)}>
                    ביטול
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {showTagForm ? (
                  <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        {editingTag ? 'עריכת תגית' : 'תגית חדשה'}
                      </h4>
                      <Button variant="ghost" size="icon" onClick={resetTagForm}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                      <div>
                        <Label>שם התגית</Label>
                        <Input
                          value={tagName}
                          onChange={(event) => setTagName(event.target.value)}
                          onKeyDown={(event) => event.key === 'Enter' && void handleSaveTag()}
                          placeholder="לדוגמה: לקוח VIP"
                          autoFocus
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1">
                          <Palette className="h-3.5 w-3.5" />
                          צבע
                        </Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {availableColors.map((color) => (
                            <button
                              type="button"
                              key={color}
                              aria-label={`בחר צבע ${color}`}
                              onClick={() => setTagColor(color)}
                              className={cn(
                                'h-7 w-7 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110',
                                tagColor === color && 'ring-2 ring-primary ring-offset-2',
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Badge
                        className="border px-3 py-1 text-white"
                        style={{ backgroundColor: tagColor, borderColor: tagColor }}
                      >
                        <Tag className="ml-1 h-3.5 w-3.5" />
                        {tagName.trim() || 'תצוגה מקדימה'}
                      </Badge>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveTag} disabled={isLoading || !tagName.trim()}>
                          <Check className="ml-2 h-4 w-4" />
                          {editingTag ? 'שמור שינויים' : 'צור תגית'}
                        </Button>
                        <Button variant="outline" onClick={resetTagForm}>ביטול</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => setShowTagForm(true)}>
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף תגית חדשה
                  </Button>
                )}

                <ScrollArea className="h-[340px]">
                  {displayedTagDefinitions.length === 0 ? (
                    <div className="py-12 text-center">
                      <Tag className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                      <p className="font-medium text-muted-foreground">אין עדיין תגיות</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        צור תגית, בחר לה צבע ושייך אליה לקוחות
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 pl-2">
                      {displayedTagDefinitions.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center gap-3 rounded-xl border bg-background p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                          style={{ borderRightWidth: 5, borderRightColor: tag.color }}
                        >
                          <span
                            className="h-8 w-8 shrink-0 rounded-full shadow-sm"
                            style={{ backgroundColor: tag.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold">{tag.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {tagCounts[tag.name] || 0} לקוחות משויכים
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-1.5"
                            onClick={() => openClientAssignment(tag)}
                          >
                            <UserRoundCog className="h-4 w-4" />
                            שיוך לקוחות
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditTag(tag)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
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
              </div>
            )}
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
