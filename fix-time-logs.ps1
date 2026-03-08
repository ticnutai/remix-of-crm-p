# ======================================
# 🔧 תיקון שיוך לוגי זמן ללקוחות
# ======================================
#
# סקריפט זה מתקן את הבעיה שלוגי זמן לא משויכים ללקוחות אחרי שחזור.
# הוא טוען את קובץ הגיבוי, מוצא התאמות, ומעדכן את ה-DB.
#
# אפשרויות:
#   1. ריצת ניסיון (לא משנה נתונים)
#   2. תיקון מלא (מעדכן את ה-DB)
#   3. תיקון עם קובץ ספציפי
#

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🔧 תיקון שיוך לוגי זמן ללקוחות                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# בדיקה ש-Node.js מותקן
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js לא נמצא! יש להתקין Node.js" -ForegroundColor Red
    exit 1
}

# תפריט אפשרויות
Write-Host ""
Write-Host "בחר פעולה:" -ForegroundColor Yellow
Write-Host "  [1] 🔍 ריצת ניסיון (DRY RUN - לא משנה נתונים)" -ForegroundColor White
Write-Host "  [2] 🔧 תיקון לוגים ללא לקוח" -ForegroundColor White
Write-Host "  [3] 🔧 תיקון כל הלוגים (כולל משויכים)" -ForegroundColor White
Write-Host "  [4] 📂 בחירת קובץ גיבוי ספציפי" -ForegroundColor White
Write-Host "  [5] ❌ יציאה" -ForegroundColor White
Write-Host ""

$choice = Read-Host "בחירה (1-5)"

$scriptPath = Join-Path $scriptDir "fix-time-logs-clients.mjs"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔍 מריץ בדיקה (ללא שינויים)..." -ForegroundColor Yellow
        Write-Host ""
        Set-Location $projectDir
        node $scriptPath --dry-run
    }
    "2" {
        Write-Host ""
        Write-Host "🔧 מתקן לוגים ללא לקוח..." -ForegroundColor Yellow
        Write-Host ""
        Set-Location $projectDir
        node $scriptPath
    }
    "3" {
        Write-Host ""
        Write-Host "🔧 מתקן את כל הלוגים..." -ForegroundColor Yellow
        Write-Host ""
        Set-Location $projectDir
        node $scriptPath --all
    }
    "4" {
        Write-Host ""
        # רשימת קבצי גיבוי
        $backupFiles = Get-ChildItem -Path $projectDir -Filter "*.json" | 
            Where-Object { $_.Name -match "backup" } | 
            Sort-Object LastWriteTime -Descending
        
        if ($backupFiles.Count -eq 0) {
            Write-Host "❌ לא נמצאו קבצי גיבוי!" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "קבצי גיבוי שנמצאו:" -ForegroundColor Yellow
        for ($i = 0; $i -lt $backupFiles.Count; $i++) {
            $file = $backupFiles[$i]
            $size = [math]::Round($file.Length / 1MB, 2)
            Write-Host "  [$($i + 1)] $($file.Name) ($size MB, $($file.LastWriteTime.ToString('dd/MM/yyyy')))" -ForegroundColor White
        }
        Write-Host ""
        
        $fileChoice = Read-Host "בחר קובץ (1-$($backupFiles.Count))"
        $selectedFile = $backupFiles[[int]$fileChoice - 1]
        
        Write-Host ""
        Write-Host "📂 נבחר: $($selectedFile.Name)" -ForegroundColor Cyan
        
        $modeChoice = Read-Host "מצב: [1] בדיקה בלבד  [2] תיקון"
        
        Set-Location $projectDir
        if ($modeChoice -eq "1") {
            node $scriptPath --backup $selectedFile.FullName --dry-run
        } else {
            node $scriptPath --backup $selectedFile.FullName
        }
    }
    "5" {
        Write-Host "👋 יציאה" -ForegroundColor Gray
        exit 0
    }
    default {
        Write-Host "❌ בחירה לא חוקית" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ הסקריפט הסתיים!" -ForegroundColor Green
Write-Host ""
Read-Host "לחץ Enter לסגירה"
