#!/usr/bin/env pwsh
# sync-pull.ps1 - משיכה GitHub -> מקומי + Supabase
# שימוש: .\sync-pull.ps1

Write-Host "⬇️  מתחיל סינכרון דו-צדדי - משיכה..." -ForegroundColor Cyan

# 1. בדיקת שינויים מקומיים
Write-Host "`n📋 בודק שינויים מקומיים..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  יש לך שינויים מקומיים שלא נשמרו!" -ForegroundColor Yellow
    Write-Host "האם לשמור אותם לפני המשיכה? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "💾 שומר שינויים מקומיים..." -ForegroundColor Yellow
        git stash push -m "Auto-stash before pull $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        $stashed = $true
    } else {
        Write-Host "⚠️  ביטול משיכה - שמור את השינויים תחילה" -ForegroundColor Red
        exit 1
    }
}

# 2. משיכה מ-GitHub
Write-Host "`n🌐 מושך מ-GitHub..." -ForegroundColor Yellow
$branch = git branch --show-current
git pull origin $branch

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ שגיאה במשיכה מ-GitHub" -ForegroundColor Red
    if ($stashed) {
        Write-Host "♻️  משחזר שינויים מקומיים..." -ForegroundColor Yellow
        git stash pop
    }
    exit 1
}

Write-Host "✅ משיכה מ-GitHub הושלמה בהצלחה!" -ForegroundColor Green

# 3. החזרת שינויים מקומיים
if ($stashed) {
    Write-Host "`n♻️  משחזר שינויים מקומיים..." -ForegroundColor Yellow
    git stash pop
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ שינויים מקומיים שוחזרו בהצלחה!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ייתכנו קונפליקטים - בדוק ידנית" -ForegroundColor Yellow
    }
}

# 4. סינכרון Supabase migrations
Write-Host "`n🗄️  בודק Supabase migrations..." -ForegroundColor Yellow
if (Test-Path "supabase/migrations") {
    try {
        if (Get-Command supabase -ErrorAction SilentlyContinue) {
            Write-Host "📥 מושך migrations מ-Supabase..." -ForegroundColor Yellow
            supabase db pull
            Write-Host "✅ Supabase migrations סונכרנו!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Supabase CLI לא מותקן - דלג על סינכרון DB" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  שגיאה בסינכרון Supabase: $_" -ForegroundColor Yellow
    }
}

# 5. התקנת dependencies אם צריך
Write-Host "`n📦 בודק dependencies..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    $packageChanged = git diff HEAD@{1} HEAD --name-only | Select-String "package.json|package-lock.json"
    if ($packageChanged) {
        Write-Host "📥 מתקין dependencies מעודכנים..." -ForegroundColor Yellow
        npm install
        Write-Host "✅ Dependencies עודכנו!" -ForegroundColor Green
    }
}

Write-Host "`n✨ סינכרון הושלם בהצלחה!" -ForegroundColor Green
