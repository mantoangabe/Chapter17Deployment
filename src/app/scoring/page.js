import { redirect } from "next/navigation";
import { execute, selectOne } from "@/lib/db";

async function runScoringAction() {
  "use server";

  const timestamp = new Date().toISOString();

  try {
    const result = await execute(
      `
        UPDATE orders SET
          fraud_probability = LEAST(1.0, (
            0.05
            + CASE WHEN payment_method = 'crypto' THEN 0.25 ELSE 0 END
            + CASE WHEN ip_country != 'US' THEN 0.15 ELSE 0 END
            + CASE WHEN promo_used = TRUE THEN 0.08 ELSE 0 END
            + CASE WHEN order_total > 300 THEN 0.10 ELSE 0 END
          )),
          predicted_fraud = CASE
            WHEN (
              0.05
              + CASE WHEN payment_method = 'crypto' THEN 0.25 ELSE 0 END
              + CASE WHEN ip_country != 'US' THEN 0.15 ELSE 0 END
              + CASE WHEN promo_used = TRUE THEN 0.08 ELSE 0 END
              + CASE WHEN order_total > 300 THEN 0.10 ELSE 0 END
            ) >= 0.70 THEN TRUE
            ELSE FALSE
          END
      `
    );

    await execute(
      `
        INSERT INTO order_predictions (order_id, fraud_probability, predicted_fraud, model_version, prediction_timestamp)
        SELECT
          o.order_id,
          o.fraud_probability,
          o.predicted_fraud,
          'heuristic-v1',
          NOW()
        FROM orders o
        ON CONFLICT (order_id) DO UPDATE SET
          fraud_probability = EXCLUDED.fraud_probability,
          predicted_fraud = EXCLUDED.predicted_fraud,
          model_version = EXCLUDED.model_version,
          prediction_timestamp = EXCLUDED.prediction_timestamp
      `
    );

    const count = result.changes || 0;
    redirect(
      `/scoring?status=success&timestamp=${encodeURIComponent(timestamp)}&count=${count}&message=${encodeURIComponent("Scoring completed successfully.")}`
    );
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    const message = String(error?.message || "Scoring failed.").slice(0, 300);
    redirect(
      `/scoring?status=error&timestamp=${encodeURIComponent(timestamp)}&message=${encodeURIComponent(message)}`
    );
  }
}

export default async function ScoringPage({ searchParams }) {
  const status = String(searchParams?.status || "");
  const message = String(searchParams?.message || "");
  const count = String(searchParams?.count || "");
  const timestamp = String(searchParams?.timestamp || "");

  const summary = await selectOne(
    `
      SELECT COUNT(*) AS total_orders,
             SUM(CASE WHEN predicted_fraud = TRUE THEN 1 ELSE 0 END) AS predicted_fraud_count,
             SUM(CASE WHEN actual_fraud = TRUE THEN 1 ELSE 0 END) AS actual_fraud_count,
             AVG(fraud_probability) AS avg_probability
      FROM orders
    `
  );

  return (
    <section className="card">
      <h2>Run Scoring</h2>
      <p>
        Calculates <code>fraud_probability</code> for every order using heuristic rules
        (payment method, IP country, promo usage, order total) and sets <code>predicted_fraud</code> when
        the probability exceeds the threshold. Results are also written to <code>order_predictions</code>.
      </p>

      <form action={runScoringAction}>
        <button type="submit">Run Scoring</button>
      </form>

      {status ? (
        <div className="card" style={{ marginTop: "1rem" }}>
          <p>
            <strong>Status:</strong> {status}
          </p>
          <p>
            <strong>Orders scored:</strong> {count || "N/A"}
          </p>
          <p>
            <strong>Timestamp:</strong> {timestamp || "N/A"}
          </p>
          <p>
            <strong>Output:</strong> {message || "No output"}
          </p>
        </div>
      ) : null}

      <hr />
      <h3>Current Summary</h3>
      <p>Total Orders: {summary?.total_orders || 0}</p>
      <p>Predicted Fraud: {summary?.predicted_fraud_count || 0}</p>
      <p>Confirmed Actual Fraud: {summary?.actual_fraud_count || 0}</p>
      <p>Average Fraud Probability: {Number(summary?.avg_probability || 0).toFixed(4)}</p>
    </section>
  );
}
