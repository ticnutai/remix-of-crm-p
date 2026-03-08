// Preview and match contacts with existing clients
import React from 'react';
import { ParsedContact } from './types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Phone, Building2, Link2, AlertCircle } from 'lucide-react';

interface ContactsPreviewProps {
  contacts: ParsedContact[];
  onToggleSelect: (id: string) => void;
  onActionChange: (id: string, action: 'import' | 'update' | 'skip') => void;
  onSelectAll: (selected: boolean) => void;
}

export function ContactsPreview({
  contacts,
  onToggleSelect,
  onActionChange,
  onSelectAll,
}: ContactsPreviewProps) {
  const selectedCount = contacts.filter(c => c.selected).length;
  const matchedCount = contacts.filter(c => c.matchType && c.matchType !== 'none').length;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  };

  const getMatchBadge = (contact: ParsedContact) => {
    if (!contact.matchType || contact.matchType === 'none') return null;

    const matchLabels = {
      name: 'התאמת שם',
      email: 'התאמת אימייל',
      phone: 'התאמת טלפון',
    };

    return (
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1">
        <Link2 className="h-3 w-3" />
        {matchLabels[contact.matchType]}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedCount === contacts.length}
            onCheckedChange={(checked) => onSelectAll(!!checked)}
          />
          <span className="text-sm font-medium">בחר הכל</span>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="secondary">
            {selectedCount} / {contacts.length} נבחרו
          </Badge>
          {matchedCount > 0 && (
            <Badge variant="outline" className="bg-warning/10 text-warning">
              {matchedCount} התאמות
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="h-[350px] border rounded-lg">
        <div className="p-2 space-y-2">
          {contacts.map(contact => (
            <div
              key={contact.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                contact.selected 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/30 border-transparent'
              }`}
            >
              <Checkbox
                checked={contact.selected}
                onCheckedChange={() => onToggleSelect(contact.id)}
                className="mt-1"
              />

              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(contact.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{contact.name}</span>
                  {getMatchBadge(contact)}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </span>
                  )}
                  {contact.company && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {contact.company}
                    </span>
                  )}
                </div>

                {contact.matchedClientName && (
                  <div className="text-xs text-warning flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    קיים במערכת: {contact.matchedClientName}
                  </div>
                )}
              </div>

              <div className="shrink-0">
                <Select
                  value={contact.action}
                  onValueChange={(v) => onActionChange(contact.id, v as 'import' | 'update' | 'skip')}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="import">ייבא</SelectItem>
                    {contact.matchedClientId && (
                      <SelectItem value="update">עדכן</SelectItem>
                    )}
                    <SelectItem value="skip">דלג</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
