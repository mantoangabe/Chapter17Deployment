import { requireTables, select } from "@/lib/db";

export default async function LateDeliveryPriorityPage() {
  const required = await requireTables(["orders", "customers", "order_predictions"]);
  const hasOrders = !required.missing.includes("orders");
  const hasCustomers = !required.missing.includes("customers");
  const hasPredictions = !required.missing.includes("order_predictions");

  if (!hasOrders || !hasCustomers || !hasPredictions) {
    return (
      <section className="card">
        <h2>Late Delivery Priority Queue</h2>
        <p>
          This queue helps warehouse teams ship at-risk orders first by prioritizing unfulfilled orders with the
          highest predicted late-delivery probability.
        </p>
        <p>
          Missing required table(s):{!hasOrders ? " orders" : ""}
          {!hasCustomers ? " customers" : ""}
          {!hasPredictions ? " order_predictions" : ""}.
        </p>
      </section>
    );
  }

  const queue = await select(
    `
      SELECT
        o.order_id,
        o.order_datetime AS order_timestamp,
        o.order_total AS total_value,
        (s.shipment_id IS NOT NULL) AS fulfilled,
        c.customer_id,
        c.full_name AS customer_name,
        p.late_delivery_probability,
        p.predicted_late_delivery,
        p.prediction_timestamp
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id
      JOIN order_predictions p ON p.order_id = o.order_id
      LEFT JOIN shipments s ON s.order_id = o.order_id
      WHERE s.shipment_id IS NULL
      ORDER BY p.late_delivery_probability DESC, o.order_datetime ASC
      LIMIT 50
    `
  );

  return (
    <section className="card">
      <h2>Late Delivery Priority Queue</h2>
      <p>
        This queue exists so warehouse teams can fulfill orders most likely to be late first, reducing delivery misses
        and improving customer satisfaction.
      </p>

      <table className="table">
        <thead>
          <tr>
            <th>order_id</th>
            <th>order_timestamp</th>
            <th>total_value</th>
            <th>fulfilled</th>
            <th>customer_id</th>
            <th>customer_name</th>
            <th>late_delivery_probability</th>
            <th>predicted_late_delivery</th>
            <th>prediction_timestamp</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((row) => (
            <tr key={row.order_id}>
              <td>{row.order_id}</td>
              <td>{row.order_timestamp}</td>
              <td>${Number(row.total_value || 0).toFixed(2)}</td>
              <td>{row.fulfilled ? "Yes" : "No"}</td>
              <td>{row.customer_id}</td>
              <td>{row.customer_name}</td>
              <td>{Number(row.late_delivery_probability || 0).toFixed(4)}</td>
              <td>{row.predicted_late_delivery ? "Yes" : "No"}</td>
              <td>{row.prediction_timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {queue.length === 0 ? <p>No orders are currently in the late-delivery queue.</p> : null}
    </section>
  );
}
