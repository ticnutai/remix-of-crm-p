/**
 * Files Page - מערכת ניהול קבצים מאוחדת
 * משלב Google Drive + אחסון מקומי + תכונות מתקדמות
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Share2,
  Link2,
  Copy,
  Star,
  Users,
  Filter,
  SortAsc,
  CheckCircle2,
  XCircle,
  Cloud,
  CloudOff,
  FolderOpen,
  Paperclip,
  Image,
  Film,
  Music,
  Database,
  Eye,
  BarChart3,
} from 'lucide-react';
import { useGoogleDrive, DriveFile, DriveFolder } from '@/hooks/useGoogleDrive';
import { useGoogleServices } from '@/hooks/useGoogleServices';
import { useClients } from '@/hooks/useClients';
import { useAdvancedFiles, FileMetadata } from '@/hooks/useAdvancedFiles';
import { AdvancedFileUpload } from '@/components/files/AdvancedFileUpload';
import { FilePreview } from '@/components/files/FilePreview';
import { FileSharingDialog } from '@/components/files/FileSharingDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
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
  { id: 'starred', label: 'מועדפים', icon: Star },
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
  const { isConnected, getAccessToken } = useGoogleServices();
  
  // State
  const [activeTab, setActiveTab] = useState<'drive' | 'local' | 'linked' | 'stats'>('drive');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DriveFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [starredFiles, setStarredFiles] = useState<Set<string>>(new Set());
  
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
  
  // Local files state
  const [linkedFiles, setLinkedFiles] = useState<any[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  // Advanced files (local Supabase storage)
  const advancedFiles = useAdvancedFiles();
  const [showLocalUploadDialog, setShowLocalUploadDialog] = useState(false);
  const [selectedLocalFile, setSelectedLocalFile] = useState<FileMetadata | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharingFile, setSharingFile] = useState<FileMetadata | null>(null);

  // Load starred files from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('starred_files');
    if (stored) {
      setStarredFiles(new Set(JSON.parse(stored)));
    }
  }, []);

  // Toggle star file
  const toggleStarFile = (fileId: string) => {
    setStarredFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      localStorage.setItem('starred_files', JSON.stringify([...next]));
      return next;
    });
  };

  // Load linked files from Supabase
  const loadLinkedFiles = useCallback(async () => {
    if (!user) return;
    setIsLoadingLocal(true);
    
    try {
      const { data: linked, error } = await supabase
        .from('google_drive_files')
        .select(`*, clients (id, name)`)
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
    toast({ title: 'רענון הושלם', description: 'הקבצים עודכנו בהצלחה' });
  };

  // Navigate to folder
  const handleFolderClick = async (folder: DriveFolder) => {
    await listDriveFiles(folder.id);
    setCurrentFolder([...currentFolder, folder]);
    setSearchQuery('');
    setSearchResults([]);
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
      toast({ title: 'תיקייה נוצרה', description: `התיקייה "${newFolderName}" נוצרה בהצלחה` });
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFilesUpload = async (files: File[]) => {
    const folderId = currentFolder.length > 0 
      ? currentFolder[currentFolder.length - 1].id 
      : undefined;
    
    const queue: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setUploadQueue(queue);
    setShowUploadDialog(true);
    
    for (let i = 0; i < queue.length; i++) {
      setUploadQueue(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'uploading', progress: 10 } : item
      ));
      
      try {
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
    
    await handleRefresh();
    toast({ title: 'העלאה הושלמה', description: `${files.length} קבצים הועלו בהצלחה` });
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
      toast({ title: 'הקובץ קושר', description: 'הקובץ קושר ללקוח בהצלחה' });
    }
  };

  // Copy share link
  const copyShareLink = async (file: DriveFile) => {
    try {
      await navigator.clipboard.writeText(file.webViewLink);
      toast({ title: 'הקישור הועתק', description: 'הקישור לקובץ הועתק ללוח' });
    } catch {
      toast({ title: 'שגיאה', description: 'לא ניתן להעתיק את הקישור', variant: 'destructive' });
    }
  };

  // Download file
  const downloadFile = (file: DriveFile) => {
    window.open(`https://drive.google.com/uc?export=download&id=${file.id}`, '_blank');
    toast({ title: 'מוריד קובץ', description: `מוריד את ${file.name}` });
  };

  // Filter and sort files
  const filterFiles = (files: DriveFile[]) => {
    let filtered = [...files];
    
    if (filterCategory === 'starred') {
      filtered = filtered.filter(file => starredFiles.has(file.id));
    } else if (filterCategory !== 'all') {
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
  const starredCount = [...starredFiles].filter(id => driveFiles.some(f => f.id === id)).length;

  const filesByType = driveFiles.reduce((acc, file) => {
    const config = getFileTypeConfig(file.mimeType);
    acc[config.label] = (acc[config.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <div className="container mx-auto py-4 px-2 md:py-6 md:px-4 max-w-7xl" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl shadow-sm">
              <HardDrive className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">קבצים</h1>
              <p className="text-muted-foreground text-sm">
                {isConnected ? (
                  <span className="flex items-center gap-1">
                    <Cloud className="h-3 w-3 text-green-500" />
                    מסונכרן עם Google Drive
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CloudOff className="h-3 w-3 text-muted-foreground" />
                    לא מחובר לענן
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto flex-wrap">
            {hasLoaded ? (
              <>
                <Button variant="outline" onClick={handleRefresh} disabled={isDriveLoading}>
                  <RefreshCw className={cn("h-4 w-4 ml-2", isDriveLoading && "animate-spin")} />
                  רענון
                </Button>
                <Button variant="outline" onClick={() => setShowNewFolderDialog(true)}>
                  <FolderPlus className="h-4 w-4 ml-2" />
                  תיקייה חדשה
                </Button>
                <Button 
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
                  disabled={isDriveUploading}
                  asChild
                >
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 ml-2" />
                    {isDriveUploading ? 'מעלה...' : 'העלאת קבצים'}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      multiple
                      className="hidden" 
                      onChange={handleFileSelect}
                      disabled={isDriveUploading}
                    />
                  </label>
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleConnect} 
                disabled={isDriveLoading} 
                className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-blue-600"
              >
                {isDriveLoading ? (
                  <><Loader2 className="h-4 w-4 ml-2 animate-spin" />מתחבר...</>
                ) : (
                  <><HardDrive className="h-4 w-4 ml-2" />התחבר ל-Google Drive</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {hasLoaded && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalFiles}</p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80">קבצים</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Folder className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{totalFolders}</p>
                  <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">תיקיות</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatFileSize(totalSize)}</p>
                  <p className="text-xs text-purple-600/80 dark:text-purple-400/80">נפח כולל</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{starredCount}</p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80">מועדפים</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Not Connected State */}
        {!hasLoaded && !isDriveLoading && (
          <Card className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <CardContent>
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <HardDrive className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">התחבר ל-Google Drive</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                חבר את חשבון Google Drive שלך כדי לנהל, לשתף ולסנכרן את כל הקבצים שלך במקום אחד
              </p>
              <Button onClick={handleConnect} size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600">
                <HardDrive className="h-5 w-5 ml-2" />
                התחבר עכשיו
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isDriveLoading && !hasLoaded && (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="text-muted-foreground">טוען קבצים מהענן...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {hasLoaded && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} dir="rtl">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="drive" className="gap-2">
                <Cloud className="h-4 w-4" />
                Google Drive
              </TabsTrigger>
              <TabsTrigger value="local" className="gap-2">
                <HardDrive className="h-4 w-4" />
                קבצים מקומיים
                {advancedFiles.files.length > 0 && <Badge variant="secondary" className="mr-1">{advancedFiles.files.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="linked" className="gap-2">
                <Users className="h-4 w-4" />
                מקושרים
                {linkedFiles.length > 0 && <Badge variant="secondary" className="mr-1">{linkedFiles.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                סטטיסטיקות
              </TabsTrigger>
            </TabsList>

            {/* Drive Tab */}
            <TabsContent value="drive">
              <Card
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn("transition-all", dragActive && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50 dark:bg-blue-900/20")}
              >
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
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'חפש'}
                      </Button>
                      
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-[140px]">
                          <Filter className="h-4 w-4 ml-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FILE_CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <cat.icon className="h-4 w-4" />
                                {cat.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[150px]">
                          <SortAsc className="h-4 w-4 ml-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
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
                  {/* Breadcrumb */}
                  {!searchQuery && (
                    <div className="flex items-center gap-1 mb-4 text-sm flex-wrap border-b pb-4">
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleNavigateToFolder(-1)}>
                        <Home className="h-4 w-4 ml-1" />ראשי
                      </Button>
                      {currentFolder.map((folder, index) => (
                        <div key={folder.id} className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleNavigateToFolder(index)}>
                            {folder.name}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drop Zone */}
                  {dragActive && (
                    <div className="border-2 border-dashed border-blue-500 rounded-lg p-12 text-center mb-4 bg-blue-50/50 dark:bg-blue-900/20">
                      <Upload className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                      <p className="text-blue-600 font-medium">שחרר קבצים כאן להעלאה</p>
                    </div>
                  )}

                  {/* Folders */}
                  {!searchQuery && driveFolders.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Folder className="h-4 w-4 text-yellow-500" />
                        תיקיות ({driveFolders.length})
                      </h3>
                      <div className={viewMode === 'grid' 
                        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                        : "space-y-1"
                      }>
                        {driveFolders.map((folder) => (
                          <Button
                            key={folder.id}
                            variant="outline"
                            className={cn("transition-all hover:shadow-md",
                              viewMode === 'grid' 
                                ? "flex flex-col items-center justify-center h-24 p-4"
                                : "w-full justify-start h-12"
                            )}
                            onClick={() => handleFolderClick(folder)}
                          >
                            <Folder className={cn("text-yellow-500", viewMode === 'grid' ? "h-8 w-8 mb-2" : "h-5 w-5 ml-3")} />
                            <span className="truncate text-sm">{folder.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  <div>
                    {!searchQuery && driveFiles.length > 0 && (
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <File className="h-4 w-4" />
                        קבצים ({displayFiles.length})
                      </h3>
                    )}
                    
                    <ScrollArea className="h-[500px]">
                      {displayFiles.length === 0 && driveFolders.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
                          <p className="text-lg font-medium mb-2">אין קבצים בתיקייה זו</p>
                          <p className="text-sm mb-4">גרור קבצים לכאן או לחץ על "העלאת קבצים"</p>
                        </div>
                      ) : displayFiles.length === 0 && filterCategory !== 'all' ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <Filter className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>אין קבצים מסוג זה</p>
                        </div>
                      ) : (
                        <div className={viewMode === 'grid' 
                          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                          : "space-y-1"
                        }>
                          {displayFiles.map((file) => {
                            const fileConfig = getFileTypeConfig(file.mimeType);
                            const FileIcon = fileConfig.icon;
                            const isStarred = starredFiles.has(file.id);
                            
                            return viewMode === 'grid' ? (
                              <div
                                key={file.id}
                                className="border rounded-lg p-4 hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer group relative"
                                onClick={() => window.open(file.webViewLink, '_blank')}
                              >
                                <button
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  onClick={(e) => { e.stopPropagation(); toggleStarFile(file.id); }}
                                >
                                  <Star className={cn("h-5 w-5 transition-colors",
                                    isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400"
                                  )} />
                                </button>
                                
                                <div className="flex flex-col items-center text-center">
                                  {file.thumbnailLink ? (
                                    <img src={file.thumbnailLink} alt={file.name} className="h-16 w-16 object-cover rounded mb-2" />
                                  ) : (
                                    <FileIcon className={cn("h-12 w-12 mb-2", fileConfig.color)} />
                                  )}
                                  <p className="text-sm font-medium truncate w-full">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                  {isStarred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mt-1" />}
                                </div>
                              </div>
                            ) : (
                              <div key={file.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-all group">
                                {file.thumbnailLink ? (
                                  <img src={file.thumbnailLink} alt={file.name} className="h-10 w-10 object-cover rounded" />
                                ) : (
                                  <FileIcon className={cn("h-10 w-10", fileConfig.color)} />
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium truncate">{file.name}</p>
                                    {isStarred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                    {file.modifiedTime && (
                                      <span className="mr-2">
                                        • עודכן {formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true, locale: he })}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"
                                          onClick={(e) => { e.stopPropagation(); toggleStarFile(file.id); }}>
                                          <Star className={cn("h-4 w-4", isStarred ? "fill-yellow-400 text-yellow-400" : "")} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>{isStarred ? 'הסר ממועדפים' : 'הוסף למועדפים'}</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <Button variant="ghost" size="icon" className="h-8 w-8"
                                    onClick={(e) => { e.stopPropagation(); window.open(file.webViewLink, '_blank'); }}>
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
                                        <Eye className="h-4 w-4 ml-2" />פתח
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => downloadFile(file)}>
                                        <Download className="h-4 w-4 ml-2" />הורד
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => copyShareLink(file)}>
                                        <Copy className="h-4 w-4 ml-2" />העתק קישור
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => { setLinkingFile(file); setShowLinkDialog(true); }}>
                                        <Users className="h-4 w-4 ml-2" />קשר ללקוח
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
            </TabsContent>

            {/* Local Files Tab (Supabase Storage) */}
            <TabsContent value="local">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        קבצים מקומיים
                      </CardTitle>
                      <CardDescription>קבצים מאוחסנים בשרת עם תכונות מתקדמות</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => advancedFiles.createFolder(prompt('שם התיקייה:') || '')}>
                        <FolderPlus className="h-4 w-4 ml-2" />
                        תיקייה חדשה
                      </Button>
                      <Button onClick={() => setShowLocalUploadDialog(true)}>
                        <Upload className="h-4 w-4 ml-2" />
                        העלאה
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Local Files Stats */}
                  {advancedFiles.stats && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">{advancedFiles.stats.totalFiles}</p>
                        <p className="text-xs text-blue-500">קבצים</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">{formatFileSize(advancedFiles.stats.totalSize)}</p>
                        <p className="text-xs text-purple-500">נפח</p>
                      </div>
                    </div>
                  )}

                  {advancedFiles.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : advancedFiles.files.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>אין קבצים מקומיים</p>
                      <p className="text-sm mt-2">העלה קבצים כדי להתחיל</p>
                      <Button onClick={() => setShowLocalUploadDialog(true)} className="mt-4">
                        <Upload className="h-4 w-4 ml-2" />
                        העלאת קבצים
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Folders */}
                      {advancedFiles.folders.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Folder className="h-4 w-4 text-yellow-500" />
                            תיקיות
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {advancedFiles.folders.map((folder) => (
                              <Button
                                key={folder.id}
                                variant="outline"
                                className="justify-start h-auto py-3"
                                onClick={() => advancedFiles.setCurrentFolder(folder.id)}
                              >
                                <Folder className="h-5 w-5 text-yellow-500 ml-2" />
                                <div className="text-right">
                                  <p className="font-medium truncate">{folder.name}</p>
                                  <p className="text-xs text-muted-foreground">{folder.fileCount} קבצים</p>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files List */}
                      {advancedFiles.files.map((file) => {
                        const FileIcon = FILE_TYPE_CONFIG[file.type]?.icon || FILE_TYPE_CONFIG.default.icon;
                        const fileColor = FILE_TYPE_CONFIG[file.type]?.color || FILE_TYPE_CONFIG.default.color;
                        
                        return (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 group cursor-pointer"
                            onClick={() => { setSelectedLocalFile(file); setShowFilePreview(true); }}
                          >
                            {file.thumbnail ? (
                              <img src={file.thumbnail} alt="" className="h-10 w-10 rounded object-cover" />
                            ) : (
                              <FileIcon className={cn("h-10 w-10", fileColor)} />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{file.name}</p>
                                {file.isStarred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                                {file.tags && file.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {file.tags.slice(0, 2).map((tag, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)} • {file.downloadCount} הורדות • {file.viewCount} צפיות
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); advancedFiles.toggleStar(file.id); }}
                              >
                                <Star className={cn("h-4 w-4", file.isStarred ? "fill-yellow-400 text-yellow-400" : "")} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); advancedFiles.downloadFile(file); }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); setSharingFile(file); setShowShareDialog(true); }}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedLocalFile(file); setShowFilePreview(true); }}>
                                    <Eye className="h-4 w-4 ml-2" />תצוגה מקדימה
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => advancedFiles.downloadFile(file)}>
                                    <Download className="h-4 w-4 ml-2" />הורדה
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSharingFile(file); setShowShareDialog(true); }}>
                                    <Share2 className="h-4 w-4 ml-2" />שיתוף
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => { if (confirm(`למחוק את "${file.name}"?`)) advancedFiles.deleteFile(file); }}
                                  >
                                    <XCircle className="h-4 w-4 ml-2" />מחיקה
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Linked Files Tab */}
            <TabsContent value="linked">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    קבצים מקושרים ללקוחות
                  </CardTitle>
                  <CardDescription>קבצים שקושרו ללקוחות במערכת</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLocal ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : linkedFiles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>אין קבצים מקושרים ללקוחות</p>
                      <p className="text-sm mt-2">קשר קבצים ללקוחות מתוך רשימת הקבצים</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                          <File className="h-8 w-8 text-blue-500" />
                          <div className="flex-1">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">לקוח: {file.clients?.name || 'לא ידוע'}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => window.open(file.web_view_link, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      קבצים לפי סוג
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(filesByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm">{type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / totalFiles) * 100}%` }} />
                            </div>
                            <span className="text-sm font-medium w-8 text-left">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      סיכום אחסון
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <p className="text-4xl font-bold text-blue-600">{formatFileSize(totalSize)}</p>
                        <p className="text-muted-foreground">נפח כולל</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">{totalFiles}</p>
                          <p className="text-xs text-muted-foreground">קבצים</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{totalFolders}</p>
                          <p className="text-xs text-muted-foreground">תיקיות</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{starredCount}</p>
                          <p className="text-xs text-muted-foreground">מועדפים</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* New Folder Dialog */}
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>יצירת תיקייה חדשה</DialogTitle>
              <DialogDescription>הזן שם לתיקייה החדשה</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="שם התיקייה"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>ביטול</Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                <FolderPlus className="h-4 w-4 ml-2" />צור תיקייה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link to Client Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>קישור קובץ ללקוח</DialogTitle>
              <DialogDescription>בחר לקוח לקישור הקובץ "{linkingFile?.name}"</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>ביטול</Button>
              <Button onClick={handleLinkFile} disabled={!selectedClientId}>
                <Link2 className="h-4 w-4 ml-2" />קשר ללקוח
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Progress Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>העלאת קבצים</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
              {uploadQueue.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-[200px]">{item.file.name}</span>
                    <span className="text-sm">
                      {item.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {item.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                      {item.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
                    </span>
                  </div>
                  <Progress value={item.progress} />
                  {item.error && <p className="text-xs text-red-500">{item.error}</p>}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowUploadDialog(false)} disabled={uploadQueue.some(q => q.status === 'uploading')}>
                סגור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Local Files Upload Dialog */}
        {showLocalUploadDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-2xl m-4 max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">העלאת קבצים מקומיים</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowLocalUploadDialog(false)}>
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
                <AdvancedFileUpload
                  onUpload={async (files) => {
                    for (const file of files) {
                      await advancedFiles.uploadFile(file);
                    }
                    setShowLocalUploadDialog(false);
                  }}
                  folderId={advancedFiles.currentFolder}
                />
              </div>
            </Card>
          </div>
        )}

        {/* File Preview Dialog */}
        {selectedLocalFile && (
          <FilePreview
            file={selectedLocalFile}
            files={advancedFiles.files}
            isOpen={showFilePreview}
            onClose={() => { setShowFilePreview(false); setSelectedLocalFile(null); }}
            onNavigate={(direction) => {
              const currentIndex = advancedFiles.files.findIndex(f => f.id === selectedLocalFile.id);
              if (direction === 'next' && currentIndex < advancedFiles.files.length - 1) {
                setSelectedLocalFile(advancedFiles.files[currentIndex + 1]);
              } else if (direction === 'prev' && currentIndex > 0) {
                setSelectedLocalFile(advancedFiles.files[currentIndex - 1]);
              }
            }}
            onDownload={(f) => advancedFiles.downloadFile(f)}
            onShare={(f) => { setSharingFile(f); setShowShareDialog(true); }}
            onDelete={(f) => { 
              if (confirm(`למחוק את "${f.name}"?`)) {
                advancedFiles.deleteFile(f);
                setShowFilePreview(false);
                setSelectedLocalFile(null);
              }
            }}
            onToggleStar={(f) => advancedFiles.toggleStar(f.id)}
          />
        )}

        {/* File Sharing Dialog */}
        {sharingFile && (
          <FileSharingDialog
            file={sharingFile}
            isOpen={showShareDialog}
            onClose={() => { setShowShareDialog(false); setSharingFile(null); }}
            onShare={async (userIds, permissions) => {
              await advancedFiles.shareFile(sharingFile.id, userIds, permissions);
              setShowShareDialog(false);
              setSharingFile(null);
            }}
            onCreateLink={async (expiresIn) => {
              const link = await advancedFiles.createPublicLink(sharingFile.id, expiresIn);
              return link || '';
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
