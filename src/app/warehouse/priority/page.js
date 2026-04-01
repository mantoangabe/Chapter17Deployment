import { getDb } from "@/lib/db";

function hasColumn(columns, name) {
  return columns.some((c) => c.name === name);
}

export default function LateDeliveryPriorityPage() {
  const db = getDb();
  const tableRows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
  const tableNames = new Set(tableRows.map((r) => r.name));

  const hasOrders = tableNames.has("orders");
  const hasCustomers = tableNames.has("customers");
  const hasPredictions = tableNames.has("order_predictions");

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

  const orderCols = db.prepare("PRAGMA table_info(orders)").all();
  const customerCols = db.prepare("PRAGMA table_info(customers)").all();

  const orderTimestamp = hasColumn(orderCols, "order_timestamp") ? "order_timestamp" : "order_datetime";
  const totalValue = hasColumn(orderCols, "total_value") ? "total_value" : "order_total";
  const fulfilledExpr = hasColumn(orderCols, "fulfilled") ? "o.fulfilled" : "0";
  const unfulfilledWhere = hasColumn(orderCols, "fulfilled") ? "o.fulfilled = 0" : "1 = 1";
  const customerNameExpr =
    hasColumn(customerCols, "first_name") && hasColumn(customerCols, "last_name")
      ? "c.first_name || ' ' || c.last_name"
      : "c.full_name";

  // Base SQL requested by prompt, with only table/column-name adaptations for this schema.
  const queue = db
    .prepare(
      `
      SELECT
        o.order_id,
        o.${orderTimestamp} AS order_timestamp,
        o.${totalValue} AS total_value,
        ${fulfilledExpr} AS fulfilled,
        c.customer_id,
        ${customerNameExpr} AS customer_name,
        p.late_delivery_probability,
        p.predicted_late_delivery,
        p.prediction_timestamp
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id
      JOIN order_predictions p ON p.order_id = o.order_id
      WHERE ${unfulfilledWhere}
      ORDER BY p.late_delivery_probability DESC, o.${orderTimestamp} ASC
      LIMIT 50
    `
    )
    .all();

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
