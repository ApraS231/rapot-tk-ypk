import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session

import bcrypt as _bcrypt

from backend.app.database import engine, Base, SessionLocal
from backend.app.models import User, Student, DailyReport, Assessment, Gallery, Evaluation
from backend.app.routers import auth, students, daily_reports, assessments, gallery, reports, evaluations

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STATIC_DIR = os.path.join(BASE_DIR, "frontend", "static")
REACT_DIST_DIR = os.path.join(BASE_DIR, "frontend-react", "dist")
REACT_ASSETS_DIR = os.path.join(REACT_DIST_DIR, "assets")

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
    try:
        Base.metadata.create_all(bind=engine)
        seed_admin()
    except Exception as e:
        print(f"[WARN] Database initialization: Pastikan MySQL di Laragon sudah berjalan. ({e})")
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


# ── SPA Middleware for React Frontend ─────────────────────────────────────────
class SPAMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        api_prefixes = (
            "/api",
            "/students/api",
            "/daily-reports/api",
            "/assessments/api",
            "/gallery/api",
            "/evaluations/api",
            "/reports/api",
            "/static",
            "/assets",
            "/docs",
            "/openapi.json",
            "/redoc",
        )
        # Pass API and static requests straight to FastAPI routes
        if any(path.startswith(prefix) for prefix in api_prefixes):
            return await call_next(request)

        # Check if React dist is present
        if os.path.exists(REACT_DIST_DIR):
            # Check for direct file in dist root (favicon.svg, icons.svg, etc.)
            dist_file = os.path.join(REACT_DIST_DIR, path.lstrip("/"))
            if path != "/" and os.path.isfile(dist_file):
                return FileResponse(dist_file)

            # Serve React SPA index.html for page navigation
            index_path = os.path.join(REACT_DIST_DIR, "index.html")
            if request.method == "GET" and os.path.isfile(index_path):
                return FileResponse(index_path)

        return await call_next(request)


app.add_middleware(SPAMiddleware)

# ── Static files & Assets ──────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if os.path.exists(REACT_ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=REACT_ASSETS_DIR), name="react-assets")

# ── Include routers ────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(daily_reports.router)
app.include_router(assessments.router)
app.include_router(gallery.router)
app.include_router(reports.router)
app.include_router(evaluations.router)

