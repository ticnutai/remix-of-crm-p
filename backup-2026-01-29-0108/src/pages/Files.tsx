// Files Page - Advanced File Management System with Google Drive
// מערכת ניהול קבצים מתקדמת עם סינכרון Google Drive

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  HardDrive, 
  RefreshCw, 
  Folder,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
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
  Share2,
  Link2,
  Copy,
  Star,
  Clock,
  Users,
  Info,
  Filter,
  SortAsc,
  CheckCircle2,
  XCircle,
  Cloud,
  CloudOff,
  FolderOpen,
  FileUp,
  FolderSync,
  Settings,
  Paperclip,
  Image,
  Film,
  Music,
  Database,
  X,
} from 'lucide-react';
import { useGoogleDrive, DriveFile, DriveFolder } from '@/hooks/useGoogleDrive';
import { useGoogleServices } from '@/hooks/useGoogleServices';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// File type icons and colors
const FILE_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  'folder': { icon: Folder, color: 'text-yellow-500', label: 'תיקייה' },
  'image': { icon: FileImage, color: 'text-purple-500', label: 'תמונה' },
  'video': { icon: FileVideo, color: 'text-pink-500', label: 'וידאו' },
  'audio': { icon: FileAudio, color: 'text-green-500', label: 'אודיו' },
  'document': { icon: FileText, color: 'text-blue-500', label: 'מסמך' },
  'spreadsheet': { icon: FileSpreadsheet, color: 'text-emerald-500', label: 'גיליון' },
  'archive': { icon: FileArchive, color: 'text-orange-500', label: 'ארכיון' },
  'code': { icon: FileCode, color: 'text-cyan-500', label: 'קוד' },
  'pdf': { icon: FileText, color: 'text-red-500', label: 'PDF' },
  'default': { icon: File, color: 'text-gray-500', label: 'קובץ' },
};

const getFileTypeConfig = (mimeType: string) => {
  if (mimeType.includes('folder')) return FILE_TYPE_CONFIG.folder;
  if (mimeType.includes('image')) return FILE_TYPE_CONFIG.image;
  if (mimeType.includes('video')) return FILE_TYPE_CONFIG.video;
  if (mimeType.includes('audio')) return FILE_TYPE_CONFIG.audio;
  if (mimeType.includes('pdf')) return FILE_TYPE_CONFIG.pdf;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) 
    return FILE_TYPE_CONFIG.spreadsheet;
  if (mimeType.includes('document') || mimeType.includes('text') || mimeType.includes('word')) 
    return FILE_TYPE_CONFIG.document;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive') || mimeType.includes('compressed')) 
    return FILE_TYPE_CONFIG.archive;
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) 
    return FILE_TYPE_CONFIG.code;
  return FILE_TYPE_CONFIG.default;
};

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// File Categories
const FILE_CATEGORIES = [
  { id: 'all', label: 'הכל', icon: Folder },
  { id: 'documents', label: 'מסמכים', icon: FileText },
  { id: 'images', label: 'תמונות', icon: Image },
  { id: 'videos', label: 'וידאו', icon: Film },
  { id: 'audio', label: 'אודיו', icon: Music },
  { id: 'spreadsheets', label: 'גיליונות', icon: FileSpreadsheet },
  { id: 'archives', label: 'ארכיונים', icon: FileArchive },
];

// Sort Options
const SORT_OPTIONS = [
  { id: 'name-asc', label: 'שם (א-ת)', field: 'name', direction: 'asc' },
  { id: 'name-desc', label: 'שם (ת-א)', field: 'name', direction: 'desc' },
  { id: 'date-desc', label: 'תאריך (חדש לישן)', field: 'modifiedTime', direction: 'desc' },
  { id: 'date-asc', label: 'תאריך (ישן לחדש)', field: 'modifiedTime', direction: 'asc' },
  { id: 'size-desc', label: 'גודל (גדול לקטן)', field: 'size', direction: 'desc' },
  { id: 'size-asc', label: 'גודל (קטן לגדול)', field: 'size', direction: 'asc' },
];

export default function Files() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { clients } = useClients();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Google Drive hooks
  const { 
    files: driveFiles, 
    folders: driveFolders, 
    isLoading: isDriveLoading, 
    isUploading: isDriveUploading, 
    listFiles: listDriveFiles, 
    uploadFile: uploadToDrive,
    createFolder: createDriveFolder,
    searchFiles: searchDriveFiles,
    linkFileToClient,
  } = useGoogleDrive();
  const { isConnected, getAccessToken, disconnect } = useGoogleServices();
  
  // State
  const [activeTab, setActiveTab] = useState<'drive' | 'linked'>('drive');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DriveFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Upload state
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Dialog states
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkingFile, setLinkingFile] = useState<DriveFile | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [selectedFileDetails, setSelectedFileDetails] = useState<DriveFile | null>(null);
  
  // Local files state
  const [linkedFiles, setLinkedFiles] = useState<any[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  // Load linked files from Supabase
  const loadLinkedFiles = useCallback(async () => {
    if (!user) return;
    setIsLoadingLocal(true);
    
    try {
      const { data: linked, error } = await supabase
        .from('google_drive_files')
        .select(`
          *,
          clients (id, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLinkedFiles(linked || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoadingLocal(false);
    }
  }, [user]);

  // Auto-load files
  useEffect(() => {
    if (isConnected && !hasLoaded && !isDriveLoading) {
      listDriveFiles('root').then(() => setHasLoaded(true));
    }
    loadLinkedFiles();
  }, [isConnected, hasLoaded, isDriveLoading, listDriveFiles, loadLinkedFiles]);

  // Connect to Google Drive
  const handleConnect = async () => {
    const token = await getAccessToken(['drive']);
    if (token) {
      await listDriveFiles('root');
      setHasLoaded(true);
    }
  };

  // Refresh files
  const handleRefresh = async () => {
    const folderId = currentFolder.length > 0 
      ? currentFolder[currentFolder.length - 1].id 
      : 'root';
    await listDriveFiles(folderId);
    await loadLinkedFiles();
  };

  // Navigate to folder
  const handleFolderClick = async (folder: DriveFolder) => {
    await listDriveFiles(folder.id);
    setCurrentFolder([...currentFolder, folder]);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFiles([]);
  };

  // Navigate breadcrumb
  const handleNavigateToFolder = async (index: number) => {
    if (index === -1) {
      await listDriveFiles('root');
      setCurrentFolder([]);
    } else {
      const folder = currentFolder[index];
      await listDriveFiles(folder.id);
      setCurrentFolder(currentFolder.slice(0, index + 1));
    }
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFiles([]);
  };

  // Search files
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchDriveFiles(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const parentId = currentFolder.length > 0 
      ? currentFolder[currentFolder.length - 1].id 
      : undefined;
    
    const folder = await createDriveFolder(newFolderName, parentId);
    if (folder) {
      await handleRefresh();
      setShowNewFolderDialog(false);
      setNewFolderName('');
    }
  };

  // File upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFilesUpload(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await handleFilesUpload(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFilesUpload = async (files: File[]) => {
    const folderId = currentFolder.length > 0 
      ? currentFolder[currentFolder.length - 1].id 
      : undefined;
    
    // Initialize upload queue
    const queue: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setUploadQueue(queue);
    setShowUploadDialog(true);
    
    // Upload files sequentially
    for (let i = 0; i < queue.length; i++) {
      setUploadQueue(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'uploading', progress: 10 } : item
      ));
      
      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map((item, idx) => 
            idx === i && item.progress < 90 
              ? { ...item, progress: item.progress + 10 } 
              : item
          ));
        }, 200);
        
        const result = await uploadToDrive(files[i], folderId);
        
        clearInterval(progressInterval);
        
        if (result) {
          setUploadQueue(prev => prev.map((item, idx) => 
            idx === i ? { ...item, status: 'completed', progress: 100 } : item
          ));
        } else {
          setUploadQueue(prev => prev.map((item, idx) => 
            idx === i ? { ...item, status: 'error', error: 'שגיאה בהעלאה' } : item
          ));
        }
      } catch (error: any) {
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'error', error: error.message } : item
        ));
      }
    }
    
    // Refresh after all uploads
    await handleRefresh();
  };

  // Link file to client
  const handleLinkFile = async () => {
    if (!linkingFile || !selectedClientId) return;
    
    const success = await linkFileToClient(linkingFile, selectedClientId);
    if (success) {
      await loadLinkedFiles();
      setShowLinkDialog(false);
      setLinkingFile(null);
      setSelectedClientId('');
    }
  };

  // Copy share link
  const copyShareLink = async (file: DriveFile) => {
    try {
      await navigator.clipboard.writeText(file.webViewLink);
      toast({
        title: 'הקישור הועתק',
        description: 'הקישור לקובץ הועתק ללוח',
      });
    } catch {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להעתיק את הקישור',
        variant: 'destructive',
      });
    }
  };

  // Download file
  const downloadFile = (file: DriveFile) => {
    window.open(`https://drive.google.com/uc?export=download&id=${file.id}`, '_blank');
  };

  // Select/deselect file
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Select all files
  const selectAllFiles = () => {
    const allIds = displayFiles.map(f => f.id);
    setSelectedFiles(allIds);
  };

  // Filter and sort files
  const filterFiles = (files: DriveFile[]) => {
    let filtered = [...files];
    
    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(file => {
        const config = getFileTypeConfig(file.mimeType);
        switch (filterCategory) {
          case 'documents': return config.label === 'מסמך' || config.label === 'PDF';
          case 'images': return config.label === 'תמונה';
          case 'videos': return config.label === 'וידאו';
          case 'audio': return config.label === 'אודיו';
          case 'spreadsheets': return config.label === 'גיליון';
          case 'archives': return config.label === 'ארכיון';
          default: return true;
        }
      });
    }
    
    // Sort
    const sortOption = SORT_OPTIONS.find(s => s.id === sortBy);
    if (sortOption) {
      filtered.sort((a, b) => {
        let aVal = a[sortOption.field as keyof DriveFile];
        let bVal = b[sortOption.field as keyof DriveFile];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (sortOption.direction === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }
    
    return filtered;
  };

  const displayFiles = searchQuery && searchResults.length > 0 
    ? filterFiles(searchResults) 
    : filterFiles(driveFiles);

  // Stats
  const totalSize = driveFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  const totalFiles = driveFiles.length;
  const totalFolders = driveFolders.length;

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
