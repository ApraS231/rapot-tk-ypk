from pydantic import BaseModel
from typing import Optional
from datetime import date


class GalleryOut(BaseModel):
    id: int
    student_id: int
    image_path: str
    description: Optional[str]
    date: date

    class Config:
        from_attributes = True
