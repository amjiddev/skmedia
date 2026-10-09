# SK Media - PostgreSQL Setup Script for Windows
# یہ سکرپٹ PostgreSQL کو مقامی میموری میں شروع کرنے میں مدد کرتا ہے

Write-Host "=== SK Media PostgreSQL Setup ===" -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL is already running
Write-Host "Checking for PostgreSQL..." -ForegroundColor Yellow

$postgresRunning = $false
$postgresPath = ""

# Check registry for PostgreSQL installation
$postgresReg = Get-ItemProperty "HKLM:\SOFTWARE\PostgreSQL\Installations\*" -ErrorAction SilentlyContinue
if ($postgresReg) {
    Write-Host "✓ PostgreSQL found in registry" -ForegroundColor Green
    $postgresPath = $postgresReg.Base
    Write-Host "  Path: $postgresPath"
}

# Check if psql is in PATH
$psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source
if ($psqlPath) {
    Write-Host "✓ psql found in PATH: $psqlPath" -ForegroundColor Green
    $postgresPath = (Split-Path $psqlPath)
}

if (-not $postgresPath) {
    Write-Host ""
    Write-Host "❌ PostgreSQL is NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download and install PostgreSQL from:" -ForegroundColor Cyan
    Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use this command if you have Chocolatey:" -ForegroundColor Cyan
    Write-Host "  choco install postgresql15 -y --params '/Password:1'" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Attempting to create database 'sk_media'..." -ForegroundColor Yellow

# Try to create the database
try {
    # First check if we can connect
    $testConn = & psql -U postgres -h localhost -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL connection successful" -ForegroundColor Green
        
        # Create database
        & psql -U postgres -h localhost -c "CREATE DATABASE sk_media;" 2>&1 | ForEach-Object {
            if ($_ -like "*already exists*") {
                Write-Host "✓ Database 'sk_media' already exists" -ForegroundColor Green
            } elseif ($_ -like "*CREATE DATABASE*") {
                Write-Host "✓ Database 'sk_media' created successfully" -ForegroundColor Green
            } else {
                Write-Host $_
            }
        }
    } else {
        Write-Host "⚠ Could not connect to PostgreSQL" -ForegroundColor Yellow
        Write-Host "  Make sure PostgreSQL service is running"
        Write-Host "  Try: Get-Service postgresql* | Start-Service" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Now run this command to set up the database schema:" -ForegroundColor Cyan
Write-Host '  cd "d:\SK Media\skmedia\lib\db"' -ForegroundColor Cyan
Write-Host "  corepack pnpm@9 run push" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then start the API server:" -ForegroundColor Cyan
Write-Host '  cd "d:\SK Media\skmedia\artifacts\api-server"' -ForegroundColor Cyan
Write-Host "  corepack pnpm@9 run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Setup script completed!" -ForegroundColor Green
