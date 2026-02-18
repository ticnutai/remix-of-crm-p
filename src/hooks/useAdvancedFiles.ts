/**
 * Advanced File Manager - מערכת ניהול קבצים מתקדמת
 * תכונות: Drag & Drop, Preview, Tags, Versions, Sharing, Statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  mimeType: string;
  extension: string;
  thumbnail?: string;
  preview?: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  tags: string[];
  category: string;
  folderId?: string;
  isStarred: boolean;
  isShared: boolean;
  sharedWith: string[];
  version: number;
  versions: FileVersion[];
  downloadCount: number;
  viewCount: number;
  metadata: Record<string, any>;
}

export interface FileVersion {
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
  path: string;
  changes?: string;
}

export interface FolderStructure {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdBy: string;
  createdAt: string;
  color?: string;
  icon?: string;
  isShared: boolean;
  fileCount: number;
  totalSize: number;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  uploadsByMonth: { month: string; count: number }[];
  topTags: { tag: string; count: number }[];
  recentUploads: FileMetadata[];
  mostDownloaded: FileMetadata[];
  largestFiles: FileMetadata[];
}

class AdvancedFileManager {
  private bucket = 'client-files';

  /**
   * העלאת קובץ עם metadata מלא
   */
  async uploadFile(
    file: File,
    options: {
      folderId?: string;
      tags?: string[];
      category?: string;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<FileMetadata> {
    const { folderId, tags = [], category = 'general', onProgress } = options;

    // יצירת שם ייחודי
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || '';
    const nameWithoutExt = file.name.replace(`.${extension}`, '');
    const uniqueName = `${nameWithoutExt}-${timestamp}.${extension}`;
    
    const path = folderId ? `${folderId}/${uniqueName}` : uniqueName;

    // העלאה ל-Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // יצירת thumbnail אם זו תמונה
    let thumbnail: string | undefined;
    if (file.type.startsWith('image/')) {
      thumbnail = await this.generateThumbnail(file);
    }

    // שמירת metadata
    const metadata: FileMetadata = {
      id: crypto.randomUUID(),
      name: file.name,
      path: data.path,
      size: file.size,
      type: this.getFileType(file.type),
      mimeType: file.type,
      extension,
      thumbnail,
      uploadedBy: (await supabase.auth.getUser()).data.user?.id || '',
      uploadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      tags,
      category,
      folderId,
      isStarred: false,
      isShared: false,
      sharedWith: [],
      version: 1,
      versions: [],
      downloadCount: 0,
      viewCount: 0,
      metadata: {
        originalName: file.name,
        uploadedFrom: 'web',
      },
    };

    // שמירה ב-DB (טבלה נפרדת למטא-דאטה)
    await this.saveMetadata(metadata);

    return metadata;
  }

  /**
   * העלאת קבצים מרובים
   */
  async uploadMultipleFiles(
    files: File[],
    options: {
      folderId?: string;
      tags?: string[];
      category?: string;
      onProgress?: (fileIndex: number, progress: number) => void;
    } = {}
  ): Promise<FileMetadata[]> {
    const results: FileMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const metadata = await this.uploadFile(file, {
          ...options,
          onProgress: (progress) => {
            if (options.onProgress) {
              options.onProgress(i, progress);
            }
          },
        });
        results.push(metadata);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    return results;
  }

  /**
   * קבלת כל הקבצים
   */
  async getFiles(filters?: {
    folderId?: string;
    tags?: string[];
    category?: string;
    type?: string;
    searchQuery?: string;
    sortBy?: 'name' | 'date' | 'size' | 'downloads';
    sortOrder?: 'asc' | 'desc';
  }): Promise<FileMetadata[]> {
    let query = (supabase as any).from('file_metadata').select('*');
    
    if (filters?.folderId) {
      query = query.eq('folder_id', filters.folderId);
    }
    
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    
    if (filters?.searchQuery) {
      query = query.ilike('name', `%${filters.searchQuery}%`);
    }
    
    // מיון
    const sortField = filters?.sortBy === 'downloads' ? 'download_count' :
                     filters?.sortBy === 'size' ? 'size' :
                     filters?.sortBy === 'name' ? 'name' : 'created_at';
    const ascending = filters?.sortOrder === 'asc';
    
    query = query.order(sortField, { ascending });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      path: row.path,
      size: row.size,
      type: row.type,
      mimeType: row.mime_type,
      extension: row.extension,
      thumbnail: row.thumbnail,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.created_at,
      lastModified: row.updated_at,
      tags: row.tags || [],
      category: row.category,
      folderId: row.folder_id,
      isStarred: row.is_starred,
      isShared: row.is_shared,
      sharedWith: [],
      version: row.version,
      versions: [],
      downloadCount: row.download_count,
      viewCount: row.view_count,
      metadata: row.metadata || {},
    }));
  }

  /**
   * קבלת תיקיות
   */
  async getFolders(parentId?: string): Promise<FolderStructure[]> {
    let query = (supabase as any).from('file_folders').select('*');
    
    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }
    
    const { data, error } = await query.order('name');
    if (error) throw error;
    
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      path: row.path,
      parentId: row.parent_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      color: row.color,
      icon: row.icon,
      isShared: row.is_shared,
      fileCount: row.file_count,
      totalSize: row.total_size,
    }));
  }

  /**
   * יצירת תיקייה
   */
  async createFolder(
    name: string,
    options: {
      parentId?: string;
      color?: string;
      icon?: string;
    } = {}
  ): Promise<FolderStructure> {
    const user = await supabase.auth.getUser();
    
    const { data, error } = await (supabase as any)
      .from('file_folders')
      .insert({
        name,
        path: options.parentId ? `${options.parentId}/${name}` : name,
        parent_id: options.parentId,
        created_by: user.data.user?.id,
        color: options.color || '#3B82F6',
        icon: options.icon || 'folder',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      path: data.path,
      parentId: data.parent_id,
      createdBy: data.created_by,
      createdAt: data.created_at,
      color: data.color,
      icon: data.icon,
      isShared: data.is_shared,
      fileCount: data.file_count,
      totalSize: data.total_size,
    };
  }

  /**
   * הורדת קובץ
   */
  async downloadFile(file: FileMetadata): Promise<void> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .download(file.path);

    if (error) throw error;

    // יצירת URL להורדה
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // עדכון מונה הורדות
    await this.incrementDownloadCount(file.id);
  }

  /**
   * מחיקת קובץ
   */
  async deleteFile(file: FileMetadata): Promise<void> {
    // מחיקה מ-Storage
    const { error: storageError } = await supabase.storage
      .from(this.bucket)
      .remove([file.path]);

    if (storageError) throw storageError;

    // מחיקת metadata
    const { error: dbError } = await (supabase as any)
      .from('file_metadata')
      .delete()
      .eq('id', file.id);
    
    if (dbError) throw dbError;
  }

  /**
   * שיתוף קובץ
   */
  async shareFile(
    fileId: string,
    shareWith: string[],
    permissions: 'view' | 'edit' = 'view'
  ): Promise<void> {
    const user = await supabase.auth.getUser();
    
    // יצירת שורות שיתוף
    const shares = shareWith.map(userId => ({
      file_id: fileId,
      shared_with: userId,
      shared_by: user.data.user?.id,
      permissions,
    }));
    
    const { error } = await (supabase as any)
      .from('file_shares')
      .upsert(shares);
    
    if (error) throw error;
    
    // עדכון דגל is_shared
    await (supabase as any)
      .from('file_metadata')
      .update({ is_shared: true })
      .eq('id', fileId);
  }

  /**
   * יצירת קישור ציבורי
   */
  async createPublicLink(file: FileMetadata, expiresIn?: number): Promise<string> {
    const { data } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(file.path, expiresIn || 3600);

    return data?.signedUrl || '';
  }

  /**
   * הוספת תגית
   */
  async addTag(fileId: string, tag: string): Promise<void> {
    const { error } = await (supabase as any).rpc('toggle_file_tag', {
      p_file_id: fileId,
      p_tag: tag,
    });
    
    if (error) throw error;
  }

  /**
   * כוכב/ביטול כוכב
   */
  async toggleStar(fileId: string): Promise<void> {
    const { error } = await (supabase as any).rpc('toggle_file_star', {
      p_file_id: fileId,
    });
    
    if (error) throw error;
  }

  /**
   * סטטיסטיקות
   */
  async getStatistics(): Promise<FileStats> {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    
    const { data, error } = await (supabase as any).rpc('get_file_statistics', {
      p_user_id: userId,
    });
    
    if (error) throw error;
    
    // שליפת קבצים אחרונים
    const { data: recentFiles } = await (supabase as any)
      .from('file_metadata')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    // שליפת הכי הורדים
    const { data: mostDownloaded } = await (supabase as any)
      .from('file_metadata')
      .select('*')
      .order('download_count', { ascending: false })
      .limit(5);
    
    // שליפת הכי גדולים
    const { data: largestFiles } = await (supabase as any)
      .from('file_metadata')
      .select('*')
      .order('size', { ascending: false })
      .limit(5);
    
    // שליפת תגיות פופולריות
    const { data: topTags } = await (supabase as any).rpc('get_popular_tags', { p_limit: 10 });
    
    return {
      totalFiles: data?.total_files || 0,
      totalSize: data?.total_size || 0,
      filesByType: data?.files_by_type || {},
      uploadsByMonth: [],
      topTags: (topTags || []).map((t: any) => ({ tag: t.tag, count: t.count })),
      recentUploads: (recentFiles || []).map(this.mapFileFromDb.bind(this)),
      mostDownloaded: (mostDownloaded || []).map(this.mapFileFromDb.bind(this)),
      largestFiles: (largestFiles || []).map(this.mapFileFromDb.bind(this)),
    };
  }

  /**
   * חיפוש מתקדם
   */
  async search(query: string, options?: {
    fileType?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    minSize?: number;
    maxSize?: number;
  }): Promise<FileMetadata[]> {
    const user = await supabase.auth.getUser();
    
    const { data, error } = await (supabase as any).rpc('search_files', {
      p_query: query || null,
      p_type: options?.fileType || null,
      p_tags: options?.tags || null,
      p_date_from: options?.dateFrom?.toISOString() || null,
      p_date_to: options?.dateTo?.toISOString() || null,
      p_min_size: options?.minSize || null,
      p_max_size: options?.maxSize || null,
      p_user_id: user.data.user?.id || null,
    });
    
    if (error) throw error;
    
    return (data || []).map(this.mapFileFromDb.bind(this));
  }

  /**
   * גרסאות קובץ
   */
  async uploadNewVersion(
    fileId: string,
    newFile: File,
    changes?: string
  ): Promise<FileMetadata> {
    // קבלת הקובץ הנוכחי
    const { data: currentFile } = await (supabase as any)
      .from('file_metadata')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (!currentFile) throw new Error('File not found');
    
    // העלאת קובץ חדש
    const timestamp = Date.now();
    const extension = newFile.name.split('.').pop() || '';
    const newPath = `${fileId}/v${currentFile.version + 1}-${timestamp}.${extension}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.bucket)
      .upload(newPath, newFile);
    
    if (uploadError) throw uploadError;
    
    // שמירת גרסה ישנה
    await (supabase as any).from('file_versions').insert({
      file_id: fileId,
      version: currentFile.version,
      path: currentFile.path,
      size: currentFile.size,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id,
    });
    
    // עדכון הקובץ לגרסה חדשה
    const { data: updatedFile, error: updateError } = await (supabase as any)
      .from('file_metadata')
      .update({
        path: uploadData.path,
        size: newFile.size,
        version: currentFile.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return this.mapFileFromDb(updatedFile);
  }

  async getFileVersions(fileId: string): Promise<FileVersion[]> {
    const { data, error } = await (supabase as any)
      .from('file_versions')
      .select('*')
      .eq('file_id', fileId)
      .order('version', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(v => ({
      version: v.version,
      uploadedAt: v.created_at,
      uploadedBy: v.uploaded_by,
      size: v.size,
      path: v.path,
      changes: v.changes,
    }));
  }

  async restoreVersion(fileId: string, version: number): Promise<void> {
    // קבלת הגרסה הרצויה
    const { data: versionData } = await (supabase as any)
      .from('file_versions')
      .select('*')
      .eq('file_id', fileId)
      .eq('version', version)
      .single();
    
    if (!versionData) throw new Error('Version not found');
    
    // עדכון הקובץ
    await (supabase as any)
      .from('file_metadata')
      .update({
        path: versionData.path,
        size: versionData.size,
        version: versionData.version,
      })
      .eq('id', fileId);
  }

  /**
   * פונקציות עזר
   */
  private async generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          const maxSize = 200;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    if (mimeType.includes('text/')) return 'text';
    return 'other';
  }

  private async saveMetadata(metadata: FileMetadata): Promise<void> {
    const { error } = await (supabase as any).from('file_metadata').insert({
      id: metadata.id,
      name: metadata.name,
      path: metadata.path,
      size: metadata.size,
      type: metadata.type,
      mime_type: metadata.mimeType,
      extension: metadata.extension,
      thumbnail: metadata.thumbnail,
      folder_id: metadata.folderId,
      uploaded_by: metadata.uploadedBy,
      is_starred: metadata.isStarred,
      is_shared: metadata.isShared,
      tags: metadata.tags,
      category: metadata.category,
      version: metadata.version,
      metadata: metadata.metadata,
      download_count: metadata.downloadCount,
      view_count: metadata.viewCount,
    });
    
    if (error) throw error;
  }

  private async deleteMetadata(fileId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('file_metadata')
      .delete()
      .eq('id', fileId);
    
    if (error) throw error;
  }

  private async incrementDownloadCount(fileId: string): Promise<void> {
    await (supabase as any).rpc('increment_download_count', { p_file_id: fileId });
  }

  private async incrementViewCount(fileId: string): Promise<void> {
    await (supabase as any).rpc('increment_view_count', { p_file_id: fileId });
  }

  /**
   * עדכון תגיות לקובץ
   */
  async updateFileTags(fileId: string, tags: string[]): Promise<void> {
    const { error } = await (supabase as any)
      .from('file_metadata')
      .update({ tags })
      .eq('id', fileId);
    
    if (error) throw error;
  }

  /**
   * שינוי שם קובץ
   */
  async renameFile(fileId: string, newName: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('file_metadata')
      .update({ name: newName.trim() })
      .eq('id', fileId);
    
    if (error) throw error;
  }

  /**
   * העברת קובץ לתיקייה
   */
  async moveToFolder(fileId: string, folderId: string | null): Promise<void> {
    const { error } = await (supabase as any)
      .from('file_metadata')
      .update({ folder_id: folderId })
      .eq('id', fileId);
    
    if (error) throw error;
  }

  /**
   * שכפול קובץ
   */
  async duplicateFile(fileId: string): Promise<FileMetadata | null> {
    // קבלת הקובץ המקורי
    const { data: originalFile, error: fetchError } = await (supabase as any)
      .from('file_metadata')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (fetchError || !originalFile) {
      console.error('Error fetching original file:', fetchError);
      return null;
    }

    // הורדת הקובץ המקורי
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(this.bucket)
      .download(originalFile.path);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      return null;
    }

    // יצירת שם ונתיב חדשים
    const timestamp = Date.now();
    const nameParts = originalFile.name.split('.');
    const extension = nameParts.pop();
    const nameWithoutExt = nameParts.join('.');
    const newName = `${nameWithoutExt} (עותק).${extension}`;
    const newPath = originalFile.folder_id 
      ? `${originalFile.folder_id}/${nameWithoutExt}-copy-${timestamp}.${extension}`
      : `${nameWithoutExt}-copy-${timestamp}.${extension}`;

    // העלאת הקובץ החדש
    const { error: uploadError } = await supabase.storage
      .from(this.bucket)
      .upload(newPath, fileData);

    if (uploadError) {
      console.error('Error uploading copy:', uploadError);
      return null;
    }

    // יצירת metadata חדש
    const newMetadata: FileMetadata = {
      ...this.mapFileFromDb(originalFile),
      id: crypto.randomUUID(),
      name: newName,
      path: newPath,
      uploadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      downloadCount: 0,
      viewCount: 0,
      version: 1,
      versions: [],
    };

    await this.saveMetadata(newMetadata);
    return newMetadata;
  }
  
  private mapFileFromDb(row: any): FileMetadata {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      size: row.size,
      type: row.type,
      mimeType: row.mime_type,
      extension: row.extension,
      thumbnail: row.thumbnail,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.created_at,
      lastModified: row.updated_at,
      tags: row.tags || [],
      category: row.category,
      folderId: row.folder_id,
      isStarred: row.is_starred,
      isShared: row.is_shared,
      sharedWith: [],
      version: row.version,
      versions: [],
      downloadCount: row.download_count,
      viewCount: row.view_count,
      metadata: row.metadata || {},
    };
  }
}

export const advancedFileManager = new AdvancedFileManager();

/**
 * Hook לשימוש במערכת הקבצים
 */
export function useAdvancedFiles() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [folders, setFolders] = useState<FolderStructure[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<FileStats | null>(null);
  const { toast } = useToast();

  const loadFiles = useCallback(async (folderId?: string) => {
    setIsLoading(true);
    try {
      const files = await advancedFileManager.getFiles({ folderId });
      setFiles(files);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון קבצים',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadFolders = useCallback(async (parentId?: string) => {
    try {
      const folders = await advancedFileManager.getFolders(parentId);
      setFolders(folders);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const stats = await advancedFileManager.getStatistics();
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    options?: Parameters<typeof advancedFileManager.uploadFile>[1]
  ) => {
    try {
      const metadata = await advancedFileManager.uploadFile(file, {
        ...options,
        folderId: currentFolder,
      });
      setFiles(prev => [metadata, ...prev]);
      toast({
        title: 'הצלחה',
        description: `הקובץ ${file.name} הועלה בהצלחה`,
      });
      return metadata;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'שגיאה',
        description: 'העלאת הקובץ נכשלה',
        variant: 'destructive',
      });
      throw error;
    }
  }, [currentFolder, toast]);

  const deleteFile = useCallback(async (file: FileMetadata) => {
    try {
      await advancedFileManager.deleteFile(file);
      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast({
        title: 'הצלחה',
        description: 'הקובץ נמחק בהצלחה',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'שגיאה',
        description: 'מחיקת הקובץ נכשלה',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const createFolder = useCallback(async (name: string, options?: Parameters<typeof advancedFileManager.createFolder>[1]) => {
    try {
      const folder = await advancedFileManager.createFolder(name, {
        ...options,
        parentId: currentFolder,
      });
      setFolders(prev => [...prev, folder]);
      toast({
        title: 'הצלחה',
        description: 'התיקייה נוצרה בהצלחה',
      });
      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'שגיאה',
        description: 'יצירת התיקייה נכשלה',
        variant: 'destructive',
      });
      throw error;
    }
  }, [currentFolder, toast]);

  useEffect(() => {
    loadFiles(currentFolder);
    loadFolders(currentFolder);
  }, [currentFolder, loadFiles, loadFolders]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
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
    downloadFile: advancedFileManager.downloadFile.bind(advancedFileManager),
    shareFile: advancedFileManager.shareFile.bind(advancedFileManager),
    createPublicLink: advancedFileManager.createPublicLink.bind(advancedFileManager),
    toggleStar: advancedFileManager.toggleStar.bind(advancedFileManager),
    addTag: advancedFileManager.addTag.bind(advancedFileManager),
    search: advancedFileManager.search.bind(advancedFileManager),
    updateFileTags: advancedFileManager.updateFileTags.bind(advancedFileManager),
    renameFile: advancedFileManager.renameFile.bind(advancedFileManager),
    moveToFolder: advancedFileManager.moveToFolder.bind(advancedFileManager),
    duplicateFile: async (fileId: string) => {
      try {
        const newFile = await advancedFileManager.duplicateFile(fileId);
        if (newFile) {
          setFiles(prev => [newFile, ...prev]);
          toast({
            title: 'הצלחה',
            description: 'הקובץ שוכפל בהצלחה',
          });
        }
        return newFile;
      } catch (error) {
        console.error('Error duplicating file:', error);
        toast({
          title: 'שגיאה',
          description: 'שכפול הקובץ נכשל',
          variant: 'destructive',
        });
        return null;
      }
    },
  };
}
