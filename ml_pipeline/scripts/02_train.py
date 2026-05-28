"""
Enterprise ML Training Pipeline with SHAP Explainability.
"""

import os
import json
import joblib
import sqlite3
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import shap

# Config
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "crimes.db")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def fetch_data():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM crimes", conn)
    conn.close()
    return df

def feature_engineering(df):
    def safe_int(x):
        if isinstance(x, bytes): return int.from_bytes(x, "little")
        return int(x)
    df["hour"] = df["hour"].apply(safe_int)
    df["month"] = df["month"].apply(safe_int)
    df["is_weekend"] = df["day_of_week"].isin(["Saturday", "Sunday"]).astype(int)
    df["is_night"] = ((df["hour"] >= 20) | (df["hour"] <= 5)).astype(int)

    def get_season(month):
        if month in [12, 1, 2]: return "Winter"
        elif month in [3, 4, 5]: return "Summer"
        elif month in [6, 7, 8]: return "Monsoon"
        else: return "Autumn"

    df["season"] = df["month"].apply(get_season)

    def hour_bin(h):
        if 0 <= h < 6: return "Late Night"
        elif 6 <= h < 12: return "Morning"
        elif 12 <= h < 18: return "Afternoon"
        else: return "Evening"

    df["time_period"] = df["hour"].apply(hour_bin)
    return df

def train_pipeline():
    print("🚀 Starting Enterprise ML Pipeline...")
    df = fetch_data()
    df = feature_engineering(df)

    cat_cols = [
        "crime_type", "day_of_week", "area", "severity",
        "suspect_age_group", "suspect_gender", "suspect_prior_record",
        "weapon_used", "season", "time_period"
    ]
    
    encoders = {}
    for col in cat_cols:
        le = LabelEncoder()
        df[col + "_encoded"] = le.fit_transform(df[col])
        encoders[col] = le

    target_le = LabelEncoder()
    df["risk_level_encoded"] = target_le.fit_transform(df["risk_level"])
    encoders["risk_level"] = target_le

    feature_cols = [
        "crime_type_encoded", "month", "hour", "latitude", "longitude",
        "day_of_week_encoded", "area_encoded", "severity_encoded",
        "suspect_age_group_encoded", "suspect_gender_encoded",
        "suspect_prior_record_encoded", "weapon_used_encoded",
        "is_weekend", "is_night", "season_encoded", "time_period_encoded"
    ]

    X = df[feature_cols].values
    y = df["risk_level_encoded"].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    joblib.dump(encoders, os.path.join(ARTIFACTS_DIR, "encoders.joblib"))
    joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, "scaler.joblib"))
    joblib.dump(feature_cols, os.path.join(ARTIFACTS_DIR, "feature_cols.joblib"))

    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
    
    # SMOTE
    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)

    target_names = list(target_le.classes_)
    metrics = {}

    # 1. Random Forest
    print("🌲 Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42, n_jobs=-1, class_weight="balanced")
    rf.fit(X_train_bal, y_train_bal)
    rf_pred = rf.predict(X_test)
    joblib.dump(rf, os.path.join(ARTIFACTS_DIR, "rf_model.joblib"))

    metrics["Random Forest"] = {
        "accuracy": accuracy_score(y_test, rf_pred),
        "precision": precision_score(y_test, rf_pred, average="weighted", zero_division=0),
        "recall": recall_score(y_test, rf_pred, average="weighted", zero_division=0),
        "f1_score": f1_score(y_test, rf_pred, average="weighted", zero_division=0),
        "confusion_matrix": confusion_matrix(y_test, rf_pred).tolist(),
    }

    # 2. XGBoost
    print("⚡ Training XGBoost...")
    xgb = XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1)
    xgb.fit(X_train_bal, y_train_bal)
    xgb_pred = xgb.predict(X_test)
    joblib.dump(xgb, os.path.join(ARTIFACTS_DIR, "xgb_model.joblib"))

    metrics["XGBoost"] = {
        "accuracy": accuracy_score(y_test, xgb_pred),
        "precision": precision_score(y_test, xgb_pred, average="weighted", zero_division=0),
        "recall": recall_score(y_test, xgb_pred, average="weighted", zero_division=0),
        "f1_score": f1_score(y_test, xgb_pred, average="weighted", zero_division=0),
        "confusion_matrix": confusion_matrix(y_test, xgb_pred).tolist(),
    }

    # Generate Feature Importance JSON
    importances = rf.feature_importances_
    fi = sorted(zip(feature_cols, importances.tolist()), key=lambda x: x[1], reverse=True)
    metrics["feature_importance"] = [{"feature": f.replace("_encoded", ""), "importance": round(v, 4)} for f, v in fi]

    with open(os.path.join(ARTIFACTS_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print("✅ ML Pipeline Complete. Models & Metrics Saved.")

if __name__ == "__main__":
    train_pipeline()
