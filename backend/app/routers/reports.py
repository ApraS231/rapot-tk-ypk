import os
from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.auth.jwt import decode_access_token
from backend.app.models.user import User
from backend.app.models.student import Student
from backend.app.models.assessment import Assessment

templates_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "frontend", "templates"
)
templates = Jinja2Templates(directory=templates_dir)

router = APIRouter()


def _get_current_user(request: Request, db: Session):
    token = request.cookies.get("access_token")
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()


@router.get("/reports", response_class=HTMLResponse)
async def list_students_for_report(request: Request, db: Session = Depends(get_db)):
    user = _get_current_user(request, db)
    if not user:
        return RedirectResponse(url="/login")

    if user.role == "pendamping":
        students = db.query(Student).filter(Student.teacher_id == user.id).all()
    else:
        students = db.query(Student).all()
        
    # Prepare data on how many assessments each student has to indicate readiness
    students_data = []
    for s in students:
        assessments_count = db.query(Assessment).filter(Assessment.student_id == s.id).count()
        students_data.append({
            "student": s,
            "assessments_count": assessments_count
        })

    return templates.TemplateResponse(
        request, "reports/index.html",
        {"user": user, "students_data": students_data}
    )


@router.get("/reports/{student_id}", response_class=HTMLResponse)
async def view_report(student_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_current_user(request, db)
    if not user:
        return RedirectResponse(url="/login")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return RedirectResponse(url="/reports")
    if user.role == "pendamping" and student.teacher_id != user.id:
        return RedirectResponse(url="/reports")

    # Get the latest assessment for this student
    latest_assessment = db.query(Assessment).filter(
        Assessment.student_id == student_id
    ).order_by(Assessment.created_at.desc()).first()

    from backend.app.models.evaluation import Evaluation
    latest_evaluation = db.query(Evaluation).filter(
        Evaluation.student_id == student_id
    ).order_by(Evaluation.date.desc()).first()

    return templates.TemplateResponse(
        request, "reports/view.html",
        {
            "user": user,
            "student": student,
            "assessment": latest_assessment,
            "evaluation": latest_evaluation,
            "school_name": "TK Inklusif Mutiara Hati"
        }
    )
