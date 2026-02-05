import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { useClientData } from '@/hooks/useClientData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isValidPhone, formatPhoneDisplay } from '@/utils/phoneValidation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useClientCustomTabs } from '@/hooks/useClientCustomTabs';
import { 
  AddCustomTabDialog, 
  ClientCustomTableTab, 
  AddCustomTableTabDialog,
  ClientTabsGridView,
  ManageTabsDialog,
  ClientStagesTracker,
  ClientStagesBoard,
  ClientTimeLogsTab,
  ClientDeadlinesTab,
  ClientFoldersManager,
} from '@/components/client-tabs';
import { ClientEmailsTab } from '@/components/clients/ClientEmailsTab';
import { ClientPaymentsTab } from '@/components/clients/ClientPaymentsTab';
import {
  ArrowRight,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Bell,
  DollarSign,
  FolderKanban,
  CheckSquare,
  Users,
  Loader2,
  RefreshCw,
  Plus,
  Edit,
  ExternalLink,
  Table,
  MessageCircle,
  LayoutGrid,
  List,
  Receipt,
  TrendingUp,
  Target,
  AlertCircle,
  Upload,
  Database,
  UserCog,
  Layers,
  TableProperties,
  Settings,
  FolderOpen,
  ChevronLeft,
  ChevronDown,
  Timer,
  Folder,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// Icon mapping for custom tabs
const TAB_ICON_MAP: Record<string, React.ElementType> = {
  Database,
  Users,
  UserCog,
  FolderKanban,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  Table,
};

// Status badge component
const StatusBadge = ({ status }: { status: string | null }) => {
  const config: Record<string, { label: string; color: string }> = {
    active: { label: 'פעיל', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    inactive: { label: 'לא פעיל', color: 'bg-slate-50 text-slate-600 border-slate-200' },
    lead: { label: 'ליד', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    prospect: { label: 'פוטנציאלי', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  };
  
  const { label, color } = config[status || 'active'] || config.active;
  
  return (
    <Badge className={`${color} border font-medium`}>{label}</Badge>
  );
};

// Invoice status badge
const InvoiceStatusBadge = ({ status }: { status: string | null }) => {
  const config: Record<string, { label: string; color: string }> = {
    draft: { label: 'טיוטה', color: 'bg-slate-50 text-slate-600 border-slate-200' },
    sent: { label: 'נשלח', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    paid: { label: 'שולם', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    overdue: { label: 'באיחור', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    cancelled: { label: 'בוטל', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  };
  
  const { label, color } = config[status || 'draft'] || config.draft;
  
  return (
    <Badge className={`${color} border font-medium`}>{label}</Badge>
  );
};

// Stats card component - elegant navy style
const StatsCard = ({ title, value, icon: Icon, subtitle, color }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  color?: string;
}) => (
  <Card className="bg-card/80 backdrop-blur-sm border border-[hsl(222,47%,25%)] shadow-sm hover:shadow-md transition-all duration-200">
    <CardContent className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-right flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color || 'text-foreground'}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] shadow-inner">
          <Icon className="h-5 w-5 text-[hsl(45,70%,55%)]" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  
  const {
    client,
    projects,
    timeEntries,
    tasks,
    meetings,
    files,
    messages,
    reminders,
    whatsappMessages,
    invoices,
    customRows,
    allClientTables,
    stats,
    isLoading,
    refresh,
    updateClient,
    addWhatsAppMessage,
    addInvoice,
    updateInvoiceStatus,
  } = useClientData(clientId);

  // Custom tabs hook
  const { tabs: customTabs, canManage: canManageCustomTabs, refetch: refetchCustomTabs, fetchTabData, updateTab, deleteTab } = useClientCustomTabs(clientId);
  const [isAddCustomTabDialogOpen, setIsAddCustomTabDialogOpen] = useState(false);
  const [isAddTableTabDialogOpen, setIsAddTableTabDialogOpen] = useState(false);
  const [isManageTabsDialogOpen, setIsManageTabsDialogOpen] = useState(false);
  
  // Expanded folders state for tabs
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Track which custom tabs have data for gold border
  const [tabsWithData, setTabsWithData] = useState<Set<string>>(new Set());
  
  // Check which custom tabs have data
  const checkTabsData = useCallback(async () => {
    if (!customTabs.length || !clientId) return;
    
    const tabsWithDataSet = new Set<string>();
    
    for (const tab of customTabs) {
      const dataType = tab.data_type;
      
      // For options-type data types (custom with no source_table)
      if (dataType?.source_type === 'custom' && !dataType?.source_table) {
        // Check if there's a custom column for this data type
        const { data: customCols } = await supabase
          .from('table_custom_columns')
          .select('column_key')
          .eq('data_type_id', tab.data_type_id)
          .eq('table_name', 'clients')
          .limit(1);
        
        if (customCols && customCols.length > 0) {
          const columnKey = customCols[0].column_key;
          
          // Fetch client's custom_data directly
          const { data: clientData } = await supabase
            .from('clients')
            .select('custom_data')
            .eq('id', clientId)
            .single();
          
          const customData = clientData?.custom_data as Record<string, any> | null;
          
          if (customData && customData[columnKey]) {
            tabsWithDataSet.add(tab.id);
          }
        }
      } else if (dataType?.source_table) {
        // For linked data types, fetch from source table
        const result = await fetchTabData(tab, clientId);
        if (result && result.length > 0) {
          tabsWithDataSet.add(tab.id);
        }
      }
    }
    
    setTabsWithData(tabsWithDataSet);
  }, [customTabs, clientId, fetchTabData]);
  
  // Check tabs data when customTabs or client changes
  useEffect(() => {
    checkTabsData();
  }, [checkTabsData]);

  const [activeTab, setActiveTab] = useState('overview');
  const [activeTableTab, setActiveTableTab] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
    // שדות נדל"ן
    id_number: '',
    gush: '',
    helka: '',
    migrash: '',
    taba: '',
  });
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    amount: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    description: '',
    project_id: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Open edit dialog
  const handleEditClick = () => {
    if (client) {
      setEditForm({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        address: client.address || '',
        notes: client.notes || '',
        // שדות נדל"ן
        id_number: client.id_number || '',
        gush: client.gush || '',
        helka: client.helka || '',
        migrash: client.migrash || '',
        taba: client.taba || '',
      });
      setIsEditDialogOpen(true);
    }
  };

  // Save client edits
  const handleSaveEdit = async () => {
    await updateClient(editForm);
    setIsEditDialogOpen(false);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !clientId || !user) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(selectedFiles)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${clientId}/${Date.now()}-${file.name}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('client-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('client-files')
          .getPublicUrl(fileName);

        // Insert file record
        const { error: insertError } = await supabase
          .from('client_files')
          .insert({
            client_id: clientId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            file_type: file.type || fileExt,
            uploaded_by: user.id,
            uploader_type: 'staff',
          });

        if (insertError) throw insertError;
      }

      toast({
        title: 'הקבצים הועלו בהצלחה',
      });
      
      refresh();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'שגיאה בהעלאת הקבצים',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Create invoice
  const handleCreateInvoice = async () => {
    if (!invoiceForm.invoice_number || !invoiceForm.amount) return;
    
    await addInvoice({
      invoice_number: invoiceForm.invoice_number,
      amount: parseFloat(invoiceForm.amount),
      issue_date: invoiceForm.issue_date,
      due_date: invoiceForm.due_date || undefined,
      description: invoiceForm.description || undefined,
      project_id: invoiceForm.project_id || undefined,
    });
    
    setInvoiceForm({
      invoice_number: '',
      amount: '',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: '',
      description: '',
      project_id: '',
    });
    setIsInvoiceDialogOpen(false);
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <AppLayout title="פרופיל לקוח">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout title="פרופיל לקוח">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">לקוח לא נמצא</p>
          <Button onClick={() => navigate('/clients')}>
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה ללקוחות
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`פרופיל לקוח - ${client.name}`}>
      <div className="space-y-6" dir="rtl">
        {/* Header - Right aligned */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/clients')}
              className="border-[hsl(222,47%,25%)] hover:bg-[hsl(222,47%,20%)]/10 hover:border-[hsl(222,47%,35%)]"
            >
              <ArrowRight className="h-4 w-4 ml-2" />
              חזרה
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh}
              className="border-[hsl(222,47%,25%)] hover:bg-[hsl(222,47%,20%)]/10 hover:border-[hsl(222,47%,35%)]"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              רענן
            </Button>
            {(isAdmin || isManager) && (
              <Button 
                size="sm" 
                onClick={handleEditClick}
                className="bg-gradient-to-r from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] hover:from-[hsl(222,47%,25%)] hover:to-[hsl(222,47%,35%)] border border-[hsl(222,47%,35%)] text-white shadow-sm"
              >
                <Edit className="h-4 w-4 ml-2" />
                ערוך
              </Button>
            )}
          </div>
        </div>

        {/* Client Info Card - Elegant Navy Border */}
        <Card className="bg-card/95 backdrop-blur-sm border-2 border-[hsl(222,47%,25%)] shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              {/* Right side - Client info */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] flex items-center justify-center shadow-lg flex-shrink-0">
                  <Building className="h-8 w-8 text-[hsl(45,70%,55%)]" />
                </div>
                <div className="text-right flex-1">
                  <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
                  {client.company && (
                    <p className="text-muted-foreground font-medium">{client.company}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 justify-start">
                    <StatusBadge status={client.status} />
                    {client.stage && (
                      <Badge className="border border-[hsl(222,47%,25%)] bg-[hsl(222,47%,20%)]/10 text-foreground">{client.stage}</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Left side - Contact details */}
              <div className="flex flex-col items-end gap-3 text-sm bg-muted/30 rounded-xl p-4 border border-border/50 w-full md:w-auto">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-[hsl(222,47%,40%)] transition-colors">
                    <span>{client.email}</span>
                    <Mail className="h-4 w-4" />
                  </a>
                )}
                {isValidPhone(client.phone) && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-[hsl(222,47%,40%)] transition-colors">
                    <span dir="ltr" className="font-mono">{formatPhoneDisplay(client.phone)}</span>
                    <Phone className="h-4 w-4" />
                  </a>
                )}
                {client.website && (
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-[hsl(222,47%,40%)] transition-colors">
                    <span>{client.website}</span>
                    <Globe className="h-4 w-4" />
                  </a>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{client.address}</span>
                    <MapPin className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="פרויקטים פעילים"
            value={stats.activeProjects}
            icon={FolderKanban}
            subtitle={`מתוך ${stats.totalProjects} פרויקטים`}
          />
          <StatsCard
            title="שעות החודש"
            value={stats.thisMonthHours}
            icon={Clock}
            subtitle={`סה"כ: ${stats.totalHours} שעות`}
          />
          <StatsCard
            title="הכנסות"
            value={`₪${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            subtitle={`${stats.pendingInvoices} חשבוניות ממתינות`}
            color="text-green-600"
          />
          <StatsCard
            title="משימות פתוחות"
            value={stats.openTasks}
            icon={CheckSquare}
            subtitle={`${stats.upcomingMeetings} פגישות קרובות`}
          />
        </div>

        {/* Tabs - Elegant Navy Style - Ordered: Overview, Projects, Time, Tasks, Meetings, Files, Messages, Invoices, etc */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto p-2 gap-1 bg-muted/50 border border-[hsl(222,47%,25%)]/30 rounded-xl">
            {/* Primary tabs - most used first */}
            <TabsTrigger 
              value="overview" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              שלבי עבודה
            </TabsTrigger>
            <TabsTrigger 
              value="all-data" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(45,70%,35%)] data-[state=active]:to-[hsl(45,70%,45%)] data-[state=active]:text-white data-[state=active]:border-[hsl(45,70%,55%)] border border-[hsl(45,70%,45%)]/50 hover:border-[hsl(45,70%,45%)] transition-all bg-[hsl(45,70%,45%)]/5"
            >
              <Layers className="h-4 w-4" />
              כל הנתונים
            </TabsTrigger>
            <TabsTrigger 
              value="projects" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <FolderKanban className="h-4 w-4" />
              פרויקטים ({projects.length})
            </TabsTrigger>
            <TabsTrigger 
              value="time" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <Clock className="h-4 w-4" />
              לוגי זמן ({timeEntries.length})
            </TabsTrigger>
            <TabsTrigger 
              value="deadlines" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <Timer className="h-4 w-4" />
              זמנים
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <CheckSquare className="h-4 w-4" />
              משימות ({tasks.length})
            </TabsTrigger>
            <TabsTrigger 
              value="meetings" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <Calendar className="h-4 w-4" />
              פגישות ({meetings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="files" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <FileText className="h-4 w-4" />
              קבצים ({files.length})
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              הודעות ({messages.length})
            </TabsTrigger>
            <TabsTrigger 
              value="emails" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <Mail className="h-4 w-4" />
              מיילים
            </TabsTrigger>
            <TabsTrigger 
              value="invoices" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <Receipt className="h-4 w-4" />
              חשבוניות ({invoices.length})
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(142,76%,36%)] data-[state=active]:to-[hsl(142,76%,46%)] data-[state=active]:text-white data-[state=active]:border-[hsl(142,76%,55%)] border border-[hsl(142,76%,45%)]/50 hover:border-[hsl(142,76%,45%)] transition-all bg-[hsl(142,76%,45%)]/5"
            >
              <DollarSign className="h-4 w-4" />
              תשלומים
            </TabsTrigger>
            <TabsTrigger 
              value="custom" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <Table className="h-4 w-4" />
              טבלאות ({allClientTables.length})
            </TabsTrigger>
            <TabsTrigger 
              value="whatsapp" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp ({whatsappMessages.length})
            </TabsTrigger>
            <TabsTrigger 
              value="reminders" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border border-transparent hover:border-[hsl(222,47%,25%)]/50 transition-all"
            >
              <Bell className="h-4 w-4" />
              תזכורות ({reminders.length})
            </TabsTrigger>
            
            {/* Grid View Tab - Shows all custom tabs in grid */}
            {customTabs.length > 0 && (
              <TabsTrigger 
                value="grid-view" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(45,70%,35%)] data-[state=active]:to-[hsl(45,70%,45%)] data-[state=active]:text-white data-[state=active]:border-[hsl(45,70%,55%)] border border-[hsl(45,70%,45%)]/50 hover:border-[hsl(45,70%,45%)] transition-all bg-[hsl(45,70%,45%)]/5"
              >
                <LayoutGrid className="h-4 w-4" />
                תצוגת רשת
              </TabsTrigger>
            )}
            
            {/* Custom Data Type Tabs - Grouped by folder */}
            {(() => {
              // Group tabs by folder
              const tabsByFolder: Record<string, typeof customTabs> = {};
              const unfiledTabs: typeof customTabs = [];
              
              customTabs.forEach(tab => {
                const folderName = (tab as any).folder_name;
                if (folderName) {
                  if (!tabsByFolder[folderName]) {
                    tabsByFolder[folderName] = [];
                  }
                  tabsByFolder[folderName].push(tab);
                } else {
                  unfiledTabs.push(tab);
                }
              });
              
              const folderNames = Object.keys(tabsByFolder).sort();
              
              const renderTab = (tab: typeof customTabs[0]) => {
                const IconComponent = TAB_ICON_MAP[tab.icon || 'Database'] || Database;
                const hasData = tabsWithData.has(tab.id);
                const isTableTab = (tab as any).tab_type === 'custom_table';
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={`custom-tab-${tab.id}`} 
                    className={`gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(222,47%,20%)] data-[state=active]:to-[hsl(222,47%,30%)] data-[state=active]:text-white data-[state=active]:border-[hsl(222,47%,35%)] border transition-all ${
                      hasData 
                        ? 'border-[hsl(45,70%,50%)] ring-1 ring-[hsl(45,70%,50%)]/50 bg-[hsl(45,70%,50%)]/5' 
                        : 'border-transparent hover:border-[hsl(222,47%,25%)]/50'
                    }`}
                  >
                    {isTableTab && <TableProperties className="h-3 w-3 text-muted-foreground" />}
                    <IconComponent 
                      className="h-4 w-4" 
                      style={{ color: hasData ? 'hsl(45,70%,50%)' : (tab.data_type?.color || undefined) }}
                    />
                    {tab.display_name}
                  </TabsTrigger>
                );
              };
              
              const toggleFolder = (folderName: string) => {
                setExpandedFolders(prev => {
                  const next = new Set(prev);
                  if (next.has(folderName)) {
                    next.delete(folderName);
                  } else {
                    next.add(folderName);
                  }
                  return next;
                });
              };
              
              return (
                <>
                  {/* Folders */}
                  {folderNames.map(folderName => {
                    const isExpanded = expandedFolders.has(folderName);
                    const folderTabs = tabsByFolder[folderName];
                    const hasDataInFolder = folderTabs.some(t => tabsWithData.has(t.id));
                    
                    return (
                      <div key={folderName} className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 gap-1 px-2 ${hasDataInFolder ? 'text-[hsl(45,70%,50%)]' : 'text-muted-foreground'}`}
                          onClick={() => toggleFolder(folderName)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronLeft className="h-3 w-3" />
                          )}
                          <FolderOpen className="h-4 w-4" />
                          {folderName}
                          <Badge variant="secondary" className="text-xs h-5 px-1.5">
                            {folderTabs.length}
                          </Badge>
                        </Button>
                        {isExpanded && folderTabs.map(renderTab)}
                      </div>
                    );
                  })}
                  
                  {/* Unfiled tabs */}
                  {unfiledTabs.map(renderTab)}
                </>
              );
            })()}
            
            {/* Add Tab Buttons */}
            {canManageCustomTabs && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 border-[hsl(222,47%,25%)] hover:bg-[hsl(222,47%,20%)]/10 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsAddCustomTabDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  טאב נתונים
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 border-[hsl(45,70%,45%)]/50 hover:bg-[hsl(45,70%,45%)]/10 text-muted-foreground hover:text-foreground hover:border-[hsl(45,70%,45%)]"
                  onClick={() => setIsAddTableTabDialogOpen(true)}
                >
                  <TableProperties className="h-4 w-4" />
                  טאב טבלה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={() => setIsManageTabsDialogOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  נהל
                </Button>
              </div>
            )}
          </TabsList>


          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Client Stages Tracker - Above everything */}
            <ClientStagesSection clientId={clientId!} />

            <div className="grid md:grid-cols-2 gap-4">
              {/* Recent Projects */}
              <Card className="border border-[hsl(222,47%,25%)]/50 shadow-sm">
                <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                  <CardTitle className="text-lg">פרויקטים אחרונים</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-48">
                    {projects.slice(0, 5).map(project => (
                      <div key={project.id} className="flex items-center justify-between py-3 px-4 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <div className="text-right">
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy', { locale: he }) : '-'}
                          </p>
                        </div>
                        <Badge className="border border-[hsl(222,47%,25%)] bg-[hsl(222,47%,20%)]/10">{project.status}</Badge>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">אין פרויקטים</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Tasks */}
              <Card className="border border-[hsl(222,47%,25%)]/50 shadow-sm">
                <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                  <CardTitle className="text-lg">משימות פתוחות</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-48">
                    {tasks.filter(t => t.status !== 'completed').slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center justify-between py-3 px-4 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <div className="text-right">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy', { locale: he }) : 'ללא תאריך יעד'}
                          </p>
                        </div>
                        <Badge className="border border-[hsl(222,47%,25%)] bg-[hsl(222,47%,20%)]/10">{task.priority}</Badge>
                      </div>
                    ))}
                    {tasks.filter(t => t.status !== 'completed').length === 0 && (
                      <p className="text-muted-foreground text-center py-4">אין משימות פתוחות</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Upcoming Meetings */}
              <Card className="border border-[hsl(222,47%,25%)]/50 shadow-sm">
                <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                  <CardTitle className="text-lg">פגישות קרובות</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-48">
                    {meetings.filter(m => new Date(m.start_time) >= new Date()).slice(0, 5).map(meeting => (
                      <div key={meeting.id} className="flex items-center justify-between py-3 px-4 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <div className="text-right">
                          <p className="font-medium">{meeting.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(meeting.start_time), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </p>
                        </div>
                        {meeting.location && (
                          <Badge className="border border-[hsl(222,47%,25%)] bg-[hsl(222,47%,20%)]/10">{meeting.location}</Badge>
                        )}
                      </div>
                    ))}
                    {meetings.filter(m => new Date(m.start_time) >= new Date()).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">אין פגישות קרובות</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Invoices */}
              <Card className="border border-[hsl(222,47%,25%)]/50 shadow-sm">
                <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                  <CardTitle className="text-lg">חשבוניות אחרונות</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-48">
                    {invoices.slice(0, 5).map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between py-3 px-4 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <div className="text-right">
                          <p className="font-medium">#{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            ₪{invoice.amount.toLocaleString()}
                          </p>
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    ))}
                    {invoices.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">אין חשבוניות</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {client.notes && (
              <Card className="border border-[hsl(222,47%,25%)]/50 shadow-sm">
                <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                  <CardTitle className="text-lg">הערות</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap text-right">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" dir="rtl">
            <Card className="border border-[hsl(222,47%,25%)]/50">
              <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                <CardTitle className="text-lg">פרויקטים</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="divide-y divide-border/30">
                    {projects.map(project => (
                      <div key={project.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-[hsl(222,47%,25%)]">{project.status}</Badge>
                          <h3 className="font-semibold text-right">{project.name}</h3>
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-2 text-right">{project.description}</p>
                        )}
                        <div className="flex items-center justify-end gap-4 mt-2 text-sm text-muted-foreground">
                          {project.start_date && <span>התחלה: {format(new Date(project.start_date), 'dd/MM/yyyy', { locale: he })}</span>}
                          {project.budget && <span>תקציב: ₪{project.budget.toLocaleString()}</span>}
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">אין פרויקטים</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Entries Tab - Full Featured */}
          <TabsContent value="time">
            <ClientTimeLogsTab 
              clientId={clientId!} 
              clientName={client?.name || 'לקוח'} 
            />
          </TabsContent>

          {/* Deadlines Tab - מניין זמנים */}
          <TabsContent value="deadlines">
            <ClientDeadlinesTab clientId={clientId!} />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" dir="rtl">
            <Card className="border border-[hsl(222,47%,25%)]/50">
              <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                <CardTitle className="text-lg">משימות</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="divide-y divide-border/30">
                    {tasks.map(task => (
                      <div key={task.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-[hsl(222,47%,25%)]">{task.status}</Badge>
                            <Badge variant="outline" className="border-[hsl(222,47%,25%)]">{task.priority}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.project_name && `${task.project_name} • `}
                              {task.assigned_to_name || 'לא משויך'}
                            </p>
                          </div>
                        </div>
                        {task.due_date && (
                          <p className="text-sm text-muted-foreground mt-2 text-right">
                            יעד: {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: he })}
                          </p>
                        )}
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">אין משימות</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" dir="rtl">
            <Card className="border border-[hsl(222,47%,25%)]/50">
              <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                <CardTitle className="text-lg">פגישות</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="divide-y divide-border/30">
                    {meetings.map(meeting => (
                      <div key={meeting.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-[hsl(222,47%,25%)]">{meeting.status}</Badge>
                          <div className="text-right">
                            <p className="font-medium">{meeting.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(meeting.start_time), 'dd/MM/yyyy HH:mm', { locale: he })} - {format(new Date(meeting.end_time), 'HH:mm', { locale: he })}
                            </p>
                          </div>
                        </div>
                        {meeting.location && (
                          <p className="text-sm text-muted-foreground mt-2 text-right">
                            {meeting.location}
                            <MapPin className="h-3 w-3 inline mr-1" />
                          </p>
                        )}
                      </div>
                    ))}
                    {meetings.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">אין פגישות</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" dir="rtl">
            <Card className="border border-[hsl(222,47%,25%)]/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-gradient-to-r from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] hover:from-[hsl(222,47%,25%)] hover:to-[hsl(222,47%,35%)] text-white"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 ml-2" />
                    )}
                    העלאת קובץ
                  </Button>
                </div>
                <CardTitle className="text-lg">קבצים</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="divide-y divide-border/30">
                    {files.map(file => (
                      <div key={file.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium">{file.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ''} • {format(new Date(file.created_at), 'dd/MM/yyyy', { locale: he })}
                            </p>
                          </div>
                          <FileText className="h-8 w-8 text-[hsl(45,70%,55%)]" />
                        </div>
                      </div>
                    ))}
                    {files.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">אין קבצים</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" dir="rtl">
            <Card className="border border-[hsl(222,47%,25%)]/50">
              <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                <CardTitle className="text-lg">הודעות</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div key={message.id} className={`p-4 border rounded-lg ${message.sender_type === 'staff' ? 'bg-[hsl(222,47%,20%)]/5 ml-8' : 'mr-8'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </span>
                          <Badge variant="outline" className="border-[hsl(222,47%,25%)]">{message.sender_type === 'staff' ? 'צוות' : 'לקוח'}</Badge>
                        </div>
                        <p className="text-right">{message.message}</p>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">אין הודעות</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Emails Tab */}
          <TabsContent value="emails" dir="rtl">
            <ClientEmailsTab 
              clientId={clientId!}
              clientName={client?.name || 'לקוח'}
              clientEmail={client?.email || undefined}
            />
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" dir="rtl">
            <Card className="border border-[hsl(222,47%,25%)]/50">
              <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                <CardTitle className="text-lg">תזכורות</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="divide-y divide-border/30">
                    {reminders.map(reminder => (
                      <div key={reminder.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="text-start">
                            <Badge variant={reminder.is_dismissed ? 'secondary' : 'default'} className="border-[hsl(222,47%,25%)]">
                              {reminder.is_dismissed ? 'נדחה' : reminder.is_sent ? 'נשלח' : 'ממתין'}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(reminder.remind_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{reminder.title}</p>
                            {reminder.message && (
                              <p className="text-sm text-muted-foreground">{reminder.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {reminders.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">אין תזכורות</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" dir="rtl">
            <Card className="border border-[hsl(222,47%,25%)]/50">
              <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                <CardTitle className="text-lg">הודעות WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {whatsappMessages.map(msg => (
                      <div key={msg.id} className={`p-4 border rounded-lg ${msg.direction === 'outgoing' ? 'bg-green-50 dark:bg-green-950/20 ml-8' : 'mr-8'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </span>
                          <Badge variant="outline" className="border-[hsl(222,47%,25%)]">{msg.direction === 'outgoing' ? 'יוצא' : 'נכנס'}</Badge>
                        </div>
                        <p className="text-right">{msg.message}</p>
                        {msg.phone_number && (
                          <p className="text-sm text-muted-foreground mt-1 text-right">{msg.phone_number}</p>
                        )}
                      </div>
                    ))}
                    {whatsappMessages.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">אין הודעות WhatsApp</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" dir="rtl">
            <Card className="border border-[hsl(222,47%,25%)]/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30">
                <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-to-r from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] hover:from-[hsl(222,47%,25%)] hover:to-[hsl(222,47%,35%)] text-white">
                      <Plus className="h-4 w-4 ml-2" />
                      חשבונית חדשה
                    </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl">
                    <DialogHeader className="text-right">
                      <DialogTitle>יצירת חשבונית חדשה</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>מספר חשבונית *</Label>
                          <Input
                            value={invoiceForm.invoice_number}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                            placeholder="INV-001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>סכום *</Label>
                          <Input
                            type="number"
                            value={invoiceForm.amount}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>תאריך הנפקה</Label>
                          <Input
                            type="date"
                            value={invoiceForm.issue_date}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, issue_date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>תאריך פירעון</Label>
                          <Input
                            type="date"
                            value={invoiceForm.due_date}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, due_date: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>פרויקט</Label>
                        <Select
                          value={invoiceForm.project_id}
                          onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, project_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="בחר פרויקט (אופציונלי)" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>תיאור</Label>
                        <Textarea
                          value={invoiceForm.description}
                          onChange={(e) => setInvoiceForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="תיאור החשבונית..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                        ביטול
                      </Button>
                      <Button onClick={handleCreateInvoice} disabled={!invoiceForm.invoice_number || !invoiceForm.amount}>
                        צור חשבונית
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <CardTitle className="text-lg">חשבוניות והכנסות</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="divide-y divide-border/30">
                    {invoices.map(invoice => (
                      <div key={invoice.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="text-start">
                            <p className="font-semibold text-lg">₪{invoice.amount.toLocaleString()}</p>
                            <InvoiceStatusBadge status={invoice.status} />
                          </div>
                          <div className="text-right">
                            <p className="font-medium">#{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.project_name && `${invoice.project_name} • `}
                              {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: he })}
                            </p>
                          </div>
                        </div>
                        {invoice.description && (
                          <p className="text-sm text-muted-foreground mt-2 text-right">{invoice.description}</p>
                        )}
                        {invoice.status === 'sent' && (
                          <div className="mt-3 text-right">
                            <Button
                              size="sm"
                              onClick={() => updateInvoiceStatus(invoice.id, 'paid', format(new Date(), 'yyyy-MM-dd'))}
                              className="bg-gradient-to-r from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] hover:from-[hsl(222,47%,25%)] hover:to-[hsl(222,47%,35%)] text-white"
                            >
                              סמן כשולם
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {invoices.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">אין חשבוניות</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" dir="rtl">
            <ClientPaymentsTab clientId={client.id} clientName={client.name} />
          </TabsContent>

          {/* All Tables Tab */}
          <TabsContent value="custom" dir="rtl">
            <Card className="border border-[hsl(222,47%,25%)]/50">
              <CardHeader className="text-right border-b border-border/50 bg-muted/30">
                <CardTitle className="text-lg">נתוני הלקוח בטבלאות</CardTitle>
                <CardDescription className="text-right">כל השורות שבהן הלקוח מופיע מכלל הטבלאות במערכת</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {allClientTables.length > 0 ? (
                  <div className="space-y-4">
                    {/* Table selection buttons */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      {allClientTables.map((table) => (
                        <Button
                          key={table.tableName}
                          variant={activeTableTab === table.tableName ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveTableTab(
                            activeTableTab === table.tableName ? null : table.tableName
                          )}
                          className="gap-2"
                        >
                          <Badge variant="secondary" className="ml-1">
                            {table.rows.length}
                          </Badge>
                          {table.tableDisplayName}
                          <Table className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                    
                    {/* Show selected table or all tables */}
                    <div className="space-y-6">
                      {allClientTables
                        .filter(table => !activeTableTab || activeTableTab === table.tableName)
                        .map((table) => (
                          <div key={table.tableName} className="border border-[hsl(222,47%,25%)]/30 rounded-lg overflow-hidden">
                            <div className="bg-muted/30 px-4 py-2 border-b border-border/50 flex items-center justify-between">
                              <Badge variant="outline" className="border-[hsl(222,47%,25%)]">{table.rows.length} שורות</Badge>
                              <h4 className="font-semibold flex items-center gap-2 text-right">
                                {table.tableDisplayName}
                                <Table className="h-4 w-4" />
                              </h4>
                            </div>
                            <ScrollArea className="max-h-96">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted/50">
                                    <tr>
                                      {table.columns.map((col) => (
                                        <th key={col.key} className="px-4 py-2 text-right font-medium border-b border-border/30">
                                          {col.label}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {table.rows.map((row, rowIndex) => (
                                      <tr key={row.id || rowIndex} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                                        {table.columns.map((col) => {
                                          let value = row[col.key];
                                          
                                          // Format special values
                                          if (value === null || value === undefined) {
                                            value = '-';
                                          } else if (typeof value === 'boolean') {
                                            value = value ? 'כן' : 'לא';
                                          } else if (col.key.includes('date') || col.key.includes('time')) {
                                            try {
                                              value = format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: he });
                                            } catch {
                                              // Keep original value
                                            }
                                          } else if (typeof value === 'number' && col.key.includes('amount')) {
                                            value = `₪${value.toLocaleString()}`;
                                          } else if (typeof value === 'number' && col.key.includes('budget')) {
                                            value = `₪${value.toLocaleString()}`;
                                          }
                                          
                                          return (
                                            <td key={col.key} className="px-4 py-2 text-right">
                                              {String(value)}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </ScrollArea>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">אין נתונים להצגה</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grid View - Shows all custom tabs in grid layout */}
          <TabsContent value="grid-view" className="space-y-4">
            <ClientTabsGridView
              tabs={customTabs}
              clientId={clientId!}
              onTabClick={(tabId) => setActiveTab(`custom-tab-${tabId}`)}
            />
          </TabsContent>

          {/* Custom Data Type Tab Contents */}
          {customTabs.map(tab => (
            <TabsContent key={tab.id} value={`custom-tab-${tab.id}`}>
              <ClientCustomTableTab 
                tab={tab} 
                clientId={clientId!}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Add Custom Tab Dialog */}
        <AddCustomTabDialog
          open={isAddCustomTabDialogOpen}
          onOpenChange={setIsAddCustomTabDialogOpen}
          clientId={clientId}
          onSuccess={refetchCustomTabs}
        />

        {/* Add Custom Table Tab Dialog */}
        <AddCustomTableTabDialog
          open={isAddTableTabDialogOpen}
          onOpenChange={setIsAddTableTabDialogOpen}
          clientId={clientId}
          onSuccess={refetchCustomTabs}
        />

        {/* Edit Client Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle>עריכת פרטי לקוח</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>שם *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>אימייל</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>טלפון</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>חברה</Label>
                <Input
                  value={editForm.company}
                  onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>כתובת</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              
              {/* שדות נדל"ן */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-sm font-semibold mb-3 block">פרטי נדל"ן</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ת.ז.</Label>
                    <Input
                      value={editForm.id_number}
                      onChange={(e) => setEditForm(prev => ({ ...prev, id_number: e.target.value }))}
                      placeholder="תעודת זהות"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>תב"ע</Label>
                    <Input
                      value={editForm.taba}
                      onChange={(e) => setEditForm(prev => ({ ...prev, taba: e.target.value }))}
                      placeholder="תב''ע"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label>גוש</Label>
                    <Input
                      value={editForm.gush}
                      onChange={(e) => setEditForm(prev => ({ ...prev, gush: e.target.value }))}
                      placeholder="גוש"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>חלקה</Label>
                    <Input
                      value={editForm.helka}
                      onChange={(e) => setEditForm(prev => ({ ...prev, helka: e.target.value }))}
                      placeholder="חלקה"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>מגרש</Label>
                    <Input
                      value={editForm.migrash}
                      onChange={(e) => setEditForm(prev => ({ ...prev, migrash: e.target.value }))}
                      placeholder="מגרש"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>הערות</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleSaveEdit}>
                שמור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Tabs Dialog */}
        <ManageTabsDialog
          open={isManageTabsDialogOpen}
          onOpenChange={setIsManageTabsDialogOpen}
          tabs={customTabs}
          onUpdateTab={updateTab}
          onDeleteTab={deleteTab}
          onRefresh={refetchCustomTabs}
        />
      </div>
    </AppLayout>
  );
}

// Client Stages Section with View Toggle
function ClientStagesSection({ clientId }: { clientId: string }) {
  const [viewMode, setViewMode] = React.useState<'list' | 'board' | 'table' | 'folders'>('board');
  const [folderFilter, setFolderFilter] = React.useState<{ folderId: string; folderName: string } | null>(null);

  // Dynamically import ClientStagesTable
  const ClientStagesTable = React.lazy(() => 
    import('@/components/client-tabs/ClientStagesTable').then(m => ({ default: m.ClientStagesTable }))
  );

  // Handler for opening folder stages in board view
  const handleOpenFolderStages = (folderId: string, folderName: string) => {
    setFolderFilter({ folderId, folderName });
    setViewMode('board');
  };

  // Clear folder filter
  const clearFolderFilter = () => {
    setFolderFilter(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">מעקב שלבי לקוח</h3>
          {folderFilter && (
            <Badge 
              variant="secondary" 
              className="gap-1 cursor-pointer hover:bg-destructive/20"
              onClick={clearFolderFilter}
            >
              <FolderOpen className="h-3 w-3" />
              {folderFilter.folderName}
              <span className="text-xs">✕</span>
            </Badge>
          )}
        </div>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === 'board' ? 'default' : 'ghost'}
            className="h-7 px-3"
            onClick={() => setViewMode('board')}
          >
            <LayoutGrid className="h-4 w-4 ml-1" />
            לוח
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            className="h-7 px-3"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 ml-1" />
            רשימה
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            className="h-7 px-3"
            onClick={() => setViewMode('table')}
          >
            <Table className="h-4 w-4 ml-1" />
            טבלה
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'folders' ? 'default' : 'ghost'}
            className="h-7 px-3"
            onClick={() => setViewMode('folders')}
          >
            <Folder className="h-4 w-4 ml-1" />
            תיקיות
          </Button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <ClientStagesBoard 
          clientId={clientId} 
          filterByFolderId={folderFilter?.folderId}
          filterByFolderName={folderFilter?.folderName}
        />
      ) : viewMode === 'table' ? (
        <React.Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
          <ClientStagesTable clientId={clientId} />
        </React.Suspense>
      ) : viewMode === 'folders' ? (
        <ClientFoldersManager 
          clientId={clientId} 
          onOpenFolderStages={handleOpenFolderStages}
        />
      ) : (
        <ClientStagesTracker 
          clientId={clientId}
          onTaskComplete={(stageId, taskId) => {
            console.log(`Task ${taskId} completed in stage ${stageId}`);
          }}
        />
      )}
    </div>
  );
}
