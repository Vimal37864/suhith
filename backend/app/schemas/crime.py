from pydantic import BaseModel
from typing import Optional, Dict, Any

class CrimePredictionRequest(BaseModel):
    crime_type: str
    area: str
    hour: int
    month: int
    day_of_week: str
    suspect_age_group: str
    suspect_gender: str
    suspect_prior_record: str
    weapon_used: str

class SuspectPredictionRequest(BaseModel):
    crime_type: str
    area: str
    hour: int

class PredictionResponse(BaseModel):
    success: bool
    predictions: Dict[str, Any]
    input_summary: Dict[str, Any]

class SuspectResponse(BaseModel):
    success: bool
    suspect_profile: Dict[str, Any]
    risk_factors: list[str]
    similar_cases_analyzed: int
