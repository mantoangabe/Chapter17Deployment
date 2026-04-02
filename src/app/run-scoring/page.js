import { execute, selectOne } from "@/lib/db";

async function runScoringAction() {
  "use server";

  const result = await execute(
    `
      UPDATE orders
      SET risk_score = ROUND(
        LEAST(
          100,
          5
          + CASE WHEN payment_method = 'crypto' THEN 25 ELSE 0 END
          + CASE WHEN ip_country != 'US' THEN 15 ELSE 0 END
          + CASE WHEN promo_used = TRUE THEN 8 ELSE 0 END
          + CASE WHEN order_total > 300 THEN 10 ELSE 0 END
        ),
        1
      ),
      is_fraud = CASE
        WHEN (
          5
          + CASE WHEN payment_method = 'crypto' THEN 25 ELSE 0 END
          + CASE WHEN ip_country != 'US' THEN 15 ELSE 0 END
          + CASE WHEN promo_used = TRUE THEN 8 ELSE 0 END
          + CASE WHEN order_total > 300 THEN 10 ELSE 0 END
        ) >= 70 THEN TRUE
        ELSE FALSE
      END
    `
  );

  return { updated: result.changes };
}

export default async function RunScoringPage() {
  const summary = await selectOne(
    `
      SELECT COUNT(*) AS total_orders,
             SUM(CASE WHEN is_fraud = TRUE THEN 1 ELSE 0 END) AS fraud_flags,
             AVG(risk_score) AS avg_risk
      FROM orders
    `
  );

  return (
    <section className="card">
      <h2>Run Scoring</h2>
      <p>Recalculate risk and fraud labels for all orders in Supabase Postgres.</p>

      <form
        action={async () => {
          "use server";
          await runScoringAction();
        }}
      >
        <button type="submit">Run Scoring Now</button>
      </form>

      <hr />
      <p>Total Orders: {summary.total_orders || 0}</p>
      <p>Flagged as Fraud: {summary.fraud_flags || 0}</p>
      <p>Average Risk: {Number(summary.avg_risk || 0).toFixed(1)}</p>
    </section>
  );
}
