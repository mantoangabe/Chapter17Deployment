#!/usr/bin/env python3
"""
Batch trainer for the fraud model (optional helper).

The full CRISP-DM narrative, EDA, model comparison, tuning, and deployment demo
live in `fraud_pipeline.ipynb`. This script retrains a single strong pipeline and
writes `models/fraud_model.joblib` for automation or quick refreshes.

Usage (from project root):
    python train_fraud_model.py
"""

from __future__ import annotations

import sqlite3
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=RuntimeWarning)

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "shop.db"
MODEL_PATH = ROOT / "models" / "fraud_model.joblib"


def load_modeling_frame() -> pd.DataFrame:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Missing {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    orders = pd.read_sql("SELECT * FROM orders", conn)
    customers = pd.read_sql("SELECT * FROM customers", conn)
    items = pd.read_sql("SELECT * FROM order_items", conn)
    item_agg = (
        items.groupby("order_id")
        .agg(
            n_line_items=("order_item_id", "count"),
            total_units=("quantity", "sum"),
            max_line_total=("line_total", "max"),
            avg_unit_price=("unit_price", "mean"),
            line_total_sum=("line_total", "sum"),
        )
        .reset_index()
    )
    cat_agg = pd.read_sql(
        """
        SELECT oi.order_id, COUNT(DISTINCT p.category) AS n_distinct_categories
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        GROUP BY oi.order_id
        """,
        conn,
    )
    conn.close()

    df = orders.merge(customers, on="customer_id", how="left")
    df = df.merge(item_agg, on="order_id", how="left")
    df = df.merge(cat_agg, on="order_id", how="left")
    for c in [
        "n_line_items",
        "total_units",
        "max_line_total",
        "avg_unit_price",
        "line_total_sum",
        "n_distinct_categories",
    ]:
        if c in df.columns:
            df[c] = df[c].fillna(0)

    drop_cols = []
    for leak_col in ["risk_score", "predicted_fraud", "fraud_probability"]:
        if leak_col in df.columns:
            drop_cols.append(leak_col)
    if "order_id" in df.columns:
        drop_cols.append("order_id")
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])

    df["order_datetime"] = pd.to_datetime(df["order_datetime"], errors="coerce")
    if "created_at" in df.columns:
        df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")

    df = df.sort_values(["customer_id", "order_datetime"]).reset_index(drop=True)
    df["order_hour"] = df["order_datetime"].dt.hour
    df["order_dow"] = df["order_datetime"].dt.dayofweek
    df["order_month"] = df["order_datetime"].dt.month
    df["is_weekend"] = df["order_dow"].isin([5, 6]).astype(int)
    if "created_at" in df.columns:
        df["customer_tenure_days"] = (df["order_datetime"] - df["created_at"]).dt.days.clip(lower=0)
    else:
        df["customer_tenure_days"] = np.nan

    eps = 1e-6
    df["shipping_to_subtotal"] = df["shipping_fee"] / (df["order_subtotal"].abs() + eps)
    df["tax_to_subtotal"] = df["tax_amount"] / (df["order_subtotal"].abs() + eps)
    df["subtotal_to_total"] = df["order_subtotal"] / (df["order_total"].abs() + eps)
    if {"billing_zip", "shipping_zip"}.issubset(df.columns):
        df["zip_mismatch"] = (df["billing_zip"].fillna("") != df["shipping_zip"].fillna("")).astype(int)
    else:
        df["zip_mismatch"] = 0
    df["prior_order_count"] = df.groupby("customer_id").cumcount()
    df["prior_total_spend"] = df.groupby("customer_id")["order_total"].cumsum() - df["order_total"]
    if {"line_total_sum", "order_subtotal"}.issubset(df.columns):
        df["line_vs_subtotal_diff"] = df["line_total_sum"] - df["order_subtotal"]
    else:
        df["line_vs_subtotal_diff"] = np.nan

    if "customer_id" in df.columns:
        df = df.drop(columns=["customer_id"])
    return df


def main() -> None:
    df = load_modeling_frame()
    y = df["actual_fraud"].astype(int)
    drop_x = [
        "actual_fraud",
        "order_datetime",
        "full_name",
        "email",
        "birthdate",
        "created_at",
        "promo_code",
    ]
    X = df.drop(columns=[c for c in drop_x if c in df.columns], errors="ignore")

    numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = [c for c in X.columns if c not in numeric_features]

    X_train, _, y_train, _ = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    def make_preprocessor(num_cols, cat_cols):
        return ColumnTransformer(
            transformers=[
                (
                    "num",
                    Pipeline(
                        [
                            ("imputer", SimpleImputer(strategy="median")),
                            ("scaler", StandardScaler()),
                        ]
                    ),
                    num_cols,
                ),
                (
                    "cat",
                    Pipeline(
                        [
                            ("imputer", SimpleImputer(strategy="most_frequent")),
                            (
                                "onehot",
                                OneHotEncoder(
                                    handle_unknown="ignore",
                                    sparse_output=False,
                                    max_categories=25,
                                ),
                            ),
                        ]
                    ),
                    cat_cols,
                ),
            ]
        )

    pipe = Pipeline(
        [
            ("prep", make_preprocessor(numeric_features, categorical_features)),
            (
                "clf",
                HistGradientBoostingClassifier(
                    random_state=42,
                    class_weight="balanced",
                    max_depth=12,
                    learning_rate=0.08,
                    max_iter=200,
                ),
            ),
        ]
    )
    pipe.fit(X_train, y_train)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, MODEL_PATH)
    print(f"Saved pipeline to {MODEL_PATH.resolve()}")


if __name__ == "__main__":
    main()
