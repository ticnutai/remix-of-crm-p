#!/usr/bin/env pwsh
# sync-status.ps1 - בדיקת סטטוס סינכרון
# שימוש: .\sync-status.ps1

Write-Host "📊 סטטוס סינכרון" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Git Status
Write-Host "`n📋 Git Status:" -ForegroundColor Yellow
$status = git status --short
if ($status) {
    git status --short
    Write-Host "⚠️  יש שינויים לא מסונכרנים" -ForegroundColor Yellow
} else {
    Write-Host "✅ אין שינויים מקומיים" -ForegroundColor Green
}

# Remote Status
Write-Host "`n🌐 מצב ענן (GitHub):" -ForegroundColor Yellow
git fetch origin 2>&1 | Out-Null
$branch = git branch --show-current
$local = git rev-parse HEAD
$remote = git rev-parse "origin/$branch" 2>$null

if ($local -eq $remote) {
    Write-Host "✅ מסונכרן עם GitHub" -ForegroundColor Green
} else {
    $behind = git rev-list HEAD..origin/$branch --count 2>$null
    $ahead = git rev-list origin/$branch..HEAD --count 2>$null
    
    if ($ahead -gt 0) {
        Write-Host "⬆️  יש $ahead commits מקומיים לדחוף" -ForegroundColor Yellow
    }
    if ($behind -gt 0) {
        Write-Host "⬇️  יש $behind commits חדשים למשוך" -ForegroundColor Yellow
    }
}

# Branch Info
Write-Host "`n🌿 ענף נוכחי:" -ForegroundColor Yellow
Write-Host "   $branch" -ForegroundColor Cyan

# Last Commit
Write-Host "`n💾 Commit אחרון:" -ForegroundColor Yellow
$lastCommit = git log -1 --pretty=format:"%h - %s (%cr)"
Write-Host "   $lastCommit" -ForegroundColor Cyan

# Supabase Status
Write-Host "`n Supabase:" -ForegroundColor Yellow
if (Get-Command supabase -ErrorAction SilentlyContinue) {
    if (Test-Path "supabase/config.toml") {
        Write-Host "   Connected to project" -ForegroundColor Green
        $projectId = Select-String -Path "supabase/config.toml" -Pattern 'project_id = "(.+)"' | ForEach-Object { $_.Matches.Groups[1].Value }
        Write-Host "   Project ID: $projectId" -ForegroundColor Cyan
    } else {
        Write-Host "   Not linked to project" -ForegroundColor Yellow
    }
} else {
    Write-Host "   CLI not installed" -ForegroundColor Yellow
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
