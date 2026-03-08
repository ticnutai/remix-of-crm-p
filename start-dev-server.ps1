#!/usr/bin/env pwsh
# start-dev.ps1 - Start development server with proper PATH

Write-Host "Starting CRM Pro Development Server..." -ForegroundColor Cyan

# Add Node.js to PATH
$env:Path = "C:\Program Files\nodejs;" + $env:Path

# Add Git to PATH
$env:Path = "C:\Program Files\Git\cmd;" + $env:Path

# Add Scoop to PATH if exists
if (Test-Path "$env:USERPROFILE\scoop\shims") {
    $env:Path = "$env:USERPROFILE\scoop\shims;" + $env:Path
}

Write-Host "Starting Vite dev server..." -ForegroundColor Yellow
Write-Host ""

# Run dev server
npm run dev
