from sqlalchemy.orm import Session
from backend.app.models.student import Student
from backend.app.models.assessment import Assessment
from backend.app.models.daily_report import DailyReport
from backend.app.models.gallery import Gallery


def get_student_full_report(db: Session, student_id: int, period: str = None):
    """
    Returns a dict with all data needed to generate a print report for a student.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return None

    assessment_query = db.query(Assessment).filter(Assessment.student_id == student_id)
    if period:
        assessment_query = assessment_query.filter(Assessment.period == period)
    assessments = assessment_query.order_by(Assessment.created_at.desc()).all()

    daily_reports = (
        db.query(DailyReport)
        .filter(DailyReport.student_id == student_id)
        .order_by(DailyReport.date.desc())
        .all()
    )

    gallery_items = (
        db.query(Gallery)
        .filter(Gallery.student_id == student_id)
        .order_by(Gallery.date.desc())
        .limit(8)
        .all()
    )

    return {
        "student": student,
        "assessments": assessments,
        "daily_reports": daily_reports,
        "gallery_items": gallery_items,
    }
