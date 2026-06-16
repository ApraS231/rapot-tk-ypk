from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Gallery(Base):
    __tablename__ = "gallery"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String(100), nullable=True)
    date = Column(Date, nullable=False)

    student = relationship("Student", backref="gallery_items")
