// Hook לניהול מסמך חוזה
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ContractDocument,
  ContractBlock,
  BlockType,
  ColorScheme,
  DesignTemplate,
  HeaderContent,
  PartiesContent,
  SectionContent,
  ItemsContent,
  PaymentsContent,
  TimelineContent,
  TermsContent,
  SignaturesContent,
  NotesContent,
  CustomContent,
} from '../types';

// יצירת בלוק ריק לפי סוג
const createEmptyBlock = (type: BlockType, order: number): ContractBlock => {
  const id = uuidv4();
  
  switch (type) {
    case 'header':
      return {
        id,
        type,
        title: 'כותרת',
        visible: true,
        order,
        content: {
          title: 'חוזה',
          subtitle: '',
          contractNumber: '',
          date: new Date().toLocaleDateString('he-IL'),
        } as HeaderContent,
      };
    
    case 'parties':
      return {
        id,
        type,
        title: 'הצדדים להסכם',
        visible: true,
        order,
        content: {
          parties: [
            { id: uuidv4(), type: 'client', name: '' },
            { id: uuidv4(), type: 'provider', name: '' },
          ],
        } as PartiesContent,
      };
    
    case 'section':
      return {
        id,
        type,
        title: 'סעיף חדש',
        visible: true,
        order,
        content: {
          items: [],
          showPrices: false,
          showCheckmarks: true,
        } as SectionContent,
      };
    
    case 'items':
      return {
        id,
        type,
        title: 'פירוט מחירים',
        visible: true,
        order,
        content: {
          tiers: [],
          items: [],
          upgrades: [],
          totalPrice: 0,
          includesVat: false,
        } as ItemsContent,
      };
    
    case 'payments':
      return {
        id,
        type,
        title: 'לוח תשלומים',
        visible: true,
        order,
        content: {
          steps: [],
          paymentTerms: '',
          currency: '₪',
        } as PaymentsContent,
      };
    
    case 'timeline':
      return {
        id,
        type,
        title: 'לוח זמנים',
        visible: true,
        order,
        content: {
          steps: [],
        } as TimelineContent,
      };
    
    case 'terms':
      return {
        id,
        type,
        title: 'תנאים והערות',
        visible: true,
        order,
        content: {
          terms: [],
          specialClauses: [],
        } as TermsContent,
      };
    
    case 'signatures':
      return {
        id,
        type,
        title: 'חתימות',
        visible: true,
        order,
        content: {
          fields: [
            { id: uuidv4(), label: 'מזמין' },
            { id: uuidv4(), label: 'ספק' },
          ],
          showDate: true,
        } as SignaturesContent,
      };
    
    case 'notes':
      return {
        id,
        type,
        title: 'הערות חשובות',
        visible: true,
        order,
        content: {
          notes: [],
        } as NotesContent,
      };
    
    case 'custom':
      return {
        id,
        type,
        title: 'תוכן מותאם',
        visible: true,
        order,
        content: {
          html: '<div></div>',
        } as CustomContent,
      };
    
    default:
      return {
        id,
        type,
        title: 'בלוק חדש',
        visible: true,
        order,
        content: {},
      };
  }
};

// יצירת מסמך ברירת מחדל
const createDefaultDocument = (): ContractDocument => ({
  title: 'חוזה חדש',
  colorScheme: 'gold',
  designTemplate: 'classic',
  blocks: [
    createEmptyBlock('header', 0),
    createEmptyBlock('parties', 1),
    createEmptyBlock('section', 2),
    createEmptyBlock('payments', 3),
    createEmptyBlock('terms', 4),
    createEmptyBlock('signatures', 5),
  ],
  metadata: {
    createdAt: new Date().toISOString(),
    status: 'draft',
  },
  settings: {
    showHeader: true,
    showFooter: true,
    showPageNumbers: true,
    darkMode: false,
  },
});

export function useContractDocument() {
  const [document, setDocument] = useState<ContractDocument>(createDefaultDocument());
  const [originalDocumentId, setOriginalDocumentId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // עדכון המסמך
  const updateDocument = useCallback((updates: Partial<ContractDocument>) => {
    setDocument(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // שינוי ערכת צבעים
  const setColorScheme = useCallback((scheme: ColorScheme) => {
    updateDocument({ colorScheme: scheme });
  }, [updateDocument]);

  // שינוי תבנית עיצוב
  const setDesignTemplate = useCallback((template: DesignTemplate) => {
    updateDocument({ designTemplate: template });
  }, [updateDocument]);

  // הוספת בלוק
  const addBlock = useCallback((type: BlockType, afterBlockId?: string) => {
    setDocument(prev => {
      const blocks = [...prev.blocks];
      let insertIndex = blocks.length;
      
      if (afterBlockId) {
        const afterIndex = blocks.findIndex(b => b.id === afterBlockId);
        if (afterIndex !== -1) {
          insertIndex = afterIndex + 1;
        }
      }
      
      const newBlock = createEmptyBlock(type, insertIndex);
      blocks.splice(insertIndex, 0, newBlock);
      
      // עדכון סדר כל הבלוקים
      blocks.forEach((block, index) => {
        block.order = index;
      });
      
      return { ...prev, blocks };
    });
    setIsDirty(true);
  }, []);

  // עדכון בלוק
  const updateBlock = useCallback((blockId: string, updates: Partial<ContractBlock>) => {
    setDocument(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      ),
    }));
    setIsDirty(true);
  }, []);

  // עדכון תוכן בלוק
  const updateBlockContent = useCallback((blockId: string, content: any) => {
    setDocument(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId ? { ...block, content } : block
      ),
    }));
    setIsDirty(true);
  }, []);

  // מחיקת בלוק
  const removeBlock = useCallback((blockId: string) => {
    setDocument(prev => {
      const blocks = prev.blocks.filter(block => block.id !== blockId);
      // עדכון סדר
      blocks.forEach((block, index) => {
        block.order = index;
      });
      return { ...prev, blocks };
    });
    setIsDirty(true);
  }, []);

  // הזזת בלוק
  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setDocument(prev => {
      const blocks = [...prev.blocks];
      const index = blocks.findIndex(b => b.id === blockId);
      
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === blocks.length - 1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
      
      // עדכון סדר
      blocks.forEach((block, i) => {
        block.order = i;
      });
      
      return { ...prev, blocks };
    });
    setIsDirty(true);
  }, []);

  // סידור בלוקים מחדש (drag & drop)
  const reorderBlocks = useCallback((startIndex: number, endIndex: number) => {
    setDocument(prev => {
      const blocks = [...prev.blocks];
      const [removed] = blocks.splice(startIndex, 1);
      blocks.splice(endIndex, 0, removed);
      
      // עדכון סדר
      blocks.forEach((block, index) => {
        block.order = index;
      });
      
      return { ...prev, blocks };
    });
    setIsDirty(true);
  }, []);

  // שכפול בלוק
  const duplicateBlock = useCallback((blockId: string) => {
    setDocument(prev => {
      const blocks = [...prev.blocks];
      const blockIndex = blocks.findIndex(b => b.id === blockId);
      
      if (blockIndex === -1) return prev;
      
      const originalBlock = blocks[blockIndex];
      const newBlock: ContractBlock = {
        ...JSON.parse(JSON.stringify(originalBlock)),
        id: uuidv4(),
        title: `${originalBlock.title} (עותק)`,
        order: blockIndex + 1,
      };
      
      blocks.splice(blockIndex + 1, 0, newBlock);
      
      // עדכון סדר
      blocks.forEach((block, index) => {
        block.order = index;
      });
      
      return { ...prev, blocks };
    });
    setIsDirty(true);
  }, []);

  // הצגה/הסתרה של בלוק
  const toggleBlockVisibility = useCallback((blockId: string) => {
    setDocument(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId ? { ...block, visible: !block.visible } : block
      ),
    }));
    setIsDirty(true);
  }, []);

  // טעינת מסמך
  const loadDocument = useCallback((doc: ContractDocument, id?: string) => {
    setDocument(doc);
    setOriginalDocumentId(id || null);
    setIsDirty(false);
  }, []);

  // איפוס לברירת מחדל
  const resetDocument = useCallback(() => {
    setDocument(createDefaultDocument());
    setOriginalDocumentId(null);
    setIsDirty(false);
  }, []);

  // טעינת תבנית
  const loadTemplate = useCallback((template: Partial<ContractDocument>) => {
    setDocument(prev => ({
      ...createDefaultDocument(),
      ...template,
      metadata: {
        ...createDefaultDocument().metadata,
        ...template.metadata,
        createdAt: new Date().toISOString(),
      },
    }));
    setOriginalDocumentId(null);
    setIsDirty(true);
  }, []);

  return {
    document,
    originalDocumentId,
    isDirty,
    updateDocument,
    setColorScheme,
    setDesignTemplate,
    addBlock,
    updateBlock,
    updateBlockContent,
    removeBlock,
    moveBlock,
    reorderBlocks,
    duplicateBlock,
    toggleBlockVisibility,
    loadDocument,
    resetDocument,
    loadTemplate,
  };
}
