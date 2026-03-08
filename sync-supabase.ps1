# Supabase Sync Script - סקריפט סינכרון Supabase דו-צדדי
# מסנכרן migrations ונתונים עם Supabase Cloud

Write-Host "🔄 מתחיל סינכרון Supabase..." -ForegroundColor Cyan

# הגדרת PATH לכלול את Node.js ו-Scoop
$env:Path += ";C:\Program Files\nodejs;$env:USERPROFILE\scoop\shims"

# בדיקת חיבור לפרויקט
Write-Host "🔗 בודק חיבור לפרויקט Supabase..." -ForegroundColor Cyan

$projectId = "eadeymehidcndudeycnf"

# משיכת migrations מ-Supabase Cloud
Write-Host "⬇️ משוך migrations מ-Supabase Cloud..." -ForegroundColor Cyan
$pullResult = supabase db pull --project-id $projectId 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pull של migrations הושלם בהצלחה" -ForegroundColor Green
} else {
    Write-Host "⚠️ שגיאה במשיכת migrations: $pullResult" -ForegroundColor Yellow
    Write-Host "💡 ייתכן שצריך להתחבר תחילה עם: supabase login" -ForegroundColor Yellow
}

# דחיפת migrations ל-Supabase Cloud (אם יש קבצים חדשים)
$migrationsPath = "supabase\migrations"
if (Test-Path $migrationsPath) {
    $newMigrations = Get-ChildItem $migrationsPath -Filter "*.sql" | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-5) }
    
    if ($newMigrations) {
        Write-Host "⬆️ נמצאו migrations חדשים - מריץ אותם..." -ForegroundColor Cyan
        $pushResult = supabase db push --project-id $projectId 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migrations נדחפו בהצלחה" -ForegroundColor Green
        } else {
            Write-Host "⚠️ שגיאה בדחיפת migrations: $pushResult" -ForegroundColor Red
        }
    }
}

Write-Host "🎉 סינכרון Supabase הושלם!" -ForegroundColor Green
