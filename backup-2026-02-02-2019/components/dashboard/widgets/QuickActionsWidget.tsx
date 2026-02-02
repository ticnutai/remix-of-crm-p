// Widget: Quick Actions - פעולות מהירות
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  UserPlus,
  FileText,
  Calendar,
  Receipt,
  FolderPlus,
  Mail,
  MessageSquare,
  Clock,
  Zap,
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color: string;
}

export function QuickActionsWidget() {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'new-client',
      label: 'לקוח חדש',
      icon: <UserPlus className="h-5 w-5" />,
      href: '/clients?action=new',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'new-project',
      label: 'פרויקט חדש',
      icon: <FolderPlus className="h-5 w-5" />,
      href: '/projects?action=new',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'new-quote',
      label: 'הצעת מחיר',
      icon: <FileText className="h-5 w-5" />,
      href: '/quotes?action=new',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'new-invoice',
      label: 'חשבונית חדשה',
      icon: <Receipt className="h-5 w-5" />,
      href: '/finance?tab=invoices&action=new',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      id: 'new-task',
      label: 'משימה חדשה',
      icon: <Plus className="h-5 w-5" />,
      href: '/tasks?action=new',
      color: 'bg-pink-500 hover:bg-pink-600',
    },
    {
      id: 'new-event',
      label: 'אירוע חדש',
      icon: <Calendar className="h-5 w-5" />,
      href: '/calendar?action=new',
      color: 'bg-cyan-500 hover:bg-cyan-600',
    },
    {
      id: 'send-email',
      label: 'שלח מייל',
      icon: <Mail className="h-5 w-5" />,
      href: '/email?compose=true',
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      id: 'start-timer',
      label: 'התחל טיימר',
      icon: <Clock className="h-5 w-5" />,
      href: '/time-logs?timer=start',
      color: 'bg-amber-500 hover:bg-amber-600',
    },
  ];

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      navigate(action.href);
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          פעולות מהירות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className={`flex flex-col items-center justify-center h-20 p-2 gap-1 text-white ${action.color} transition-all`}
              onClick={() => handleAction(action)}
            >
              {action.icon}
              <span className="text-xs font-medium text-center leading-tight">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActionsWidget;
