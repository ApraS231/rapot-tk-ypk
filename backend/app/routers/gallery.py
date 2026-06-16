from fastapi import APIRouter, Depends, Request, Form, File, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import os
import uuid
import shutil

from backend.app.database import get_db
from backend.app.models.gallery import Gallery
from backend.app.models.student import Student
from backend.app.models.user import User
from backend.app.auth.jwt import decode_access_token

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
templates_dir = os.path.join(BASE_DIR, "frontend", "templates")
UPLOAD_DIR = os.path.join(BASE_DIR, "frontend", "static", "uploads")
templates = Jinja2Templates(directory=templates_dir)

os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/gallery")


def _get_user(token: str, db: Session):
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()


@router.get("", response_class=HTMLResponse)
async def gallery_list(request: Request, db: Session = Depends(get_db), student_id: Optional[int] = None):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    query = db.query(Gallery)
    if student_id:
        query = query.filter(Gallery.student_id == student_id)
        
    if user.role == "pendamping":
        query = query.join(Student).filter(Student.teacher_id == user.id)
        students = db.query(Student).filter(Student.teacher_id == user.id).order_by(Student.name).all()
    else:
        students = db.query(Student).order_by(Student.name).all()
        
    items = query.order_by(Gallery.date.desc()).all()
    students_map = {s.id: s.name for s in db.query(Student).all()}
    return templates.TemplateResponse(
        request, "gallery/list.html",
        {
            "items": items, "user": user,
            "students": students, "students_map": students_map,
            "filter_student_id": student_id,
        }
    )


@router.post("/upload")
async def gallery_upload(
    request: Request,
    student_id: int = Form(...),
    description: str = Form(""),
    domain: str = Form(""),
    activity_date: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/gallery")
        
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or student.teacher_id != user.id:
        return RedirectResponse(url="/gallery")
        
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        ext = ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(image.file, f)
    gallery_item = Gallery(
        student_id=student_id,
        image_path=f"/static/uploads/{filename}",
        description=description or None,
        domain=domain or None,
        date=date.fromisoformat(activity_date),
    )
    db.add(gallery_item)
    db.commit()
    return RedirectResponse(url="/gallery?msg=Foto+kegiatan+berhasil+diunggah", status_code=302)


@router.get("/{item_id}/delete")
async def gallery_delete(item_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role == "admin":
        return RedirectResponse(url="/gallery")
        
    item = db.query(Gallery).filter(Gallery.id == item_id).first()
    if item:
        student = db.query(Student).filter(Student.id == item.student_id).first()
        if not student or student.teacher_id != user.id:
            return RedirectResponse(url="/gallery")
            
        rel_path = item.image_path.lstrip("/")
        file_path = os.path.join(BASE_DIR, "frontend", "static", rel_path.replace("static/", "", 1))
        if os.path.exists(file_path):
            os.remove(file_path)
        db.delete(item)
        db.commit()
    return RedirectResponse(url="/gallery?msg=Foto+kegiatan+berhasil+dihapus", status_code=302)
