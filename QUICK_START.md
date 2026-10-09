# SK Media - Quick Start Guide

## ✅ Status

All installation issues are fixed. Ready to start development!

## 🚀 Starting the Application

### Option 1: Separate Terminals (Recommended)

**Terminal 1 - API Server:**
```powershell
.\start-api.ps1
```

**Terminal 2 - Frontend:**
```powershell
.\start-frontend.ps1
```

### Option 2: Database Setup First (One time only)

```powershell
# Step 1: Navigate to database folder
cd lib/db

# Step 2: Push schema to database
corepack pnpm@9 run push

# Step 3: Go back to root
cd ..

# Step 4: Start API
.\start-api.ps1
```

---

## 📝 Prerequisites

### PostgreSQL Must Be Running

Make sure PostgreSQL is running on `localhost:5432`

**Check if PostgreSQL is running:**
```powershell
psql -U postgres -h localhost -c "SELECT 1"
```

**If not running:**
- Windows: Start PostgreSQL service from Services
- Docker: `docker start sk-media-db`

---

## 🌐 Access URLs

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:5173 | React UI |
| API Server | http://localhost:3000 | Express Backend |
| Database | localhost:5432 | PostgreSQL |

---

## 🔑 Admin Login

```
Username: admin
Password: Admin@12345
```

---

## ⚠️ Common Issues

### Issue: "Port already in use"
```powershell
Stop-Process -Name node -Force
```

### Issue: "Connection refused" (Database)
```powershell
# Check if PostgreSQL is running
Get-Service postgresql* | Where-Object {$_.Status -eq 'Stopped'}

# Start it if stopped
Start-Service -Name postgresql-x64-17
```

### Issue: "BASE_PATH is required"
This should be fixed now. If it still occurs:
```powershell
$env:PORT = "5173"
$env:BASE_PATH = "/"
corepack pnpm@9 run dev
```

---

## 📁 Project Structure

```
skmedia/
├── artifacts/
│   ├── api-server/      ← Express API (Node.js)
│   └── sk-media-monetization/ ← React Frontend (Vite)
├── lib/
│   ├── db/              ← Database & Migrations
│   └── api-zod/         ← API Validation
├── start-api.ps1        ← Start API Server
├── start-frontend.ps1   ← Start Frontend
└── start-dev.ps1        ← Start both (experimental)
```

---

## 🔧 Development Commands

```powershell
# Install/Update dependencies
corepack pnpm@9 install

# Type checking
corepack pnpm@9 run typecheck

# Build API
cd artifacts/api-server && corepack pnpm@9 run build

# Build Frontend
cd artifacts/sk-media-monetization && corepack pnpm@9 run build

# Database migration
cd lib/db && corepack pnpm@9 run push
```

---

## 📊 Files Modified/Created

### Modified
- `/package.json` - Fixed preinstall script for Windows
- `/artifacts/sk-media-monetization/vite.config.ts` - Removed async issues

### Created
- `/start-api.ps1` - Simple API server starter
- `/start-frontend.ps1` - Simple frontend starter
- `/QUICK_START.md` - This file
- `/SETUP_INSTRUCTIONS.md` - Full setup guide

---

## ✨ Ready to Go!

1. Make sure PostgreSQL is running
2. Run `.\start-api.ps1` in one terminal
3. Run `.\start-frontend.ps1` in another terminal
4. Visit http://localhost:5173
5. Start developing!

---

**Happy Coding!** 🚀
