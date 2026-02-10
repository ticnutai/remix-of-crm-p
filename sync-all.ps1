# Full Sync Script - סקריפט סינכרון מלא דו-צדדי
# מסנכרן גם Git וגם Supabase

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   🔄 סינכרון מלא - Git + Supabase      ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# הגדרת PATH
$env:Path += ";C:\Program Files\nodejs;$env:USERPROFILE\scoop\shims;C:\Program Files\Git\cmd"

# שלב 1: סינכרון Git
Write-Host "📦 שלב 1/2: סינכרון Git" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
& "$PSScriptRoot\sync-git.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ סינכרון Git נכשל!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# שלב 2: סינכרון Supabase
Write-Host "🗄️  שלב 2/2: סינכרון Supabase" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
& "$PSScriptRoot\sync-supabase.ps1"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅ סינכרון מלא הושלם בהצלחה!         ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
