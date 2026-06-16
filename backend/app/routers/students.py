from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database import get_db
from backend.app.models.student import Student
from backend.app.models.user import User
from backend.app.auth.jwt import decode_access_token

import os

templates_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "frontend", "templates"
)
templates = Jinja2Templates(directory=templates_dir)

router = APIRouter(prefix="/students")


def _get_user(token: str, db: Session):
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()


@router.get("", response_class=HTMLResponse)
async def student_list(request: Request, db: Session = Depends(get_db), q: Optional[str] = None):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    query = db.query(Student)
    if q:
        query = query.filter(Student.name.contains(q))
    if user.role == "pendamping":
        query = query.filter(Student.teacher_id == user.id)
    students = query.order_by(Student.name).all()
    return templates.TemplateResponse(
        request, "students/list.html", {"students": students, "user": user, "q": q}
    )


@router.get("/add", response_class=HTMLResponse)
async def student_add_page(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role != "admin":
        return RedirectResponse(url="/students")
    teachers = db.query(User).filter(User.role == "pendamping").all()
    return templates.TemplateResponse(
        request, "students/form.html", {"student": None, "user": user, "teachers": teachers, "error": None}
    )


@router.post("/add")
async def student_add(
    request: Request,
    name: str = Form(...),
    birth_date: str = Form(...),
    special_needs: str = Form(""),
    class_name: str = Form(""),
    teacher_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role != "admin":
        return RedirectResponse(url="/students")
    
    from datetime import date, datetime
    calculated_age = 0
    if birth_date:
        try:
            today = date.today()
            birth = datetime.strptime(birth_date, "%Y-%m-%d").date()
            calculated_age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        except Exception:
            pass

    student = Student(
        name=name, age=calculated_age,
        birth_date=birth_date or None,
        special_needs=special_needs or None,
        class_name=class_name or None,
        teacher_id=teacher_id or None,
    )
    db.add(student)
    db.commit()
    return RedirectResponse(url="/students?msg=Siswa+berhasil+ditambahkan", status_code=302)


@router.get("/{student_id}", response_class=HTMLResponse)
async def student_detail(student_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return RedirectResponse(url="/students")
    if user.role == "pendamping" and student.teacher_id != user.id:
        return RedirectResponse(url="/students")

    from backend.app.models.daily_report import DailyReport
    from backend.app.models.assessment import Assessment
    from backend.app.models.gallery import Gallery
    recent_reports = db.query(DailyReport).filter(DailyReport.student_id == student_id).order_by(DailyReport.date.desc()).limit(5).all()
    assessments = db.query(Assessment).filter(Assessment.student_id == student_id).order_by(Assessment.created_at.desc()).all()
    gallery_items = db.query(Gallery).filter(Gallery.student_id == student_id).order_by(Gallery.date.desc()).limit(6).all()
    return templates.TemplateResponse(
        request, "students/detail.html",
        {
            "student": student, "user": user,
            "recent_reports": recent_reports,
            "assessments": assessments,
            "gallery_items": gallery_items,
        }
    )


@router.get("/{student_id}/edit", response_class=HTMLResponse)
async def student_edit_page(student_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role != "admin":
        return RedirectResponse(url="/students")
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return RedirectResponse(url="/students")
    teachers = db.query(User).filter(User.role == "pendamping").all()
    return templates.TemplateResponse(
        request, "students/form.html", {"student": student, "user": user, "teachers": teachers, "error": None}
    )


@router.post("/{student_id}/edit")
async def student_edit(
    student_id: int,
    request: Request,
    name: str = Form(...),
    birth_date: str = Form(...),
    special_needs: str = Form(""),
    class_name: str = Form(""),
    teacher_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role != "admin":
        return RedirectResponse(url="/students")
    
    from datetime import date, datetime
    calculated_age = 0
    if birth_date:
        try:
            today = date.today()
            birth = datetime.strptime(birth_date, "%Y-%m-%d").date()
            calculated_age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        except Exception:
            pass

    student = db.query(Student).filter(Student.id == student_id).first()
    if student:
        student.name = name
        student.age = calculated_age
        student.birth_date = birth_date or None
        student.special_needs = special_needs or None
        student.class_name = class_name or None
        student.teacher_id = teacher_id or None
        db.commit()
    return RedirectResponse(url=f"/students/{student_id}?msg=Data+siswa+berhasil+diperbarui", status_code=302)


@router.get("/{student_id}/delete")
async def student_delete(student_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user or user.role != "admin":
        return RedirectResponse(url="/students")
    student = db.query(Student).filter(Student.id == student_id).first()
    if student:
        db.delete(student)
        db.commit()
    return RedirectResponse(url="/students?msg=Data+siswa+berhasil+dihapus", status_code=302)
