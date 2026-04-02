# Student Shop App (Next.js + Supabase Postgres)

Simple student project web app using Next.js App Router and Supabase Postgres.

## Features

- No authentication
- Select an existing customer to act as
- Customer dashboard
- Place order
- Order history (`/orders` and `/orders/[order_id]`)
- Warehouse priority queue (`/warehouse/priority`)
- Run scoring (`/scoring`)
- Selected customer banner on every page
- Friendly error states for missing DB/tables and empty results

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open app:

- [http://localhost:3000](http://localhost:3000)

## Project Expectations

- Server-side database access uses `SUPABASE_DB_URL` (or `DATABASE_URL`).
- No authentication is used; students choose a customer in `/select-customer`.
- Selected customer id is stored in an HTTP-only cookie named `acting_customer_id`.

## Available Scripts

- `npm run dev` - start dev mode
- `npm run build` - build production assets
- `npm run start` - run production server
- `npm run lint` - run lint checks

## DB Configuration

- Required server env var:
  - `SUPABASE_DB_URL` (preferred) or `DATABASE_URL`
- Optional client env vars (for future Supabase client usage):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase + Vercel

Migration and deployment guide:

- `SUPABASE_VERCEL_GITHUB_SETUP.md`
- Supabase SQL migrations in `supabase/migrations`

## Manual QA Checklist

Use this checklist to validate the full student flow end-to-end.

1. **Select customer**
   - Open `/select-customer`.
   - Search by name/email, select a customer, submit.
   - Confirm redirect to `/dashboard`.
   - Confirm banner shows the selected customer on top.

2. **Place order**
   - Open `/place-order`.
   - Add at least one valid line item (product + quantity).
   - Submit order.
   - Confirm redirect to `/orders` with a success message.

3. **View orders**
   - On `/orders`, confirm new order appears with `order_id`, timestamp, fulfilled, total.
   - Click the order id and verify line items on `/orders/[order_id]`.

4. **Run scoring**
   - Open `/scoring`.
   - Click **Run Scoring**.
   - Confirm UI shows status, orders scored (if reported), timestamp, and output/error text.

5. **View priority queue**
   - Open `/warehouse/priority`.
   - After scoring completes and `order_predictions` exists/populates, verify queue rows render.
   - Check whether the new order appears based on prediction probability and fulfillment state.
