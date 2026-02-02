// Google Drive Settings Component
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Home
} from 'lucide-react';
import { useGoogleDrive, DriveFile, DriveFolder } from '@/hooks/useGoogleDrive';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

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

export function GoogleDriveSettings() {
  const { 
    files, 
    folders, 
    isLoading, 
    isUploading, 
    listFiles, 
    uploadFile,
    searchFiles 
  } = useGoogleDrive();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DriveFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
      // Navigate to root
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <HardDrive className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <CardTitle>Google Drive</CardTitle>
              <CardDescription>גישה לקבצים ותיקיות ב-Drive</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {hasLoaded && (
              <>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                  רענון
                </Button>
                <Button variant="outline" size="sm" asChild disabled={isUploading}>
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 ml-2" />
                    {isUploading ? 'מעלה...' : 'העלאה'}
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </Button>
              </>
            )}
            {!hasLoaded && (
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? 'מתחבר...' : 'התחבר ל-Drive'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !hasLoaded && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!hasLoaded && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>לחץ על "התחבר ל-Drive" כדי לראות את הקבצים שלך</p>
          </div>
        )}

        {hasLoaded && (
          <>
            {/* Search bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש קבצים..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pr-9"
                />
              </div>
              <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'מחפש...' : 'חפש'}
              </Button>
            </div>

            {/* Breadcrumb navigation */}
            {!searchQuery && (
              <div className="flex items-center gap-1 mb-4 text-sm flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleNavigateToFolder(-1)}
                >
                  <Home className="h-4 w-4" />
                </Button>
                {currentFolder.map((folder, index) => (
                  <div key={folder.id} className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleNavigateToFolder(index)}
                    >
                      {folder.name}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Folders */}
            {!searchQuery && folders.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">תיקיות</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {folders.map((folder) => (
                    <Button
                      key={folder.id}
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => handleFolderClick(folder)}
                    >
                      <Folder className="h-5 w-5 ml-2 text-yellow-500" />
                      <span className="truncate">{folder.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            <ScrollArea className="h-[300px]">
              {displayFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>אין קבצים בתיקייה זו</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {displayFiles.map((file) => {
                    const FileIcon = getFileIcon(file.mimeType);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(file.webViewLink, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
