/**
 * מערכת ניהול קבצים מתקדמת - Advanced Files Page
 * תכונות: העלאה, תצוגה מקדימה, חיפוש, שיתוף, סטטיסטיקות
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Grid3x3, 
  List, 
  Search,
  FolderPlus,
  BarChart3,
  Settings,
  File,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  Star,
  Download,
  Share2,
  MoreVertical,
  Trash2,
  Eye,
  Folder,
  Home,
  ChevronRight,
  Loader2,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdvancedFiles, FileMetadata } from '@/hooks/useAdvancedFiles';
import { AdvancedFileUpload } from '@/components/files/AdvancedFileUpload';
import { FilePreview } from '@/components/files/FilePreview';
import { AdvancedFileSearch } from '@/components/files/AdvancedFileSearch';
import { FileStatsCard } from '@/components/files/FileStatsCard';
import { FileSharingDialog } from '@/components/files/FileSharingDialog';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// File type icons
const FILE_TYPE_ICONS: Record<string, any> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  pdf: FileText,
  spreadsheet: FileText,
  folder: Folder,
  default: File,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  image: 'text-purple-500',
  video: 'text-pink-500',
  audio: 'text-green-500',
  document: 'text-blue-500',
  pdf: 'text-red-500',
  spreadsheet: 'text-emerald-500',
  folder: 'text-yellow-500',
  default: 'text-gray-500',
};

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export default function AdvancedFiles() {
  const {
    files,
    folders,
    currentFolder,
    setCurrentFolder,
    isLoading,
    stats,
    uploadFile,
    deleteFile,
    createFolder,
    loadFiles,
    downloadFile,
    shareFile,
    toggleStar,
    search,
  } = useAdvancedFiles();

  const [activeTab, setActiveTab] = useState<'files' | 'search' | 'stats' | 'settings'>('files');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharingFile, setSharingFile] = useState<FileMetadata | null>(null);
  const [searchResults, setSearchResults] = useState<FileMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // קבצים לתצוגה (רגיל או תוצאות חיפוש)
  const displayFiles = searchResults.length > 0 ? searchResults : files;

  // טיפול בהעלאה
  const handleUpload = async (uploadedFiles: File[]) => {
    for (const file of uploadedFiles) {
      await uploadFile(file);
    }
    setShowUploadDialog(false);
  };

  // יצירת תיקייה
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName);
    setShowNewFolderDialog(false);
    setNewFolderName('');
  };

  // פתיחת preview
  const handleFileClick = (file: FileMetadata) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  // הורדת קובץ
  const handleDownload = async (file: FileMetadata) => {
    await downloadFile(file);
  };

  // מחיקת קובץ
  const handleDelete = async (file: FileMetadata) => {
    if (confirm(`האם למחוק את הקובץ "${file.name}"?`)) {
      await deleteFile(file);
    }
  };

  // שיתוף קובץ
  const handleShare = (file: FileMetadata) => {
    setSharingFile(file);
    setShowShareDialog(true);
  };

  // כוכב
  const handleToggleStar = async (file: FileMetadata) => {
    await toggleStar(file.id);
    await loadFiles(currentFolder);
  };

  // חיפוש
  const handleSearch = async (query: string, filters: any) => {
    setIsSearching(true);
    const results = await search(query, filters);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Breadcrumb navigation
  const folderPath = currentFolder ? currentFolder.split('/') : [];

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ניהול קבצים מתקדם</h1>
            <p className="text-muted-foreground">העלה, נהל ושתף קבצים בקלות</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowNewFolderDialog(true)} variant="outline">
              <FolderPlus className="h-4 w-4 ml-2" />
              תיקייה חדשה
            </Button>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 ml-2" />
              העלאת קבצים
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="files" className="gap-2">
              <Folder className="h-4 w-4" />
              קבצים
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              חיפוש
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              סטטיסטיקות
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              הגדרות
            </TabsTrigger>
          </TabsList>

          {/* Tab: Files */}
          <TabsContent value="files" className="space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFolder(undefined)}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                בית
              </Button>
              {folderPath.map((folder, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentFolder(folderPath.slice(0, index + 1).join('/'))}
                  >
                    {folder}
                  </Button>
                </React.Fragment>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {displayFiles.length} קבצים
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Folders */}
            {folders.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {folders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setCurrentFolder(folder.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <Folder className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
                      <p className="text-sm font-medium truncate">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">{folder.fileCount} קבצים</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Files */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : displayFiles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <File className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">אין קבצים</p>
                  <p className="text-muted-foreground">העלה קבצים כדי להתחיל</p>
                  <Button onClick={() => setShowUploadDialog(true)} className="mt-4">
                    <Upload className="h-4 w-4 ml-2" />
                    העלה קבצים
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {displayFiles.map((file) => {
                  const Icon = FILE_TYPE_ICONS[file.type] || FILE_TYPE_ICONS.default;
                  const color = FILE_TYPE_COLORS[file.type] || FILE_TYPE_COLORS.default;
                  
                  return (
                    <Card
                      key={file.id}
                      className="group cursor-pointer hover:shadow-lg transition-shadow relative"
                    >
                      <CardContent className="p-4">
                        {/* Thumbnail or Icon */}
                        <div
                          className="aspect-square mb-2 rounded-lg bg-muted flex items-center justify-center overflow-hidden"
                          onClick={() => handleFileClick(file)}
                        >
                          {file.thumbnail ? (
                            <img
                              src={file.thumbnail}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon className={cn('h-12 w-12', color)} />
                          )}
                        </div>

                        {/* File Info */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>

                        {/* Star Badge */}
                        {file.isStarred && (
                          <Star className="absolute top-2 right-2 h-4 w-4 fill-yellow-500 text-yellow-500" />
                        )}

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rtl">
                            <DropdownMenuItem onClick={() => handleFileClick(file)}>
                              <Eye className="h-4 w-4 ml-2" />
                              תצוגה מקדימה
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="h-4 w-4 ml-2" />
                              הורדה
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(file)}>
                              <Share2 className="h-4 w-4 ml-2" />
                              שיתוף
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStar(file)}>
                              <Star className="h-4 w-4 ml-2" />
                              {file.isStarred ? 'הסר כוכב' : 'הוסף כוכב'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(file)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              מחיקה
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {displayFiles.map((file) => {
                      const Icon = FILE_TYPE_ICONS[file.type] || FILE_TYPE_ICONS.default;
                      const color = FILE_TYPE_COLORS[file.type] || FILE_TYPE_COLORS.default;
                      
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer group"
                          onClick={() => handleFileClick(file)}
                        >
                          <Icon className={cn('h-8 w-8 flex-shrink-0', color)} />
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true, locale: he })}
                            </p>
                          </div>

                          {file.isStarred && (
                            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rtl">
                              <DropdownMenuItem onClick={() => handleDownload(file)}>
                                <Download className="h-4 w-4 ml-2" />
                                הורדה
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(file)}>
                                <Share2 className="h-4 w-4 ml-2" />
                                שיתוף
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStar(file)}>
                                <Star className="h-4 w-4 ml-2" />
                                {file.isStarred ? 'הסר כוכב' : 'הוסף כוכב'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(file)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                מחיקה
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Search */}
          <TabsContent value="search">
            <AdvancedFileSearch
              onSearch={(filters) => handleSearch(filters?.query || '', filters)}
              availableTags={[]}
              isLoading={isSearching}
            />
          </TabsContent>

          {/* Tab: Statistics */}
          <TabsContent value="stats">
            {stats && <FileStatsCard stats={stats} />}
          </TabsContent>

          {/* Tab: Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>הגדרות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">אחסון</h3>
                  <p className="text-sm text-muted-foreground">
                    סה"כ: {stats ? formatFileSize(stats.totalSize) : '0 B'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">תצוגת ברירת מחדל</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      onClick={() => setViewMode('grid')}
                    >
                      גריד
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      onClick={() => setViewMode('list')}
                    >
                      רשימה
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {showUploadDialog && (
          <AdvancedFileUpload
            onUpload={handleUpload}
            folderId={currentFolder}
          />
        )}

        {showPreview && selectedFile && (
          <FilePreview
            file={selectedFile}
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            onDownload={() => handleDownload(selectedFile)}
          />
        )}

        {showShareDialog && sharingFile && (
          <FileSharingDialog
            isOpen={showShareDialog}
            file={sharingFile}
            onClose={() => setShowShareDialog(false)}
            onShare={async (userIds, permissions) => {
              await shareFile(sharingFile.id, userIds, permissions);
              setShowShareDialog(false);
            }}
            onCreateLink={async () => ''}
          />
        )}

        {/* New Folder Dialog */}
        {showNewFolderDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>תיקייה חדשה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="שם התיקייה"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleCreateFolder}>יצירה</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
