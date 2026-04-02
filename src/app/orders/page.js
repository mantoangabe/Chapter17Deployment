import { redirect } from "next/navigation";
import Link from "next/link";
import { select } from "@/lib/db";
import { getActingCustomerId } from "@/lib/session";

export default async function OrdersPage({ searchParams }) {
  const customerId = await getActingCustomerId();
  if (!customerId) redirect("/select-customer");
  const rows = await select(
    `
      SELECT
        order_id,
        order_datetime AS order_timestamp,
        NULL::boolean AS fulfilled,
        order_total AS total_value
      FROM orders
      WHERE customer_id = ?
      ORDER BY order_datetime DESC
      LIMIT 50
    `,
    [customerId]
  );

  const success = String(searchParams?.placed || "") === "1";

  return (
    <section className="card">
      <h2>Orders</h2>
      {success ? <p style={{ color: "#166534" }}>Order placed successfully.</p> : null}
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
          {rows.map((row) => (
            <tr key={row.order_id}>
              <td>
                <Link href={`/orders/${row.order_id}`}>{row.order_id}</Link>
              </td>
              <td>{row.order_timestamp}</td>
              <td>{row.fulfilled == null ? "N/A" : row.fulfilled ? "Yes" : "No"}</td>
              <td>${Number(row.total_value || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p>No orders yet.</p> : null}
    </section>
  );
}
