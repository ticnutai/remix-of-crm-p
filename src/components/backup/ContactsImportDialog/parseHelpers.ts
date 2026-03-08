// File parsing helpers for different contact formats
import { ParsedContact, ColumnMapping, FileFormat, VCardContact } from './types';

// Detect file format based on content
export function detectFileFormat(content: string, fileName: string): FileFormat {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.endsWith('.vcf') || content.includes('BEGIN:VCARD')) {
    return 'vcard';
  }
  
  if (lowerName.endsWith('.csv')) {
    // Check for Google Contacts format
    if (content.includes('Given Name') || content.includes('Family Name')) {
      return 'google';
    }
    // Check for Outlook format
    if (content.includes('First Name') && content.includes('Last Name')) {
      return 'outlook';
    }
    return 'csv';
  }
  
  return 'unknown';
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// Parse CSV content to headers and rows
export function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 1) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

// Parse vCard format
export function parseVCard(content: string): VCardContact[] {
  const contacts: VCardContact[] = [];
  const vcards = content.split('BEGIN:VCARD').filter(v => v.trim());

  for (const vcard of vcards) {
    const contact: VCardContact = { name: '' };
    const lines = vcard.split('\n');

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const key = line.substring(0, colonIdx).split(';')[0].toUpperCase();
      const value = line.substring(colonIdx + 1).trim();

      switch (key) {
        case 'FN':
          contact.name = value;
          break;
        case 'N':
          const nameParts = value.split(';');
          contact.lastName = nameParts[0] || '';
          contact.firstName = nameParts[1] || '';
          if (!contact.name) {
            contact.name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
          }
          break;
        case 'EMAIL':
          if (!contact.email) contact.email = value;
          break;
        case 'TEL':
          if (!contact.phone) contact.phone = value;
          break;
        case 'ADR':
          const addrParts = value.split(';');
          contact.address = addrParts.filter(Boolean).join(', ');
          break;
        case 'ORG':
          contact.company = value;
          break;
        case 'TITLE':
          contact.title = value;
          break;
      }
    }

    if (contact.name || contact.email || contact.phone) {
      contacts.push(contact);
    }
  }

  return contacts;
}

// Auto-detect column mapping for CSV
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  const patterns: Record<string, RegExp[]> = {
    name: [/^(full\s*name|name|שם\s*מלא|שם)$/i],
    firstName: [/^(first\s*name|given\s*name|שם\s*פרטי)$/i],
    lastName: [/^(last\s*name|family\s*name|surname|שם\s*משפחה)$/i],
    email: [/^(e-?mail\s*1?\s*-?\s*value|e-?mail|email|מייל)$/i],
    email2: [/^(e-?mail\s*2\s*-?\s*value|email\s*2|מייל\s*משני)$/i],
    phone: [/^(phone\s*1?\s*-?\s*value|phone|mobile|טלפון|נייד)$/i],
    phone2: [/^(phone\s*2\s*-?\s*value|phone\s*2|טלפון\s*משני)$/i],
    address: [/^(address|street|כתובת|רחוב)$/i],
    city: [/^(city|עיר)$/i],
    postalCode: [/^(postal\s*code|zip|מיקוד)$/i],
    country: [/^(country|מדינה)$/i],
    company: [/^(organization\s*(name|1\s*-\s*name)?|company|חברה|ארגון)$/i],
    title: [/^(organization\s*(title|1\s*-\s*title)|job\s*title|title|תפקיד)$/i],
    department: [/^(organization\s*(department|1\s*-\s*department)|department|מחלקה)$/i],
    notes: [/^(notes|הערות)$/i],
  };

  headers.forEach(header => {
    const normalizedHeader = header.trim();
    for (const [field, regexList] of Object.entries(patterns)) {
      if (!mapping[field]) {
        for (const regex of regexList) {
          if (regex.test(normalizedHeader)) {
            mapping[field] = header;
            break;
          }
        }
      }
    }
  });

  return mapping;
}

// Convert raw CSV rows to ParsedContacts using mapping
export function applyMappingToContacts(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ParsedContact[] {
  return rows.map((row, index) => {
    const getValue = (field: string): string => {
      const column = mapping[field];
      if (!column) return '';
      return (row[column] || '').trim();
    };

    let name = getValue('name');
    const firstName = getValue('firstName');
    const lastName = getValue('lastName');

    // Build name if not directly available
    if (!name && (firstName || lastName)) {
      name = [firstName, lastName].filter(Boolean).join(' ');
    }

    // Fallback to email or phone if no name
    const email = getValue('email');
    const phone = getValue('phone');
    if (!name) {
      if (email) {
        name = email.split('@')[0];
      } else if (phone) {
        name = phone;
      } else {
        name = `איש קשר ${index + 1}`;
      }
    }

    return {
      id: `contact-${index}-${Date.now()}`,
      name,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: email || undefined,
      email2: getValue('email2') || undefined,
      phone: phone || undefined,
      phone2: getValue('phone2') || undefined,
      address: getValue('address') || undefined,
      city: getValue('city') || undefined,
      postalCode: getValue('postalCode') || undefined,
      country: getValue('country') || undefined,
      company: getValue('company') || undefined,
      title: getValue('title') || undefined,
      department: getValue('department') || undefined,
      notes: getValue('notes') || undefined,
      action: 'import' as const,
      selected: true,
    };
  }).filter(c => c.name || c.email || c.phone);
}

// Convert vCard contacts to ParsedContacts
export function vCardToContacts(vcards: VCardContact[]): ParsedContact[] {
  return vcards.map((vc, index) => ({
    id: `vcard-${index}-${Date.now()}`,
    name: vc.name || `איש קשר ${index + 1}`,
    firstName: vc.firstName,
    lastName: vc.lastName,
    email: vc.email,
    phone: vc.phone,
    address: vc.address,
    company: vc.company,
    title: vc.title,
    action: 'import' as const,
    selected: true,
  }));
}

// Normalize phone for comparison
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '').replace(/^0/, '972');
}

// Normalize name for comparison
export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}
