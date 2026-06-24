from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database import get_db
from backend.app.models.assessment import Assessment
from backend.app.models.student import Student
from backend.app.models.user import User
from backend.app.auth.jwt import decode_access_token

import os

templates_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "frontend", "templates"
)
templates = Jinja2Templates(directory=templates_dir)

router = APIRouter(prefix="/assessments")


def _get_user(token: str, db: Session):
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()


@router.get("", response_class=HTMLResponse)
async def assessment_list(request: Request, db: Session = Depends(get_db), student_id: Optional[int] = None):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    query = db.query(Assessment)
    if student_id:
        query = query.filter(Assessment.student_id == student_id)
        
    if user.role == "pendamping":
        query = query.join(Student).filter(Student.teacher_id == user.id)
        students = db.query(Student).filter(Student.teacher_id == user.id).order_by(Student.name).all()
    else:
        students = db.query(Student).order_by(Student.name).all()
        
    assessments = query.order_by(Assessment.created_at.desc()).all()
    students_map = {s.id: s.name for s in db.query(Student).all()}
    return templates.TemplateResponse(
        request, "assessments/list.html",
        {
            "assessments": assessments, "user": user,
            "students": students, "students_map": students_map,
            "filter_student_id": student_id,
        }
    )


@router.get("/add", response_class=HTMLResponse)
async def assessment_add_page(request: Request, db: Session = Depends(get_db), student_id: Optional[int] = None):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/assessments")
        
    students = db.query(Student).filter(Student.teacher_id == user.id).order_by(Student.name).all()
    student = None
    if student_id:
        student = db.query(Student).filter(Student.id == student_id).first()
        if student and student.teacher_id != user.id:
            return RedirectResponse(url="/assessments")
            
    return templates.TemplateResponse(
        request, "assessments/form.html",
        {"assessment": None, "user": user, "students": students, "student": student, "preselect_student": student_id}
    )


@router.post("/add")
async def assessment_add(
    request: Request,
    student_id: int = Form(...),
    period: str = Form(...),
    class_name: str = Form(""),
    special_needs: str = Form(""),
    motoric: str = Form(""),
    language: str = Form(""),
    social: str = Form(""),
    cognitive: str = Form(""),
    independence: str = Form(""),
    summary: str = Form(""),
    db: Session = Depends(get_db),
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/assessments")
        
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or student.teacher_id != user.id:
        return RedirectResponse(url="/assessments")
        
    assessment = Assessment(
        student_id=student_id, period=period,
        motoric=motoric or None, language=language or None,
        social=social or None, cognitive=cognitive or None,
        independence=independence or None,
        summary=summary or None,
    )
    db.add(assessment)
    
    # Update student's profile class & special needs
    if student:
        if class_name:
            student.class_name = class_name
        if special_needs:
            student.special_needs = special_needs
            
    db.commit()
    return RedirectResponse(url="/assessments?msg=Raport+kualitatif+berhasil+disimpan", status_code=302)


@router.get("/{assessment_id}/edit", response_class=HTMLResponse)
async def assessment_edit_page(assessment_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/assessments")
        
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        return RedirectResponse(url="/assessments")
        
    student = db.query(Student).filter(Student.id == assessment.student_id).first()
    if not student or student.teacher_id != user.id:
        return RedirectResponse(url="/assessments")
        
    students = db.query(Student).filter(Student.teacher_id == user.id).order_by(Student.name).all()
    return templates.TemplateResponse(
        request, "assessments/form.html",
        {"assessment": assessment, "user": user, "students": students, "student": student, "preselect_student": None}
    )


@router.post("/{assessment_id}/edit")
async def assessment_edit(
    assessment_id: int,
    request: Request,
    student_id: int = Form(...),
    period: str = Form(...),
    class_name: str = Form(""),
    special_needs: str = Form(""),
    motoric: str = Form(""),
    language: str = Form(""),
    social: str = Form(""),
    cognitive: str = Form(""),
    independence: str = Form(""),
    summary: str = Form(""),
    db: Session = Depends(get_db),
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/assessments")
        
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        return RedirectResponse(url="/assessments")
        
    old_student = db.query(Student).filter(Student.id == assessment.student_id).first()
    new_student = db.query(Student).filter(Student.id == student_id).first()
    if not old_student or old_student.teacher_id != user.id or not new_student or new_student.teacher_id != user.id:
        return RedirectResponse(url="/assessments")
        
    if assessment:
        assessment.student_id = student_id
        assessment.period = period
        assessment.motoric = motoric or None
        assessment.language = language or None
        assessment.social = social or None
        assessment.cognitive = cognitive or None
        assessment.independence = independence or None
        assessment.summary = summary or None
        
        # Update student's profile class & special needs
        if new_student:
            if class_name:
                new_student.class_name = class_name
            if special_needs:
                new_student.special_needs = special_needs
                
        db.commit()
    return RedirectResponse(url="/assessments?msg=Raport+kualitatif+berhasil+diperbarui", status_code=302)


@router.get("/{assessment_id}/delete")
async def assessment_delete(assessment_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/assessments")
        
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if assessment:
        student = db.query(Student).filter(Student.id == assessment.student_id).first()
        if not student or student.teacher_id != user.id:
            return RedirectResponse(url="/assessments")
            
        db.delete(assessment)
        db.commit()
    return RedirectResponse(url="/assessments?msg=Raport+kualitatif+berhasil+dihapus", status_code=302)


@router.get("/{assessment_id}/print", response_class=HTMLResponse)
async def assessment_print(assessment_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        return RedirectResponse(url="/assessments")
    student = db.query(Student).filter(Student.id == assessment.student_id).first()
    if not student:
        return RedirectResponse(url="/assessments")

    if user.role == "pendamping" and student.teacher_id != user.id:
        return RedirectResponse(url="/assessments")
        
    from backend.app.models.evaluation import Evaluation
    latest_evaluation = db.query(Evaluation).filter(
        Evaluation.student_id == student.id
    ).order_by(Evaluation.date.desc()).first()

    return templates.TemplateResponse(
        request, "reports/print.html",
        {
            "assessment": assessment,
            "student": student,
            "user": user,
            "evaluation": latest_evaluation
        }
    )


# ── Assessment REST API Endpoints ─────────────────────────────────────────────

from pydantic import BaseModel
from backend.app.schemas.assessment import AssessmentCreate, AssessmentUpdate

class AssessmentCreateAPISchema(BaseModel):
    student_id: int
    period: str
    class_name: Optional[str] = ""
    special_needs: Optional[str] = ""
    motoric: Optional[str] = None
    language: Optional[str] = None
    social: Optional[str] = None
    cognitive: Optional[str] = None
    independence: Optional[str] = None
    summary: Optional[str] = None


@router.get("/api/list")
async def api_assessment_list(request: Request, db: Session = Depends(get_db), student_id: Optional[int] = None):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    query = db.query(Assessment)
    if student_id:
        query = query.filter(Assessment.student_id == student_id)
        
    if user.role == "pendamping":
        query = query.join(Student).filter(Student.teacher_id == user.id)
        
    assessments = query.order_by(Assessment.created_at.desc()).all()
    students_map = {s.id: s.name for s in db.query(Student).all()}
    
    return [
        {
            "id": a.id,
            "student_id": a.student_id,
            "student_name": students_map.get(a.student_id, "Siswa"),
            "period": a.period,
            "motoric": a.motoric,
            "language": a.language,
            "social": a.social,
            "cognitive": a.cognitive,
            "independence": a.independence,
            "summary": a.summary,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in assessments
    ]


@router.post("/api/add")
async def api_assessment_add(
    request: Request,
    assess_data: AssessmentCreateAPISchema,
    db: Session = Depends(get_db)
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Shadow Teacher only")
        
    student = db.query(Student).filter(Student.id == assess_data.student_id).first()
    if not student or student.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden: Access denied to student")
        
    assessment = Assessment(
        student_id=assess_data.student_id,
        period=assess_data.period,
        motoric=assess_data.motoric or None,
        language=assess_data.language or None,
        social=assess_data.social or None,
        cognitive=assess_data.cognitive or None,
        independence=assess_data.independence or None,
        summary=assess_data.summary or None,
    )
    db.add(assessment)
    
    # Update student's profile class & special needs
    if assess_data.class_name:
        student.class_name = assess_data.class_name
    if assess_data.special_needs:
        student.special_needs = assess_data.special_needs
        
    db.commit()
    return {"status": "success", "message": "Raport kualitatif berhasil disimpan", "id": assessment.id}


@router.get("/api/detail/{assessment_id}")
async def api_assessment_detail(assessment_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Raport kualitatif tidak ditemukan")
        
    student = db.query(Student).filter(Student.id == assessment.student_id).first()
    if user.role == "pendamping" and (not student or student.teacher_id != user.id):
        raise HTTPException(status_code=403, detail="Forbidden: Access denied")
        
    return {
        "id": assessment.id,
        "student_id": assessment.student_id,
        "student_name": student.name if student else "Siswa",
        "class_name": student.class_name if student else "",
        "special_needs": student.special_needs if student else "",
        "period": assessment.period,
        "motoric": assessment.motoric,
        "language": assessment.language,
        "social": assessment.social,
        "cognitive": assessment.cognitive,
        "independence": assessment.independence,
        "summary": assessment.summary,
    }


@router.put("/api/edit/{assessment_id}")
async def api_assessment_edit(
    assessment_id: int,
    request: Request,
    assess_data: AssessmentCreateAPISchema,
    db: Session = Depends(get_db)
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Shadow Teacher only")
        
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Raport kualitatif tidak ditemukan")
        
    old_student = db.query(Student).filter(Student.id == assessment.student_id).first()
    new_student = db.query(Student).filter(Student.id == assess_data.student_id).first()
    if not old_student or old_student.teacher_id != user.id or not new_student or new_student.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden: Access denied")

    assessment.student_id = assess_data.student_id
    assessment.period = assess_data.period
    assessment.motoric = assess_data.motoric or None
    assessment.language = assess_data.language or None
    assessment.social = assess_data.social or None
    assessment.cognitive = assess_data.cognitive or None
    assessment.independence = assess_data.independence or None
    assessment.summary = assess_data.summary or None
    
    # Update student's profile class & special needs
    if assess_data.class_name:
        new_student.class_name = assess_data.class_name
    if assess_data.special_needs:
        new_student.special_needs = assess_data.special_needs
        
    db.commit()
    return {"status": "success", "message": "Raport kualitatif berhasil diperbarui"}


@router.delete("/api/delete/{assessment_id}")
async def api_assessment_delete(assessment_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Shadow Teacher only")
        
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Raport kualitatif tidak ditemukan")
        
    student = db.query(Student).filter(Student.id == assessment.student_id).first()
    if not student or student.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden: Access denied")
        
    db.delete(assessment)
    db.commit()
    return {"status": "success", "message": "Raport kualitatif berhasil dihapus"}
