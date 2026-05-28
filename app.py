"""
Flask Application - AI-Powered Crime Pattern Forecasting
& Suspect Prediction Framework
"""

import os
import json
import pandas as pd
import numpy as np
import joblib
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ── Load Models & Artifacts ─────────────────────────────────────────────
MODEL_DIR = "models"
DATA_PATH = "data/crime_dataset.csv"


def load_artifacts():
    """Load all trained models and preprocessing artifacts."""
    artifacts = {}
    try:
        artifacts["rf_model"] = joblib.load(os.path.join(MODEL_DIR, "random_forest.joblib"))
        artifacts["xgb_model"] = joblib.load(os.path.join(MODEL_DIR, "xgboost_model.joblib"))
        artifacts["dt_model"] = joblib.load(os.path.join(MODEL_DIR, "decision_tree.joblib"))
        artifacts["label_encoders"] = joblib.load(os.path.join(MODEL_DIR, "label_encoders.joblib"))
        artifacts["scaler"] = joblib.load(os.path.join(MODEL_DIR, "scaler.joblib"))
        artifacts["feature_cols"] = joblib.load(os.path.join(MODEL_DIR, "feature_cols.joblib"))

        with open(os.path.join(MODEL_DIR, "model_metrics.json"), "r") as f:
            artifacts["metrics"] = json.load(f)

        artifacts["dataset"] = pd.read_csv(DATA_PATH)
        print("All artifacts loaded successfully!")
    except Exception as e:
        print(f"Error loading artifacts: {e}")
        print("   Run generate_dataset.py and train_models.py first.")
    return artifacts


artifacts = load_artifacts()


# ── Helper Functions ────────────────────────────────────────────────────

def get_season(month):
    if month in [12, 1, 2]: return "Winter"
    elif month in [3, 4, 5]: return "Summer"
    elif month in [6, 7, 8]: return "Monsoon"
    else: return "Autumn"

def get_time_period(hour):
    if 0 <= hour < 6: return "Late Night"
    elif 6 <= hour < 12: return "Morning"
    elif 12 <= hour < 18: return "Afternoon"
    else: return "Evening"


# ── Routes ──────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main dashboard."""
    return render_template("index.html")


@app.route("/api/stats")
def get_stats():
    """Get overall crime statistics."""
    df = artifacts.get("dataset")
    if df is None:
        return jsonify({"error": "Dataset not loaded"}), 500

    metrics = artifacts.get("metrics", {})
    best_accuracy = max(
        metrics.get("Random Forest", {}).get("accuracy", 0),
        metrics.get("XGBoost", {}).get("accuracy", 0),
        metrics.get("Decision Tree", {}).get("accuracy", 0),
    )

    stats = {
        "total_crimes": len(df),
        "crime_types": df["crime_type"].nunique(),
        "areas_covered": df["area"].nunique(),
        "arrest_rate": round(
            (df["arrest_made"] == "Yes").sum() / len(df) * 100, 1
        ),
        "high_risk_pct": round(
            (df["risk_level"] == "High Risk").sum() / len(df) * 100, 1
        ),
        "best_model_accuracy": round(best_accuracy * 100, 1),
        "date_range": f"{df['date'].min()} to {df['date'].max()}",
        "total_areas": df["area"].nunique(),
    }
    return jsonify(stats)


@app.route("/api/heatmap")
def get_heatmap():
    """Get crime location data for heatmap visualization."""
    df = artifacts.get("dataset")
    if df is None:
        return jsonify({"error": "Dataset not loaded"}), 500

    # Sample for performance
    sample = df.sample(min(2000, len(df)), random_state=42)
    points = []
    for _, row in sample.iterrows():
        intensity = {"Low": 0.3, "Medium": 0.6, "High": 1.0}.get(row["severity"], 0.5)
        points.append({
            "lat": row["latitude"],
            "lon": row["longitude"],
            "intensity": intensity,
            "crime_type": row["crime_type"],
            "area": row["area"],
            "severity": row["severity"],
        })
    return jsonify(points)


@app.route("/api/temporal")
def get_temporal():
    """Get temporal distribution data."""
    df = artifacts.get("dataset")
    if df is None:
        return jsonify({"error": "Dataset not loaded"}), 500

    # Hourly distribution
    hourly = df.groupby("hour").size().reindex(range(24), fill_value=0).tolist()

    # Daily distribution
    day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    daily = df.groupby("day_of_week").size().reindex(day_order, fill_value=0).tolist()

    # Monthly distribution
    monthly = df.groupby("month").size().reindex(range(1, 13), fill_value=0).tolist()

    # Crime type distribution
    crime_dist = df["crime_type"].value_counts().to_dict()

    # Severity distribution
    severity_dist = df["severity"].value_counts().to_dict()

    # Area-wise crime count
    area_dist = df["area"].value_counts().to_dict()

    return jsonify({
        "hourly": hourly,
        "daily": daily,
        "daily_labels": day_order,
        "monthly": monthly,
        "crime_types": crime_dist,
        "severity": severity_dist,
        "areas": area_dist,
    })


@app.route("/api/crime-trends")
def get_crime_trends():
    """Get crime trends over time."""
    df = artifacts.get("dataset")
    if df is None:
        return jsonify({"error": "Dataset not loaded"}), 500

    df["date_parsed"] = pd.to_datetime(df["date"])
    df["year_month"] = df["date_parsed"].dt.to_period("M").astype(str)

    trends = df.groupby("year_month").size().to_dict()

    # Crime type trends by year
    df["year"] = df["date_parsed"].dt.year
    yearly_types = df.groupby(["year", "crime_type"]).size().unstack(fill_value=0)
    yearly_types_dict = {
        str(year): row.to_dict() for year, row in yearly_types.iterrows()
    }

    return jsonify({
        "monthly_trends": trends,
        "yearly_by_type": yearly_types_dict,
    })


@app.route("/api/model-performance")
def get_model_performance():
    """Get model comparison metrics."""
    metrics = artifacts.get("metrics", {})
    return jsonify(metrics)


@app.route("/api/predict", methods=["POST"])
def predict_crime():
    """Predict crime risk level for given inputs."""
    try:
        data = request.json
        le = artifacts["label_encoders"]
        scaler = artifacts["scaler"]

        # Parse inputs
        crime_type = data.get("crime_type", "Theft")
        area = data.get("area", "T. Nagar")
        hour = int(data.get("hour", 12))
        month = int(data.get("month", 1))
        day_of_week = data.get("day_of_week", "Monday")
        suspect_age = data.get("suspect_age_group", "26-35")
        suspect_gender = data.get("suspect_gender", "Male")
        prior_record = data.get("suspect_prior_record", "No")
        weapon = data.get("weapon_used", "None")

        severity_map = {
            "Theft": "Low", "Vandalism": "Low", "Fraud": "Medium",
            "Burglary": "Medium", "Drug Offense": "Medium", "Cybercrime": "Medium",
            "Assault": "High", "Robbery": "High", "Kidnapping": "High", "Homicide": "High",
        }
        severity = severity_map.get(crime_type, "Medium")
        season = get_season(month)
        time_period = get_time_period(hour)
        is_weekend = 1 if day_of_week in ["Saturday", "Sunday"] else 0
        is_night = 1 if (hour >= 20 or hour <= 5) else 0

        # Encode
        areas_info = {
            "T. Nagar": (13.0418, 80.2341), "Anna Nagar": (13.0850, 80.2101),
            "Adyar": (13.0012, 80.2565), "Velachery": (12.9815, 80.2180),
            "Tambaram": (12.9249, 80.1000), "Guindy": (13.0067, 80.2206),
            "Mylapore": (13.0368, 80.2676), "Egmore": (13.0732, 80.2609),
            "Chromepet": (12.9516, 80.1462), "Porur": (13.0382, 80.1565),
            "Mamallapuram": (12.6269, 80.1927), "Sholinganallur": (12.9010, 80.2279),
        }
        lat, lon = areas_info.get(area, (13.0, 80.2))

        feature_vector = [
            le["crime_type"].transform([crime_type])[0],
            month,
            hour,
            lat,
            lon,
            le["day_of_week"].transform([day_of_week])[0],
            le["area"].transform([area])[0],
            le["severity"].transform([severity])[0],
            le["suspect_age_group"].transform([suspect_age])[0],
            le["suspect_gender"].transform([suspect_gender])[0],
            le["suspect_prior_record"].transform([prior_record])[0],
            le["weapon_used"].transform([weapon])[0],
            is_weekend,
            is_night,
            le["season"].transform([season])[0],
            le["time_period"].transform([time_period])[0],
        ]

        X = scaler.transform([feature_vector])

        # Predict with all models
        predictions = {}
        for name, model_key in [
            ("Random Forest", "rf_model"),
            ("XGBoost", "xgb_model"),
            ("Decision Tree", "dt_model"),
        ]:
            model = artifacts[model_key]
            pred = model.predict(X)[0]
            pred_label = le["risk_level"].inverse_transform([pred])[0]

            proba = model.predict_proba(X)[0]
            class_labels = le["risk_level"].classes_
            probabilities = {
                class_labels[i]: round(float(proba[i]) * 100, 2)
                for i in range(len(class_labels))
            }

            predictions[name] = {
                "prediction": pred_label,
                "probabilities": probabilities,
            }

        return jsonify({
            "success": True,
            "predictions": predictions,
            "input_summary": {
                "crime_type": crime_type,
                "area": area,
                "hour": hour,
                "day_of_week": day_of_week,
                "severity": severity,
            },
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/suspect", methods=["POST"])
def predict_suspect():
    """Generate suspect profile prediction based on crime parameters."""
    try:
        data = request.json
        df = artifacts["dataset"]

        crime_type = data.get("crime_type", "Theft")
        area = data.get("area", "T. Nagar")
        hour = int(data.get("hour", 12))

        # Filter similar crimes
        similar = df[df["crime_type"] == crime_type]
        if len(similar) > 50:
            area_crimes = similar[similar["area"] == area]
            if len(area_crimes) > 20:
                similar = area_crimes

        # Time window match (+/- 3 hours)
        time_match = similar[
            (similar["hour"] >= max(0, hour - 3)) &
            (similar["hour"] <= min(23, hour + 3))
        ]
        if len(time_match) > 20:
            similar = time_match

        # Compute suspect profile probabilities
        total = len(similar) if len(similar) > 0 else 1

        age_dist = similar["suspect_age_group"].value_counts(normalize=True).to_dict()
        gender_dist = similar["suspect_gender"].value_counts(normalize=True).to_dict()
        prior_dist = similar["suspect_prior_record"].value_counts(normalize=True).to_dict()
        weapon_dist = similar["weapon_used"].value_counts(normalize=True).to_dict()
        arrest_dist = similar["arrest_made"].value_counts(normalize=True).to_dict()

        # Most likely profile
        most_likely_age = max(age_dist, key=age_dist.get) if age_dist else "Unknown"
        most_likely_gender = max(gender_dist, key=gender_dist.get) if gender_dist else "Unknown"
        has_prior = prior_dist.get("Yes", 0)

        # Risk assessment
        risk_factors = []
        if hour >= 20 or hour <= 5:
            risk_factors.append("Nighttime incident - higher risk")
        if has_prior > 0.5:
            risk_factors.append("Likely suspect with prior record")
        if crime_type in ["Robbery", "Assault", "Homicide", "Kidnapping"]:
            risk_factors.append("Violent crime category")

        suspect_score = min(100, int(
            (has_prior * 30) +
            (1 if hour >= 20 or hour <= 5 else 0) * 20 +
            (1 if crime_type in ["Robbery", "Assault", "Homicide"] else 0) * 25 +
            np.random.randint(10, 30)
        ))

        return jsonify({
            "success": True,
            "suspect_profile": {
                "most_likely_age_group": most_likely_age,
                "most_likely_gender": most_likely_gender,
                "prior_record_likelihood": round(has_prior * 100, 1),
                "suspect_match_score": suspect_score,
                "age_distribution": {k: round(v * 100, 1) for k, v in age_dist.items()},
                "gender_distribution": {k: round(v * 100, 1) for k, v in gender_dist.items()},
                "weapon_distribution": {k: round(v * 100, 1) for k, v in weapon_dist.items()},
                "arrest_likelihood": round(arrest_dist.get("Yes", 0) * 100, 1),
            },
            "risk_factors": risk_factors,
            "similar_cases_analyzed": total,
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
