from pydantic import BaseModel
from typing import Optional
from datetime import date


class DailyReportCreate(BaseModel):
    student_id: int
    date: date
    notes: Optional[str] = None
    behavior: Optional[str] = None
    social_interaction: Optional[str] = None


class DailyReportUpdate(BaseModel):
    notes: Optional[str] = None
    behavior: Optional[str] = None
    social_interaction: Optional[str] = None


class DailyReportOut(BaseModel):
    id: int
    student_id: int
    date: date
    notes: Optional[str]
    behavior: Optional[str]
    social_interaction: Optional[str]
    created_by: Optional[int]

    class Config:
        from_attributes = True
