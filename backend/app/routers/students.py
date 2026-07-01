from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database import get_db
from backend.app.models.student import Student
from backend.app.models.user import User
from backend.app.models.daily_report import DailyReport
from backend.app.models.assessment import Assessment
from backend.app.models.gallery import Gallery
from backend.app.models.evaluation import Evaluation
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
        # 1. Hapus file gambar gallery dari disk terlebih dahulu
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        gallery_items = db.query(Gallery).filter(Gallery.student_id == student_id).all()
        for item in gallery_items:
            try:
                rel = item.image_path.lstrip("/").replace("static/", "", 1)
                file_path = os.path.join(BASE_DIR, "frontend", "static", rel)
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass  # Lanjutkan meski file fisik gagal dihapus

        # 2. Hapus semua data terkait dari database
        db.query(Gallery).filter(Gallery.student_id == student_id).delete(synchronize_session=False)
        db.query(DailyReport).filter(DailyReport.student_id == student_id).delete(synchronize_session=False)
        db.query(Assessment).filter(Assessment.student_id == student_id).delete(synchronize_session=False)
        db.query(Evaluation).filter(Evaluation.student_id == student_id).delete(synchronize_session=False)

        # 3. Hapus data siswa
        db.delete(student)
        db.commit()
    return RedirectResponse(url="/students?msg=Data+siswa+berhasil+dihapus", status_code=302)


# ── Student REST API Endpoints ────────────────────────────────────────────────

@router.get("/api/list")
async def api_student_list(request: Request, db: Session = Depends(get_db), q: Optional[str] = None):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    query = db.query(Student)
    if q:
        query = query.filter(Student.name.contains(q))
    if user.role == "pendamping":
        query = query.filter(Student.teacher_id == user.id)
    students = query.order_by(Student.name).all()
    
    teachers_map = {t.id: t.name for t in db.query(User).filter(User.role == "pendamping").all()}
    
    return [
        {
            "id": s.id,
            "name": s.name,
            "age": s.age,
            "birth_date": s.birth_date,
            "special_needs": s.special_needs,
            "class_name": s.class_name,
            "teacher_id": s.teacher_id,
            "teacher_name": teachers_map.get(s.teacher_id, "Belum ditentukan") if s.teacher_id else "Belum ditentukan"
        }
        for s in students
    ]


@router.get("/api/teachers")
async def api_teacher_list(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    teachers = db.query(User).filter(User.role == "pendamping").all()
    return [{"id": t.id, "name": t.name, "email": t.email} for t in teachers]


class StudentCreateSchema(BaseModel):
    name: str
    birth_date: Optional[str] = None
    special_needs: Optional[str] = ""
    class_name: Optional[str] = ""
    teacher_id: Optional[int] = None

from datetime import date, datetime

@router.post("/api/add")
async def api_student_add(
    request: Request,
    student_data: StudentCreateSchema,
    db: Session = Depends(get_db)
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin only")
        
    calculated_age = 0
    if student_data.birth_date:
        try:
            today = date.today()
            birth = datetime.strptime(student_data.birth_date, "%Y-%m-%d").date()
            calculated_age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        except Exception:
            pass

    student = Student(
        name=student_data.name,
        age=calculated_age,
        birth_date=student_data.birth_date or None,
        special_needs=student_data.special_needs or None,
        class_name=student_data.class_name or None,
        teacher_id=student_data.teacher_id or None,
    )
    db.add(student)
    db.commit()
    return {"status": "success", "message": "Siswa berhasil ditambahkan", "id": student.id}


@router.get("/api/detail/{student_id}")
async def api_student_detail(student_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")
    if user.role == "pendamping" and student.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden: Access denied")

    recent_reports = db.query(DailyReport).filter(DailyReport.student_id == student_id).order_by(DailyReport.date.desc()).limit(5).all()
    assessments = db.query(Assessment).filter(Assessment.student_id == student_id).order_by(Assessment.created_at.desc()).all()
    gallery_items = db.query(Gallery).filter(Gallery.student_id == student_id).order_by(Gallery.date.desc()).limit(6).all()
    
    teachers_map = {t.id: t.name for t in db.query(User).filter(User.role == "pendamping").all()}

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "age": student.age,
            "birth_date": student.birth_date,
            "special_needs": student.special_needs,
            "class_name": student.class_name,
            "teacher_id": student.teacher_id,
            "teacher_name": teachers_map.get(student.teacher_id, "Belum ditentukan") if student.teacher_id else "Belum ditentukan"
        },
        "recent_reports": [
            {
                "id": r.id,
                "date": r.date.isoformat() if r.date else None,
                "notes": r.notes,
                "behavior": r.behavior,
                "social_interaction": r.social_interaction,
            }
            for r in recent_reports
        ],
        "assessments": [
            {
                "id": a.id,
                "period": a.period,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "motoric": a.motoric,
                "language": a.language,
                "social_emotional": a.social,
                "cognitive": a.cognitive,
                "independence": a.independence,
                "summary": a.summary,
            }
            for a in assessments
        ],
        "gallery_items": [
            {
                "id": g.id,
                "image_path": g.image_path,
                "description": g.description,
                "date": g.date.isoformat() if g.date else None,
            }
            for g in gallery_items
        ]
    }


@router.put("/api/edit/{student_id}")
async def api_student_edit(
    student_id: int,
    request: Request,
    student_data: StudentCreateSchema,
    db: Session = Depends(get_db)
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin only")
        
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")
        
    calculated_age = 0
    if student_data.birth_date:
        try:
            today = date.today()
            birth = datetime.strptime(student_data.birth_date, "%Y-%m-%d").date()
            calculated_age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        except Exception:
            pass

    student.name = student_data.name
    student.age = calculated_age
    student.birth_date = student_data.birth_date or None
    student.special_needs = student_data.special_needs or None
    student.class_name = student_data.class_name or None
    student.teacher_id = student_data.teacher_id or None
    db.commit()
    return {"status": "success", "message": "Data siswa berhasil diperbarui"}


@router.delete("/api/delete/{student_id}")
async def api_student_delete(student_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin only")
        
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")
        
    # 1. Hapus file gambar gallery dari disk
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    gallery_items = db.query(Gallery).filter(Gallery.student_id == student_id).all()
    for item in gallery_items:
        try:
            rel = item.image_path.lstrip("/").replace("static/", "", 1)
            file_path = os.path.join(BASE_DIR, "frontend", "static", rel)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass

    # 2. Hapus relasi
    db.query(Gallery).filter(Gallery.student_id == student_id).delete(synchronize_session=False)
    db.query(DailyReport).filter(DailyReport.student_id == student_id).delete(synchronize_session=False)
    db.query(Assessment).filter(Assessment.student_id == student_id).delete(synchronize_session=False)
    db.query(Evaluation).filter(Evaluation.student_id == student_id).delete(synchronize_session=False)

    db.delete(student)
    db.commit()
    return {"status": "success", "message": "Data siswa berhasil dihapus"}
