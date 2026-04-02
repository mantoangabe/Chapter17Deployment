# Supabase + Vercel + GitHub Setup

This guide migrates your current SQLite `shop.db` to Supabase Postgres and wires GitHub push -> Vercel redeploy.

## 1) Create Supabase project

1. In Supabase, create a new project.
2. Save these values:
   - Project URL
   - Project reference (project ref)
   - Database password
   - `anon` and `service_role` keys (Project Settings -> API)

## 2) Link local repo to Supabase and apply migrations

From repo root:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

This applies:
- `supabase/migrations/20260402161000_init_shop_schema.sql`
- `supabase/migrations/20260402162000_add_order_predictions.sql`

## 3) Move data from SQLite -> Supabase

Use `pgloader` (fastest path for SQLite -> Postgres).

### Option A: pgloader via Docker (easy)

```bash
docker run --rm \
  -v "$PWD:/work" \
  dimitri/pgloader:latest \
  pgloader /work/shop.db postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
```

### Option B: Native pgloader

```bash
pgloader shop.db postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
```

## 4) Normalize imported booleans (if needed)

`pgloader` can import booleans correctly, but if you see `0/1` values in boolean columns, run:

```sql
update public.customers set is_active = (is_active::int <> 0);
update public.products set is_active = (is_active::int <> 0);
update public.orders set promo_used = (promo_used::int <> 0), is_fraud = (is_fraud::int <> 0);
update public.shipments set late_delivery = (late_delivery::int <> 0);
```

## 5) Reset identity sequences after import

Run in Supabase SQL Editor:

```sql
select setval('public.customers_customer_id_seq', coalesce(max(customer_id), 1), true) from public.customers;
select setval('public.products_product_id_seq', coalesce(max(product_id), 1), true) from public.products;
select setval('public.orders_order_id_seq', coalesce(max(order_id), 1), true) from public.orders;
select setval('public.order_items_order_item_id_seq', coalesce(max(order_item_id), 1), true) from public.order_items;
select setval('public.shipments_shipment_id_seq', coalesce(max(shipment_id), 1), true) from public.shipments;
select setval('public.product_reviews_review_id_seq', coalesce(max(review_id), 1), true) from public.product_reviews;
```

## 6) Verify migration

Run these checks in Supabase SQL Editor:

```sql
select count(*) from public.customers;
select count(*) from public.orders;
select count(*) from public.order_items;
select count(*) from public.products;
select count(*) from public.shipments;
select count(*) from public.product_reviews;
```

Expected counts from your current SQLite snapshot:
- customers: 250
- orders: 5001
- order_items: 15023
- products: 100
- shipments: 5000
- product_reviews: 3000

## 7) GitHub -> Vercel auto deploy

1. Push this repo to GitHub (if not already).
2. In Vercel: **Add New Project** -> import this GitHub repo.
3. In Vercel project settings:
   - Framework preset: Next.js
   - Add env vars (Preview + Production):
     - `SUPABASE_DB_URL` (required by current app server code)
     - `DATABASE_URL` (optional fallback to same value)
     - `NEXT_PUBLIC_SUPABASE_URL` (optional, client-side Supabase usage)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional, client-side Supabase usage)
     - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
4. Enable automatic deployments from `main` (default in Vercel).

After this, every push to GitHub triggers a new Vercel deployment.

## 8) Current app status

The app in this repo now uses Postgres via `pg` in `src/lib/db.js` and reads:

- `SUPABASE_DB_URL` (preferred)
- `DATABASE_URL` (fallback)
