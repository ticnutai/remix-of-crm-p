import { useState, useCallback } from 'react';
import { QuoteDocumentData, QuoteDocumentItem } from '../types';
import { format, addDays } from 'date-fns';
import { Quote, QuoteItem } from '@/hooks/useQuotes';

const generateQuoteNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `Q${year}${month}-${random}`;
};

const createDefaultDocument = (): QuoteDocumentData => ({
  title: 'הצעת מחיר',
  quoteNumber: generateQuoteNumber(),
  date: format(new Date(), 'yyyy-MM-dd'),
  validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  
  clientName: '',
  clientCompany: '',
  clientAddress: '',
  clientPhone: '',
  clientEmail: '',
  
  items: [],
  
  subtotal: 0,
  vatRate: 17,
  vatAmount: 0,
  discount: 0,
  discountType: 'percent',
  total: 0,
  
  introduction: 'לכבוד {{clientName}},\n\nלהלן הצעת מחיר עבור הפרויקט המבוקש:',
  terms: 'תנאי תשלום: שוטף + 30\nההצעה תקפה ל-30 יום מתאריך הנפקתה.',
  notes: '',
  footer: 'בברכה,\n{{companyName}}',
  
  primaryColor: '#1e3a5f',
  secondaryColor: '#c9a227',
  fontFamily: 'Heebo',
  
  showLogo: true,
  showCompanyDetails: true,
  showClientDetails: true,
  showItemNumbers: true,
  showVat: true,
  showPaymentTerms: true,
  showSignature: true,
});

// Convert Quote from database to QuoteDocumentData
const convertQuoteToDocument = (quote: Quote): QuoteDocumentData => {
  const items: QuoteDocumentItem[] = (quote.items || []).map((item: QuoteItem, index: number) => ({
    id: crypto.randomUUID(),
    number: index + 1,
    description: item.name || '',
    details: item.description || '',
    quantity: item.quantity || 1,
    unit: 'יח\'',
    unitPrice: item.unit_price || 0,
    total: item.total || 0,
  }));

  return {
    id: quote.id,
    title: quote.title || 'הצעת מחיר',
    quoteNumber: quote.quote_number,
    date: format(new Date(quote.issue_date || quote.created_at), 'yyyy-MM-dd'),
    validUntil: quote.valid_until ? format(new Date(quote.valid_until), 'yyyy-MM-dd') : format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    
    clientName: quote.clients?.name || '',
    clientCompany: '',
    clientAddress: '',
    clientPhone: quote.clients?.phone || '',
    clientEmail: quote.clients?.email || '',
    
    items,
    
    subtotal: quote.subtotal || 0,
    vatRate: quote.vat_rate || 17,
    vatAmount: quote.vat_amount || 0,
    discount: 0,
    discountType: 'percent',
    total: quote.total_amount || 0,
    
    introduction: 'לכבוד {{clientName}},\n\nלהלן הצעת מחיר עבור הפרויקט המבוקש:',
    terms: quote.terms_and_conditions || 'תנאי תשלום: שוטף + 30\nההצעה תקפה ל-30 יום מתאריך הנפקתה.',
    notes: quote.notes || '',
    footer: 'בברכה,\n{{companyName}}',
    
    primaryColor: '#1e3a5f',
    secondaryColor: '#c9a227',
    fontFamily: 'Heebo',
    
    showLogo: true,
    showCompanyDetails: true,
    showClientDetails: true,
    showItemNumbers: true,
    showVat: true,
    showPaymentTerms: true,
    showSignature: true,
  };
};

export function useQuoteDocument(initialData?: Partial<QuoteDocumentData>) {
  const [document, setDocument] = useState<QuoteDocumentData>(() => ({
    ...createDefaultDocument(),
    ...initialData,
  }));
  
  const [originalQuoteId, setOriginalQuoteId] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<QuoteDocumentData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDirty, setIsDirty] = useState(false);

  const updateDocument = useCallback((updates: Partial<QuoteDocumentData>) => {
    setDocument(prev => {
      const newDoc = { ...prev, ...updates };
      
      // Recalculate totals if items changed
      if (updates.items || updates.vatRate || updates.discount !== undefined) {
        const subtotal = newDoc.items.reduce((sum, item) => sum + item.total, 0);
        let discountAmount = 0;
        if (newDoc.discountType === 'percent') {
          discountAmount = subtotal * (newDoc.discount / 100);
        } else {
          discountAmount = newDoc.discount;
        }
        const afterDiscount = subtotal - discountAmount;
        const vatAmount = afterDiscount * (newDoc.vatRate / 100);
        
        newDoc.subtotal = subtotal;
        newDoc.vatAmount = vatAmount;
        newDoc.total = afterDiscount + vatAmount;
      }
      
      return newDoc;
    });
    setIsDirty(true);
  }, []);

  const addItem = useCallback(() => {
    const newItem: QuoteDocumentItem = {
      id: crypto.randomUUID(),
      number: document.items.length + 1,
      description: '',
      quantity: 1,
      unit: 'יח\'',
      unitPrice: 0,
      total: 0,
    };
    updateDocument({ items: [...document.items, newItem] });
  }, [document.items, updateDocument]);

  const updateItem = useCallback((id: string, updates: Partial<QuoteDocumentItem>) => {
    const items = document.items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      if ('quantity' in updates || 'unitPrice' in updates) {
        updated.total = updated.quantity * updated.unitPrice;
      }
      return updated;
    });
    updateDocument({ items });
  }, [document.items, updateDocument]);

  const removeItem = useCallback((id: string) => {
    const items = document.items
      .filter(item => item.id !== id)
      .map((item, index) => ({ ...item, number: index + 1 }));
    updateDocument({ items });
  }, [document.items, updateDocument]);

  const moveItem = useCallback((id: string, direction: 'up' | 'down') => {
    const index = document.items.findIndex(item => item.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === document.items.length - 1) return;
    
    const items = [...document.items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    
    // Renumber
    const renumbered = items.map((item, i) => ({ ...item, number: i + 1 }));
    updateDocument({ items: renumbered });
  }, [document.items, updateDocument]);

  const duplicateItem = useCallback((id: string) => {
    const index = document.items.findIndex(item => item.id === id);
    if (index === -1) return;
    
    const original = document.items[index];
    const duplicate: QuoteDocumentItem = {
      ...original,
      id: crypto.randomUUID(),
    };
    
    const items = [...document.items];
    items.splice(index + 1, 0, duplicate);
    const renumbered = items.map((item, i) => ({ ...item, number: i + 1 }));
    updateDocument({ items: renumbered });
  }, [document.items, updateDocument]);

  const resetDocument = useCallback(() => {
    setDocument(createDefaultDocument());
    setOriginalQuoteId(undefined);
    setIsDirty(false);
  }, []);

  const loadTemplate = useCallback((templateData: Partial<QuoteDocumentData>) => {
    setDocument(prev => ({
      ...createDefaultDocument(),
      ...templateData,
      quoteNumber: generateQuoteNumber(),
      date: format(new Date(), 'yyyy-MM-dd'),
      validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    }));
    setIsDirty(true);
  }, []);

  // Load existing quote into the editor
  const loadQuote = useCallback((quote: Quote) => {
    const documentData = convertQuoteToDocument(quote);
    setDocument(documentData);
    setOriginalQuoteId(quote.id);
    setIsDirty(false);
  }, []);

  return {
    document,
    originalQuoteId,
    isDirty,
    updateDocument,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    duplicateItem,
    resetDocument,
    loadTemplate,
    loadQuote,
  };
}
