# Git Sync Script - סקריפט סינכרון Git דו-צדדי
# משך שינויים מ-GitHub ודוחף שינויים מקומיים

Write-Host "🔄 מתחיל סינכרון Git..." -ForegroundColor Cyan

# בדיקה אם יש שינויים שלא נשמרו
$status = git status --porcelain
if ($status) {
    Write-Host "📝 נמצאו שינויים מקומיים - מבצע commit..." -ForegroundColor Yellow
    
    # הוספת כל הקבצים לשינויים
    git add .
    
    # יצירת commit עם תאריך נוכחי
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Auto-sync: $timestamp"
    
    Write-Host "✅ Commit בוצע בהצלחה" -ForegroundColor Green
}

# משיכת שינויים מ-GitHub
Write-Host "⬇️ משוך שינויים מ-GitHub..." -ForegroundColor Cyan
$pullResult = git pull origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pull הושלם בהצלחה" -ForegroundColor Green
} else {
    Write-Host "⚠️ שגיאה ב-Pull: $pullResult" -ForegroundColor Red
    
    # בדיקה אם יש קונפליקטים
    if ($pullResult -like "*CONFLICT*") {
        Write-Host "⚠️ יש קונפליקטים! פתור אותם לפני שתמשיך" -ForegroundColor Red
        exit 1
    }
}

# דחיפת שינויים ל-GitHub
if ($status) {
    Write-Host "⬆️ דוחף שינויים ל-GitHub..." -ForegroundColor Cyan
    $pushResult = git push origin main 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push הושלם בהצלחה" -ForegroundColor Green
    } else {
        Write-Host "⚠️ שגיאה ב-Push: $pushResult" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🎉 סינכרון Git הושלם בהצלחה!" -ForegroundColor Green
