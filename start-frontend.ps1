# SK Media Frontend Startup Script

Write-Host "Starting SK Media Frontend..." -ForegroundColor Green
Write-Host ""

$frontendPath = "d:\SK Media\skmedia\artifacts\sk-media-monetization"

cd $frontendPath

Write-Host "Frontend running on: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

$env:PORT = "5173"
$env:BASE_PATH = "/"

& corepack pnpm@9 run dev
