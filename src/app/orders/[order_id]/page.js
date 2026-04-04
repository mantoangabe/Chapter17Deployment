import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { select, selectOne, execute } from "@/lib/db";
import { getActingCustomerId } from "@/lib/session";

async function toggleActualFraud(formData) {
  "use server";
  const orderId = Number(formData.get("order_id"));
  const currentValue = formData.get("current_value") === "true";
  if (!Number.isInteger(orderId) || orderId <= 0) return;
  await execute(
    "UPDATE orders SET actual_fraud = ? WHERE order_id = ?",
    [!currentValue, orderId]
  );
  redirect(`/orders/${orderId}`);
}

export default async function OrderDetailPage({ params }) {
  const customerId = await getActingCustomerId();
  if (!customerId) redirect("/select-customer");

  const orderId = Number(params.order_id);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();

  const order = await selectOne(
    `
      SELECT
        order_id,
        customer_id,
        order_datetime AS order_timestamp,
        order_total AS total_value,
        predicted_fraud,
        fraud_probability,
        actual_fraud
      FROM orders
      WHERE order_id = ?
    `,
    [orderId]
  );

  if (!order) notFound();
  if (Number(order.customer_id) !== Number(customerId)) notFound();

  const items = await select(
    `
      SELECT
        p.product_name,
        oi.quantity,
        oi.unit_price,
        oi.line_total
      FROM order_items oi
      JOIN products p ON p.product_id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.order_item_id ASC
    `,
    [orderId]
  );

  const customer = await selectOne(
    `
      SELECT full_name, email
      FROM customers
      WHERE customer_id = ?
    `,
    [customerId]
  );

  return (
    <section className="card">
      <p>
        <Link href="/orders">&larr; Back to orders</Link>
      </p>
      <h2>Order #{order.order_id}</h2>
      <p>
        Customer: <strong>{customer?.full_name || "Unknown"}</strong> ({customer?.email || "n/a"})
      </p>
      <p>
        Placed: {order.order_timestamp} | Total: ${Number(order.total_value || 0).toFixed(2)}
      </p>

      <div className="grid" style={{ marginTop: "0.75rem" }}>
        <article className="card">
          <h3>Fraud Probability</h3>
          <p>{order.fraud_probability != null ? Number(order.fraud_probability).toFixed(4) : "Not scored"}</p>
        </article>
        <article className="card">
          <h3>Predicted Fraud</h3>
          <p>{order.predicted_fraud ? "Yes" : "No"}</p>
        </article>
        <article className="card">
          <h3>Actual Fraud</h3>
          <p style={{ color: order.actual_fraud ? "#b91c1c" : "#166534" }}>
            {order.actual_fraud ? "Yes" : "No"}
          </p>
          <form action={toggleActualFraud}>
            <input type="hidden" name="order_id" value={order.order_id} />
            <input type="hidden" name="current_value" value={String(!!order.actual_fraud)} />
            <button type="submit" style={{ marginTop: "0.5rem" }}>
              {order.actual_fraud ? "Unmark as Fraud" : "Mark as Fraud"}
            </button>
          </form>
        </article>
      </div>

      <h3>Line Items</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={`${item.product_name}-${idx}`}>
              <td>{item.product_name}</td>
              <td>{item.quantity}</td>
              <td>${Number(item.unit_price).toFixed(2)}</td>
              <td>${Number(item.line_total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 ? <p>No line items found.</p> : null}
    </section>
  );
}
