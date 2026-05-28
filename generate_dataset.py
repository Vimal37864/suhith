"""
Synthetic Crime Dataset Generator
Generates realistic crime data centered around Chennai, India
for the AI-Powered Crime Pattern Forecasting & Suspect Prediction Framework.
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

np.random.seed(42)

# Configuration
NUM_RECORDS = 10000
OUTPUT_DIR = "data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "crime_dataset.csv")

# ── Crime Types with realistic weights ──────────────────────────────────
CRIME_TYPES = {
    "Theft": 0.25,
    "Assault": 0.15,
    "Burglary": 0.14,
    "Robbery": 0.10,
    "Fraud": 0.10,
    "Vandalism": 0.08,
    "Drug Offense": 0.08,
    "Kidnapping": 0.04,
    "Cybercrime": 0.04,
    "Homicide": 0.02,
}

# ── Chennai Area Zones with lat/lon centers ─────────────────────────────
AREAS = {
    "T. Nagar":        {"lat": 13.0418, "lon": 80.2341, "weight": 0.14},
    "Anna Nagar":      {"lat": 13.0850, "lon": 80.2101, "weight": 0.12},
    "Adyar":           {"lat": 13.0012, "lon": 80.2565, "weight": 0.10},
    "Velachery":       {"lat": 12.9815, "lon": 80.2180, "weight": 0.10},
    "Tambaram":        {"lat": 12.9249, "lon": 80.1000, "weight": 0.09},
    "Guindy":          {"lat": 13.0067, "lon": 80.2206, "weight": 0.09},
    "Mylapore":        {"lat": 13.0368, "lon": 80.2676, "weight": 0.08},
    "Egmore":          {"lat": 13.0732, "lon": 80.2609, "weight": 0.08},
    "Chromepet":       {"lat": 12.9516, "lon": 80.1462, "weight": 0.07},
    "Porur":           {"lat": 13.0382, "lon": 80.1565, "weight": 0.06},
    "Mamallapuram":    {"lat": 12.6269, "lon": 80.1927, "weight": 0.04},
    "Sholinganallur":  {"lat": 12.9010, "lon": 80.2279, "weight": 0.03},
}

SEVERITY_MAP = {
    "Theft": "Low", "Vandalism": "Low", "Fraud": "Medium",
    "Burglary": "Medium", "Drug Offense": "Medium", "Cybercrime": "Medium",
    "Assault": "High", "Robbery": "High", "Kidnapping": "High", "Homicide": "High",
}

WEAPONS = {
    "Theft": {"None": 0.80, "Knife": 0.15, "Firearm": 0.02, "Blunt Object": 0.03},
    "Assault": {"None": 0.30, "Knife": 0.35, "Firearm": 0.10, "Blunt Object": 0.25},
    "Burglary": {"None": 0.60, "Knife": 0.20, "Firearm": 0.05, "Blunt Object": 0.15},
    "Robbery": {"None": 0.20, "Knife": 0.35, "Firearm": 0.25, "Blunt Object": 0.20},
    "Fraud": {"None": 0.95, "Knife": 0.02, "Firearm": 0.01, "Blunt Object": 0.02},
    "Vandalism": {"None": 0.50, "Knife": 0.10, "Firearm": 0.02, "Blunt Object": 0.38},
    "Drug Offense": {"None": 0.70, "Knife": 0.15, "Firearm": 0.10, "Blunt Object": 0.05},
    "Kidnapping": {"None": 0.30, "Knife": 0.25, "Firearm": 0.30, "Blunt Object": 0.15},
    "Cybercrime": {"None": 0.98, "Knife": 0.01, "Firearm": 0.005, "Blunt Object": 0.005},
    "Homicide": {"None": 0.10, "Knife": 0.35, "Firearm": 0.35, "Blunt Object": 0.20},
}

SUSPECT_AGE_GROUPS = ["18-25", "26-35", "36-45", "46+"]
SUSPECT_AGE_WEIGHTS = [0.35, 0.30, 0.20, 0.15]

DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def generate_time_bias():
    """Generate hour with realistic crime time distribution (more at night)."""
    hour_weights = np.array([
        3, 2, 2, 1, 1, 1, 2, 3, 4, 5, 5, 6,   # 00:00 - 11:00
        6, 6, 5, 5, 5, 6, 7, 8, 9, 8, 6, 4     # 12:00 - 23:00
    ], dtype=float)
    hour_weights /= hour_weights.sum()
    return np.random.choice(range(24), p=hour_weights)


def generate_dataset():
    """Generate the full synthetic crime dataset."""
    print("🔄 Generating synthetic crime dataset...")

    crime_types = list(CRIME_TYPES.keys())
    crime_weights = list(CRIME_TYPES.values())

    area_names = list(AREAS.keys())
    area_weights = [AREAS[a]["weight"] for a in area_names]

    records = []

    # Date range: 2021-01-01 to 2024-12-31
    start_date = datetime(2021, 1, 1)
    end_date = datetime(2024, 12, 31)
    date_range_days = (end_date - start_date).days

    for i in range(NUM_RECORDS):
        # Crime type
        crime_type = np.random.choice(crime_types, p=crime_weights)

        # Date and time
        random_days = np.random.randint(0, date_range_days)
        date = start_date + timedelta(days=random_days)
        hour = generate_time_bias()
        minute = np.random.randint(0, 60)

        # Location
        area = np.random.choice(area_names, p=area_weights)
        base_lat = AREAS[area]["lat"]
        base_lon = AREAS[area]["lon"]
        lat = base_lat + np.random.normal(0, 0.008)
        lon = base_lon + np.random.normal(0, 0.008)

        # Severity
        severity = SEVERITY_MAP[crime_type]

        # Weapon
        weapon_choices = list(WEAPONS[crime_type].keys())
        weapon_probs = list(WEAPONS[crime_type].values())
        weapon = np.random.choice(weapon_choices, p=weapon_probs)

        # Suspect demographics
        age_group = np.random.choice(SUSPECT_AGE_GROUPS, p=SUSPECT_AGE_WEIGHTS)
        gender = np.random.choice(["Male", "Female"], p=[0.78, 0.22])
        prior_record = np.random.choice(["Yes", "No"], p=[0.40, 0.60])

        # Arrest made (higher for severe crimes)
        arrest_prob = {"Low": 0.30, "Medium": 0.45, "High": 0.55}[severity]
        if prior_record == "Yes":
            arrest_prob += 0.10
        arrest_made = np.random.choice(["Yes", "No"], p=[arrest_prob, 1 - arrest_prob])

        # Risk level (target variable)
        risk_score = 0
        if severity == "High":
            risk_score += 3
        elif severity == "Medium":
            risk_score += 2
        else:
            risk_score += 1

        if hour >= 20 or hour <= 5:
            risk_score += 1
        if prior_record == "Yes":
            risk_score += 1
        if weapon != "None":
            risk_score += 1

        # Add some noise
        risk_score += np.random.choice([-1, 0, 0, 1], p=[0.1, 0.5, 0.3, 0.1])

        if risk_score >= 5:
            risk_level = "High Risk"
        elif risk_score >= 3:
            risk_level = "Medium Risk"
        else:
            risk_level = "Low Risk"

        records.append({
            "crime_id": f"CR-{i+1:05d}",
            "crime_type": crime_type,
            "date": date.strftime("%Y-%m-%d"),
            "time": f"{hour:02d}:{minute:02d}",
            "day_of_week": DAYS_OF_WEEK[date.weekday()],
            "month": date.month,
            "hour": hour,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "area": area,
            "severity": severity,
            "suspect_age_group": age_group,
            "suspect_gender": gender,
            "suspect_prior_record": prior_record,
            "weapon_used": weapon,
            "arrest_made": arrest_made,
            "risk_level": risk_level,
        })

    df = pd.DataFrame(records)

    # Save
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df.to_csv(OUTPUT_FILE, index=False)

    print(f"✅ Dataset generated: {OUTPUT_FILE}")
    print(f"   Total records: {len(df)}")
    print(f"\n📊 Crime Type Distribution:")
    print(df["crime_type"].value_counts().to_string())
    print(f"\n🎯 Risk Level Distribution:")
    print(df["risk_level"].value_counts().to_string())
    print(f"\n📍 Area Distribution:")
    print(df["area"].value_counts().to_string())

    return df


if __name__ == "__main__":
    generate_dataset()
