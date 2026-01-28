// Client Portal - Files Page
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, Upload, FileText, Download, Trash2, File, FileImage, FileVideo, FileAudio } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ClientFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploader_type: string;
  description: string | null;
  created_at: string;
}

export default function ClientFiles() {
  const { user, isClient, isLoading, clientId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    } else if (!isLoading && user && !isClient) {
      navigate('/');
    }
  }, [isLoading, user, isClient, navigate]);

  useEffect(() => {
    if (clientId) {
      fetchFiles();
    }
  }, [clientId]);

  const fetchFiles = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clientId || !user) return;

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'קובץ גדול מדי',
        description: 'גודל הקובץ המקסימלי הוא 10MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const fileName = `${clientId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('client-files')
        .getPublicUrl(fileName);

      // Save file record
      const { error: dbError } = await supabase
        .from('client_files')
        .insert({
          client_id: clientId,
          uploaded_by: user.id,
          uploader_type: 'client',
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size
        });

      if (dbError) throw dbError;

      toast({
        title: 'הקובץ הועלה בהצלחה',
        description: file.name
      });

      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'שגיאה בהעלאה',
        description: 'לא ניתן להעלות את הקובץ',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-5 w-5" />;
    if (fileType.startsWith('image/')) return <FileImage className="h-5 w-5" />;
    if (fileType.startsWith('video/')) return <FileVideo className="h-5 w-5" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center gap-4 px-4 flex-row-reverse justify-end">
          <h1 className="text-xl font-semibold text-right">קבצים</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/client-portal')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle>העלאת קובץ</CardTitle>
            <CardDescription>שתף קבצים עם הצוות (עד 10MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex-row-reverse"
            >
              {uploading ? (
                <>
                  מעלה...
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                </>
              ) : (
                <>
                  בחר קובץ להעלאה
                  <Upload className="h-4 w-4 mr-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle>הקבצים שלי</CardTitle>
            <CardDescription>קבצים שהועלו ({files.length})</CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                אין קבצים להצגה
              </p>
            ) : (
              <div className="space-y-3">
                {files.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg border flex-row-reverse"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 flex-row-reverse">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {getFileIcon(file.file_type)}
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="font-medium truncate">{file.file_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-row-reverse">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{format(new Date(file.created_at), 'dd/MM/yyyy', { locale: he })}</span>
                          <span>•</span>
                          <span>{file.uploader_type === 'client' ? 'הועלה על ידך' : 'הועלה ע"י הצוות'}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
