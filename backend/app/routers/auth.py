from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import bcrypt as _bcrypt

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.auth.jwt import create_access_token, decode_access_token

import os

templates_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "frontend", "templates"
)
templates = Jinja2Templates(directory=templates_dir)


def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


router = APIRouter()


def _get_user_from_token(token: str, db: Session):
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()


# ── Auth routes ────────────────────────────────────────────────────────────────

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(request, "login.html", {"error": None})


@router.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return templates.TemplateResponse(
            request, "login.html", {"error": "Email atau password salah"}
        )
    token = create_access_token({"sub": str(user.id), "role": user.role})
    response = RedirectResponse(url="/dashboard", status_code=302)
    response.set_cookie(key="access_token", value=token, httponly=True, max_age=28800)
    return response


@router.get("/logout")
async def logout():
    response = RedirectResponse(url="/login", status_code=302)
    response.delete_cookie("access_token")
    return response


@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return RedirectResponse(url="/dashboard")


# ── Dashboard ──────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    user = _get_user_from_token(token, db)
    if not user:
        return RedirectResponse(url="/login")

    from backend.app.models.student import Student
    from backend.app.models.daily_report import DailyReport
    from backend.app.models.assessment import Assessment
    from backend.app.models.evaluation import Evaluation
    from backend.app.models.gallery import Gallery
    from datetime import date, datetime
    import json

    if user.role == "pendamping":
        total_students = db.query(Student).filter(Student.teacher_id == user.id).count()
        total_reports_today = db.query(DailyReport).join(Student).filter(Student.teacher_id == user.id, DailyReport.date == date.today()).count()
        total_assessments = db.query(Assessment).join(Student).filter(Student.teacher_id == user.id).count()
        total_gallery_items = db.query(Gallery).join(Student).filter(Student.teacher_id == user.id).count()
        total_graded_students = db.query(Evaluation.student_id).join(Student).filter(Student.teacher_id == user.id).distinct().count()
        recent_reports = db.query(DailyReport).join(Student).filter(Student.teacher_id == user.id).order_by(DailyReport.date.desc()).limit(5).all()
        students_map = {s.id: s.name for s in db.query(Student).filter(Student.teacher_id == user.id).all()}
    else:
        total_students = db.query(Student).count()
        total_reports_today = db.query(DailyReport).filter(DailyReport.date == date.today()).count()
        total_assessments = db.query(Assessment).count()
        total_gallery_items = db.query(Gallery).count()
        total_graded_students = db.query(Evaluation.student_id).distinct().count()
        recent_reports = db.query(DailyReport).order_by(DailyReport.date.desc()).limit(5).all()
        students_map = {s.id: s.name for s in db.query(Student).all()}

    # Data for BK/Admin charts:
    # 1. Bar Chart: Latest composite index per student
    bar_labels = []
    bar_data = []
    for s in db.query(Student).order_by(Student.name).all():
        latest_ev = db.query(Evaluation).filter(Evaluation.student_id == s.id).order_by(Evaluation.date.desc()).first()
        if latest_ev:
            bar_labels.append(s.name)
            bar_data.append(latest_ev.composite_index)

    # 2. Line Chart: Average composite score from month to month
    # Group evaluations by month and average composite_index
    from sqlalchemy import func
    monthly_data = db.query(
        func.strftime("%Y-%m", Evaluation.date).label("month"),
        func.avg(Evaluation.composite_index).label("avg_index")
    ).group_by("month").order_by("month").all()
    
    line_labels = []
    line_data = []
    for m in monthly_data:
        try:
            formatted_month = datetime.strptime(m[0], "%Y-%m").strftime("%b %Y")
            line_labels.append(formatted_month)
            line_data.append(round(m[1], 2))
        except Exception:
            line_labels.append(m[0])
            line_data.append(round(m[1], 2))

    return templates.TemplateResponse(
        request, "dashboard.html",
        {
            "user": user,
            "total_students": total_students,
            "total_reports_today": total_reports_today,
            "total_assessments": total_assessments,
            "total_gallery_items": total_gallery_items,
            "total_graded_students": total_graded_students,
            "recent_reports": recent_reports,
            "students_map": students_map,
            "bar_labels": json.dumps(bar_labels),
            "bar_data": json.dumps(bar_data),
            "line_labels": json.dumps(line_labels),
            "line_data": json.dumps(line_data),
        },
    )


# ── User Management (Admin) ────────────────────────────────────────────────────

@router.get("/users", response_class=HTMLResponse)
async def user_list(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    payload = decode_access_token(token) if token else None
    if not payload or payload.get("role") != "admin":
        return RedirectResponse(url="/login" if not token else "/dashboard")
    current_user = db.query(User).filter(User.id == int(payload["sub"])).first()
    users = db.query(User).all()
    return templates.TemplateResponse(
        request, "users/list.html", {"users": users, "user": current_user}
    )


@router.get("/users/add", response_class=HTMLResponse)
async def user_add_page(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    payload = decode_access_token(token) if token else None
    if not payload or payload.get("role") != "admin":
        return RedirectResponse(url="/login" if not token else "/dashboard")
    current_user = db.query(User).filter(User.id == int(payload["sub"])).first()
    return templates.TemplateResponse(
        request, "users/form.html", {"user": current_user, "edit_user": None, "error": None}
    )


@router.post("/users/add")
async def user_add(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    db: Session = Depends(get_db),
):
    token = request.cookies.get("access_token")
    payload = decode_access_token(token) if token else None
    if not payload or payload.get("role") != "admin":
        return RedirectResponse(url="/login", status_code=302)
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        current_user = db.query(User).filter(User.id == int(payload["sub"])).first()
        return templates.TemplateResponse(
            request, "users/form.html",
            {"user": current_user, "edit_user": None, "error": "Email sudah terdaftar"}
        )
    new_user = User(name=name, email=email, hashed_password=hash_password(password), role=role)
    db.add(new_user)
    db.commit()
    return RedirectResponse(url="/users?msg=Pengguna+berhasil+ditambahkan", status_code=302)


@router.get("/users/{user_id}/edit", response_class=HTMLResponse)
async def user_edit_page(user_id: int, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    payload = decode_access_token(token) if token else None
    if not payload or payload.get("role") != "admin":
        return RedirectResponse(url="/login" if not token else "/dashboard")
    current_user = db.query(User).filter(User.id == int(payload["sub"])).first()
    edit_user = db.query(User).filter(User.id == user_id).first()
    if not edit_user:
        return RedirectResponse(url="/users")
    return templates.TemplateResponse(
        request, "users/form.html", {"user": current_user, "edit_user": edit_user, "error": None}
    )


@router.post("/users/{user_id}/edit")
async def user_edit(
    user_id: int,
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    db: Session = Depends(get_db),
):
    token = request.cookies.get("access_token")
    payload = decode_access_token(token) if token else None
    if not payload or payload.get("role") != "admin":
        return RedirectResponse(url="/login", status_code=302)
    
    current_user = db.query(User).filter(User.id == int(payload["sub"])).first()
    edit_user = db.query(User).filter(User.id == user_id).first()
    if edit_user:
        existing = db.query(User).filter(User.email == email, User.id != user_id).first()
        if existing:
            return templates.TemplateResponse(
                request, "users/form.html",
                {"user": current_user, "edit_user": edit_user, "error": "Email sudah terdaftar"}
            )
        edit_user.name = name
        edit_user.email = email
        edit_user.role = role
        db.commit()
    return RedirectResponse(url="/users?msg=Data+pengguna+berhasil+diperbarui", status_code=302)


@router.post("/users/{user_id}/reset-password")
async def user_reset_password(
    user_id: int,
    request: Request,
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    token = request.cookies.get("access_token")
    payload = decode_access_token(token) if token else None
    if not payload or payload.get("role") != "admin":
        return RedirectResponse(url="/login", status_code=302)
        
    edit_user = db.query(User).filter(User.id == user_id).first()
    if edit_user:
        edit_user.hashed_password = hash_password(password)
        db.commit()
    return RedirectResponse(url="/users?msg=PIN/Password+berhasil+direset", status_code=302)


@router.get("/users/{user_id}/delete")
async def user_delete(user_id: int, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    payload = decode_access_token(token) if token else None
    if not payload or payload.get("role") != "admin":
        return RedirectResponse(url="/login", status_code=302)
    current_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.id != current_id:
        db.delete(user)
        db.commit()
    return RedirectResponse(url="/users?msg=Pengguna+berhasil+dihapus", status_code=302)
