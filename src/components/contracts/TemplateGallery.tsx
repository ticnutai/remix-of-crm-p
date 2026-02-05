// גלריית תבניות חוזים - תצוגה ועריכה של תבניות HTML
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Eye,
  Pencil,
  Copy,
  Download,
  Search,
  FileText,
  Palette,
  Sparkles,
  Grid3x3,
  List,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AdvancedContractEditor } from './AdvancedContractEditor';
import { ContractDocument } from './AdvancedContractEditor/types';

interface TemplateFile {
  id: string;
  name: string;
  fileName: string;
  description: string;
  category: string;
  price: string;
  thumbnail?: string;
}

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateGallery({ open, onOpenChange }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<TemplateFile[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [editorDocument, setEditorDocument] = useState<ContractDocument | null>(null);

  // טעינת רשימת התבניות
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = () => {
    // תבניות שצירפת
    const templatesList: TemplateFile[] = [
      {
        id: '1',
        name: 'הצעת מחיר לתוספת בניה',
        fileName: 'הצעת-מחיר-לתוספת-בניה-1.html',
        description: 'הוצאת היתר בניה לתוספת בניה למבנה מגורים קיים - גוש 6273',
        category: 'תוספת בניה',
        price: '₪35,000',
      },
      {
        id: '2',
        name: 'הצעת מחיר להרחבה צפונית',
        fileName: 'הצעת-מחיר-להרחבה-צפונית-2.html',
        description: 'הוצאת היתר בניה ליחידת דיור אחת במגרש בהרחבה הצפונית - גוש 7311',
        category: 'הרחבה',
        price: '₪37,000',
      },
      {
        id: '3',
        name: 'הצעת מחיר לרישוי בלבד',
        fileName: 'הצעת-מחיר-לרישוי-בלבד-3.html',
        description: 'הוצאת היתר בניה עם קבלת תוכנית וגרמושקא מאדריכל מתכנן - גוש 7188',
        category: 'רישוי',
        price: '₪30,000',
      },
    ];
    setTemplates(templatesList);
  };

  // קריאת תוכן התבנית
  const loadTemplateContent = async (fileName: string): Promise<string> => {
    try {
      const response = await fetch(`/quotes/${fileName}`);
      if (!response.ok) {
        throw new Error('Failed to load template');
      }
      const content = await response.text();
      return content;
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את התבנית',
        variant: 'destructive',
      });
      return '';
    }
  };

  // המרת HTML לפורמט העורך
  const convertHtmlToDocument = (html: string, template: TemplateFile): ContractDocument => {
    // פישוט - נחלץ את התוכן הראשי מה-HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const blocks = [];
    
    // כותרת
    const headerEl = doc.querySelector('.header');
    if (headerEl) {
      blocks.push({
        id: 'header-1',
        type: 'header' as const,
        title: 'כותרת',
        content: {
          title: headerEl.querySelector('h1')?.textContent || template.name,
          subtitle: headerEl.querySelector('.subtitle')?.textContent || '',
          contractNumber: '',
          date: new Date().toISOString(),
        },
        visible: true,
        order: 0,
      });
    }

    // סעיפים
    const sections = doc.querySelectorAll('.section');
    sections.forEach((section, index) => {
      const title = section.querySelector('.section-title')?.textContent || `סעיף ${index + 1}`;
      const items = section.querySelectorAll('.item');
      const itemsContent = Array.from(items).map(item => ({
        text: item.querySelector('.text')?.textContent || '',
        checked: true,
      }));

      blocks.push({
        id: `section-${index + 1}`,
        type: 'section' as const,
        title,
        content: {
          title,
          items: itemsContent,
        },
        visible: true,
        order: index + 1,
      });
    });

    return {
      id: template.id,
      title: template.name,
      blocks,
      colorScheme: 'gold',
      designTemplate: 'classic',
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0',
      },
    };
  };

  // פתיחת תצוגה מקדימה
  const handlePreview = async (template: TemplateFile) => {
    setSelectedTemplate(template);
    const content = await loadTemplateContent(template.fileName);
    setTemplateContent(content);
    setPreviewOpen(true);
  };

  // פתיחת עורך
  const handleEdit = async (template: TemplateFile) => {
    setSelectedTemplate(template);
    const content = await loadTemplateContent(template.fileName);
    const document = convertHtmlToDocument(content, template);
    setEditorDocument(document);
    setEditorOpen(true);
  };

  // שמירת עריכה
  const handleSaveEdit = (document: ContractDocument) => {
    toast({
      title: 'נשמר בהצלחה',
      description: 'התבנית עודכנה',
    });
    setEditorOpen(false);
  };

  // העתקת תבנית
  const handleDuplicate = async (template: TemplateFile) => {
    const content = await loadTemplateContent(template.fileName);
    // כאן תוכל להוסיף לוגיקה לשמירת העותק
    toast({
      title: 'הועתק',
      description: `נוצר עותק של "${template.name}"`,
    });
  };

  // הורדת תבנית
  const handleDownload = async (template: TemplateFile) => {
    const content = await loadTemplateContent(template.fileName);
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.fileName;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'הורד בהצלחה',
      description: `התבנית "${template.name}" הורדה`,
    });
  };

  // סינון תבניות
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[85vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">גלריית תבניות מתקדמות</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {templates.length} תבניות זמינות לעריכה וניהול
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 border-b space-y-4">
            {/* חיפוש ותצוגה */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש תבניות..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 px-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{template.name}</CardTitle>
                          <CardDescription className="mt-2 line-clamp-2">
                            {template.description}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{template.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">{template.price}</span>
                          <Badge variant="outline" className="text-xs">
                            + מע״מ
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            תצוגה
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(template)}
                          >
                            <Pencil className="h-4 w-4 ml-2" />
                            עריכה
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDuplicate(template)}
                          >
                            <Copy className="h-4 w-4 ml-2" />
                            שכפל
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownload(template)}
                          >
                            <Download className="h-4 w-4 ml-2" />
                            הורד
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3 py-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{template.name}</h3>
                            <Badge variant="secondary" className="flex-shrink-0">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-lg font-bold text-primary">{template.price}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            תצוגה
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Pencil className="h-4 w-4 ml-2" />
                            עריכה
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* תצוגה מקדימה */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl h-[85vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div
              className="bg-white"
              dangerouslySetInnerHTML={{ __html: templateContent }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* עורך מתקדם */}
      {editorDocument && editorOpen && (
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="max-w-[95vw] h-[95vh] p-0">
            <AdvancedContractEditor
              initialDocument={editorDocument}
              onSave={handleSaveEdit}
              onClose={() => setEditorOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default TemplateGallery;
