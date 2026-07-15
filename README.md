# Panther Ad Ops

Advertisement operations & financial management system — replaces WhatsApp/spreadsheet
workflows with a single app covering bookings, payments, campaign execution, and reporting.

Built with Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui (Base UI primitives),
Prisma 7 + PostgreSQL, and NextAuth (Auth.js) credentials login.

## Roles

- **Admin** — full access: users, financial data, audit log, everything.
- **Financial Manager** — bookings, payments, invoices, customer feedback. No user management.
- **Marketing Team** — campaign briefs, scheduling, 24h capture uploads, comments. Never sees prices,
  revenue, or payment data — financial fields are excluded server-side, not just hidden in the UI.

Login is restricted to `@<your-domain>` email addresses (set via `ALLOWED_EMAIL_DOMAIN`). There is no
public sign-up; only an Admin can create accounts (via the **Users** page).

## Local development

Prerequisites: Node 20+, a PostgreSQL database (see below for a zero-install option).

```bash
npm install
```

### 1. Database

Easiest local option — Prisma's built-in local Postgres, no Docker required:

```bash
npx prisma dev          # starts a local Postgres, prints a connection string
```

Copy the printed `postgres://...` URL into `.env` as `DATABASE_URL` (use `127.0.0.1` instead of
`localhost` to avoid IPv6-resolution issues on Windows). Or point `DATABASE_URL` at any real
Postgres instance (Supabase, Neon, Railway, RDS, etc).

### 2. Environment variables

`.env` needs:

```
DATABASE_URL="postgres://..."
AUTH_SECRET="a long random string"
NEXTAUTH_URL="http://localhost:3000"
ALLOWED_EMAIL_DOMAIN="yourcompany.com"
```

### 3. Push the schema and seed an admin account

```bash
npm run db:push       # creates tables from prisma/schema.prisma
npm run db:seed       # creates one Admin, one Finance, and one Marketing user
```

The seed script prints the three accounts' emails and temporary passwords — **change them after
first login**. Optionally run `npm run db:seed-demo` afterward to populate sample companies and
campaigns for exploring the UI.

### 4. Run it

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with one of the seeded accounts.

## Deploying to production (Vercel + a hosted Postgres)

This is the path referenced throughout the app: **you deploy it yourself** using your own Vercel
and database accounts, following these steps.

### 1. Push the code to GitHub

```bash
git init   # if not already a git repo
git add .
git commit -m "Initial commit"
```

Create a repo on GitHub and push to it.

### 2. Create a production Postgres database

Use **Supabase** or **Neon** (both have generous free tiers and work well with Prisma).

**If using Supabase:** Supabase's default pooled "Transaction mode" connection string routes
through PgBouncer, which does **not** support prepared statements the way Prisma's driver adapter
expects — you'll see errors like `prepared statement "" already exists` or `bind message supplies
N parameters`. Use the **Session mode** pooler connection string (or the direct connection string)
for `DATABASE_URL` instead of the Transaction pooler.

**If using Neon:** the default connection string works out of the box.

### 3. Push the schema to production

Locally, temporarily point `DATABASE_URL` in `.env` at the production database and run:

```bash
npm run db:push
npm run db:seed
```

Then switch `.env` back to your local database. (Alternatively set the production `DATABASE_URL`
as a one-off shell variable for these two commands instead of editing `.env`.)

### 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. In the project's Environment Variables settings, add `DATABASE_URL`, `AUTH_SECRET`,
   `NEXTAUTH_URL` (your Vercel production URL), and `ALLOWED_EMAIL_DOMAIN`.
3. Deploy. Vercel auto-detects Next.js — no build config changes needed.
4. Every employee visits the deployed URL and signs in with their `@yourdomain` account that an
   Admin created via the **Users** page.

### File uploads (invoices, receipts, 24h screenshots) — read before going live

Uploaded files currently save to local disk (`public/uploads/…`) via `src/lib/storage.ts`. This
works for local development but **will not work in production on Vercel** — serverless
filesystems are read-only/ephemeral, so uploaded files would vanish on the next deploy or request.

Before going live, swap the body of `saveUploadedFile()` in `src/lib/storage.ts` for an upload to
Supabase Storage or S3 and return the resulting public URL. Every upload flow in the app (invoice/
receipt attachments, 24-hour capture screenshots) calls this one function, so it's the only place
that needs to change.

## What's intentionally simplified (and why)

Given the scope of the original spec, a few things were scoped down to ship a working, coherent
system rather than a half-built version of everything:

- **Google OAuth** — the app ships with company-domain-restricted email/password auth. Adding
  Google OAuth restricted to your Workspace domain is a config change in `src/auth.ts` (add a
  `Google` provider) once you have OAuth client credentials from Google Cloud Console — no schema
  changes needed.
- **Calendar drag-and-drop rescheduling** — the calendar shows all scheduled campaigns in a month
  grid and links through to each campaign, but rescheduling is done via the campaign edit form
  rather than a drag gesture.
- **In-app notification center** — assignment notifications are written to the `Notification`
  table (so the data model and one flow are ready), but there's no bell/inbox UI reading them yet.
  Overdue-payment and missing-capture "notifications" surface today as dashboard warning tiles
  instead.
- **Full Arabic (RTL) UI** — per the agreed scope, Arabic is supported at the data level: company
  names, contact names, and campaign titles all have dedicated Arabic fields, render with correct
  glyphs (a bundled Arabic font is loaded alongside the Latin one), and display right-to-left where
  entered. The interface chrome itself (menus, buttons, labels) is English/LTR only.

## Project structure

```
prisma/schema.prisma          Database schema (Users, Companies, Contacts, Campaigns,
                               CampaignFinance, Captures, Feedback, AuditLog, Notifications, ...)
prisma/seed.ts                Creates the 3 initial accounts (admin/finance/marketing)
prisma/seed-demo.ts           Optional sample data for exploring the UI
src/app/(app)/                All authenticated pages (dashboard, campaigns, companies, ...)
src/app/login/                Login page
src/app/api/                  NextAuth handler, file upload endpoint, report export endpoint
src/components/               UI components, grouped by feature (campaigns/, companies/, ...)
src/lib/                      Prisma client, auth helpers, validation schemas, constants, audit log
```

## Useful scripts

```bash
npm run dev          # start dev server
npm run build         # production build
npm run db:push        # sync Prisma schema to the database
npm run db:seed        # create the 3 initial accounts
npm run db:seed-demo    # optional sample companies/campaigns
npm run db:studio      # Prisma Studio — browse/edit data in a GUI
```
