import { redirect } from "next/navigation";
import { select } from "@/lib/db";
import { getActingCustomerId } from "@/lib/session";

export default async function OrderHistoryPage() {
  const customerId = await getActingCustomerId();
  if (!customerId) redirect("/select-customer");

  const orders = await select(
    `
      SELECT o.order_id, o.order_datetime, o.order_total, o.fraud_probability, o.predicted_fraud, o.payment_method,
             COUNT(oi.order_item_id) AS line_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.customer_id = ?
      GROUP BY o.order_id, o.order_datetime, o.order_total, o.fraud_probability, o.predicted_fraud, o.payment_method
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
            <th>Fraud Prob</th>
            <th>Predicted Fraud</th>
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
              <td>{o.fraud_probability != null ? Number(o.fraud_probability).toFixed(4) : "--"}</td>
              <td>{o.predicted_fraud ? "Yes" : "No"}</td>
              <td>${Number(o.order_total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 ? <p>No orders found.</p> : null}
    </section>
  );
}
