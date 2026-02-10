# Quick Start Script - סקריפט הפעלה מהיר
# הפעלת שרת פיתוח עם סינכרון אוטומטי

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   🚀 CRM Pro - הפעלה מהירה             ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# הגדרת PATH
$env:Path += ";C:\Program Files\nodejs;$env:USERPROFILE\scoop\shims;C:\Program Files\Git\cmd"

# בדיקת קובץ .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ קובץ .env לא נמצא!" -ForegroundColor Yellow
    Write-Host "📝 יוצר קובץ .env מ-.env.example..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "✅ נוצר קובץ .env - אנא עדכן את הערכים" -ForegroundColor Green
    Write-Host "🔗 פתח את .env וערוך את:" -ForegroundColor Yellow
    Write-Host "   - VITE_SUPABASE_PUBLISHABLE_KEY" -ForegroundColor Yellow
    Write-Host ""
    
    # פתיחת הקובץ
    code .env
    
    Read-Host "לחץ Enter אחרי שתעדכן את .env"
}

# שאלה אם לבצע סינכרון
$sync = Read-Host "`n🔄 האם לבצע סינכרון מלא לפני ההפעלה? (Y/N)"

if ($sync -eq "Y" -or $sync -eq "y") {
    Write-Host "`n⏳ מבצע סינכרון מלא..." -ForegroundColor Cyan
    & "$PSScriptRoot\sync-all.ps1"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n⚠️ הסינכרון נכשל, אך ממשיך בהפעלה..." -ForegroundColor Yellow
    }
}

# הפעלת שרת הפיתוח
Write-Host "`n🚀 מפעיל שרת פיתוח..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📱 הפרויקט יפתח בדפדפן בכתובת: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🛑 לעצירת השרת לחץ Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# הפעלת vite
npm run dev
