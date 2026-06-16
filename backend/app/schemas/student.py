from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    name: str
    age: int
    birth_date: Optional[str] = None
    special_needs: Optional[str] = None
    class_name: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    birth_date: Optional[str] = None
    special_needs: Optional[str] = None
    class_name: Optional[str] = None


class StudentOut(BaseModel):
    id: int
    name: str
    age: int
    birth_date: Optional[str]
    special_needs: Optional[str]
    class_name: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
