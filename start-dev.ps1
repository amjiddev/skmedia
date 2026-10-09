# SK Media Development Server Startup Script
# This script starts API Server and Frontend together

Write-Host "=== SK Media Development Environment ===" -ForegroundColor Green
Write-Host ""

# Define paths
$rootPath = "d:\SK Media\skmedia"
$apiServerPath = "$rootPath\artifacts\api-server"
$frontendPath = "$rootPath\artifacts\sk-media-monetization"
$dbPath = "$rootPath\lib\db"

Set-Location $rootPath

# Function to check PostgreSQL
function Test-PostgreSQL {
    Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
    
    try {
        $testConn = & psql -U postgres -h localhost -c "SELECT 1" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] PostgreSQL is running" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "[INFO] PostgreSQL check inconclusive" -ForegroundColor Yellow
    }
    
    return $false
}

# Check if dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "$rootPath\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & corepack pnpm@9 install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Dependency installation failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "[OK] Dependencies ready" -ForegroundColor Green

Write-Host ""

# Note: PostgreSQL should be running
Write-Host "Note: PostgreSQL should be running on localhost:5432" -ForegroundColor Yellow
Write-Host "If not, start it before running this script" -ForegroundColor Yellow

Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Cyan
Write-Host ""

# Start API Server in background
Write-Host "Starting API Server (port 3000)..." -ForegroundColor Cyan
$apiJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    $env:NODE_ENV = 'development'
    & corepack pnpm@9 run dev
} -ArgumentList $apiServerPath -Name "api-server"

Start-Sleep -Seconds 3

# Start Frontend in background
Write-Host "Starting Frontend (port 5173)..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    & corepack pnpm@9 run dev
} -ArgumentList $frontendPath -Name "frontend"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=== Servers Running ===" -ForegroundColor Green
Write-Host "API Server:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend:    http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Credentials:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor Cyan
Write-Host "  Password: Admin@12345" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Keep the script running and monitor jobs
while ($true) {
    $apiJobState = Get-Job -Name "api-server" -ErrorAction SilentlyContinue
    if ($apiJobState -and $apiJobState.State -eq 'Completed') {
        Write-Host "API Server stopped" -ForegroundColor Yellow
        break
    }
    
    $frontendJobState = Get-Job -Name "frontend" -ErrorAction SilentlyContinue
    if ($frontendJobState -and $frontendJobState.State -eq 'Completed') {
        Write-Host "Frontend stopped" -ForegroundColor Yellow
    }
    
    Start-Sleep -Seconds 1
}

# Cleanup on exit
Write-Host ""
Write-Host "Cleaning up..." -ForegroundColor Yellow
Get-Job -Name "api-server" -ErrorAction SilentlyContinue | Stop-Job -ErrorAction SilentlyContinue
Get-Job -Name "api-server" -ErrorAction SilentlyContinue | Remove-Job -ErrorAction SilentlyContinue
Get-Job -Name "frontend" -ErrorAction SilentlyContinue | Stop-Job -ErrorAction SilentlyContinue
Get-Job -Name "frontend" -ErrorAction SilentlyContinue | Remove-Job -ErrorAction SilentlyContinue

Write-Host "[OK] All servers stopped" -ForegroundColor Green
