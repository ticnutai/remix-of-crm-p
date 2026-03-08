import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, ChevronLeft } from "lucide-react";
import { useContractTemplates } from "@/hooks/useContractTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TemplateData {
  title: string;
  subtitle: string;
  location: string;
  price: string;
  sections: any[];
  payments: any[];
  notes: string[];
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: TemplateData, templateId: string) => void;
}

export function TemplateSelector({ onTemplateSelect }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const { templates } = useContractTemplates();

  const handleSelectTemplate = (template: any) => {
    const templateData: TemplateData = {
      title: template.name,
      subtitle: template.description || "",
      location: "",
      price: "₪0",
      sections: [], // Will be filled from template variables if needed
      payments: template.default_payment_schedule?.map((p: any) => ({
        percentage: `${p.percentage}%`,
        description: p.description,
      })) || [],
      notes: template.default_terms_and_conditions 
        ? template.default_terms_and_conditions.split('\n').filter((n: string) => n.trim())
        : [],
    };

    onTemplateSelect(templateData, template.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="w-full bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 hover:from-purple-100 hover:to-blue-100"
        >
          <FileText className="ml-2 h-5 w-5" />
          בחר מתבנית קיימת
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">בחירת תבנית חוזה</DialogTitle>
          <DialogDescription>
            בחר תבנית מוכנה כדי להתחיל במהירות
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates?.map((template) => (
              <Card
                key={template.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-400"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 flex-shrink-0 mr-2" />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {template.category && (
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {template.variables?.length || 0} משתנים
                    </Badge>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    בחר תבנית זו
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {(!templates || templates.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">אין תבניות זמינות</p>
              <p className="text-sm">צור תבניות חדשות בעמוד ניהול התבניות</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
