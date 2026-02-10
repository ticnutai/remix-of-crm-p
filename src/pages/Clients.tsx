// Elegant Clients Gallery - tenarch CRM Pro
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewSettings } from '@/hooks/useUserSettings';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { toast } from '@/hooks/use-toast';
import { ClientsFilterStrip, ClientFilterState } from '@/components/clients/ClientsFilterStrip';
import { ClientQuickClassify } from '@/components/clients/ClientQuickClassify';
import SmartComboField from '@/components/clients/SmartComboField';
import { ClientsByStageView } from '@/components/clients/ClientsByStageView';
import { ClientsStatisticsView } from '@/components/clients/ClientsStatisticsView';
import { BulkClassifyDialog } from '@/components/clients/BulkClassifyDialog';
import { BulkStageDialog } from '@/components/clients/BulkStageDialog';
import { BulkConsultantDialog } from '@/components/clients/BulkConsultantDialog';
import { CategoryTagsManager } from '@/components/clients/CategoryTagsManager';
import { CategoriesSidebar } from '@/components/clients/CategoriesSidebar';
import { ClientNameWithCategory } from '@/components/clients/ClientNameWithCategory';
import { isValidPhoneForDisplay } from '@/lib/phone-utils';
import { useInactiveClients } from '@/components/alerts';
import {
  Users,
  Search,
  Phone,
  Mail,
  Grid3X3,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  Eye,
  Bell,
  CheckSquare,
  Calendar,
  Square,
  Rows3,
  GalleryVertical,
  CircleUser,
  Sheet,
  Upload,
  Loader2,
  Check,
  X,
  CheckCheck,
  UserPlus,
  Tag,
  Settings,
  AlertTriangle,
  Copy,
  RefreshCw,
  HelpCircle,
  Sparkles,
  Clock,
  Layers,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: 'active' | 'inactive' | 'pending' | null;
  created_at: string;
  category_id: string | null;
  tags: string[] | null;
  classification: string | null;
}

interface ClientCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ClientStageInfo {
  client_id: string;
  stage_id: string;
}

export default function Clients() {
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();
  
  // Google Sheets integration
  const {
    isConnected: isGoogleSheetsConnected,
    isLoading: googleSheetsLoading,
    connect: connectGoogleSheets,
    syncClientsToSheets,
  } = useGoogleSheets();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showViewOptions, setShowViewOptions] = useState(false);
  
  // Persistent view settings from cloud
  const { 
    viewMode: savedViewMode, 
    columns: savedColumns, 
    sortBy: savedSortBy,
    setViewMode: saveViewMode, 
    setColumns: saveColumns,
    setSortBy: saveSortBy,
    isLoading: settingsLoading 
  } = useViewSettings('clients');
  
  const [viewMode, setViewModeLocal] = useState<'grid' | 'list' | 'compact' | 'cards' | 'minimal' | 'portrait' | 'luxury'>('grid');
  const [minimalColumns, setMinimalColumnsLocal] = useState<2 | 3>(2);
  const [showStagesView, setShowStagesView] = useState(false);
  const [showStatisticsView, setShowStatisticsView] = useState(false);
  
  // Sync with cloud settings when loaded
  useEffect(() => {
    if (!settingsLoading && savedViewMode) {
      setViewModeLocal(savedViewMode as any);
    }
    if (!settingsLoading && savedColumns) {
      setMinimalColumnsLocal(savedColumns as 2 | 3);
    }
    if (!settingsLoading && savedSortBy) {
      setFilters(prev => ({ ...prev, sortBy: savedSortBy as any }));
    }
  }, [settingsLoading, savedViewMode, savedColumns, savedSortBy]);
  
  // Wrapper functions to save to cloud (memoized)
  const setViewMode = useCallback((mode: 'grid' | 'list' | 'compact' | 'cards' | 'minimal' | 'portrait' | 'luxury') => {
    setViewModeLocal(mode);
    saveViewMode(mode);
  }, [saveViewMode]);
  
  const setMinimalColumns = useCallback((cols: 2 | 3) => {
    setMinimalColumnsLocal(cols);
    saveColumns(cols);
  }, [saveColumns]);
  
  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination / Infinite Scroll state
  const PAGE_SIZE = 50;
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Keyboard navigation state
  const [keyboardSearch, setKeyboardSearch] = useState('');
  const [highlightedClientId, setHighlightedClientId] = useState<string | null>(null);
  const keyboardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Add client dialog state
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [showFeaturesHelp, setShowFeaturesHelp] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    gush: '',
    helka: '',
    migrash: '',
    taba: '',
    street: '',
    moshav: '',
    agudaAddress: '',
    agudaEmail: '',
    vaadMoshavAddress: '',
    vaadMoshavEmail: '',
  });
  const [isAddingClient, setIsAddingClient] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<ClientFilterState>({
    stages: [],
    dateFilter: 'all',
    hasReminders: null,
    hasTasks: null,
    hasMeetings: null,
    categories: [],
    tags: [],
    sortBy: 'date_desc',
  });
  
  // Client data for filtering
  const [clientStages, setClientStages] = useState<ClientStageInfo[]>([]);
  const [clientsWithReminders, setClientsWithReminders] = useState<Set<string>>(new Set());
  const [clientsWithTasks, setClientsWithTasks] = useState<Set<string>>(new Set());
  const [clientsWithMeetings, setClientsWithMeetings] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  // Quick Classification dialogs
  const [isBulkClassifyOpen, setIsBulkClassifyOpen] = useState(false);
  const [isBulkStageOpen, setIsBulkStageOpen] = useState(false);
  const [isBulkConsultantOpen, setIsBulkConsultantOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  
  // Duplicate detection state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateClient, setDuplicateClient] = useState<Client | null>(null);
  const [pendingClientData, setPendingClientData] = useState<any>(null);

  // Memoized filtered clients for performance - replaces applyFilters + useEffect pattern
  // MUST be defined before useEffects that use it
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.toLowerCase().includes(query) ||
          client.company?.toLowerCase().includes(query)
      );
    }

    // Stage filter
    if (filters.stages.length > 0) {
      const clientIdsWithSelectedStages = new Set(
        clientStages
          .filter(cs => filters.stages.includes(cs.stage_id))
          .map(cs => cs.client_id)
      );
      result = result.filter(client => clientIdsWithSelectedStages.has(client.id));
    }

    // Date filter
    if (filters.dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      result = result.filter(client => {
        const createdAt = new Date(client.created_at);
        switch (filters.dateFilter) {
          case 'today':
            return createdAt >= today;
          case 'week':
            return createdAt >= weekAgo;
          case 'month':
            return createdAt >= monthAgo;
          case 'older':
            return createdAt < monthAgo;
          default:
            return true;
        }
      });
    }

    // Has reminders filter
    if (filters.hasReminders === true) {
      result = result.filter(client => clientsWithReminders.has(client.id));
    }

    // Has tasks filter
    if (filters.hasTasks === true) {
      result = result.filter(client => clientsWithTasks.has(client.id));
    }

    // Has meetings filter
    if (filters.hasMeetings === true) {
      result = result.filter(client => clientsWithMeetings.has(client.id));
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter(client => client.category_id && filters.categories.includes(client.category_id));
    }

    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter(client => 
        client.tags && client.tags.some(tag => filters.tags.includes(tag))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name, 'he');
        case 'name_desc':
          return b.name.localeCompare(a.name, 'he');
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'classification_asc': {
          const classA = (a.classification || 'תתת').localeCompare('', 'he') ? (a.classification || 'תתת') : 'תתת';
          const classB = (b.classification || 'תתת').localeCompare('', 'he') ? (b.classification || 'תתת') : 'תתת';
          const classCompare = classA.localeCompare(classB, 'he');
          if (classCompare !== 0) return classCompare;
          return a.name.localeCompare(b.name, 'he');
        }
        default:
          return 0;
      }
    });

    return result;
  }, [clients, searchQuery, filters, clientStages, clientsWithReminders, clientsWithTasks, clientsWithMeetings]);

  // Calculate client count per category for sidebar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(client => {
      if (client.category_id) {
        counts[client.category_id] = (counts[client.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [clients]);

  // Data fetching effect moved below function declarations

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [searchQuery, filters]);
  
  // Infinite Scroll with Intersection Observer - uses scroll container
  useEffect(() => {
    if (!loadMoreRef.current || !scrollContainerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && displayedCount < filteredClients.length && !isLoadingMore) {
          setIsLoadingMore(true);
          // Load more quickly for smoother experience
          setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + PAGE_SIZE, filteredClients.length));
            setIsLoadingMore(false);
          }, 50);
        }
      },
      { 
        root: scrollContainerRef.current, // Use the scroll container as root
        threshold: 0.1, 
        rootMargin: '200px' // Increased margin to trigger earlier
      }
    );
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [displayedCount, filteredClients.length, isLoadingMore]);

  // Keyboard navigation - jump to client by typing letters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      const key = e.key;
      
      // Handle Escape - clear search
      if (key === 'Escape') {
        setKeyboardSearch('');
        setHighlightedClientId(null);
        if (keyboardTimeoutRef.current) {
          clearTimeout(keyboardTimeoutRef.current);
        }
        return;
      }
      
      // Handle Backspace/Delete - remove last character
      if (key === 'Backspace' || key === 'Delete') {
        e.preventDefault();
        if (keyboardSearch.length > 0) {
          const newSearch = keyboardSearch.slice(0, -1);
          setKeyboardSearch(newSearch);
          
          if (newSearch.length === 0) {
            setHighlightedClientId(null);
          } else {
            // Find matching client with new search
            const matchingClient = filteredClients.find(client => 
              client.name.toLowerCase().startsWith(newSearch.toLowerCase())
            );
            if (matchingClient) {
              setHighlightedClientId(matchingClient.id);
            }
          }
          
          // Reset timeout
          if (keyboardTimeoutRef.current) {
            clearTimeout(keyboardTimeoutRef.current);
          }
          keyboardTimeoutRef.current = setTimeout(() => {
            setKeyboardSearch('');
            setHighlightedClientId(null);
          }, 3000);
        }
        return;
      }
      
      // Only handle letter keys (Hebrew and English) and space
      const isLetter = /^[a-zA-Zא-ת ]$/.test(key);
      
      if (!isLetter) return;
      
      // Prevent default for space to avoid page scroll
      if (key === ' ') {
        e.preventDefault();
      }
      
      // Clear previous timeout
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
      
      // Build search string
      const newSearch = keyboardSearch + key;
      setKeyboardSearch(newSearch);
      
      // Find matching client
      const matchingClient = filteredClients.find(client => 
        client.name.toLowerCase().startsWith(newSearch.toLowerCase())
      );
      
      if (matchingClient) {
        setHighlightedClientId(matchingClient.id);
        
        // Scroll to the client card
        const clientElement = clientRefs.current.get(matchingClient.id);
        if (clientElement) {
          clientElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Show toast with found client
        toast({
          title: `🔍 ${matchingClient.name}`,
          description: `הקלדת: "${newSearch}"`,
          duration: 1500,
        });
      } else {
        // No match found
        toast({
          title: 'לא נמצא',
          description: `אין לקוח שמתחיל ב-"${newSearch}"`,
          variant: 'destructive',
          duration: 1500,
        });
      }
      
      // Reset after 3 seconds of no typing
      keyboardTimeoutRef.current = setTimeout(() => {
        setKeyboardSearch('');
        setHighlightedClientId(null);
      }, 3000);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
    };
  }, [keyboardSearch, filteredClients]);

  const fetchFilterData = useCallback(async () => {
    try {
      // Fetch all filter data in parallel
      const [stagesRes, remindersRes, tasksRes, meetingsRes] = await Promise.all([
        supabase.from('client_stages').select('client_id, stage_id'),
        supabase.from('reminders').select('entity_id').eq('entity_type', 'client').eq('is_dismissed', false),
        supabase.from('tasks').select('client_id').not('client_id', 'is', null).neq('status', 'done'),
        supabase.from('meetings').select('client_id').not('client_id', 'is', null).gte('start_time', new Date().toISOString()),
      ]);

      // Batch all state updates
      React.startTransition(() => {
        setClientStages(stagesRes.data || []);
        setClientsWithReminders(new Set(remindersRes.data?.map(r => r.entity_id).filter(Boolean) || []));
        setClientsWithTasks(new Set(tasksRes.data?.map(t => t.client_id).filter(Boolean) || []));
        setClientsWithMeetings(new Set(meetingsRes.data?.map(m => m.client_id).filter(Boolean) || []));
      });
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  }, []);

  const fetchCategoriesAndTags = useCallback(async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('client_categories')
        .select('id, name, color, icon')
        .order('sort_order');
      
      setCategories(categoriesData || []);

      // Fetch unique tags from all clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('tags')
        .not('tags', 'is', null);
      
      const uniqueTags = new Set<string>();
      clientsData?.forEach(client => {
        if (client.tags && Array.isArray(client.tags)) {
          client.tags.forEach((tag: string) => uniqueTags.add(tag));
        }
      });
      
      setAllTags(Array.from(uniqueTags).sort());
    } catch (error) {
      console.error('Error fetching categories and tags:', error);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all clients without default limit (Supabase defaults to 1000)
      const { data, error, count } = await supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5000); // Ensure we get all clients

      if (error) throw error;

      setClients((data || []) as Client[]);
      // filteredClients is now computed automatically via useMemo
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את רשימת הלקוחות',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Data fetching on mount
  useEffect(() => {
    fetchClients();
    fetchFilterData();
    fetchCategoriesAndTags();
  }, [fetchClients, fetchFilterData, fetchCategoriesAndTags]);

  // Check for duplicate clients
  const checkForDuplicates = async (name: string, email: string | null, phone: string | null, idNumber: string | null) => {
    const conditions = [];
    
    // Check by name (fuzzy match)
    if (name.trim()) {
      conditions.push(`name.ilike.%${name.trim()}%`);
    }
    
    // Check by email (exact match)
    if (email && email.trim()) {
      conditions.push(`email.eq.${email.trim()}`);
    }
    
    // Check by phone (exact match)
    if (phone && phone.trim()) {
      conditions.push(`phone.eq.${phone.trim()}`);
    }
    
    // Check by ID number (exact match)
    if (idNumber && idNumber.trim()) {
      conditions.push(`id_number.eq.${idNumber.trim()}`);
    }
    
    if (conditions.length === 0) return null;
    
    // Build OR query
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(conditions.join(','));
    
    if (error) {
      console.error('Error checking duplicates:', error);
      return null;
    }
    
    // Return first matching duplicate
    return data && data.length > 0 ? data[0] as Client : null;
  };

  // Helper to build client data object from form
  const buildClientData = (userId: string | null) => ({
    name: newClientForm.name.trim(),
    email: newClientForm.email.trim() || null,
    phone: newClientForm.phone.trim() || null,
    id_number: newClientForm.idNumber.trim() || null,
    gush: newClientForm.gush.trim() || null,
    helka: newClientForm.helka.trim() || null,
    migrash: newClientForm.migrash.trim() || null,
    taba: newClientForm.taba.trim() || null,
    street: newClientForm.street.trim() || null,
    moshav: newClientForm.moshav.trim() || null,
    aguda_address: newClientForm.agudaAddress.trim() || null,
    aguda_email: newClientForm.agudaEmail.trim() || null,
    vaad_moshav_address: newClientForm.vaadMoshavAddress.trim() || null,
    vaad_moshav_email: newClientForm.vaadMoshavEmail.trim() || null,
    status: 'active' as const,
    user_id: userId,
    created_by: userId,
  });

  // Add new client with duplicate check
  const handleAddClient = async () => {
    if (!newClientForm.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם לקוח',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingClient(true);
    
    try {
      // Add timeout wrapper to prevent UI freeze
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('הבקשה ארכה יותר מדי זמן')), 15000)
      );

      await Promise.race([
        (async () => {
          // Ensure we have a valid session, try to refresh if lost
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            await supabase.auth.refreshSession();
          }
          
          // Get current user for ownership fields
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id || null;
          
          const clientData = buildClientData(userId);
          
          // Check for duplicates first
          const duplicate = await checkForDuplicates(
            clientData.name,
            clientData.email,
            clientData.phone,
            clientData.id_number
          );
          
          if (duplicate) {
            // Store pending data and show duplicate dialog
            setPendingClientData(clientData);
            setDuplicateClient(duplicate);
            setDuplicateDialogOpen(true);
            setIsAddingClient(false);
            return;
          }
          
          // No duplicate found, proceed with insert
          await insertNewClient(clientData);
        })(),
        timeoutPromise
      ]);
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        title: 'שגיאה',
        description: error?.message || 'לא ניתן להוסיף את הלקוח',
        variant: 'destructive',
      });
      setIsAddingClient(false);
    }
  };

  // Insert new client (used after duplicate check)
  const insertNewClient = async (clientData: any) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'לקוח נוסף בהצלחה',
        description: `הלקוח "${clientData.name}" נוסף למערכת`,
      });

      // Reset form and close dialog
      resetAddClientForm();
      setIsAddClientDialogOpen(false);

      // Refresh clients list
      fetchClients();
      
      // Navigate to new client
      if (data?.id) {
        navigate(`/client-profile/${data.id}`);
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error?.message || 'לא ניתן להוסיף את הלקוח',
        variant: 'destructive',
      });
      setIsAddingClient(false);
    }
  };

  // Handle overwrite duplicate
  const handleOverwriteDuplicate = async () => {
    if (!duplicateClient || !pendingClientData) return;
    
    setIsAddingClient(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update(pendingClientData)
        .eq('id', duplicateClient.id);

      if (error) throw error;

      toast({
        title: 'לקוח עודכן בהצלחה',
        description: `הלקוח "${pendingClientData.name}" עודכן במערכת`,
      });

      // Reset and close dialogs
      resetAddClientForm();
      setDuplicateDialogOpen(false);
      setIsAddClientDialogOpen(false);
      setDuplicateClient(null);
      setPendingClientData(null);

      // Refresh clients list
      fetchClients();
      
      // Navigate to updated client
      navigate(`/client-profile/${duplicateClient.id}`);
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את הלקוח',
        variant: 'destructive',
      });
    } finally {
      setIsAddingClient(false);
    }
  };

  // Handle skip duplicate (add anyway with different identifier)
  const handleSkipDuplicate = () => {
    setDuplicateDialogOpen(false);
    setDuplicateClient(null);
    setPendingClientData(null);
    toast({
      title: 'פעולה בוטלה',
      description: 'הלקוח לא נוסף',
    });
  };

  // Handle add anyway (force add despite duplicate)
  const handleAddAnyway = async () => {
    if (!pendingClientData) return;
    
    setDuplicateDialogOpen(false);
    setDuplicateClient(null);
    
    await insertNewClient(pendingClientData);
    setPendingClientData(null);
  };

  // Reset add client form
  const resetAddClientForm = () => {
    setNewClientForm({
      name: '', email: '', phone: '', idNumber: '',
      gush: '', helka: '', migrash: '', taba: '',
      street: '', moshav: '', agudaAddress: '', agudaEmail: '',
      vaadMoshavAddress: '', vaadMoshavEmail: '',
    });
  };

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case 'active':
        return { label: 'פעיל', bgColor: '#1e3a5f', textColor: '#ffffff' };
      case 'pending':
        return { label: 'ממתין', bgColor: '#64748b', textColor: '#ffffff' };
      case 'inactive':
        return { label: 'לא פעיל', bgColor: '#94a3b8', textColor: '#1e293b' };
      default:
        return { label: 'ממתין', bgColor: '#64748b', textColor: '#ffffff' };
    }
  };

  // Export to Google Sheets
  const handleExportToGoogleSheets = async () => {
    if (!isGoogleSheetsConnected) {
      await connectGoogleSheets();
      return;
    }
    
    if (clients.length === 0) {
      toast({
        title: 'אין לקוחות לייצוא',
        description: 'אין נתונים לייצא',
      });
      return;
    }
    
    await syncClientsToSheets(clients);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedClients(new Set());
  };

  // Toggle client selection
  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  // Select all clients
  const selectAllClients = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.id)));
    }
  };

  // Bulk delete selected clients
  const handleBulkDelete = async () => {
    if (selectedClients.size === 0) return;
    
    const count = selectedClients.size;
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק ${count} לקוחות?`)) return;
    
    setIsDeleting(true);
    try {
      const idsToDelete = Array.from(selectedClients);
      const { error } = await supabase
        .from('clients')
        .delete()
        .in('id', idsToDelete);
      
      if (error) throw error;
      
      setClients(prev => prev.filter(c => !selectedClients.has(c.id)));
      setSelectedClients(new Set());
      setSelectionMode(false);
      
      toast({ title: `${count} לקוחות נמחקו בהצלחה` });
    } catch (error) {
      console.error('Error bulk deleting clients:', error);
      toast({ title: 'שגיאה במחיקת הלקוחות', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete client handler
  const handleDeleteClient = async (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    if (!window.confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return;
    
    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
      
      setClients(prev => prev.filter(c => c.id !== clientId));
      toast({ title: 'הלקוח נמחק בהצלחה' });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({ title: 'שגיאה במחיקת הלקוח', variant: 'destructive' });
    }
  };

  // Context menu delete (no event needed)
  const handleContextDeleteClient = async (clientId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== clientId));
      toast({ title: 'הלקוח נמחק בהצלחה' });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({ title: 'שגיאה במחיקת הלקוח', variant: 'destructive' });
    }
  };

  // Context menu: enter selection mode with this client pre-selected
  const handleStartSelectionWithClient = (clientId: string) => {
    setSelectionMode(true);
    setSelectedClients(new Set([clientId]));
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${label} הועתק ללוח` });
    });
  };

  // Edit client handler
  const handleEditClient = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    navigate(`/client-profile/${clientId}?edit=true`);
  };

  // Elegant Client Card Component
  const ClientCard = ({ client }: { client: Client }) => {
    const statusConfig = getStatusConfig(client.status);
    const hasReminder = clientsWithReminders.has(client.id);
    const hasTask = clientsWithTasks.has(client.id);
    const hasMeeting = clientsWithMeetings.has(client.id);
    const [showActions, setShowActions] = useState(false);
    const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const isHighlighted = highlightedClientId === client.id;
    
    // Register ref for keyboard navigation
    const cardRef = useCallback((node: HTMLDivElement | null) => {
      if (node) {
        clientRefs.current.set(client.id, node);
      }
    }, [client.id]);
    
    const handleMouseEnter = () => {
      hoverTimerRef.current = setTimeout(() => {
        setShowActions(true);
      }, 2000); // 2 seconds
    };
    
    const handleMouseLeave = () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setShowActions(false);
    };

    // Card style configurations based on viewMode
    const getCardStyle = () => {
      switch (viewMode) {
        case 'portrait':
          return {
            minHeight: '200px',
            width: '160px',
            flexDirection: 'column' as const,
            borderRadius: '16px',
            padding: '12px',
          };
        case 'cards':
          return {
            minHeight: '110px',
            flexDirection: 'column' as const,
            borderRadius: '16px',
            padding: '16px',
          };
        case 'minimal':
          return {
            minHeight: '50px',
            flexDirection: 'row' as const,
            borderRadius: '8px',
            padding: '8px 12px',
          };
        case 'list':
          return {
            minHeight: '70px',
            flexDirection: 'row' as const,
            borderRadius: '12px',
            padding: '12px 16px',
          };
        case 'compact':
          return {
            minHeight: '100px',
            flexDirection: 'column' as const,
            borderRadius: '10px',
            padding: '12px',
          };
        case 'luxury':
          return {
            minHeight: '180px',
            flexDirection: 'column' as const,
            borderRadius: '20px',
            padding: '20px',
          };
        default: // grid
          return {
            minHeight: '160px',
            flexDirection: 'column' as const,
            borderRadius: '12px',
            padding: '16px',
          };
      }
    };

    const cardStyle = getCardStyle();
    const isSelected = selectedClients.has(client.id);
    
    // Handle click based on selection mode
    const handleCardClick = (e: React.MouseEvent) => {
      if (selectionMode) {
        e.preventDefault();
        e.stopPropagation();
        toggleClientSelection(client.id);
      } else {
        navigate(`/client-profile/${client.id}`);
      }
    };
    
    // Selection checkbox component
    const SelectionCheckbox = ({ position = 'top-left' }: { position?: string }) => {
      if (!selectionMode) return null;
      
      const positionStyles = position === 'top-left' 
        ? { top: '8px', left: '8px' } 
        : { top: '8px', right: '8px' };
      
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleClientSelection(client.id);
          }}
          style={{
            position: 'absolute',
            ...positionStyles,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
            border: isSelected ? '2px solid #3b82f6' : '2px solid #d4a843',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {isSelected && <Check style={{ width: '16px', height: '16px', color: '#ffffff' }} />}
        </div>
      );
    };
    
    // Portrait view - elegant tall card with avatar placeholder
    if (viewMode === 'portrait') {
      return (
        <div
          ref={cardRef}
          className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: isHighlighted ? '#fef3c7' : isSelected ? '#eff6ff' : '#ffffff',
            borderRadius: cardStyle.borderRadius,
            border: isHighlighted ? '3px solid #f59e0b' : isSelected ? '3px solid #3b82f6' : '2px solid #d4a843',
            boxShadow: isHighlighted ? '0 0 20px rgba(245, 158, 11, 0.5)' : isSelected ? '0 4px 20px rgba(59, 130, 246, 0.3)' : '0 4px 16px rgba(0,0,0,0.08)',
            minHeight: cardStyle.minHeight,
            width: cardStyle.width,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: cardStyle.padding,
          }}
        >
          {/* Selection Checkbox */}
          <SelectionCheckbox position="top-left" />
          
          {/* Indicators */}
          {(hasReminder || hasTask || hasMeeting) && (
            <div className="absolute top-2 right-2 flex gap-1">
              {hasReminder && <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center"><Bell className="w-2.5 h-2.5 text-white" /></div>}
              {hasTask && <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"><CheckSquare className="w-2.5 h-2.5 text-white" /></div>}
              {hasMeeting && <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"><Calendar className="w-2.5 h-2.5 text-white" /></div>}
            </div>
          )}
          
          {/* Avatar Circle */}
          <div 
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
              border: '3px solid #d4a843',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '8px',
            }}
          >
            <span style={{ fontSize: '28px', fontWeight: '700', color: '#d4a843' }}>
              {client.name.charAt(0)}
            </span>
          </div>
          
          {/* Name */}
          <h3 style={{ 
            fontSize: '15px', 
            fontWeight: '700', 
            color: '#1e3a5f',
            textAlign: 'center',
            marginTop: '12px',
            lineHeight: '1.3',
            maxWidth: '100%',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            <ClientNameWithCategory
              clientName={client.name}
              categoryId={client.category_id}
              categories={categories}
            />
          </h3>
          
          {/* Phone */}
          {isValidPhoneForDisplay(client.phone) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', marginTop: 'auto', paddingTop: '8px' }} dir="ltr">
              <Phone style={{ width: '12px', height: '12px' }} />
              <span style={{ fontSize: '11px' }}>{client.phone}</span>
            </div>
          )}

          {/* Hover Actions */}
          {showActions && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              <button onClick={(e) => handleEditClient(e, client.id)} className="w-6 h-6 rounded-full bg-slate-800 border border-amber-500 flex items-center justify-center hover:bg-amber-500">
                <Pencil className="w-3 h-3 text-white" />
              </button>
              <button onClick={(e) => handleDeleteClient(e, client.id)} className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700">
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Cards view - elegant horizontal rectangle cards
    if (viewMode === 'cards') {
      return (
        <div
          ref={cardRef}
          className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: isHighlighted ? '#fef3c7' : isSelected ? '#eff6ff' : '#ffffff',
            borderRadius: '16px',
            border: isHighlighted ? '3px solid #f59e0b' : isSelected ? '3px solid #3b82f6' : '2px solid #d4a843',
            boxShadow: isHighlighted ? '0 0 20px rgba(245, 158, 11, 0.5)' : isSelected ? '0 4px 20px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(212, 168, 67, 0.3)',
            minHeight: '110px',
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
          }}
        >
          {/* Selection Checkbox */}
          <SelectionCheckbox position="top-left" />
          {/* Left colored section */}
          <div 
            style={{
              width: '80px',
              minWidth: '80px',
              background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
            }}
          >
            <div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '2px solid #d4a843',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '22px', fontWeight: '700', color: '#d4a843' }}>
                {client.name.charAt(0)}
              </span>
            </div>
          </div>
          
          {/* Right content */}
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Indicators */}
            {(hasReminder || hasTask || hasMeeting) && (
              <div className="absolute top-3 left-3 flex gap-1">
                {hasReminder && <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center"><Bell className="w-3 h-3 text-white" /></div>}
                {hasTask && <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><CheckSquare className="w-3 h-3 text-white" /></div>}
                {hasMeeting && <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><Calendar className="w-3 h-3 text-white" /></div>}
              </div>
            )}
            
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a5f', marginBottom: '8px' }}>
              <ClientNameWithCategory
                clientName={client.name}
                categoryId={client.category_id}
                categories={categories}
              />
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#64748b' }}>
              {isValidPhoneForDisplay(client.phone) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} dir="ltr">
                  <Phone style={{ width: '14px', height: '14px' }} />
                  <span style={{ fontSize: '13px' }}>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail style={{ width: '14px', height: '14px' }} />
                  <span style={{ fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hover Actions */}
          {showActions && (
            <div className="absolute bottom-3 left-3 flex gap-2">
              <button onClick={(e) => handleEditClient(e, client.id)} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-amber-500 flex items-center justify-center hover:bg-amber-500">
                <Pencil className="w-4 h-4 text-white" />
              </button>
              <button onClick={(e) => handleDeleteClient(e, client.id)} className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700">
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Luxury view - elegant white-gold design
    if (viewMode === 'luxury') {
      return (
        <div
          ref={cardRef}
          className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: isHighlighted ? '3px solid #f59e0b' : isSelected ? '3px solid #3b82f6' : '3px solid #c9a227',
            boxShadow: isHighlighted 
              ? '0 0 25px rgba(245, 158, 11, 0.5)' 
              : isSelected 
                ? '0 8px 30px rgba(59, 130, 246, 0.3)' 
                : '0 8px 30px rgba(201, 162, 39, 0.15), 0 0 0 1px rgba(201, 162, 39, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Luxury corner decorations */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '40px',
            height: '40px',
            borderTop: '3px solid #c9a227',
            borderLeft: '3px solid #c9a227',
            borderTopLeftRadius: '20px',
          }} />
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40px',
            height: '40px',
            borderTop: '3px solid #c9a227',
            borderRight: '3px solid #c9a227',
            borderTopRightRadius: '20px',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '40px',
            height: '40px',
            borderBottom: '3px solid #c9a227',
            borderLeft: '3px solid #c9a227',
            borderBottomLeftRadius: '20px',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '40px',
            height: '40px',
            borderBottom: '3px solid #c9a227',
            borderRight: '3px solid #c9a227',
            borderBottomRightRadius: '20px',
          }} />
          
          {/* Selection Checkbox */}
          <SelectionCheckbox position="top-left" />
          
          {/* Indicators */}
          {(hasReminder || hasTask || hasMeeting) && (
            <div className="absolute top-3 right-3 flex gap-1.5">
              {hasReminder && <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md"><Bell className="w-3 h-3 text-white" /></div>}
              {hasTask && <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md"><CheckSquare className="w-3 h-3 text-white" /></div>}
              {hasMeeting && <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md"><Calendar className="w-3 h-3 text-white" /></div>}
            </div>
          )}
          
          {/* Luxury Avatar */}
          <div 
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%)',
              border: '4px solid #c9a227',
              boxShadow: '0 4px 15px rgba(201, 162, 39, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '8px',
            }}
          >
            <span style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#c9a227',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              {client.name.charAt(0)}
            </span>
          </div>
          
          {/* Name - Navy Blue */}
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: '#1e3a5f',
            textAlign: 'center',
            marginTop: '14px',
            lineHeight: '1.3',
            maxWidth: '100%',
            wordBreak: 'break-word',
            letterSpacing: '0.3px',
          }}>
            <ClientNameWithCategory
              clientName={client.name}
              categoryId={client.category_id}
              categories={categories}
            />
          </h3>
          
          {/* Decorative line */}
          <div style={{
            width: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #c9a227, transparent)',
            margin: '12px 0',
          }} />
          
          {/* Contact Info */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '6px', 
            marginTop: 'auto', 
            paddingTop: '12px',
          }}>
            {isValidPhoneForDisplay(client.phone) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a5f' }} dir="ltr">
                <Phone style={{ width: '14px', height: '14px', color: '#c9a227' }} />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a5f' }}>
                <Mail style={{ width: '14px', height: '14px', color: '#c9a227' }} />
                <span style={{ fontSize: '12px', fontWeight: '500', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
              </div>
            )}
          </div>

          {/* Hover Actions - Luxury Style */}
          {showActions && (
            <div className="absolute bottom-3 left-3 flex gap-2">
              <button 
                onClick={(e) => handleEditClient(e, client.id)} 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#1e3a5f',
                  border: '2px solid #c9a227',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
                className="hover:bg-amber-600"
              >
                <Pencil className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={(e) => handleDeleteClient(e, client.id)} 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  border: '2px solid #c9a227',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
                className="hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Minimal view - super compact single line
    if (viewMode === 'minimal') {
      return (
        <div
          ref={cardRef}
          className="group cursor-pointer transition-all duration-200 hover:bg-slate-50"
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: isHighlighted ? '#fef3c7' : isSelected ? '#eff6ff' : '#ffffff',
            borderRadius: '8px',
            border: isHighlighted ? '2px solid #f59e0b' : isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRight: isHighlighted ? '4px solid #f59e0b' : isSelected ? '4px solid #3b82f6' : '3px solid #d4a843',
            boxShadow: isHighlighted ? '0 0 15px rgba(245, 158, 11, 0.4)' : undefined,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
          }}
        >
          {/* Selection Checkbox (inline for minimal view) */}
          {selectionMode && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleClientSelection(client.id);
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
                border: isSelected ? '2px solid #3b82f6' : '2px solid #d4a843',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {isSelected && <Check style={{ width: '14px', height: '14px', color: '#ffffff' }} />}
            </div>
          )}
          
          {/* Small avatar */}
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1e3a5f',
              border: '2px solid #d4a843',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#d4a843' }}>
              {client.name.charAt(0)}
            </span>
          </div>
          
          {/* Name */}
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a5f', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <ClientNameWithCategory
              clientName={client.name}
              categoryId={client.category_id}
              categories={categories}
            />
          </h3>

          {/* Hover Actions */}
          {showActions && (
            <div className="flex gap-1">
              <button onClick={(e) => handleEditClient(e, client.id)} className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center hover:bg-amber-500">
                <Pencil className="w-3 h-3 text-slate-700" />
              </button>
              <button onClick={(e) => handleDeleteClient(e, client.id)} className="w-6 h-6 rounded bg-red-100 flex items-center justify-center hover:bg-red-500">
                <Trash2 className="w-3 h-3 text-red-600 hover:text-white" />
              </button>
            </div>
          )}
        </div>
      );
    }
    
    // Default view modes (grid, list, compact)
    return (
      <div
        ref={cardRef}
        className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundColor: isHighlighted ? '#fef3c7' : isSelected ? '#eff6ff' : '#ffffff',
          borderRadius: cardStyle.borderRadius,
          border: isHighlighted ? '3px solid #f59e0b' : isSelected ? '3px solid #3b82f6' : '2px solid #d4a843',
          boxShadow: isHighlighted ? '0 0 20px rgba(245, 158, 11, 0.5)' : isSelected ? '0 4px 20px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
          minHeight: cardStyle.minHeight,
          display: 'flex',
          flexDirection: cardStyle.flexDirection,
        }}
      >
        {/* Selection Checkbox */}
        <SelectionCheckbox position="top-left" />
        
        {/* Quick Classify Button */}
        {!selectionMode && (
          <ClientQuickClassify
            clientId={client.id}
            clientName={client.name}
            currentCategoryId={client.category_id}
            currentTags={client.tags}
            categories={categories}
            allTags={allTags}
            onUpdate={() => {
              fetchClients();
              fetchCategoriesAndTags();
            }}
          />
        )}
        {/* Client Indicators - Top Right */}
        {(hasReminder || hasTask || hasMeeting) && (
          <div 
            className="absolute top-2 right-2"
            style={{ display: 'flex', gap: '4px', zIndex: 5 }}
          >
            {hasReminder && (
              <div 
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="יש תזכורות"
              >
                <Bell style={{ width: '12px', height: '12px', color: '#ffffff' }} />
              </div>
            )}
            {hasTask && (
              <div 
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="יש משימות"
              >
                <CheckSquare style={{ width: '12px', height: '12px', color: '#ffffff' }} />
              </div>
            )}
            {hasMeeting && (
              <div 
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="יש פגישות"
              >
                <Calendar style={{ width: '12px', height: '12px', color: '#ffffff' }} />
              </div>
            )}
          </div>
        )}

        {/* Hover Action Buttons */}
        {showActions && (
          <div 
            className="absolute top-2 left-2 transition-opacity duration-200"
            style={{ display: 'flex', gap: '4px', zIndex: 10 }}
          >
            <button
              onClick={(e) => handleEditClient(e, client.id)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#1e3a5f',
                border: '2px solid #d4a843',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              className="hover:bg-amber-500"
              title="עריכה"
            >
              <Pencil style={{ width: '14px', height: '14px', color: '#ffffff' }} />
            </button>
            <button
              onClick={(e) => handleDeleteClient(e, client.id)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                border: '2px solid #dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              className="hover:bg-red-700"
              title="מחיקה"
            >
              <Trash2 style={{ width: '14px', height: '14px', color: '#ffffff' }} />
            </button>
          </div>
        )}

        {/* Card Content */}
        <div style={{ flex: 1, padding: viewMode === 'list' ? '12px 16px' : '16px', display: 'flex', flexDirection: viewMode === 'list' ? 'row' : 'column', justifyContent: 'space-between', alignItems: viewMode === 'list' ? 'center' : 'stretch' }}>
          
          {/* Center Section - Name */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: viewMode === 'list' ? 'flex-start' : 'center', padding: viewMode === 'list' ? '0 16px' : '12px 0' }}>
            <h3 style={{ 
              fontSize: viewMode === 'compact' ? '16px' : '20px', 
              fontWeight: '700', 
              color: '#d4a843',
              textAlign: viewMode === 'list' ? 'right' : 'center',
              lineHeight: '1.3',
            }}>
              <ClientNameWithCategory
                clientName={client.name}
                categoryId={client.category_id}
                categories={categories}
              />
            </h3>
          </div>

          {/* Bottom Section - Contact Info */}
          <div style={{ display: 'flex', flexDirection: viewMode === 'list' ? 'row' : 'column', gap: '6px' }}>
            {isValidPhoneForDisplay(client.phone) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a5f' }} dir="ltr">
                <Phone style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{client.phone}</span>
              </div>
            )}
            {client.email && viewMode !== 'compact' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a5f', ...(viewMode === 'list' ? { marginInlineStart: '16px' } : {}) }}>
                <Mail style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout title="לקוחות">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', backgroundColor: '#ffffff' }}>
          <div style={{ color: '#64748b' }}>טוען...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="לקוחות">
      {/* Main Container - Pure White Background with Gold Frame */}
      <div dir="rtl" style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '3px solid #d4a843',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        padding: '24px',
        height: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        
        {/* Navy Header Bar */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #d4a843',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users style={{ width: '24px', height: '24px', color: '#fbbf24' }} />
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                גלריית לקוחות
              </h1>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                ({filteredClients.length} לקוחות)
              </span>
              
              {/* Add Client Button - Gold themed */}
              <button
                onClick={() => setIsAddClientDialogOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '2px solid #d4a843',
                  borderRadius: '8px',
                  color: '#d4a843',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d4a843';
                  e.currentTarget.style.color = '#1e293b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#d4a843';
                }}
                title="הוסף לקוח חדש"
              >
                <UserPlus style={{ width: '18px', height: '18px' }} />
                הוסף לקוח
              </button>
              
              {/* Navigation to DataTable Pro */}
              <button
                onClick={() => navigate('/datatable-pro')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '2px solid #d4a843',
                  borderRadius: '8px',
                  color: '#d4a843',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d4a843';
                  e.currentTarget.style.color = '#1e293b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#d4a843';
                }}
                title="עבור לטבלת לקוחות"
              >
                <Rows3 style={{ width: '16px', height: '16px' }} />
                טבלה
              </button>

              {/* Multi-Select Mode Toggle Button */}
              <button
                onClick={toggleSelectionMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: selectionMode ? '#d4a843' : 'transparent',
                  border: '2px solid #d4a843',
                  borderRadius: '8px',
                  color: selectionMode ? '#1e293b' : '#d4a843',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
                onMouseEnter={(e) => {
                  if (!selectionMode) {
                    e.currentTarget.style.backgroundColor = '#d4a843';
                    e.currentTarget.style.color = '#1e293b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectionMode) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#d4a843';
                  }
                }}
                title={selectionMode ? "בטל בחירה מרובה" : "הפעל בחירה מרובה"}
              >
                <CheckSquare style={{ width: '18px', height: '18px' }} />
                {selectionMode ? 'בטל בחירה' : 'בחירה מרובה'}
              </button>

              {/* Stages View Toggle Button */}
              <button
                onClick={() => {
                  setShowStagesView(!showStagesView);
                  if (!showStagesView) setShowStatisticsView(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: showStagesView ? '#d4a843' : '#ffffff',
                  border: '2px solid #d4a843',
                  borderRadius: '8px',
                  color: showStagesView ? '#1e293b' : '#d4a843',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(212, 168, 67, 0.2)',
                }}
                onMouseEnter={(e) => {
                  if (!showStagesView) {
                    e.currentTarget.style.backgroundColor = '#d4a843';
                    e.currentTarget.style.color = '#1e293b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showStagesView) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#d4a843';
                  }
                }}
                title="תצוגה לפי שלבים"
              >
                <Layers style={{ width: '16px', height: '16px' }} />
                לפי שלבים
              </button>

              {/* Statistics View Button */}
              <button
                onClick={() => {
                  setShowStatisticsView(!showStatisticsView);
                  if (!showStatisticsView) setShowStagesView(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: showStatisticsView ? '#d4a843' : '#ffffff',
                  border: '2px solid #d4a843',
                  borderRadius: '8px',
                  color: showStatisticsView ? '#1e293b' : '#d4a843',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(212, 168, 67, 0.2)',
                }}
                onMouseEnter={(e) => {
                  if (!showStatisticsView) {
                    e.currentTarget.style.backgroundColor = '#d4a843';
                    e.currentTarget.style.color = '#1e293b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showStatisticsView) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#d4a843';
                  }
                }}
                title="סטטיסטיקות לקוחות"
              >
                <BarChart3 style={{ width: '16px', height: '16px' }} />
                סטטיסטיקות
              </button>
              
              {/* Features Help Button - Gold */}
              <button
                onClick={() => setShowFeaturesHelp(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #d4a843',
                  borderRadius: '50%',
                  color: '#d4a843',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(212, 168, 67, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d4a843';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.color = '#d4a843';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="תכונות זמינות"
              >
                <Sparkles style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* View Options & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Selection Mode Controls */}
              {selectionMode ? (
                <>
                  {/* Selected Count & Select All */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={selectAllClients}
                      style={{
                        height: '40px',
                        padding: '0 16px',
                        borderRadius: '20px',
                        backgroundColor: selectedClients.size === filteredClients.length ? '#3b82f6' : 'transparent',
                        border: '2px solid #3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      title={selectedClients.size === filteredClients.length ? 'בטל בחירת הכל' : 'בחר הכל'}
                    >
                      <CheckCheck style={{ width: '18px', height: '18px', color: selectedClients.size === filteredClients.length ? '#ffffff' : '#3b82f6' }} />
                      <span style={{ color: selectedClients.size === filteredClients.length ? '#ffffff' : '#3b82f6', fontSize: '14px', fontWeight: '500' }}>
                        {selectedClients.size === filteredClients.length ? 'בטל הכל' : 'בחר הכל'}
                      </span>
                    </button>
                    
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                      ({selectedClients.size} נבחרו)
                    </span>
                  </div>
                  
                  {/* Delete Selected Button */}
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedClients.size === 0 || isDeleting}
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      borderRadius: '20px',
                      backgroundColor: selectedClients.size > 0 ? '#dc2626' : 'transparent',
                      border: '2px solid #dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: selectedClients.size === 0 || isDeleting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: selectedClients.size === 0 ? 0.5 : 1,
                    }}
                    title="מחק נבחרים"
                  >
                    {isDeleting ? (
                      <Loader2 style={{ width: '18px', height: '18px', color: '#ffffff', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Trash2 style={{ width: '18px', height: '18px', color: selectedClients.size > 0 ? '#ffffff' : '#dc2626' }} />
                    )}
                    <span style={{ color: selectedClients.size > 0 ? '#ffffff' : '#dc2626', fontSize: '14px', fontWeight: '500' }}>
                      מחק ({selectedClients.size})
                    </span>
                  </button>
                  
                  {/* Bulk Classify Button */}
                  <button
                    onClick={() => setIsBulkClassifyOpen(true)}
                    disabled={selectedClients.size === 0}
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      borderRadius: '20px',
                      backgroundColor: selectedClients.size > 0 ? '#8b5cf6' : 'transparent',
                      border: '2px solid #8b5cf6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: selectedClients.size === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: selectedClients.size === 0 ? 0.5 : 1,
                    }}
                    title="סווג נבחרים"
                  >
                    <Tag style={{ width: '18px', height: '18px', color: selectedClients.size > 0 ? '#ffffff' : '#8b5cf6' }} />
                    <span style={{ color: selectedClients.size > 0 ? '#ffffff' : '#8b5cf6', fontSize: '14px', fontWeight: '500' }}>
                      סווג ({selectedClients.size})
                    </span>
                  </button>
                  
                  {/* Bulk Stage Button */}
                  <button
                    onClick={() => setIsBulkStageOpen(true)}
                    disabled={selectedClients.size === 0}
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      borderRadius: '20px',
                      backgroundColor: selectedClients.size > 0 ? '#8b5cf6' : 'transparent',
                      border: '2px solid #8b5cf6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: selectedClients.size === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: selectedClients.size === 0 ? 0.5 : 1,
                    }}
                    title="הגדר שלב לנבחרים"
                  >
                    <Layers style={{ width: '18px', height: '18px', color: selectedClients.size > 0 ? '#ffffff' : '#8b5cf6' }} />
                    <span style={{ color: selectedClients.size > 0 ? '#ffffff' : '#8b5cf6', fontSize: '14px', fontWeight: '500' }}>
                      שלב ({selectedClients.size})
                    </span>
                  </button>
                  
                  {/* Bulk Consultant Button */}
                  <button
                    onClick={() => setIsBulkConsultantOpen(true)}
                    disabled={selectedClients.size === 0}
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      borderRadius: '20px',
                      backgroundColor: selectedClients.size > 0 ? '#3b82f6' : 'transparent',
                      border: '2px solid #3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: selectedClients.size === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: selectedClients.size === 0 ? 0.5 : 1,
                    }}
                    title="הגדר יועץ לנבחרים"
                  >
                    <Users style={{ width: '18px', height: '18px', color: selectedClients.size > 0 ? '#ffffff' : '#3b82f6' }} />
                    <span style={{ color: selectedClients.size > 0 ? '#ffffff' : '#3b82f6', fontSize: '14px', fontWeight: '500' }}>
                      יועץ ({selectedClients.size})
                    </span>
                  </button>
                  
                  {/* Cancel Selection Button */}
                  <button
                    onClick={toggleSelectionMode}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'transparent',
                      border: '2px solid #94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    className="hover:bg-gray-500/20"
                    title="בטל בחירה"
                  >
                    <X style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
                  </button>
                </>
              ) : (
                <>
                  {/* View Mode Toggle Button */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowViewOptions(!showViewOptions)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    border: '2px solid #d4a843',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  className="hover:bg-amber-500/20"
                  title="אפשרויות תצוגה"
                >
                  <Eye style={{ width: '18px', height: '18px', color: '#d4a843' }} />
                </button>

                {/* View Options Dropdown - Enhanced */}
                {showViewOptions && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '48px',
                      left: '0',
                      backgroundColor: '#1e293b',
                      border: '2px solid #d4a843',
                      borderRadius: '16px',
                      padding: '12px',
                      zIndex: 50,
                      minWidth: '280px',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                    }}
                    dir="rtl"
                  >
                    {/* Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #334155',
                      paddingBottom: '10px',
                      marginBottom: '10px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Eye style={{ width: '18px', height: '18px', color: '#d4a843' }} />
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>אפשרויות תצוגה</span>
                      </div>
                      <button
                        onClick={() => setShowViewOptions(false)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'transparent',
                          border: '1px solid #64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#94a3b8',
                        }}
                      >
                        <X style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>

                    {/* Cards Category */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', padding: '4px 8px', fontWeight: '600' }}>📇 כרטיסים</div>
                      {[
                        { mode: 'grid' as const, icon: LayoutGrid, label: 'רשת גדולה', desc: 'כרטיסים רחבים עם כל הפרטים' },
                        { mode: 'cards' as const, icon: Rows3, label: 'כרטיסים אופקיים', desc: 'תצוגה מלבנית עם אווטאר' },
                        { mode: 'portrait' as const, icon: CircleUser, label: 'פורטרט', desc: 'תמונות פרופיל גדולות' },
                        { mode: 'luxury' as const, icon: Sparkles, label: '✨ יוקרתי', desc: 'עיצוב לבן-זהב מעוצב' },
                      ].map(({ mode, icon: Icon, label, desc }) => (
                        <button
                          key={mode}
                          onClick={() => { setViewMode(mode); setShowViewOptions(false); }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            backgroundColor: viewMode === mode ? 'rgba(212, 168, 67, 0.15)' : 'transparent',
                            color: viewMode === mode ? '#fbbf24' : '#ffffff',
                            border: viewMode === mode ? '1px solid #d4a843' : '1px solid transparent',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginTop: '4px',
                            textAlign: 'right',
                            transition: 'all 0.2s',
                          }}
                          className="hover:bg-slate-700/50"
                        >
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: viewMode === mode ? '#d4a843' : '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Icon style={{ width: '18px', height: '18px', color: viewMode === mode ? '#1e293b' : '#94a3b8' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600' }}>{label}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{desc}</div>
                          </div>
                          {viewMode === mode && <Check style={{ width: '16px', height: '16px', color: '#22c55e' }} />}
                        </button>
                      ))}
                    </div>

                    {/* Lists Category */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', padding: '4px 8px', fontWeight: '600' }}>📋 רשימות</div>
                      {[
                        { mode: 'list' as const, icon: List, label: 'רשימה מפורטת', desc: 'שורות עם כל המידע' },
                        { mode: 'minimal' as const, icon: GalleryVertical, label: 'מינימלי', desc: 'שם וסטטוס בלבד' },
                        { mode: 'compact' as const, icon: Grid3X3, label: 'קומפקטי', desc: 'רשת צפופה, הרבה לקוחות' },
                      ].map(({ mode, icon: Icon, label, desc }) => (
                        <button
                          key={mode}
                          onClick={() => { setViewMode(mode); setShowViewOptions(false); }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            backgroundColor: viewMode === mode ? 'rgba(212, 168, 67, 0.15)' : 'transparent',
                            color: viewMode === mode ? '#fbbf24' : '#ffffff',
                            border: viewMode === mode ? '1px solid #d4a843' : '1px solid transparent',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginTop: '4px',
                            textAlign: 'right',
                            transition: 'all 0.2s',
                          }}
                          className="hover:bg-slate-700/50"
                        >
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: viewMode === mode ? '#d4a843' : '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Icon style={{ width: '18px', height: '18px', color: viewMode === mode ? '#1e293b' : '#94a3b8' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600' }}>{label}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{desc}</div>
                          </div>
                          {viewMode === mode && <Check style={{ width: '16px', height: '16px', color: '#22c55e' }} />}
                        </button>
                      ))}
                    </div>

                    {/* Quick Tips */}
                    <div style={{
                      marginTop: '12px',
                      padding: '10px',
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      border: '1px solid #334155',
                    }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>💡 טיפים</div>
                      <ul style={{ fontSize: '10px', color: '#64748b', margin: 0, paddingRight: '16px', lineHeight: '1.6' }}>
                        <li>הקלד אותיות לחיפוש מהיר</li>
                        <li>לחץ על "בחירה מרובה" למחיקת מספר לקוחות</li>
                        <li>מעבר לטבלה מלאה בכפתור "טבלה"</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              </>
              )}

              {/* Search - White with gold border */}
              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                <Search style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#d4a843' }} />
                <Input
                  type="text"
                  placeholder="חיפוש לקוחות..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingRight: '40px',
                    backgroundColor: '#ffffff',
                    border: '2px solid #d4a843',
                    color: '#d4a843',
                  }}
                  className="placeholder:text-amber-600/50 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Strip */}
        <ClientsFilterStrip
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            if (newFilters.sortBy !== filters.sortBy) {
              saveSortBy(newFilters.sortBy);
            }
          }}
          clientsWithReminders={clientsWithReminders}
          clientsWithTasks={clientsWithTasks}
          clientsWithMeetings={clientsWithMeetings}
          categories={categories}
          allTags={allTags}
        />

        {/* Statistics View - When Enabled */}
        {showStatisticsView ? (
          <div className="flex-1 border rounded-lg bg-card overflow-hidden">
            <ClientsStatisticsView
              clients={clients}
              onClose={() => setShowStatisticsView(false)}
            />
          </div>
        ) : showStagesView ? (
          <ClientsByStageView className="flex-1" />
        ) : (
          <>
            {/* Clients Grid */}
            {/* Minimal View Column Selector */}
            {viewMode === 'minimal' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>מספר עמודות:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[2, 3].map((cols) => (
                <button
                  key={cols}
                  onClick={() => setMinimalColumns(cols as 2 | 3)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: minimalColumns === cols ? '2px solid #d4a843' : '1px solid #cbd5e1',
                    backgroundColor: minimalColumns === cols ? '#1e3a5f' : '#ffffff',
                    color: minimalColumns === cols ? '#d4a843' : '#64748b',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {cols}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clients Content Area - Scrollable */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', gap: '16px', overflow: 'hidden' }}>
          {/* Categories Sidebar */}
          <CategoriesSidebar
            categories={categories}
            selectedCategories={filters.categories}
            onToggleCategory={(categoryId) => {
              const newCategories = filters.categories.includes(categoryId)
                ? filters.categories.filter(c => c !== categoryId)
                : [...filters.categories, categoryId];
              setFilters({ ...filters, categories: newCategories });
            }}
            onClearCategories={() => setFilters({ ...filters, categories: [] })}
            clientCounts={categoryCounts}
          />

          {/* Main Content Area */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {filteredClients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Users style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '20px', color: '#64748b', fontWeight: '500' }}>
              {searchQuery || filters.stages.length > 0 || filters.dateFilter !== 'all' || filters.hasReminders || filters.hasTasks || filters.hasMeetings
                ? 'לא נמצאו לקוחות התואמים לסינון' 
                : 'אין לקוחות במערכת'}
            </p>
          </div>
        ) : (
          <>
            {/* Pagination Info Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '10px 16px',
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              direction: 'rtl',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                  📊 מציג <strong style={{ color: '#1e3a5f' }}>{Math.min(displayedCount, filteredClients.length)}</strong> מתוך <strong style={{ color: '#1e3a5f' }}>{filteredClients.length}</strong> לקוחות
                </span>
                {clients.length !== filteredClients.length && (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    (סה"כ במערכת: {clients.length})
                  </span>
                )}
              </div>
            </div>
            
            <div 
              ref={scrollContainerRef}
              onScroll={(e) => {
                // Infinite scroll on container scroll
                if (isLoadingMore || displayedCount >= filteredClients.length) return;
                const target = e.target as HTMLDivElement;
                const scrollTop = target.scrollTop;
                const scrollHeight = target.scrollHeight;
                const clientHeight = target.clientHeight;
                
                // Load more when user is within 200px of the bottom
                if (scrollTop + clientHeight >= scrollHeight - 200) {
                  setIsLoadingMore(true);
                  setTimeout(() => {
                    setDisplayedCount(prev => Math.min(prev + PAGE_SIZE, filteredClients.length));
                    setIsLoadingMore(false);
                  }, 50);
                }
              }}
              style={{
                flex: 1,
                minHeight: 0,
                display: viewMode === 'list' ? 'flex' : viewMode === 'minimal' ? 'grid' : 'grid',
                flexDirection: viewMode === 'list' ? 'column' : undefined,
                gridTemplateColumns: 
                  viewMode === 'minimal'
                    ? `repeat(${minimalColumns}, 1fr)`
                    : viewMode === 'portrait' 
                      ? 'repeat(auto-fill, minmax(160px, 1fr))'
                      : viewMode === 'cards'
                        ? 'repeat(auto-fill, minmax(320px, 1fr))'
                        : viewMode === 'luxury'
                          ? 'repeat(auto-fill, minmax(280px, 1fr))'
                          : viewMode === 'compact' 
                            ? 'repeat(auto-fill, minmax(200px, 1fr))' 
                            : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: viewMode === 'list' ? '8px' : viewMode === 'minimal' ? '8px' : viewMode === 'portrait' ? '12px' : '16px',
                // גלילה אנכית
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollBehavior: 'smooth',
                alignContent: 'flex-start',
              }}
            >
              {filteredClients.slice(0, displayedCount).map((client) => (
                <ContextMenu key={client.id}>
                  <ContextMenuTrigger asChild>
                    <div>
                      <ClientCard client={client} />
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-56" style={{ direction: 'rtl' }}>
                    <ContextMenuItem
                      onClick={() => navigate(`/client-profile/${client.id}`)}
                      className="gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      צפה בפרופיל
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => navigate(`/client-profile/${client.id}?edit=true`)}
                      className="gap-2 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      ערוך לקוח
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    {client.phone && (
                      <ContextMenuItem
                        onClick={() => copyToClipboard(client.phone!, 'מספר טלפון')}
                        className="gap-2 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        העתק טלפון
                      </ContextMenuItem>
                    )}
                    {client.email && (
                      <ContextMenuItem
                        onClick={() => copyToClipboard(client.email!, 'כתובת מייל')}
                        className="gap-2 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        העתק מייל
                      </ContextMenuItem>
                    )}
                    {(client.phone || client.email) && <ContextMenuSeparator />}
                    <ContextMenuItem
                      onClick={() => handleStartSelectionWithClient(client.id)}
                      className="gap-2 cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" />
                      בחר למחיקה מרובה
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => handleContextDeleteClient(client.id)}
                      className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      מחק לקוח
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              {/* Infinite Scroll Trigger - inside scroll container */}
              {displayedCount < filteredClients.length && (
                <div 
                  ref={loadMoreRef}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '24px',
                    gap: '8px',
                    width: '100%',
                    gridColumn: viewMode !== 'list' ? '1 / -1' : undefined,
                  }}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span style={{ color: '#64748b' }}>טוען עוד לקוחות...</span>
                    </>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                      גלול למטה לטעינת עוד {Math.min(PAGE_SIZE, filteredClients.length - displayedCount)} לקוחות
                    </span>
                  )}
                </div>
              )}
              
              {/* Show "All loaded" message when done */}
              {displayedCount >= filteredClients.length && filteredClients.length > PAGE_SIZE && (
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  color: '#94a3b8',
                  fontSize: '14px',
                  width: '100%',
                  gridColumn: viewMode !== 'list' ? '1 / -1' : undefined,
                }}>
                  ✓ כל {filteredClients.length} הלקוחות נטענו
                </div>
              )}
            </div>
          </>
        )}
        </div>{/* End of Main Content Area */}
        </div>{/* End of Clients Content Area with Sidebar */}
        </>
        )}
      </div>{/* End of Main Container */}
      
      {/* Add Client Dialog */}
      <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-right">
              <UserPlus className="w-5 h-5 text-green-500" />
              הוספת לקוח חדש
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2 overflow-y-auto flex-1 pl-2" style={{ maxHeight: 'calc(90vh - 160px)' }}>
            {/* פרטים בסיסיים */}
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-right">שם לקוח *</Label>
              <Input
                id="client-name"
                value={newClientForm.name}
                onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="הכנס שם לקוח..."
                className="text-right"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newClientForm.name.trim()) {
                    handleAddClient();
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-email" className="text-right">אימייל</Label>
              <Input
                id="client-email"
                type="email"
                value={newClientForm.email}
                onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
                className="text-left"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-phone" className="text-right">טלפון</Label>
              <Input
                id="client-phone"
                type="tel"
                value={newClientForm.phone}
                onChange={(e) => setNewClientForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="050-000-0000"
                className="text-left"
                dir="ltr"
              />
            </div>

            {/* כתובת ומיקום */}
            <div className="border-t pt-4 mt-2">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">כתובת ומיקום</Label>
              <div className="grid grid-cols-2 gap-3">
                <SmartComboField
                  label="רחוב"
                  value={newClientForm.street}
                  onChange={(v) => setNewClientForm(prev => ({ ...prev, street: v }))}
                  placeholder="שם הרחוב"
                  fieldColumn="street"
                />
                <SmartComboField
                  label="מושב / ישוב"
                  value={newClientForm.moshav}
                  onChange={(v) => setNewClientForm(prev => ({ ...prev, moshav: v }))}
                  placeholder="שם המושב"
                  fieldColumn="moshav"
                />
              </div>
            </div>
            
            {/* שדות נדל"ן */}
            <div className="border-t pt-4 mt-2">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">פרטי נדל"ן (אופציונלי)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="client-id-number" className="text-right text-xs">ת.ז / ח.פ</Label>
                  <Input
                    id="client-id-number"
                    value={newClientForm.idNumber}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, idNumber: e.target.value }))}
                    placeholder="תעודת זהות"
                    className="text-right"
                  />
                </div>
                <SmartComboField
                  label='תב"ע'
                  value={newClientForm.taba}
                  onChange={(v) => setNewClientForm(prev => ({ ...prev, taba: v }))}
                  placeholder="תב''ע"
                  fieldColumn="taba"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <SmartComboField
                  label="גוש"
                  value={newClientForm.gush}
                  onChange={(v) => setNewClientForm(prev => ({ ...prev, gush: v }))}
                  placeholder="גוש"
                  fieldColumn="gush"
                />
                <SmartComboField
                  label="חלקה"
                  value={newClientForm.helka}
                  onChange={(v) => setNewClientForm(prev => ({ ...prev, helka: v }))}
                  placeholder="חלקה"
                  fieldColumn="helka"
                />
                <SmartComboField
                  label="מגרש"
                  value={newClientForm.migrash}
                  onChange={(v) => setNewClientForm(prev => ({ ...prev, migrash: v }))}
                  placeholder="מגרש"
                  fieldColumn="migrash"
                />
              </div>
            </div>

            {/* ועד האגודה */}
            <div className="border-t pt-4 mt-2">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">ועד האגודה</Label>
              <div className="grid grid-cols-2 gap-3">
                <SmartComboField
                  label="כתובת ועד האגודה"
                  value={newClientForm.agudaAddress}
                  onChange={(v) => setNewClientForm(prev => ({ ...prev, agudaAddress: v }))}
                  placeholder="כתובת"
                  fieldColumn="aguda_address"
                />
                <SmartComboField
                  label="מייל ועד האגודה"
                  value={newClientForm.agudaEmail}
                  onChange={(v) => setNewClientForm(prev => ({ ...prev, agudaEmail: v }))}
                  placeholder="email@example.com"
                  fieldColumn="aguda_email"
                  dir="ltr"
                  type="email"
                />
              </div>
            </div>

            {/* ועד המושב */}
            <div className="border-t pt-4 mt-2">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">ועד המושב</Label>
              <div className="grid grid-cols-2 gap-3">
                <SmartComboField
                  label="כתובת ועד המושב"
                  value={newClientForm.vaadMoshavAddress}
                  onChange={(v) => setNewClientForm(prev => ({ ...prev, vaadMoshavAddress: v }))}
                  placeholder="כתובת"
                  fieldColumn="vaad_moshav_address"
                />
                <SmartComboField
                  label="מייל ועד המושב"
                  value={newClientForm.vaadMoshavEmail}
                  onChange={(v) => setNewClientForm(prev => ({ ...prev, vaadMoshavEmail: v }))}
                  placeholder="email@example.com"
                  fieldColumn="vaad_moshav_email"
                  dir="ltr"
                  type="email"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-row-reverse gap-2 shrink-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddClientDialogOpen(false);
                resetAddClientForm();
              }}
            >
              ביטול
            </Button>
            <Button
              onClick={handleAddClient}
              disabled={!newClientForm.name.trim() || isAddingClient}
              className="bg-green-600 hover:bg-green-700"
            >
              {isAddingClient ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  מוסיף...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  הוסף לקוח
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Classify Dialog */}
      <BulkClassifyDialog
        isOpen={isBulkClassifyOpen}
        onClose={() => setIsBulkClassifyOpen(false)}
        selectedClientIds={Array.from(selectedClients)}
        categories={categories}
        allTags={allTags}
        onUpdate={() => {
          fetchClients();
          fetchCategoriesAndTags();
          setSelectedClients(new Set());
          setSelectionMode(false);
        }}
      />

      {/* Bulk Stage Dialog */}
      <BulkStageDialog
        isOpen={isBulkStageOpen}
        onClose={() => setIsBulkStageOpen(false)}
        selectedClientIds={Array.from(selectedClients)}
        onUpdate={() => {
          fetchClients();
          setSelectedClients(new Set());
          setSelectionMode(false);
        }}
      />

      {/* Bulk Consultant Dialog */}
      <BulkConsultantDialog
        isOpen={isBulkConsultantOpen}
        onClose={() => setIsBulkConsultantOpen(false)}
        selectedClientIds={Array.from(selectedClients)}
        onUpdate={() => {
          fetchClients();
          setSelectedClients(new Set());
          setSelectionMode(false);
        }}
      />

      {/* Category & Tags Manager Dialog */}
      <CategoryTagsManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        allTags={allTags}
        onUpdate={() => {
          fetchCategoriesAndTags();
        }}
      />

      {/* Duplicate Detection Dialog */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent dir="rtl" className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              נמצא לקוח דומה במערכת
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-4">
              <p className="text-base">
                נמצא לקוח עם פרטים דומים. מה תרצה לעשות?
              </p>
              
              {duplicateClient && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    לקוח קיים:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">שם:</span>{' '}
                      <span className="font-medium">{duplicateClient.name}</span>
                    </div>
                    {duplicateClient.email && (
                      <div>
                        <span className="text-muted-foreground">אימייל:</span>{' '}
                        <span className="font-medium">{duplicateClient.email}</span>
                      </div>
                    )}
                    {duplicateClient.phone && (
                      <div>
                        <span className="text-muted-foreground">טלפון:</span>{' '}
                        <span className="font-medium">{duplicateClient.phone}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">סטטוס:</span>{' '}
                      <Badge variant="outline" className="mr-1">
                        {duplicateClient.status === 'active' ? 'פעיל' : duplicateClient.status === 'pending' ? 'ממתין' : 'לא פעיל'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {pendingClientData && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    לקוח חדש שמנסים להוסיף:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">שם:</span>{' '}
                      <span className="font-medium">{pendingClientData.name}</span>
                    </div>
                    {pendingClientData.email && (
                      <div>
                        <span className="text-muted-foreground">אימייל:</span>{' '}
                        <span className="font-medium">{pendingClientData.email}</span>
                      </div>
                    )}
                    {pendingClientData.phone && (
                      <div>
                        <span className="text-muted-foreground">טלפון:</span>{' '}
                        <span className="font-medium">{pendingClientData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
            <Button
              variant="default"
              onClick={handleOverwriteDuplicate}
              disabled={isAddingClient}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              {isAddingClient ? 'מעדכן...' : 'עדכן קיים (Overwrite)'}
            </Button>
            <Button
              variant="outline"
              onClick={handleAddAnyway}
              disabled={isAddingClient}
            >
              <UserPlus className="h-4 w-4 ml-2" />
              הוסף בכל זאת
            </Button>
            <AlertDialogCancel onClick={handleSkipDuplicate}>
              <X className="h-4 w-4 ml-2" />
              בטל (Skip)
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Features Help Dialog */}
      <Dialog open={showFeaturesHelp} onOpenChange={setShowFeaturesHelp}>
        <DialogContent dir="rtl" style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d4a843' }}>
              <Settings style={{ width: '24px', height: '24px' }} />
              תכונות זמינות
            </DialogTitle>
          </DialogHeader>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '24px',
            padding: '16px 0',
          }}>
            {/* תכונות ליבה */}
            <div>
              <h3 style={{ 
                color: '#16a34a', 
                fontWeight: '600', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Check style={{ width: '18px', height: '18px' }} />
                תכונות ליבה
              </h3>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.8'
              }}>
                <li>• מיון רב-עמודות (Shift+Click)</li>
                <li>• סינון חכם לכל סוג נתון</li>
                <li>• חיפוש גלובלי מהיר</li>
                <li>• עימוד עם בחירת גודל</li>
                <li>• בחירת שורות בודדת/מרובה</li>
              </ul>
            </div>

            {/* תכונות מתקדמות */}
            <div>
              <h3 style={{ 
                color: '#16a34a', 
                fontWeight: '600', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Check style={{ width: '18px', height: '18px' }} />
                תכונות מתקדמות
              </h3>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.8'
              }}>
                <li>• עריכת תאים Inline - לחץ על תא לעריכה</li>
                <li>• הוספת שורות - כפתור "הוסף שורה"</li>
                <li>• הוספת עמודות - כפתור "הוסף עמודה"</li>
                <li>• Undo/Redo - כפתורי ביטול/חזור</li>
                <li>• גרירת שורות - חצים להזזת שורות</li>
                <li>• מחיקת שורות - בחר ולחץ מחק</li>
                <li>• שינוי גודל עמודות</li>
                <li>• הסתרה/הצגת עמודות</li>
              </ul>
            </div>

            {/* ביצועים ו-UX */}
            <div>
              <h3 style={{ 
                color: '#16a34a', 
                fontWeight: '600', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Check style={{ width: '18px', height: '18px' }} />
                ביצועים ו-UX
              </h3>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.8'
              }}>
                <li>• Virtual Scrolling לאלפי שורות</li>
                <li>• ניווט מקלדת מלא</li>
                <li>• RTL מושלם</li>
                <li>• Loading Skeletons</li>
                <li>• יצוא CSV, Excel, PDF</li>
                <li>• הרחבת שורה לפרטים</li>
                <li>• שורת סיכום (סה"כ, ממוצע)</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowFeaturesHelp(false)} variant="outline">
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
