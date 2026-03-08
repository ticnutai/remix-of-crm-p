// SQL Analyzer Utility - ניתוח SQL אוטומטי
// tenarch CRM Pro

export interface SqlAnalysis {
  statementCount: number;
  affectedTables: string[];
  operationTypes: string[];
  hasTransaction: boolean;
  hasFunction: boolean;
  estimatedRisk: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  lineCount: number;
  charCount: number;
}

export interface ErrorDetails {
  message: string;
  code?: string;
  position?: number;
  line?: number;
  hint?: string;
  context?: string;
  suggestedFix?: string;
}

// PostgreSQL error codes and their meanings
const PG_ERROR_CODES: Record<string, { name: string; hint: string }> = {
  '42P01': { name: 'undefined_table', hint: 'הטבלה לא קיימת - בדוק את שם הטבלה' },
  '42P07': { name: 'duplicate_table', hint: 'הטבלה כבר קיימת - השתמש ב-IF NOT EXISTS' },
  '42701': { name: 'duplicate_column', hint: 'העמודה כבר קיימת - השתמש ב-IF NOT EXISTS' },
  '42703': { name: 'undefined_column', hint: 'העמודה לא קיימת - בדוק את שם העמודה' },
  '42883': { name: 'undefined_function', hint: 'הפונקציה לא קיימת - בדוק את שם הפונקציה והפרמטרים' },
  '23505': { name: 'unique_violation', hint: 'הפרת אילוץ ייחודיות - ערך כפול' },
  '23503': { name: 'foreign_key_violation', hint: 'הפרת מפתח זר - בדוק קשרים בין טבלאות' },
  '23502': { name: 'not_null_violation', hint: 'ערך NULL בעמודה שחייבת ערך' },
  '22P02': { name: 'invalid_text_representation', hint: 'ערך לא תקין לסוג הנתון' },
  '42601': { name: 'syntax_error', hint: 'שגיאת סינטקס - בדוק את תחביר ה-SQL' },
  '42501': { name: 'insufficient_privilege', hint: 'אין הרשאות מספיקות' },
  '3F000': { name: 'invalid_schema_name', hint: 'סכמה לא קיימת' },
  '2BP01': { name: 'dependent_objects_still_exist', hint: 'קיימים אובייקטים תלויים - השתמש ב-CASCADE' },
  '25001': { name: 'active_sql_transaction', hint: 'טרנזקציה פעילה - סיים אותה לפני הפעולה' },
  '25P02': { name: 'in_failed_sql_transaction', hint: 'טרנזקציה שנכשלה - בצע ROLLBACK' },
};

// Analyze SQL and extract information
export function analyzeSql(sql: string): SqlAnalysis {
  const warnings: string[] = [];
  const operationTypes: Set<string> = new Set();
  const affectedTables: Set<string> = new Set();
  
  // Normalize SQL
  const normalizedSql = sql.toUpperCase();
  const lines = sql.split('\n');
  
  // Detect operations
  const operations = [
    { pattern: /CREATE\s+TABLE/gi, type: 'CREATE TABLE', risk: 'low' },
    { pattern: /CREATE\s+OR\s+REPLACE\s+FUNCTION/gi, type: 'CREATE FUNCTION', risk: 'medium' },
    { pattern: /CREATE\s+FUNCTION/gi, type: 'CREATE FUNCTION', risk: 'medium' },
    { pattern: /CREATE\s+OR\s+REPLACE\s+VIEW/gi, type: 'CREATE VIEW', risk: 'low' },
    { pattern: /CREATE\s+INDEX/gi, type: 'CREATE INDEX', risk: 'low' },
    { pattern: /CREATE\s+TRIGGER/gi, type: 'CREATE TRIGGER', risk: 'medium' },
    { pattern: /CREATE\s+POLICY/gi, type: 'CREATE POLICY', risk: 'medium' },
    { pattern: /ALTER\s+TABLE/gi, type: 'ALTER TABLE', risk: 'medium' },
    { pattern: /DROP\s+TABLE/gi, type: 'DROP TABLE', risk: 'critical' },
    { pattern: /DROP\s+FUNCTION/gi, type: 'DROP FUNCTION', risk: 'high' },
    { pattern: /DROP\s+POLICY/gi, type: 'DROP POLICY', risk: 'high' },
    { pattern: /DELETE\s+FROM/gi, type: 'DELETE', risk: 'high' },
    { pattern: /TRUNCATE/gi, type: 'TRUNCATE', risk: 'critical' },
    { pattern: /INSERT\s+INTO/gi, type: 'INSERT', risk: 'low' },
    { pattern: /UPDATE\s+/gi, type: 'UPDATE', risk: 'medium' },
    { pattern: /GRANT\s+/gi, type: 'GRANT', risk: 'medium' },
    { pattern: /REVOKE\s+/gi, type: 'REVOKE', risk: 'high' },
  ];
  
  let maxRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  
  operations.forEach(op => {
    if (op.pattern.test(sql)) {
      operationTypes.add(op.type);
      const opRiskIndex = riskLevels.indexOf(op.risk);
      const currentRiskIndex = riskLevels.indexOf(maxRisk);
      if (opRiskIndex > currentRiskIndex) {
        maxRisk = op.risk as typeof maxRisk;
      }
    }
  });
  
  // Extract table names
  const tablePatterns = [
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi,
    /ALTER\s+TABLE\s+(?:public\.)?(\w+)/gi,
    /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?(\w+)/gi,
    /INSERT\s+INTO\s+(?:public\.)?(\w+)/gi,
    /UPDATE\s+(?:public\.)?(\w+)/gi,
    /DELETE\s+FROM\s+(?:public\.)?(\w+)/gi,
    /FROM\s+(?:public\.)?(\w+)/gi,
    /ON\s+(?:public\.)?(\w+)/gi,
  ];
  
  tablePatterns.forEach(pattern => {
    let match;
    const sqlCopy = sql;
    while ((match = pattern.exec(sqlCopy)) !== null) {
      const tableName = match[1];
      // Filter out SQL keywords
      if (!['TABLE', 'EXISTS', 'SET', 'WHERE', 'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE'].includes(tableName.toUpperCase())) {
        affectedTables.add(tableName.toLowerCase());
      }
    }
  });
  
  // Check for transaction commands
  const hasTransaction = /\b(BEGIN|COMMIT|ROLLBACK|START\s+TRANSACTION)\b/gi.test(sql);
  
  // Check for function definitions
  const hasFunction = /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/gi.test(sql);
  
  // Count statements (approximate by semicolons, accounting for function bodies)
  let statementCount = 0;
  let inFunctionBody = false;
  let dollarQuoteCount = 0;
  
  for (let i = 0; i < sql.length; i++) {
    if (sql.substring(i, i + 2) === '$$') {
      dollarQuoteCount++;
      inFunctionBody = dollarQuoteCount % 2 === 1;
      i++; // Skip next char
    } else if (sql[i] === ';' && !inFunctionBody) {
      statementCount++;
    }
  }
  
  // If no semicolon found but has content, count as 1
  if (statementCount === 0 && sql.trim().length > 0) {
    statementCount = 1;
  }
  
  // Generate warnings
  if (operationTypes.has('DROP TABLE')) {
    warnings.push('⚠️ פעולת DROP TABLE - נתונים יימחקו לצמיתות!');
  }
  
  if (operationTypes.has('TRUNCATE')) {
    warnings.push('⚠️ פעולת TRUNCATE - כל הנתונים בטבלה יימחקו!');
  }
  
  if (operationTypes.has('DELETE') && !normalizedSql.includes('WHERE')) {
    warnings.push('⚠️ DELETE ללא WHERE - כל השורות יימחקו!');
  }
  
  if (operationTypes.has('UPDATE') && !normalizedSql.includes('WHERE')) {
    warnings.push('⚠️ UPDATE ללא WHERE - כל השורות יתעדכנו!');
  }
  
  if (hasTransaction) {
    warnings.push('ℹ️ פקודות טרנזקציה יוסרו אוטומטית');
  }
  
  if (!normalizedSql.includes('IF NOT EXISTS') && (operationTypes.has('CREATE TABLE') || operationTypes.has('CREATE INDEX'))) {
    warnings.push('💡 מומלץ להוסיף IF NOT EXISTS');
  }
  
  if (operationTypes.has('DROP POLICY') || operationTypes.has('DROP FUNCTION')) {
    if (!normalizedSql.includes('IF EXISTS')) {
      warnings.push('💡 מומלץ להוסיף IF EXISTS לפעולות DROP');
    }
  }
  
  if (lines.length > 100) {
    warnings.push('📝 קובץ ארוך - שקול לפצל למספר מיגרציות');
  }
  
  return {
    statementCount,
    affectedTables: Array.from(affectedTables),
    operationTypes: Array.from(operationTypes),
    hasTransaction,
    hasFunction,
    estimatedRisk: maxRisk,
    warnings,
    lineCount: lines.length,
    charCount: sql.length,
  };
}

// Parse PostgreSQL error and extract details
export function parseError(error: string, sql?: string): ErrorDetails {
  const result: ErrorDetails = {
    message: error,
  };
  
  // Extract error code
  const codeMatch = error.match(/(?:ERROR|error):\s*(\d{5})/);
  if (codeMatch) {
    result.code = codeMatch[1];
    const errorInfo = PG_ERROR_CODES[result.code];
    if (errorInfo) {
      result.hint = errorInfo.hint;
    }
  }
  
  // Extract position
  const positionMatch = error.match(/(?:position|Position|at position)\s*[:"]\s*(\d+)/i);
  if (positionMatch) {
    result.position = parseInt(positionMatch[1], 10);
    
    // Calculate line number from position
    if (sql && result.position) {
      let charCount = 0;
      const lines = sql.split('\n');
      for (let i = 0; i < lines.length; i++) {
        charCount += lines[i].length + 1; // +1 for newline
        if (charCount >= result.position) {
          result.line = i + 1;
          break;
        }
      }
    }
  }
  
  // Extract line number directly if mentioned
  const lineMatch = error.match(/(?:line|Line|שורה)\s*[:"]\s*(\d+)/i);
  if (lineMatch && !result.line) {
    result.line = parseInt(lineMatch[1], 10);
  }
  
  // Extract context
  const contextMatch = error.match(/(?:context|CONTEXT):\s*(.+?)(?:\n|$)/i);
  if (contextMatch) {
    result.context = contextMatch[1].trim();
  }
  
  // Generate suggested fixes based on error type
  if (result.code === '42P07') {
    result.suggestedFix = 'הוסף "IF NOT EXISTS" אחרי CREATE TABLE';
  } else if (result.code === '42P01') {
    result.suggestedFix = 'ודא שהטבלה נוצרה לפני השימוש בה, או בדוק את שם הטבלה';
  } else if (result.code === '42701') {
    result.suggestedFix = 'השתמש ב-"ADD COLUMN IF NOT EXISTS" במקום "ADD COLUMN"';
  } else if (result.code === '42601') {
    result.suggestedFix = 'בדוק את תחביר ה-SQL - ייתכן חסר פסיק, סוגריים, או מילת מפתח';
  } else if (result.code === '2BP01') {
    result.suggestedFix = 'הוסף CASCADE לפקודת DROP כדי למחוק גם אובייקטים תלויים';
  }
  
  return result;
}

// Get risk color for UI
export function getRiskColor(risk: SqlAnalysis['estimatedRisk']): string {
  switch (risk) {
    case 'low': return 'text-green-500';
    case 'medium': return 'text-yellow-500';
    case 'high': return 'text-orange-500';
    case 'critical': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
}

// Get risk badge variant
export function getRiskBadgeVariant(risk: SqlAnalysis['estimatedRisk']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (risk) {
    case 'low': return 'secondary';
    case 'medium': return 'outline';
    case 'high': return 'destructive';
    case 'critical': return 'destructive';
    default: return 'outline';
  }
}

// Get Hebrew risk label
export function getRiskLabel(risk: SqlAnalysis['estimatedRisk']): string {
  switch (risk) {
    case 'low': return 'סיכון נמוך';
    case 'medium': return 'סיכון בינוני';
    case 'high': return 'סיכון גבוה';
    case 'critical': return 'סיכון קריטי';
    default: return 'לא ידוע';
  }
}

// Format SQL for display with basic syntax highlighting tokens
export function tokenizeSql(sql: string): Array<{ text: string; type: 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'identifier' | 'default' }> {
  const tokens: Array<{ text: string; type: 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'identifier' | 'default' }> = [];
  
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'TRUNCATE',
    'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW', 'FUNCTION', 'TRIGGER', 'POLICY',
    'IF', 'THEN', 'ELSE', 'END', 'CASE', 'WHEN', 'BEGIN', 'COMMIT', 'ROLLBACK',
    'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT', 'CONSTRAINT',
    'NULL', 'NOT NULL', 'TRUE', 'FALSE', 'AS', 'ON', 'FOR', 'TO', 'WITH', 'USING',
    'RETURNS', 'LANGUAGE', 'SECURITY', 'DEFINER', 'INVOKER', 'REPLACE', 'CASCADE',
    'GRANT', 'REVOKE', 'ALL', 'PRIVILEGES', 'PUBLIC', 'ENABLE', 'DISABLE', 'ROW', 'LEVEL',
    'UUID', 'TEXT', 'INTEGER', 'BIGINT', 'BOOLEAN', 'TIMESTAMP', 'TIMESTAMPTZ', 'JSONB', 'JSON',
    'DECLARE', 'EXCEPTION', 'RAISE', 'RETURN', 'LOOP', 'WHILE', 'EXECUTE', 'PERFORM',
    'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'NATURAL', 'FULL',
    'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'ASC', 'DESC', 'DISTINCT',
    'UNION', 'INTERSECT', 'EXCEPT', 'COALESCE', 'NULLIF', 'CAST', 'ARRAY', 'ROW',
  ];
  
  // Simple tokenization - split by whitespace and special chars
  const regex = /('(?:[^']|'')*'|--[^\n]*|\d+(?:\.\d+)?|[A-Za-z_]\w*|[^\s])/g;
  let match;
  
  while ((match = regex.exec(sql)) !== null) {
    const text = match[0];
    let type: typeof tokens[0]['type'] = 'default';
    
    if (text.startsWith("'")) {
      type = 'string';
    } else if (text.startsWith('--')) {
      type = 'comment';
    } else if (/^\d+(?:\.\d+)?$/.test(text)) {
      type = 'number';
    } else if (keywords.includes(text.toUpperCase())) {
      type = 'keyword';
    } else if (/^[A-Za-z_]\w*$/.test(text)) {
      type = 'identifier';
    } else if (/^[=<>!+\-*/%&|^~()[\]{},;:]$/.test(text)) {
      type = 'operator';
    }
    
    tokens.push({ text, type });
  }
  
  return tokens;
}
