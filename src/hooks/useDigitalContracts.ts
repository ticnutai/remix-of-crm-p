import { useState } from "react";
import { ContractDesign, DEFAULT_DESIGN } from "@/types/contract-design";

export interface DigitalContractSection {
  id: string;
  title: string;
  items: string[];
}

export interface PaymentStep {
  percentage: string;
  description: string;
}

export interface DigitalContractData {
  id: string;
  title: string;
  location: string;
  price: string;
  sections: DigitalContractSection[];
  payments: PaymentStep[];
  timeline?: string[];
  notes: string[];
  icon: "building" | "home" | "document";
  subtitle: string;
  design?: ContractDesign;
  status?: "draft" | "sent" | "approved" | "in_progress" | "completed" | "cancelled";
  clientEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  sentAt?: string;
  approvedAt?: string;
  completedAt?: string;
  templateId?: string;
  language?: "he" | "en";
  vatIncluded?: boolean;
  vatAmount?: string;
  attachments?: string[];
  signatureData?: string;
  signedBy?: string;
  signedAt?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialContracts: DigitalContractData[] = [
  {
    id: "addition",
    title: "הצעת מחיר לתוספת בניה",
    subtitle: "הוצאת היתר בניה לתוספת בניה למבנה מגורים קיים - גוש 6273",
    location: "גוש 6273, חלקה 27, מגרש 921 - כפר חב\"ד",
    price: "₪35,000",
    icon: "home",
    status: "draft",
    language: "he",
    vatIncluded: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [],
    sections: [
      {
        id: generateId(),
        title: "שלב ראשון - בדיקת היתכנות ותכנון",
        items: [
          "בירור תוכניות בנין עיר (תב\"ע) החלות על המגרש",
          "בדיקת סטטוס המגרש ובדיקת היתכנות",
          "הזמנת תיק מידע מהרשויות ובחינת היתרי הבניה",
          "השוואה למצב הקיים וגיבוש זכויות הבניה",
          "הכנת פרוגרמה מפורטת עם המזמינים",
          "עד 3 חלופות תכנון רעיוני למזמינים",
          "תוכנית חלוקת החללים והעמדת ריהוט",
        ],
      },
      {
        id: generateId(),
        title: "רישוי",
        items: [
          "עריכת והגשת בקשה להיתר לוועדה לתכנון ובניה",
          "תיאום בין היועצים השונים הנדרשים",
          "השתתפות בפגישות ודיונים עם המוסדות המאשרים",
          "חתימת הרשויות השונות לרבות רמ\"י והג\"א",
          "קידום לקבלת היתר בניה (למעט החתמת שכנים ווועד)",
        ],
      },
      {
        id: generateId(),
        title: "שלב שני - תוכניות ביצוע",
        items: [
          "תוכניות עבודה אדריכליות מפורטות: תכנית הקומות, חתכים, חזיתות",
          "תוכנית העמדת הבניין במגרש, תכנית מדרגות",
          "פיתוח השטח: גדרות, שבילי כניסה וחניה, מפלסים, ריצוף חוץ וצמחייה",
          "פגישה עם קבלן מבצע להסברת התוכנית ומתן הנחיות",
          "פיקוח עליון לצורכי רישוי בלבד",
        ],
      },
      {
        id: generateId(),
        title: "כללי",
        items: [
          "המזמינים יזמינו על חשבונם את השירותים והיועצים הנדרשים",
          "לעורכי הבקשה אין אחריות לתשלומים לוועדה לתכנון ובניה",
          "המזמינים ידאגו למילוי הוראות הבטיחות באתר",
          "מומלץ שירותי קבלנים רשומים ומפקח בניה צמוד",
        ],
      },
    ],
    payments: [
      { percentage: "25%", description: "חתימת חוזה" },
      { percentage: "30%", description: "חתימה על תכנית הגשה" },
      { percentage: "30%", description: "אישור מהוועדה (היתר בתנאים)" },
      { percentage: "15%", description: "קבלת היתר" },
    ],
    timeline: [
      "בדיקת היתכנות מול הרשויות - תיק מידע",
      "מסירת סקיצה ראשונה למזמין - 25 י\"ע מקבלת מפת המדידה",
      "עיבוד החלופה הנבחרת - 12 י\"ע לאחר משוב המזמין",
      "הגשת תוכניות לרשויות - 21 י\"ע מאישור סופי של המזמין",
      "הכנת תוכנית עבודה לביצוע - 45 י\"ע מרגע קבלת היתר",
    ],
    notes: [
      "במקרה של ביטול הסכם - הסכום יוחזר למזמינים בטרם החלה בדיקת ההיתכנות",
      "אם המזמינים הפסיקו ההתקשרות - ישלמו עבור כל השלבים שהוכנו",
      "ההסכם אינו כולל תכניות שינוי תב\"ע מקומית/מחוזית",
      "לא יתוכננו חללים שאינם כלולים בהיתר והחורגים מהתוכניות",
      "אם הליך ההיתר יופסק לתקופה שמעבר לחצי שנה - עורכי הבקשה לא מחויבים להמשיך",
      "תוספת תשלום בכל שינוי בפרוגרמה מאושרת, בחלופה או בתוכניות עבודה",
      "שעת עבודה נוספת - ₪250 + מע\"מ",
    ],
  },
  {
    id: "expansion",
    title: "הצעת מחיר להרחבה צפונית",
    subtitle: "הוצאת היתר בניה ליחידת דיור אחת במגרש בהרחבה הצפונית - גוש 7311",
    location: "גוש 7311, חלקה A, מגרש B - כפר חב\"ד (הרחבה צפונית)",
    price: "₪37,000",
    icon: "building",
    status: "draft",
    language: "he",
    vatIncluded: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [],
    sections: [
      {
        id: generateId(),
        title: "שלב ראשון - בדיקת היתכנות ותכנון",
        items: [
          "בירור תוכניות בנין עיר (תב\"ע) החלות על המגרש",
          "בדיקת סטטוס המגרש ובדיקת היתכנות",
          "הזמנת תיק מידע מהרשויות ובחינת היתרי הבניה",
          "השוואה למצב הקיים וגיבוש זכויות הבניה",
          "הכנת פרוגרמה מפורטת עם המזמינים",
          "עד 3 חלופות תכנון רעיוני למזמינים",
          "תוכנית חלוקת החללים והעמדת ריהוט",
        ],
      },
      {
        id: generateId(),
        title: "רישוי",
        items: [
          "עריכת והגשת בקשה להיתר לוועדה לתכנון ובניה",
          "תיאום בין היועצים השונים הנדרשים",
          "השתתפות בפגישות ודיונים עם המוסדות המאשרים",
          "חתימת הרשויות השונות לרבות רמ\"י והג\"א",
          "קידום לקבלת היתר בניה (למעט החתמת שכנים ווועד)",
        ],
      },
      {
        id: generateId(),
        title: "שלב שני - תוכניות ביצוע",
        items: [
          "תוכניות עבודה אדריכליות מפורטות: תכנית הקומות, חתכים, חזיתות",
          "תוכנית העמדת הבניין במגרש, תכנית מדרגות",
          "פיתוח השטח: גדרות, שבילי כניסה וחניה, מפלסים, ריצוף חוץ וצמחייה",
          "פגישה עם קבלן מבצע להסברת התוכנית ומתן הנחיות",
          "פיקוח עליון לצורכי רישוי בלבד",
        ],
      },
      {
        id: generateId(),
        title: "כללי",
        items: [
          "המזמינים יזמינו על חשבונם את השירותים והיועצים הנדרשים",
          "לעורכי הבקשה אין אחריות לתשלומים לוועדה לתכנון ובניה",
          "המזמינים ידאגו למילוי הוראות הבטיחות באתר",
          "מומלץ שירותי קבלנים רשומים ומפקח בניה צמוד",
        ],
      },
    ],
    payments: [
      { percentage: "25%", description: "חתימת חוזה" },
      { percentage: "30%", description: "חתימה על תכנית הגשה" },
      { percentage: "30%", description: "אישור מהוועדה (היתר בתנאים)" },
      { percentage: "15%", description: "קבלת היתר" },
    ],
    timeline: [
      "בדיקת היתכנות מול הרשויות - תיק מידע",
      "מסירת סקיצה ראשונה למזמין - 25 י\"ע מאישור וחתימה",
      "עיבוד החלופה הנבחרת - 12 י\"ע לאחר משוב המזמין",
      "הגשת תוכניות לרשויות - 21 י\"ע מאישור סופי של המזמין",
      "הכנת תוכנית עבודה לביצוע - 45 י\"ע מרגע קבלת היתר",
    ],
    notes: [
      "במקרה של ביטול הסכם - הסכום יוחזר למזמינים בטרם החלה בדיקת ההיתכנות",
      "אם המזמינים הפסיקו ההתקשרות - ישלמו עבור כל השלבים שהוכנו",
      "ההסכם אינו כולל תכניות שינוי תב\"ע מקומית/מחוזית",
      "לא יתוכננו חללים שאינם כלולים בהיתר והחורגים מהתוכניות",
      "תוספת ליחידת דיור נוספת (אופציה עתידית): ₪5,000",
      "שעת עבודה נוספת - ₪250 + מע\"מ",
    ],
  },
  {
    id: "licensing",
    title: "הצעת מחיר לרישוי בלבד",
    subtitle: "הוצאת היתר בניה עם קבלת תוכנית וגרמושקא מאדריכל מתכנן - גוש 7188",
    location: "גוש 7188, חלקה 50, מגרש 166 - כפר חב\"ד",
    price: "₪30,000",
    icon: "document",
    status: "draft",
    language: "he",
    vatIncluded: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [],
    sections: [
      {
        id: generateId(),
        title: "שלב ראשון - רישוי",
        items: [
          "בירור תוכניות בנין עיר (תב\"ע) החלות על המגרש",
          "בדיקת סטטוס המגרש ובדיקת היתכנות",
          "עורכי הבקשה ימסרו לאדריכל המתכנן את סך הזכויות ותיק המידע",
          "עורכי הבקשה יקבלו מהאדריכל המתכנן גרמושקא ערוכה להגשה",
          "הגשת בקשה להיתר לוועדה לתכנון ובניה",
          "תיאום בין היועצים השונים הנדרשים",
          "השתתפות בפגישות ודיונים עם המוסדות המאשרים",
          "חתימת הרשויות השונות לרבות רמ\"י והג\"א (למעט שכנים ווועד)",
        ],
      },
      {
        id: generateId(),
        title: "שלב שני - פיקוח",
        items: [
          "פיקוח עליון לצורכי רישוי בלבד",
          "ביקורים באתר לפני יציקת תקרות ורצפה",
          "ביקור בעת בניית שורה ראשונה של אבן ראשונה",
          "ביקור בהגעה לגובה ספי חלונות",
          "התערבות המתכנן במקרים הדורשים פתרון בעיות",
        ],
      },
      {
        id: generateId(),
        title: "כללי",
        items: [
          "המזמינים יזמינו על חשבונם את השירותים והיועצים הנדרשים",
          "לעורכי הבקשה אין אחריות לתשלומים לוועדה לתכנון ובניה",
          "המזמינים ידאגו למילוי הוראות הבטיחות באתר",
          "מומלץ שירותי קבלנים רשומים ומפקח בניה צמוד",
        ],
      },
    ],
    payments: [
      { percentage: "25%", description: "חתימת חוזה" },
      { percentage: "30%", description: "חתימה על תכנית הגשה" },
      { percentage: "30%", description: "אישור מהוועדה (היתר בתנאים)" },
      { percentage: "15%", description: "קבלת היתר" },
    ],
    notes: [
      "במקרה של ביטול הסכם - הסכום יוחזר למזמינים בטרם החלה בדיקת ההיתכנות",
      "אם המזמינים הפסיקו ההתקשרות - ישלמו עבור כל השלבים שהוכנו",
      "ההסכם אינו כולל תכניות שינוי תב\"ע מקומית/מחוזית",
      "לא יתוכננו חללים שאינם כלולים בהיתר והחורגים מהתוכניות במוסדות התכנון",
      "עריכת גרמושקא על פי תוכניות שיימסרו מהאדריכל המתכנן",
      "התאמת תוכניות אדריכל מתכנן לרישוי",
      "שעת עבודה נוספת - ₪250 + מע\"מ",
    ],
  },
];

export const useDigitalContracts = () => {
  const [contracts, setContracts] = useState<DigitalContractData[]>(initialContracts);
  const [isEditMode, setIsEditMode] = useState(false);

  const updateContract = (
    contractId: string,
    field: keyof DigitalContractData,
    value: string
  ) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId ? { ...contract, [field]: value } : contract
      )
    );
  };

  const updateSectionTitle = (
    contractId: string,
    sectionId: string,
    value: string
  ) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId
          ? {
              ...contract,
              sections: contract.sections.map((section) =>
                section.id === sectionId ? { ...section, title: value } : section
              ),
            }
          : contract
      )
    );
  };

  const updateSectionItem = (
    contractId: string,
    sectionIndex: number,
    itemIndex: number,
    value: string
  ) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        const newSections = [...contract.sections];
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          items: newSections[sectionIndex].items.map((item, i) =>
            i === itemIndex ? value : item
          ),
        };
        return { ...contract, sections: newSections };
      })
    );
  };

  const updateNote = (contractId: string, noteIndex: number, value: string) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId
          ? {
              ...contract,
              notes: contract.notes.map((note, i) =>
                i === noteIndex ? value : note
              ),
            }
          : contract
      )
    );
  };

  const addContract = () => {
    const newContract: DigitalContractData = {
      id: generateId(),
      title: "הצעת מחיר חדשה",
      subtitle: "תיאור קצר של ההצעה",
      location: "מיקום הפרויקט",
      price: "₪0",
      icon: "document",
      status: "draft",
      language: "he",
      vatIncluded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: [],
      sections: [
        {
          id: generateId(),
          title: "סעיף ראשון",
          items: ["פריט ראשון"],
        },
      ],
      payments: [
        { percentage: "25%", description: "חתימת חוזה" },
        { percentage: "25%", description: "שלב ביניים" },
        { percentage: "25%", description: "שלב ביניים" },
        { percentage: "25%", description: "סיום" },
      ],
      notes: ["הערה ראשונה"],
    };
    setContracts((prev) => [...prev, newContract]);
    return newContract.id;
  };

  const deleteContract = (contractId: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
  };

  const addSection = (contractId: string) => {
    const newSection: DigitalContractSection = {
      id: generateId(),
      title: "סעיף חדש",
      items: ["פריט ראשון"],
    };
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId
          ? { ...contract, sections: [...contract.sections, newSection] }
          : contract
      )
    );
  };

  const deleteSection = (contractId: string, sectionId: string) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId
          ? {
              ...contract,
              sections: contract.sections.filter((s) => s.id !== sectionId),
            }
          : contract
      )
    );
  };

  const addSectionItem = (contractId: string, sectionIndex: number) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        const newSections = [...contract.sections];
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          items: [...newSections[sectionIndex].items, "פריט חדש"],
        };
        return { ...contract, sections: newSections };
      })
    );
  };

  const deleteSectionItem = (
    contractId: string,
    sectionIndex: number,
    itemIndex: number
  ) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        const newSections = [...contract.sections];
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          items: newSections[sectionIndex].items.filter((_, i) => i !== itemIndex),
        };
        return { ...contract, sections: newSections };
      })
    );
  };

  const addNote = (contractId: string) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId
          ? { ...contract, notes: [...contract.notes, "הערה חדשה"] }
          : contract
      )
    );
  };

  const deleteNote = (contractId: string, noteIndex: number) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId
          ? {
              ...contract,
              notes: contract.notes.filter((_, i) => i !== noteIndex),
            }
          : contract
      )
    );
  };

  const updateContractIcon = (
    contractId: string,
    icon: "building" | "home" | "document"
  ) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId ? { ...contract, icon } : contract
      )
    );
  };

  const updateContractDesign = (contractId: string, design: ContractDesign) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId ? { ...contract, design } : contract
      )
    );
  };

  const updatePayment = (
    contractId: string,
    paymentIndex: number,
    field: 'percentage' | 'description',
    value: string
  ) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        const newPayments = [...contract.payments];
        newPayments[paymentIndex] = {
          ...newPayments[paymentIndex],
          [field]: value,
        };
        return { ...contract, payments: newPayments };
      })
    );
  };

  const addPayment = (contractId: string) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        return {
          ...contract,
          payments: [
            ...contract.payments,
            { percentage: "0%", description: "שלב חדש" },
          ],
        };
      })
    );
  };

  const deletePayment = (contractId: string, paymentIndex: number) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        return {
          ...contract,
          payments: contract.payments.filter((_, i) => i !== paymentIndex),
        };
      })
    );
  };

  const updateStatus = (
    contractId: string,
    status: "draft" | "sent" | "approved" | "in_progress" | "completed" | "cancelled"
  ) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        const updates: Partial<DigitalContractData> = { 
          status,
          updatedAt: new Date().toISOString()
        };
        
        if (status === "sent" && !contract.sentAt) {
          updates.sentAt = new Date().toISOString();
        }
        if (status === "approved" && !contract.approvedAt) {
          updates.approvedAt = new Date().toISOString();
        }
        if (status === "completed" && !contract.completedAt) {
          updates.completedAt = new Date().toISOString();
        }
        
        return { ...contract, ...updates };
      })
    );
  };

  const duplicateContract = (contractId: string) => {
    const original = contracts.find(c => c.id === contractId);
    if (!original) return null;
    
    const newContract: DigitalContractData = {
      ...original,
      id: generateId(),
      title: `${original.title} (עותק)`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentAt: undefined,
      approvedAt: undefined,
      completedAt: undefined,
      signatureData: undefined,
      signedBy: undefined,
      signedAt: undefined,
      sections: original.sections.map(s => ({
        ...s,
        id: generateId()
      }))
    };
    
    setContracts((prev) => [...prev, newContract]);
    return newContract.id;
  };

  const calculateVAT = (contractId: string, includeVAT: boolean = true) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        
        const cleanPrice = contract.price.replace(/[^0-9.]/g, '');
        const basePrice = parseFloat(cleanPrice) || 0;
        
        if (includeVAT) {
          const vatAmount = basePrice * 0.17;
          return {
            ...contract,
            vatIncluded: true,
            vatAmount: `₪${vatAmount.toLocaleString('he-IL')}`,
            updatedAt: new Date().toISOString()
          };
        } else {
          return {
            ...contract,
            vatIncluded: false,
            vatAmount: undefined,
            updatedAt: new Date().toISOString()
          };
        }
      })
    );
  };

  const addAttachment = (contractId: string, attachmentUrl: string) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        return {
          ...contract,
          attachments: [...(contract.attachments || []), attachmentUrl],
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const removeAttachment = (contractId: string, attachmentIndex: number) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        return {
          ...contract,
          attachments: contract.attachments?.filter((_, i) => i !== attachmentIndex),
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const setSignature = (
    contractId: string,
    signatureData: string,
    signerName: string
  ) => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        return {
          ...contract,
          signatureData,
          signedBy: signerName,
          signedAt: new Date().toISOString(),
          status: contract.status === "sent" ? "approved" : contract.status,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const switchLanguage = (contractId: string, language: "he" | "en") => {
    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;
        return {
          ...contract,
          language,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  return {
    contracts,
    isEditMode,
    setIsEditMode,
    updateContract,
    updateSectionTitle,
    updateSectionItem,
    updateNote,
    addContract,
    deleteContract,
    addSection,
    deleteSection,
    addSectionItem,
    deleteSectionItem,
    addNote,
    deleteNote,
    updateContractIcon,
    updateContractDesign,
    updatePayment,
    addPayment,
    deletePayment,
    updateStatus,
    duplicateContract,
    calculateVAT,
    addAttachment,
    removeAttachment,
    setSignature,
    switchLanguage,
  };
};
