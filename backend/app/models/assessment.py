from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    period = Column(String(50), nullable=False)  # e.g. "Semester 1 2025"
    motoric = Column(Text, nullable=True)
    language = Column(Text, nullable=True)
    social = Column(Text, nullable=True)
    cognitive = Column(Text, nullable=True)
    independence = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", backref="assessments")
