import os
from fastapi import APIRouter, Depends, Request, HTTPException
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


# ── Reports REST API Endpoints ────────────────────────────────────────────────

@router.get("/api/reports")
async def api_list_students_for_report(request: Request, db: Session = Depends(get_db)):
    user = _get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if user.role == "pendamping":
        students = db.query(Student).filter(Student.teacher_id == user.id).all()
    else:
        students = db.query(Student).all()
        
    teachers_map = {t.id: t.name for t in db.query(User).filter(User.role == "pendamping").all()}
    
    students_data = []
    for s in students:
        assessments_count = db.query(Assessment).filter(Assessment.student_id == s.id).count()
        students_data.append({
            "student_id": s.id,
            "student_name": s.name,
            "class_name": s.class_name,
            "special_needs": s.special_needs,
            "teacher_name": teachers_map.get(s.teacher_id, "Belum ditentukan") if s.teacher_id else "Belum ditentukan",
            "assessments_count": assessments_count
        })

    return students_data


@router.get("/api/reports/{student_id}")
async def api_view_report(student_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")
    if user.role == "pendamping" and student.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden: Access denied")

    latest_assessment = db.query(Assessment).filter(
        Assessment.student_id == student_id
    ).order_by(Assessment.created_at.desc()).first()

    from backend.app.models.evaluation import Evaluation
    latest_evaluation = db.query(Evaluation).filter(
        Evaluation.student_id == student_id
    ).order_by(Evaluation.date.desc()).first()
    
    teachers_map = {t.id: t.name for t in db.query(User).filter(User.role == "pendamping").all()}

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "age": student.age,
            "birth_date": student.birth_date,
            "special_needs": student.special_needs,
            "class_name": student.class_name,
            "teacher_name": teachers_map.get(student.teacher_id, "Belum ditentukan") if student.teacher_id else "Belum ditentukan",
        },
        "assessment": {
            "id": latest_assessment.id,
            "period": latest_assessment.period,
            "motoric": latest_assessment.motoric,
            "language": latest_assessment.language,
            "social": latest_assessment.social,
            "cognitive": latest_assessment.cognitive,
            "independence": latest_assessment.independence,
            "summary": latest_assessment.summary,
            "created_at": latest_assessment.created_at.isoformat() if latest_assessment.created_at else None,
        } if latest_assessment else None,
        "evaluation": {
            "id": latest_evaluation.id,
            "date": latest_evaluation.date.isoformat() if latest_evaluation.date else None,
            "composite_index": latest_evaluation.composite_index,
            "index_percentage": latest_evaluation.index_percentage,
            "predicate": latest_evaluation.predicate,
            "avg_cognitive": round(latest_evaluation.avg_cognitive, 2) if latest_evaluation.avg_cognitive else 0.0,
            "avg_motoric": round(latest_evaluation.avg_motoric, 2) if latest_evaluation.avg_motoric else 0.0,
            "avg_language": round(latest_evaluation.avg_language, 2) if latest_evaluation.avg_language else 0.0,
            "avg_social": round(latest_evaluation.avg_social, 2) if latest_evaluation.avg_social else 0.0,
            "avg_independence": round(latest_evaluation.avg_independence, 2) if latest_evaluation.avg_independence else 0.0,
        } if latest_evaluation else None,
        "school_name": "TK Inklusif Mutiara Hati"
    }
