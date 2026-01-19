// Elegant Clients Gallery - e-control CRM Pro
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ClientsFilterStrip, ClientFilterState } from '@/components/clients/ClientsFilterStrip';
import {
  Users,
  Search,
  Phone,
  Mail,
  Grid3X3,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  Eye,
  Bell,
  CheckSquare,
  Calendar,
  Square,
  Rows3,
  GalleryVertical,
  CircleUser,
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
}

interface ClientStageInfo {
  client_id: string;
  stage_id: string;
}

export default function Clients() {
  console.log('🎨 [Clients Page] Component mounting...');
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact' | 'cards' | 'minimal' | 'portrait'>('grid');
  const [showViewOptions, setShowViewOptions] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<ClientFilterState>({
    stages: [],
    dateFilter: 'all',
    hasReminders: null,
    hasTasks: null,
    hasMeetings: null,
  });
  
  // Client data for filtering
  const [clientStages, setClientStages] = useState<ClientStageInfo[]>([]);
  const [clientsWithReminders, setClientsWithReminders] = useState<Set<string>>(new Set());
  const [clientsWithTasks, setClientsWithTasks] = useState<Set<string>>(new Set());
  const [clientsWithMeetings, setClientsWithMeetings] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('📡 [Clients Page] useEffect triggered - fetching clients...');
    fetchClients();
    fetchFilterData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, clients, filters, clientStages, clientsWithReminders, clientsWithTasks, clientsWithMeetings]);

  const applyFilters = () => {
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

    setFilteredClients(result);
  };

  const fetchFilterData = async () => {
    try {
      // Fetch client stages
      const { data: stagesData } = await supabase
        .from('client_stages')
        .select('client_id, stage_id');
      
      setClientStages(stagesData || []);

      // Fetch clients with reminders (entity_type = 'client')
      const { data: remindersData } = await supabase
        .from('reminders')
        .select('entity_id')
        .eq('entity_type', 'client')
        .eq('is_dismissed', false);
      
      setClientsWithReminders(new Set(remindersData?.map(r => r.entity_id).filter(Boolean) || []));

      // Fetch clients with tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('client_id')
        .not('client_id', 'is', null)
        .neq('status', 'done');
      
      setClientsWithTasks(new Set(tasksData?.map(t => t.client_id).filter(Boolean) || []));

      // Fetch clients with meetings
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('client_id')
        .not('client_id', 'is', null)
        .gte('start_time', new Date().toISOString());
      
      setClientsWithMeetings(new Set(meetingsData?.map(m => m.client_id).filter(Boolean) || []));

    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const fetchClients = async () => {
    console.log('🔄 [Clients Page] fetchClients started...');
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ [Clients Page] Clients loaded successfully:', data?.length || 0);
      setClients((data || []) as Client[]);
      setFilteredClients((data || []) as Client[]);
    } catch (error) {
      console.error('❌ [Clients Page] Error fetching clients:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את רשימת הלקוחות',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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

  // Delete client handler
  const handleDeleteClient = async (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    if (!window.confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return;
    
    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
      
      setClients(prev => prev.filter(c => c.id !== clientId));
      setFilteredClients(prev => prev.filter(c => c.id !== clientId));
      toast({ title: 'הלקוח נמחק בהצלחה' });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({ title: 'שגיאה במחיקת הלקוח', variant: 'destructive' });
    }
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
            minHeight: '220px',
            width: '160px',
            flexDirection: 'column' as const,
            borderRadius: '16px',
            padding: '12px',
          };
        case 'cards':
          return {
            minHeight: '140px',
            flexDirection: 'column' as const,
            borderRadius: '16px',
            padding: '16px',
          };
        case 'minimal':
          return {
            minHeight: '60px',
            flexDirection: 'row' as const,
            borderRadius: '8px',
            padding: '8px 12px',
          };
        case 'list':
          return {
            minHeight: '80px',
            flexDirection: 'row' as const,
            borderRadius: '12px',
            padding: '12px 16px',
          };
        case 'compact':
          return {
            minHeight: '120px',
            flexDirection: 'column' as const,
            borderRadius: '10px',
            padding: '12px',
          };
        default: // grid
          return {
            minHeight: '180px',
            flexDirection: 'column' as const,
            borderRadius: '12px',
            padding: '16px',
          };
      }
    };

    const cardStyle = getCardStyle();
    
    // Portrait view - elegant tall card with avatar placeholder
    if (viewMode === 'portrait') {
      return (
        <div
          className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
          onClick={() => navigate(`/client-profile/${client.id}`)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: cardStyle.borderRadius,
            border: '2px solid #d4a843',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            minHeight: cardStyle.minHeight,
            width: cardStyle.width,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: cardStyle.padding,
          }}
        >
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
            {client.name}
          </h3>
          
          {/* Status */}
          <span 
            style={{
              backgroundColor: statusConfig.bgColor,
              color: statusConfig.textColor,
              fontSize: '10px',
              fontWeight: '600',
              padding: '3px 10px',
              borderRadius: '20px',
              marginTop: '8px',
            }}
          >
            {statusConfig.label}
          </span>
          
          {/* Phone */}
          {client.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', marginTop: 'auto', paddingTop: '8px' }} dir="ltr">
              <Phone style={{ width: '12px', height: '12px' }} />
              <span style={{ fontSize: '11px' }}>{client.phone}</span>
            </div>
          )}

          {/* Hover Actions */}
          {showActions && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              <button onClick={(e) => handleEditClient(e, client.id)} className="w-6 h-6 rounded-full bg-slate-800 border border-amber-500 flex items-center justify-center hover:bg-amber-500">
                <Edit className="w-3 h-3 text-white" />
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
          className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          onClick={() => navigate(`/client-profile/${client.id}`)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #d4a843',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(212, 168, 67, 0.3)',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
          }}
        >
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
            <span 
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.textColor,
                fontSize: '9px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '10px',
                marginTop: '8px',
              }}
            >
              {statusConfig.label}
            </span>
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
              {client.name}
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#64748b' }}>
              {client.phone && (
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
                <Edit className="w-4 h-4 text-white" />
              </button>
              <button onClick={(e) => handleDeleteClient(e, client.id)} className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700">
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
          className="group cursor-pointer transition-all duration-200 hover:bg-slate-50"
          onClick={() => navigate(`/client-profile/${client.id}`)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            borderRight: '3px solid #d4a843',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
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
            {client.name}
          </h3>
          
          {/* Status dot */}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusConfig.bgColor }} title={statusConfig.label} />
          
          {/* Indicators */}
          <div className="flex gap-1">
            {hasReminder && <Bell className="w-4 h-4 text-orange-500" />}
            {hasTask && <CheckSquare className="w-4 h-4 text-blue-500" />}
            {hasMeeting && <Calendar className="w-4 h-4 text-green-500" />}
          </div>
          
          {/* Phone */}
          {client.phone && (
            <span style={{ fontSize: '12px', color: '#64748b', direction: 'ltr' }}>{client.phone}</span>
          )}

          {/* Hover Actions */}
          {showActions && (
            <div className="flex gap-1">
              <button onClick={(e) => handleEditClient(e, client.id)} className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center hover:bg-amber-500">
                <Edit className="w-3 h-3 text-slate-700" />
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
        className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        onClick={() => navigate(`/client-profile/${client.id}`)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: cardStyle.borderRadius,
          border: '2px solid #d4a843',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minHeight: cardStyle.minHeight,
          display: 'flex',
          flexDirection: cardStyle.flexDirection,
        }}
      >
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
              <Edit style={{ width: '14px', height: '14px', color: '#ffffff' }} />
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
          {/* Top Section - Status Badge */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginLeft: viewMode === 'list' ? '16px' : '0' }}>
            <span 
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.textColor,
                fontSize: '12px',
                fontWeight: '600',
                padding: '4px 12px',
                borderRadius: '20px',
              }}
            >
              {statusConfig.label}
            </span>
          </div>

          {/* Center Section - Name */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: viewMode === 'list' ? 'flex-start' : 'center', padding: viewMode === 'list' ? '0 16px' : '12px 0' }}>
            <h3 style={{ 
              fontSize: viewMode === 'compact' ? '16px' : '20px', 
              fontWeight: '700', 
              color: '#d4a843',
              textAlign: viewMode === 'list' ? 'right' : 'center',
              lineHeight: '1.3',
            }}>
              {client.name}
            </h3>
          </div>

          {/* Bottom Section - Contact Info */}
          <div style={{ display: 'flex', flexDirection: viewMode === 'list' ? 'row' : 'column', gap: '6px' }}>
            {client.phone && (
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
        minHeight: '80vh',
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
            </div>

            {/* View Options & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

                {/* View Options Dropdown */}
                {showViewOptions && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '48px',
                      left: '0',
                      backgroundColor: '#1e293b',
                      border: '2px solid #d4a843',
                      borderRadius: '12px',
                      padding: '8px',
                      zIndex: 50,
                      minWidth: '160px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#94a3b8', padding: '4px 8px', marginBottom: '4px' }}>סגנון תצוגה</div>
                    <button
                      onClick={() => { setViewMode('grid'); setShowViewOptions(false); }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: viewMode === 'grid' ? '#d4a843' : 'transparent',
                        color: viewMode === 'grid' ? '#1e293b' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      <LayoutGrid style={{ width: '16px', height: '16px' }} />
                      רשת גדולה
                    </button>
                    <button
                      onClick={() => { setViewMode('cards'); setShowViewOptions(false); }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: viewMode === 'cards' ? '#d4a843' : 'transparent',
                        color: viewMode === 'cards' ? '#1e293b' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginTop: '4px',
                      }}
                    >
                      <Rows3 style={{ width: '16px', height: '16px' }} />
                      כרטיסים מלבניים
                    </button>
                    <button
                      onClick={() => { setViewMode('portrait'); setShowViewOptions(false); }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: viewMode === 'portrait' ? '#d4a843' : 'transparent',
                        color: viewMode === 'portrait' ? '#1e293b' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginTop: '4px',
                      }}
                    >
                      <CircleUser style={{ width: '16px', height: '16px' }} />
                      פורטרט
                    </button>
                    <button
                      onClick={() => { setViewMode('list'); setShowViewOptions(false); }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: viewMode === 'list' ? '#d4a843' : 'transparent',
                        color: viewMode === 'list' ? '#1e293b' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginTop: '4px',
                      }}
                    >
                      <List style={{ width: '16px', height: '16px' }} />
                      רשימה
                    </button>
                    <button
                      onClick={() => { setViewMode('compact'); setShowViewOptions(false); }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: viewMode === 'compact' ? '#d4a843' : 'transparent',
                        color: viewMode === 'compact' ? '#1e293b' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginTop: '4px',
                      }}
                    >
                      <Grid3X3 style={{ width: '16px', height: '16px' }} />
                      קומפקטי
                    </button>
                    <button
                      onClick={() => { setViewMode('minimal'); setShowViewOptions(false); }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: viewMode === 'minimal' ? '#d4a843' : 'transparent',
                        color: viewMode === 'minimal' ? '#1e293b' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginTop: '4px',
                      }}
                    >
                      <GalleryVertical style={{ width: '16px', height: '16px' }} />
                      מינימלי
                    </button>
                  </div>
                )}
              </div>

              {/* Search */}
              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                <Search style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                <Input
                  type="text"
                  placeholder="חיפוש לקוחות..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingRight: '40px',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    color: '#ffffff',
                  }}
                  className="placeholder:text-slate-400 focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Strip */}
        <ClientsFilterStrip
          filters={filters}
          onFiltersChange={setFilters}
          clientsWithReminders={clientsWithReminders}
          clientsWithTasks={clientsWithTasks}
          clientsWithMeetings={clientsWithMeetings}
        />

        {/* Clients Grid */}
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
          <div style={{
            display: viewMode === 'list' || viewMode === 'minimal' ? 'flex' : 'grid',
            flexDirection: viewMode === 'list' || viewMode === 'minimal' ? 'column' : undefined,
            gridTemplateColumns: 
              viewMode === 'portrait' 
                ? 'repeat(auto-fill, minmax(160px, 1fr))'
                : viewMode === 'cards'
                  ? 'repeat(auto-fill, minmax(320px, 1fr))'
                  : viewMode === 'compact' 
                    ? 'repeat(auto-fill, minmax(200px, 1fr))' 
                    : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: viewMode === 'list' || viewMode === 'minimal' ? '8px' : viewMode === 'portrait' ? '12px' : '16px',
          }}>
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
