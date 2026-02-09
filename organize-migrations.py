import os
import shutil
from pathlib import Path

# Base path
migrations_dir = Path('supabase/migrations')

# Create directories
(migrations_dir / '_archived').mkdir(exist_ok=True)
(migrations_dir / '_manual_scripts').mkdir(exist_ok=True)
(migrations_dir / '_data_imports').mkdir(exist_ok=True)

print("Step 1: Moving archive files...")
archive_files = [
    'archive_20260115160000_add_client_deadlines.sql',
    'archive_20260115_stage_templates.sql',
    'archive_20260127_system_health_check_clean.sql',
    'archive_20260131_fix_execute_safe_migration.sql'
]
for file in archive_files:
    src = migrations_dir / file
    if src.exists():
        shutil.move(str(src), str(migrations_dir / '_archived' / file))
        print(f"  Moved: {file}")

print("\nStep 2: Moving IMPORT files...")
import_files = [
    'IMPORT_0_create_users_v2.sql',
    'IMPORT_2_time_entries.sql',
    'IMPORT_3_link_time_entries_to_users.sql',
    'IMPORT_4_missing_clients_and_logs.sql',
    'IMPORT_5_missing_logs.sql',
    'IMPORT_6_spreadsheets.sql'
]
for file in import_files:
    src = migrations_dir / file
    if src.exists():
        shutil.move(str(src), str(migrations_dir / '_data_imports' / file))
        print(f"  Moved: {file}")

print("\nStep 3: Moving manual scripts...")
manual_scripts = [
    'CHECK_MIGRATION_STATUS.sql',
    'COMPLETE_MIGRATION.sql',
    'COMPLETE_MIGRATION_FIXED.sql',
    'create_missing_tables.sql',
    'FINAL_MIGRATION.sql',
    'INSERT_CONTRACT_TEMPLATE.sql',
    'INSERT_QUOTE_TEMPLATE.sql',
    'MIGRATION_CLEAN.sql',
    'MIGRATION_NO_FUNCTIONS.sql',
    'RUN_FIRST_health_check.sql',
    'RUN_THIS_IN_SUPABASE.sql',
    'RUN_THIS_V2.sql',
    'SIMPLE_MIGRATION.sql',
    'verify-migration.sql'
]
for file in manual_scripts:
    src = migrations_dir / file
    if src.exists():
        shutil.move(str(src), str(migrations_dir / '_manual_scripts' / file))
        print(f"  Moved: {file}")

print("\nStep 4: Complete!")

print("\n=== Migration Organization Complete ===")
print(f"Archive files: {len([f for f in archive_files if (migrations_dir / '_archived' / f).exists()])}")
print(f"Import files: {len([f for f in import_files if (migrations_dir / '_data_imports' / f).exists()])}")
print(f"Manual scripts: {len([f for f in manual_scripts if (migrations_dir / '_manual_scripts' / f).exists()])}")
