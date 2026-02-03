// Client Portal - Files Page
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, Upload, FileText, Download, Trash2, File, FileImage, FileVideo, FileAudio, Image, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import PortalNavigation from '@/components/client-portal/PortalNavigation';

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
    <div dir="rtl" className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold text-right flex-1">קבצים ותמונות</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-4 space-y-4">
        {/* Upload Section */}
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base">העלאת קבצים</CardTitle>
            <CardDescription className="text-xs">שתף קבצים ותמונות עם הצוות (עד 10MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
                className="flex-row-reverse"
              >
                {uploading ? (
                  <>
                    מעלה...
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  </>
                ) : (
                  <>
                    קובץ
                    <Upload className="h-4 w-4 mr-2" />
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.capture = 'environment';
                  input.onchange = (e) => handleFileUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
                  input.click();
                }}
                disabled={uploading}
                className="flex-row-reverse"
              >
                <Camera className="h-4 w-4 mr-2" />
                צלם תמונה
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base">הקבצים שלי ({files.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {files.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                אין קבצים להצגה
              </p>
            ) : (
              <div className="divide-y">
                {files.map(file => {
                  const isImage = file.file_type?.startsWith('image/');
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 flex-row-reverse hover:bg-muted/50 transition-colors"
                    >
                      {/* Thumbnail or Icon */}
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {isImage ? (
                          <img 
                            src={file.file_url} 
                            alt={file.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getFileIcon(file.file_type)
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0 text-right">
                        <p className="font-medium text-sm truncate">{file.file_name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-row-reverse flex-wrap">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{format(new Date(file.created_at), 'dd/MM/yy', { locale: he })}</span>
                          {file.uploader_type !== 'client' && (
                            <>
                              <span>•</span>
                              <span className="text-primary">מהצוות</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Download Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        asChild
                      >
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <PortalNavigation />
    </div>
  );
}
