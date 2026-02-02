// CSV Contacts Import Component
import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  FileSpreadsheet, 
  Search,
  UserPlus,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  RefreshCw,
  Tag,
  LayoutGrid,
  LayoutList,
  Table,
  Download,
  FileJson,
  FileText,
  FileType,
  Filter,
  User,
  AtSign,
  Hash,
  Settings2,
  ArrowLeft,
  ArrowRight,
  Eye,
  Columns,
} from 'lucide-react';
import { useContactsImport, ParsedContact, ImportProgress, ColumnMapping } from '@/hooks/useContactsImport';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ViewMode = 'cards' | 'list' | 'compact';
type ImportStep = 'upload' | 'mapping' | 'preview';

// Filter types for smart filtering
interface ContactFilters {
  hasName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasOrganization: boolean;
  hasDuplicate: boolean;
  isNew: boolean;
}

// Field definitions for mapping
const MAPPING_FIELDS = [
  { key: 'firstName', label: 'שם פרטי', icon: User },
  { key: 'lastName', label: 'שם משפחה', icon: User },
  { key: 'fullName', label: 'שם מלא', icon: User },
  { key: 'email1', label: 'מייל ראשי', icon: Mail },
  { key: 'email2', label: 'מייל משני', icon: Mail },
  { key: 'phone1', label: 'טלפון ראשי', icon: Phone },
  { key: 'phone2', label: 'טלפון משני', icon: Phone },
  { key: 'organization', label: 'ארגון / חברה', icon: Building2 },
  { key: 'title', label: 'תפקיד', icon: Tag },
  { key: 'notes', label: 'הערות', icon: FileText },
  { key: 'labels', label: 'תוויות', icon: Tag },
] as const;

interface ContactsCSVImportProps {
  onImportComplete?: () => void;
}

export function ContactsCSVImport({ onImportComplete }: ContactsCSVImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showFilters, setShowFilters] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('upload');
  const [filters, setFilters] = useState<ContactFilters>({
    hasName: false,
    hasEmail: false,
    hasPhone: false,
    hasOrganization: false,
    hasDuplicate: false,
    isNew: false,
  });
  const {
    parsedContacts,
    isLoading,
    isImporting,
    importStats,
    importProgress,
    selectionStats,
    hasSavedState,
    csvHeaders,
    rawCsvRows,
    columnMapping,
    parseFile,
    setColumnMapping,
    applyMapping,
    toggleContactSelection,
    setContactAction,
    toggleSelectAll,
    importContacts,
    resumeImport,
    restoreSavedState,
    reset,
  } = useContactsImport();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await parseFile(file);
      if (result && result.length > 0) {
        // If we have headers, go to mapping step
        setImportStep('mapping');
      }
    }
  };

  const handleApplyMapping = async () => {
    await applyMapping();
    setImportStep('preview');
  };

  const handleBackToMapping = () => {
    setImportStep('mapping');
  };

  const handleImport = async () => {
    await importContacts();
    onImportComplete?.();
  };

  const handleResumeImport = async () => {
    await resumeImport();
    onImportComplete?.();
  };

  const handleReset = () => {
    reset();
    setImportStep('upload');
  };

  // Update a single column mapping
  const updateColumnMapping = (field: keyof ColumnMapping, csvColumn: string) => {
    setColumnMapping({
      ...columnMapping,
      [field]: csvColumn === '__none__' ? '' : csvColumn,
    });
  };

  // Apply filters and search
  const filteredContacts = useMemo(() => {
    let result = parsedContacts;
    
    // Apply smart filters (additive - AND logic)
    const activeFilters = Object.entries(filters).filter(([_, active]) => active);
    if (activeFilters.length > 0) {
      result = result.filter(contact => {
        // All active filters must match
        return activeFilters.every(([filterKey]) => {
          switch (filterKey) {
            case 'hasName':
              return contact.fullName && contact.fullName.trim().length > 0;
            case 'hasEmail':
              return contact.email1 || contact.email2;
            case 'hasPhone':
              return contact.phone1 || contact.phone2;
            case 'hasOrganization':
              return contact.organization && contact.organization.trim().length > 0;
            case 'hasDuplicate':
              return contact.isDuplicate;
            case 'isNew':
              return !contact.isDuplicate && !contact.isImported;
            default:
              return true;
          }
        });
      });
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.fullName.toLowerCase().includes(query) ||
        c.email1?.toLowerCase().includes(query) ||
        c.email2?.toLowerCase().includes(query) ||
        c.phone1?.includes(searchQuery) ||
        c.phone2?.includes(searchQuery) ||
        c.organization?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [parsedContacts, searchQuery, filters]);

  // Toggle a filter
  const toggleFilter = (key: keyof ContactFilters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Count contacts matching each filter
  const filterCounts = useMemo(() => ({
    hasName: parsedContacts.filter(c => c.fullName && c.fullName.trim().length > 0).length,
    hasEmail: parsedContacts.filter(c => c.email1 || c.email2).length,
    hasPhone: parsedContacts.filter(c => c.phone1 || c.phone2).length,
    hasOrganization: parsedContacts.filter(c => c.organization && c.organization.trim().length > 0).length,
    hasDuplicate: parsedContacts.filter(c => c.isDuplicate).length,
    isNew: parsedContacts.filter(c => !c.isDuplicate && !c.isImported).length,
  }), [parsedContacts]);

  // Active filter count
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Export functions
  const exportToCSV = () => {
    const headers = ['שם', 'מייל ראשי', 'מייל משני', 'טלפון ראשי', 'טלפון משני', 'ארגון', 'תפקיד', 'תוויות'];
    const rows = parsedContacts.map(c => [
      c.fullName,
      c.email1,
      c.email2,
      c.phone1,
      c.phone2,
      c.organization,
      c.title,
      c.labels,
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    downloadFile(csvContent, 'contacts.csv', 'text/csv;charset=utf-8');
  };

  const exportToJSON = () => {
    const data = parsedContacts.map(c => ({
      name: c.fullName,
      emails: [c.email1, c.email2].filter(Boolean),
      phones: [c.phone1, c.phone2].filter(Boolean),
      organization: c.organization,
      title: c.title,
      labels: c.labels,
    }));
    downloadFile(JSON.stringify(data, null, 2), 'contacts.json', 'application/json');
  };

  const exportToVCard = () => {
    const vcards = parsedContacts.map(c => {
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${c.fullName}`,
        `N:${c.lastName};${c.firstName};${c.middleName};;`,
      ];
      if (c.email1) lines.push(`EMAIL;TYPE=INTERNET:${c.email1}`);
      if (c.email2) lines.push(`EMAIL;TYPE=INTERNET:${c.email2}`);
      if (c.phone1) lines.push(`TEL;TYPE=CELL:${c.phone1}`);
      if (c.phone2) lines.push(`TEL;TYPE=CELL:${c.phone2}`);
      if (c.organization) lines.push(`ORG:${c.organization}`);
      if (c.title) lines.push(`TITLE:${c.title}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }).join('\n\n');
    
    downloadFile(vcards, 'contacts.vcf', 'text/vcard');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob(['\ufeff' + content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Step 1: Upload
  if (importStep === 'upload') {
    return (
      <div className="space-y-4" dir="rtl">
        {/* Resume alert if there's saved state */}
        {hasSavedState && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <span>נמצא ייבוא שלא הושלם. רוצה להמשיך?</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem('contacts-import-state');
                    window.location.reload();
                  }}
                >
                  התחל מחדש
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    restoreSavedState();
                    setImportStep('preview');
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-3 w-3 ml-1" />
                  המשך ייבוא
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-medium mb-2">ייבוא אנשי קשר מקובץ CSV</h3>
          <p className="text-sm text-muted-foreground mb-4">
            תומך בפורמט ייצוא של Google Contacts
          </p>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isLoading ? 'טוען...' : 'בחר קובץ CSV'}
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Mapping
  if (importStep === 'mapping') {
    return (
      <div className="space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Columns className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">מיפוי עמודות</h3>
            <Badge variant="outline">{csvHeaders.length} עמודות נמצאו</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" />
            בטל
          </Button>
        </div>

        {/* Instructions */}
        <Alert>
          <Settings2 className="h-4 w-4" />
          <AlertDescription>
            בחר לאיזה שדה כל עמודה מה-CSV מתאימה. המערכת זיהתה אוטומטית חלק מהעמודות.
          </AlertDescription>
        </Alert>

        {/* CSV Preview - first 3 rows */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">תצוגה מקדימה של הנתונים</span>
          </div>
          <ScrollArea className="max-h-[150px]">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 sticky top-0">
                <tr>
                  {csvHeaders.map((header, idx) => (
                    <th key={idx} className="p-2 text-right border-b font-medium whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawCsvRows.slice(0, 3).map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b">
                    {csvHeaders.map((header, colIdx) => (
                      <td key={colIdx} className="p-2 text-right whitespace-nowrap max-w-[150px] truncate">
                        {row[header] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>

        {/* Column Mapping */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            מיפוי שדות
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MAPPING_FIELDS.map(field => {
              const Icon = field.icon;
              const currentValue = columnMapping[field.key as keyof typeof columnMapping];
              return (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {field.label}
                  </label>
                  <Select
                    value={currentValue || '__none__'}
                    onValueChange={(value) => updateColumnMapping(field.key as keyof typeof columnMapping, value)}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="בחר עמודה..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- לא נבחר --</SelectItem>
                      {csvHeaders.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentValue && (
                    <p className="text-xs text-muted-foreground truncate">
                      דוגמה: {rawCsvRows[0]?.[currentValue] || '-'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button variant="outline" onClick={handleReset}>
            <ArrowRight className="h-4 w-4 ml-1" />
            חזרה
          </Button>
          <Button onClick={handleApplyMapping} disabled={isLoading}>
            {isLoading ? 'מעבד...' : 'החל מיפוי והמשך'}
            <ArrowLeft className="h-4 w-4 mr-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Preview and Import
  return (
    <div className="space-y-4" dir="rtl">
      {/* Header with stats */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">
            <Users className="h-3 w-3 mr-1" />
            {selectionStats.total} אנשי קשר
          </Badge>
          {selectionStats.duplicates > 0 && (
            <Badge variant="secondary" className="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30">
              <AlertCircle className="h-3 w-3 mr-1" />
              {selectionStats.duplicates} כפילויות
            </Badge>
          )}
          {selectionStats.toUpdate > 0 && (
            <Badge variant="secondary" className="text-blue-600 bg-blue-100 dark:bg-blue-900/30">
              <RefreshCw className="h-3 w-3 mr-1" />
              {selectionStats.toUpdate} לעדכון
            </Badge>
          )}
          {selectionStats.imported > 0 && (
            <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {selectionStats.imported} יובאו
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                ייצוא
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <FileText className="h-4 w-4 mr-2" />
                ייצוא ל-CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToJSON}>
                <FileJson className="h-4 w-4 mr-2" />
                ייצוא ל-JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToVCard}>
                <FileType className="h-4 w-4 mr-2" />
                ייצוא ל-vCard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" onClick={handleBackToMapping}>
            <Settings2 className="h-4 w-4 mr-2" />
            מיפוי
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            נקה
          </Button>
        </div>
      </div>

      {/* Search, filters, view mode, and select all */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, מייל, טלפון..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 text-right"
          />
        </div>
        
        {/* Filter button */}
        <Button 
          variant={showFilters || activeFilterCount > 0 ? "default" : "outline"} 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4 ml-1" />
          סינון
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -left-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        
        {/* View mode toggle */}
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
          <ToggleGroupItem value="cards" aria-label="תצוגת כרטיסים">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="תצוגת רשימה">
            <LayoutList className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="compact" aria-label="תצוגה קומפקטית">
            <Table className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => toggleSelectAll(selectionStats.selected < selectionStats.total - selectionStats.duplicates)}
        >
          {selectionStats.selected === selectionStats.total - selectionStats.duplicates ? 'בטל הכל' : 'בחר הכל'}
        </Button>
      </div>

      {/* Smart Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              סינון חכם
            </h4>
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilters({
                  hasName: false,
                  hasEmail: false,
                  hasPhone: false,
                  hasOrganization: false,
                  hasDuplicate: false,
                  isNew: false,
                })}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 ml-1" />
                נקה מסננים
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            בחר מספר מסננים לסינון מצטבר (AND) - יוצגו רק אנשי קשר שעונים על כל התנאים
          </p>
          
          <div className="flex flex-wrap gap-2">
            {/* Has Name */}
            <Button
              variant={filters.hasName ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter('hasName')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              יש שם
              <Badge variant="secondary" className="mr-1 text-xs">
                {filterCounts.hasName}
              </Badge>
            </Button>
            
            {/* Has Email */}
            <Button
              variant={filters.hasEmail ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter('hasEmail')}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              יש מייל
              <Badge variant="secondary" className="mr-1 text-xs">
                {filterCounts.hasEmail}
              </Badge>
            </Button>
            
            {/* Has Phone */}
            <Button
              variant={filters.hasPhone ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter('hasPhone')}
              className="gap-2"
            >
              <Phone className="h-4 w-4" />
              יש טלפון
              <Badge variant="secondary" className="mr-1 text-xs">
                {filterCounts.hasPhone}
              </Badge>
            </Button>
            
            {/* Has Organization */}
            <Button
              variant={filters.hasOrganization ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter('hasOrganization')}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              יש ארגון
              <Badge variant="secondary" className="mr-1 text-xs">
                {filterCounts.hasOrganization}
              </Badge>
            </Button>
            
            {/* Is Duplicate */}
            <Button
              variant={filters.hasDuplicate ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter('hasDuplicate')}
              className="gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <AlertCircle className="h-4 w-4" />
              כפילויות
              <Badge variant="secondary" className="mr-1 text-xs bg-yellow-100 text-yellow-700">
                {filterCounts.hasDuplicate}
              </Badge>
            </Button>
            
            {/* Is New */}
            <Button
              variant={filters.isNew ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter('isNew')}
              className="gap-2 border-green-300 text-green-700 hover:bg-green-100"
            >
              <UserPlus className="h-4 w-4" />
              חדשים
              <Badge variant="secondary" className="mr-1 text-xs bg-green-100 text-green-700">
                {filterCounts.isNew}
              </Badge>
            </Button>
          </div>
          
          {/* Active filters summary */}
          {activeFilterCount > 0 && (
            <div className="pt-2 border-t text-sm">
              <span className="text-muted-foreground">מציג: </span>
              <span className="font-medium">{filteredContacts.length}</span>
              <span className="text-muted-foreground"> מתוך </span>
              <span className="font-medium">{parsedContacts.length}</span>
              <span className="text-muted-foreground"> אנשי קשר</span>
            </div>
          )}
        </div>
      )}

      {/* Progress bar during import with percentage */}
      {isImporting && (
        <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-blue-700 dark:text-blue-300">
              מייבא אנשי קשר...
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
              {importProgress.percentage}%
            </span>
          </div>
          <Progress value={importProgress.percentage} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {importProgress.currentContactName && (
                <>מעבד: <span className="font-medium">{importProgress.currentContactName}</span></>
              )}
            </span>
            <span>{importProgress.current} מתוך {importProgress.total}</span>
          </div>
        </div>
      )}

      {/* Show resume option if paused or error */}
      {importProgress.status === 'paused' || importProgress.status === 'error' ? (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              הייבוא נעצר ב-{importProgress.percentage}% ({importProgress.current} מתוך {importProgress.total})
            </span>
            <Button 
              size="sm"
              onClick={handleResumeImport}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <RefreshCw className="h-3 w-3 ml-1" />
              המשך מכאן
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Contacts list - different views */}
      <ScrollArea className="h-[400px] border rounded-lg">
        {viewMode === 'cards' && (
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onToggle={() => toggleContactSelection(contact.id)}
                onSetAction={(action) => setContactAction(contact.id, action)}
              />
            ))}
          </div>
        )}
        
        {viewMode === 'list' && (
          <div className="p-2 space-y-1">
            {filteredContacts.map((contact) => (
              <ContactListItem
                key={contact.id}
                contact={contact}
                onToggle={() => toggleContactSelection(contact.id)}
                onSetAction={(action) => setContactAction(contact.id, action)}
              />
            ))}
          </div>
        )}
        
        {viewMode === 'compact' && (
          <table className="w-full text-sm" dir="rtl">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="p-2 text-right w-8"></th>
                <th className="p-2 text-right">שם</th>
                <th className="p-2 text-center">מייל</th>
                <th className="p-2 text-center">טלפון</th>
                <th className="p-2 text-right">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <ContactTableRow
                  key={contact.id}
                  contact={contact}
                  onToggle={() => toggleContactSelection(contact.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </ScrollArea>

      {/* Import button */}
      <div className="flex items-center justify-between pt-2 border-t">
        <p className="text-sm text-muted-foreground">
          {selectionStats.selected > 0 
            ? `נבחרו ${selectionStats.selected} לייבוא/עדכון`
            : 'בחר אנשי קשר לייבוא'
          }
        </p>
        <Button 
          onClick={handleImport}
          disabled={isImporting || selectionStats.selected === 0}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {isImporting ? 'מייבא...' : `ייבא ${selectionStats.selected} נבחרים`}
        </Button>
      </div>

      {/* Import stats */}
      {importStats && (
        <div className="p-3 bg-muted rounded-lg text-sm">
          <div className="flex items-center gap-4 justify-center flex-wrap">
            {importStats.imported > 0 && (
              <span className="text-green-600">✓ יובאו: {importStats.imported}</span>
            )}
            {importStats.updated > 0 && (
              <span className="text-blue-600">↻ עודכנו: {importStats.updated}</span>
            )}
            {importStats.duplicates > 0 && (
              <span className="text-yellow-600">⚠ כפולים: {importStats.duplicates}</span>
            )}
            {importStats.errors > 0 && (
              <span className="text-red-600">✗ שגיאות: {importStats.errors}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Card view component
function ContactCard({ 
  contact, 
  onToggle,
  onSetAction,
}: { 
  contact: ParsedContact;
  onToggle: () => void;
  onSetAction: (action: 'import' | 'update' | 'skip') => void;
}) {
  const getDuplicateReasonText = () => {
    switch (contact.duplicateReason) {
      case 'email': return 'מייל תואם';
      case 'phone': return 'טלפון תואם';
      case 'name': return 'שם תואם';
      default: return 'קיים במערכת';
    }
  };

  return (
    <div
      dir="rtl"
      className={`p-3 rounded-lg border transition-all text-right ${
        contact.selected && !contact.isDuplicate 
          ? 'bg-primary/5 border-primary/30 shadow-sm' 
          : contact.action === 'update'
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : contact.isDuplicate 
          ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800' 
          : contact.isImported
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
          : 'hover:bg-muted/50 border-border'
      }`}
    >
      <div className="flex items-start gap-3 flex-row-reverse">
        <Checkbox
          checked={contact.selected}
          onCheckedChange={onToggle}
          disabled={contact.isImported}
          className="mt-1"
        />

        <div className="flex-1 min-w-0 space-y-2 text-right">
          {/* Name and badges */}
          <div className="flex items-center gap-2 flex-wrap justify-end flex-row-reverse">
            <span className="font-semibold text-right">{contact.fullName}</span>
            
            {contact.isDuplicate && contact.existingClient && (
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                {getDuplicateReasonText()}
              </Badge>
            )}
            
            {contact.isImported && (
              <Badge variant="secondary" className="text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                יובא
              </Badge>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-1 text-sm text-muted-foreground text-right">
            {(contact.email1 || contact.email2) && (
              <div className="flex items-center gap-1.5 justify-end flex-row-reverse">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{contact.email1 || contact.email2}</span>
                {contact.email1 && contact.email2 && (
                  <span className="text-xs opacity-60">+1</span>
                )}
              </div>
            )}

            {(contact.phone1 || contact.phone2) && (
              <div className="flex items-center gap-1.5 justify-end flex-row-reverse">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <span dir="ltr">{contact.phone1 || contact.phone2}</span>
                {contact.phone1 && contact.phone2 && (
                  <span className="text-xs opacity-60">+1</span>
                )}
              </div>
            )}

            {contact.organization && (
              <div className="flex items-center gap-1.5 justify-end flex-row-reverse">
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{contact.organization}</span>
              </div>
            )}
          </div>

          {/* Action buttons for duplicates */}
          {contact.isDuplicate && !contact.isImported && (
            <div className="flex items-center gap-1.5 pt-1 justify-end">
              <Button
                variant={contact.action === 'skip' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => onSetAction('skip')}
              >
                דלג
              </Button>
              <Button
                variant={contact.action === 'update' ? 'default' : 'ghost'}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => onSetAction('update')}
              >
                עדכן
              </Button>
              <Button
                variant={contact.action === 'import' ? 'default' : 'ghost'}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => onSetAction('import')}
              >
                ייבא
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// List view component
function ContactListItem({ 
  contact, 
  onToggle,
  onSetAction,
}: { 
  contact: ParsedContact;
  onToggle: () => void;
  onSetAction: (action: 'import' | 'update' | 'skip') => void;
}) {
  return (
    <div
      dir="rtl"
      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
        contact.selected && !contact.isDuplicate 
          ? 'bg-primary/5' 
          : contact.isDuplicate 
          ? 'bg-yellow-50 dark:bg-yellow-900/10' 
          : contact.isImported
          ? 'bg-green-50 dark:bg-green-900/10'
          : 'hover:bg-muted/50'
      }`}
    >
      <Checkbox
        checked={contact.selected}
        onCheckedChange={onToggle}
        disabled={contact.isImported}
      />
      
      <span className="font-medium w-32 truncate text-right">{contact.fullName}</span>
      
      <span className="text-sm text-muted-foreground w-48 truncate" dir="ltr">
        {contact.email1 || contact.email2 || '-'}
      </span>
      
      <span className="text-sm text-muted-foreground w-28" dir="ltr">
        {contact.phone1 || contact.phone2 || '-'}
      </span>

      <div className="flex-1" />

      {contact.isDuplicate && !contact.isImported && (
        <Button
          variant={contact.action === 'update' ? 'default' : 'ghost'}
          size="sm"
          className="h-6 text-xs px-2"
          onClick={() => onSetAction(contact.action === 'update' ? 'skip' : 'update')}
        >
          {contact.action === 'update' ? 'עדכון' : 'עדכן'}
        </Button>
      )}
      
      {contact.isImported && (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      )}
      
      {contact.isDuplicate && !contact.isImported && contact.action === 'skip' && (
        <AlertCircle className="h-4 w-4 text-yellow-600" />
      )}
    </div>
  );
}

// Table row component
function ContactTableRow({ 
  contact, 
  onToggle,
}: { 
  contact: ParsedContact;
  onToggle: () => void;
}) {
  return (
    <tr className={`border-b text-right ${
      contact.selected ? 'bg-primary/5' : 
      contact.isDuplicate ? 'bg-yellow-50 dark:bg-yellow-900/10' : 
      contact.isImported ? 'bg-green-50 dark:bg-green-900/10' : ''
    }`}>
      <td className="p-2 text-right">
        <Checkbox
          checked={contact.selected}
          onCheckedChange={onToggle}
          disabled={contact.isImported}
        />
      </td>
      <td className="p-2 font-medium text-right">{contact.fullName}</td>
      <td className="p-2 text-muted-foreground text-center" dir="ltr">
        {contact.email1 || contact.email2 || '-'}
      </td>
      <td className="p-2 text-muted-foreground text-center" dir="ltr">
        {contact.phone1 || contact.phone2 || '-'}
      </td>
      <td className="p-2 text-right">
        {contact.isImported && (
          <Badge variant="secondary" className="text-xs text-green-600">יובא</Badge>
        )}
        {contact.isDuplicate && !contact.isImported && (
          <Badge variant="outline" className="text-xs text-yellow-600">כפיל</Badge>
        )}
      </td>
    </tr>
  );
}
