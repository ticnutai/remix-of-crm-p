import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Check, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Signature {
  id: string;
  name: string;
  html_content: string;
  text_content: string | null;
  is_default: boolean;
  is_company_wide: boolean;
  created_at: string;
}

export function EmailSignatureManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    html_content: '',
    text_content: '',
    is_default: false,
  });

  useEffect(() => {
    fetchSignatures();
  }, [user]);

  const fetchSignatures = async () => {
    try {
      const { data, error } = await supabase
        .from('email_signatures')
        .select('*')
        .or(`user_id.eq.${user?.id},is_company_wide.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSignatures(data || []);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לטעון את החתימות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.html_content) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    try {
      const signatureData = {
        name: form.name,
        html_content: form.html_content,
        text_content: form.text_content || null,
        is_default: form.is_default,
        user_id: user?.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from('email_signatures')
          .update(signatureData)
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: 'הצלחה', description: 'החתימה עודכנה בהצלחה' });
      } else {
        const { error } = await supabase
          .from('email_signatures')
          .insert(signatureData);

        if (error) throw error;
        toast({ title: 'הצלחה', description: 'החתימה נוצרה בהצלחה' });
      }

      resetForm();
      setOpen(false);
      fetchSignatures();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (signature: Signature) => {
    setEditingId(signature.id);
    setForm({
      name: signature.name,
      html_content: signature.html_content,
      text_content: signature.text_content || '',
      is_default: signature.is_default,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק חתימה זו?')) return;

    try {
      const { error } = await supabase
        .from('email_signatures')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'הצלחה', description: 'החתימה נמחקה בהצלחה' });
      fetchSignatures();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      html_content: '',
      text_content: '',
      is_default: false,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">חתימות אימייל</h3>
          <p className="text-sm text-muted-foreground">
            נהל חתימות אוטומטיות לאימיילים שלך
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              חתימה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'ערוך חתימה' : 'חתימה חדשה'}</DialogTitle>
              <DialogDescription>
                צור חתימה אישית שתתווסף אוטומטית לאימיילים שלך
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>שם החתימה</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="החתימה שלי"
                />
              </div>

              <div>
                <Label>תוכן HTML</Label>
                <Textarea
                  value={form.html_content}
                  onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                  placeholder="<p><strong>שמך</strong></p><p>תפקיד • חברה</p>"
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>

              <div>
                <Label>תוכן טקסט רגיל (אופציונלי)</Label>
                <Textarea
                  value={form.text_content}
                  onChange={(e) => setForm({ ...form, text_content: e.target.value })}
                  placeholder="שמך\nתפקיד • חברה"
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_default"
                  checked={form.is_default}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, is_default: !!checked })
                  }
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  הגדר כחתימת ברירת מחדל
                </Label>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm font-medium mb-2">תצוגה מקדימה:</p>
                <div dangerouslySetInnerHTML={{ __html: form.html_content }} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={handleSave}>שמור</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div>טוען...</div>
        ) : signatures.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="py-8 text-center text-muted-foreground">
              אין חתימות עדיין. צור את החתימה הראשונה שלך!
            </CardContent>
          </Card>
        ) : (
          signatures.map((signature) => (
            <Card key={signature.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {signature.name}
                      {signature.is_default && (
                        <Badge variant="secondary">
                          <Star className="h-3 w-3 ml-1" />
                          ברירת מחדל
                        </Badge>
                      )}
                    </CardTitle>
                    {signature.is_company_wide && (
                      <Badge variant="outline" className="mt-1">
                        חתימת החברה
                      </Badge>
                    )}
                  </div>
                  {!signature.is_company_wide && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(signature)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(signature.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32 border rounded-lg p-3 bg-muted/30">
                  <div dangerouslySetInnerHTML={{ __html: signature.html_content }} />
                </ScrollArea>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
