import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ColumnMapping {
  transaction_date: string;
  value_date: string;
  description: string;
  reference_number: string;
  debit: string;
  credit: string;
  balance: string;
}

interface ParsedRow {
  [key: string]: string | number | null;
}

interface BankTransactionsImportProps {
  onImportComplete: () => void;
}

const HEBREW_COLUMN_NAMES: Record<keyof ColumnMapping, string> = {
  transaction_date: 'תאריך תנועה',
  value_date: 'תאריך ערך',
  description: 'תיאור',
  reference_number: 'אסמכתא',
  debit: 'חובה',
  credit: 'זכות',
  balance: 'יתרה',
};

// Common column name patterns for auto-detection
const COLUMN_PATTERNS: Record<keyof ColumnMapping, string[]> = {
  transaction_date: ['תאריך', 'תאריך תנועה', 'date', 'transaction date'],
  value_date: ['תאריך ערך', 'value date'],
  description: ['תיאור', 'פרטים', 'description', 'details'],
  reference_number: ['אסמכתא', 'reference', 'ref'],
  debit: ['חובה', 'debit', 'משיכה'],
  credit: ['זכות', 'credit', 'הפקדה'],
  balance: ['יתרה', 'balance'],
};

export function BankTransactionsImport({ onImportComplete }: BankTransactionsImportProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    transaction_date: '',
    value_date: '',
    description: '',
    reference_number: '',
    debit: '',
    credit: '',
    balance: '',
  });
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const autoDetectColumns = useCallback((headerRow: string[]) => {
    const newMapping: ColumnMapping = {
      transaction_date: '',
      value_date: '',
      description: '',
      reference_number: '',
      debit: '',
      credit: '',
      balance: '',
    };

    headerRow.forEach((header) => {
      const normalizedHeader = header.toLowerCase().trim();
      
      (Object.keys(COLUMN_PATTERNS) as Array<keyof ColumnMapping>).forEach((key) => {
        if (!newMapping[key]) {
          const patterns = COLUMN_PATTERNS[key];
          if (patterns.some(pattern => normalizedHeader.includes(pattern.toLowerCase()))) {
            newMapping[key] = header;
          }
        }
      });
    });

    setColumnMapping(newMapping);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        toast.error('הקובץ ריק או לא מכיל מספיק נתונים');
        return;
      }

      const headerRow = (jsonData[0] as unknown as string[]).map(h => String(h || '').trim());
      const dataRows = jsonData.slice(1).map(row => {
        const rowData: ParsedRow = {};
        const rowArray = row as unknown as (string | number | null)[];
        headerRow.forEach((header, index) => {
          rowData[header] = rowArray[index];
        });
        return rowData;
      }).filter(row => Object.values(row).some(v => v !== null && v !== ''));

      setHeaders(headerRow);
      setRows(dataRows);
      autoDetectColumns(headerRow);
      setStep('mapping');
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('שגיאה בקריאת הקובץ');
    }
  };

  const parseDate = (value: unknown): string | null => {
    if (!value) return null;
    
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    
    const strValue = String(value);
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = strValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try YYYY-MM-DD format
    const yyyymmdd = strValue.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (yyyymmdd) {
      const [, year, month, day] = yyyymmdd;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try Excel serial number
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue > 30000 && numValue < 50000) {
      const date = new Date((numValue - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    return null;
  };

  const parseNumber = (value: unknown): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    
    const strValue = String(value)
      .replace(/[,₪\s]/g, '')
      .replace(/[()]/g, '-');
    
    const num = parseFloat(strValue);
    return isNaN(num) ? 0 : Math.abs(num);
  };

  const handleImport = async () => {
    if (!user) {
      toast.error('יש להתחבר למערכת');
      return;
    }

    if (!columnMapping.transaction_date || !columnMapping.description) {
      toast.error('יש למפות לפחות את עמודות התאריך והתיאור');
      return;
    }

    setImporting(true);

    try {
      const transactions = rows.map(row => {
        const transactionDate = parseDate(row[columnMapping.transaction_date]);
        if (!transactionDate) return null;

        return {
          user_id: user.id,
          transaction_date: transactionDate,
          value_date: columnMapping.value_date ? parseDate(row[columnMapping.value_date]) : null,
          description: String(row[columnMapping.description] || ''),
          reference_number: columnMapping.reference_number ? String(row[columnMapping.reference_number] || '') : null,
          debit: columnMapping.debit ? parseNumber(row[columnMapping.debit]) : 0,
          credit: columnMapping.credit ? parseNumber(row[columnMapping.credit]) : 0,
          balance: columnMapping.balance ? parseNumber(row[columnMapping.balance]) : null,
          bank_name: bankName || null,
          account_number: accountNumber || null,
          source_file: file?.name || null,
        };
      }).filter(t => t !== null);

      if (transactions.length === 0) {
        toast.error('לא נמצאו תנועות תקינות לייבוא');
        setImporting(false);
        return;
      }

      const { error } = await supabase
        .from('bank_transactions')
        .insert(transactions);

      if (error) throw error;

      toast.success(`יובאו ${transactions.length} תנועות בהצלחה!`);
      setOpen(false);
      resetState();
      onImportComplete();
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast.error('שגיאה בייבוא התנועות');
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setColumnMapping({
      transaction_date: '',
      value_date: '',
      description: '',
      reference_number: '',
      debit: '',
      credit: '',
      balance: '',
    });
    setBankName('');
    setAccountNumber('');
    setStep('upload');
  };

  const previewRows = rows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          ייבוא תנועות בנק
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            ייבוא תנועות בנק מקובץ Excel
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium">בחר קובץ Excel או CSV</span>
                <p className="text-sm text-muted-foreground mt-1">
                  גרור קובץ לכאן או לחץ לבחירה
                </p>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank-name">שם הבנק (אופציונלי)</Label>
                <Input
                  id="bank-name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="לדוגמה: הפועלים, לאומי..."
                />
              </div>
              <div>
                <Label htmlFor="account-number">מספר חשבון (אופציונלי)</Label>
                <Input
                  id="account-number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="4 ספרות אחרונות..."
                />
              </div>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-primary" />
              <span className="text-sm">
                נמצאו {rows.length} שורות בקובץ. התאם את העמודות:
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(HEBREW_COLUMN_NAMES) as Array<keyof ColumnMapping>).map((field) => (
                <div key={field}>
                  <Label className="flex items-center gap-1">
                    {HEBREW_COLUMN_NAMES[field]}
                    {(field === 'transaction_date' || field === 'description') && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <Select
                    value={columnMapping[field]}
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [field]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר עמודה..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">לא נבחר</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                חזרה
              </Button>
              <Button onClick={() => setStep('preview')} disabled={!columnMapping.transaction_date || !columnMapping.description}>
                תצוגה מקדימה
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg">
              <Check className="h-5 w-5" />
              <span className="text-sm">
                {rows.length} תנועות מוכנות לייבוא
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>תאריך</TableHead>
                    <TableHead>תיאור</TableHead>
                    <TableHead>חובה</TableHead>
                    <TableHead>זכות</TableHead>
                    <TableHead>יתרה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{parseDate(row[columnMapping.transaction_date]) || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {String(row[columnMapping.description] || '-')}
                      </TableCell>
                      <TableCell className="text-destructive">
                        {columnMapping.debit && parseNumber(row[columnMapping.debit]) > 0 
                          ? `₪${parseNumber(row[columnMapping.debit]).toLocaleString()}` 
                          : '-'}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {columnMapping.credit && parseNumber(row[columnMapping.credit]) > 0 
                          ? `₪${parseNumber(row[columnMapping.credit]).toLocaleString()}` 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {columnMapping.balance 
                          ? `₪${parseNumber(row[columnMapping.balance]).toLocaleString()}`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {rows.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                מציג 5 מתוך {rows.length} תנועות
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                חזרה למיפוי
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? 'מייבא...' : `ייבא ${rows.length} תנועות`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
