import os
import re
from pathlib import Path

migrations_dir = Path('supabase/migrations')

# Files with Hebrew text
files_with_hebrew = {
    '20260208_quote_cloud_save_and_versions.sql': [
        ("תיבות טקסט מותאמות עם עיצוב וסגנון", "Custom text boxes with styling"),
    ],
    '20260201_fix_rls_smart.sql': [
        ("-- תיקון מדיניות RLS על בסיס המבנה האמיתי של הטבלאות", "-- Fix RLS policies based on actual table structure"),
    ]
}

print("=== Removing Hebrew Text from Migration Files ===\n")

for filename, replacements in files_with_hebrew.items():
    filepath = migrations_dir / filename
    if not filepath.exists():
        print(f"⚠️  Skipped: {filename} (not found)")
        continue
    
    # Read file
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Track if changes were made
    original_content = content
    
    # Replace Hebrew text
    for hebrew, english in replacements:
        if hebrew in content:
            content = content.replace(hebrew, english)
            print(f"  {filename}: Replaced Hebrew text")
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed: {filename}\n")
    else:
        print(f"○ No Hebrew found in: {filename}\n")

print("=== Hebrew Removal Complete ===")
