# TSC-Thabiles Skin Care — Operations Dashboard

A management dashboard for a natural beauty products business: product stock, stock orders (restocking with cost tracking), customer sales orders, deliveries, invoicing and payments, and a reporting dashboard.

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- PostgreSQL via Prisma ORM 7 (`@prisma/adapter-pg`)
- Better Auth (email/password, `OWNER`/`STAFF` roles via the admin plugin)
- Tailwind CSS v4 + hand-built shadcn-style UI primitives (`src/components/ui`) — the shadcn CLI's registry (`ui.shadcn.com`) isn't reachable from every environment, so components are vendored directly instead of fetched
- react-hook-form + zod, recharts, sonner

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up `.env` (see `.env` for the local defaults) with a `DATABASE_URL` pointing at a PostgreSQL database (e.g. `postgresql://user:password@localhost:5432/thabiles_dash`), plus `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
3. Run migrations and generate the Prisma client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
4. Seed sample data (creates an admin, a developer and 2 staff accounts, a sample product and customers):
   ```bash
   npx tsx prisma/seed.ts
   ```
   Seeded logins (all use the same password): `owner@thabilesnaturals.test`, `sipho@thabilesnaturals.test`, `nomvula@thabilesnaturals.test` / `ChangeMe123!`
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Deploying

Point `DATABASE_URL` at your production PostgreSQL database — Render's own managed Postgres service is the simplest option (create it in the Render dashboard, then paste its internal connection string into this app's `DATABASE_URL`), but any hosted Postgres (Neon, Supabase, RDS, etc.) works too. Set a strong `BETTER_AUTH_SECRET`, and set `BETTER_AUTH_URL`/`NEXT_PUBLIC_BETTER_AUTH_URL` to your production URL.

`npm run build` runs `prisma generate` (via `postinstall`), applies pending migrations with `prisma migrate deploy` (via `prebuild`), then runs the seed script (via `postbuild`) — so a plain `npm install && npm run build` deploy step (e.g. on Render, with the build command `npm install; npm run build`) migrates and seeds the database automatically. The seed script only creates what's missing and never modifies existing records — including user accounts an admin has since changed — so it's safe to run on every deploy, not just the first.

## How the flow fits together

1. **Products** — each product has a price, a stock quantity and a low-stock alert level (products at or below it are flagged on the Overview).
2. **Stock orders** — order more of one or more products, recording quantity and unit cost. Marking a stock order as received adds the quantities to each product's stock; an order can be cancelled any time before it's received.
3. **Combos** — a combo is sold like a product at its own price but has no stock of its own: selling one takes each of its products out of stock (other listed items, such as bottles and containers, aren't stock-counted), and the Products page shows how many current stock can make. Each order records exactly what it took from stock, so cancelling it puts that back even if the combo has been edited since.
4. **Orders & Deliveries** — customer orders decrement product stock (guarded); an order can optionally have a delivery tracked through pending → in transit → delivered.
5. **Invoicing** — generate an invoice from a fulfilled order, record payments, and view/print it at `/print/invoices/[id]` (browser print-to-PDF, no headless-browser dependency).

## Notes

- Staff accounts are created by an `OWNER` from **Settings → Team** in the app — there is no public sign-up page.
- Money is stored as `Decimal` in PostgreSQL; `formatMoney`/date formatters in `src/lib` intentionally avoid locale-specific `Intl` formatting that isn't guaranteed to match between the Node SSR runtime and the browser (this caused real hydration mismatches during development of the sibling app for this same client).
