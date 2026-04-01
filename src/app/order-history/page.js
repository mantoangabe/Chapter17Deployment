import { redirect } from "next/navigation";
import { select } from "@/lib/db";
import { getActingCustomerId } from "@/lib/session";

export default async function OrderHistoryPage() {
  const customerId = await getActingCustomerId();
  if (!customerId) redirect("/select-customer");

  const orders = select(
    `
      SELECT o.order_id, o.order_datetime, o.order_total, o.risk_score, o.payment_method,
             COUNT(oi.order_item_id) AS line_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.customer_id = ?
      GROUP BY o.order_id
      ORDER BY o.order_datetime DESC
      LIMIT 50
    `,
    [customerId]
  );

  return (
    <section className="card">
      <h2>Order History</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Payment</th>
            <th>Risk</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.order_id}>
              <td>{o.order_id}</td>
              <td>{o.order_datetime}</td>
              <td>{o.line_count}</td>
              <td>{o.payment_method}</td>
              <td>{Number(o.risk_score).toFixed(1)}</td>
              <td>${Number(o.order_total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 ? <p>No orders found.</p> : null}
    </section>
  );
}
