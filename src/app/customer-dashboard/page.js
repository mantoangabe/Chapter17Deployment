import Link from "next/link";
import { redirect } from "next/navigation";
import { select, selectOne } from "@/lib/db";
import { getActingCustomerId } from "@/lib/session";

export default async function CustomerDashboardPage() {
  const customerId = await getActingCustomerId();
  if (!customerId) {
    redirect("/select-customer");
  }

  const customer = await selectOne(
    `
      SELECT customer_id, full_name, email, city, state, customer_segment, loyalty_tier
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
        COUNT(*) AS order_count,
        COALESCE(SUM(order_total), 0) AS total_spent,
        COALESCE(AVG(risk_score), 0) AS avg_risk
      FROM orders
      WHERE customer_id = ?
    `,
    [customerId]
  );

  const recentOrders = await select(
    `
      SELECT order_id, order_datetime, order_total, payment_method, is_fraud
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
        <h2>Customer Dashboard</h2>
        <p>
          <strong>{customer.full_name}</strong> ({customer.email})
        </p>
        <p>
          {customer.city || "Unknown city"}, {customer.state || "Unknown state"} | Segment: {customer.customer_segment || "--"} |
          Loyalty: {customer.loyalty_tier || "none"}
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h3>Total Orders</h3>
          <p>{stats.order_count}</p>
        </article>
        <article className="card">
          <h3>Total Spent</h3>
          <p>${Number(stats.total_spent).toFixed(2)}</p>
        </article>
        <article className="card">
          <h3>Average Risk Score</h3>
          <p>{Number(stats.avg_risk).toFixed(1)}</p>
        </article>
      </section>

      <section className="card">
        <h3>Recent Orders</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Fraud?</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.order_id}>
                <td>{o.order_id}</td>
                <td>{o.order_datetime}</td>
                <td>${Number(o.order_total).toFixed(2)}</td>
                <td>{o.payment_method}</td>
                <td>{o.is_fraud ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentOrders.length === 0 ? <p>No orders yet. <Link href="/place-order">Place one now.</Link></p> : null}
      </section>
    </>
  );
}
