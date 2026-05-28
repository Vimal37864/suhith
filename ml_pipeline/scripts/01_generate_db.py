"""
Generates synthetic crime data directly into an SQLite Database via SQLAlchemy.
"""

import os
import sys
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

# Setup Database
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "crimes.db"))
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
engine = create_engine(f"sqlite:///{DB_PATH}")
Base = declarative_base()

class CrimeRecord(Base):
    __tablename__ = 'crimes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    crime_id = Column(String(20), unique=True, index=True)
    crime_type = Column(String(50), index=True)
    date = Column(DateTime, index=True)
    hour = Column(Integer)
    day_of_week = Column(String(20))
    month = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)
    area = Column(String(100), index=True)
    severity = Column(String(20))
    suspect_age_group = Column(String(20))
    suspect_gender = Column(String(20))
    suspect_prior_record = Column(String(10))
    weapon_used = Column(String(50))
    arrest_made = Column(String(10))
    risk_level = Column(String(20))

Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

# Config
np.random.seed(42)
NUM_RECORDS = 10000

# Weights
CRIME_TYPES = {
    "Theft": 0.25, "Assault": 0.15, "Burglary": 0.14, "Robbery": 0.10,
    "Fraud": 0.10, "Vandalism": 0.08, "Drug Offense": 0.08, "Kidnapping": 0.04,
    "Cybercrime": 0.04, "Homicide": 0.02,
}

AREAS = {
    "T. Nagar": {"lat": 13.0418, "lon": 80.2341, "weight": 0.14},
    "Anna Nagar": {"lat": 13.0850, "lon": 80.2101, "weight": 0.12},
    "Adyar": {"lat": 13.0012, "lon": 80.2565, "weight": 0.10},
    "Velachery": {"lat": 12.9815, "lon": 80.2180, "weight": 0.10},
    "Tambaram": {"lat": 12.9249, "lon": 80.1000, "weight": 0.09},
    "Guindy": {"lat": 13.0067, "lon": 80.2206, "weight": 0.09},
    "Mylapore": {"lat": 13.0368, "lon": 80.2676, "weight": 0.08},
    "Egmore": {"lat": 13.0732, "lon": 80.2609, "weight": 0.08},
    "Chromepet": {"lat": 12.9516, "lon": 80.1462, "weight": 0.07},
    "Porur": {"lat": 13.0382, "lon": 80.1565, "weight": 0.06},
    "Mamallapuram": {"lat": 12.6269, "lon": 80.1927, "weight": 0.04},
    "Sholinganallur": {"lat": 12.9010, "lon": 80.2279, "weight": 0.03},
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

DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

def generate_time_bias():
    weights = np.array([3, 2, 2, 1, 1, 1, 2, 3, 4, 5, 5, 6, 6, 6, 5, 5, 5, 6, 7, 8, 9, 8, 6, 4], dtype=float)
    weights /= weights.sum()
    return np.random.choice(range(24), p=weights)

def generate_data():
    print("Generating Enterprise Crime DB...")
    session = Session()
    # Clear existing
    session.query(CrimeRecord).delete()
    
    records = []
    start_date = datetime(2021, 1, 1)
    date_range_days = (datetime(2024, 12, 31) - start_date).days

    for i in range(NUM_RECORDS):
        crime_type = np.random.choice(list(CRIME_TYPES.keys()), p=list(CRIME_TYPES.values()))
        dt = start_date + timedelta(days=np.random.randint(0, date_range_days))
        hour = generate_time_bias()
        dt = dt.replace(hour=hour, minute=np.random.randint(0, 60))
        
        area = np.random.choice(list(AREAS.keys()), p=[AREAS[a]["weight"] for a in AREAS])
        lat = AREAS[area]["lat"] + np.random.normal(0, 0.008)
        lon = AREAS[area]["lon"] + np.random.normal(0, 0.008)
        
        severity = SEVERITY_MAP[crime_type]
        weapon = np.random.choice(list(WEAPONS[crime_type].keys()), p=list(WEAPONS[crime_type].values()))
        
        age = np.random.choice(["18-25", "26-35", "36-45", "46+"], p=[0.35, 0.30, 0.20, 0.15])
        gender = np.random.choice(["Male", "Female"], p=[0.78, 0.22])
        prior = np.random.choice(["Yes", "No"], p=[0.40, 0.60])
        
        arrest_prob = {"Low": 0.30, "Medium": 0.45, "High": 0.55}[severity]
        if prior == "Yes": arrest_prob += 0.10
        arrest = np.random.choice(["Yes", "No"], p=[arrest_prob, 1 - arrest_prob])
        
        # Risk Logic
        score = {"Low": 1, "Medium": 2, "High": 3}[severity]
        if hour >= 20 or hour <= 5: score += 1
        if prior == "Yes": score += 1
        if weapon != "None": score += 1
        score += np.random.choice([-1, 0, 0, 1], p=[0.1, 0.5, 0.3, 0.1])
        
        risk = "High Risk" if score >= 5 else "Medium Risk" if score >= 3 else "Low Risk"
        
        records.append(CrimeRecord(
            crime_id=f"CR-{i+1:05d}", crime_type=crime_type, date=dt, hour=hour,
            day_of_week=DAYS_OF_WEEK[dt.weekday()], month=dt.month,
            latitude=round(lat, 6), longitude=round(lon, 6), area=area,
            severity=severity, suspect_age_group=age, suspect_gender=gender,
            suspect_prior_record=prior, weapon_used=weapon, arrest_made=arrest,
            risk_level=risk
        ))
        
        if len(records) >= 1000:
            session.bulk_save_objects(records)
            records = []
            
    if records: session.bulk_save_objects(records)
    session.commit()
    session.close()
    print(f"Successfully generated {NUM_RECORDS} records into {DB_PATH}")

if __name__ == "__main__":
    generate_data()
