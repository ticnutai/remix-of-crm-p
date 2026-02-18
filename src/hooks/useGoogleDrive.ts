// Hook for Google Drive integration
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useGoogleServices } from './useGoogleServices';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  thumbnailLink?: string;
  iconLink?: string;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
}

export function useGoogleDrive() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getAccessToken, isLoading: isGettingToken } = useGoogleServices();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // List files
  const listFiles = useCallback(async (
    folderId: string = 'root',
    pageSize: number = 20
  ) => {
    if (!user) return [];

    setIsLoading(true);
    try {
      const token = await getAccessToken(['drive']);
      if (!token) {
        setIsLoading(false);
        return [];
      }

      const query = folderId === 'root' 
        ? "'root' in parents and trashed = false"
        : `'${folderId}' in parents and trashed = false`;

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=${pageSize}&fields=files(id,name,mimeType,size,webViewLink,thumbnailLink,iconLink,createdTime,modifiedTime,parents)`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      const formattedFiles: DriveFile[] = (data.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: parseInt(file.size || '0'),
        webViewLink: file.webViewLink,
        thumbnailLink: file.thumbnailLink,
        iconLink: file.iconLink,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        parents: file.parents,
      }));

      // Separate files and folders
      const filesList = formattedFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
      const foldersList = formattedFiles
        .filter(f => f.mimeType === 'application/vnd.google-apps.folder')
        .map(f => ({ id: f.id, name: f.name }));

      setFiles(filesList);
      setFolders(foldersList);
      setIsLoading(false);
      return formattedFiles;
    } catch (error: any) {
      console.error('Error listing files:', error);
      toast({
        title: 'שגיאה בטעינת קבצים',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return [];
    }
  }, [user, getAccessToken, toast]);

  // Upload file
  const uploadFile = useCallback(async (
    file: File,
    folderId?: string
  ): Promise<DriveFile | null> => {
    if (!user) return null;

    setIsUploading(true);
    try {
      const token = await getAccessToken(['drive']);
      if (!token) {
        setIsUploading(false);
        return null;
      }

      // Create metadata
      const metadata: any = {
        name: file.name,
        mimeType: file.type,
      };
      if (folderId) {
        metadata.parents = [folderId];
      }

      // Create multipart request
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const body = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${file.type}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink,iconLink,createdTime,modifiedTime',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body,
        }
      );

      const data = await response.json();

      toast({
        title: 'הקובץ הועלה בהצלחה',
        description: file.name,
      });

      setIsUploading(false);
      return {
        id: data.id,
        name: data.name,
        mimeType: data.mimeType,
        size: parseInt(data.size || '0'),
        webViewLink: data.webViewLink,
        thumbnailLink: data.thumbnailLink,
        iconLink: data.iconLink,
        createdTime: data.createdTime,
        modifiedTime: data.modifiedTime,
      };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'שגיאה בהעלאת הקובץ',
        description: error.message,
        variant: 'destructive',
      });
      setIsUploading(false);
      return null;
    }
  }, [user, getAccessToken, toast]);

  // Create folder
  const createFolder = useCallback(async (
    name: string,
    parentId?: string
  ): Promise<DriveFolder | null> => {
    if (!user) return null;

    try {
      const token = await getAccessToken(['drive']);
      if (!token) return null;

      const metadata: any = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
      };
      if (parentId) {
        metadata.parents = [parentId];
      }

      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?fields=id,name',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metadata),
        }
      );

      const data = await response.json();

      toast({
        title: 'התיקייה נוצרה בהצלחה',
        description: name,
      });

      return { id: data.id, name: data.name };
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast({
        title: 'שגיאה ביצירת התיקייה',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [user, getAccessToken, toast]);

  // Link file to client
  const linkFileToClient = useCallback(async (
    file: DriveFile,
    clientId: string
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('google_drive_files').insert({
        user_id: user.id,
        drive_file_id: file.id,
        file_name: file.name,
        mime_type: file.mimeType,
        file_size: file.size,
        web_view_link: file.webViewLink,
        thumbnail_link: file.thumbnailLink,
        client_id: clientId,
      });

      if (error) throw error;

      toast({
        title: 'הקובץ קושר ללקוח בהצלחה',
      });

      return true;
    } catch (error: any) {
      console.error('Error linking file:', error);
      toast({
        title: 'שגיאה בקישור הקובץ',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Search files
  const searchFiles = useCallback(async (query: string) => {
    if (!user || !query) return [];

    setIsLoading(true);
    try {
      const token = await getAccessToken(['drive']);
      if (!token) {
        setIsLoading(false);
        return [];
      }

      const searchQuery = `name contains '${query}' and trashed = false`;

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&pageSize=20&fields=files(id,name,mimeType,size,webViewLink,thumbnailLink,iconLink,createdTime,modifiedTime)`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      setIsLoading(false);
      return data.files || [];
    } catch (error: any) {
      console.error('Error searching files:', error);
      setIsLoading(false);
      return [];
    }
  }, [user, getAccessToken]);

  // Delete file
  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const token = await getAccessToken(['drive']);
      if (!token) return false;

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete file');
      }

      toast({ title: 'הקובץ נמחק בהצלחה' });
      return true;
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: 'שגיאה במחיקת הקובץ',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [user, getAccessToken, toast]);

  // Rename file
  const renameFile = useCallback(async (fileId: string, newName: string): Promise<boolean> => {
    if (!user || !newName.trim()) return false;

    try {
      const token = await getAccessToken(['drive']);
      if (!token) return false;

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName.trim() }),
        }
      );

      if (!response.ok) throw new Error('Failed to rename file');

      toast({ title: 'השם עודכן בהצלחה' });
      return true;
    } catch (error: any) {
      console.error('Error renaming file:', error);
      toast({
        title: 'שגיאה בשינוי השם',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [user, getAccessToken, toast]);

  // Move file to folder
  const moveFile = useCallback(async (
    fileId: string,
    newParentId: string,
    oldParentId?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const token = await getAccessToken(['drive']);
      if (!token) return false;

      let url = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${newParentId}`;
      if (oldParentId) {
        url += `&removeParents=${oldParentId}`;
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Failed to move file');

      toast({ title: 'הקובץ הועבר בהצלחה' });
      return true;
    } catch (error: any) {
      console.error('Error moving file:', error);
      toast({
        title: 'שגיאה בהעברת הקובץ',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [user, getAccessToken, toast]);

  return {
    files,
    folders,
    isLoading: isLoading || isGettingToken,
    isUploading,
    listFiles,
    uploadFile,
    createFolder,
    linkFileToClient,
    searchFiles,
    deleteFile,
    renameFile,
    moveFile,
  };
}
