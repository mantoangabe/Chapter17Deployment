import { redirect } from "next/navigation";
import { select, execute } from "@/lib/db";

async function toggleFraud(formData) {
  "use server";
  const orderId = Number(formData.get("order_id"));
  const currentValue = formData.get("current_value") === "true";
  if (!Number.isInteger(orderId) || orderId <= 0) return;
  await execute(
    "UPDATE orders SET actual_fraud = ? WHERE order_id = ?",
    [!currentValue, orderId]
  );
  redirect("/fraud-review");
}

export default async function FraudReviewPage() {
  const orders = await select(
    `
      SELECT
        o.order_id,
        o.order_datetime,
        o.order_total,
        o.payment_method,
        o.fraud_probability,
        o.predicted_fraud,
        o.actual_fraud,
        c.full_name AS customer_name
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id
      ORDER BY o.fraud_probability DESC NULLS LAST, o.order_datetime DESC
      LIMIT 100
    `
  );

  return (
    <section className="card">
      <h2>Fraud Review</h2>
      <p>
        Review orders sorted by fraud probability. Use the toggle to confirm or deny actual fraud
        for each order.
      </p>

      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Fraud Prob</th>
            <th>Predicted</th>
            <th>Actual</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.order_id}>
              <td>{o.order_id}</td>
              <td>{o.customer_name}</td>
              <td>{o.order_datetime}</td>
              <td>${Number(o.order_total).toFixed(2)}</td>
              <td>{o.payment_method}</td>
              <td>{o.fraud_probability != null ? Number(o.fraud_probability).toFixed(4) : "--"}</td>
              <td>{o.predicted_fraud ? "Yes" : "No"}</td>
              <td style={{ color: o.actual_fraud ? "#b91c1c" : "#166534", fontWeight: "bold" }}>
                {o.actual_fraud ? "Yes" : "No"}
              </td>
              <td>
                <form action={toggleFraud} style={{ margin: 0 }}>
                  <input type="hidden" name="order_id" value={o.order_id} />
                  <input type="hidden" name="current_value" value={String(!!o.actual_fraud)} />
                  <button type="submit" style={{ fontSize: "0.85rem", padding: "0.25rem 0.5rem" }}>
                    {o.actual_fraud ? "Unmark" : "Mark Fraud"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 ? <p>No orders to review.</p> : null}
    </section>
  );
}
