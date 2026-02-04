import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Calendar, CreditCard, FileText, AlertCircle, ArrowRight, Download, Plus, Trash2, Building2, Home, Palette, UserPlus, Type, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import EditableText from "./EditableText";
import { ClientSelector } from "./ClientSelector";
import { TextStyleEditor } from "./TextStyleEditor";
import { AdditionalInfoEditor } from "./AdditionalInfoEditor";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { StatusSelector } from "./StatusSelector";
import { VATCalculator } from "./VATCalculator";
import { ContractDuplicator } from "./ContractDuplicator";
import { ContractEmailSender } from "./ContractEmailSender";
import { TemplateSelector } from "./TemplateSelector";
import { ContractSignature } from "./ContractSignature";
import { PaymentReminders } from "./PaymentReminders";
import { AttachmentManager } from "./AttachmentManager";
import { ContractHistory } from "./ContractHistory";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { DigitalContractData } from "@/hooks/useDigitalContracts";
import { exportContractToPdf } from "@/utils/exportContractToPdf";
import { DEFAULT_DESIGN, ContractDesign } from "@/types/contract-design";
import { toast } from "sonner";
import { useState } from "react";

interface ContractDetailEditableProps {
  isOpen: boolean;
  onClose: () => void;
  contract: DigitalContractData;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onUpdateField: (field: keyof DigitalContractData, value: string) => void;
  onUpdateSectionTitle: (sectionId: string, value: string) => void;
  onUpdateSectionItem: (sectionIndex: number, itemIndex: number, value: string) => void;
  onUpdateNote: (noteIndex: number, value: string) => void;
  onAddSection: () => void;
  onDeleteSection: (sectionId: string) => void;
  onAddSectionItem: (sectionIndex: number) => void;
  onDeleteSectionItem: (sectionIndex: number, itemIndex: number) => void;
  onAddNote: () => void;
  onDeleteNote: (noteIndex: number) => void;
  onUpdateIcon: (icon: "building" | "home" | "document") => void;
  onUpdatePayment: (paymentIndex: number, field: 'percentage' | 'description', value: string) => void;
  onAddPayment: () => void;
  onDeletePayment: (paymentIndex: number) => void;
  onUpdateStatus?: (contractId: string, status: "draft" | "sent" | "approved" | "in_progress" | "completed" | "cancelled") => void;
  onDuplicateContract?: (contractId: string) => string | null;
  onCalculateVAT?: (contractId: string, includeVAT: boolean) => void;
  onAddAttachment?: (contractId: string, attachmentUrl: string) => void;
  onRemoveAttachment?: (contractId: string, attachmentIndex: number) => void;
  onSetSignature?: (contractId: string, signatureData: string, signerName: string) => void;
  onSwitchLanguage?: (contractId: string, language: "he" | "en") => void;
}

const iconOptions = [
  { value: "home" as const, label: "בית", Icon: Home },
  { value: "building" as const, label: "בניין", Icon: Building2 },
  { value: "document" as const, label: "מסמך", Icon: FileText },
];

const ContractDetailEditable = ({
  isOpen,
  onClose,
  contract,
  isEditMode,
  onToggleEditMode,
  onUpdateField,
  onUpdateSectionTitle,
  onUpdateSectionItem,
  onUpdateNote,
  onAddSection,
  onDeleteSection,
  onAddSectionItem,
  onDeleteSectionItem,
  onAddNote,
  onDeleteNote,
  onUpdateIcon,
  onUpdatePayment,
  onAddPayment,
  onDeletePayment,
  onUpdateStatus,
  onDuplicateContract,
  onCalculateVAT,
  onAddAttachment,
  onRemoveAttachment,
  onSetSignature,
  onSwitchLanguage,
}: ContractDetailEditableProps) => {
  const design = contract.design || DEFAULT_DESIGN;
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [localFontSize, setLocalFontSize] = useState(16);
  const [localFontFamily, setLocalFontFamily] = useState(design.fontFamily || "Assistant");
  const [textStyle, setTextStyle] = useState({
    fontSize: 16,
    fontFamily: design.fontFamily || "Assistant",
    fontWeight: "400",
    lineHeight: 1.5,
    letterSpacing: 0,
    color: design.textColor || "#000000",
  });

  // חישוב סכומים לפי אחוזים
  const calculatePaymentAmount = (percentage: string, totalPrice: string): string => {
    // ניקוי המחרוזת ממטבע וסימנים
    const cleanPrice = totalPrice.replace(/[^\d.]/g, '');
    const cleanPercent = percentage.replace(/[^\d.]/g, '');
    
    const priceNum = parseFloat(cleanPrice);
    const percentNum = parseFloat(cleanPercent);
    
    if (isNaN(priceNum) || isNaN(percentNum) || priceNum === 0) {
      return '';
    }
    
    const amount = (priceNum * percentNum) / 100;
    return `₪${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleClientSelect = (client: any) => {
    // עדכון שם הלקוח
    if (client.name) {
      onUpdateField("title", `הצעת מחיר עבור ${client.name}`);
    }
    
    // עדכון פרטי חברה/כתובת
    if (client.company || client.address) {
      const locationParts = [];
      if (client.company) locationParts.push(client.company);
      if (client.address) locationParts.push(client.address);
      onUpdateField("location", locationParts.join(", "));
    }

    // עדכון טלפון ואימייל בהערות
    if (client.phone || client.email) {
      const contactNote = `פרטי התקשרות: ${client.phone || ""} ${client.email ? `| ${client.email}` : ""}`.trim();
      toast.success("פרטי הלקוח עודכנו בהצלחה");
    }
  };

  const handleAdditionalInfo = (info: any) => {
    // בניית מחרוזת מידע נוסף
    const infoParts = [];
    if (info.gush) infoParts.push(`גוש: ${info.gush}`);
    if (info.helka) infoParts.push(`חלקה: ${info.helka}`);
    if (info.magash) infoParts.push(`מגרש: ${info.magash}`);
    if (info.area) infoParts.push(`שטח: ${info.area} מ״ר`);
    if (info.buildingRights) infoParts.push(`זכויות בניה: ${info.buildingRights}`);
    if (info.zoning) infoParts.push(`ייעוד: ${info.zoning}`);
    
    // הוספת שדות מותאמים אישית
    if (info.customFields) {
      Object.entries(info.customFields).forEach(([key, value]) => {
        infoParts.push(`${key}: ${value}`);
      });
    }

    // עדכון הכתובת/מיקום עם המידע הנוסף
    const currentLocation = contract.location || '';
    const newLocation = currentLocation 
      ? `${currentLocation} | ${infoParts.join(', ')}`
      : infoParts.join(', ');
    
    onUpdateField("location", newLocation);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background z-50 shadow-2xl flex flex-col"
            style={{
              backgroundColor: design.backgroundColor,
              color: design.textColor,
              fontFamily: localFontFamily,
              fontSize: `${localFontSize}px`,
            }}
          >
            {/* Header */}
            <div 
              className="sticky top-0 p-6 text-white z-10"
              style={{
                background: design.headerBgColor,
                color: design.headerTextColor,
                padding: design.headerPadding,
                fontFamily: design.headerFontFamily,
              }}
            >
              <div className="flex items-start justify-between" dir="rtl">
                <div className="flex-1">
                  {/* Icon selector in edit mode */}
                  {isEditMode && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <button
                        onClick={() => setIsClientSelectorOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        בחר לקוח
                      </button>
                      
                      {/* Additional Info Editor */}
                      <AdditionalInfoEditor onSave={handleAdditionalInfo} />
                      
                      {/* Text Style Editor */}
                      <TextStyleEditor
                        value={textStyle}
                        onChange={(style) => {
                          setTextStyle(style);
                          setLocalFontSize(style.fontSize);
                          setLocalFontFamily(style.fontFamily);
                        }}
                      />

                      <button
                        onClick={onToggleEditMode}
                        className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        סיים עריכה
                      </button>
                      {iconOptions.map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          onClick={() => onUpdateIcon(value)}
                          className={`p-2 rounded-lg transition-colors ${
                            contract.icon === value
                              ? "bg-white/30"
                              : "bg-white/10 hover:bg-white/20"
                          }`}
                          title={label}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  )}
                  <h2 className="text-2xl font-bold mb-2">
                    <EditableText
                      value={contract.title}
                      onChange={(v) => onUpdateField("title", v)}
                      isEditMode={isEditMode}
                    />
                  </h2>
                  <p className="text-white/80 text-sm mb-1">
                    <EditableText
                      value={contract.subtitle}
                      onChange={(v) => onUpdateField("subtitle", v)}
                      isEditMode={isEditMode}
                    />
                  </p>
                  <p className="text-white/70 text-xs">
                    <EditableText
                      value={contract.location}
                      onChange={(v) => onUpdateField("location", v)}
                      isEditMode={isEditMode}
                    />
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 flex items-baseline gap-2 justify-end" dir="rtl">
                <span className="text-white/70">+ מע״מ</span>
                <span className="text-3xl font-bold">
                  <EditableText
                    value={contract.price}
                    onChange={(v) => onUpdateField("price", v)}
                    isEditMode={isEditMode}
                  />
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0" dir="rtl" style={{ textAlign: 'right' }}>
              {/* Sections */}
              {contract.sections.map((section, sectionIndex) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIndex * 0.1 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-3 mb-4" style={{ flexDirection: 'row-reverse' }}>
                    {isEditMode && (
                      <button
                        onClick={() => onDeleteSection(section.id)}
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        title="מחק סעיף"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <h3 className="text-lg font-bold text-foreground flex-1 text-right">
                      <EditableText
                        value={section.title}
                        onChange={(v) => onUpdateSectionTitle(section.id, v)}
                        isEditMode={isEditMode}
                      />
                    </h3>
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gold-dark" />
                    </div>
                  </div>
                  <div className="space-y-3 pl-11">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3 group" style={{ flexDirection: 'row-reverse' }}>
                        {isEditMode && (
                          <button
                            onClick={() => onDeleteSectionItem(sectionIndex, itemIndex)}
                            className="p-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
                            title="מחק פריט"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <span className="text-muted-foreground text-sm leading-relaxed flex-1 text-right">
                          <EditableText
                            value={item}
                            onChange={(v) => onUpdateSectionItem(sectionIndex, itemIndex, v)}
                            isEditMode={isEditMode}
                          />
                        </span>
                        <Check className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                      </div>
                    ))}
                    {isEditMode && (
                      <button
                        onClick={() => onAddSectionItem(sectionIndex)}
                        className="flex items-center gap-2 text-sm text-gold hover:text-gold-dark transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        הוסף פריט
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Add Section Button */}
              {isEditMode && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={onAddSection}
                  className="w-full mb-8 p-4 border-2 border-dashed border-gold/30 rounded-xl text-gold hover:border-gold hover:bg-gold/5 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  הוסף סעיף חדש
                </motion.button>
              )}
              
              {/* Payment Schedule */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-4" style={{ flexDirection: 'row-reverse' }}>
                  {isEditMode && (
                    <button
                      onClick={onAddPayment}
                      className="p-1.5 rounded-lg bg-gold/10 text-gold-dark hover:bg-gold/20 transition-colors"
                      title="הוסף תשלום"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <h3 className="text-lg font-bold text-foreground">לוח תשלומים</h3>
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-gold-dark" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pr-11">
                  {contract.payments.map((payment, index) => (
                    <div key={index} className="bg-muted rounded-xl p-4 text-center relative group">
                      {isEditMode && (
                        <button
                          onClick={() => onDeletePayment(index)}
                          className="absolute -top-2 -left-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      {isEditMode ? (
                        <div className="space-y-2">
                          <Input
                            value={payment.percentage}
                            onChange={(e) => onUpdatePayment(index, 'percentage', e.target.value)}
                            className="text-center text-lg font-bold h-8 bg-background"
                            placeholder="25%"
                          />
                          <Input
                            value={payment.description}
                            onChange={(e) => onUpdatePayment(index, 'description', e.target.value)}
                            className="text-center text-xs h-7 bg-background"
                            placeholder="תיאור"
                          />
                          {contract.price && (
                            <div className="text-xs font-semibold text-gold-dark mt-1">
                              {calculatePaymentAmount(payment.percentage, contract.price)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-gold-dark mb-2">{payment.percentage}</div>
                          <div className="text-xs text-muted-foreground mb-2">{payment.description}</div>
                          {contract.price && (
                            <div className="text-sm font-semibold text-primary">
                              {calculatePaymentAmount(payment.percentage, contract.price)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* Timeline */}
              {contract.timeline && contract.timeline.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-3 mb-4" style={{ flexDirection: 'row-reverse' }}>
                    <h3 className="text-lg font-bold text-foreground">לוח זמנים</h3>
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-gold-dark" />
                    </div>
                  </div>
                  <div className="space-y-3 pr-11">
                    {contract.timeline.map((item, index) => (
                      <div key={index} className="flex items-center gap-3" style={{ flexDirection: 'row-reverse' }}>
                        <span className="text-muted-foreground text-sm flex-1 text-right">{item}</span>
                        <div className="w-6 h-6 rounded-full bg-gold/20 text-gold-dark text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-4" style={{ flexDirection: 'row-reverse' }}>
                  <h3 className="text-lg font-bold text-foreground">הערות חשובות</h3>
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-gold-dark" />
                  </div>
                </div>
                <div className="space-y-3 pr-11">
                  {contract.notes.map((note, index) => (
                    <div key={index} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 group" style={{ flexDirection: 'row-reverse' }}>
                      {isEditMode && (
                        <button
                          onClick={() => onDeleteNote(index)}
                          className="p-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
                          title="מחק הערה"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-muted-foreground text-sm leading-relaxed flex-1 text-right">
                        <EditableText
                          value={note}
                          onChange={(v) => onUpdateNote(index, v)}
                          isEditMode={isEditMode}
                        />
                      </span>
                      <ArrowRight className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    </div>
                  ))}
                  {isEditMode && (
                    <button
                      onClick={onAddNote}
                      className="flex items-center gap-2 text-sm text-gold hover:text-gold-dark transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      הוסף הערה
                    </button>
                  )}
                </div>
              </motion.div>

              {/* New Features Section */}
              <div className="space-y-4 mt-8">
                {/* Status Badge and Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-3 mb-3" style={{ flexDirection: 'row-reverse' }}>
                    <ContractStatusBadge status={contract.status} />
                  </div>
                  {isEditMode && onUpdateStatus && (
                    <StatusSelector
                      contractId={contract.id}
                      currentStatus={contract.status}
                      onStatusChange={onUpdateStatus}
                    />
                  )}
                </motion.div>

                {/* VAT Calculator */}
                {isEditMode && onCalculateVAT && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                  >
                    <VATCalculator
                      contractId={contract.id}
                      price={contract.price}
                      vatIncluded={contract.vatIncluded}
                      vatAmount={contract.vatAmount}
                      onCalculate={onCalculateVAT}
                    />
                  </motion.div>
                )}

                {/* Contract Duplicator */}
                {isEditMode && onDuplicateContract && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <ContractDuplicator
                      contractId={contract.id}
                      contractTitle={contract.title}
                      onDuplicate={onDuplicateContract}
                    />
                  </motion.div>
                )}

                {/* Email Sender */}
                {onUpdateStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                  >
                    <ContractEmailSender
                      contractId={contract.id}
                      contractTitle={contract.title}
                      clientEmail={contract.clientEmail}
                      onEmailChange={onUpdateField}
                      onStatusChange={onUpdateStatus}
                    />
                  </motion.div>
                )}

                {/* Signature */}
                {onSetSignature && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <ContractSignature
                      contractId={contract.id}
                      signatureData={contract.signatureData}
                      signedBy={contract.signedBy}
                      signedAt={contract.signedAt}
                      onSign={onSetSignature}
                    />
                  </motion.div>
                )}

                {/* Payment Reminders */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 }}
                >
                  <PaymentReminders
                    contractId={contract.id}
                    payments={contract.payments}
                    clientEmail={contract.clientEmail}
                    contractTitle={contract.title}
                  />
                </motion.div>

                {/* Attachment Manager */}
                {onAddAttachment && onRemoveAttachment && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <AttachmentManager
                      contractId={contract.id}
                      attachments={contract.attachments}
                      onAddAttachment={onAddAttachment}
                      onRemoveAttachment={onRemoveAttachment}
                    />
                  </motion.div>
                )}

                {/* History */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95 }}
                >
                  <ContractHistory
                    contractId={contract.id}
                    createdAt={contract.createdAt}
                    updatedAt={contract.updatedAt}
                    sentAt={contract.sentAt}
                    approvedAt={contract.approvedAt}
                    signedAt={contract.signedAt}
                    signedBy={contract.signedBy}
                  />
                </motion.div>

                {/* Language Switcher */}
                {isEditMode && onSwitchLanguage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <LanguageSwitcher
                      contractId={contract.id}
                      currentLanguage={contract.language}
                      onLanguageChange={onSwitchLanguage}
                    />
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-border p-4 flex-shrink-0" dir="rtl" style={{ backgroundColor: design.backgroundColor }}>
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-sm text-muted-foreground">
                  תוקף הצעת המחיר: 30 יום
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={onClose}
                    className="bg-gradient-to-l from-gold-dark to-gold hover:from-gold hover:to-gold-dark text-white"
                  >
                    סגור
                  </Button>
                  <Button 
                    onClick={async () => {
                      const filename = contract.title.replace(/\s+/g, "-");
                      toast.loading("יוצר PDF...", { id: "pdf-export" });
                      try {
                        await exportContractToPdf(contract, filename);
                        toast.success("הקובץ הורד בהצלחה", {
                          id: "pdf-export",
                          description: `${filename}.pdf`,
                        });
                      } catch (error) {
                        toast.error("שגיאה ביצירת ה-PDF", { id: "pdf-export" });
                      }
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    הורד PDF
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Client Selector Dialog */}
          <ClientSelector
            isOpen={isClientSelectorOpen}
            onClose={() => setIsClientSelectorOpen(false)}
            onSelectClient={handleClientSelect}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default ContractDetailEditable;
