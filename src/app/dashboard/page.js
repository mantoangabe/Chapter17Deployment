import { redirect } from "next/navigation";
import { select, selectOne } from "@/lib/db";
import { getActingCustomerId } from "@/lib/session";

export default async function DashboardPage() {
  const customerId = await getActingCustomerId();
  if (!customerId) {
    redirect("/select-customer");
  }

  const customer = await selectOne(
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

  const stats = await selectOne(
    `
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(order_total), 0) AS total_spend
      FROM orders
      WHERE customer_id = ?
    `,
    [customerId]
  );

  const recentOrders = await select(
    `
      SELECT
        order_id,
        order_datetime AS order_timestamp,
        NULL::boolean AS fulfilled,
        order_total AS total_value
      FROM orders
      WHERE customer_id = ?
      ORDER BY order_datetime DESC
      LIMIT 5
    `,
    [customerId]
  );

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
