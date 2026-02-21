/**
 * ChatFilePicker - בוחר קבצים חכם לצ'אט
 * 3 מקורות: העלאה מקומית | Google Drive | Gmail
 * כל פורמט כולל וידאו ושמע
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useGoogleDrive, DriveFile } from '@/hooks/useGoogleDrive';
import { useGmailIntegration } from '@/hooks/useGmailIntegration';
import { useGoogleServices } from '@/hooks/useGoogleServices';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  HardDrive,
  Mail,
  Search,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  Loader2,
  Check,
  ExternalLink,
  X,
  AlertCircle,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------
export interface PickedFile {
  source: 'upload' | 'google_drive' | 'gmail';
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  drive_file_id?: string;
  gmail_message_id?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
}

// -----------------------------------------------------------
// File type icon helper
// -----------------------------------------------------------
function FileIcon({ mimeType, className }: { mimeType?: string; className?: string }) {
  const t = mimeType || '';
  if (t.startsWith('image/')) return <FileImage className={cn('h-5 w-5 text-blue-500', className)} />;
  if (t.startsWith('video/')) return <FileVideo className={cn('h-5 w-5 text-purple-500', className)} />;
  if (t.startsWith('audio/')) return <FileAudio className={cn('h-5 w-5 text-pink-500', className)} />;
  if (t.includes('pdf')) return <FileText className={cn('h-5 w-5 text-red-500', className)} />;
  if (t.includes('word') || t.includes('document')) return <FileText className={cn('h-5 w-5 text-blue-700', className)} />;
  if (t.includes('sheet') || t.includes('excel')) return <FileText className={cn('h-5 w-5 text-green-600', className)} />;
  if (t.includes('zip') || t.includes('rar') || t.includes('archive')) return <FileArchive className={cn('h-5 w-5 text-yellow-600', className)} />;
  if (t.includes('javascript') || t.includes('typescript') || t.includes('html') || t.includes('css')) {
    return <FileCode className={cn('h-5 w-5 text-orange-500', className)} />;
  }
  return <File className={cn('h-5 w-5 text-muted-foreground', className)} />;
}

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// -----------------------------------------------------------
// Upload Tab
// -----------------------------------------------------------
function UploadTab({ onPick }: { onPick: (f: PickedFile) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<PickedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const ACCEPT = [
    // Images
    'image/*',
    // Videos  
    'video/*',
    // Audio
    'audio/*',
    // Documents
    '.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx',
    '.txt','.csv','.rtf',
    // Archives
    '.zip','.rar','.7z','.tar','.gz',
    // Code
    '.js','.ts','.html','.css','.json','.xml',
  ].join(',');

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(10);
    try {
      const ext = file.name.split('.').pop();
      const path = `chat-files/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 85));
      }, 300);

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, file, { upsert: false });

      clearInterval(progressInterval);

      if (error) throw error;

      setProgress(95);
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);

      // Get video duration if video
      let duration: number | undefined;
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        try {
          duration = await new Promise<number>((resolve) => {
            const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
            media.preload = 'metadata';
            media.onloadedmetadata = () => resolve(Math.round(media.duration));
            media.src = URL.createObjectURL(file);
          });
        } catch { /* ignore */ }
      }

      const picked: PickedFile = {
        source: 'upload',
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        duration_seconds: duration,
      };

      setProgress(100);
      setUploadedFiles(prev => [picked, ...prev]);
      setTimeout(() => { setProgress(0); setUploading(false); }, 500);

      return picked;
    } catch (err: any) {
      toast({ title: 'שגיאה בהעלאת קובץ', description: err.message, variant: 'destructive' });
      setProgress(0);
      setUploading(false);
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const f of arr) {
      const picked = await uploadFile(f);
      if (picked) onPick(picked);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'
        )}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={e => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'h-14 w-14 rounded-full flex items-center justify-center transition-colors',
            dragging ? 'bg-primary/20' : 'bg-muted'
          )}>
            <Upload className={cn('h-7 w-7', dragging ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div>
            <p className="font-medium text-sm">{dragging ? 'שחרר לכאן!' : 'גרור קבצים או לחץ לבחירה'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              תמונות • וידאו • שמע • PDF • Word • Excel • ZIP • כל פורמט
            </p>
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {['MP4','MOV','AVI','MP3','PDF','DOCX','XLSX','PNG','JPG','ZIP'].map(f => (
              <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Progress */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>מעלה קובץ...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">קבצים שהועלו:</p>
          <div className="space-y-1">
            {uploadedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                onClick={() => onPick(f)}
              >
                <FileIcon mimeType={f.file_type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{f.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(f.file_size)}</p>
                </div>
                <Check className="h-4 w-4 text-green-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------
// Google Drive Tab
// -----------------------------------------------------------
function GoogleDriveTab({ onPick }: { onPick: (f: PickedFile) => void }) {
  const { listFiles, searchFiles, files, folders, isLoading } = useGoogleDrive();
  const { isConnected } = useGoogleServices();
  const [search, setSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState('root');
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isConnected) listFiles(currentFolder);
  }, [currentFolder, isConnected]);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length > 2) await searchFiles(q);
    else if (!q) listFiles(currentFolder);
  };

  const openFolder = (id: string, name: string) => {
    setFolderStack(prev => [...prev, { id: currentFolder, name: name }]);
    setCurrentFolder(id);
  };

  const goBack = () => {
    if (folderStack.length === 0) return;
    const prev = folderStack[folderStack.length - 1];
    setFolderStack(s => s.slice(0, -1));
    setCurrentFolder(prev.id);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
        <Cloud className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Google Drive לא מחובר</p>
        <p className="text-xs text-muted-foreground">
          חבר את חשבון Google שלך מהגדרות → Google
        </p>
      </div>
    );
  }

  const displayFiles = files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {folderStack.length > 0 && (
          <Button variant="ghost" size="sm" onClick={goBack} className="h-8 gap-1">
            ← חזור
          </Button>
        )}
        <div className="relative flex-1">
          <Search className="absolute right-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש בדרייב..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pr-8 h-8 text-sm"
          />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => listFiles(currentFolder)}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="h-60">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* Folders */}
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => openFolder(folder.id, folder.name)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-right"
              >
                <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                  📁
                </div>
                <span className="text-sm font-medium">{folder.name}</span>
                <span className="mr-auto text-xs text-muted-foreground">תיקייה</span>
              </button>
            ))}

            {/* Files */}
            {displayFiles.map(file => (
              <button
                key={file.id}
                onClick={() => onPick({
                  source: 'google_drive',
                  file_name: file.name,
                  file_url: file.webViewLink,
                  file_type: file.mimeType,
                  file_size: file.size,
                  drive_file_id: file.id,
                  thumbnail_url: file.thumbnailLink,
                })}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted hover:text-primary text-right transition-colors"
              >
                {file.thumbnailLink ? (
                  <img src={file.thumbnailLink} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileIcon mimeType={file.mimeType} />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                    {file.modifiedTime && ` • ${format(new Date(file.modifiedTime), 'dd/MM/yy', { locale: he })}`}
                  </p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
            ))}

            {!isLoading && displayFiles.length === 0 && folders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                אין קבצים בתיקייה זו
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// -----------------------------------------------------------
// Gmail Attachments Tab
// -----------------------------------------------------------
function GmailTab({ onPick }: { onPick: (f: PickedFile) => void }) {
  const { fetchEmails, messages, isLoading } = useGmailIntegration();
  const { isConnected } = useGoogleServices();
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isConnected && !loaded) {
      fetchEmails(30, undefined, 'has:attachment');
      setLoaded(true);
    }
  }, [isConnected]);

  const handleSearch = (q: string) => {
    setSearch(q);
    if (q.length > 2) fetchEmails(30, undefined, `has:attachment ${q}`);
    else if (!q) fetchEmails(30, undefined, 'has:attachment');
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
        <Mail className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Gmail לא מחובר</p>
        <p className="text-xs text-muted-foreground">
          חבר את חשבון Google שלך מהגדרות → Google
        </p>
      </div>
    );
  }

  const filtered = messages.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.subject?.toLowerCase().includes(q) || m.fromName?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש מיילים עם קבצים מצורפים..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pr-8 h-8 text-sm"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fetchEmails(30, undefined, 'has:attachment')}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="h-60">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map(msg => (
              <button
                key={msg.id}
                onClick={() => onPick({
                  source: 'gmail',
                  file_name: msg.subject || 'קובץ ממייל',
                  file_url: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
                  file_type: 'message/email',
                  gmail_message_id: msg.id,
                })}
                className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-muted hover:text-primary text-right transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-sm font-bold text-red-600 mt-0.5">
                  {(msg.fromName || msg.from || 'M').slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-medium truncate">{msg.subject || '(ללא נושא)'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    מ: {msg.fromName || msg.from}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{msg.snippet}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                </div>
              </button>
            ))}

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                לא נמצאו מיילים עם קבצים מצורפים
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// We need Paperclip here
import { Paperclip } from 'lucide-react';

// -----------------------------------------------------------
// Main ChatFilePicker Dialog
// -----------------------------------------------------------
export function ChatFilePicker({
  open,
  onOpenChange,
  onFilePicked,
  conversationId,
  clientId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onFilePicked: (f: PickedFile) => void;
  conversationId?: string;
  clientId?: string;
}) {
  const { toast } = useToast();

  const handlePick = (f: PickedFile) => {
    onFilePicked(f);
    onOpenChange(false);
    toast({
      title: 'קובץ נבחר',
      description: f.file_name,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-primary" />
            צרף קובץ
            {clientId && (
              <Badge variant="secondary" className="text-xs">
                מקושר ללקוח
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="space-y-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" />
              העלאה
            </TabsTrigger>
            <TabsTrigger value="drive" className="gap-1.5 text-xs">
              <HardDrive className="h-3.5 w-3.5" />
              Google Drive
            </TabsTrigger>
            <TabsTrigger value="gmail" className="gap-1.5 text-xs">
              <Mail className="h-3.5 w-3.5" />
              Gmail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <UploadTab onPick={handlePick} />
          </TabsContent>

          <TabsContent value="drive">
            <GoogleDriveTab onPick={handlePick} />
          </TabsContent>

          <TabsContent value="gmail">
            <GmailTab onPick={handlePick} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
