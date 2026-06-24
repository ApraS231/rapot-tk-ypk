from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AssessmentCreate(BaseModel):
    student_id: int
    period: str
    motoric: Optional[str] = None
    language: Optional[str] = None
    social: Optional[str] = None
    cognitive: Optional[str] = None
    independence: Optional[str] = None
    summary: Optional[str] = None


class AssessmentUpdate(BaseModel):
    period: Optional[str] = None
    motoric: Optional[str] = None
    language: Optional[str] = None
    social: Optional[str] = None
    cognitive: Optional[str] = None
    independence: Optional[str] = None
    summary: Optional[str] = None


class AssessmentOut(BaseModel):
    id: int
    student_id: int
    period: str
    motoric: Optional[str]
    language: Optional[str]
    social: Optional[str]
    cognitive: Optional[str]
    independence: Optional[str]
    summary: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
