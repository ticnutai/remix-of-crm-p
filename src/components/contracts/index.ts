// Contracts Components Index
export { ContractForm } from './ContractForm';
export { ContractDetails } from './ContractDetails';
export { PaymentScheduleView } from './PaymentScheduleView';
export { TemplateSelectDialog } from './TemplateSelectDialog';
export { ContractTemplatesManager } from './ContractTemplatesManager';
export { ContractPartiesEditor } from './ContractPartiesEditor';
export { PaymentScheduleEditor, generatePaymentSchedule } from './PaymentScheduleEditor';
export { TemplateGallery } from './TemplateGallery';
export type { GeneratedContractData } from './TemplateSelectDialog';
export type { PaymentStep, GeneratedPayment } from './PaymentScheduleEditor';

// Advanced Contract Editor
export { AdvancedContractEditor } from './AdvancedContractEditor';
export type { 
  ContractDocument, 
  ContractBlock, 
  BlockType,
  ColorScheme,
  DesignTemplate,
  ViewMode,
} from './AdvancedContractEditor/types';
