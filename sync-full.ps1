#!/usr/bin/env pwsh
# sync-full.ps1 - סינכרון דו-צדדי מלא
# שימוש: .\sync-full.ps1 "הודעת commit"

param(
    [Parameter(Mandatory=$false)]
    [string]$CommitMessage = "סינכרון מלא"
)

Write-Host "🔄 מתחיל סינכרון דו-צדדי מלא..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# שלב 1: משיכה מהענן
Write-Host "`n[1/2] 📥 משלב משיכה..." -ForegroundColor Magenta
& "$PSScriptRoot/sync-pull.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ שגיאה בשלב המשיכה - נעצר" -ForegroundColor Red
    exit 1
}

# המתנה קצרה
Start-Sleep -Seconds 1

# שלב 2: דחיפה לענן
Write-Host "`n[2/2] 📤 משלב דחיפה..." -ForegroundColor Magenta
& "$PSScriptRoot/sync-push.ps1" -CommitMessage $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ שגיאה בשלב הדחיפה" -ForegroundColor Red
    exit 1
}

# סיכום
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ סינכרון דו-צדדי הושלם בהצלחה!" -ForegroundColor Green
Write-Host "🔄 המקור המקומי והענן מסונכרנים לחלוטין" -ForegroundColor Cyan
