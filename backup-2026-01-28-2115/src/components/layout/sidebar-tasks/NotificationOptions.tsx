// NotificationOptions - Component for sending task/meeting notifications
import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Phone, Send, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Sidebar colors
const sidebarColors = {
  navy: '#162C58',
  gold: '#d8ac27',
  goldLight: '#e8c85a',
  goldDark: '#b8941f',
  navyLight: '#1E3A6E',
  navyDark: '#0F1F3D',
};

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}

interface NotificationOptionsProps {
  type: 'task' | 'meeting';
  clients: Client[];
  selectedClientId?: string;
  onClientChange?: (clientId: string) => void;
  details: {
    title: string;
    description?: string | null;
    date?: string;
    time?: string;
    location?: string | null;
    priority?: string;
  };
  disabled?: boolean;
}

type NotificationChannel = 'email' | 'sms' | 'whatsapp';

interface ChannelOption {
  id: NotificationChannel;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const channels: ChannelOption[] = [
  { id: 'email', label: 'אימייל', icon: Mail, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { id: 'sms', label: 'SMS', icon: Phone, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { id: 'whatsapp', label: 'וואטסאפ', icon: MessageSquare, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
];

export function NotificationOptions({
  type,
  clients,
  selectedClientId,
  onClientChange,
  details,
  disabled = false,
}: NotificationOptionsProps) {
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<{ channel: string; success: boolean }[]>([]);
  
  const selectedClient = clients.find(c => c.id === selectedClientId);
  
  // Check which channels are available for the selected client
  const availableChannels = {
    email: !!selectedClient?.email,
    sms: !!selectedClient?.phone,
    whatsapp: !!(selectedClient?.whatsapp || selectedClient?.phone),
  };

  // Reset channels when client changes
  useEffect(() => {
    setSelectedChannels([]);
    setSendResults([]);
  }, [selectedClientId]);

  const toggleChannel = (channel: NotificationChannel) => {
    if (!availableChannels[channel]) return;
    
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSend = async () => {
    if (!selectedClient || selectedChannels.length === 0 || !details.title) {
      toast.error('נא לבחור לקוח וערוץ שליחה');
      return;
    }

    setIsSending(true);
    setSendResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('send-task-notification', {
        body: {
          type,
          channels: selectedChannels,
          recipient: {
            name: selectedClient.name,
            email: selectedClient.email,
            phone: selectedClient.phone,
            whatsapp: selectedClient.whatsapp,
          },
          details: {
            title: details.title,
            description: details.description,
            date: details.date,
            time: details.time,
            location: details.location,
            priority: details.priority,
          },
        },
      });

      if (error) throw error;

      // Handle results
      const results = data?.results || [];
      setSendResults(results);

      // Check for WhatsApp URL to open
      const whatsappResult = results.find((r: any) => r.channel === 'whatsapp' && r.success);
      if (whatsappResult?.error?.startsWith('https://wa.me/')) {
        window.open(whatsappResult.error, '_blank');
      }

      // Show toast based on results
      const successCount = results.filter((r: any) => r.success).length;
      if (successCount > 0) {
        toast.success(`נשלח בהצלחה ל-${successCount} ערוץ/ים`);
      }

      const failures = results.filter((r: any) => !r.success && r.channel !== 'whatsapp');
      if (failures.length > 0) {
        failures.forEach((f: any) => {
          if (f.channel === 'sms') {
            toast.info('SMS דורש הגדרת ספק SMS');
          } else {
            toast.error(`שגיאה ב-${f.channel}: ${f.error}`);
          }
        });
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error('שגיאה בשליחת ההודעה');
    } finally {
      setIsSending(false);
    }
  };

  if (clients.length === 0) return null;

  return (
    <div 
      className="space-y-3 p-3 rounded-lg border"
      style={{ 
        background: `${sidebarColors.navyLight}30`,
        borderColor: `${sidebarColors.gold}30`,
      }}
    >
      <Label 
        className="text-sm font-medium flex items-center gap-2"
        style={{ color: sidebarColors.goldLight }}
      >
        <Send className="h-4 w-4" style={{ color: sidebarColors.gold }} />
        שלח הודעה ללקוח
      </Label>

      {/* Client Selection */}
      <Select value={selectedClientId || ''} onValueChange={onClientChange}>
        <SelectTrigger 
          className="text-right"
          style={{ 
            background: `${sidebarColors.navyLight}50`,
            borderColor: `${sidebarColors.gold}40`,
            color: selectedClientId ? sidebarColors.goldLight : `${sidebarColors.goldLight}60`,
          }}
        >
          <SelectValue placeholder="בחר לקוח לשליחה" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">ללא</SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
              {client.email && ' 📧'}
              {client.phone && ' 📱'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Channel Selection */}
      {selectedClient && (
        <div className="space-y-2">
          <p 
            className="text-xs"
            style={{ color: `${sidebarColors.goldLight}80` }}
          >
            בחר ערוצי שליחה:
          </p>
          <div className="flex gap-2">
            {channels.map((channel) => {
              const Icon = channel.icon;
              const isAvailable = availableChannels[channel.id];
              const isSelected = selectedChannels.includes(channel.id);
              const result = sendResults.find(r => r.channel === channel.id);

              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => toggleChannel(channel.id)}
                  disabled={!isAvailable || disabled || isSending}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg border-2 transition-all relative",
                    isSelected ? `${channel.bgColor} border-current` : "border-transparent",
                    isAvailable ? channel.color : "text-gray-500 opacity-50 cursor-not-allowed",
                  )}
                  style={{
                    background: isSelected ? undefined : `${sidebarColors.navyLight}50`,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-medium">{channel.label}</span>
                  {!isAvailable && (
                    <span 
                      className="text-[8px] absolute -bottom-1"
                      style={{ color: `${sidebarColors.goldLight}60` }}
                    >
                      חסר
                    </span>
                  )}
                  {result && (
                    <span className="absolute -top-1 -right-1">
                      {result.success ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <X className="h-3 w-3 text-red-400" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact Info Display */}
      {selectedClient && (
        <div 
          className="text-xs space-y-1 p-2 rounded"
          style={{ 
            background: `${sidebarColors.navyDark}50`,
            color: `${sidebarColors.goldLight}80`,
          }}
        >
          {selectedClient.email && (
            <p>📧 {selectedClient.email}</p>
          )}
          {selectedClient.phone && (
            <p>📱 {selectedClient.phone}</p>
          )}
          {!selectedClient.email && !selectedClient.phone && (
            <p className="text-yellow-500">⚠️ אין פרטי קשר ללקוח זה</p>
          )}
        </div>
      )}

      {/* Send Button */}
      {selectedClient && selectedChannels.length > 0 && (
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          disabled={!details.title || isSending || disabled}
          className="w-full gap-2"
          style={{ 
            background: `${sidebarColors.gold}20`,
            color: sidebarColors.gold,
            borderColor: sidebarColors.gold,
          }}
          variant="outline"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              שולח...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              שלח הודעה ({selectedChannels.length})
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default NotificationOptions;
