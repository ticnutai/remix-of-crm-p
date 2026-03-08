import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, PencilOff, Plus, Trash2, Palette } from "lucide-react";
import ContractCard from "./ContractCard";
import ContractDetailEditable from "./ContractDetailEditable";
import { DesignEditor } from "./DesignEditor";
import { useDigitalContracts } from "@/hooks/useDigitalContracts";
import { DEFAULT_DESIGN } from "@/types/contract-design";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DigitalContractsTab = () => {
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [isDesignEditorOpen, setIsDesignEditorOpen] = useState(false);
  const [editingDesignForContract, setEditingDesignForContract] = useState<string | null>(null);
  const {
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
  } = useDigitalContracts();

  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  const handleAddContract = () => {
    const newId = addContract();
    setSelectedContractId(newId);
  };

  const handleDeleteContract = (contractId: string) => {
    setContractToDelete(contractId);
  };

  const confirmDeleteContract = () => {
    if (contractToDelete) {
      deleteContract(contractToDelete);
      if (selectedContractId === contractToDelete) {
        setSelectedContractId(null);
      }
      setContractToDelete(null);
    }
  };

  const handleOpenDesignEditor = (contractId: string) => {
    setEditingDesignForContract(contractId);
    setIsDesignEditorOpen(true);
  };

  const currentContract = editingDesignForContract 
    ? contracts.find(c => c.id === editingDesignForContract)
    : null;

  return (
    <div className="space-y-6">
      {/* Edit Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">חוזים דיגיטליים</h2>
          <p className="text-muted-foreground">הצעות מחיר ניתנות לעריכה מלאה</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (selectedContractId) {
                handleOpenDesignEditor(selectedContractId);
              } else if (contracts.length > 0) {
                handleOpenDesignEditor(contracts[0].id);
              }
            }}
            variant="outline"
            className="gap-2"
          >
            <Palette className="w-4 h-4" />
            עיצוב
          </Button>
          <Button
            onClick={() => setIsEditMode(!isEditMode)}
            variant={isEditMode ? "default" : "outline"}
            className={`gap-2 ${isEditMode ? "bg-gold hover:bg-gold-dark text-white" : ""}`}
          >
            {isEditMode ? (
              <>
                <PencilOff className="w-4 h-4" />
                סיים עריכה
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
                מצב עריכה
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Edit Mode Indicator */}
      {isEditMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gold text-white text-center py-2 px-4 rounded-lg text-sm"
          dir="rtl"
        >
          🖊️ מצב עריכה פעיל - לחצו על טקסט כלשהו כדי לערוך אותו
        </motion.div>
      )}
      
      {/* Contract Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map((contract, index) => (
          <div key={contract.id} className="relative group">
            {isEditMode && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteContract(contract.id);
                }}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
            <ContractCard
              title={contract.title}
              subtitle={contract.subtitle}
              price={contract.price}
              icon={contract.icon}
              onClick={() => setSelectedContractId(contract.id)}
              delay={0.1 * (index + 1)}
            />
          </div>
        ))}
        
        {/* Add New Contract Card */}
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * (contracts.length + 1) }}
            onClick={handleAddContract}
            className="cursor-pointer"
          >
            <div className="relative bg-card/50 rounded-2xl p-8 shadow-lg border-2 border-dashed border-gold/50 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-gold min-h-[280px] flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold/20 to-gold-dark/20 flex items-center justify-center">
                <Plus className="w-8 h-8 text-gold" />
              </div>
              <span className="text-lg font-semibold text-gold-dark">הוסף הצעת מחיר חדשה</span>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center"
        dir="rtl"
      >
        <div className="bg-muted/50 rounded-3xl p-6 max-w-3xl mx-auto">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">בס״ד</span>
            {" | "}
            כל המחירים המצוינים אינם כוללים מע״מ כחוק
            {" | "}
            תוקף הצעת המחיר: 30 יום
          </p>
        </div>
      </motion.div>
      
      {/* Contract Detail Modal */}
      {selectedContract && (
        <ContractDetailEditable
          isOpen={!!selectedContractId}
          onClose={() => setSelectedContractId(null)}
          contract={selectedContract}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onUpdateField={(field, value) => updateContract(selectedContract.id, field as keyof typeof selectedContract, value)}
          onUpdateSectionTitle={(sectionId, value) => updateSectionTitle(selectedContract.id, sectionId, value)}
          onUpdateSectionItem={(sectionIndex, itemIndex, value) =>
            updateSectionItem(selectedContract.id, sectionIndex, itemIndex, value)
          }
          onUpdateNote={(noteIndex, value) => updateNote(selectedContract.id, noteIndex, value)}
          onAddSection={() => addSection(selectedContract.id)}
          onDeleteSection={(sectionId) => deleteSection(selectedContract.id, sectionId)}
          onAddSectionItem={(sectionIndex) => addSectionItem(selectedContract.id, sectionIndex)}
          onDeleteSectionItem={(sectionIndex, itemIndex) => deleteSectionItem(selectedContract.id, sectionIndex, itemIndex)}
          onAddNote={() => addNote(selectedContract.id)}
          onDeleteNote={(noteIndex) => deleteNote(selectedContract.id, noteIndex)}
          onUpdateIcon={(icon) => updateContractIcon(selectedContract.id, icon)}
          onUpdatePayment={(paymentIndex, field, value) => updatePayment(selectedContract.id, paymentIndex, field, value)}
          onAddPayment={() => addPayment(selectedContract.id)}
          onDeletePayment={(paymentIndex) => deletePayment(selectedContract.id, paymentIndex)}
          onUpdateStatus={updateStatus}
          onDuplicateContract={duplicateContract}
          onCalculateVAT={calculateVAT}
          onAddAttachment={addAttachment}
          onRemoveAttachment={removeAttachment}
          onSetSignature={setSignature}
          onSwitchLanguage={switchLanguage}
        />
      )}

      {/* Design Editor Dialog */}
      <Dialog open={isDesignEditorOpen} onOpenChange={setIsDesignEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" dir="rtl">
          <DialogHeader>
            <DialogTitle>עורך עיצוב - {currentContract?.title}</DialogTitle>
            <DialogDescription>
              התאם את העיצוב של החוזה לפי הצורך שלך
            </DialogDescription>
          </DialogHeader>
          {currentContract && (
            <DesignEditor
              design={currentContract.design || DEFAULT_DESIGN}
              onChange={(design) => updateContractDesign(currentContract.id, design)}
              onSave={() => {
                setIsDesignEditorOpen(false);
                setEditingDesignForContract(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!contractToDelete} onOpenChange={() => setContractToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הצעת המחיר לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteContract}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DigitalContractsTab;
