import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Zap } from 'lucide-react';
import type { ChatTemplate } from '@/hooks/useChatExtras';

interface MessageTemplatesProps {
  open: boolean;
  onClose: () => void;
  templates: ChatTemplate[];
  onSelect: (content: string) => void;
}

const CATEGORIES: Record<string, string> = {
  all: 'הכל',
  greeting: 'ברכות',
  closing: 'סגירה',
  followup: 'מעקב',
  general: 'כללי',
};

export function MessageTemplates({ open, onClose, templates, onSelect }: MessageTemplatesProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.title.includes(search) || t.content.includes(search) || t.shortcut?.includes(search);
    const matchTab = tab === 'all' || t.category === tab;
    return matchSearch && matchTab;
  });

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap size={18} />
            תבניות הודעות
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש תבנית..."
            className="pr-9"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1 mb-3">
            {categories.map(c => (
              <TabsTrigger key={c} value={c} className="text-xs">
                {CATEGORIES[c] || c}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab} className="mt-0 max-h-72 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">לא נמצאו תבניות</p>
            ) : (
              filtered.map(t => (
                <div
                  key={t.id}
                  onClick={() => { onSelect(t.content); onClose(); }}
                  className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{t.title}</span>
                    <div className="flex items-center gap-2">
                      {t.shortcut && <Badge variant="outline" className="text-[10px] px-1">{t.shortcut}</Badge>}
                      <span className="text-[10px] text-muted-foreground">{t.use_count}×</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.content}</p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>סגור</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
