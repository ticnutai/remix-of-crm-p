// Component for displaying and managing multiple Google Calendar accounts
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Trash2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
  Clock,
} from 'lucide-react';
import { GoogleCalendarAccount, SyncDirection } from '@/hooks/useGoogleCalendarAccounts';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface GoogleCalendarAccountsListProps {
  accounts: GoogleCalendarAccount[];
  onUpdate: (accountId: string, updates: Partial<Pick<GoogleCalendarAccount, 'sync_direction' | 'calendar_id' | 'is_active'>>) => Promise<boolean>;
  onRemove: (accountId: string) => Promise<boolean>;
  onSync?: (account: GoogleCalendarAccount) => Promise<void>;
  isSyncing?: boolean;
}

const syncDirectionLabels: Record<SyncDirection, { label: string; icon: typeof ArrowUpRight; description: string }> = {
  to_google: { 
    label: 'למערכת ← Google', 
    icon: ArrowUpRight,
    description: 'העלאת פגישות מה-CRM ל-Google'
  },
  from_google: { 
    label: 'Google ← למערכת', 
    icon: ArrowDownLeft,
    description: 'ייבוא אירועים מ-Google ל-CRM'
  },
  both: { 
    label: 'דו-כיווני', 
    icon: ArrowLeftRight,
    description: 'סנכרון בשני הכיוונים'
  },
};

export function GoogleCalendarAccountsList({
  accounts,
  onUpdate,
  onRemove,
  onSync,
  isSyncing = false,
}: GoogleCalendarAccountsListProps) {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>אין חשבונות Google מחוברים</p>
        <p className="text-sm mt-1">לחץ על "הוסף חשבון" כדי להתחיל</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => {
        const syncInfo = syncDirectionLabels[account.sync_direction];
        const SyncIcon = syncInfo.icon;

        return (
          <Card key={account.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                      <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{account.display_name || account.email}</div>
                      <div className="text-sm text-muted-foreground">{account.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={account.is_active ? 'default' : 'secondary'}>
                      {account.is_active ? 'פעיל' : 'מושבת'}
                    </Badge>
                  </div>
                </div>

                {/* Sync Direction */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <SyncIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">כיוון סנכרון:</span>
                  </div>
                  <Select
                    value={account.sync_direction}
                    onValueChange={(value: SyncDirection) => onUpdate(account.id, { sync_direction: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to_google">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4" />
                          <span>ל-Google בלבד</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="from_google">
                        <div className="flex items-center gap-2">
                          <ArrowDownLeft className="h-4 w-4" />
                          <span>מ-Google בלבד</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="both">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="h-4 w-4" />
                          <span>דו-כיווני</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Last Sync & Active Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {account.last_sync_at ? (
                      <span>
                        סנכרון אחרון: {formatDistanceToNow(new Date(account.last_sync_at), { 
                          addSuffix: true, 
                          locale: he 
                        })}
                      </span>
                    ) : (
                      <span>לא סונכרן עדיין</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${account.id}`} className="text-sm">
                      פעיל
                    </Label>
                    <Switch
                      id={`active-${account.id}`}
                      checked={account.is_active}
                      onCheckedChange={(checked) => onUpdate(account.id, { is_active: checked })}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {onSync && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSync(account)}
                      disabled={isSyncing || !account.is_active}
                    >
                      <RefreshCw className={`h-4 w-4 ml-2 ${isSyncing ? 'animate-spin' : ''}`} />
                      סנכרן עכשיו
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(account.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    הסר חשבון
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
