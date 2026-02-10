#!/usr/bin/env pwsh
# Quick Login Helper - Opens browser and shows login info

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "   CRM Login Helper" -ForegroundColor Cyan  
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check server
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 3 -UseBasicParsing
    Write-Host "OK Server is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR Server is not running!" -ForegroundColor Red
    Write-Host "Run: .\start-dev-server.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Yellow
Write-Host "   LOGIN CREDENTIALS" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Email:    " -NoNewline -ForegroundColor White
Write-Host "jj1212t@gmail.com" -ForegroundColor Cyan
Write-Host "Password: " -NoNewline -ForegroundColor White  
Write-Host "543211" -ForegroundColor Cyan
Write-Host ""
Write-Host "==================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Opening browser..." -ForegroundColor Green
Start-Sleep -Seconds 2
Start-Process "http://localhost:8080"

Write-Host ""
Write-Host "INSTRUCTIONS:" -ForegroundColor Magenta
Write-Host "1. Wait for browser to open" -ForegroundColor White
Write-Host "2. Enter email: jj1212t@gmail.com" -ForegroundColor White
Write-Host "3. Enter password: 543211" -ForegroundColor White
Write-Host "4. Click Sign In" -ForegroundColor White
Write-Host ""
Write-Host "If login fails, press F12 and check Console tab for errors" -ForegroundColor Gray
