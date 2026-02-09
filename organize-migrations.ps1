# Script to organize migration files safely
# Created: 2026-02-09

Write-Host "=== ארגון קבצי מיגרציה ===" -ForegroundColor Cyan
Write-Host ""

$migrationsPath = "supabase\migrations"
$archivedPath = "$migrationsPath\_archived"
$manualPath = "$migrationsPath\_manual_scripts"
$dataPath = "$migrationsPath\_data_imports"

# Step 1: Move archive files
Write-Host "שלב 1: העברת קבצי archive..." -ForegroundColor Yellow
$archiveFiles = Get-ChildItem "$migrationsPath\archive_*.sql"
Write-Host "נמצאו $($archiveFiles.Count) קבצי archive"

foreach ($file in $archiveFiles) {
    Move-Item $file.FullName $archivedPath -Force
    Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
}

# Step 2: Move IMPORT files  
Write-Host "`nשלב 2: העברת קבצי IMPORT..." -ForegroundColor Yellow
$importFiles = Get-ChildItem "$migrationsPath\IMPORT_*.sql"
Write-Host "נמצאו $($importFiles.Count) קבצי ייבוא"

foreach ($file in $importFiles) {
    Move-Item $file.FullName $dataPath -Force
    Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
}

# Step 3: Move manual script files
Write-Host "`nשלב 3: העברת סקריפטים ידניים..." -ForegroundColor Yellow
$manualFiles = @(
    "CHECK_MIGRATION_STATUS.sql",
    "COMPLETE_MIGRATION.sql",
    "COMPLETE_MIGRATION_FIXED.sql",
    "create_missing_tables.sql",
    "FINAL_MIGRATION.sql",
    "INSERT_CONTRACT_TEMPLATE.sql",
    "INSERT_QUOTE_TEMPLATE.sql",
    "MIGRATION_CLEAN.sql",
    "MIGRATION_NO_FUNCTIONS.sql",
    "RUN_FIRST_health_check.sql",
    "RUN_THIS_IN_SUPABASE.sql",
    "RUN_THIS_V2.sql",
    "SIMPLE_MIGRATION.sql",
    "verify-migration.sql"
)

$movedCount = 0
foreach ($fileName in $manualFiles) {
    $filePath = "$migrationsPath\$fileName"
    if (Test-Path $filePath) {
        Move-Item $filePath $manualPath -Force
        Write-Host "  ✓ $fileName" -ForegroundColor Green
        $movedCount++
    }
}
Write-Host "הועברו $movedCount קבצים"

# Step 4: Handle duplicate IMPORT files
Write-Host "`nשלב 4: טיפול בכפילויות..." -ForegroundColor Yellow
$oldUserFile = "$dataPath\IMPORT_0_create_users.sql"
if (Test-Path $oldUserFile) {
    Remove-Item $oldUserFile -Force
    Write-Host "  ✓ נמחק IMPORT_0_create_users.sql (קיים V2)" -ForegroundColor Green
}

Write-Host "`n=== סיום! ===" -ForegroundColor Cyan
Write-Host "הארגון הושלם בהצלחה" -ForegroundColor Green
Write-Host ""
Write-Host "תיקיות:"
Write-Host "  📁 _archived: קבצים בארכיון"
Write-Host "  📁 _data_imports: קבצי ייבוא נתונים"
Write-Host "  📁 _manual_scripts: סקריפטים להרצה ידנית"
Write-Host ""
