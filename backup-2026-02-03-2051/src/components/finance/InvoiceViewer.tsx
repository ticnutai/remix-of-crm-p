import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  ExternalLink, 
  Loader2, 
  FileText,
  Cloud,
  RefreshCw,
  CloudUpload,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name?: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date?: string | null;
  description?: string | null;
  green_invoice_id?: string | null;
  paid_amount?: number;
  pdf_storage_url?: string | null;
}

interface InvoiceViewerProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated?: () => void;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  invoice,
  open,
  onOpenChange,
  onInvoiceUpdated,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && invoice) {
      loadInvoiceDocument();
    } else {
      setDocumentUrl(null);
      setError(null);
    }
  }, [open, invoice?.id, invoice?.pdf_storage_url]);

  const loadInvoiceDocument = async () => {
    if (!invoice) return;

    setIsLoading(true);
    setError(null);

    try {
      // Priority 1: Use stored PDF from our cloud
      if (invoice.pdf_storage_url) {
        console.log('Using stored PDF from cloud:', invoice.pdf_storage_url);
        setDocumentUrl(invoice.pdf_storage_url);
        setIsLoading(false);
        return;
      }

      // Priority 2: If no stored PDF but has green_invoice_id, try to download and store
      if (invoice.green_invoice_id) {
        console.log('No stored PDF, fetching from Green Invoice...');
        await downloadAndStorePdf();
      } else {
        setError('חשבונית זו לא מקושרת לחשבונית ירוקה');
      }
    } catch (err: any) {
      console.error('Error loading invoice document:', err);
      setError(err.message || 'שגיאה בטעינת החשבונית');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAndStorePdf = async () => {
    if (!invoice?.green_invoice_id) {
      setError('חשבונית זו לא מקושרת לחשבונית ירוקה');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('green-invoice', {
        body: {
          action: 'download_and_store_pdf',
          documentId: invoice.green_invoice_id,
          localInvoiceId: invoice.id,
        },
      });

      if (fetchError) throw fetchError;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to download PDF');
      }

      const storageUrl = data.data?.storageUrl;
      if (storageUrl) {
        setDocumentUrl(storageUrl);
        toast({
          title: 'הצלחה',
          description: 'החשבונית נשמרה בענן בהצלחה',
        });
        onInvoiceUpdated?.();
      }
    } catch (err: any) {
      console.error('Error downloading and storing PDF:', err);
      setError(err.message || 'שגיאה בהורדת החשבונית');
      toast({
        title: 'שגיאה',
        description: err.message || 'לא ניתן להוריד את החשבונית',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenExternal = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (documentUrl) {
      const a = document.createElement('a');
      a.href = documentUrl;
      a.download = `invoice-${invoice?.invoice_number || 'document'}.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₪${Math.round(amount).toLocaleString('he-IL')}`;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'טיוטה',
      sent: 'נשלח',
      paid: 'שולם',
      overdue: 'באיחור',
      cancelled: 'בוטל',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" dir="rtl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              צפייה בחשבונית {invoice?.invoice_number}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!invoice?.pdf_storage_url && invoice?.green_invoice_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAndStorePdf}
                  disabled={isUploading || isLoading}
                >
                  <CloudUpload className={`h-4 w-4 ml-2 ${isUploading ? 'animate-pulse' : ''}`} />
                  {isUploading ? 'מעלה...' : 'העלה לענן'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadInvoiceDocument}
                disabled={isLoading || isUploading}
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                רענן
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                disabled={!documentUrl}
              >
                <ExternalLink className="h-4 w-4 ml-2" />
                פתח בחלון חדש
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                disabled={!documentUrl}
              >
                <Download className="h-4 w-4 ml-2" />
                הורד
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* Invoice Summary Card */}
          {invoice && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">לקוח</p>
                  <p className="font-medium">{invoice.client_name || 'לא צוין'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">סכום</p>
                  <p className="font-bold text-lg">{formatCurrency(invoice.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">תאריך הנפקה</p>
                  <p className="font-medium">
                    {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: he })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">סטטוס</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              </div>
              {invoice.description && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">תיאור</p>
                  <p className="text-sm">{invoice.description}</p>
                </div>
              )}
              {/* Storage status indicator */}
              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                <Cloud className={`h-4 w-4 ${invoice.pdf_storage_url ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${invoice.pdf_storage_url ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {invoice.pdf_storage_url ? 'שמור בענן' : 'לא שמור בענן'}
                </span>
              </div>
            </div>
          )}

          {/* Document Viewer */}
          <div className="border rounded-lg overflow-hidden bg-background min-h-[400px]">
            {(isLoading || isUploading) && (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">
                  {isUploading ? 'מוריד ומעלה לענן...' : 'טוען חשבונית...'}
                </p>
              </div>
            )}

            {error && !isLoading && !isUploading && (
              <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-destructive font-medium mb-2">{error}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {!invoice?.green_invoice_id 
                    ? 'חשבונית זו לא מקושרת לחשבונית ירוקה'
                    : 'נסה לרענן או להעלות לענן'}
                </p>
                {invoice?.green_invoice_id && (
                  <Button variant="outline" onClick={downloadAndStorePdf} disabled={isUploading}>
                    <CloudUpload className="h-4 w-4 ml-2" />
                    הורד והעלה לענן
                  </Button>
                )}
              </div>
            )}

            {documentUrl && !isLoading && !isUploading && !error && (
              <div className="h-[500px]">
                <iframe
                  src={documentUrl}
                  className="w-full h-full border-0"
                  title={`חשבונית ${invoice?.invoice_number}`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            )}
          </div>

          {invoice?.pdf_storage_url && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              <Cloud className="h-3 w-3 inline ml-1 text-green-600" />
              שמור בענן • קישור קבוע
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
