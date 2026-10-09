# SK Media - Complete Setup Instructions

## ✅ مسائل جو ٹھیک ہو چکے

### 1. pnpm preinstall error ✓ FIXED
- **Problem:** `'sh' is not recognized as an internal or external command`
- **Cause:** Windows میں `sh` command دستیاب نہیں تھی
- **Solution:** `/package.json` میں preinstall script کو Node.js میں دوبارہ لکھا گیا

### 2. Port Conflict ✓ FIXED
- **Problem:** `Port 5173 is already in use`
- **Solution:** پرانے Node processes کو بند کیا:
  ```powershell
  Stop-Process -Name "node" -Force
  ```

### 3. Dependencies Missing ✓ FIXED
- **Problem:** Packages نہیں نصب تھے
- **Solution:** `corepack pnpm@9 install` - 626 packages installed successfully

---

## ⏳ ابھی کیا کریں؟

### Prerequisites: PostgreSQL ہونا ضروری ہے

#### آپشن A: PostgreSQL انسٹال کریں (Recommended)

1. **https://www.postgresql.org/download/windows/** سے ڈاؤن لوڈ کریں
2. Installer چلائیں:
   - Click "Next" تمام steps میں
   - Password: `1` (یا اپنی مرضی سے)
   - Port: `5432` (default)
3. **Windows restart دیں**

#### آپشن B: Docker استعمال کریں

```powershell
# Docker Desktop انسٹال کریں (یا چیک کریں اگر ہے):
# https://www.docker.com/products/docker-desktop

# PostgreSQL container شروع کریں:
docker run --name sk-media-db ^
  -e POSTGRES_PASSWORD=1 ^
  -e POSTGRES_DB=sk_media ^
  -p 5432:5432 ^
  -d postgres:17
```

---

## 🚀 Development Setup

### Step 1: Verify Installation

```powershell
cd "d:\SK Media\skmedia"

# Check if Node modules are installed
if (Test-Path "node_modules") {
    Write-Host "✓ Dependencies installed"
} else {
    Write-Host "Installing dependencies..."
    corepack pnpm@9 install
}
```

### Step 2: Setup Database

```powershell
cd "d:\SK Media\skmedia\lib\db"

# Create tables and schema
corepack pnpm@9 run push

# If you get an error, try:
# corepack pnpm@9 run push-force
```

### Step 3: Start Development Servers

#### Option A: Automated (Recommended)

```powershell
cd "d:\SK Media\skmedia"
.\start-dev.ps1
```

#### Option B: Manual Start

**Terminal 1 - API Server:**
```powershell
cd "d:\SK Media\skmedia\artifacts\api-server"
corepack pnpm@9 run dev
```

**Terminal 2 - Frontend (Optional):**
```powershell
cd "d:\SK Media\skmedia\artifacts\sk-media-monetization"
corepack pnpm@9 run dev
```

#### Option C: Batch File (Windows)
```cmd
cd "d:\SK Media\skmedia"
start-dev.bat
```

---

## 📝 Configuration Files

### API Server (.env)
**Location:** `artifacts/api-server/.env`
```
DATABASE_URL=postgresql://postgres:1@localhost:5432/sk_media
PORT=3000
SESSION_SECRET=your-local-dev-secret-key-change-this-in-production-12345
ADMIN_USERNAME=admin
ADMIN_INITIAL_PASSWORD=Admin@12345
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=test@example.com
SMTP_PASSWORD=test_password
SMTP_FROM=noreply@skmonetization.local
VITE_SITE_URL=http://localhost:5173
```

### Frontend (auto-generated or use .env.example)
**Location:** `artifacts/sk-media-monetization/.env`

---

## 🎯 Access Your Application

After starting servers:

- **API Server:** http://localhost:3000
- **Frontend:** http://localhost:5173
- **Admin Panel:** http://localhost:3000/api/admin

### Admin Credentials
```
Username: admin
Password: Admin@12345
```

---

## 🔍 Verify Everything Works

### Test API Server
```powershell
# In PowerShell/Command Prompt:
curl http://localhost:3000

# Or in a new Terminal:
Invoke-RestMethod http://localhost:3000
```

### Expected Output
- API Server should respond on port 3000
- Frontend should load on port 5173
- Database tables should be created

---

## 📁 Project Structure

```
d:\SK Media\skmedia\
├── artifacts/
│   ├── api-server/                 (Express Node.js API)
│   │   ├── src/
│   │   ├── dist/                   (Built files)
│   │   ├── package.json
│   │   └── .env
│   │
│   └── sk-media-monetization/      (React + Vite Frontend)
│       ├── src/
│       ├── components/
│       ├── package.json
│       └── .env
│
├── lib/
│   ├── db/                         (Database schema & migrations)
│   │   ├── src/schema/
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── api-zod/                    (API validation schemas)
│   └── api-client-react/
│
├── node_modules/                   (All dependencies)
├── package.json                    (Root workspace config)
├── setup-postgres.ps1              (Helper script)
├── start-dev.ps1                   (Start servers script)
└── start-dev.bat                   (Windows batch starter)
```

---

## 🛠️ Useful Commands

```powershell
# Install all dependencies
corepack pnpm@9 install

# Update dependencies
corepack pnpm@9 update

# Type checking
corepack pnpm@9 run typecheck

# Build API server
cd artifacts/api-server && corepack pnpm@9 run build

# Build Frontend
cd artifacts/sk-media-monetization && corepack pnpm@9 run build

# Database migration
cd lib/db && corepack pnpm@9 run push

# Stop all Node processes
Stop-Process -Name node -Force

# Start PostgreSQL service (if installed locally)
Start-Service -Name postgresql-x64-17
```

---

## 🆘 Troubleshooting

### Problem: "Connection refused"
```
Solution:
1. Check PostgreSQL is running
2. Windows Services: search for "postgresql"
3. Docker: docker ps (should show sk-media-db)
4. Try connecting: psql -U postgres
```

### Problem: "Port already in use"
```powershell
# Kill Node processes
Stop-Process -Name node -Force
```

### Problem: "DATABASE_URL not found"
```
Check that .env file exists in:
- artifacts/api-server/.env
- lib/db/.env (optional)
```

### Problem: "No admin account exists"
```
Check credentials in:
- artifacts/api-server/.env
- ADMIN_USERNAME must be 3-100 characters
- ADMIN_INITIAL_PASSWORD must be 12-200 characters
```

### Problem: "SMTP verification failed"
```
This is OK - SMTP is optional for local development
The app will still work for lead capture
```

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Dependencies | ✅ Installed | 626 packages |
| package.json Fix | ✅ Fixed | Windows-compatible |
| API Server Build | ✅ Ready | 2.48 MB |
| Database Setup | ⏳ Pending | Need PostgreSQL |
| Frontend | ✅ Ready | React + Vite |

---

## 🎓 Quick Start Cheatsheet

```powershell
# ONE TIME SETUP:
# 1. Install PostgreSQL (or Docker)
# 2. Run: .\setup-postgres.ps1
# 3. Run: cd lib/db && corepack pnpm@9 run push

# DEVELOPMENT:
# Option A - All in one:
.\start-dev.ps1

# Option B - Manual:
# Terminal 1:
cd artifacts\api-server
corepack pnpm@9 run dev

# Terminal 2:
cd artifacts\sk-media-monetization
corepack pnpm@9 run dev
```

---

## 📚 Additional Resources

- **Drizzle ORM:** https://orm.drizzle.team/
- **Express.js:** https://expressjs.com/
- **React:** https://react.dev/
- **Vite:** https://vitejs.dev/
- **PostgreSQL:** https://www.postgresql.org/
- **pnpm:** https://pnpm.io/

---

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] PostgreSQL installed or Docker running
- [ ] Dependencies installed (`node_modules` exists)
- [ ] Database schema created (`pnpm run push` succeeded)
- [ ] API Server starts without errors
- [ ] Frontend loads in browser
- [ ] Admin login works

---

## 📞 Support

If you encounter issues:

1. Check the Troubleshooting section
2. Verify all prerequisites are installed
3. Ensure environment variables are set correctly
4. Check that ports 3000 and 5173 are available
5. Review the error messages carefully

---

**Last Updated:** October 9, 2026

**Status:** ✅ Ready for Development (PostgreSQL needed)
