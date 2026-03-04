import React, { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Search, Loader2, Check, Users, User } from 'lucide-react';

interface AddClientsToCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  onUpdate: () => void;
}

interface ClientItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  category_id: string | null;
}

export function AddClientsToCategoryDialog({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  categoryColor,
  onUpdate,
}: AddClientsToCategoryDialogProps) {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  // Fetch clients when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      fetchClients();
      setSelectedIds(new Set());
      setSearch('');
    }
  }, [isOpen]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone, company, category_id')
        .order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.company?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const alreadyInCategory = useMemo(
    () => new Set(clients.filter((c) => c.category_id === categoryId).map((c) => c.id)),
    [clients, categoryId]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const notInCategory = filtered.filter((c) => !alreadyInCategory.has(c.id));
    setSelectedIds(new Set(notInCategory.map((c) => c.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from('clients')
        .update({ category_id: categoryId })
        .in('id', ids);
      if (error) throw error;

      toast({
        title: 'הלקוחות עודכנו בהצלחה',
        description: `${ids.length} לקוחות הוספו לקטגוריה "${categoryName}"`,
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error assigning category:', err);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את הלקוחות',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[hsl(220,60%,20%)]">
            <Users className="h-5 w-5" />
            הוסף לקוחות לקטגוריה
            <Badge
              className="mr-2 text-white text-xs"
              style={{ backgroundColor: categoryColor }}
            >
              {categoryName}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            סמן את הלקוחות שברצונך להוסיף לקטגוריה זו
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש לקוח..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 border-[hsl(40,70%,65%)] focus:border-[hsl(40,70%,55%)]"
          />
        </div>

        {/* Select all / clear */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-[hsl(220,60%,20%)] hover:underline font-medium"
            >
              בחר הכול
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={clearSelection}
                className="text-muted-foreground hover:underline"
              >
                נקה בחירה
              </button>
            )}
          </div>
          {selectedIds.size > 0 && (
            <span className="text-muted-foreground">
              {selectedIds.size} נבחרו
            </span>
          )}
        </div>

        {/* Client list */}
        <ScrollArea className="h-[350px] border rounded-lg border-[hsl(40,70%,65%)]">
          {loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[hsl(40,70%,65%)]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full py-12 text-muted-foreground">
              לא נמצאו לקוחות
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map((client) => {
                const isInCategory = alreadyInCategory.has(client.id);
                const isSelected = selectedIds.has(client.id);

                return (
                  <label
                    key={client.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                      isInCategory
                        ? 'bg-muted/50 border-transparent opacity-60 cursor-default'
                        : isSelected
                        ? 'bg-[hsl(40,70%,65%,0.12)] border-[hsl(40,70%,65%)]'
                        : 'border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={isInCategory || isSelected}
                      disabled={isInCategory}
                      onCheckedChange={() => !isInCategory && toggleSelect(client.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[hsl(220,60%,20%)] truncate flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {client.name}
                        {isInCategory && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            כבר בקטגוריה
                          </Badge>
                        )}
                      </div>
                      {(client.email || client.phone || client.company) && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {[client.company, client.email, client.phone]
                            .filter(Boolean)
                            .join(' • ')}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            ביטול
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedIds.size === 0}
            className="bg-[hsl(220,60%,20%)] hover:bg-[hsl(220,60%,25%)] text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                מוסיף...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 ml-2" />
                הוסף {selectedIds.size > 0 ? `${selectedIds.size} לקוחות` : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
