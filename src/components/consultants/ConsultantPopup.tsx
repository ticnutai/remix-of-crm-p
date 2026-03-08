// Consultant Popup - Display consultant details when clicking on keyword
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Mail, 
  Building, 
  Hash,
  User,
  FileText,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Consultant } from '@/hooks/useConsultants';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ConsultantPopupProps {
  consultant: Consultant;
  onUnlink?: () => void;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function ConsultantPopup({
  consultant,
  onUnlink,
  children,
  side = 'top',
}: ConsultantPopupProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'הועתק!',
      description: `${label} הועתק ללוח`,
    });
  };

  const getProfessionColor = (profession: string) => {
    switch (profession) {
      case 'יועץ':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'מהנדס':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'אדריכל':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        side={side}
        dir="rtl"
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-lg">{consultant.name}</h4>
              <Badge 
                variant="outline" 
                className={cn("mt-1", getProfessionColor(consultant.profession))}
              >
                {consultant.profession}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {onUnlink && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={onUnlink}
                  title="הסר קישור"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            {consultant.company && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4 shrink-0" />
                <span className="truncate">{consultant.company}</span>
              </div>
            )}

            {consultant.specialty && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0" />
                <span>{consultant.specialty}</span>
              </div>
            )}

            {consultant.license_number && (
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4 shrink-0" />
                  <span>רישיון: {consultant.license_number}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(consultant.license_number!, 'מספר רישיון')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {consultant.id_number && (
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span>ת.ז: {consultant.id_number}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(consultant.id_number!, 'מספר ת.ז')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {consultant.phone && (
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span dir="ltr">{consultant.phone}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(consultant.phone!, 'טלפון')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => window.open(`tel:${consultant.phone}`, '_self')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {consultant.email && (
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 text-muted-foreground truncate">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate" dir="ltr">{consultant.email}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(consultant.email!, 'אימייל')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => window.open(`mailto:${consultant.email}`, '_self')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {consultant.notes && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                {consultant.notes}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ConsultantPopup;
