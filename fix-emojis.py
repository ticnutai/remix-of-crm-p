import os
import re
from pathlib import Path

# Emoji replacements
emoji_map = {
    '✅': '[OK]',
    '❌': '[FAIL]',
    '🔥': '',
    '📧': '[EMAIL]',
    '📝': '[NOTE]',
    '💾': '[SAVE]',
    '🎯': '[TARGET]',
    '📊': '[STATS]'
}

migrations_dir = Path('supabase/migrations')
files_to_fix = [
    '20260201_fix_time_logs_rls.sql',
    '20260201_fix_rls_smart.sql',
    '20260201_fix_quotes_rls.sql',
    '20260201_fix_all_rls.sql'
]

print("=== Removing Emojis from Migration Files ===\n")

for filename in files_to_fix:
    filepath = migrations_dir / filename
    if not filepath.exists():
        print(f"⚠️  Skipped: {filename} (not found)")
        continue
    
    # Read file
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Track if changes were made
    original_content = content
    
    # Replace emojis
    for emoji, replacement in emoji_map.items():
        if emoji in content:
            content = content.replace(emoji, replacement)
            print(f"  {filename}: Replaced '{emoji}' with '{replacement}'")
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed: {filename}\n")
    else:
        print(f"○ No emojis found in: {filename}\n")

print("=== Emoji Removal Complete ===")
