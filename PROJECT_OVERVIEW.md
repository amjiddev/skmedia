# SK Media Monetization - Complete Project Overview

## 📋 Project Summary

**SK Media Monetization** ek responsive agency website project hai jo YouTube, Facebook, aur TikTok monetization support provide karta hai. Ye project local development aur Replit deployment dono ke liye optimized hai.

**Key Purpose**: Creators ko monetization services offer karne ke liye aur lead generation ke liye.

---

## 🏗️ Project Architecture

### Monorepo Structure (pnpm workspaces)

```
Monetization-Hub/
├── lib/                          # Shared libraries
│   ├── api-client-react/         # React API client
│   ├── api-spec/                 # OpenAPI specification
│   ├── api-zod/                  # Zod validation schemas
│   └── db/                       # Database schemas (Drizzle ORM)
│
├── artifacts/                    # Deployable applications
│   ├── api-server/               # Backend Express API
│   ├── mockup-sandbox/           # UI component library (React)
│   └── sk-media-monetization/    # Frontend website
│
├── scripts/                      # Build/utility scripts
├── package.json                  # Root workspace config
├── pnpm-workspace.yaml           # Workspace definition
├── tsconfig.json                 # TypeScript config
└── .env                         # Environment variables (local only)
```

---

## 🔧 Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | UI components and pages |
| **UI Framework** | Radix UI + Tailwind CSS | Component library and styling |
| **Backend** | Express.js + TypeScript | REST API server |
| **Database** | PostgreSQL + Drizzle ORM | Data persistence |
| **Validation** | Zod | Runtime type validation |
| **Build Tool** | Vite | Frontend bundler |
| **Package Manager** | pnpm | Workspace management |
| **Email** | Nodemailer | SMTP notifications |
| **Authentication** | bcryptjs + JWT | Admin auth |

---

## 📦 Workspace Packages

### Libraries (`/lib`)

#### 1. **api-spec** (`@workspace/api-spec`)
- **Purpose**: OpenAPI specification for the API
- **Files**: 
  - `openapi.yaml` - API contract definition
  - Codegen configuration for TypeScript types
- **Usage**: Generate API types and documentation

#### 2. **api-zod** (`@workspace/api-zod`)
- **Purpose**: Shared Zod validation schemas
- **Content**: Request/response validation schemas
- **Usage**: Shared between API server and frontend validation

#### 3. **db** (`@workspace/db`)
- **Purpose**: Database layer using Drizzle ORM
- **Content**:
  - Database schema definitions
  - Migration scripts
  - Drizzle Kit configuration
- **Tables**:
  - `admin` - Admin user credentials
  - `leads` - Contact form submissions
- **Key Command**: `pnpm --filter @workspace/db run push` (run migrations)

#### 4. **api-client-react** (`@workspace/api-client-react`)
- **Purpose**: Typed React hooks for API calls
- **Generated**: Auto-generated from OpenAPI spec
- **Usage**: Frontend data fetching

### Applications (`/artifacts`)

#### 1. **API Server** (`@workspace/api-server`)

**Location**: `/artifacts/api-server`

**Purpose**: Backend REST API

**Key Features**:
- Express.js server with TypeScript
- Admin authentication (bcrypt + HTTP-only cookies)
- Lead capture and management
- Email notifications via Nodemailer
- Rate limiting on contact endpoints
- CORS support
- Pino logging

**Routes**:
- `GET /health` - Health check
- `POST /api/admin/login` - Admin sign-in
- `GET /api/admin/leads` - List leads (protected)
- `PATCH /api/admin/leads/:id` - Update lead status
- `DELETE /api/admin/leads/:id` - Delete lead
- `POST /api/contact` - Submit contact form
- `GET /api/admin/dashboard` - Dashboard statistics

**Authentication Flow**:
1. Admin signs in with username/password
2. Password validated against bcrypt hash
3. HTTP-only session cookie issued
4. Subsequent requests validated via cookie

**Environment Variables**:
```
DATABASE_URL              # PostgreSQL connection string
ADMIN_USERNAME           # Admin username (default: skadmin)
ADMIN_INITIAL_PASSWORD   # Initial admin password
SMTP_HOST               # Email server hostname
SMTP_PORT               # Email server port (default: 587)
SMTP_USER               # Email account username
SMTP_PASSWORD           # Email account password
SMTP_FROM               # Sender email (optional)
SESSION_SECRET          # Session encryption key
NODE_ENV                # development/production
```

**Development**:
```bash
pnpm --filter @workspace/api-server run dev    # Start dev server
pnpm --filter @workspace/api-server run build  # Build for production
```

#### 2. **Frontend Website** (`@workspace/sk-media-monetization`)

**Location**: `/artifacts/sk-media-monetization`

**Purpose**: Public-facing website + admin dashboard

**Key Pages**:
- **Public Pages**:
  - Home - Hero section with call-to-action
  - About - Agency information
  - Services - Monetization services offered
  - Contact - Lead capture form
  
- **Admin Pages**:
  - `/admin/login` - Admin sign-in
  - `/admin/dashboard` - Lead management dashboard
  - Lead details and status updates

**Key Features**:
- Responsive design (mobile-first)
- Contact form with validation and rate limiting
- Admin dashboard with statistics
- Real-time lead updates
- WhatsApp contact integration
- Social media links (YouTube, Facebook, TikTok)
- FAQ section
- Testimonials placeholder
- Map embed

**Environment Variables**:
```
VITE_API_URL        # API server URL (default: http://localhost:3000)
VITE_SITE_URL       # Site URL for canonical links and OG tags
```

**Development**:
```bash
pnpm --filter @workspace/sk-media-monetization run dev    # Dev server
pnpm --filter @workspace/sk-media-monetization run build  # Build for production
```

#### 3. **Mockup Sandbox** (`@workspace/mockup-sandbox`)

**Location**: `/artifacts/mockup-sandbox`

**Purpose**: UI component library and testing environment

**Content**:
- 55+ shadcn/ui components
- React Hook Form integration
- Tailwind CSS components
- Demo pages for component testing

**Key Components**:
- Form inputs and validation
- Buttons and button groups
- Dialogs and drawers
- Tabs and accordions
- Cards and containers
- Charts and data visualization

**Development**:
```bash
pnpm --filter @workspace/mockup-sandbox run dev    # Component browser
pnpm --filter @workspace/mockup-sandbox run build  # Build library
```

---

## 🗄️ Database Schema

### Tables

#### **admin**
```sql
id          INTEGER PRIMARY KEY AUTO_INCREMENT
username    VARCHAR(255) UNIQUE NOT NULL
password    VARCHAR(255) NOT NULL (bcrypt hash)
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### **leads**
```sql
id          INTEGER PRIMARY KEY AUTO_INCREMENT
name        VARCHAR(255) NOT NULL
email       VARCHAR(255) NOT NULL
message     TEXT NOT NULL
status      ENUM ('new', 'contacted', 'converted', 'closed') DEFAULT 'new'
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

**Initial Setup**:
```bash
pnpm --filter @workspace/db run push
```

---

## 🔄 Data Flow

### Contact Form Submission Flow
```
1. User fills contact form on public website
   ↓
2. Frontend validates with Zod schema
   ↓
3. POST /api/contact (with rate limiting)
   ↓
4. Backend validates again
   ↓
5. Save lead to PostgreSQL
   ↓
6. Send email via Nodemailer (if configured)
   ↓
7. Return response with email status
   ↓
8. Frontend shows confirmation (with fallback to WhatsApp link)
```

### Admin Dashboard Flow
```
1. Admin navigates to /admin/login
   ↓
2. Enters username/password
   ↓
3. POST /api/admin/login
   ↓
4. Backend validates credentials against bcrypt hash
   ↓
5. Sets HTTP-only session cookie
   ↓
6. Redirect to /admin/dashboard
   ↓
7. GET /api/admin/dashboard (cookie sent automatically)
   ↓
8. Backend validates session and returns statistics
   ↓
9. Dashboard renders with lead list and stats
```

---

## 🚀 Setup & Development

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- PostgreSQL (local) OR Replit database (managed)

### Local Development Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   Fill in:
   - `DATABASE_URL` - PostgreSQL connection string
   - `SESSION_SECRET` - Random 32+ character string
   - `ADMIN_INITIAL_PASSWORD` - Strong password
   - SMTP settings (optional, falls back to WhatsApp)

3. **Setup database**:
   ```bash
   pnpm --filter @workspace/db run push
   ```

4. **Type checking**:
   ```bash
   pnpm run typecheck
   ```

5. **Start development servers** (in separate terminals):
   ```bash
   # Terminal 1: Backend API
   pnpm --filter @workspace/api-server run dev
   
   # Terminal 2: Frontend website
   pnpm --filter @workspace/sk-media-monetization run dev
   ```

6. **Access**:
   - Website: http://localhost:5173
   - API: http://localhost:3000
   - Admin: http://localhost:5173/admin

### Replit Deployment

1. **Add secrets** (Tools → Secrets):
   - `ADMIN_INITIAL_PASSWORD`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
   - `SESSION_SECRET` (auto-generated by Replit)

2. **Run database setup**:
   ```bash
   pnpm --filter @workspace/db run push
   ```

3. **Start workflows**:
   - API Server workflow
   - SK Media Monetization workflow

4. **Access admin**:
   - Go to published site URL
   - Navigate to `/admin`
   - Login with credentials

---

## 📝 Common Development Tasks

### Generate API Types from OpenAPI
```bash
pnpm --filter @workspace/api-spec run codegen
```
This updates types in `api-client-react` package.

### Build for Production
```bash
pnpm run build
```

### Type Check All Packages
```bash
pnpm run typecheck
```

### Add New Dependencies
```bash
# Add to specific workspace
pnpm --filter @workspace/api-server add package-name

# Add to root workspace
pnpm add -W package-name -D
```

### Database Migrations
```bash
# Push schema changes to database
pnpm --filter @workspace/db run push

# Generate migration files
pnpm --filter @workspace/db run generate
```

---

## 🔐 Security Features

1. **Authentication**:
   - Bcrypt password hashing (10 rounds)
   - HTTP-only session cookies
   - CSRF protection via SameSite cookies

2. **Input Validation**:
   - Client-side validation with Zod
   - Server-side validation with Zod
   - Email validation and sanitization
   - Rate limiting on contact endpoint (15 requests per 15 minutes)

3. **Database**:
   - Parameterized queries (Drizzle ORM)
   - No SQL injection vulnerabilities
   - Password hashing in database

4. **API**:
   - CORS configured for trusted origins
   - Session-based access control
   - Error messages don't leak sensitive info

---

## 🎨 Frontend Features

### Public Pages
- **Responsive design** - Mobile-first approach
- **SEO optimized** - Canonical URLs, OG tags, sitemap
- **Accessibility** - WCAG guidelines followed
- **Performance** - Code splitting, lazy loading

### Admin Dashboard
- **Lead management** - View, update status, delete
- **Statistics** - Total leads, new leads, contacted count
- **Search/Filter** - Find specific leads
- **Session management** - Auto-logout on inactivity

---

## 📊 Email Integration

### Current Status
- ✅ Supports Nodemailer for SMTP
- ✅ Falls back gracefully if not configured
- ✅ Sends to: `skmediamonetization@gmail.com`

### Configuration
Use SMTP settings from your email provider:
- Gmail: Use App Password, port 587
- SendGrid: Use sendgrid.net:587
- Custom SMTP: Provide server details

### Response Codes
- `sent` - Email sent successfully
- `not_configured` - SMTP not set up
- `failed` - Send failed (network issue, invalid credentials)

---

## 🔗 Links & Resources

### Important Configuration Files
- `.env.example` - Template for environment variables
- `pnpm-workspace.yaml` - Workspace configuration
- `tsconfig.json` - TypeScript configuration
- `tsconfig.base.json` - Base TypeScript config

### Documentation Files
- `README.md` - Original project documentation
- `replit.md` - Replit deployment guide
- `.replit` - Replit configuration

### Workflow Files
- `.replit` - Replit workflows configuration
- `.replitignore` - Files ignored by Replit

---

## 📋 Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Re-push schema if needed
pnpm --filter @workspace/db run push
```

### Email Not Sending
- Verify SMTP credentials are correct
- Check `SMTP_HOST` and `SMTP_PORT`
- Ensure port is not blocked by firewall
- Check email provider's app passwords (Gmail)

### Type Errors
```bash
# Regenerate API types
pnpm --filter @workspace/api-spec run codegen

# Check all types
pnpm run typecheck
```

### Port Conflicts
- API Server: Change port in `artifacts/api-server/src/index.ts`
- Frontend: `VITE_SITE_URL` environment variable
- Default ports: API (3000), Frontend (5173)

---

## 🎯 Future Enhancements

- [ ] Analytics dashboard for conversion tracking
- [ ] Automated follow-up email campaigns
- [ ] Lead scoring and prioritization
- [ ] Payment integration for premium services
- [ ] Multi-language support
- [ ] Mobile app version
- [ ] Social media integration (API webhooks)
- [ ] Video testimonials integration

---

## 📄 License

MIT - See LICENSE file for details

---

## ✅ Development Checklist

- [ ] Clone repository
- [ ] Install dependencies: `pnpm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Set up database: `pnpm --filter @workspace/db run push`
- [ ] Configure SMTP (optional)
- [ ] Run type check: `pnpm run typecheck`
- [ ] Start API server
- [ ] Start frontend dev server
- [ ] Test contact form
- [ ] Test admin login
- [ ] Verify email notifications

---

**Last Updated**: October 2026
**Project Status**: Active Development
**Maintained By**: SK Media Team
