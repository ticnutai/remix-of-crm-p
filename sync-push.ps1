#!/usr/bin/env pwsh
# sync-push.ps1 - דחיפה מקומית -> GitHub + Supabase
# שימוש: .\sync-push.ps1 "הודעת commit"

param(
    [Parameter(Mandatory=$false)]
    [string]$CommitMessage = "עדכון אוטומטי"
)

Write-Host "🚀 מתחיל סינכרון דו-צדדי - דחיפה..." -ForegroundColor Cyan

# 1. בדיקת שינויים
Write-Host "`n📋 בודק שינויים..." -ForegroundColor Yellow
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ אין שינויים לסנכרון" -ForegroundColor Green
    exit 0
}

# 2. הוספת כל השינויים
Write-Host "`n➕ מוסיף שינויים ל-staging..." -ForegroundColor Yellow
git add -A

# 3. יצירת commit
Write-Host "`n💾 יוצר commit..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$fullMessage = "$CommitMessage [$timestamp]"
git commit -m $fullMessage

# 4. דחיפה ל-GitHub
Write-Host "`n🌐 דוחף ל-GitHub..." -ForegroundColor Yellow
$branch = git branch --show-current
git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ דחיפה ל-GitHub הושלמה בהצלחה!" -ForegroundColor Green
} else {
    Write-Host "❌ שגיאה בדחיפה ל-GitHub" -ForegroundColor Red
    exit 1
}

# 5. סינכרון Supabase (migrations)
Write-Host "`n🗄️  בודק migrations של Supabase..." -ForegroundColor Yellow
if (Test-Path "supabase/migrations") {
    Write-Host "📤 דוחף migrations ל-Supabase..." -ForegroundColor Yellow
    try {
        # אם יש Supabase CLI מותקן
        if (Get-Command supabase -ErrorAction SilentlyContinue) {
            supabase db push
            Write-Host "✅ Supabase migrations סונכרנו!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Supabase CLI לא מותקן - דלג על סינכרון DB" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  שגיאה בסינכרון Supabase: $_" -ForegroundColor Yellow
    }
}

Write-Host "`n✨ סינכרון הושלם בהצלחה!" -ForegroundColor Green
Write-Host "📊 סטטוס: $fullMessage" -ForegroundColor Cyan
