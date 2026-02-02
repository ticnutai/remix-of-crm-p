/**
 * File Sharing Dialog - שיתוף קבצים
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Share2,
  Link2,
  Copy,
  Check,
  Mail,
  User,
  Shield,
  Clock,
  X,
} from 'lucide-react';
import type { FileMetadata } from '@/hooks/useAdvancedFiles';
import { useToast } from '@/hooks/use-toast';

interface FileSharingDialogProps {
  file: FileMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: (shareWith: string[], permissions: 'view' | 'edit') => Promise<void>;
  onCreateLink: (expiresIn?: number) => Promise<string>;
}

export function FileSharingDialog({
  file,
  isOpen,
  onClose,
  onShare,
  onCreateLink,
}: FileSharingDialogProps) {
  const [email, setEmail] = useState('');
  const [shareList, setShareList] = useState<Array<{ email: string; permission: 'view' | 'edit' }>>([]);
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [publicLink, setPublicLink] = useState('');
  const [linkExpiry, setLinkExpiry] = useState<number>(3600); // 1 hour default
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!file) return null;

  const addToShareList = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין כתובת דוא"ל תקינה',
        variant: 'destructive',
      });
      return;
    }

    if (shareList.find(s => s.email === email)) {
      toast({
        title: 'שגיאה',
        description: 'המשתמש כבר ברשימה',
        variant: 'destructive',
      });
      return;
    }

    setShareList([...shareList, { email, permission }]);
    setEmail('');
  };

  const removeFromShareList = (email: string) => {
    setShareList(shareList.filter(s => s.email !== email));
  };

  const handleShare = async () => {
    if (shareList.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'נא להוסיף לפחות משתמש אחד',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await onShare(
        shareList.map(s => s.email),
        permission
      );
      toast({
        title: 'הצלחה',
        description: `הקובץ שותף עם ${shareList.length} משתמשים`,
      });
      setShareList([]);
      onClose();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שיתוף הקובץ נכשל',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePublicLink = async () => {
    setIsLoading(true);
    try {
      const link = await onCreateLink(enableExpiry ? linkExpiry : undefined);
      setPublicLink(link);
      toast({
        title: 'הצלחה',
        description: 'קישור נוצר בהצלחה',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'יצירת קישור נכשלה',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      toast({
        title: 'הצלחה',
        description: 'הקישור הועתק ללוח',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'העתקה נכשלה',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            שיתוף קובץ: {file.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share with Specific Users */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold">שתף עם משתמשים</h3>
            </div>

            <div className="flex gap-2">
              <Input
                type="email"
                placeholder='הזן כתובת דוא"ל'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToShareList()}
                className="flex-1"
              />
              <Select
                value={permission}
                onValueChange={(value: 'view' | 'edit') => setPermission(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">צפייה</SelectItem>
                  <SelectItem value="edit">עריכה</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addToShareList}>הוסף</Button>
            </div>

            {/* Share List */}
            {shareList.length > 0 && (
              <div className="space-y-2">
                {shareList.map(({ email, permission }) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{email}</p>
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 ml-1" />
                          {permission === 'view' ? 'צפייה' : 'עריכה'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromShareList(email)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">או</span>
            </div>
          </div>

          {/* Public Link */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold">קישור ציבורי</h3>
            </div>

            {/* Expiry Settings */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Label>תוקף מוגבל</Label>
                </div>
                <Switch
                  checked={enableExpiry}
                  onCheckedChange={setEnableExpiry}
                />
              </div>

              {enableExpiry && (
                <Select
                  value={linkExpiry.toString()}
                  onValueChange={(value) => setLinkExpiry(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3600">שעה אחת</SelectItem>
                    <SelectItem value="86400">יום אחד</SelectItem>
                    <SelectItem value="604800">שבוע</SelectItem>
                    <SelectItem value="2592000">חודש</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Generate Link */}
            {!publicLink ? (
              <Button
                onClick={handleCreatePublicLink}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                <Link2 className="h-4 w-4 ml-2" />
                צור קישור
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={publicLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  {enableExpiry
                    ? `הקישור יפוג בעוד ${linkExpiry === 3600 ? 'שעה' : linkExpiry === 86400 ? 'יום' : linkExpiry === 604800 ? 'שבוע' : 'חודש'}`
                    : 'הקישור תקף ללא הגבלת זמן'}
                </p>
              </div>
            )}
          </div>

          {/* Current Shares */}
          {file.sharedWith.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">
                שותף עם ({file.sharedWith.length})
              </h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {file.sharedWith.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"
                  >
                    <Mail className="h-3 w-3 text-gray-500" />
                    {email}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          {shareList.length > 0 && (
            <Button onClick={handleShare} disabled={isLoading}>
              שתף ({shareList.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
