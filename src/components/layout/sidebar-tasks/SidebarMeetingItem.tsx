// SidebarMeetingItem - Mini Meeting Card for Sidebar
import React, { useState, useEffect } from 'react';
import { Meeting } from '@/hooks/useMeetings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Clock,
  Users,
  Video,
  Phone,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building,
  ExternalLink,
  Bell,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format, parseISO, isPast, isToday, differenceInMinutes, isFuture } from 'date-fns';
import { he } from 'date-fns/locale';

// Sidebar colors
const sidebarColors = {
  navy: '#162C58',
  gold: '#D4A843',
  goldLight: '#E8D1B4',
  goldDark: '#B8923A',
  navyLight: '#1E3A6E',
  navyDark: '#0F1F3D',
};

// Meeting type configuration
const meetingTypeConfig = {
  in_person: {
    label: 'פגישה פיזית',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  video: {
    label: 'שיחת וידאו',
    icon: Video,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  phone: {
    label: 'שיחת טלפון',
    icon: Phone,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
};

// Status configuration
const statusConfig = {
  scheduled: { label: 'מתוכנן', color: 'text-blue-400', icon: Clock },
  completed: { label: 'הסתיים', color: 'text-green-400', icon: CheckCircle },
  cancelled: { label: 'בוטל', color: 'text-red-400', icon: XCircle },
};

interface SidebarMeetingItemProps {
  meeting: Meeting;
  onEdit: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
  onMarkComplete?: (meeting: Meeting) => void;
}

export function SidebarMeetingItem({
  meeting,
  onEdit,
  onDelete,
  onMarkComplete,
}: SidebarMeetingItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [minutesUntil, setMinutesUntil] = useState<number | null>(null);
  
  const meetingType = meetingTypeConfig[meeting.meeting_type as keyof typeof meetingTypeConfig] || meetingTypeConfig.in_person;
  const MeetingTypeIcon = meetingType.icon;
  const status = statusConfig[meeting.status as keyof typeof statusConfig] || statusConfig.scheduled;
  
  // Parse dates
  const startTime = parseISO(meeting.start_time);
  const endTime = parseISO(meeting.end_time);
  const isCompleted = meeting.status === 'completed';
  const isCancelled = meeting.status === 'cancelled';
  const hasPassed = isPast(endTime);
  const isMeetingToday = isToday(startTime);
  
  // Check if meeting is in next 15 minutes (for alert animation)
  useEffect(() => {
    const checkUpcoming = () => {
      const now = new Date();
      const meetingStart = parseISO(meeting.start_time);
      const mins = differenceInMinutes(meetingStart, now);
      
      if (mins >= 0 && mins <= 15 && !isCompleted && !isCancelled) {
        setIsUpcoming(true);
        setMinutesUntil(mins);
      } else {
        setIsUpcoming(false);
        setMinutesUntil(null);
      }
    };
    
    checkUpcoming();
    const interval = setInterval(checkUpcoming, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [meeting.start_time, isCompleted, isCancelled]);
  
  // Format time range
  const formatTimeRange = () => {
    return `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
  };

  return (
    <div
      className={cn(
        "group relative p-2.5 rounded-lg transition-all duration-200 cursor-pointer",
        "border border-transparent",
        (isCompleted || isCancelled) && "opacity-60",
        isUpcoming && "border-[#D4A843] animate-pulse",
        hasPassed && !isCompleted && !isCancelled && "border-orange-500/30 bg-orange-500/5",
        !hasPassed && !isUpcoming && "hover:bg-[#D4A843]/10",
      )}
      style={{
        background: isUpcoming 
          ? `${sidebarColors.gold}15` 
          : isHovered && !hasPassed 
            ? `${sidebarColors.gold}10` 
            : undefined,
        boxShadow: isUpcoming ? `0 0 15px ${sidebarColors.gold}30` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Upcoming alert badge */}
      {isUpcoming && minutesUntil !== null && (
        <div 
          className="absolute -top-1 -right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold animate-bounce"
          style={{ 
            background: sidebarColors.gold,
            color: sidebarColors.navy,
          }}
        >
          <Bell className="h-3 w-3" />
          {minutesUntil === 0 ? 'עכשיו!' : `${minutesUntil} דק'`}
        </div>
      )}

      <div className="flex items-start gap-2.5">
        {/* Meeting type icon */}
        <div 
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
            meetingType.bgColor
          )}
        >
          <MeetingTypeIcon className={cn("h-4 w-4", meetingType.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p
            className={cn(
              "text-sm font-medium text-right leading-tight truncate transition-all",
              (isCompleted || isCancelled) && "line-through text-gray-500"
            )}
            style={{ color: (isCompleted || isCancelled) ? undefined : sidebarColors.goldLight }}
          >
            {meeting.title}
          </p>

          {/* Time and location row */}
          <div className="flex items-center justify-end gap-2 mt-1.5 flex-wrap">
            {/* Client name */}
            {meeting.client?.name && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span 
                    className="text-xs flex items-center gap-1 truncate max-w-[80px]"
                    style={{ color: `${sidebarColors.goldLight}80` }}
                  >
                    <Building className="h-3 w-3" />
                    {meeting.client.name}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{meeting.client.name}</TooltipContent>
              </Tooltip>
            )}

            {/* Location (if exists) */}
            {meeting.location && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span 
                    className="text-xs flex items-center gap-1 truncate max-w-[60px]"
                    style={{ color: `${sidebarColors.goldLight}80` }}
                  >
                    <MapPin className="h-3 w-3" />
                    {meeting.location}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{meeting.location}</TooltipContent>
              </Tooltip>
            )}

            {/* Time */}
            <span 
              className={cn(
                "text-xs flex items-center gap-1 font-medium",
                isUpcoming && "text-[#D4A843]",
                hasPassed && !isCompleted && !isCancelled && "text-orange-400",
              )}
              style={{ 
                color: !isUpcoming && !hasPassed ? sidebarColors.goldLight : undefined 
              }}
            >
              <Clock className="h-3 w-3" />
              {formatTimeRange()}
            </span>
          </div>

          {/* Status badge for completed/cancelled */}
          {(isCompleted || isCancelled) && (
            <div className="flex justify-end mt-1.5">
              <Badge
                variant="outline"
                className={cn(
                  "h-5 px-1.5 text-[10px] gap-1",
                  status.color,
                  isCompleted && "border-green-500/50 bg-green-500/10",
                  isCancelled && "border-red-500/50 bg-red-500/10",
                )}
              >
                <status.icon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Actions dropdown - visible on hover */}
        <div className={cn(
          "absolute left-1 top-1 opacity-0 transition-opacity",
          isHovered && "opacity-100"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                style={{ 
                  color: sidebarColors.goldLight,
                  background: `${sidebarColors.gold}20`,
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="left" className="w-36">
              {/* Join meeting link for video calls */}
              {meeting.meeting_type === 'video' && meeting.location && (
                <DropdownMenuItem 
                  onClick={() => window.open(meeting.location!, '_blank')}
                  className="gap-2 cursor-pointer text-purple-500"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>הצטרף לפגישה</span>
                </DropdownMenuItem>
              )}
              {/* Mark as complete */}
              {!isCompleted && !isCancelled && onMarkComplete && (
                <DropdownMenuItem 
                  onClick={() => onMarkComplete(meeting)}
                  className="gap-2 cursor-pointer text-green-500"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>סמן כהושלם</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(meeting)} className="gap-2 cursor-pointer">
                <Pencil className="h-3.5 w-3.5" />
                <span>עריכה</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(meeting)} 
                className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>מחיקה</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default SidebarMeetingItem;
