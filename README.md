# SK Media Monetization

A responsive agency website for creators seeking YouTube, Facebook, and TikTok monetization support. It includes public lead capture, a PostgreSQL-backed admin dashboard, and SMTP email notifications.

## Features

- Public home, about, services, and contact pages
- Contact form with server-side validation, sanitization, and rate limiting
- Lead records saved to PostgreSQL
- Nodemailer email notifications to `skmediamonetization@gmail.com`
- Admin sign-in with bcrypt password hashing and an HTTP-only session cookie
- Protected lead list with status updates and deletion
- Dashboard totals for all, new, and contacted leads
- FAQ, testimonial placeholders, map embed, and WhatsApp contact link

The Facebook, TikTok, and YouTube header icons currently open each platform's general website because SK Media profile URLs were not provided. Replace those destinations with the official account links when available. The displayed testimonials are explicitly marked placeholders and should be replaced with approved creator feedback before launch.

## Run on Replit

The project uses Replit's provisioned PostgreSQL database. `DATABASE_URL` is supplied by Replit and should not be added manually.

1. Add `ADMIN_INITIAL_PASSWORD` and the SMTP settings below under **Tools → Secrets**. Do not commit credentials or place them in chat.
2. Optionally set `ADMIN_USERNAME`; it defaults to `skadmin`.
3. The API creates the initial admin account at startup only when the admin table is empty.
4. Run the database schema command once for the development database:

   ```sh
   pnpm --filter @workspace/db run push
   ```

5. Start the existing **API Server** and **SK Media Monetization** workflows.
6. Open `/admin` to sign in.

Changing `ADMIN_INITIAL_PASSWORD` does not overwrite an existing admin. Keep the value private after initial provisioning.

## SMTP settings

Configure these in Replit Secrets using SMTP credentials from your email provider:

- `SMTP_HOST` — SMTP server hostname
- `SMTP_PORT` — usually `587` (defaults to `587`; port `465` uses implicit TLS)
- `SMTP_USER` — SMTP username
- `SMTP_PASSWORD` — SMTP password or provider-issued SMTP credential
- `SMTP_FROM` — optional sender address; defaults to `SMTP_USER`

The contact form saves leads even when SMTP is missing or unavailable. Its response distinguishes `sent`, `not_configured`, and `failed` email notifications so the website can give an accurate confirmation and direct visitors to WhatsApp when needed.

Set the optional `VITE_SITE_URL` to the published site origin before building for production. Public pages use it for absolute canonical and Open Graph URLs; the production sitemap should be generated after the final domain is known.

## Local development

Copy `.env.example` to `.env` for local-only configuration, then provide a PostgreSQL `DATABASE_URL`, a strong `SESSION_SECRET`, the initial admin password, and SMTP settings. Never commit `.env`.

```sh
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/sk-media-monetization run dev
```

The API is mounted at `/api`; the website is served at `/`. To regenerate API types after changing `lib/api-spec/openapi.yaml`:

```sh
pnpm --filter @workspace/api-spec run codegen
```

Run the project type checks with:

```sh
pnpm run typecheck
```

## Configuration template

See `.env.example` for the environment variable names. Replit-managed values such as `DATABASE_URL` and `SESSION_SECRET` belong in Replit Secrets or the platform's managed environment, not source control.
