"""
ML Training Pipeline
Trains Random Forest, XGBoost, and Decision Tree models
for crime risk level prediction and suspect pattern analysis.
"""

import pandas as pd
import numpy as np
import json
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE

# Paths
DATA_PATH = "data/crime_dataset.csv"
MODEL_DIR = "models"

os.makedirs(MODEL_DIR, exist_ok=True)


def load_and_preprocess():
    """Load dataset and perform preprocessing."""
    print("📂 Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"   Loaded {len(df)} records with {len(df.columns)} features")

    # ── Feature Engineering ─────────────────────────────────────────
    # Time-based features
    df["is_weekend"] = df["day_of_week"].isin(["Saturday", "Sunday"]).astype(int)
    df["is_night"] = ((df["hour"] >= 20) | (df["hour"] <= 5)).astype(int)

    # Season
    def get_season(month):
        if month in [12, 1, 2]:
            return "Winter"
        elif month in [3, 4, 5]:
            return "Summer"
        elif month in [6, 7, 8]:
            return "Monsoon"
        else:
            return "Autumn"

    df["season"] = df["month"].apply(get_season)

    # Hour bins
    def hour_bin(h):
        if 0 <= h < 6:
            return "Late Night"
        elif 6 <= h < 12:
            return "Morning"
        elif 12 <= h < 18:
            return "Afternoon"
        else:
            return "Evening"

    df["time_period"] = df["hour"].apply(hour_bin)

    return df


def encode_features(df):
    """Encode categorical features and prepare for modeling."""
    print("🔄 Encoding features...")

    # Features to encode
    categorical_cols = [
        "crime_type", "day_of_week", "area", "severity",
        "suspect_age_group", "suspect_gender", "suspect_prior_record",
        "weapon_used", "season", "time_period"
    ]

    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        df[col + "_encoded"] = le.fit_transform(df[col])
        label_encoders[col] = le

    # Target variable
    target_le = LabelEncoder()
    df["risk_level_encoded"] = target_le.fit_transform(df["risk_level"])
    label_encoders["risk_level"] = target_le

    # Feature columns
    feature_cols = [
        "crime_type_encoded", "month", "hour", "latitude", "longitude",
        "day_of_week_encoded", "area_encoded", "severity_encoded",
        "suspect_age_group_encoded", "suspect_gender_encoded",
        "suspect_prior_record_encoded", "weapon_used_encoded",
        "is_weekend", "is_night", "season_encoded", "time_period_encoded"
    ]

    X = df[feature_cols].values
    y = df["risk_level_encoded"].values

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Save encoders and scaler
    joblib.dump(label_encoders, os.path.join(MODEL_DIR, "label_encoders.joblib"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.joblib"))
    joblib.dump(feature_cols, os.path.join(MODEL_DIR, "feature_cols.joblib"))

    print(f"   Features: {len(feature_cols)}")
    print(f"   Classes: {list(target_le.classes_)}")

    return X_scaled, y, label_encoders, scaler, feature_cols


def train_and_evaluate(X_train, X_test, y_train, y_test, label_encoders):
    """Train all models and evaluate performance."""
    print("\n" + "=" * 60)
    print("🤖 TRAINING MODELS")
    print("=" * 60)

    target_names = list(label_encoders["risk_level"].classes_)
    results = {}

    # ── 1. Random Forest ────────────────────────────────────────────
    print("\n🌲 Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=200, max_depth=15, random_state=42,
        n_jobs=-1, class_weight="balanced"
    )
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    rf_metrics = compute_metrics(y_test, rf_pred, "Random Forest", target_names)
    results["Random Forest"] = rf_metrics
    joblib.dump(rf_model, os.path.join(MODEL_DIR, "random_forest.joblib"))
    print(f"   ✅ Accuracy: {rf_metrics['accuracy']:.4f}")

    # ── 2. XGBoost ──────────────────────────────────────────────────
    print("\n⚡ Training XGBoost...")
    xgb_model = XGBClassifier(
        n_estimators=200, max_depth=6, learning_rate=0.1,
        random_state=42, use_label_encoder=False,
        eval_metric="mlogloss", n_jobs=-1
    )
    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)
    xgb_metrics = compute_metrics(y_test, xgb_pred, "XGBoost", target_names)
    results["XGBoost"] = xgb_metrics
    joblib.dump(xgb_model, os.path.join(MODEL_DIR, "xgboost_model.joblib"))
    print(f"   ✅ Accuracy: {xgb_metrics['accuracy']:.4f}")

    # ── 3. Decision Tree ────────────────────────────────────────────
    print("\n🌳 Training Decision Tree...")
    dt_model = DecisionTreeClassifier(
        max_depth=10, criterion="gini", random_state=42,
        class_weight="balanced"
    )
    dt_model.fit(X_train, y_train)
    dt_pred = dt_model.predict(X_test)
    dt_metrics = compute_metrics(y_test, dt_pred, "Decision Tree", target_names)
    results["Decision Tree"] = dt_metrics
    joblib.dump(dt_model, os.path.join(MODEL_DIR, "decision_tree.joblib"))
    print(f"   ✅ Accuracy: {dt_metrics['accuracy']:.4f}")

    # ── Feature Importance (from Random Forest) ─────────────────────
    feature_cols = joblib.load(os.path.join(MODEL_DIR, "feature_cols.joblib"))
    importances = rf_model.feature_importances_
    feature_importance = sorted(
        zip(feature_cols, importances.tolist()),
        key=lambda x: x[1], reverse=True
    )
    results["feature_importance"] = [
        {"feature": f.replace("_encoded", ""), "importance": round(v, 4)}
        for f, v in feature_importance
    ]

    # Save results
    with open(os.path.join(MODEL_DIR, "model_metrics.json"), "w") as f:
        json.dump(results, f, indent=2)

    print("\n" + "=" * 60)
    print("✅ ALL MODELS TRAINED AND SAVED")
    print("=" * 60)

    return results


def compute_metrics(y_true, y_pred, model_name, target_names):
    """Compute evaluation metrics for a model."""
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,
        "target_names": target_names,
    }


def main():
    # Load and preprocess
    df = load_and_preprocess()

    # Encode features
    X, y, label_encoders, scaler, feature_cols = encode_features(df)

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n📊 Data Split:")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Testing samples:  {len(X_test)}")

    # Apply SMOTE for class balance
    print("\n⚖️  Applying SMOTE for class balance...")
    smote = SMOTE(random_state=42)
    X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)
    print(f"   Balanced training samples: {len(X_train_balanced)}")

    # Train and evaluate
    results = train_and_evaluate(X_train_balanced, X_test, y_train_balanced, y_test, label_encoders)

    # Print summary
    print("\n" + "=" * 60)
    print("📋 MODEL COMPARISON SUMMARY")
    print("=" * 60)
    print(f"{'Model':<20} {'Accuracy':<12} {'Precision':<12} {'Recall':<12} {'F1-Score':<12}")
    print("-" * 68)
    for model_name in ["Random Forest", "XGBoost", "Decision Tree"]:
        m = results[model_name]
        print(f"{model_name:<20} {m['accuracy']:<12.4f} {m['precision']:<12.4f} {m['recall']:<12.4f} {m['f1_score']:<12.4f}")


if __name__ == "__main__":
    main()
