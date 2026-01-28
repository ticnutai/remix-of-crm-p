// Migration Runner CLI - Execute migrations directly from terminal
// Usage: node scripts/run-migration.mjs [migration-name]

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

async function executeMigration(name, sql) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🚀 Running migration: ${name}`, 'bold');
  log('='.repeat(60), 'cyan');
  
  logInfo(`SQL length: ${sql.length} characters`);
  
  try {
    const { data, error } = await supabase.rpc('execute_safe_migration', {
      p_migration_name: name,
      p_migration_sql: sql
    });
    
    if (error) {
      logError(`Migration failed: ${error.message}`);
      console.error('Error details:', error);
      return false;
    }
    
    if (data?.success) {
      logSuccess(`Migration completed successfully!`);
      if (data.message) {
        logInfo(`Message: ${data.message}`);
      }
      return true;
    } else {
      logError(`Migration failed: ${data?.error || 'Unknown error'}`);
      return false;
    }
  } catch (err) {
    logError(`Exception during migration: ${err.message}`);
    console.error(err);
    return false;
  }
}

async function runPendingMigrations() {
  const pendingPath = path.join(__dirname, '..', 'public', 'pending-migrations.json');
  
  if (!fs.existsSync(pendingPath)) {
    logWarning('No pending-migrations.json found');
    return;
  }
  
  const content = fs.readFileSync(pendingPath, 'utf-8');
  const data = JSON.parse(content);
  
  const pending = data.migrations.filter(m => m.status === 'pending');
  
  if (pending.length === 0) {
    logInfo('No pending migrations to run');
    return;
  }
  
  log(`\n📋 Found ${pending.length} pending migration(s)`, 'magenta');
  
  for (const migration of pending) {
    log(`\n📦 Migration: ${migration.name}`, 'yellow');
    log(`   Description: ${migration.description}`, 'white');
    log(`   Priority: ${migration.priority}`, 'white');
    
    const success = await executeMigration(migration.name, migration.sql);
    
    if (success) {
      // Update status in file
      migration.status = 'completed';
    } else {
      migration.status = 'failed';
    }
  }
  
  // Save updated status
  fs.writeFileSync(pendingPath, JSON.stringify(data, null, 2));
  logSuccess('Updated pending-migrations.json with execution results');
}

async function runSqlFile(filePath) {
  if (!fs.existsSync(filePath)) {
    logError(`File not found: ${filePath}`);
    return;
  }
  
  const sql = fs.readFileSync(filePath, 'utf-8');
  const name = path.basename(filePath, '.sql');
  
  await executeMigration(name, sql);
}

async function runDirectSql(sql, name = 'direct_execution') {
  await executeMigration(name, sql);
}

async function checkConnection() {
  log('\n🔗 Checking Supabase connection...', 'cyan');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      logError(`Connection failed: ${error.message}`);
      return false;
    }
    
    logSuccess('Connected to Supabase successfully!');
    logInfo(`Project: eadeymehidcndudeycnf`);
    return true;
  } catch (err) {
    logError(`Connection error: ${err.message}`);
    return false;
  }
}

async function listMigrationHistory() {
  log('\n📜 Migration History:', 'cyan');
  
  try {
    const { data, error } = await supabase
      .from('migration_logs')
      .select('name, executed_at, success, error')
      .order('executed_at', { ascending: false })
      .limit(10);
    
    if (error) {
      logError(`Failed to fetch history: ${error.message}`);
      return;
    }
    
    if (!data || data.length === 0) {
      logInfo('No migrations found');
      return;
    }
    
    data.forEach((m, i) => {
      const status = m.success ? colors.green + '✅' : colors.red + '❌';
      const date = new Date(m.executed_at).toLocaleString('he-IL');
      console.log(`${status} ${colors.white}${m.name}${colors.reset} - ${date}`);
      if (m.error) {
        console.log(`   ${colors.red}Error: ${m.error}${colors.reset}`);
      }
    });
  } catch (err) {
    logError(`Error: ${err.message}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  log('\n' + '═'.repeat(60), 'magenta');
  log('  🔧 NCRM Migration Runner CLI', 'bold');
  log('═'.repeat(60), 'magenta');
  
  // Check connection first
  const connected = await checkConnection();
  if (!connected) {
    process.exit(1);
  }
  
  switch (command) {
    case 'pending':
    case undefined:
      await runPendingMigrations();
      break;
      
    case 'history':
      await listMigrationHistory();
      break;
      
    case 'file':
      if (!args[1]) {
        logError('Please provide a file path');
        logInfo('Usage: node scripts/run-migration.mjs file <path-to-sql>');
        break;
      }
      await runSqlFile(args[1]);
      break;
      
    case 'sql':
      if (!args[1]) {
        logError('Please provide SQL to execute');
        logInfo('Usage: node scripts/run-migration.mjs sql "SELECT * FROM profiles"');
        break;
      }
      await runDirectSql(args.slice(1).join(' '));
      break;
      
    case 'help':
      log('\nAvailable commands:', 'yellow');
      log('  pending  - Run all pending migrations from pending-migrations.json');
      log('  history  - Show migration history');
      log('  file <path> - Run a specific SQL file');
      log('  sql "..." - Run direct SQL');
      log('  help     - Show this help');
      break;
      
    default:
      logWarning(`Unknown command: ${command}`);
      log('Use "help" to see available commands');
  }
  
  log('\n' + '═'.repeat(60) + '\n', 'magenta');
}

main().catch(console.error);
