import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import bcrypt as _bcrypt

from backend.app.database import engine, Base, SessionLocal
from backend.app.models import User, Student, DailyReport, Assessment, Gallery, Evaluation
from backend.app.routers import auth, students, daily_reports, assessments, gallery, reports, evaluations

# ── Create all tables ──────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STATIC_DIR = os.path.join(BASE_DIR, "frontend", "static")

os.makedirs(os.path.join(STATIC_DIR, "uploads"), exist_ok=True)


def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt()).decode()


def seed_admin():
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@rapor.tk").first()
        if not existing:
            admin = User(
                name="Administrator",
                email="admin@rapor.tk",
                hashed_password=hash_password("admin123"),
                role="admin",
            )
            db.add(admin)
            db.commit()
            print("[OK] Admin seeded: admin@rapor.tk / admin123")
    except Exception as e:
        print(f"[WARN] Seed error: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_admin()
    yield


app = FastAPI(title="E-Raport TK ABK", version="1.0.0", lifespan=lifespan)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ───────────────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ── React SPA & Fallback Middleware ───────────────────────────────────────────
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import FileResponse

REACT_DIST_DIR = os.path.join(BASE_DIR, "frontend-react", "dist")

class ReactSPAMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.method == "GET":
            path = request.url.path
            
            # Allow backend static files
            if path.startswith("/static"):
                return await call_next(request)
                
            # Allow backend REST API endpoints
            if "/api/" in path or path.startswith("/api"):
                return await call_next(request)
                
            # If React build output exists, serve it
            if os.path.exists(REACT_DIST_DIR):
                react_index = os.path.join(REACT_DIST_DIR, "index.html")
                if os.path.exists(react_index):
                    # Check if the requested path is a file in the dist directory (e.g. assets, favicon)
                    file_path = os.path.join(REACT_DIST_DIR, path.lstrip("/"))
                    if os.path.isfile(file_path):
                        return FileResponse(file_path)
                    
                    # Fallback to index.html for React Router paths
                    return FileResponse(react_index)
                    
        return await call_next(request)

app.add_middleware(ReactSPAMiddleware)

# ── Include routers ────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(daily_reports.router)
app.include_router(assessments.router)
app.include_router(gallery.router)
app.include_router(reports.router)
app.include_router(evaluations.router)
