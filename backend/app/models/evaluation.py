from sqlalchemy import Column, Integer, String, Float, Text, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    class_name = Column(String(50), nullable=True)
    diagnosa = Column(String(255), nullable=True)
    
    # Store scores as a JSON string
    scores = Column(Text, nullable=True)
    
    # Domain Averages (1.0 - 4.0)
    avg_cognitive = Column(Float, nullable=True)
    avg_motoric = Column(Float, nullable=True)
    avg_language = Column(Float, nullable=True)
    avg_social = Column(Float, nullable=True)
    avg_independence = Column(Float, nullable=True)
    
    # Final Indices
    composite_index = Column(Float, nullable=True)
    index_percentage = Column(Float, nullable=True)
    predicate = Column(String(10), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", backref="evaluations")
