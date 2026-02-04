import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Upload, X, FileText, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface AttachmentManagerProps {
  contractId: string;
  attachments?: string[];
  onAddAttachment: (contractId: string, attachmentUrl: string) => void;
  onRemoveAttachment: (contractId: string, attachmentIndex: number) => void;
}

export function AttachmentManager({
  contractId,
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
}: AttachmentManagerProps) {
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleAddAttachment = () => {
    if (!newAttachmentUrl.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת URL של הקובץ",
        variant: "destructive",
      });
      return;
    }

    onAddAttachment(contractId, newAttachmentUrl);
    setNewAttachmentUrl("");
    setIsAdding(false);
    toast({
      title: "הקובץ צורף בהצלחה",
      description: "הקובץ נוסף לרשימת הקבצים המצורפים",
    });
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split("/").pop() || "קובץ מצורף";
    } catch {
      return "קובץ מצורף";
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real implementation, this would upload to storage
    // For now, we'll create a fake URL
    const fakeUrl = `https://storage.example.com/${contractId}/${file.name}`;
    onAddAttachment(contractId, fakeUrl);
    
    toast({
      title: "הקובץ הועלה",
      description: `${file.name} צורף לחוזה`,
    });
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-indigo-900">קבצים מצורפים</h3>
          </div>
          <Badge
            variant="outline"
            className="bg-indigo-100 text-indigo-800 border-indigo-400"
          >
            {attachments.length} קבצים
          </Badge>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <input
            type="file"
            id={`file-upload-${contractId}`}
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full border-2 border-dashed border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50"
            onClick={() => document.getElementById(`file-upload-${contractId}`)?.click()}
          >
            <Upload className="ml-2 h-4 w-4" />
            העלה קובץ
          </Button>
        </div>

        {/* Add URL manually */}
        {isAdding ? (
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/file.pdf"
              value={newAttachmentUrl}
              onChange={(e) => setNewAttachmentUrl(e.target.value)}
              className="text-left"
              dir="ltr"
            />
            <Button size="sm" onClick={handleAddAttachment}>
              הוסף
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewAttachmentUrl("");
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-indigo-600"
            onClick={() => setIsAdding(true)}
          >
            + הוסף קישור לקובץ
          </Button>
        )}

        {/* Attachments List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {attachments.map((attachment, index) => (
            <Card
              key={index}
              className="p-3 bg-white border-indigo-200 hover:border-indigo-400 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="text-sm truncate" title={attachment}>
                    {getFileNameFromUrl(attachment)}
                  </span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => window.open(attachment, "_blank")}
                    title="צפה בקובץ"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = attachment;
                      link.download = getFileNameFromUrl(attachment);
                      link.click();
                    }}
                    title="הורד קובץ"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    onClick={() => onRemoveAttachment(contractId, index)}
                    title="הסר קובץ"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {attachments.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">אין קבצים מצורפים</p>
          </div>
        )}
      </div>
    </Card>
  );
}
