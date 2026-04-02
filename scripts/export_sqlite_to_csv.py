#!/usr/bin/env python3
"""Export SQLite tables from shop.db to CSV files for Supabase import."""

from __future__ import annotations

import csv
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "shop.db"
OUT_DIR = ROOT / "exports" / "supabase_csv"

TABLES = [
    "customers",
    "products",
    "orders",
    "order_items",
    "shipments",
    "product_reviews",
]

BOOLEAN_COLUMNS = {
    "customers": {"is_active"},
    "products": {"is_active"},
    "orders": {"promo_used", "is_fraud"},
    "shipments": {"late_delivery"},
}


def normalize_value(table: str, column: str, value):
    if value is None:
        return ""
    if column in BOOLEAN_COLUMNS.get(table, set()):
        return "true" if int(value) != 0 else "false"
    return value


def export_table(conn: sqlite3.Connection, table: str) -> int:
    cursor = conn.execute(f"SELECT * FROM {table}")
    columns = [desc[0] for desc in cursor.description]
    out_path = OUT_DIR / f"{table}.csv"

    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(columns)
        row_count = 0
        for row in cursor:
            writer.writerow(
                [normalize_value(table, columns[idx], row[idx]) for idx in range(len(columns))]
            )
            row_count += 1

    return row_count


def main() -> None:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Missing SQLite database: {DB_PATH}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DB_PATH) as conn:
        for table in TABLES:
            count = export_table(conn, table)
            print(f"Exported {table}: {count} rows -> {OUT_DIR / (table + '.csv')}")


if __name__ == "__main__":
    main()
