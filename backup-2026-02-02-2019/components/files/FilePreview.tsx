/**
 * File Preview Component - תצוגה מקדימה של קבצים
 * תומך ב: תמונות, PDF, וידאו, אודיו, טקסט
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Share2,
  Star,
  Trash2,
} from 'lucide-react';
import type { FileMetadata } from '@/hooks/useAdvancedFiles';

interface FilePreviewProps {
  file: FileMetadata | null;
  files?: FileMetadata[];
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (file: FileMetadata) => void;
  onDelete?: (file: FileMetadata) => void;
  onShare?: (file: FileMetadata) => void;
  onToggleStar?: (file: FileMetadata) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export function FilePreview({
  file,
  files = [],
  isOpen,
  onClose,
  onDownload,
  onDelete,
  onShare,
  onToggleStar,
  onNavigate,
}: FilePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!file) return null;

  const currentIndex = files.findIndex(f => f.id === file.id);
  const canNavigate = files.length > 1;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleFullscreen = () => setIsFullscreen(!isFullscreen);

  const renderPreview = () => {
    const { type, path, name } = file;

    // תמונות
    if (type === 'image') {
      return (
        <div className="flex items-center justify-center h-full">
          <img
            src={file.preview || path}
            alt={name}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      );
    }

    // PDF
    if (type === 'pdf') {
      return (
        <iframe
          src={path}
          className="w-full h-full border-0"
          title={name}
        />
      );
    }

    // וידאו
    if (type === 'video') {
      return (
        <video
          src={path}
          controls
          className="w-full h-full"
          style={{ maxHeight: '80vh' }}
        >
          הדפדפן שלך אינו תומך בתגית וידאו
        </video>
      );
    }

    // אודיו
    if (type === 'audio') {
      return (
        <div className="flex items-center justify-center h-full">
          <audio src={path} controls className="w-full max-w-md">
            הדפדפן שלך אינו תומך בתגית אודיו
          </audio>
        </div>
      );
    }

    // טקסט
    if (type === 'text') {
      return (
        <iframe
          src={path}
          className="w-full h-full border-0 bg-white"
          title={name}
        />
      );
    }

    // קובץ לא נתמך - הצגת מידע בלבד
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-gray-500 mb-6">
          תצוגה מקדימה אינה זמינה עבור סוג קובץ זה
        </p>
        <Button onClick={() => onDownload?.(file)}>
          <Download className="ml-2 h-4 w-4" />
          הורד קובץ
        </Button>
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'max-w-6xl h-[90vh] p-0 overflow-hidden',
          isFullscreen && 'w-screen h-screen max-w-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold truncate">{file.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{formatDate(file.uploadedAt)}</span>
              </div>
            </div>
            {file.isStarred && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onToggleStar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStar(file)}
                title={file.isStarred ? 'הסר מועדפים' : 'הוסף למועדפים'}
              >
                <Star className={cn('h-4 w-4', file.isStarred && 'fill-current')} />
              </Button>
            )}
            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare(file)}
                title="שתף"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(file)}
                title="הורד"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(file)}
                title="מחק"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-hidden bg-gray-50 relative">
          {renderPreview()}

          {/* Navigation Arrows */}
          {canNavigate && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 shadow-lg"
                onClick={() => onNavigate?.('prev')}
                disabled={currentIndex === 0}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 shadow-lg"
                onClick={() => onNavigate?.('next')}
                disabled={currentIndex === files.length - 1}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Bottom Toolbar */}
        {(file.type === 'image' || file.type === 'pdf') && (
          <div className="flex items-center justify-between p-4 border-t bg-white">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 300}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Transform Controls */}
            {file.type === 'image' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4 ml-2" />
                  סובב
                </Button>
                <Button variant="outline" size="sm" onClick={handleFullscreen}>
                  <Maximize2 className="h-4 w-4 ml-2" />
                  {isFullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}
                </Button>
              </div>
            )}

            {/* File Info */}
            <div className="flex items-center gap-2">
              {file.tags.length > 0 && (
                <div className="flex gap-1">
                  {file.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {file.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{file.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
