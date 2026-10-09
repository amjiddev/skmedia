# SK Media Database Setup Guide

## Quick Start (Copy-Paste)

### Step 1: Create the Database

**Using the setup script (recommended):**
```bash
cd lib/db
npm run setup-db
```

**Or manually with psql:**
```bash
psql -U postgres -h localhost -c "CREATE DATABASE sk_media;"
```

### Step 2: Push Schema

```bash
npm run push
```

Done! Your database schema is now migrated.

---

## Why This Was Needed

The `drizzle-kit push` command was timing out because the `sk_media` database didn't exist. Without the database, drizzle-kit couldn't establish a connection and timed out after ~10-30 seconds instead of failing with a clear error message.

**Your configuration is correct:**
- Database URL: `postgresql://postgres:1@localhost:5432/sk_media`
- PostgreSQL is running on `localhost:5432`
- Schema files exist with tables: `sk_contacts`, `sk_admins`

The **only missing piece** was creating the empty database first.

---

## Troubleshooting

### Issue: "Cannot connect to PostgreSQL"

Check that PostgreSQL is running:
```bash
# On Windows, check Services
# Or try connecting directly:
psql -U postgres -h localhost
```

### Issue: "password authentication failed"

Verify the password in `.env`:
```
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/sk_media
                                    ^^^^^^^^
```

Change `PASSWORD` to match your PostgreSQL user's password (currently `1`).

### Issue: "role postgres does not exist"

Use a different user that exists, or create the postgres user:
```bash
# This depends on your PostgreSQL setup
# Check with: psql -U (your-username)
```

---

## Files Reference

- **Config:** `drizzle.config.ts` - Drizzle configuration
- **Environment:** `.env` - Database connection settings
- **Schema:** `src/schema/sk-media-monetization.ts` - Table definitions
- **Setup:** `setup-database.js` - Database creation helper

---

## Next Steps

After pushing the schema:

1. Verify tables were created:
   ```bash
   psql -U postgres -d sk_media -c "\dt"
   ```

2. Start your application:
   ```bash
   npm run dev
   ```

3. To add new tables, edit `src/schema/sk-media-monetization.ts` and run `npm run push` again.
