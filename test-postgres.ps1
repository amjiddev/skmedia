# Test PostgreSQL Connection

Write-Host ""
Write-Host "Testing PostgreSQL Connection..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if port 5432 is open
Write-Host "Test 1: Checking port 5432..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet
if ($portTest) {
    Write-Host "  PASS: Port 5432 is responding" -ForegroundColor Green
} else {
    Write-Host "  FAIL: Port 5432 is not responding" -ForegroundColor Red
    Write-Host "  This means PostgreSQL is not running" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Check service status
Write-Host "Test 2: Checking PostgreSQL service..." -ForegroundColor Yellow
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "  Service found: $($service.DisplayName)" -ForegroundColor Green
    Write-Host "  Status: $($service.Status)" -ForegroundColor $(if ($service.Status -eq 'Running') { 'Green' } else { 'Red' })
} else {
    Write-Host "  FAIL: PostgreSQL service not found" -ForegroundColor Red
}

Write-Host ""

# Test 3: Summary
Write-Host "Summary:" -ForegroundColor Cyan
if ($portTest) {
    Write-Host "  PostgreSQL is RUNNING" -ForegroundColor Green
    Write-Host "  Try: cd lib/db ; corepack pnpm@9 run push" -ForegroundColor Yellow
} else {
    Write-Host "  PostgreSQL is NOT RUNNING" -ForegroundColor Red
    Write-Host ""
    Write-Host "  To start:" -ForegroundColor Yellow
    Write-Host "  1. Press Windows+R and type: services.msc" -ForegroundColor Gray
    Write-Host "  2. Find: postgresql-x64-18" -ForegroundColor Gray
    Write-Host "  3. Right-click and select: Start" -ForegroundColor Gray
    Write-Host "  4. Run this test again" -ForegroundColor Gray
}

Write-Host ""
