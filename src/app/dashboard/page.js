import { redirect } from "next/navigation";
import { getDb, selectOne } from "@/lib/db";
import { getActingCustomerId } from "@/lib/session";

function hasColumn(columns, name) {
  return columns.some((c) => c.name === name);
}

export default async function DashboardPage() {
  const customerId = await getActingCustomerId();
  if (!customerId) {
    redirect("/select-customer");
  }
  const db = getDb();

  const customer = selectOne(
    `
      SELECT customer_id, full_name, email
      FROM customers
      WHERE customer_id = ?
    `,
    [customerId]
  );

  if (!customer) {
    redirect("/select-customer");
  }

  const orderColumns = db.prepare("PRAGMA table_info(orders)").all();
  const totalField = hasColumn(orderColumns, "total_value") ? "total_value" : "order_total";
  const timestampField = hasColumn(orderColumns, "order_timestamp") ? "order_timestamp" : "order_datetime";
  const fulfilledField = hasColumn(orderColumns, "fulfilled")
    ? "fulfilled"
    : hasColumn(orderColumns, "late_delivery")
      ? "late_delivery"
      : null;

  const stats = selectOne(
    `
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(${totalField}), 0) AS total_spend
      FROM orders
      WHERE customer_id = ?
    `,
    [customerId]
  );

  const recentOrders = db
    .prepare(
      `
        SELECT
          order_id,
          ${timestampField} AS order_timestamp,
          ${fulfilledField ? `${fulfilledField} AS fulfilled,` : "NULL AS fulfilled,"}
          ${totalField} AS total_value
        FROM orders
        WHERE customer_id = ?
        ORDER BY ${timestampField} DESC
        LIMIT 5
      `
    )
    .all(customerId);

  return (
    <>
      <section className="card">
        <h2>Dashboard</h2>
        <p>
          <strong>{customer.full_name}</strong> ({customer.email})
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h3>Total Orders</h3>
          <p>{stats.total_orders}</p>
        </article>
        <article className="card">
          <h3>Total Spend</h3>
          <p>${Number(stats.total_spend).toFixed(2)}</p>
        </article>
      </section>

      <section className="card">
        <h3>5 Most Recent Orders</h3>
        <table className="table">
          <thead>
            <tr>
              <th>order_id</th>
              <th>order_timestamp</th>
              <th>fulfilled</th>
              <th>total_value</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.order_id}>
                <td>{o.order_id}</td>
                <td>{o.order_timestamp}</td>
                <td>{o.fulfilled == null ? "N/A" : o.fulfilled ? "Yes" : "No"}</td>
                <td>${Number(o.total_value || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
