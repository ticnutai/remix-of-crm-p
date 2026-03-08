// Types for Contacts Import in Backup System

export interface ContactImportField {
  key: string;
  label: string;
  hebrewLabel: string;
  selected: boolean;
  category: 'basic' | 'contact' | 'address' | 'work';
}

export const IMPORT_FIELDS: ContactImportField[] = [
  // Basic Info
  { key: 'name', label: 'Name', hebrewLabel: 'שם', selected: true, category: 'basic' },
  { key: 'firstName', label: 'First Name', hebrewLabel: 'שם פרטי', selected: true, category: 'basic' },
  { key: 'lastName', label: 'Last Name', hebrewLabel: 'שם משפחה', selected: true, category: 'basic' },
  
  // Contact Details
  { key: 'email', label: 'Email', hebrewLabel: 'אימייל', selected: true, category: 'contact' },
  { key: 'email2', label: 'Secondary Email', hebrewLabel: 'אימייל משני', selected: false, category: 'contact' },
  { key: 'phone', label: 'Phone', hebrewLabel: 'טלפון', selected: true, category: 'contact' },
  { key: 'phone2', label: 'Secondary Phone', hebrewLabel: 'טלפון משני', selected: false, category: 'contact' },
  
  // Address
  { key: 'address', label: 'Address', hebrewLabel: 'כתובת', selected: false, category: 'address' },
  { key: 'city', label: 'City', hebrewLabel: 'עיר', selected: false, category: 'address' },
  { key: 'postalCode', label: 'Postal Code', hebrewLabel: 'מיקוד', selected: false, category: 'address' },
  { key: 'country', label: 'Country', hebrewLabel: 'מדינה', selected: false, category: 'address' },
  
  // Work
  { key: 'company', label: 'Company', hebrewLabel: 'חברה', selected: false, category: 'work' },
  { key: 'title', label: 'Job Title', hebrewLabel: 'תפקיד', selected: false, category: 'work' },
  { key: 'department', label: 'Department', hebrewLabel: 'מחלקה', selected: false, category: 'work' },
  { key: 'notes', label: 'Notes', hebrewLabel: 'הערות', selected: false, category: 'basic' },
];

export interface ParsedContact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  email2?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  company?: string;
  title?: string;
  department?: string;
  notes?: string;
  labels?: string[];
  // Matching state
  matchedClientId?: string;
  matchedClientName?: string;
  matchType?: 'name' | 'email' | 'phone' | 'none';
  action: 'import' | 'update' | 'skip';
  selected: boolean;
}

export interface ColumnMapping {
  [fieldKey: string]: string; // Maps our field key to CSV column name
}

export interface ImportSettings {
  selectedFields: string[];
  duplicateHandling: 'skip' | 'update' | 'ask';
  matchBy: ('name' | 'email' | 'phone')[];
}

export interface ImportStats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  matched: number;
  errors: number;
}

export type FileFormat = 'csv' | 'vcard' | 'google' | 'outlook' | 'unknown';

// vCard parser helper types
export interface VCardContact {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  title?: string;
}
