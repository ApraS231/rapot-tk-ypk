from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from backend.app.database import get_db
from backend.app.models.daily_report import DailyReport
from backend.app.models.student import Student
from backend.app.models.user import User
from backend.app.auth.jwt import decode_access_token

import os

templates_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "frontend", "templates"
)
templates = Jinja2Templates(directory=templates_dir)

router = APIRouter(prefix="/daily-reports")


def _get_user(token: str, db: Session):
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()


@router.get("", response_class=HTMLResponse)
async def report_list(request: Request, db: Session = Depends(get_db), student_id: Optional[int] = None):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    query = db.query(DailyReport)
    if student_id:
        query = query.filter(DailyReport.student_id == student_id)
        
    if user.role == "pendamping":
        query = query.join(Student).filter(Student.teacher_id == user.id)
        students = db.query(Student).filter(Student.teacher_id == user.id).order_by(Student.name).all()
    else:
        students = db.query(Student).order_by(Student.name).all()
        
    reports = query.order_by(DailyReport.date.desc()).all()
    students_map = {s.id: s.name for s in db.query(Student).all()}
    return templates.TemplateResponse(
        request, "daily_reports/list.html",
        {
            "reports": reports, "user": user,
            "students": students, "students_map": students_map,
            "filter_student_id": student_id,
        }
    )


@router.get("/add", response_class=HTMLResponse)
async def report_add_page(request: Request, db: Session = Depends(get_db), student_id: Optional[int] = None):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/daily-reports")
    students = db.query(Student).filter(Student.teacher_id == user.id).order_by(Student.name).all()
    return templates.TemplateResponse(
        request, "daily_reports/form.html",
        {"report": None, "user": user, "students": students, "preselect_student": student_id}
    )


@router.post("/add")
async def report_add(
    request: Request,
    student_id: int = Form(...),
    report_date: str = Form(...),
    notes: str = Form(""),
    behavior: str = Form(""),
    social_interaction: str = Form(""),
    db: Session = Depends(get_db),
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/daily-reports")
        
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or student.teacher_id != user.id:
        return RedirectResponse(url="/daily-reports")

    report = DailyReport(
        student_id=student_id,
        date=date.fromisoformat(report_date),
        notes=notes or None,
        behavior=behavior or None,
        social_interaction=social_interaction or None,
        created_by=user.id,
    )
    db.add(report)
    db.commit()
    return RedirectResponse(url="/daily-reports?msg=Catatan+harian+berhasil+disimpan", status_code=302)


@router.get("/{report_id}/edit", response_class=HTMLResponse)
async def report_edit_page(report_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/daily-reports")
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        return RedirectResponse(url="/daily-reports")
        
    student = db.query(Student).filter(Student.id == report.student_id).first()
    if not student or student.teacher_id != user.id:
        return RedirectResponse(url="/daily-reports")

    students = db.query(Student).filter(Student.teacher_id == user.id).order_by(Student.name).all()
    return templates.TemplateResponse(
        request, "daily_reports/form.html",
        {"report": report, "user": user, "students": students, "preselect_student": None}
    )


@router.post("/{report_id}/edit")
async def report_edit(
    report_id: int,
    request: Request,
    student_id: int = Form(...),
    report_date: str = Form(...),
    notes: str = Form(""),
    behavior: str = Form(""),
    social_interaction: str = Form(""),
    db: Session = Depends(get_db),
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/daily-reports")
        
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        return RedirectResponse(url="/daily-reports")
        
    old_student = db.query(Student).filter(Student.id == report.student_id).first()
    new_student = db.query(Student).filter(Student.id == student_id).first()
    if not old_student or old_student.teacher_id != user.id or not new_student or new_student.teacher_id != user.id:
        return RedirectResponse(url="/daily-reports")

    if report:
        report.student_id = student_id
        report.date = date.fromisoformat(report_date)
        report.notes = notes or None
        report.behavior = behavior or None
        report.social_interaction = social_interaction or None
        db.commit()
    return RedirectResponse(url="/daily-reports?msg=Catatan+harian+berhasil+diperbarui", status_code=302)


@router.get("/{report_id}/delete")
async def report_delete(report_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/daily-reports")
        
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if report:
        student = db.query(Student).filter(Student.id == report.student_id).first()
        if not student or student.teacher_id != user.id:
            return RedirectResponse(url="/daily-reports")
            
        db.delete(report)
        db.commit()
    return RedirectResponse(url="/daily-reports?msg=Catatan+harian+berhasil+dihapus", status_code=302)
