// Main Contacts Import Dialog for Backup System
import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileSpreadsheet, 
  Users, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  FileText,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';

import { FieldSelector } from './FieldSelector';
import { ColumnMapper } from './ColumnMapper';
import { ContactsPreview } from './ContactsPreview';
import { 
  ParsedContact, 
  ColumnMapping, 
  ImportStats, 
  FileFormat,
  IMPORT_FIELDS,
} from './types';
import {
  detectFileFormat,
  parseCSV,
  parseVCard,
  autoDetectMapping,
  applyMappingToContacts,
  vCardToContacts,
  normalizePhone,
  normalizeName,
} from './parseHelpers';

type Step = 'upload' | 'fields' | 'mapping' | 'preview' | 'importing' | 'done';

interface ContactsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (stats: ImportStats) => void;
}

export function ContactsImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ContactsImportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<Step>('upload');
  const [fileFormat, setFileFormat] = useState<FileFormat>('unknown');
  const [fileName, setFileName] = useState('');
  
  // CSV specific state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  
  // Import settings
  const [selectedFields, setSelectedFields] = useState<string[]>(
    IMPORT_FIELDS.filter(f => f.selected).map(f => f.key)
  );
  const [matchBy, setMatchBy] = useState<('name' | 'email' | 'phone')[]>(['email', 'phone', 'name']);
  
  // Contacts
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  
  // Progress
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats | null>(null);

  // Reset state
  const resetState = useCallback(() => {
    setStep('upload');
    setFileFormat('unknown');
    setFileName('');
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMapping({});
    setContacts([]);
    setIsLoading(false);
    setImportProgress(0);
    setStats(null);
    setSelectedFields(IMPORT_FIELDS.filter(f => f.selected).map(f => f.key));
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    try {
      const content = await file.text();
      const format = detectFileFormat(content, file.name);
      setFileFormat(format);

      if (format === 'vcard') {
        // vCard doesn't need column mapping
        const vcardContacts = parseVCard(content);
        const parsedContacts = vCardToContacts(vcardContacts);
        setContacts(parsedContacts);
        setStep('fields');
      } else if (format === 'csv' || format === 'google' || format === 'outlook') {
        const { headers, rows } = parseCSV(content);
        setCsvHeaders(headers);
        setCsvRows(rows);
        
        // Auto-detect mapping
        const autoMapping = autoDetectMapping(headers);
        setColumnMapping(autoMapping);
        
        setStep('fields');
      } else {
        toast({
          title: 'פורמט לא נתמך',
          description: 'נא להעלות קובץ CSV או vCard (.vcf)',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'שגיאה בקריאת הקובץ',
        description: 'לא ניתן לקרוא את הקובץ',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Apply mapping and match with existing clients
  const processContacts = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);

    try {
      // For CSV, apply mapping
      let parsedContacts: ParsedContact[];
      
      if (fileFormat === 'vcard') {
        parsedContacts = contacts;
      } else {
        parsedContacts = applyMappingToContacts(csvRows, columnMapping);
      }

      if (parsedContacts.length === 0) {
        toast({
          title: 'לא נמצאו אנשי קשר',
          description: 'בדוק את מיפוי העמודות',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Fetch existing clients for matching
      const { data: existingClients } = await supabase
        .from('clients')
        .select('id, name, email, phone, phone_secondary, name_clean');

      if (existingClients && existingClients.length > 0) {
        // Build lookup maps
        const emailMap = new Map<string, { id: string; name: string }>();
        const phoneMap = new Map<string, { id: string; name: string }>();
        const nameMap = new Map<string, { id: string; name: string }>();

        existingClients.forEach(client => {
          if (client.email) {
            emailMap.set(client.email.toLowerCase(), { id: client.id, name: client.name });
          }
          if (client.phone) {
            phoneMap.set(normalizePhone(client.phone), { id: client.id, name: client.name });
          }
          if (client.phone_secondary) {
            phoneMap.set(normalizePhone(client.phone_secondary), { id: client.id, name: client.name });
          }
          const nameLower = client.name_clean?.toLowerCase() || normalizeName(client.name);
          nameMap.set(nameLower, { id: client.id, name: client.name });
        });

        // Check each contact for matches
        parsedContacts = parsedContacts.map(contact => {
          // Check email match
          if (matchBy.includes('email') && contact.email) {
            const match = emailMap.get(contact.email.toLowerCase());
            if (match) {
              return {
                ...contact,
                matchedClientId: match.id,
                matchedClientName: match.name,
                matchType: 'email' as const,
                action: 'skip' as const,
                selected: false,
              };
            }
          }

          // Check phone match
          if (matchBy.includes('phone') && contact.phone) {
            const match = phoneMap.get(normalizePhone(contact.phone));
            if (match) {
              return {
                ...contact,
                matchedClientId: match.id,
                matchedClientName: match.name,
                matchType: 'phone' as const,
                action: 'skip' as const,
                selected: false,
              };
            }
          }

          // Check name match
          if (matchBy.includes('name') && contact.name) {
            const match = nameMap.get(normalizeName(contact.name));
            if (match) {
              return {
                ...contact,
                matchedClientId: match.id,
                matchedClientName: match.name,
                matchType: 'name' as const,
                action: 'skip' as const,
                selected: false,
              };
            }
          }

          return contact;
        });
      }

      setContacts(parsedContacts);
      setStep('preview');
    } catch (error) {
      console.error('Error processing contacts:', error);
      toast({
        title: 'שגיאה בעיבוד',
        description: 'לא ניתן לעבד את אנשי הקשר',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, fileFormat, contacts, csvRows, columnMapping, matchBy, toast]);

  // Import contacts
  const importContacts = useCallback(async () => {
    if (!user) return;

    const toImport = contacts.filter(c => c.selected && c.action !== 'skip');
    if (toImport.length === 0) {
      toast({
        title: 'אין אנשי קשר לייבוא',
        description: 'בחר לפחות איש קשר אחד',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setIsLoading(true);

    const importStats: ImportStats = {
      total: toImport.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      matched: contacts.filter(c => c.matchType && c.matchType !== 'none').length,
      errors: 0,
    };

    try {
      for (let i = 0; i < toImport.length; i++) {
        const contact = toImport[i];
        setImportProgress(Math.round(((i + 1) / toImport.length) * 100));

        if (contact.action === 'update' && contact.matchedClientId) {
          // Update existing client
          const updates: Record<string, any> = {};
          
          if (contact.phone && selectedFields.includes('phone')) {
            updates.phone = contact.phone;
          }
          if (contact.email && selectedFields.includes('email')) {
            updates.email = contact.email;
          }
          if (contact.company && selectedFields.includes('company')) {
            updates.company = contact.company;
          }
          if (contact.address && selectedFields.includes('address')) {
            updates.address = contact.address;
          }
          if (contact.notes && selectedFields.includes('notes')) {
            updates.notes = contact.notes;
          }

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('clients')
              .update(updates)
              .eq('id', contact.matchedClientId);

            if (error) {
              importStats.errors++;
            } else {
              importStats.updated++;
            }
          } else {
            importStats.skipped++;
          }
        } else {
          // Import as new client
          const insertData: {
            name: string;
            name_clean: string;
            source: string;
            status: string;
            user_id: string;
            created_by: string;
            email?: string;
            phone?: string;
            phone_secondary?: string;
            company?: string;
            position?: string;
            address?: string;
            notes?: string;
          } = {
            name: contact.name,
            name_clean: normalizeName(contact.name),
            source: 'contact_import',
            status: 'active',
            user_id: user.id,
            created_by: user.id,
          };

          if (contact.email && selectedFields.includes('email')) {
            insertData.email = contact.email;
          }
          if (contact.phone && selectedFields.includes('phone')) {
            insertData.phone = contact.phone;
          }
          if (contact.phone2 && selectedFields.includes('phone2')) {
            insertData.phone_secondary = contact.phone2;
          }
          if (contact.company && selectedFields.includes('company')) {
            insertData.company = contact.company;
          }
          if (contact.title && selectedFields.includes('title')) {
            insertData.position = contact.title;
          }
          if (contact.address && selectedFields.includes('address')) {
            insertData.address = contact.address;
          }
          if (contact.notes && selectedFields.includes('notes')) {
            insertData.notes = contact.notes;
          }

          const { error } = await supabase.from('clients').insert(insertData);

          if (error) {
            console.error('Import error:', error);
            importStats.errors++;
          } else {
            importStats.imported++;
          }
        }
      }

      setStats(importStats);
      setStep('done');
      
      toast({
        title: 'הייבוא הושלם',
        description: `${importStats.imported} יובאו, ${importStats.updated} עודכנו`,
      });

      onImportComplete?.(importStats);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'שגיאה בייבוא',
        description: 'אירעה שגיאה בתהליך הייבוא',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, contacts, selectedFields, toast, onImportComplete]);

  // Contact selection handlers
  const handleToggleSelect = (id: string) => {
    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ));
  };

  const handleActionChange = (id: string, action: 'import' | 'update' | 'skip') => {
    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, action, selected: action !== 'skip' } : c
    ));
  };

  const handleSelectAll = (selected: boolean) => {
    setContacts(prev => prev.map(c => ({
      ...c,
      selected: c.matchType && c.matchType !== 'none' ? false : selected,
      action: c.matchType && c.matchType !== 'none' ? 'skip' : (selected ? 'import' : 'skip'),
    })));
  };

  // Navigation
  const canGoNext = () => {
    switch (step) {
      case 'upload': return false;
      case 'fields': return selectedFields.length > 0;
      case 'mapping': return Object.values(columnMapping).some(v => v);
      case 'preview': return contacts.some(c => c.selected);
      default: return false;
    }
  };

  const handleNext = () => {
    switch (step) {
      case 'fields':
        if (fileFormat === 'vcard') {
          processContacts();
        } else {
          setStep('mapping');
        }
        break;
      case 'mapping':
        processContacts();
        break;
      case 'preview':
        importContacts();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'fields':
        setStep('upload');
        break;
      case 'mapping':
        setStep('fields');
        break;
      case 'preview':
        if (fileFormat === 'vcard') {
          setStep('fields');
        } else {
          setStep('mapping');
        }
        break;
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ייבוא אנשי קשר
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'העלה קובץ CSV או vCard לייבוא אנשי קשר'}
            {step === 'fields' && 'בחר אילו שדות לייבא'}
            {step === 'mapping' && 'התאם עמודות מהקובץ לשדות במערכת'}
            {step === 'preview' && 'בדוק והתאם את אנשי הקשר לפני הייבוא'}
            {step === 'importing' && 'מייבא אנשי קשר...'}
            {step === 'done' && 'הייבוא הושלם!'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        {step !== 'upload' && step !== 'done' && (
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={step === 'fields' ? 'default' : 'secondary'}>1. שדות</Badge>
            {fileFormat !== 'vcard' && (
              <Badge variant={step === 'mapping' ? 'default' : 'secondary'}>2. מיפוי</Badge>
            )}
            <Badge variant={step === 'preview' ? 'default' : 'secondary'}>
              {fileFormat === 'vcard' ? '2' : '3'}. תצוגה מקדימה
            </Badge>
          </div>
        )}

        {/* Step content */}
        <div className="py-4">
          {/* Upload step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">העלה קובץ אנשי קשר</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  גרור קובץ לכאן או לחץ לבחירה
                </p>
                <div className="flex justify-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    vCard (.vcf)
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Google Contacts
                  </span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.vcf"
                className="hidden"
                onChange={handleFileUpload}
              />

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  קורא קובץ...
                </div>
              )}
            </div>
          )}

          {/* Fields selection step */}
          {step === 'fields' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{fileName}</span>
                <Badge variant="outline">{fileFormat.toUpperCase()}</Badge>
              </div>

              <FieldSelector
                selectedFields={selectedFields}
                onChange={setSelectedFields}
              />

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-2">התאמה לאנשי קשר קיימים לפי:</h4>
                <div className="flex gap-4">
                  {(['email', 'phone', 'name'] as const).map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={matchBy.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMatchBy([...matchBy, type]);
                          } else {
                            setMatchBy(matchBy.filter(m => m !== type));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {type === 'email' && 'אימייל'}
                        {type === 'phone' && 'טלפון'}
                        {type === 'name' && 'שם'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Column mapping step */}
          {step === 'mapping' && (
            <ColumnMapper
              headers={csvHeaders}
              mapping={columnMapping}
              selectedFields={selectedFields}
              onChange={setColumnMapping}
            />
          )}

          {/* Preview step */}
          {step === 'preview' && (
            <ContactsPreview
              contacts={contacts}
              onToggleSelect={handleToggleSelect}
              onActionChange={handleActionChange}
              onSelectAll={handleSelectAll}
            />
          )}

          {/* Importing step */}
          {step === 'importing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <h3 className="font-medium mb-2">מייבא אנשי קשר...</h3>
              <Progress value={importProgress} className="w-full max-w-xs mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{importProgress}%</p>
            </div>
          )}

          {/* Done step */}
          {step === 'done' && stats && (
            <div className="text-center py-8">
              <Check className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="font-medium text-lg mb-4">הייבוא הושלם!</h3>
              
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                <div className="p-3 rounded-lg bg-accent/50">
                  <div className="text-2xl font-bold text-primary">{stats.imported}</div>
                  <div className="text-xs text-muted-foreground">יובאו</div>
                </div>
                <div className="p-3 rounded-lg bg-accent/50">
                  <div className="text-2xl font-bold text-primary">{stats.updated}</div>
                  <div className="text-xs text-muted-foreground">עודכנו</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{stats.matched}</div>
                  <div className="text-xs text-muted-foreground">התאמות</div>
                </div>
              </div>

              {stats.errors > 0 && (
                <p className="text-sm text-destructive mt-4 flex items-center justify-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {stats.errors} שגיאות
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            {step !== 'upload' && step !== 'importing' && step !== 'done' && (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowRight className="h-4 w-4 ml-2" />
                חזרה
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {step === 'done' ? 'סגור' : 'ביטול'}
            </Button>

            {step !== 'upload' && step !== 'importing' && step !== 'done' && (
              <Button
                onClick={handleNext}
                disabled={!canGoNext() || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                {step === 'preview' ? 'ייבא' : 'המשך'}
                {step !== 'preview' && <ArrowLeft className="h-4 w-4 mr-2" />}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
