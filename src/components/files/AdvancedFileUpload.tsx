/**
 * Advanced File Upload Component
 * תכונות: Drag & Drop, Multiple Files, Progress, Preview
 */

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image, Video, Music, FileText, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UploadingFile {
  file: File;
  progress: number;
  id: string;
  preview?: string;
  error?: string;
}

interface AdvancedFileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  folderId?: string;
  tags?: string[];
  category?: string;
}

export function AdvancedFileUpload({
  onUpload,
  accept,
  maxSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10,
  folderId,
  tags = [],
  category = 'general',
}: AdvancedFileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // יצירת previews לקבצים
    const filesWithPreviews: UploadingFile[] = await Promise.all(
      acceptedFiles.map(async (file) => {
        let preview: string | undefined;
        
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }

        return {
          file,
          progress: 0,
          id: crypto.randomUUID(),
          preview,
        };
      })
    );

    setUploadingFiles(filesWithPreviews);
    setIsUploading(true);

    try {
      // העלאה בזה אחר זה עם עדכון progress
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        
        // סימולציה של progress (במציאות צריך להשתמש ב-XMLHttpRequest)
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadingFiles(prev =>
            prev.map((f, idx) =>
              idx === i ? { ...f, progress } : f
            )
          );
        }
      }

      await onUpload(acceptedFiles);

      // ניקוי previews
      filesWithPreviews.forEach(f => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview);
        }
      });

      setUploadingFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev =>
        prev.map(f => ({
          ...f,
          error: 'העלאה נכשלה',
        }))
      );
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
  });

  const removeFile = (id: string) => {
    setUploadingFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-5 w-5" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          isDragActive
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium text-primary">
            שחרר את הקבצים כאן...
          </p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              גרור ושחרר קבצים כאן, או לחץ לבחירה
            </p>
            <p className="text-sm text-gray-500">
              עד {maxFiles} קבצים, מקסימום {formatFileSize(maxSize)} לקובץ
            </p>
          </>
        )}
      </div>

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">קבצים בהעלאה ({uploadingFiles.length})</h3>
          {uploadingFiles.map((uploadingFile) => (
            <Card key={uploadingFile.id} className="p-4">
              <div className="flex items-start gap-3">
                {/* Preview or Icon */}
                <div className="flex-shrink-0">
                  {uploadingFile.preview ? (
                    <img
                      src={uploadingFile.preview}
                      alt={uploadingFile.file.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center">
                      {getFileIcon(uploadingFile.file.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {uploadingFile.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(uploadingFile.file.size)}
                      </p>
                    </div>
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadingFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {isUploading && (
                    <div className="space-y-1">
                      <Progress value={uploadingFile.progress} className="h-2" />
                      <p className="text-xs text-gray-500 text-left">
                        {uploadingFile.progress}%
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {uploadingFile.error && (
                    <Badge variant="destructive" className="mt-2">
                      {uploadingFile.error}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {!isUploading && uploadingFiles.length === 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="cursor-help">
            📸 תמונות
          </Badge>
          <Badge variant="outline" className="cursor-help">
            📄 מסמכים
          </Badge>
          <Badge variant="outline" className="cursor-help">
            🎬 וידאו
          </Badge>
          <Badge variant="outline" className="cursor-help">
            📦 כל הקבצים
          </Badge>
        </div>
      )}
    </div>
  );
}
