import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { select, selectOne } from "@/lib/db";
import { getActingCustomerId } from "@/lib/session";

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
        NULL::boolean AS fulfilled,
        order_total AS total_value
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
        <Link href="/orders">← Back to orders</Link>
      </p>
      <h2>Order #{order.order_id}</h2>
      <p>
        Customer: <strong>{customer?.full_name || "Unknown"}</strong> ({customer?.email || "n/a"})
      </p>
      <p>
        Placed: {order.order_timestamp} | Fulfilled:{" "}
        {order.fulfilled == null ? "N/A" : order.fulfilled ? "Yes" : "No"} | Total: $
        {Number(order.total_value || 0).toFixed(2)}
      </p>

      <h3>Line Items</h3>
      <table className="table">
        <thead>
          <tr>
            <th>product_name</th>
            <th>quantity</th>
            <th>unit_price</th>
            <th>line_total</th>
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
