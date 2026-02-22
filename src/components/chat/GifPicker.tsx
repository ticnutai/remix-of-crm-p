import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Image } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebounce';

interface GifResult {
  id: string;
  url: string;
  preview: string;
  title: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, title: string) => void;
}

const GIPHY_KEY = 'dc6zaTOxFJmzC'; // Public beta key

async function searchGifs(query: string): Promise<GifResult[]> {
  try {
    const endpoint = query
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g&lang=he`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=g`;
    const res = await fetch(endpoint);
    const json = await res.json();
    return (json.data || []).map((g: any) => ({
      id: g.id,
      url: g.images.original.url,
      preview: g.images.fixed_height_small.url || g.images.preview_gif.url,
      title: g.title,
      width: parseInt(g.images.fixed_height_small.width || '120'),
      height: parseInt(g.images.fixed_height_small.height || '80'),
    }));
  } catch {
    return [];
  }
}

export function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 500);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    const results = await searchGifs(q);
    setGifs(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load(debouncedQuery);
  }, [debouncedQuery, open, load]);

  useEffect(() => {
    if (open && gifs.length === 0) load('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image size={18} />
            בחר GIF
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חפש GIF..."
            className="pr-9"
          />
        </div>

        <div className="h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              לא נמצאו GIFs
            </div>
          ) : (
            <div className="columns-3 gap-1 space-y-1">
              {gifs.map(gif => (
                <img
                  key={gif.id}
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full rounded cursor-pointer hover:opacity-80 transition-opacity break-inside-avoid"
                  onClick={() => { onSelect(gif.url, gif.title); onClose(); }}
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-1">
          <span className="text-[10px] text-muted-foreground">Powered by GIPHY</span>
          <Button variant="ghost" size="sm" onClick={onClose}>סגור</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
