# Thabile's Naturals — Operations Dashboard

A management dashboard for a natural beauty products manufacturer: suppliers, raw ingredient & packaging inventory, purchase orders with receiving, product recipes (bill of materials), production batches, customer sales orders, deliveries, invoicing and payments, and a reporting dashboard.

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
2. Set up `.env` (see `.env` for the local defaults) with a `DATABASE_URL` pointing at a PostgreSQL database, plus `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
3. Run migrations and generate the Prisma client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
4. Seed sample data (creates an owner + 2 staff accounts, sample suppliers/materials/a finished product with recipe/customers):
   ```bash
   npx tsx prisma/seed.ts
   ```
   Seeded logins (all use the same password): `owner@thabilesnaturals.test`, `sipho@thabilesnaturals.test`, `nomvula@thabilesnaturals.test` / `ChangeMe123!`
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Deploying

Point `DATABASE_URL` (and `DIRECT_URL` if using a pooled connection, e.g. Neon/Supabase/Vercel Postgres) at your production database, set a strong `BETTER_AUTH_SECRET`, and set `BETTER_AUTH_URL`/`NEXT_PUBLIC_BETTER_AUTH_URL` to your production URL. Run `npx prisma migrate deploy` as part of your deploy step.

## How the manufacturing flow fits together

1. **Suppliers & Materials** — set up raw ingredients/packaging with a canonical unit of measure each.
2. **Purchase orders** — order materials from a supplier; receiving stock updates `Material.stockQty` and recalculates `costPerUnit` via a moving average.
3. **Products & Recipes** — a `FinishedProduct` has one `Recipe` (bill of materials) defining which materials, and how much of each, go into one batch yielding N units.
4. **Production batches** — planning a batch, then completing it consumes materials (scaled from the recipe to the actual quantity produced, guarded against insufficient stock) and increases finished-goods stock. Each material's cost is snapshotted onto the batch at completion time so historical batch costs don't drift if ingredient prices change later.
5. **Orders & Deliveries** — customer orders decrement finished-goods stock (guarded); an order can optionally have a delivery tracked through pending → in transit → delivered.
6. **Invoicing** — generate an invoice from a fulfilled order, record payments, and view/print it at `/print/invoices/[id]` (browser print-to-PDF, no headless-browser dependency).

## Notes

- Staff accounts are created by an `OWNER` from **Settings → Team** in the app — there is no public sign-up page.
- Money is stored as `Decimal` in Postgres; `formatMoney`/date formatters in `src/lib` intentionally avoid locale-specific `Intl` formatting that isn't guaranteed to match between the Node SSR runtime and the browser (this caused real hydration mismatches during development of the sibling app for this same client).
