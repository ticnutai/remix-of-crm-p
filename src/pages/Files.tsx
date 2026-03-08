// Files Page - File management with Google Drive integration
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  HardDrive, 
  RefreshCw, 
  Folder,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  Upload,
  Search,
  ExternalLink,
  ChevronRight,
  Home,
  Grid,
  List,
  Loader2,
  FolderPlus,
  MoreVertical,
  Download,
  Trash2,
  Share2
} from 'lucide-react';
import { useGoogleDrive, DriveFile, DriveFolder } from '@/hooks/useGoogleDrive';
import { useGoogleServices } from '@/hooks/useGoogleServices';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('folder')) return Folder;
  if (mimeType.includes('image')) return FileImage;
  if (mimeType.includes('video')) return FileVideo;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('document') || mimeType.includes('text')) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export default function Files() {
  const { 
    files, 
    folders, 
    isLoading, 
    isUploading, 
    listFiles, 
    uploadFile,
    searchFiles 
  } = useGoogleDrive();
  const { isConnected } = useGoogleServices();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DriveFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Auto-load files if already connected
  useEffect(() => {
    if (isConnected && !hasLoaded && !isLoading) {
      listFiles('root').then(() => setHasLoaded(true));
    }
  }, [isConnected, hasLoaded, isLoading, listFiles]);

  const handleConnect = async () => {
    await listFiles('root');
    setHasLoaded(true);
  };

  const handleRefresh = async () => {
    const folderId = currentFolder.length > 0 
      ? currentFolder[currentFolder.length - 1].id 
      : 'root';
    await listFiles(folderId);
  };

  const handleFolderClick = async (folder: DriveFolder) => {
    await listFiles(folder.id);
    setCurrentFolder([...currentFolder, folder]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleNavigateToFolder = async (index: number) => {
    if (index === -1) {
      await listFiles('root');
      setCurrentFolder([]);
    } else {
      const folder = currentFolder[index];
      await listFiles(folder.id);
      setCurrentFolder(currentFolder.slice(0, index + 1));
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchFiles(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const folderId = currentFolder.length > 0 
      ? currentFolder[currentFolder.length - 1].id 
      : undefined;
    
    await uploadFile(file, folderId);
    await handleRefresh();
  };

  const displayFiles = searchQuery && searchResults.length > 0 ? searchResults : files;

  return (
    <AppLayout>
      <div className="container mx-auto py-4 px-2 md:py-6 md:px-4 max-w-7xl" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <HardDrive className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">קבצים</h1>
              <p className="text-muted-foreground text-sm">ניהול קבצים מ-Google Drive</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            {hasLoaded ? (
              <>
                <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                  רענון
                </Button>
                <Button variant="outline" asChild disabled={isUploading}>
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 ml-2" />
                    {isUploading ? 'מעלה...' : 'העלאת קובץ'}
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </Button>
              </>
            ) : (
              <Button onClick={handleConnect} disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4 ml-2" />
                    התחבר ל-Google Drive
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Not Connected State */}
        {!hasLoaded && !isLoading && (
          <Card className="text-center py-16">
            <CardContent>
              <HardDrive className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">התחבר ל-Google Drive</h2>
              <p className="text-muted-foreground mb-6">
                לחץ על "התחבר ל-Google Drive" כדי לצפות ולנהל את הקבצים שלך
              </p>
              <Button onClick={handleConnect} size="lg">
                <HardDrive className="h-5 w-5 ml-2" />
                התחבר עכשיו
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !hasLoaded && (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {hasLoaded && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="חיפוש קבצים..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9 text-right"
                    dir="rtl"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? 'מחפש...' : 'חפש'}
                  </Button>
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="rounded-r-md rounded-l-none"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="rounded-l-md rounded-r-none"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Breadcrumb navigation */}
              {!searchQuery && (
                <div className="flex items-center gap-1 mb-4 text-sm flex-wrap border-b pb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleNavigateToFolder(-1)}
                  >
                    <Home className="h-4 w-4 ml-1" />
                    ראשי
                  </Button>
                  {currentFolder.map((folder, index) => (
                    <div key={folder.id} className="flex items-center">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleNavigateToFolder(index)}
                      >
                        {folder.name}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Folders - Grid View */}
              {!searchQuery && folders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Folder className="h-4 w-4 text-yellow-500" />
                    תיקיות ({folders.length})
                  </h3>
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                    : "space-y-1"
                  }>
                    {folders.map((folder) => (
                      <Button
                        key={folder.id}
                        variant="outline"
                        className={viewMode === 'grid' 
                          ? "flex flex-col items-center justify-center h-24 p-4"
                          : "w-full justify-start h-12"
                        }
                        onClick={() => handleFolderClick(folder)}
                      >
                        <Folder className={viewMode === 'grid' 
                          ? "h-8 w-8 text-yellow-500 mb-2" 
                          : "h-5 w-5 text-yellow-500 ml-3"
                        } />
                        <span className="truncate text-sm">{folder.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              <div>
                {!searchQuery && files.length > 0 && (
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <File className="h-4 w-4" />
                    קבצים ({displayFiles.length})
                  </h3>
                )}
                
                <ScrollArea className="h-[500px]">
                  {displayFiles.length === 0 && folders.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>אין קבצים בתיקייה זו</p>
                    </div>
                  ) : displayFiles.length === 0 && !searchQuery ? null : (
                    <div className={viewMode === 'grid' 
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                      : "space-y-1"
                    }>
                      {displayFiles.map((file) => {
                        const FileIcon = getFileIcon(file.mimeType);
                        return viewMode === 'grid' ? (
                          <div
                            key={file.id}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                            onClick={() => window.open(file.webViewLink, '_blank')}
                          >
                            <div className="flex flex-col items-center text-center">
                              {file.thumbnailLink ? (
                                <img 
                                  src={file.thumbnailLink} 
                                  alt={file.name}
                                  className="h-16 w-16 object-cover rounded mb-2"
                                />
                              ) : (
                                <FileIcon className="h-12 w-12 text-muted-foreground mb-2" />
                              )}
                              <p className="text-sm font-medium truncate w-full">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors group"
                          >
                            {file.thumbnailLink ? (
                              <img 
                                src={file.thumbnailLink} 
                                alt={file.name}
                                className="h-10 w-10 object-cover rounded"
                              />
                            ) : (
                              <FileIcon className="h-10 w-10 text-muted-foreground" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                                {file.modifiedTime && (
                                  <span className="mr-2">
                                    • עודכן {formatDistanceToNow(new Date(file.modifiedTime), { 
                                      addSuffix: true, 
                                      locale: he 
                                    })}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(file.webViewLink, '_blank');
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="rtl">
                                  <DropdownMenuItem onClick={() => window.open(file.webViewLink, '_blank')}>
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                    פתח
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Share2 className="h-4 w-4 ml-2" />
                                    שתף
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 ml-2" />
                                    הורד
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
