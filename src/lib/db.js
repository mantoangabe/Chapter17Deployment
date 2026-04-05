import { Pool, types } from "pg";

// Keep date/time columns as strings from the wire format. Default pg parsers use JS Date,
// which breaks React rendering (error #31) and can confuse RSC serialization.
const timeOids = types.builtins
  ? [types.builtins.TIMESTAMP, types.builtins.TIMESTAMPTZ, types.builtins.DATE]
  : [1114, 1184, 1082];
for (const oid of timeOids) {
  if (oid != null) types.setTypeParser(oid, (str) => str);
}

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || "";

const pool = dbUrl
  ? new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    })
  : null;

function ensurePool() {
  if (!pool) {
    throw new Error("Database is unavailable: set SUPABASE_DB_URL (or DATABASE_URL).");
  }
  return pool;
}

function toPgParams(sql, params = []) {
  let index = 0;
  const text = String(sql).replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
  return { text, values: params };
}

async function queryWith(clientOrPool, sql, params = []) {
  const { text, values } = toPgParams(sql, params);
  return clientOrPool.query(text, values);
}

/** Defense in depth: convert any Date values (React cannot render Date — error #31). */
function serializeRow(row) {
  if (!row || typeof row !== "object") return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      out[key] = Number.isNaN(value.getTime()) ? null : value.toISOString();
    } else {
      out[key] = value;
    }
  }
  return out;
}

function serializeRows(rows) {
  return rows.map((r) => serializeRow(r));
}

export function getDbStatus() {
  return {
    ok: Boolean(pool),
    path: "SUPABASE_DB_URL",
    error: pool ? null : "Missing SUPABASE_DB_URL (or DATABASE_URL)."
  };
}

export async function tableExists(tableName) {
  const conn = ensurePool();
  const result = await queryWith(
    conn,
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ?
      ) AS exists
    `,
    [String(tableName)]
  );
  return Boolean(result.rows[0]?.exists);
}

export async function requireTables(tableNames) {
  const checks = await Promise.all(tableNames.map((name) => tableExists(name)));
  const missing = tableNames.filter((_, idx) => !checks[idx]);
  return { ok: missing.length === 0, missing };
}

export async function select(sql, params = []) {
  const conn = ensurePool();
  const result = await queryWith(conn, sql, params);
  return serializeRows(result.rows);
}

export async function selectOne(sql, params = []) {
  const rows = await select(sql, params);
  return rows[0] || null;
}

export async function execute(sql, params = []) {
  const conn = ensurePool();
  const result = await queryWith(conn, sql, params);
  return { changes: result.rowCount || 0 };
}

export async function withTransaction(work) {
  const conn = ensurePool();
  const client = await conn.connect();
  try {
    await client.query("BEGIN");
    const tx = {
      select: async (sql, params = []) => serializeRows((await queryWith(client, sql, params)).rows),
      selectOne: async (sql, params = []) => {
        const row = (await queryWith(client, sql, params)).rows[0];
        return row ? serializeRow(row) : null;
      },
      execute: async (sql, params = []) => {
        const result = await queryWith(client, sql, params);
        return { changes: result.rowCount || 0 };
      }
    };
    const result = await work(tx);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
