@AGENTS.md

# Production data is real — don't touch it

The live database holds the business's own products, prices, stock, customers, orders, invoices and user accounts, entered by hand.

- Never write a migration that updates, deletes or re-inserts existing rows. Schema-only changes are fine; any data change must be asked for and agreed by the owner first, for that specific change.
- Never change existing products' prices, stock, names or low-stock levels, or edit existing combos, customers, orders or users, unless the owner asks for that exact change.
- `prisma/seed.ts` runs on every deploy (`postbuild`). It must stay a no-op on any database that already has a user — keep the early return at the top of `main()`.
- Don't run `prisma migrate reset`, `db push --accept-data-loss` or anything that drops data against a real database.
