from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class HealthResponse(BaseModel):
    status: str

class FontCountResponse(BaseModel):
    english_count: int
    sinhala_count: int
    total: int

class ChatResponse(BaseModel):
    reply: str

class FeedbackResponse(BaseModel):
    status: str
    message: str

class FeedbackStatsResponse(BaseModel):
    total_evaluations: int
    average_rating: float
    rating_distribution: Dict[str, int]
    recent_feedback: List[Dict[str, Any]]

