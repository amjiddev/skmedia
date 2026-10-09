# SK Media API Server Startup Script

Write-Host "Starting SK Media API Server..." -ForegroundColor Green
Write-Host ""

$apiServerPath = "d:\SK Media\skmedia\artifacts\api-server"

cd $apiServerPath

Write-Host "API Server running on: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin Credentials:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor Cyan
Write-Host "  Password: Admin@12345" -ForegroundColor Cyan
Write-Host ""

$env:NODE_ENV = "development"

& corepack pnpm@9 run dev
