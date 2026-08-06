import { useEffect, useMemo, useState } from "react";
import { Cloud, Download, ExternalLink, File, Files, Folder, FolderCheck, HardDrive, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BulkFileUploader } from "@/components/files/BulkFileUploader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { UploadFileItem } from "@/hooks/useChunkedUpload";
import {
  backupFileLocally,
  ensureDirectoryPermission,
  getSavedLocalBackupDirectory,
  selectLocalBackupDirectory,
  supportsLocalFolderBackup,
} from "@/lib/localFileBackup";

interface ClientFileRecord {
  id: string;
  file_name: string;
  file_url: string;
  file_size?: number | null;
  file_type?: string | null;
  created_at?: string;
}

interface ClientFilesManagerProps {
  clientId: string;
  clientName: string;
  userId: string;
  files: ClientFileRecord[];
  onRefresh: () => void;
  variant?: "trigger" | "content";
}

const formatBytes = (bytes?: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

function FileList({ files, onDelete }: { files: ClientFileRecord[]; onDelete: (file: ClientFileRecord) => void }) {
  const groups = useMemo(() => {
    const grouped = new Map<string, ClientFileRecord[]>();
    files.forEach((file) => {
      const path = file.file_name.replace(/\\/g, "/");
      const folder = path.includes("/") ? path.split("/").slice(0, -1).join(" / ") : "קבצים כלליים";
      grouped.set(folder, [...(grouped.get(folder) || []), file]);
    });
    return [...grouped.entries()];
  }, [files]);

  if (!files.length) return <div className="py-10 text-center text-sm text-muted-foreground">עדיין לא הועלו קבצים ללקוח</div>;

  return (
    <div className="space-y-3">
      {groups.map(([folder, entries]) => (
        <section key={folder} className="overflow-hidden rounded-xl border bg-background">
          <div className="flex items-center justify-between bg-muted/50 px-3 py-2 text-sm font-semibold">
            <Badge variant="secondary">{entries.length}</Badge>
            <span className="flex items-center gap-2"><Folder className="h-4 w-4 text-amber-500" />{folder}</span>
          </div>
          {entries.map((file) => (
            <div key={file.id} className="group flex items-center justify-between gap-3 border-t px-3 py-2 hover:bg-muted/30">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(file)} title="מחק קובץ"><Trash2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="פתח קובץ"><a href={file.file_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="הורד"><a href={file.file_url} download><Download className="h-4 w-4" /></a></Button>
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="truncate text-sm font-medium">{file.file_name.replace(/\\/g, "/").split("/").at(-1)}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.file_size)}</p>
              </div>
              <File className="h-5 w-5 shrink-0 text-primary" />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

export function ClientFilesManager({ clientId, clientName, userId, files, onRefresh, variant = "trigger" }: ClientFilesManagerProps) {
  const [open, setOpen] = useState(false);
  const [directory, setDirectory] = useState<any>(null);
  const [localReady, setLocalReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getSavedLocalBackupDirectory().then(async (handle) => {
      setDirectory(handle);
      setLocalReady(Boolean(handle && await ensureDirectoryPermission(handle)));
    }).catch(() => {});
  }, []);

  const connectLocalFolder = async () => {
    try {
      const handle = directory || await selectLocalBackupDirectory();
      const allowed = await ensureDirectoryPermission(handle, true);
      setDirectory(handle);
      setLocalReady(allowed);
      toast({ title: allowed ? "תיקיית הגיבוי המקומית חוברה" : "לא ניתנה הרשאה לתיקייה" });
    } catch (error: any) {
      if (error?.name !== "AbortError") toast({ title: "לא ניתן לחבר תיקייה מקומית", description: error?.message, variant: "destructive" });
    }
  };

  const onFileComplete = async (item: UploadFileItem) => {
    if (!directory || !localReady) return;
    try {
      await backupFileLocally(directory, clientName, item.relativePath, item.file);
    } catch (error: any) {
      setLocalReady(false);
      toast({ title: "הקובץ נשמר בענן, אך הגיבוי המקומי נכשל", description: error?.message, variant: "destructive" });
    }
  };

  const deleteFile = async (file: ClientFileRecord) => {
    if (!window.confirm(`למחוק את ${file.file_name}?`)) return;
    try {
      const marker = "/client-files/";
      const index = file.file_url.indexOf(marker);
      if (index >= 0) {
        const storagePath = decodeURIComponent(file.file_url.slice(index + marker.length).split("?")[0]);
        const { error: storageError } = await supabase.storage.from("client-files").remove([storagePath]);
        if (storageError) throw storageError;
      }
      const { error } = await supabase.from("client_files").delete().eq("id", file.id);
      if (error) throw error;
      toast({ title: "הקובץ נמחק" });
      onRefresh();
    } catch (error: any) {
      toast({ title: "מחיקת הקובץ נכשלה", description: error?.message, variant: "destructive" });
    }
  };

  const content = (
    <div dir="rtl" className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl border bg-emerald-50/60 p-3 text-sm text-emerald-800"><Cloud className="h-5 w-5" /><span><strong>ענן:</strong> מחובר · {files.length} קבצים</span></div>
        <button type="button" onClick={connectLocalFolder} disabled={!supportsLocalFolderBackup()} className="flex items-center gap-2 rounded-xl border bg-amber-50/60 p-3 text-right text-sm text-amber-900 disabled:opacity-50">
          {localReady ? <FolderCheck className="h-5 w-5" /> : <HardDrive className="h-5 w-5" />}
          <span><strong>גיבוי מקומי:</strong> {localReady ? "מחובר" : supportsLocalFolderBackup() ? "לחץ לבחירת תיקייה" : "לא נתמך בדפדפן זה"}</span>
        </button>
      </div>
      <BulkFileUploader clientId={clientId} userId={userId} onComplete={onRefresh} onFileComplete={onFileComplete} />
      <ScrollArea className="h-[320px] rounded-xl border bg-muted/10 p-3"><FileList files={files} onDelete={deleteFile} /></ScrollArea>
    </div>
  );

  if (variant === "content") return content;

  return (
    <>
      <div className="group relative">
        <CardButton count={files.length} onClick={() => setOpen(true)} />
        <div className="pointer-events-none invisible absolute bottom-[calc(100%-8px)] left-1/2 z-50 w-80 -translate-x-1/2 pb-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
          <div className="rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl">
            <div className="mb-2 flex items-center justify-between"><Badge>{files.length}</Badge><strong className="flex items-center gap-2"><Files className="h-4 w-4" />קבצי הלקוח</strong></div>
            <div className="max-h-52 space-y-1 overflow-hidden text-right text-sm">{files.slice(0, 6).map(file => <div key={file.id} className="truncate rounded-md bg-muted/60 px-2 py-1.5">{file.file_name}</div>)}{!files.length && <p className="text-muted-foreground">אין קבצים</p>}</div>
            {files.length > 6 && <p className="mt-2 text-xs text-muted-foreground">ועוד {files.length - 6} קבצים</p>}
          </div>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader className="text-right"><DialogTitle className="flex items-center gap-2 text-xl"><Files className="h-5 w-5 text-primary" />קבצים ותיקיות — {clientName}</DialogTitle><DialogDescription>העלאת קובץ בודד, מספר קבצים או תיקייה שלמה בגרירה. הקבצים נשמרים בענן ובתיקייה המקומית שחיברת.</DialogDescription></DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CardButton({ count, onClick }: { count: number; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex h-full min-h-[190px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-[hsl(222,47%,25%)]/50 bg-card p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"><span className="rounded-xl bg-[hsl(222,47%,20%)] p-3 text-[hsl(45,70%,55%)]"><Files className="h-7 w-7" /></span><strong className="text-lg">קבצים ומסמכים</strong><span className="text-sm text-muted-foreground">{count ? `${count} קבצים שמורים` : "העלה קבצים ותיקיות"}</span></button>;
}
