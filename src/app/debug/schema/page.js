import { getDb, select } from "@/lib/db";

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

export const dynamic = "force-dynamic";

export default function DebugSchemaPage() {
  const db = getDb();
  if (process.env.NODE_ENV !== "development") {
    return (
      <section className="card">
        <h2>Debug Schema</h2>
        <p>This page is available only in development mode.</p>
      </section>
    );
  }

  const tables = select(
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      ORDER BY name
    `
  );

  return (
    <section className="card">
      <h2>Debug Schema</h2>
      <p>Current schema from <code>shop.db</code>.</p>

      {tables.map((table) => {
        const tableName = table.name;
        const columns = db.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`).all();

        return (
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
        );
      })}
    </section>
  );
}
