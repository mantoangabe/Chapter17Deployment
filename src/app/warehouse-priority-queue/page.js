import { select } from "@/lib/db";

export default async function WarehousePriorityQueuePage() {
  const queue = await select(
    `
      SELECT o.order_id, o.order_datetime, o.order_total, o.fraud_probability, o.predicted_fraud,
             c.full_name,
             CASE
               WHEN o.order_total >= 250 THEN 'HIGH_VALUE'
               WHEN o.predicted_fraud = TRUE THEN 'FRAUD_REVIEW'
               WHEN COALESCE(o.fraud_probability, 0) >= 0.40 THEN 'ELEVATED_RISK'
               ELSE 'STANDARD'
             END AS queue_tag
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id
      LEFT JOIN shipments s ON s.order_id = o.order_id
      WHERE s.shipment_id IS NULL
      ORDER BY
        CASE
          WHEN o.order_total >= 250 THEN 1
          WHEN o.predicted_fraud = TRUE THEN 2
          WHEN COALESCE(o.fraud_probability, 0) >= 0.40 THEN 3
          ELSE 4
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
            <th>Fraud Prob</th>
            <th>Predicted Fraud</th>
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
              <td>{row.fraud_probability != null ? Number(row.fraud_probability).toFixed(4) : "--"}</td>
              <td>{row.predicted_fraud ? "Yes" : "No"}</td>
              <td>{row.queue_tag}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {queue.length === 0 ? <p>Queue is empty.</p> : null}
    </section>
  );
}
