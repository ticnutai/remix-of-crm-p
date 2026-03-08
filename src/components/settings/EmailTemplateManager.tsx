import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, Code, Save, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmailPreviewModal } from '@/components/email/EmailPreviewModal';

interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  html_content: string;
  text_content: string | null;
  variables: string[];
  is_default: boolean;
  category: string;
  created_at: string;
}

export function EmailTemplateManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'html' | 'code'>('html');
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    subject: '',
    html_content: '',
    text_content: '',
    category: 'general',
    variables: [] as string[],
    newVariable: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse variables from JSONB to string array
      const parsedTemplates = (data || []).map((t: any) => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables : [],
      }));
      
      setTemplates(parsedTemplates);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לטעון את התבניות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.html_content) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    try {
      const templateData = {
        name: form.name,
        description: form.description || null,
        subject: form.subject,
        html_content: form.html_content,
        text_content: form.text_content || null,
        category: form.category,
        variables: form.variables,
        created_by: user?.id,
      };

      if (selectedTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);

        if (error) throw error;

        toast({
          title: 'הצלחה',
          description: 'התבנית עודכנה בהצלחה',
        });
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert(templateData);

        if (error) throw error;

        toast({
          title: 'הצלחה',
          description: 'התבנית נוצרה בהצלחה',
        });
      }

      setIsEditing(false);
      setSelectedTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תבנית זו?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'התבנית נמחקה בהצלחה',
      });

      fetchTemplates();
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
      description: '',
      subject: '',
      html_content: '',
      text_content: '',
      category: 'general',
      variables: [],
      newVariable: '',
    });
  };

  const loadTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setForm({
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      category: template.category,
      variables: template.variables,
      newVariable: '',
    });
    setIsEditing(true);
  };

  const addVariable = () => {
    if (form.newVariable && !form.variables.includes(form.newVariable)) {
      setForm({
        ...form,
        variables: [...form.variables, form.newVariable],
        newVariable: '',
      });
    }
  };

  const removeVariable = (variable: string) => {
    setForm({
      ...form,
      variables: form.variables.filter(v => v !== variable),
    });
  };

  const getPreviewHtml = () => {
    let html = form.html_content;
    form.variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      html = html.replace(regex, `<span style="background: #fef3c7; padding: 2px 4px; border-radius: 3px;">[${variable}]</span>`);
    });
    return html;
  };

  const handleSendTestEmail = async (testEmail: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-reminder-email', {
        body: {
          to: testEmail,
          subject: form.subject,
          html: form.html_content,
          variables: form.variables.reduce((acc, variable) => {
            acc[variable] = `[${variable}]`;
            return acc;
          }, {} as Record<string, string>),
        },
      });

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'אימייל בדיקה נשלח בהצלחה',
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען תבניות...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול תבניות אימייל</h2>
        <Button onClick={() => { resetForm(); setIsEditing(true); setSelectedTemplate(null); }}>
          <Plus className="h-4 w-4 ml-2" />
          תבנית חדשה
        </Button>
      </div>

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTemplate ? 'עריכת תבנית' : 'תבנית חדשה'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם התבנית *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="תזכורת בסיסית"
                />
              </div>
              <div>
                <Label>קטגוריה</Label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">כללי</SelectItem>
                    <SelectItem value="reminder">תזכורת</SelectItem>
                    <SelectItem value="notification">הודעה</SelectItem>
                    <SelectItem value="marketing">שיווק</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>תיאור</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="תיאור קצר של התבנית"
              />
            </div>

            <div>
              <Label>נושא האימייל *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="⏰ תזכורת: {{title}}"
              />
            </div>

            <div>
              <Label>משתנים</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={form.newVariable}
                  onChange={(e) => setForm({ ...form, newVariable: e.target.value })}
                  placeholder="שם משתנה (לדוגמה: userName)"
                  onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                />
                <Button onClick={addVariable} type="button">הוסף</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.variables.map(variable => (
                  <Badge key={variable} variant="secondary" className="cursor-pointer" onClick={() => removeVariable(variable)}>
                    {variable} ×
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                השתמש במשתנים כך: {'{{variableName}}'}
              </p>
            </div>

            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'html' | 'code')}>
              <TabsList>
                <TabsTrigger value="code">
                  <Code className="h-4 w-4 ml-2" />
                  קוד HTML
                </TabsTrigger>
                <TabsTrigger value="html">
                  <Eye className="h-4 w-4 ml-2" />
                  תצוגה מקדימה
                </TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-4">
                <div>
                  <Label>תוכן HTML *</Label>
                  <Textarea
                    value={form.html_content}
                    onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                    placeholder="<!DOCTYPE html>..."
                    className="font-mono text-sm min-h-[400px]"
                  />
                </div>

                <div>
                  <Label>תוכן טקסט רגיל</Label>
                  <Textarea
                    value={form.text_content}
                    onChange={(e) => setForm({ ...form, text_content: e.target.value })}
                    placeholder="גרסת טקסט פשוטה של האימייל"
                    className="min-h-[150px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="html">
                <ScrollArea className="h-[500px] border rounded-md p-4 bg-white">
                  <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setIsEditing(false); setSelectedTemplate(null); }}>
                ביטול
              </Button>
              <Button variant="secondary" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 ml-2" />
                תצוגה מקדימה
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 ml-2" />
                שמור תבנית
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <EmailPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        htmlContent={form.html_content}
        subject={form.subject}
        variables={form.variables.reduce((acc, variable) => {
          acc[variable] = `[${variable}]`;
          return acc;
        }, {} as Record<string, string>)}
        onSendTest={handleSendTestEmail}
      />

      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    )}
                  </div>
                  {template.is_default && (
                    <Badge variant="secondary">ברירת מחדל</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">קטגוריה: </span>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">משתנים: </span>
                    {template.variables.length > 0 ? template.variables.join(', ') : 'אין'}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => loadTemplate(template)}>
                      <Eye className="h-4 w-4 ml-2" />
                      ערוך
                    </Button>
                    {!template.is_default && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
