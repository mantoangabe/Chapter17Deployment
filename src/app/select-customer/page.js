import { redirect } from "next/navigation";
import { getDbStatus, requireTables, select } from "@/lib/db";
import { setActingCustomerId } from "@/lib/session";

async function chooseCustomer(formData) {
  "use server";
  const customerId = Number(formData.get("customer_id"));
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return;
  }

  await setActingCustomerId(customerId);
  redirect("/dashboard");
}

export default async function SelectCustomerPage({ searchParams }) {
  const dbStatus = getDbStatus();
  if (!dbStatus.ok) {
    return (
      <section className="card">
        <h2>Select Customer</h2>
        <p>Database unavailable at <code>{dbStatus.path}</code>.</p>
        <p>{dbStatus.error || "Unknown database error."}</p>
      </section>
    );
  }
  const required = await requireTables(["customers"]);
  if (!required.ok) {
    return (
      <section className="card">
        <h2>Select Customer</h2>
        <p>Missing required tables: {required.missing.join(", ")}.</p>
      </section>
    );
  }

  const q = String(searchParams?.q || "").trim();
  const searchLike = `%${q}%`;
  const customers = await select(
    `
      SELECT
        customer_id,
        SPLIT_PART(full_name, ' ', 1) AS first_name,
        CASE
          WHEN POSITION(' ' IN full_name) > 0 THEN TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
          ELSE ''
        END AS last_name,
        email
      FROM customers
      WHERE is_active = TRUE
        AND (? = '%%' OR full_name LIKE ? OR email LIKE ?)
      ORDER BY full_name
      LIMIT 200
    `,
    [searchLike, searchLike, searchLike]
  );

  return (
    <section className="card">
      <h2>Select Customer</h2>
      <p>Pick a customer to act as (no authentication in this project).</p>

      <form method="get" style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="q">Search customer</label>
        <br />
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Name or email"
          style={{ width: "320px", maxWidth: "100%" }}
        />
        <button type="submit" style={{ marginLeft: "0.5rem" }}>
          Search
        </button>
      </form>

      <form action={chooseCustomer}>
        <label htmlFor="customer_id">Customer</label>
        <br />
        <select id="customer_id" name="customer_id" required defaultValue="">
          <option value="" disabled>
            Select a customer
          </option>
          {customers.map((c) => (
            <option key={c.customer_id} value={c.customer_id}>
              {c.first_name} {c.last_name} ({c.email})
            </option>
          ))}
        </select>
        <div style={{ marginTop: "0.75rem" }}>
          <button type="submit">Use This Customer</button>
        </div>
      </form>
      {customers.length === 0 ? <p>No active customers found.</p> : null}
    </section>
  );
}
