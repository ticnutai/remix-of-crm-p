import { useState, useCallback, useMemo } from 'react';
import {
  DocumentData,
  DocumentItem,
  DocumentParty,
  PaymentStep,
  SignatureData,
  DocumentSettings,
  CompanyBranding,
  defaultDocumentData,
  defaultDocumentSettings,
  defaultCompanyBranding,
  DocumentType,
} from '../types';

// Simple UUID generator
const generateId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export interface UseDocumentEditorOptions {
  initialData?: Partial<DocumentData>;
  documentType?: DocumentType;
  onSave?: (data: DocumentData) => Promise<void>;
}

export function useDocumentEditor(options: UseDocumentEditorOptions = {}) {
  const { initialData, documentType = 'quote', onSave } = options;
  
  const [document, setDocument] = useState<DocumentData>(() => ({
    ...defaultDocumentData,
    type: documentType,
    ...initialData,
    branding: {
      ...defaultCompanyBranding,
      ...initialData?.branding,
    },
    settings: {
      ...defaultDocumentSettings,
      ...initialData?.settings,
    },
  }));
  
  const [originalId, setOriginalId] = useState<string | undefined>(initialData?.id);
  const [isDirty, setIsDirty] = useState(false);

  // Calculate totals whenever items change
  const totals = useMemo(() => {
    const subtotal = document.items.reduce((sum, item) => sum + item.total, 0);
    let discountAmount = 0;
    
    if (document.discountType === 'percent') {
      discountAmount = (subtotal * document.discount) / 100;
    } else {
      discountAmount = document.discount;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = document.settings.showVat ? (afterDiscount * document.vatRate) / 100 : 0;
    const total = afterDiscount + vatAmount;
    
    return { subtotal, discountAmount, vatAmount, total };
  }, [document.items, document.discount, document.discountType, document.vatRate, document.settings.showVat]);

  // Update document
  const updateDocument = useCallback((updates: Partial<DocumentData>) => {
    setDocument(prev => ({
      ...prev,
      ...updates,
      subtotal: updates.items ? updates.items.reduce((sum, item) => sum + item.total, 0) : prev.subtotal,
    }));
    setIsDirty(true);
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<DocumentSettings>) => {
    setDocument(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
    setIsDirty(true);
  }, []);

  // Items management
  const addItem = useCallback((item?: Partial<DocumentItem>) => {
    const newItem: DocumentItem = {
      id: generateId(),
      order: document.items.length + 1,
      description: item?.description || '',
      details: item?.details || '',
      quantity: item?.quantity || 1,
      unit: item?.unit || 'יח\'',
      unitPrice: item?.unitPrice || 0,
      total: (item?.quantity || 1) * (item?.unitPrice || 0),
    };
    
    setDocument(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setIsDirty(true);
    return newItem.id;
  }, [document.items.length]);

  const updateItem = useCallback((id: string, updates: Partial<DocumentItem>) => {
    setDocument(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }),
    }));
    setIsDirty(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setDocument(prev => ({
      ...prev,
      items: prev.items
        .filter(item => item.id !== id)
        .map((item, index) => ({ ...item, order: index + 1 })),
    }));
    setIsDirty(true);
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setDocument(prev => {
      const items = [...prev.items];
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
      return {
        ...prev,
        items: items.map((item, index) => ({ ...item, order: index + 1 })),
      };
    });
    setIsDirty(true);
  }, []);

  const duplicateItem = useCallback((id: string) => {
    setDocument(prev => {
      const itemIndex = prev.items.findIndex(item => item.id === id);
      if (itemIndex === -1) return prev;
      
      const originalItem = prev.items[itemIndex];
      const newItem: DocumentItem = {
        ...originalItem,
        id: generateId(),
        order: itemIndex + 2,
      };
      
      const items = [...prev.items];
      items.splice(itemIndex + 1, 0, newItem);
      
      return {
        ...prev,
        items: items.map((item, index) => ({ ...item, order: index + 1 })),
      };
    });
    setIsDirty(true);
  }, []);

  // Parties management
  const addParty = useCallback((party: Omit<DocumentParty, 'id'>) => {
    const newParty: DocumentParty = {
      id: generateId(),
      ...party,
    };
    setDocument(prev => ({
      ...prev,
      parties: [...prev.parties, newParty],
    }));
    setIsDirty(true);
    return newParty.id;
  }, []);

  const updateParty = useCallback((id: string, updates: Partial<DocumentParty>) => {
    setDocument(prev => ({
      ...prev,
      parties: prev.parties.map(party =>
        party.id === id ? { ...party, ...updates } : party
      ),
    }));
    setIsDirty(true);
  }, []);

  const removeParty = useCallback((id: string) => {
    setDocument(prev => ({
      ...prev,
      parties: prev.parties.filter(party => party.id !== id),
    }));
    setIsDirty(true);
  }, []);

  // Payment steps management
  const addPaymentStep = useCallback((step?: Partial<PaymentStep>) => {
    const newStep: PaymentStep = {
      id: generateId(),
      order: document.paymentSteps.length + 1,
      description: step?.description || '',
      percentage: step?.percentage,
      amount: step?.amount,
      dueDate: step?.dueDate,
      condition: step?.condition,
      status: 'pending',
    };
    setDocument(prev => ({
      ...prev,
      paymentSteps: [...prev.paymentSteps, newStep],
    }));
    setIsDirty(true);
    return newStep.id;
  }, [document.paymentSteps.length]);

  const updatePaymentStep = useCallback((id: string, updates: Partial<PaymentStep>) => {
    setDocument(prev => ({
      ...prev,
      paymentSteps: prev.paymentSteps.map(step =>
        step.id === id ? { ...step, ...updates } : step
      ),
    }));
    setIsDirty(true);
  }, []);

  const removePaymentStep = useCallback((id: string) => {
    setDocument(prev => ({
      ...prev,
      paymentSteps: prev.paymentSteps
        .filter(step => step.id !== id)
        .map((step, index) => ({ ...step, order: index + 1 })),
    }));
    setIsDirty(true);
  }, []);

  // Signatures
  const addSignature = useCallback((signature: Omit<SignatureData, 'id'>) => {
    const newSignature: SignatureData = {
      id: generateId(),
      ...signature,
    };
    setDocument(prev => ({
      ...prev,
      signatures: [...prev.signatures, newSignature],
    }));
    setIsDirty(true);
    return newSignature.id;
  }, []);

  const updateSignature = useCallback((id: string, updates: Partial<SignatureData>) => {
    setDocument(prev => ({
      ...prev,
      signatures: prev.signatures.map(sig =>
        sig.id === id ? { ...sig, ...updates } : sig
      ),
    }));
    setIsDirty(true);
  }, []);

  const removeSignature = useCallback((id: string) => {
    setDocument(prev => ({
      ...prev,
      signatures: prev.signatures.filter(sig => sig.id !== id),
    }));
    setIsDirty(true);
  }, []);

  // Load document
  const loadDocument = useCallback((data: Partial<DocumentData>) => {
    setDocument({
      ...defaultDocumentData,
      ...data,
      settings: {
        ...defaultDocumentSettings,
        ...data.settings,
      },
    });
    setOriginalId(data.id);
    setIsDirty(false);
  }, []);

  // Reset document
  const resetDocument = useCallback((type?: DocumentType) => {
    setDocument({
      ...defaultDocumentData,
      type: type || documentType,
    });
    setOriginalId(undefined);
    setIsDirty(false);
  }, [documentType]);

  // Save document
  const saveDocument = useCallback(async () => {
    if (!onSave) return;
    
    const dataToSave: DocumentData = {
      ...document,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      total: totals.total,
    };
    
    await onSave(dataToSave);
    setIsDirty(false);
  }, [document, totals, onSave]);

  // Load template
  const loadTemplate = useCallback((templateData: Partial<DocumentData>) => {
    setDocument(prev => ({
      ...prev,
      ...templateData,
      id: prev.id, // Keep original ID
      number: prev.number, // Keep original number
      settings: {
        ...prev.settings,
        ...templateData.settings,
      },
    }));
    setIsDirty(true);
  }, []);

  return {
    // State
    document,
    originalId,
    isDirty,
    totals,
    
    // Document updates
    updateDocument,
    updateSettings,
    
    // Items
    addItem,
    updateItem,
    removeItem,
    moveItem,
    duplicateItem,
    
    // Parties
    addParty,
    updateParty,
    removeParty,
    
    // Payment steps
    addPaymentStep,
    updatePaymentStep,
    removePaymentStep,
    
    // Signatures
    addSignature,
    updateSignature,
    removeSignature,
    
    // Document management
    loadDocument,
    resetDocument,
    saveDocument,
    loadTemplate,
  };
}
