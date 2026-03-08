#!/usr/bin/env pwsh
# Restart Everything - Clean start

Write-Host "Restarting CRM System..." -ForegroundColor Cyan
Write-Host ""

# Stop all Node processes
Write-Host "Stopping old Node processes..." -ForegroundColor Yellow
try {
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Write-Host "OK Node processes stopped" -ForegroundColor Green
} catch {
    Write-Host "No Node processes running" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Check if port 8080 is free
Write-Host "`nChecking port 8080..." -ForegroundColor Yellow
$process = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "Port 8080 is in use, trying to free it..." -ForegroundColor Yellow
    Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host "`nStarting development server..." -ForegroundColor Green
Write-Host ""

# Set PATH
$env:Path = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;" + $env:Path

# Start server in background
$job = Start-Job -ScriptBlock {
    Set-Location 'C:\Users\jj121\Documents\remix-of-crm-p'
    $env:Path = "C:\Program Files\nodejs;" + $env:Path
    npm run dev
}

Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if server is running
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 3 -UseBasicParsing
    Write-Host "OK Server is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "Ready to login!" -ForegroundColor Green
    Write-Host "Run: npm run login" -ForegroundColor Yellow
    Write-Host "==================================" -ForegroundColor Cyan
} catch {
    Write-Host "Server is still starting..." -ForegroundColor Yellow
    Write-Host "Wait 10 more seconds and try: npm run login" -ForegroundColor Yellow
}
