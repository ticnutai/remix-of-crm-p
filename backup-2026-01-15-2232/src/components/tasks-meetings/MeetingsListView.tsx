import React from 'react';
import { Meeting } from '@/hooks/useMeetings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, Trash2, Calendar, Clock, MapPin, User, Briefcase,
  Video, Phone, Users
} from 'lucide-react';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const meetingTypes = [
  { value: 'in_person', label: 'פגישה פיזית', icon: Users },
  { value: 'video', label: 'וידאו', icon: Video },
  { value: 'phone', label: 'טלפון', icon: Phone },
];

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

interface MeetingsListViewProps {
  meetings: Meeting[];
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
}

export function MeetingsListView({ meetings, onEdit, onDelete }: MeetingsListViewProps) {
  if (meetings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>אין פגישות להצגה</p>
      </div>
    );
  }

  // Group meetings by date
  const groupedMeetings: { [key: string]: Meeting[] } = {};
  meetings.forEach(meeting => {
    const dateKey = format(parseISO(meeting.start_time), 'yyyy-MM-dd');
    if (!groupedMeetings[dateKey]) {
      groupedMeetings[dateKey] = [];
    }
    groupedMeetings[dateKey].push(meeting);
  });

  // Sort keys
  const sortedDates = Object.keys(groupedMeetings).sort();

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'היום';
    if (isTomorrow(date)) return 'מחר';
    return format(date, 'EEEE, d בMMMM', { locale: he });
  };

  return (
    <div className="space-y-6">
      {sortedDates.map(dateKey => {
        const dateMeetings = groupedMeetings[dateKey];
        const dateLabel = getDateLabel(dateKey);
        const date = parseISO(dateKey);
        const isPastDate = isPast(date) && !isToday(date);

        return (
          <div key={dateKey}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className={cn(
                "h-4 w-4",
                isPastDate ? "text-muted-foreground" : "text-amber-500"
              )} />
              <h3 className={cn(
                "font-semibold",
                isPastDate && "text-muted-foreground"
              )}>
                {dateLabel}
              </h3>
              <Badge variant="outline" className="text-xs">
                {dateMeetings.length} פגישות
              </Badge>
            </div>

            <div className="space-y-3 mr-6">
              {dateMeetings.map(meeting => {
                const typeInfo = meetingTypes.find(t => t.value === meeting.meeting_type) || meetingTypes[0];
                const TypeIcon = typeInfo.icon;
                const statusClass = statusColors[meeting.status] || statusColors.scheduled;

                return (
                  <Card 
                    key={meeting.id}
                    className={cn(
                      "group hover:shadow-md transition-all border-r-4 border-r-amber-500",
                      isPastDate && "opacity-60"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4 flex-row-reverse">
                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => onEdit(meeting)} className="h-8 w-8">
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(meeting.id)} className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <TypeIcon className="h-4 w-4 text-amber-500" />
                            <h4 className="font-medium">{meeting.title}</h4>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground justify-end mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(meeting.start_time), 'HH:mm', { locale: he })} - 
                              {format(parseISO(meeting.end_time), 'HH:mm', { locale: he })}
                            </span>
                            {meeting.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {meeting.location}
                              </span>
                            )}
                          </div>

                          {meeting.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {meeting.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 justify-end flex-wrap">
                            <Badge className={cn("text-xs", statusClass)}>
                              {meeting.status === 'completed' ? 'הסתיימה' : 
                               meeting.status === 'cancelled' ? 'בוטלה' : 'מתוכננת'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <TypeIcon className="h-3 w-3 ml-1" />
                              {typeInfo.label}
                            </Badge>
                            {meeting.client?.name && (
                              <Badge variant="secondary" className="text-xs">
                                <User className="h-3 w-3 ml-1" />
                                {meeting.client.name}
                              </Badge>
                            )}
                            {meeting.project?.name && (
                              <Badge variant="secondary" className="text-xs">
                                <Briefcase className="h-3 w-3 ml-1" />
                                {meeting.project.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
