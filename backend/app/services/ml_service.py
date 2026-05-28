import os
import joblib
import json
import numpy as np
from sqlalchemy.orm import Session
from app.models.crime import CrimeRecord
from app.schemas.crime import CrimePredictionRequest, SuspectPredictionRequest

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml_pipeline", "artifacts"))

class MLService:
    def __init__(self):
        try:
            self.rf_model = joblib.load(os.path.join(ARTIFACTS_DIR, "rf_model.joblib"))
            self.xgb_model = joblib.load(os.path.join(ARTIFACTS_DIR, "xgb_model.joblib"))
            self.encoders = joblib.load(os.path.join(ARTIFACTS_DIR, "encoders.joblib"))
            self.scaler = joblib.load(os.path.join(ARTIFACTS_DIR, "scaler.joblib"))
            with open(os.path.join(ARTIFACTS_DIR, "metrics.json"), "r") as f:
                self.metrics = json.load(f)
            self.ready = True
        except Exception as e:
            print(f"ML Service Init Error: {e}")
            self.ready = False

    def predict_risk(self, req: CrimePredictionRequest):
        if not self.ready:
            raise Exception("Models not loaded")

        severity_map = {
            "Theft": "Low", "Vandalism": "Low", "Fraud": "Medium",
            "Burglary": "Medium", "Drug Offense": "Medium", "Cybercrime": "Medium",
            "Assault": "High", "Robbery": "High", "Kidnapping": "High", "Homicide": "High",
        }
        severity = severity_map.get(req.crime_type, "Medium")
        
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

        season = get_season(req.month)
        time_period = get_time_period(req.hour)
        is_weekend = 1 if req.day_of_week in ["Saturday", "Sunday"] else 0
        is_night = 1 if (req.hour >= 20 or req.hour <= 5) else 0

        areas_info = {
            "T. Nagar": (13.0418, 80.2341), "Anna Nagar": (13.0850, 80.2101),
            "Adyar": (13.0012, 80.2565), "Velachery": (12.9815, 80.2180),
            "Tambaram": (12.9249, 80.1000), "Guindy": (13.0067, 80.2206),
            "Mylapore": (13.0368, 80.2676), "Egmore": (13.0732, 80.2609),
            "Chromepet": (12.9516, 80.1462), "Porur": (13.0382, 80.1565),
            "Mamallapuram": (12.6269, 80.1927), "Sholinganallur": (12.9010, 80.2279),
        }
        lat, lon = areas_info.get(req.area, (13.0, 80.2))

        try:
            vec = [
                self.encoders["crime_type"].transform([req.crime_type])[0],
                req.month,
                req.hour,
                lat,
                lon,
                self.encoders["day_of_week"].transform([req.day_of_week])[0],
                self.encoders["area"].transform([req.area])[0],
                self.encoders["severity"].transform([severity])[0],
                self.encoders["suspect_age_group"].transform([req.suspect_age_group])[0],
                self.encoders["suspect_gender"].transform([req.suspect_gender])[0],
                self.encoders["suspect_prior_record"].transform([req.suspect_prior_record])[0],
                self.encoders["weapon_used"].transform([req.weapon_used])[0],
                is_weekend,
                is_night,
                self.encoders["season"].transform([season])[0],
                self.encoders["time_period"].transform([time_period])[0]
            ]
        except Exception as e:
            raise Exception(f"Encoding error: {e}")

        X = self.scaler.transform([vec])
        predictions = {}

        for name, model in [("Random Forest", self.rf_model), ("XGBoost", self.xgb_model)]:
            pred = model.predict(X)[0]
            pred_label = self.encoders["risk_level"].inverse_transform([pred])[0]
            proba = model.predict_proba(X)[0]
            class_labels = self.encoders["risk_level"].classes_
            probabilities = {class_labels[i]: round(float(proba[i]) * 100, 2) for i in range(len(class_labels))}
            
            predictions[name] = {
                "prediction": pred_label,
                "probabilities": probabilities
            }

        return predictions

    def predict_suspect(self, db: Session, req: SuspectPredictionRequest):
        similar = db.query(CrimeRecord).filter(
            CrimeRecord.crime_type == req.crime_type,
            CrimeRecord.area == req.area,
            CrimeRecord.hour >= max(0, req.hour - 3),
            CrimeRecord.hour <= min(23, req.hour + 3)
        ).all()

        if not similar:
            similar = db.query(CrimeRecord).filter(CrimeRecord.crime_type == req.crime_type).limit(50).all()

        total = len(similar)
        if total == 0:
            raise Exception("No similar cases found")

        age_counts = {}
        gender_counts = {}
        prior_counts = {"Yes": 0, "No": 0}
        weapon_counts = {}
        arrest_counts = {"Yes": 0, "No": 0}

        for s in similar:
            age_counts[s.suspect_age_group] = age_counts.get(s.suspect_age_group, 0) + 1
            gender_counts[s.suspect_gender] = gender_counts.get(s.suspect_gender, 0) + 1
            prior_counts[s.suspect_prior_record] = prior_counts.get(s.suspect_prior_record, 0) + 1
            weapon_counts[s.weapon_used] = weapon_counts.get(s.weapon_used, 0) + 1
            arrest_counts[s.arrest_made] = arrest_counts.get(s.arrest_made, 0) + 1

        most_likely_age = max(age_counts, key=age_counts.get)
        most_likely_gender = max(gender_counts, key=gender_counts.get)
        has_prior_pct = prior_counts["Yes"] / total

        risk_factors = []
        if req.hour >= 20 or req.hour <= 5: risk_factors.append("Nighttime incident - higher risk")
        if has_prior_pct > 0.5: risk_factors.append("Likely suspect with prior record")
        if req.crime_type in ["Robbery", "Assault", "Homicide", "Kidnapping"]: risk_factors.append("Violent crime category")

        suspect_score = min(100, int((has_prior_pct * 30) + (20 if req.hour >= 20 or req.hour <= 5 else 0) + (25 if req.crime_type in ["Robbery", "Assault", "Homicide"] else 0) + 15))

        return {
            "most_likely_age_group": most_likely_age,
            "most_likely_gender": most_likely_gender,
            "prior_record_likelihood": round(has_prior_pct * 100, 1),
            "suspect_match_score": suspect_score,
            "age_distribution": {k: round(v/total * 100, 1) for k,v in age_counts.items()},
            "gender_distribution": {k: round(v/total * 100, 1) for k,v in gender_counts.items()},
            "weapon_distribution": {k: round(v/total * 100, 1) for k,v in weapon_counts.items()},
            "arrest_likelihood": round(arrest_counts["Yes"]/total * 100, 1)
        }, risk_factors, total

ml_service = MLService()
