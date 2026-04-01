# Next.js student project web app
_Exported on 4/1/2026 at 09:58:34 MDT from Cursor (2.6.21)_

---

**User**

  You are generating a complete student project web app using Next.js (App Router) and SQLite.
      Constraints:
      - No authentication. Users select an existing customer to "act as".
      - Use a SQLite file named "shop.db" located at the project root (or /data/shop.db if you prefer).
      - Use better-sqlite3 for DB access.
      - Keep UI simple and clean.

      Tasks:
      1. Create a new Next.js app (App Router).
      2. Add a server-side DB helper module that opens shop.db and exposes helpers for SELECT and INSERT/UPDATE using prepared statements.
      3. Create a shared layout with navigation links:
        - Select Customer
        - Customer Dashboard
        - Place Order
        - Order History
        - Warehouse Priority Queue
        - Run Scoring
      4. Provide install/run instructions (npm) and any required scripts.

      Return:
      - All files to create/modify
      - Any commands to run

---

**Cursor**

I’ll scaffold the Next.js App Router project in this repo, wire `better-sqlite3` to `shop.db`, and then add the pages/routes plus shared navigation and run instructions. I’m first checking the current repository contents so I can build on what’s already there.

The automatic scaffold failed because `create-next-app` rejects uppercase folder names. I’m proceeding by creating the Next.js structure manually in place (same end result), then installing dependencies and wiring pages to your existing `shop.db`.

Dependency installation is still running in the background with no new output yet. I’m waiting a bit longer, then I’ll proceed with file scaffolding as soon as it finishes.

I’m seeing `npm install` hanging in this environment (no output for several minutes), so I’ll finish scaffolding all project files directly now and include the exact npm commands for you to run locally.

I’ve created the project scaffold and config files; next I’m adding the database/session helpers and all requested pages with navigation and server-side actions for customer selection, order placement, queue view, and scoring.

Implemented a full Next.js (App Router) student web app scaffold using your existing root `shop.db` with `better-sqlite3`, no auth, and “act as customer” behavior via cookie.

## What I created/modified

- `package.json`
- `package-lock.json` (generated during dependency install attempt)
- `next.config.mjs`
- `jsconfig.json`
- `.eslintrc.json`
- `README.md`
- `src/lib/db.js`
- `src/lib/session.js`
- `src/app/globals.css`
- `src/app/layout.js`
- `src/app/page.js`
- `src/app/select-customer/page.js`
- `src/app/customer-dashboard/page.js`
- `src/app/place-order/page.js`
- `src/app/order-history/page.js`
- `src/app/warehouse-priority-queue/page.js`
- `src/app/run-scoring/page.js`

## What’s included

- **App Router project structure** with clean shared layout/navigation.
- **SQLite helper module** in `src/lib/db.js`:
  - Singleton DB connection to `shop.db` (`SHOP_DB_PATH` override supported).
  - Prepared statement helpers: `select`, `selectOne`, `execute`, `withTransaction`.
- **No-auth customer context** in `src/lib/session.js`:
  - Server-side cookie stores selected customer ID.
- **Required pages/routes**:
  - `Select Customer`
  - `Customer Dashboard`
  - `Place Order`
  - `Order History`
  - `Warehouse Priority Queue`
  - `Run Scoring`
- **Simple, clean UI** in `globals.css`.
- **Install/run instructions** in `README.md`.

## Commands to run

From project root:

```bash
npm install
npm run dev
```

Then open: [http://localhost:3000](http://localhost:3000)

Optional DB override:

```bash
SHOP_DB_PATH=/data/shop.db npm run dev
```

If you want, I can also add a tiny seed/check script (e.g., `npm run db:check`) to verify schema/tables before app startup.

---

**User**

      Add a developer-only page at /debug/schema that prints:
      - All table names in shop.db
      - For each table, the column names and types (PRAGMA table_info)

      Purpose: Students can verify the real schema and adjust prompts if needed.
      Keep it simple and readable.

---

**Cursor**

I’ll add a simple developer-only route at ` /debug/schema ` that queries `sqlite_master` plus `PRAGMA table_info` and renders a readable schema dump. I’m checking existing app conventions first, then I’ll create that page.

I’m now adding the actual schema page and a dev-only nav link so students can reach it during development, while keeping it hidden in production.

Added a developer-only schema inspector at `\`/debug/schema\`` with a simple readable table-per-table view.

### Changes made

- **Created** `src/app/debug/schema/page.js`
  - Reads all tables using `sqlite_master`.
  - For each table, runs `PRAGMA table_info(...)`.
  - Displays:
    - table name
    - column name
    - column type
  - Only accessible in development (`NODE_ENV === "development"`); otherwise shows a simple message.

- **Updated** `src/app/layout.js`
  - Added a **dev-only** nav link to `\`/debug/schema\`` labeled **Debug Schema**.

### Notes

- This page uses your existing `better-sqlite3` connection from `src/lib/db.js`.
- It’s intentionally plain and readable for students to verify real schema quickly.

If you want, I can also add a compact JSON export block on that same page (copy/paste friendly for prompt building).

---

**User**

      Add a "Select Customer" page at /select-customer.

      Requirements:
      1. Query the database for customers:
        - customer_id
        - first_name
        - last_name
        - email
      2. Render a searchable dropdown or simple list. When a customer is selected, store customer_id in a cookie.
      3. Redirect to /dashboard after selection.
      4. Add a small banner showing the currently selected customer on every page (if set).

      Deliver:
      - Any new routes/components
      - DB query code using better-sqlite3
      - Notes on where customer_id is stored

---

**Cursor**

I’ll update the existing selection flow to match your new `/dashboard` requirement, adapt the customer query to return `first_name/last_name/email`, and add a global selected-customer banner in the shared layout. I’m reading the current page/session files first, then patching them.

I’ve implemented the new route and banner behavior; next I’m running a lint check on the changed files to verify there are no introduced issues.

Implemented the customer-selection flow you requested, including `/select-customer`, redirect to `/dashboard`, and a global selected-customer banner.

## New/updated routes and components

- **Updated** `src/app/select-customer/page.js`
  - Adds searchable customer selection (simple search form + dropdown).
  - On submit, stores selected `customer_id` in cookie.
  - Redirects to `\`/dashboard\`` after selection.

- **Added** `src/app/dashboard/page.js`
  - Reuses existing dashboard by exporting from `\`/customer-dashboard\`` route.

- **Updated** `src/app/layout.js`
  - Adds a small banner on every page showing currently selected customer (if cookie is set).
  - Updates nav link to use `\`/dashboard\`` for Customer Dashboard.

## DB query code (`better-sqlite3`)

In `src/app/select-customer/page.js`, the query now returns exactly:

- `customer_id`
- `first_name`
- `last_name`
- `email`

It uses SQL expressions to derive `first_name`/`last_name` from your existing `full_name` column:

- `TRIM(CASE ... END) AS first_name`
- `TRIM(CASE ... END) AS last_name`

and supports search by `full_name` or `email`.

## Where `customer_id` is stored

- Stored in an **HTTP-only cookie** named:
  - `acting_customer_id`
- Cookie code location:
  - `src/lib/session.js`
- Set by:
  - `setActingCustomerId(customerId)`
- Read by:
  - `getActingCustomerId()`

If you want, I can also add a small “Clear selected customer” button (logout-like reset) in the banner.

---

**User**

      Create a /dashboard page that shows a summary for the selected customer.

      Requirements:
      1. If no customer is selected, redirect to /select-customer.
      2. Show:
        - Customer name and email
        - Total number of orders for the customer
        - Total spend across all orders (sum total_value)
        - A small table of the 5 most recent orders (order_id, order_timestamp, fulfilled, total_value)
      3. All data must come from shop.db.

      Deliver:
      - SQL queries used
      - Page UI implementation

---

**Cursor**

I’ll implement a dedicated `\`/dashboard\`` page that pulls everything from `shop.db`, handles “no selected customer” redirect, and supports your requested order field names even if the underlying schema uses alternate names. Then I’ll share the exact SQL used.

Implemented a dedicated `\`/dashboard\`` page that uses `shop.db` data and satisfies the redirect + summary requirements.

## Page UI implementation

- **Route:** `src/app/dashboard/page.js`
- Behavior:
  - Reads selected customer from cookie (`acting_customer_id` via `getActingCustomerId()`).
  - If missing or invalid customer, redirects to `\`/select-customer\``.
  - Shows:
    - customer name + email
    - total orders
    - total spend
    - recent 5 orders table with:
      - `order_id`
      - `order_timestamp`
      - `fulfilled`
      - `total_value`

It also handles schema variants safely:
- If `orders.total_value` doesn’t exist, uses `orders.order_total`.
- If `orders.order_timestamp` doesn’t exist, uses `orders.order_datetime`.
- If `orders.fulfilled` doesn’t exist, shows `N/A` (or falls back to a compatible field if present).

## SQL queries used

Customer lookup:
```sql
SELECT customer_id, full_name, email
FROM customers
WHERE customer_id = ?
```

Schema introspection for robust field mapping:
```sql
PRAGMA table_info(orders)
```

Order summary:
```sql
SELECT
  COUNT(*) AS total_orders,
  COALESCE(SUM(<total_field>), 0) AS total_spend
FROM orders
WHERE customer_id = ?
```

Recent 5 orders:
```sql
SELECT
  order_id,
  <timestamp_field> AS order_timestamp,
  <fulfilled_field_or_null> AS fulfilled,
  <total_field> AS total_value
FROM orders
WHERE customer_id = ?
ORDER BY <timestamp_field> DESC
LIMIT 5
```

Where:
- `<total_field>` = `total_value` or `order_total`
- `<timestamp_field>` = `order_timestamp` or `order_datetime`
- `<fulfilled_field_or_null>` = `fulfilled` (or compatible fallback) / `NULL` if unavailable

---

**User**

      Create a /place-order page that allows creating a new order for the selected customer.

      Requirements:
      1. If no customer selected, redirect to /select-customer.
      2. Query products (product_id, product_name, price) and let the user add 1+ line items:
        - product
        - quantity
      3. On submit:
        - Insert a row into orders for this customer with fulfilled = 0 and order_timestamp = current time
        - Insert corresponding rows into order_items
        - Compute and store total_value in orders (sum price*quantity)
      4. After placing, redirect to /orders and show a success message.

      Constraints:
      - Use a transaction for inserts.
      - Keep the UI minimal (a table of line items is fine).

      Deliver:
      - SQL inserts
      - Next.js route handlers (server actions or API routes)
      - Any validation rules

---

**Cursor**

I’m going to replace the current `/place-order` flow with a true multi-line-item order form, wrap inserts in a SQLite transaction, and add `/orders` as the post-submit destination with a success message. I’ll patch the relevant routes now.

Implemented a full `/place-order` flow with multi-line items, server-side validation, transaction-based inserts, and redirect to `/orders` with success message.

## What I added

- **Updated** `src/app/place-order/page.js`
  - Redirects to `/select-customer` if no selected customer.
  - Queries products from `shop.db` (`product_id`, `product_name`, `price`).
  - Minimal line-item table UI (5 rows) with:
    - product dropdown
    - quantity input
  - Server action validates input and inserts order + items in a **single SQLite transaction**.
  - Redirects to `/orders?placed=1` after success.
  - Shows validation errors via query string.

- **Added** `src/app/orders/page.js`
  - Lists selected customer’s orders.
  - Shows success banner when `placed=1`.
  - Displays columns: `order_id`, `order_timestamp`, `fulfilled`, `total_value`.

## SQL inserts used

Order insert (schema-aware, uses available column names):
- If `fulfilled` exists:
```sql
INSERT INTO orders (customer_id, <timestamp_field>, fulfilled, <total_field>)
VALUES (?, ?, ?, ?)
```

- Fallback for the existing class schema (no `fulfilled` column):
```sql
INSERT INTO orders (
  customer_id, <timestamp_field>, billing_zip, shipping_zip, shipping_state,
  payment_method, device_type, ip_country, promo_used, promo_code,
  order_subtotal, shipping_fee, tax_amount, <total_field>, risk_score, is_fraud
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

Order items insert:
```sql
INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
VALUES (?, ?, ?, ?, ?)
```

`<timestamp_field>` resolves to `order_timestamp` or `order_datetime`.  
`<total_field>` resolves to `total_value` or `order_total`.

## Next.js server action / transaction

- Uses server action in `src/app/place-order/page.js`:
  - Builds validated line items
  - Computes `total_value = SUM(price * quantity)`
  - Executes:
    - order insert
    - all `order_items` inserts
  - inside `db.transaction(() => { ... })`

## Validation rules implemented

- Selected customer must exist in cookie; else redirect.
- Must include **at least one** valid line item.
- Each line item must have:
  - valid `product_id`
  - integer `quantity > 0`
- Every submitted product must exist and be active.
- Invalid input redirects back with an error message.

If you want, I can also switch the nav link from `Order History` to `/orders` (or keep both).

---

**User**

      Create a /orders page that shows order history for the selected customer.

      Requirements:
      1. If no customer selected, redirect to /select-customer.
      2. Render a table of the customer's orders:
        - order_id, order_timestamp, fulfilled, total_value
      3. Clicking an order shows /orders/[order_id] with line items:
        - product_name, quantity, unit_price, line_total
      4. Keep it clean and readable.

      Deliver:
      - The two pages
      - SQL queries

---

**Cursor**

I’ll wire the order list and add the order detail page at `/orders/[order_id]`, including owner checks so only the selected customer’s orders are shown. Then I’ll share the exact SQL used.

Implemented both pages for customer order history and order drill-down.

## Pages delivered

- `src/app/orders/page.js`
  - Redirects to `/select-customer` if no selected customer.
  - Renders order table with:
    - `order_id` (now clickable)
    - `order_timestamp`
    - `fulfilled`
    - `total_value`

- `src/app/orders/[order_id]/page.js`
  - Redirects to `/select-customer` if no selected customer.
  - Validates `order_id`.
  - Ensures the order belongs to the selected customer.
  - Shows line items table with:
    - `product_name`
    - `quantity`
    - `unit_price`
    - `line_total`

## SQL queries used

Orders list query (`/orders`):
```sql
SELECT
  order_id,
  <timestamp_field> AS order_timestamp,
  <fulfilled_field> AS fulfilled,
  <total_field> AS total_value
FROM orders
WHERE customer_id = ?
ORDER BY <timestamp_field> DESC
LIMIT 50
```

Order detail query (`/orders/[order_id]`):
```sql
SELECT
  order_id,
  customer_id,
  <timestamp_field> AS order_timestamp,
  <fulfilled_field> AS fulfilled,
  <total_field> AS total_value
FROM orders
WHERE order_id = ?
```

Line items query (`/orders/[order_id]`):
```sql
SELECT
  p.product_name,
  oi.quantity,
  oi.unit_price,
  oi.line_total
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
WHERE oi.order_id = ?
ORDER BY oi.order_item_id ASC
```

Customer display query (detail header):
```sql
SELECT full_name, email
FROM customers
WHERE customer_id = ?
```

Schema compatibility helper query (used to map fields if schema differs):
```sql
PRAGMA table_info(orders)
```

It maps:
- `<timestamp_field>` = `order_timestamp` or `order_datetime`
- `<fulfilled_field>` = `fulfilled` or `NULL`
- `<total_field>` = `total_value` or `order_total`



---

**User**

      Create /warehouse/priority page that shows the "Late Delivery Priority Queue".

      Use this SQL query exactly (adjust table/column names only if they differ in shop.db):

      SELECT
        o.order_id,
        o.order_timestamp,
        o.total_value,
        o.fulfilled,
        c.customer_id,
        c.first_name || ' ' || c.last_name AS customer_name,
        p.late_delivery_probability,
        p.predicted_late_delivery,
        p.prediction_timestamp
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id
      JOIN order_predictions p ON p.order_id = o.order_id
      WHERE o.fulfilled = 0
      ORDER BY p.late_delivery_probability DESC, o.order_timestamp ASC
      LIMIT 50;

      Requirements:
      - Render the results in a table.
      - Add a short explanation paragraph describing why this queue exists.

      Deliver:
      - Page code

---

**Cursor**

I’ll add a new route at `/warehouse/priority` and implement the exact queue query pattern with schema-name adjustments where needed, plus a concise explanation and table UI. I’m first checking current schema fields to map names safely.

Added `\`/warehouse/priority\`` with a clean “Late Delivery Priority Queue” table and explanation.

### Page code created

- `src/app/warehouse/priority/page.js`

### What it does

- Uses the SQL structure you specified, with **only schema-name adjustments**:
  - `orders.order_timestamp` -> `orders.order_datetime` if needed
  - `orders.total_value` -> `orders.order_total` if needed
  - `customers.first_name || ' ' || customers.last_name` -> `customers.full_name` if needed
  - `orders.fulfilled` fallback handled when column is absent
- Renders a readable table with all requested output columns.
- Includes a short explanatory paragraph about why the queue exists.
- Handles missing required tables (notably `order_predictions` in your current DB) with a clear message instead of crashing.

If you want, I can also add a nav link to `\`/warehouse/priority\`` so it’s reachable directly from the top menu.

---

**User**

      Add a /scoring page with a "Run Scoring" button.

      Behavior:
      1. When clicked, the server runs:
        python jobs/run_inference.py
      2. The Python script writes predictions into order_predictions keyed by order_id.
      3. The UI shows:
        - Success/failure status
        - How many orders were scored (parse stdout if available)
        - Timestamp

      Constraints:
      - Provide safe execution: timeouts and capture stdout/stderr.
      - The app should not crash if Python fails; show an error message.
      - Do not require Docker.

      Deliver:
      - Next.js route/handler for triggering scoring
      - Implementation details for running Python from Node
      - Any UI components needed

---

**Cursor**

I’ll add a dedicated `/scoring` page with a server action that safely executes `python jobs/run_inference.py` using timeout + stdout/stderr capture, then surfaces status/count/timestamp in the UI without crashing on failure. I’m checking the current scoring route and nav first, then patching.

Added a new `/scoring` page with a **Run Scoring** button that safely executes Python and reports status/count/timestamp.

## Delivered route/handler

- **New page:** `src/app/scoring/page.js`
- Uses a **Server Action** (`runScoringAction`) as the trigger handler.
- Button posts to the server action, which runs:

- `python jobs/run_inference.py`

## Safe Python execution details (Node side)

Implemented in `src/app/scoring/page.js`:

- Uses `execFile("python", [scriptPath], options, callback)` from `node:child_process`
- Safety settings:
  - `timeout: 120000` (2 min hard timeout)
  - `maxBuffer: 1MB`
  - Captures both `stdout` and `stderr`
- Handles failures without crashing:
  - missing script file
  - timeout / non-zero exit
  - runtime exceptions
- Always redirects back to `/scoring` with result params so UI can render outcome.

## UI behavior

The `/scoring` page now shows:

- **Status**: `success`, `warning`, or `error`
- **Orders scored**:
  - parsed from stdout via regex patterns like:
    - `X orders scored`
    - `scored X orders`
    - `X predictions`
  - fallback text if not found
- **Timestamp**: ISO timestamp set at run time
- **Output**: truncated stdout/stderr message for readability

## Additional update

- Updated nav link in `src/app/layout.js`:
  - `Run Scoring` now points to `/scoring` instead of `/run-scoring`.



---

**User**

      Polish the app for student usability and add a testing checklist.

      Tasks:
      1. Add a banner showing which customer is currently selected.
      2. Add basic form validation on /place-order.
      3. Add error handling for missing DB, missing tables, or empty results.
      4. Provide a manual QA checklist:
        - Select customer
        - Place order
        - View orders
        - Run scoring
        - View priority queue with the new order appearing (after scoring)

      Deliver:
      - Final code changes
      - A README.md with setup and run steps

---

**Cursor**

I’ll tighten usability and resilience across key pages: keep/verify the selected-customer banner, strengthen `/place-order` validation feedback, add graceful DB/table-missing handling, and update `README.md` with a clear manual QA checklist. I’m reviewing the current files first, then patching.

I found one key stability issue: DB initialization currently creates indexes unconditionally, which can crash when tables are missing. I’m fixing `db` startup to fail gracefully, then adding table checks and stronger `/place-order` validations plus QA checklist updates in `README.md`.

I’ve now hardened layout and customer selection for DB/table errors. I’m finishing by updating `README.md` with the full student-focused setup/run steps and the manual QA checklist you requested.

Implemented the usability polish + QA checklist, including stronger validation and graceful error handling.

## Final code changes

### `src/lib/db.js`
- Refactored DB initialization to be safer:
  - Catches DB open/init errors.
  - Avoids crashing when index creation runs before tables exist.
- Added helpers for resilience:
  - `getDbStatus()` -> reports DB availability/path/error
  - `tableExists(name)`
  - `requireTables([...])`
  - `getDb()` -> checked DB accessor
- Existing query helpers now use checked DB access internally.

### `src/app/layout.js`
- Kept and hardened the **selected customer banner** across all pages.
- Added DB-unavailable banner at top when DB cannot be opened.
- Wrapped customer lookup logic so layout doesn’t hard-fail if DB/table issues occur.

### `src/app/select-customer/page.js`
- Added graceful handling for:
  - missing DB
  - missing `customers` table
  - empty customer results
- Existing searchable selection flow remains intact.

### `src/app/place-order/page.js`
- Added stronger validation:
  - at least one line item required
  - each entered row must have valid product + quantity
  - quantity range enforced: `1-999`
  - rejects partial/invalid rows with clear error message
- Added safety checks for required tables:
  - `orders`, `order_items`, `products`
- Added missing/empty result UX:
  - if no products, disables submit and shows message
  - if DB missing/tables missing, shows readable error panel
- Transaction-based inserts remain in place.

### `src/app/error.js` (new)
- Added global app error UI (client error boundary for App Router):
  - shows safe fallback message
  - displays error text
  - includes “Try Again” button

### `README.md`
- Updated feature list and route references.
- Added setup and expectations clarity (including cookie storage details).
- Added full **manual QA checklist** covering:
  - Select customer
  - Place order
  - View orders
  - Run scoring
  - View priority queue after scoring

---

## Notes on requested items

- **Selected customer banner:** present globally in `layout`.
- **Basic `/place-order` validation:** implemented server-side + input constraints.
- **Missing DB/tables/empty results handling:** added in `db` helpers and key student flows/pages.
- **Manual QA checklist:** added to `README.md` exactly as requested, with actionable steps.

If you want, I can do one more pass to unify nav labels/routes (`/order-history` vs `/orders`, `/warehouse-priority-queue` vs `/warehouse/priority`) so students only see one canonical path per feature.

