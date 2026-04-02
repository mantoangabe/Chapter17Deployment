import { select } from "@/lib/db";

export default async function WarehousePriorityQueuePage() {
  const queue = await select(
    `
      SELECT o.order_id, o.order_datetime, o.order_total, o.risk_score,
             c.full_name,
             CASE
               WHEN o.order_total >= 250 THEN 'HIGH_VALUE'
               WHEN o.risk_score >= 60 THEN 'MANUAL_REVIEW'
               ELSE 'STANDARD'
             END AS queue_tag
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id
      LEFT JOIN shipments s ON s.order_id = o.order_id
      WHERE s.shipment_id IS NULL
      ORDER BY
        CASE
          WHEN o.order_total >= 250 THEN 1
          WHEN o.risk_score >= 60 THEN 2
          ELSE 3
        END,
        o.order_datetime ASC
      LIMIT 75
    `
  );

  return (
    <section className="card">
      <h2>Warehouse Priority Queue</h2>
      <p>Unshipped orders sorted for fulfillment operations.</p>
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Placed At</th>
            <th>Total</th>
            <th>Risk</th>
            <th>Queue Tag</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((row) => (
            <tr key={row.order_id}>
              <td>{row.order_id}</td>
              <td>{row.full_name}</td>
              <td>{row.order_datetime}</td>
              <td>${Number(row.order_total).toFixed(2)}</td>
              <td>{Number(row.risk_score).toFixed(1)}</td>
              <td>{row.queue_tag}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {queue.length === 0 ? <p>Queue is empty.</p> : null}
    </section>
  );
}
