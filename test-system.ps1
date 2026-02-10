#!/usr/bin/env pwsh
# Test System - Quick health check
# Auto-login credentials: jj1212t@gmail.com / 543211

Write-Host "=== CRM System Health Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
Write-Host "Checking server..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 5 -UseBasicParsing
    Write-Host "OK Server is running on http://localhost:8080" -ForegroundColor Green
} catch {
    Write-Host "FAIL Server is not responding" -ForegroundColor Red
    exit 1
}

# Check .env configuration
Write-Host "`nChecking environment..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw -ErrorAction SilentlyContinue
if ($envContent -like "*eadeymehidcndudeycnf*") {
    Write-Host "OK Supabase URL configured" -ForegroundColor Green
}
if ($envContent -like "*eyJhbGciOiJIUzI1NiI*") {
    Write-Host "OK Supabase key configured" -ForegroundColor Green
}

# Display login credentials
Write-Host "`n=== Login Credentials ===" -ForegroundColor Cyan
Write-Host "Email:    jj1212t@gmail.com" -ForegroundColor White
Write-Host "Password: 543211" -ForegroundColor White
Write-Host ""

# Check Node processes
Write-Host "Active Node processes:" -ForegroundColor Yellow
$nodeProcs = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
foreach ($proc in $nodeProcs) {
    $cpu = [math]::Round($proc.CPU, 2)
    $mem = [math]::Round($proc.WorkingSet64/1MB, 0)
    Write-Host "  [PID: $($proc.Id)] CPU: ${cpu}s RAM: ${mem}MB" -ForegroundColor Gray
}

Write-Host "`nOK System is healthy!" -ForegroundColor Green
Write-Host "Open: http://localhost:8080" -ForegroundColor Cyan
