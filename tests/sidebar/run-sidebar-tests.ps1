#!/usr/bin/env pwsh
# סקריפט להרצת בדיקות Sidebar
# 
# שימוש:
#   .\run-sidebar-tests.ps1              # הרץ את כל הבדיקות
#   .\run-sidebar-tests.ps1 -File main   # הרץ רק בדיקות mainNavItems
#   .\run-sidebar-tests.ps1 -Coverage    # הרץ עם coverage

param(
    [string]$File = "",
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$Debug,
    [switch]$Verbose
)

Write-Host "🧪 מערכת בדיקות Sidebar" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# בדוק אם יש Playwright מותקן
$hasPlaywright = Get-Command npx -ErrorAction SilentlyContinue
if (-not $hasPlaywright) {
    Write-Host "❌ Playwright לא מותקן. אנא התקן אותו עם:" -ForegroundColor Red
    Write-Host "   npm install -D @playwright/test" -ForegroundColor Yellow
    exit 1
}

# בנה את פקודת הבדיקה
$testCommand = "npx playwright test"

# הוסף את הקובץ הספציפי אם צוין
if ($File) {
    switch ($File.ToLower()) {
        "main" { $testCommand += " tests/sidebar/mainNavItems.test.ts" }
        "system" { $testCommand += " tests/sidebar/systemNavItems.test.ts" }
        "custom" { $testCommand += " tests/sidebar/customTables.test.ts" }
        "app" { $testCommand += " tests/sidebar/appSidebar.test.ts" }
        "index" { $testCommand += " tests/sidebar/index.test.ts" }
        default {
            Write-Host "❌ קובץ לא מוכר: $File" -ForegroundColor Red
            Write-Host "קבצים זמינים: main, system, custom, app, index" -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    $testCommand += " tests/sidebar"
}

# הוסף אופציות
if ($Coverage) {
    $testCommand += " --coverage"
}

if ($Watch) {
    $testCommand += " --watch"
}

if ($Debug) {
    $testCommand += " --debug"
}

if ($Verbose) {
    $testCommand += " --reporter=verbose"
}

Write-Host "🚀 מריץ: $testCommand" -ForegroundColor Green
Write-Host ""

# הרץ את הבדיקות
Invoke-Expression $testCommand

# בדוק תוצאה
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ כל הבדיקות עברו בהצלחה!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ יש בדיקות שנכשלו" -ForegroundColor Red
    exit 1
}
