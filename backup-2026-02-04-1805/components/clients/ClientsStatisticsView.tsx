// Clients Statistics View - מבט סטטיסטי על הלקוחות
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Layers,
  Users,
  User,
  Briefcase,
  Tag,
  Calendar,
  Bell,
  CheckSquare,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  X,
  Phone,
  Mail,
  Building,
  Hash,
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { format, addDays, addHours } from 'date-fns';
import { he } from 'date-fns/locale';

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
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

interface Consultant {
  id: string;
  name: string;
  profession: string;
  phone: string | null;
  email: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ClientsStatisticsViewProps {
  clients: Client[];
  onClose: () => void;
}

type TabType = 'overview' | 'stages' | 'consultants' | 'categories' | 'tags' | 'status' | 'time';

export function ClientsStatisticsView({ clients, onClose }: ClientsStatisticsViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [stages, setStages] = useState<Stage[]>([]);
  const [clientStages, setClientStages] = useState<{ client_id: string; stage_id: string }[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [clientConsultants, setClientConsultants] = useState<{ client_id: string; consultant_id: string }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Quick reminder dialog
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedClientForReminder, setSelectedClientForReminder] = useState<Client | null>(null);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');
  const [isCreatingReminder, setIsCreatingReminder] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load stages
        const { data: stagesData } = await supabase
          .from('stages')
          .select('*')
          .order('order_index');
        if (stagesData) setStages(stagesData);

        // Load client-stage relationships
        const { data: clientStagesData } = await supabase
          .from('client_stages')
          .select('client_id, stage_id');
        if (clientStagesData) setClientStages(clientStagesData);

        // Load consultants
        const { data: consultantsData } = await supabase
          .from('consultants')
          .select('id, name, profession, phone, email')
          .order('name');
        if (consultantsData) setConsultants(consultantsData);

        // Load client-consultant relationships (from tasks)
        const { data: taskConsultantsData } = await supabase
          .from('task_consultants')
          .select('consultant_id, tasks!inner(client_id)')
          .not('tasks.client_id', 'is', null);
        if (taskConsultantsData) {
          const relations = taskConsultantsData.map((tc: any) => ({
            client_id: tc.tasks.client_id,
            consultant_id: tc.consultant_id,
          }));
          setClientConsultants(relations);
        }

        // Load categories
        const { data: categoriesData } = await supabase
          .from('client_categories')
          .select('*')
          .order('name');
        if (categoriesData) setCategories(categoriesData);

      } catch (error) {
        console.error('Error loading statistics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Get all unique tags from clients
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    clients.forEach(client => {
      if (client.tags) {
        client.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [clients]);

  // Statistics calculations
  const statistics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // By stage
    const byStage: Record<string, Client[]> = {};
    const noStage: Client[] = [];
    
    clients.forEach(client => {
      const clientStageRelation = clientStages.find(cs => cs.client_id === client.id);
      if (clientStageRelation) {
        const stageId = clientStageRelation.stage_id;
        if (!byStage[stageId]) byStage[stageId] = [];
        byStage[stageId].push(client);
      } else {
        noStage.push(client);
      }
    });

    // By consultant
    const byConsultant: Record<string, Client[]> = {};
    const noConsultant: Client[] = [];
    const clientsWithConsultant = new Set<string>();
    
    clientConsultants.forEach(cc => {
      const client = clients.find(c => c.id === cc.client_id);
      if (client) {
        clientsWithConsultant.add(client.id);
        if (!byConsultant[cc.consultant_id]) byConsultant[cc.consultant_id] = [];
        if (!byConsultant[cc.consultant_id].find(c => c.id === client.id)) {
          byConsultant[cc.consultant_id].push(client);
        }
      }
    });
    clients.forEach(client => {
      if (!clientsWithConsultant.has(client.id)) {
        noConsultant.push(client);
      }
    });

    // By category
    const byCategory: Record<string, Client[]> = {};
    const noCategory: Client[] = [];
    
    clients.forEach(client => {
      if (client.category_id) {
        if (!byCategory[client.category_id]) byCategory[client.category_id] = [];
        byCategory[client.category_id].push(client);
      } else {
        noCategory.push(client);
      }
    });

    // By tag
    const byTag: Record<string, Client[]> = {};
    clients.forEach(client => {
      if (client.tags && client.tags.length > 0) {
        client.tags.forEach(tag => {
          if (!byTag[tag]) byTag[tag] = [];
          byTag[tag].push(client);
        });
      }
    });

    // By status
    const byStatus = {
      active: clients.filter(c => c.status === 'active'),
      inactive: clients.filter(c => c.status === 'inactive'),
      pending: clients.filter(c => c.status === 'pending'),
      unknown: clients.filter(c => !c.status),
    };

    // By time
    const byTime = {
      today: clients.filter(c => new Date(c.created_at) >= today),
      week: clients.filter(c => new Date(c.created_at) >= weekAgo && new Date(c.created_at) < today),
      month: clients.filter(c => new Date(c.created_at) >= monthAgo && new Date(c.created_at) < weekAgo),
      older: clients.filter(c => new Date(c.created_at) < monthAgo),
    };

    return {
      total: clients.length,
      byStage,
      noStage,
      byConsultant,
      noConsultant,
      byCategory,
      noCategory,
      byTag,
      byStatus,
      byTime,
    };
  }, [clients, clientStages, clientConsultants]);

  // Filter clients based on current selection
  const displayedClients = useMemo(() => {
    let result: Client[] = [];

    switch (activeTab) {
      case 'stages':
        if (selectedItem === 'none') {
          result = statistics.noStage;
        } else if (selectedItem) {
          result = statistics.byStage[selectedItem] || [];
        }
        break;
      case 'consultants':
        if (selectedItem === 'none') {
          result = statistics.noConsultant;
        } else if (selectedItem) {
          result = statistics.byConsultant[selectedItem] || [];
        }
        break;
      case 'categories':
        if (selectedItem === 'none') {
          result = statistics.noCategory;
        } else if (selectedItem) {
          result = statistics.byCategory[selectedItem] || [];
        }
        break;
      case 'tags':
        if (selectedItem) {
          result = statistics.byTag[selectedItem] || [];
        }
        break;
      case 'status':
        if (selectedItem) {
          result = statistics.byStatus[selectedItem as keyof typeof statistics.byStatus] || [];
        }
        break;
      case 'time':
        if (selectedItem) {
          result = statistics.byTime[selectedItem as keyof typeof statistics.byTime] || [];
        }
        break;
      default:
        result = [];
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(client =>
        client.name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.company?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeTab, selectedItem, statistics, searchQuery]);

  // Create quick reminder
  const handleCreateReminder = async () => {
    if (!selectedClientForReminder || !reminderTitle || !reminderDate) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא כותרת ותאריך',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingReminder(true);
    try {
      const reminderDateTime = reminderTime 
        ? new Date(`${reminderDate}T${reminderTime}`)
        : new Date(`${reminderDate}T09:00`);

      const { error } = await supabase.from('reminders').insert({
        client_id: selectedClientForReminder.id,
        title: reminderTitle,
        description: reminderNotes || null,
        due_date: reminderDateTime.toISOString(),
        is_completed: false,
      });

      if (error) throw error;

      toast({
        title: 'תזכורת נוצרה',
        description: `תזכורת עבור ${selectedClientForReminder.name} נוצרה בהצלחה`,
      });

      // Reset form
      setReminderDialogOpen(false);
      setSelectedClientForReminder(null);
      setReminderTitle('');
      setReminderDate('');
      setReminderTime('');
      setReminderNotes('');
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן ליצור תזכורת',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingReminder(false);
    }
  };

  // Quick reminder presets
  const setReminderPreset = (preset: 'today' | 'tomorrow' | 'week') => {
    const now = new Date();
    let date: Date;
    
    switch (preset) {
      case 'today':
        date = now;
        break;
      case 'tomorrow':
        date = addDays(now, 1);
        break;
      case 'week':
        date = addDays(now, 7);
        break;
    }
    
    setReminderDate(format(date, 'yyyy-MM-dd'));
    setReminderTime('09:00');
  };

  // Tabs configuration
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'סקירה כללית', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'stages', label: 'שלבים', icon: <Layers className="w-4 h-4" /> },
    { id: 'consultants', label: 'יועצים', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'categories', label: 'קטגוריות', icon: <Tag className="w-4 h-4" /> },
    { id: 'tags', label: 'תגיות', icon: <Hash className="w-4 h-4" /> },
    { id: 'status', label: 'סטטוס', icon: <Users className="w-4 h-4" /> },
    { id: 'time', label: 'לפי זמן', icon: <Clock className="w-4 h-4" /> },
  ];

  // Render sidebar items based on active tab
  const renderSidebarItems = () => {
    switch (activeTab) {
      case 'stages':
        return (
          <>
            {stages.map(stage => (
              <button
                key={stage.id}
                onClick={() => setSelectedItem(stage.id)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                  'hover:bg-primary/10 text-right',
                  selectedItem === stage.id && 'bg-primary/20 border-r-4 border-primary'
                )}
              >
                <span className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="font-medium">{stage.name}</span>
                </span>
                <Badge variant="secondary" className="font-bold">
                  {statistics.byStage[stage.id]?.length || 0}
                </Badge>
              </button>
            ))}
            <Separator className="my-2" />
            <button
              onClick={() => setSelectedItem('none')}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                'hover:bg-muted/50 text-right text-muted-foreground',
                selectedItem === 'none' && 'bg-muted border-r-4 border-muted-foreground'
              )}
            >
              <span>ללא שלב</span>
              <Badge variant="outline">{statistics.noStage.length}</Badge>
            </button>
          </>
        );

      case 'consultants':
        return (
          <>
            {consultants.map(consultant => (
              <button
                key={consultant.id}
                onClick={() => setSelectedItem(consultant.id)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                  'hover:bg-primary/10 text-right',
                  selectedItem === consultant.id && 'bg-primary/20 border-r-4 border-primary'
                )}
              >
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-medium">{consultant.name}</span>
                  <span className="text-xs text-muted-foreground">{consultant.profession}</span>
                </span>
                <Badge variant="secondary" className="font-bold">
                  {statistics.byConsultant[consultant.id]?.length || 0}
                </Badge>
              </button>
            ))}
            <Separator className="my-2" />
            <button
              onClick={() => setSelectedItem('none')}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                'hover:bg-muted/50 text-right text-muted-foreground',
                selectedItem === 'none' && 'bg-muted border-r-4 border-muted-foreground'
              )}
            >
              <span>ללא יועץ</span>
              <Badge variant="outline">{statistics.noConsultant.length}</Badge>
            </button>
          </>
        );

      case 'categories':
        return (
          <>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedItem(category.id)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                  'hover:bg-primary/10 text-right',
                  selectedItem === category.id && 'bg-primary/20 border-r-4 border-primary'
                )}
              >
                <span className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                </span>
                <Badge variant="secondary" className="font-bold">
                  {statistics.byCategory[category.id]?.length || 0}
                </Badge>
              </button>
            ))}
            <Separator className="my-2" />
            <button
              onClick={() => setSelectedItem('none')}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                'hover:bg-muted/50 text-right text-muted-foreground',
                selectedItem === 'none' && 'bg-muted border-r-4 border-muted-foreground'
              )}
            >
              <span>ללא קטגוריה</span>
              <Badge variant="outline">{statistics.noCategory.length}</Badge>
            </button>
          </>
        );

      case 'tags':
        return (
          <>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedItem(tag)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                  'hover:bg-primary/10 text-right',
                  selectedItem === tag && 'bg-primary/20 border-r-4 border-primary'
                )}
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-medium">{tag}</span>
                </span>
                <Badge variant="secondary" className="font-bold">
                  {statistics.byTag[tag]?.length || 0}
                </Badge>
              </button>
            ))}
            {allTags.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                אין תגיות במערכת
              </div>
            )}
          </>
        );

      case 'status':
        const statusItems = [
          { id: 'active', label: 'פעיל', color: '#22c55e', count: statistics.byStatus.active.length },
          { id: 'pending', label: 'ממתין', color: '#f59e0b', count: statistics.byStatus.pending.length },
          { id: 'inactive', label: 'לא פעיל', color: '#ef4444', count: statistics.byStatus.inactive.length },
          { id: 'unknown', label: 'לא מוגדר', color: '#6b7280', count: statistics.byStatus.unknown.length },
        ];
        return (
          <>
            {statusItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item.id)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                  'hover:bg-primary/10 text-right',
                  selectedItem === item.id && 'bg-primary/20 border-r-4 border-primary'
                )}
              >
                <span className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.label}</span>
                </span>
                <Badge variant="secondary" className="font-bold">
                  {item.count}
                </Badge>
              </button>
            ))}
          </>
        );

      case 'time':
        const timeItems = [
          { id: 'today', label: 'היום', icon: <Calendar className="w-4 h-4" />, count: statistics.byTime.today.length },
          { id: 'week', label: 'השבוע', icon: <Clock className="w-4 h-4" />, count: statistics.byTime.week.length },
          { id: 'month', label: 'החודש', icon: <Calendar className="w-4 h-4" />, count: statistics.byTime.month.length },
          { id: 'older', label: 'ישנים יותר', icon: <Clock className="w-4 h-4" />, count: statistics.byTime.older.length },
        ];
        return (
          <>
            {timeItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item.id)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                  'hover:bg-primary/10 text-right',
                  selectedItem === item.id && 'bg-primary/20 border-r-4 border-primary'
                )}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </span>
                <Badge variant="secondary" className="font-bold">
                  {item.count}
                </Badge>
              </button>
            ))}
          </>
        );

      default:
        return null;
    }
  };

  // Render overview
  const renderOverview = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {/* Total Clients */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            סה"כ לקוחות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">{statistics.total}</p>
        </CardContent>
      </Card>

      {/* By Stage Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5" />
            שלבים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {stages.slice(0, 3).map(stage => (
              <div key={stage.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  {stage.name}
                </span>
                <span className="font-medium">{statistics.byStage[stage.id]?.length || 0}</span>
              </div>
            ))}
            {stages.length > 3 && (
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto"
                onClick={() => { setActiveTab('stages'); setSelectedItem(null); }}
              >
                ראה עוד...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* By Status Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            סטטוס
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                פעיל
              </span>
              <span className="font-medium">{statistics.byStatus.active.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                ממתין
              </span>
              <span className="font-medium">{statistics.byStatus.pending.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                לא פעיל
              </span>
              <span className="font-medium">{statistics.byStatus.inactive.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            לקוחות חדשים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>היום</span>
              <span className="font-medium text-green-600">+{statistics.byTime.today.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>השבוע</span>
              <span className="font-medium">+{statistics.byTime.week.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>החודש</span>
              <span className="font-medium">+{statistics.byTime.month.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultants Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            יועצים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>עם יועץ</span>
              <span className="font-medium">{statistics.total - statistics.noConsultant.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>ללא יועץ</span>
              <span className="font-medium">{statistics.noConsultant.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>סה"כ יועצים</span>
              <span className="font-medium">{consultants.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="w-5 h-5" />
            קטגוריות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {categories.slice(0, 3).map(category => (
              <div key={category.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                  {category.name}
                </span>
                <span className="font-medium">{statistics.byCategory[category.id]?.length || 0}</span>
              </div>
            ))}
            {statistics.noCategory.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>ללא קטגוריה</span>
                <span className="font-medium">{statistics.noCategory.length}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render client card
  const renderClientCard = (client: Client) => (
    <div
      key={client.id}
      className="flex items-center justify-between p-3 bg-card rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <button
            onClick={() => navigate(`/client/${client.id}`)}
            className="font-medium hover:text-primary hover:underline text-right"
          >
            {client.name}
          </button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {client.email}
              </span>
            )}
            {client.company && (
              <span className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                {client.company}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate(`/client/${client.id}`)}
          title="צפייה בכרטיס לקוח"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setSelectedClientForReminder(client);
            setReminderTitle(`תזכורת עבור ${client.name}`);
            setReminderDialogOpen(true);
          }}
          title="יצירת תזכורת מהירה"
        >
          <Bell className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold">סטטיסטיקות לקוחות</h2>
            <p className="text-sm text-muted-foreground">סה"כ {statistics.total} לקוחות</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedItem(null); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'overview' ? (
          <ScrollArea className="flex-1">
            {renderOverview()}
          </ScrollArea>
        ) : (
          <>
            {/* Sidebar */}
            <div className="w-64 border-l bg-muted/20">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {renderSidebarItems()}
                </div>
              </ScrollArea>
            </div>

            {/* Main Content - Client List */}
            <div className="flex-1 flex flex-col">
              {/* Search */}
              {selectedItem && (
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="חיפוש לקוח..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    נמצאו {displayedClients.length} לקוחות
                  </p>
                </div>
              )}

              {/* Client List */}
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {selectedItem ? (
                    displayedClients.length > 0 ? (
                      displayedClients.map(renderClientCard)
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>לא נמצאו לקוחות</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>בחר קטגוריה מהרשימה כדי לראות לקוחות</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>

      {/* Quick Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              יצירת תזכורת מהירה
            </DialogTitle>
            {selectedClientForReminder && (
              <DialogDescription>
                עבור: {selectedClientForReminder.name}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>כותרת</Label>
              <Input
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="כותרת התזכורת"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReminderPreset('today')}
                className="flex-1"
              >
                היום
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReminderPreset('tomorrow')}
                className="flex-1"
              >
                מחר
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReminderPreset('week')}
                className="flex-1"
              >
                עוד שבוע
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>תאריך</Label>
                <Input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                />
              </div>
              <div>
                <Label>שעה</Label>
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>הערות (אופציונלי)</Label>
              <Textarea
                value={reminderNotes}
                onChange={(e) => setReminderNotes(e.target.value)}
                placeholder="הערות נוספות..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateReminder} disabled={isCreatingReminder}>
              {isCreatingReminder ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  יוצר...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 ml-2" />
                  צור תזכורת
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
