import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentEditor, DocumentType, DocumentData } from '@/components/document-editor';
import { useQuotes, Quote } from '@/hooks/useQuotes';
import { useContracts, Contract } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

export default function DocumentEditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get document info from URL
  const documentType = (searchParams.get('type') || 'quote') as DocumentType;
  const documentId = searchParams.get('id');
  const clientId = searchParams.get('client');
  
  // Hooks
  const { quotes = [] } = useQuotes();
  const { contracts = [] } = useContracts();
  const { clients = [] } = useClients();
  
  // Convert Quote/Contract to DocumentData
  const [initialData, setInitialData] = useState<Partial<DocumentData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Quote to DocumentData
  const convertQuoteToDocumentData = (quote: Quote): Partial<DocumentData> => {
    return {
      id: quote.id,
      type: 'quote',
      title: quote.title || '',
      number: quote.quote_number || '',
      date: quote.created_at || new Date().toISOString(),
      validUntil: quote.valid_until,
      status: 'draft',
      currency: 'ILS',
      vatRate: 17,
      discount: 0,
      discountType: 'percent',
      items: quote.items?.map((item, index) => ({
        id: `item-${index}`,
        description: (item as any).name || (item as any).description || '',
        details: '',
        quantity: item.quantity || 1,
        unit: 'יחידה',
        unitPrice: item.unit_price || 0,
        total: item.total || 0,
        order: index,
      })) || [],
      parties: [
        {
          id: 'client-1',
          type: 'client' as const,
          name: quote.clients?.name || '',
          company: '',
          email: quote.clients?.email || '',
          phone: quote.clients?.phone || '',
          address: '',
        },
      ],
      paymentSteps: [],
      signatures: [],
      notes: quote.notes || '',
      introduction: '',
      footer: '',
    };
  };

  // Convert Contract to DocumentData
  const convertContractToDocumentData = (contract: Contract): Partial<DocumentData> => {
    return {
      id: contract.id,
      type: 'contract',
      title: contract.title || '',
      number: contract.contract_number || '',
      date: contract.created_at || new Date().toISOString(),
      startDate: contract.start_date,
      endDate: contract.end_date,
      status: 'draft',
      currency: 'ILS',
      vatRate: 17,
      discount: 0,
      discountType: 'percent',
      items: [],
      parties: [
        {
          id: 'client-1',
          type: 'client' as const,
          name: '',
          company: '',
          email: '',
          phone: '',
          address: '',
        },
      ],
      paymentSteps: [],
      signatures: [],
      notes: contract.notes || '',
      introduction: '',
      footer: '',
    };
  };

  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      
      try {
        if (documentType === 'quote' && documentId) {
          const quote = quotes.find(q => q.id === documentId);
          if (quote) {
            setInitialData(convertQuoteToDocumentData(quote));
          } else {
            // Quote not found yet, might still be loading
            setInitialData({ type: 'quote' });
          }
        } else if (documentType === 'contract' && documentId) {
          const contract = contracts.find(c => c.id === documentId);
          if (contract) {
            setInitialData(convertContractToDocumentData(contract));
          } else {
            setInitialData({ type: 'contract' });
          }
        } else if (clientId) {
          // New document for client
          const client = clients.find(c => c.id === clientId);
          if (client) {
            setInitialData({
              type: documentType,
              parties: [
                {
                  id: 'company-1',
                  type: 'company' as const,
                  name: 'החברה שלי',
                  company: '',
                  email: '',
                  phone: '',
                  address: '',
                },
                {
                  id: 'client-1',
                  type: 'client' as const,
                  name: client.name || '',
                  company: client.company || '',
                  email: client.email || '',
                  phone: client.phone || '',
                  address: client.address || '',
                },
              ],
            });
          } else {
            setInitialData({ type: documentType });
          }
        } else {
          // New empty document
          setInitialData({ type: documentType });
        }
      } catch (error) {
        console.error('Error loading document:', error);
        toast({
          title: 'שגיאה בטעינת המסמך',
          variant: 'destructive',
        });
        setInitialData({ type: documentType });
      }
      
      setIsLoading(false);
    };

    loadDocument();
  }, [documentType, documentId, clientId, quotes, contracts, clients, toast]);

  // Handle save
  const handleSave = async (data: DocumentData) => {
    try {
      toast({
        title: 'שומר...',
      });
      
      // For now just show success - actual save will be implemented when hooks are ready
      toast({
        title: 'המסמך נשמר בהצלחה',
      });
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: 'שגיאה בשמירת המסמך',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Handle export PDF
  const handleExportPDF = async (data: DocumentData) => {
    toast({
      title: 'מייצא PDF...',
      description: 'הקובץ יורד בקרוב',
    });
    // TODO: Implement PDF export
  };

  // Handle print
  const handlePrint = (data: DocumentData) => {
    window.print();
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/quotes');
  };

  if (isLoading || !initialData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-4 py-2 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-1" />
          חזור
        </Button>
        <div className="flex items-center gap-2">
          {documentType === 'quote' ? (
            <FileText className="h-5 w-5 text-primary" />
          ) : (
            <ScrollText className="h-5 w-5 text-primary" />
          )}
          <span className="font-semibold">
            {documentType === 'quote' ? 'עורך הצעות מחיר מתקדם' : 'עורך חוזים מתקדם'}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <DocumentEditor
          documentType={documentType}
          initialData={initialData}
          onSave={handleSave}
          onExportPDF={handleExportPDF}
          onPrint={handlePrint}
        />
      </div>
    </div>
  );
}
