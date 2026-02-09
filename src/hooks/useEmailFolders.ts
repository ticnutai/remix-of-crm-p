// Email Folders Hook - Manages email folders, classification, and auto-rules
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { GmailMessage } from './useGmailIntegration';

export interface EmailFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  parent_folder_id: string | null;
  client_id: string | null;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Computed
  email_count?: number;
  client_name?: string;
}

export interface EmailFolderItem {
  id: string;
  user_id: string;
  folder_id: string;
  email_id: string;
  email_subject: string | null;
  email_from: string | null;
  email_date: string | null;
  email_snippet: string | null;
  client_id: string | null;
  notes: string | null;
  is_starred: boolean;
  is_important: boolean;
  added_at: string;
}

export interface EmailAutoRule {
  id: string;
  user_id: string;
  name: string;
  folder_id: string;
  rule_type: 'sender_email' | 'sender_name' | 'subject_contains' | 'client_match';
  rule_value: string;
  client_id: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  // Computed
  folder_name?: string;
  client_name?: string;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
}

export function useEmailFolders() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [autoRules, setAutoRules] = useState<EmailAutoRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // Load folders
  const loadFolders = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load folders with email count
      const { data: foldersData, error } = await supabase
        .from('email_folders')
        .select(`
          *,
          clients:client_id (name),
          email_folder_items (id)
        `)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      const processedFolders = (foldersData || []).map(f => ({
        ...f,
        client_name: f.clients?.name,
        email_count: f.email_folder_items?.length || 0,
      }));
      
      setFolders(processedFolders);
    } catch (error) {
      console.error('Error loading email folders:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load auto rules
  const loadAutoRules = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('email_auto_rules')
        .select(`
          *,
          email_folders:folder_id (name),
          clients:client_id (name)
        `)
        .eq('user_id', user.id)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      
      const processedRules = (data || []).map(r => ({
        ...r,
        folder_name: r.email_folders?.name,
        client_name: r.clients?.name,
      }));
      
      setAutoRules(processedRules as any);
    } catch (error) {
      console.error('Error loading auto rules:', error);
    }
  }, [user?.id]);

  // Load clients for linking
  const loadClients = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    loadFolders();
    loadAutoRules();
    loadClients();
  }, [loadFolders, loadAutoRules, loadClients]);

  // Create folder
  const createFolder = useCallback(async (
    name: string,
    options?: {
      color?: string;
      icon?: string;
      clientId?: string;
      parentFolderId?: string;
    }
  ) => {
    if (!user?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('email_folders')
        .insert({
          user_id: user.id,
          name,
          color: options?.color || '#3B82F6',
          icon: options?.icon || 'folder',
          client_id: options?.clientId || null,
          parent_folder_id: options?.parentFolderId || null,
          sort_order: folders.length,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: '📁 תיקייה נוצרה',
        description: `התיקייה "${name}" נוצרה בהצלחה`,
      });
      
      await loadFolders();
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן ליצור את התיקייה',
        variant: 'destructive',
      });
      return null;
    }
  }, [user?.id, folders.length, toast, loadFolders]);

  // Update folder
  const updateFolder = useCallback(async (
    folderId: string,
    updates: Partial<Pick<EmailFolder, 'name' | 'color' | 'icon' | 'sort_order'>>
  ) => {
    if (!user?.id) return false;
    
    try {
      const { error } = await supabase
        .from('email_folders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', folderId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await loadFolders();
      return true;
    } catch (error) {
      console.error('Error updating folder:', error);
      return false;
    }
  }, [user?.id, loadFolders]);

  // Delete folder
  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user?.id) return false;
    
    try {
      const folder = folders.find(f => f.id === folderId);
      if (folder?.is_system) {
        toast({
          title: 'לא ניתן למחוק',
          description: 'תיקיות מערכת לא ניתנות למחיקה',
          variant: 'destructive',
        });
        return false;
      }
      
      const { error } = await supabase
        .from('email_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: '🗑️ תיקייה נמחקה',
        description: 'התיקייה נמחקה בהצלחה',
      });
      
      await loadFolders();
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      return false;
    }
  }, [user?.id, folders, toast, loadFolders]);

  // Add email to folder
  const addEmailToFolder = useCallback(async (
    folderId: string,
    email: GmailMessage,
    options?: { clientId?: string; notes?: string }
  ) => {
    if (!user?.id) return false;
    
    try {
      const { error } = await supabase
        .from('email_folder_items')
        .upsert({
          user_id: user.id,
          folder_id: folderId,
          email_id: email.id,
          email_subject: email.subject,
          email_from: email.from,
          email_date: email.date,
          email_snippet: email.snippet,
          client_id: options?.clientId || null,
          notes: options?.notes || null,
        }, {
          onConflict: 'folder_id,email_id',
        });
      
      if (error) throw error;
      
      toast({
        title: '✅ מייל סווג',
        description: 'המייל נוסף לתיקייה בהצלחה',
      });
      
      await loadFolders();
      return true;
    } catch (error) {
      console.error('Error adding email to folder:', error);
      return false;
    }
  }, [user?.id, toast, loadFolders]);

  // Remove email from folder
  const removeEmailFromFolder = useCallback(async (folderId: string, emailId: string) => {
    if (!user?.id) return false;
    
    try {
      const { error } = await supabase
        .from('email_folder_items')
        .delete()
        .eq('folder_id', folderId)
        .eq('email_id', emailId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await loadFolders();
      return true;
    } catch (error) {
      console.error('Error removing email from folder:', error);
      return false;
    }
  }, [user?.id, loadFolders]);

  // Get emails in folder
  const getEmailsInFolder = useCallback(async (folderId: string) => {
    if (!user?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('email_folder_items')
        .select('*')
        .eq('folder_id', folderId)
        .eq('user_id', user.id)
        .order('email_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting folder emails:', error);
      return [];
    }
  }, [user?.id]);

  // Create auto rule
  const createAutoRule = useCallback(async (
    name: string,
    folderId: string,
    ruleType: EmailAutoRule['rule_type'],
    ruleValue: string,
    clientId?: string
  ) => {
    if (!user?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('email_auto_rules')
        .insert({
          user_id: user.id,
          name,
          folder_id: folderId,
          rule_type: ruleType,
          rule_value: ruleValue.toLowerCase().trim(),
          client_id: clientId || null,
          priority: autoRules.length,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: '⚡ כלל אוטומטי נוצר',
        description: `הכלל "${name}" יסווג מיילים אוטומטית`,
      });
      
      await loadAutoRules();
      return data;
    } catch (error) {
      console.error('Error creating auto rule:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן ליצור את הכלל',
        variant: 'destructive',
      });
      return null;
    }
  }, [user?.id, autoRules.length, toast, loadAutoRules]);

  // Toggle auto rule
  const toggleAutoRule = useCallback(async (ruleId: string, isActive: boolean) => {
    if (!user?.id) return false;
    
    try {
      const { error } = await supabase
        .from('email_auto_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', ruleId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await loadAutoRules();
      return true;
    } catch (error) {
      console.error('Error toggling auto rule:', error);
      return false;
    }
  }, [user?.id, loadAutoRules]);

  // Delete auto rule
  const deleteAutoRule = useCallback(async (ruleId: string) => {
    if (!user?.id) return false;
    
    try {
      const { error } = await supabase
        .from('email_auto_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await loadAutoRules();
      return true;
    } catch (error) {
      console.error('Error deleting auto rule:', error);
      return false;
    }
  }, [user?.id, loadAutoRules]);

  // Auto-classify email based on rules
  const autoClassifyEmail = useCallback(async (email: GmailMessage) => {
    if (!user?.id || autoRules.length === 0) return null;
    
    const senderEmail = email.from?.toLowerCase().trim() || '';
    const subject = email.subject?.toLowerCase() || '';
    
    // Sort rules by priority (highest first)
    const sortedRules = [...autoRules]
      .filter(r => r.is_active)
      .sort((a, b) => b.priority - a.priority);
    
    for (const rule of sortedRules) {
      let matches = false;
      
      switch (rule.rule_type) {
        case 'sender_email':
          matches = senderEmail.includes(rule.rule_value);
          break;
        case 'sender_name':
          matches = senderEmail.includes(rule.rule_value) || 
                   email.from?.toLowerCase().includes(rule.rule_value);
          break;
        case 'subject_contains':
          matches = subject.includes(rule.rule_value);
          break;
        case 'client_match':
          // Check if sender matches any client email
          const matchedClient = clients.find(c => 
            c.email?.toLowerCase().includes(senderEmail) ||
            senderEmail.includes(c.email?.toLowerCase() || '')
          );
          matches = !!matchedClient;
          break;
      }
      
      if (matches) {
        // Add email to the matching folder
        await addEmailToFolder(rule.folder_id, email, { 
          clientId: rule.client_id || undefined 
        });
        return rule;
      }
    }
    
    return null;
  }, [user?.id, autoRules, clients, addEmailToFolder]);

  // Batch auto-classify emails
  const batchAutoClassify = useCallback(async (emails: GmailMessage[]) => {
    if (!user?.id) return { classified: 0, total: emails.length };
    
    let classified = 0;
    
    for (const email of emails) {
      const rule = await autoClassifyEmail(email);
      if (rule) classified++;
    }
    
    if (classified > 0) {
      toast({
        title: '📊 סיווג אוטומטי הושלם',
        description: `${classified} מתוך ${emails.length} מיילים סווגו`,
      });
    }
    
    return { classified, total: emails.length };
  }, [user?.id, autoClassifyEmail, toast]);

  // Get folder for client
  const getClientFolder = useCallback((clientId: string) => {
    return folders.find(f => f.client_id === clientId);
  }, [folders]);

  // Create auto-rule for client
  const createClientAutoRule = useCallback(async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.email) return null;
    
    // Find or create client folder
    let folder = getClientFolder(clientId);
    if (!folder) {
      folder = await createFolder(client.name, { clientId, icon: 'user' });
    }
    
    if (!folder) return null;
    
    // Create auto-rule
    return createAutoRule(
      `מיילים מ-${client.name}`,
      folder.id,
      'sender_email',
      client.email,
      clientId
    );
  }, [clients, getClientFolder, createFolder, createAutoRule]);

  return {
    // State
    folders,
    autoRules,
    clients,
    loading,
    
    // Folder operations
    createFolder,
    updateFolder,
    deleteFolder,
    loadFolders,
    
    // Email in folder operations
    addEmailToFolder,
    removeEmailFromFolder,
    getEmailsInFolder,
    
    // Auto-rule operations
    createAutoRule,
    toggleAutoRule,
    deleteAutoRule,
    loadAutoRules,
    
    // Auto-classification
    autoClassifyEmail,
    batchAutoClassify,
    
    // Client-specific
    getClientFolder,
    createClientAutoRule,
  };
}
