# Start PostgreSQL Service - Run as Administrator

Write-Host "Starting PostgreSQL Service (Admin)" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix this:" -ForegroundColor Yellow
    Write-Host "1. Right-click on PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "Checking PostgreSQL service..." -ForegroundColor Yellow

# Get the service
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "ERROR: PostgreSQL service not found" -ForegroundColor Red
    Write-Host "Available services:" -ForegroundColor Yellow
    Get-Service | Where-Object { $_.Name -like "*postgres*" } | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Gray
    }
    exit 1
}

# Check if already running
if ($service.Status -eq 'Running') {
    Write-Host "OK: PostgreSQL is already running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Connection details:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor Yellow
    Write-Host "  Port: 5432" -ForegroundColor Yellow
    Write-Host "  User: postgres" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Start the service
Write-Host "Starting service..." -ForegroundColor Yellow
Start-Service -Name "postgresql-x64-18"

# Wait for it to fully start
Start-Sleep -Seconds 4

# Verify it's running
$service.Refresh()
if ($service.Status -eq 'Running') {
    Write-Host "SUCCESS: PostgreSQL service started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Connection details:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor Yellow
    Write-Host "  Port: 5432" -ForegroundColor Yellow
    Write-Host "  User: postgres" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Initialize database schema:" -ForegroundColor Gray
    Write-Host "   cd lib/db ; corepack pnpm@9 run push" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Start the API server:" -ForegroundColor Gray
    Write-Host "   .\start-api.ps1" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "ERROR: Failed to start PostgreSQL service" -ForegroundColor Red
    Write-Host "Current Status: $($service.Status)" -ForegroundColor Red
    exit 1
}
