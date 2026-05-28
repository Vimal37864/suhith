from sqlalchemy import Column, Integer, String, Float, DateTime
from app.db.database import Base

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
