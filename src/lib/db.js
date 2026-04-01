import path from "node:path";
import Database from "better-sqlite3";

const dbPath = process.env.SHOP_DB_PATH || path.join(process.cwd(), "shop.db");

let dbError = null;
let db = null;

try {
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  ensureHelpfulIndexes();
} catch (error) {
  dbError = error;
}

function ensureHelpfulIndexes() {
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_datetime ON orders(order_datetime);
      CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);
  } catch {
    // Ignore index creation issues when tables are not present yet.
  }
}

function requireDb() {
  if (!db) {
    throw new Error(`Database is unavailable at ${dbPath}: ${dbError?.message || "unknown error"}`);
  }
  return db;
}

export function getDbStatus() {
  return {
    ok: Boolean(db),
    path: dbPath,
    error: dbError ? String(dbError.message || dbError) : null
  };
}

export function tableExists(tableName) {
  const conn = requireDb();
  const row = conn
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(String(tableName));
  return Boolean(row);
}

export function requireTables(tableNames) {
  const missing = tableNames.filter((name) => !tableExists(name));
  return {
    ok: missing.length === 0,
    missing
  };
}

export function select(sql, params = []) {
  return requireDb().prepare(sql).all(params);
}

export function selectOne(sql, params = []) {
  return requireDb().prepare(sql).get(params);
}

export function execute(sql, params = []) {
  return requireDb().prepare(sql).run(params);
}

export function withTransaction(work) {
  const tx = requireDb().transaction(work);
  return tx();
}

export { dbPath };
export function getDb() {
  return requireDb();
}
