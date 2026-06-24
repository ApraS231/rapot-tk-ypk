from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class EvaluationCreate(BaseModel):
    student_id: int
    date: date
    class_name: Optional[str] = None
    diagnosa: Optional[str] = None
    scores: Optional[str] = None
    avg_cognitive: Optional[float] = None
    avg_motoric: Optional[float] = None
    avg_language: Optional[float] = None
    avg_social: Optional[float] = None
    avg_independence: Optional[float] = None
    composite_index: Optional[float] = None
    index_percentage: Optional[float] = None
    predicate: Optional[str] = None


class EvaluationOut(BaseModel):
    id: int
    student_id: int
    date: date
    class_name: Optional[str]
    diagnosa: Optional[str]
    scores: Optional[str]
    avg_cognitive: Optional[float]
    avg_motoric: Optional[float]
    avg_language: Optional[float]
    avg_social: Optional[float]
    avg_independence: Optional[float]
    composite_index: Optional[float]
    index_percentage: Optional[float]
    predicate: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
