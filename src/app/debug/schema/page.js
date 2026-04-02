import { select } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DebugSchemaPage() {
  if (process.env.NODE_ENV !== "development") {
    return (
      <section className="card">
        <h2>Debug Schema</h2>
        <p>This page is available only in development mode.</p>
      </section>
    );
  }

  const tables = await select(
    `
      SELECT table_name AS name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
  );
  const tableDetails = await Promise.all(
    tables.map(async (table) => {
      const tableName = table.name;
      const columns = await select(
        `
          SELECT column_name AS name, data_type AS type
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ?
          ORDER BY ordinal_position
        `,
        [tableName]
      );
      return { tableName, columns };
    })
  );

  return (
    <section className="card">
      <h2>Debug Schema</h2>
      <p>Current schema from Postgres (Supabase).</p>

      {tableDetails.map(({ tableName, columns }) => (
        <article key={tableName} className="card">
          <h3>{tableName}</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={`${tableName}-${col.name}`}>
                  <td>{col.name}</td>
                  <td>{col.type || "(none)"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ))}
    </section>
  );
}
