# ═══════════════════════════════════════════════════════════════════════════════
# 🛠️ סקריפט התקנה והגדרת כלי פיתוח - Spark Track Guide
# ═══════════════════════════════════════════════════════════════════════════════
# 
# סקריפט זה מכין את סביבת הפיתוח ומפעיל את כלי הפיתוח המובנים
#
# שימוש:
#   .\scripts\setup-dev-tools.ps1
#
# או עם פרמטרים:
#   .\scripts\setup-dev-tools.ps1 -Install    # התקנת dependencies
#   .\scripts\setup-dev-tools.ps1 -Start      # הפעלת שרת פיתוח
#   .\scripts\setup-dev-tools.ps1 -Clean      # ניקוי קאש
#   .\scripts\setup-dev-tools.ps1 -All        # הכל ביחד
#
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [switch]$Install,
    [switch]$Start,
    [switch]$Clean,
    [switch]$All,
    [switch]$Help
)

# ═══════════════════════════════════════════════════════════════════════════════
# הגדרות
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$NodeModulesPath = Join-Path $ProjectRoot "node_modules"
$BunLockPath = Join-Path $ProjectRoot "bun.lockb"

# צבעים
function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " $Text" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Text)
    Write-Host "  ▶ $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "  ✅ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "  ❌ $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "  ℹ️  $Text" -ForegroundColor Gray
}

# ═══════════════════════════════════════════════════════════════════════════════
# עזרה
# ═══════════════════════════════════════════════════════════════════════════════

function Show-Help {
    Write-Header "🛠️ סקריפט הגדרת כלי פיתוח"
    
    Write-Host @"
שימוש:
  .\scripts\setup-dev-tools.ps1 [פרמטרים]

פרמטרים:
  -Install    התקנת כל ה-dependencies (bun install)
  -Start      הפעלת שרת הפיתוח (bun dev)
  -Clean      ניקוי קאש ו-node_modules
  -All        ביצוע הכל: ניקוי, התקנה, והפעלה
  -Help       הצגת עזרה זו

דוגמאות:
  .\scripts\setup-dev-tools.ps1 -Install -Start
  .\scripts\setup-dev-tools.ps1 -All
  .\scripts\setup-dev-tools.ps1 -Clean

כלי פיתוח מובנים:
  📟 קונסול מפתחים    - יירוט כל console.log/error/warn
  🔍 זיהוי אלמנטים    - לחיצה על אלמנט לזיהוי קומפוננטה
  🤖 חיבור ל-Copilot  - שליחת מידע ישירות ל-VS Code
  🧹 ניקוי קאש עמוק   - מנקה Cache API, SW, localStorage

הפעלת כלי פיתוח:
  1. הפעל את האפליקציה
  2. לך להגדרות (Settings)
  3. הפעל "מצב פיתוח"
  4. הכפתורים יופיעו בצד שמאל למטה

"@ -ForegroundColor White
}

# ═══════════════════════════════════════════════════════════════════════════════
# בדיקת דרישות מקדימות
# ═══════════════════════════════════════════════════════════════════════════════

function Test-Prerequisites {
    Write-Header "🔍 בדיקת דרישות מקדימות"
    
    $allGood = $true
    
    # בדיקת Node.js
    Write-Step "בודק Node.js..."
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js $nodeVersion מותקן"
        } else {
            throw "Node.js לא נמצא"
        }
    } catch {
        Write-Error "Node.js לא מותקן! התקן מ: https://nodejs.org"
        $allGood = $false
    }
    
    # בדיקת Bun
    Write-Step "בודק Bun..."
    try {
        $bunVersion = bun --version 2>$null
        if ($bunVersion) {
            Write-Success "Bun $bunVersion מותקן"
        } else {
            throw "Bun לא נמצא"
        }
    } catch {
        Write-Error "Bun לא מותקן!"
        Write-Info "להתקנה: powershell -c `"irm bun.sh/install.ps1 | iex`""
        $allGood = $false
    }
    
    # בדיקת Git
    Write-Step "בודק Git..."
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Success "$gitVersion מותקן"
        } else {
            throw "Git לא נמצא"
        }
    } catch {
        Write-Error "Git לא מותקן! התקן מ: https://git-scm.com"
        $allGood = $false
    }
    
    # בדיקת VS Code (אופציונלי)
    Write-Step "בודק VS Code..."
    try {
        $codeVersion = code --version 2>$null | Select-Object -First 1
        if ($codeVersion) {
            Write-Success "VS Code $codeVersion מותקן"
        } else {
            throw "VS Code לא נמצא"
        }
    } catch {
        Write-Info "VS Code לא נמצא (אופציונלי, נדרש לחיבור Copilot)"
    }
    
    return $allGood
}

# ═══════════════════════════════════════════════════════════════════════════════
# ניקוי
# ═══════════════════════════════════════════════════════════════════════════════

function Clear-ProjectCache {
    Write-Header "🧹 ניקוי קאש ו-dependencies"
    
    Set-Location $ProjectRoot
    
    # מחיקת node_modules
    Write-Step "מוחק node_modules..."
    if (Test-Path $NodeModulesPath) {
        Remove-Item -Recurse -Force $NodeModulesPath
        Write-Success "node_modules נמחק"
    } else {
        Write-Info "node_modules לא קיים"
    }
    
    # מחיקת .vite cache
    $viteCachePath = Join-Path $ProjectRoot "node_modules\.vite"
    Write-Step "מוחק Vite cache..."
    if (Test-Path $viteCachePath) {
        Remove-Item -Recurse -Force $viteCachePath
        Write-Success "Vite cache נמחק"
    } else {
        Write-Info "Vite cache לא קיים"
    }
    
    # מחיקת dist
    $distPath = Join-Path $ProjectRoot "dist"
    Write-Step "מוחק dist..."
    if (Test-Path $distPath) {
        Remove-Item -Recurse -Force $distPath
        Write-Success "dist נמחק"
    } else {
        Write-Info "dist לא קיים"
    }
    
    # מחיקת bun cache
    Write-Step "מנקה Bun cache..."
    try {
        bun pm cache rm 2>$null
        Write-Success "Bun cache נוקה"
    } catch {
        Write-Info "לא הצלחתי לנקות Bun cache"
    }
    
    Write-Success "ניקוי הושלם!"
}

# ═══════════════════════════════════════════════════════════════════════════════
# התקנה
# ═══════════════════════════════════════════════════════════════════════════════

function Install-Dependencies {
    Write-Header "📦 התקנת Dependencies"
    
    Set-Location $ProjectRoot
    
    Write-Step "מריץ bun install..."
    try {
        bun install
        Write-Success "כל ה-dependencies הותקנו!"
    } catch {
        Write-Error "שגיאה בהתקנה: $_"
        exit 1
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# הפעלת שרת פיתוח
# ═══════════════════════════════════════════════════════════════════════════════

function Start-DevServer {
    Write-Header "🚀 הפעלת שרת פיתוח"
    
    Set-Location $ProjectRoot
    
    # בדיקה אם פורט תפוס
    Write-Step "בודק פורטים..."
    $port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    
    if ($port8080) {
        Write-Info "פורט 8080 תפוס, ישתמש ב-3000"
    }
    if ($port3000) {
        Write-Info "פורט 3000 תפוס, Vite יבחר פורט אחר"
    }
    
    Write-Step "מפעיל שרת..."
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host " 🎉 השרת רץ! פתח את הדפדפן בכתובת שתוצג" -ForegroundColor Green
    Write-Host " 💡 להפעלת כלי פיתוח: הגדרות → מצב פיתוח → הפעל" -ForegroundColor Yellow
    Write-Host " ⌨️  לעצירה: Ctrl+C" -ForegroundColor Gray
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    bun dev
}

# ═══════════════════════════════════════════════════════════════════════════════
# יצירת קובץ הגדרות VS Code
# ═══════════════════════════════════════════════════════════════════════════════

function Initialize-VSCodeSettings {
    Write-Header "⚙️ הגדרת VS Code"
    
    $vscodeDir = Join-Path $ProjectRoot ".vscode"
    if (-not (Test-Path $vscodeDir)) {
        New-Item -ItemType Directory -Path $vscodeDir | Out-Null
    }
    
    # settings.json
    $settingsPath = Join-Path $vscodeDir "settings.json"
    $settings = @{
        "editor.formatOnSave" = $true
        "editor.defaultFormatter" = "esbenp.prettier-vscode"
        "typescript.preferences.importModuleSpecifier" = "relative"
        "editor.codeActionsOnSave" = @{
            "source.fixAll.eslint" = "explicit"
        }
        "files.associations" = @{
            "*.css" = "tailwindcss"
        }
    }
    
    Write-Step "יוצר settings.json..."
    $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
    Write-Success "settings.json נוצר"
    
    # extensions.json
    $extensionsPath = Join-Path $vscodeDir "extensions.json"
    $extensions = @{
        "recommendations" = @(
            "GitHub.copilot"
            "GitHub.copilot-chat"
            "dbaeumer.vscode-eslint"
            "esbenp.prettier-vscode"
            "bradlc.vscode-tailwindcss"
            "formulahendry.auto-rename-tag"
        )
    }
    
    Write-Step "יוצר extensions.json..."
    $extensions | ConvertTo-Json -Depth 10 | Set-Content $extensionsPath -Encoding UTF8
    Write-Success "extensions.json נוצר"
    
    Write-Info "VS Code יציע להתקין את ההרחבות המומלצות"
}

# ═══════════════════════════════════════════════════════════════════════════════
# הוספת קיצורי דרך לכלי פיתוח
# ═══════════════════════════════════════════════════════════════════════════════

function Show-DevToolsInfo {
    Write-Header "🔧 כלי פיתוח מובנים"
    
    Write-Host @"

╔══════════════════════════════════════════════════════════════════════════════╗
║                        📟 קונסול מפתחים                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  מה זה עושה:                                                                  ║
║  • יורט כל console.log, console.error, console.warn                          ║
║  • יורט שגיאות גלובליות (window.onerror)                                      ║
║  • יורט Promise rejections                                                   ║
║  • מציג Stack Trace לשגיאות                                                   ║
║                                                                              ║
║  תכונות:                                                                      ║
║  • סינון לפי סוג (שגיאות/אזהרות/מידע/לוגים)                                     ║
║  • חיפוש טקסט חופשי                                                           ║
║  • העתקת כל הלוגים בלחיצה                                                      ║
║  • ניקוי הקונסול                                                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                        🔍 זיהוי אלמנטים (אלמנטור)                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  מה זה עושה:                                                                  ║
║  • לחיצה על כפתור Bug מפעילה מצב זיהוי                                        ║
║  • ריחוף מעל אלמנט מציג מסגרת כחולה                                           ║
║  • לחיצה על אלמנט מציגה מידע מפורט                                            ║
║                                                                              ║
║  מידע שמתקבל:                                                                 ║
║  • שם הקומפוננטה (React Fiber)                                                ║
║  • מיקום הקובץ בקוד                                                           ║
║  • Props של הקומפוננטה                                                        ║
║  • תג HTML וקלאסים                                                            ║
║  • מיקום וגודל על המסך                                                        ║
║  • תוכן טקסט                                                                  ║
║                                                                              ║
║  טיפ: Ctrl+Click לביצוע פעולה רגילה במקום זיהוי                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                        🤖 חיבור ל-VS Code Copilot                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  מה זה עושה:                                                                  ║
║  • לחיצה על "פתח ב-Copilot" פותחת את VS Code                                  ║
║  • שולח מידע על האלמנט ישירות ל-Copilot Chat                                  ║
║  • מעתיק את המידע המלא ל-clipboard כגיבוי                                     ║
║                                                                              ║
║  דרישות:                                                                      ║
║  • VS Code מותקן                                                              ║
║  • GitHub Copilot Chat מותקן                                                  ║
║                                                                              ║
║  פרוטוקול:                                                                    ║
║  vscode://GitHub.copilot-chat/chat?prompt=YOUR_PROMPT                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                        🧹 ניקוי קאש עמוק                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  מה זה מנקה:                                                                  ║
║  • Cache API - כל הקאשים של Service Worker                                   ║
║  • Service Workers - ביטול רישום כל ה-SW                                     ║
║  • localStorage - כל המידע (חוץ מהגדרות פיתוח)                                ║
║  • sessionStorage - כל המידע                                                 ║
║                                                                              ║
║  מתי להשתמש:                                                                  ║
║  • בעיות בטעינת האפליקציה                                                    ║
║  • מידע ישן לא מתעדכן                                                        ║
║  • באגים מוזרים                                                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor White

}

# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

# Banner
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "       🔥 Spark Track Guide - Developer Tools Setup 🔥         " -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# בדיקת פרמטרים
if ($Help) {
    Show-Help
    exit 0
}

if (-not ($Install -or $Start -or $Clean -or $All)) {
    Show-Help
    Show-DevToolsInfo
    exit 0
}

# בדיקת דרישות
$prereqOk = Test-Prerequisites
if (-not $prereqOk) {
    Write-Host ""
    Write-Error "חסרות דרישות מקדימות. התקן אותן ונסה שוב."
    exit 1
}

# ביצוע פעולות
if ($All) {
    Clear-ProjectCache
    Install-Dependencies
    Initialize-VSCodeSettings
    Show-DevToolsInfo
    Start-DevServer
}
else {
    if ($Clean) {
        Clear-ProjectCache
    }
    
    if ($Install) {
        Install-Dependencies
        Initialize-VSCodeSettings
    }
    
    if ($Start) {
        Start-DevServer
    }
}

Write-Host ""
Write-Success "הסקריפט הסתיים בהצלחה!"
Write-Host ""
