import os
import json
from datetime import datetime
from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database import get_db
from backend.app.models.evaluation import Evaluation
from backend.app.models.student import Student
from backend.app.models.user import User
from backend.app.auth.jwt import decode_access_token
from backend.app.services.indicators import INDICATORS

templates_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "frontend", "templates"
)
templates = Jinja2Templates(directory=templates_dir)

router = APIRouter(prefix="/evaluations")


def _get_user(token: str, db: Session):
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()


@router.get("", response_class=HTMLResponse)
async def evaluation_list(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role != "admin":
        return RedirectResponse(url="/dashboard")

    evaluations = db.query(Evaluation).order_by(Evaluation.date.desc()).all()
    students = db.query(Student).order_by(Student.name).all()
    students_map = {s.id: s.name for s in students}

    return templates.TemplateResponse(
        request, "evaluations/list.html",
        {
            "evaluations": evaluations,
            "user": user,
            "students_map": students_map
        }
    )


@router.get("/add", response_class=HTMLResponse)
async def evaluation_add_page(request: Request, db: Session = Depends(get_db), student_id: Optional[int] = None):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role != "admin":
        return RedirectResponse(url="/dashboard")

    students = db.query(Student).order_by(Student.name).all()
    
    # Pre-select student and retrieve class & diagnosa
    preselected_student = None
    if student_id:
        preselected_student = db.query(Student).filter(Student.id == student_id).first()

    from datetime import date
    current_date = date.today().strftime('%Y-%m-%d')

    return templates.TemplateResponse(
        request, "evaluations/form.html",
        {
            "user": user,
            "students": students,
            "preselect_student_id": student_id,
            "preselected_student": preselected_student,
            "indicators": INDICATORS,
            "current_date": current_date
        }
    )


@router.post("/add")
async def evaluation_add(
    request: Request,
    student_id: int = Form(...),
    date_str: str = Form(..., alias="date"),
    class_name: str = Form(""),
    diagnosa: str = Form(""),
    db: Session = Depends(get_db),
):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user or user.role != "admin":
        return RedirectResponse(url="/login")

    form_data = await request.form()
    
    # Extract scores
    scores_dict = {}
    
    # Gather items from indicators
    domain_scores = {
        "cognitive": [],
        "motoric": [],
        "language": [],
        "social": [],
        "independence": []
    }
    
    for domain_name, domain_data in INDICATORS.items():
        for item in domain_data["items"]:
            score_val = form_data.get(item["id"])
            if score_val is not None:
                score_int = int(score_val)
                scores_dict[item["id"]] = score_int
                domain_scores[domain_name].append(score_int)
            else:
                scores_dict[item["id"]] = 1 # fallback
                domain_scores[domain_name].append(1)

    # Compute Averages
    avg_cognitive = sum(domain_scores["cognitive"]) / len(domain_scores["cognitive"]) if domain_scores["cognitive"] else 1.0
    avg_motoric = sum(domain_scores["motoric"]) / len(domain_scores["motoric"]) if domain_scores["motoric"] else 1.0
    avg_language = sum(domain_scores["language"]) / len(domain_scores["language"]) if domain_scores["language"] else 1.0
    avg_social = sum(domain_scores["social"]) / len(domain_scores["social"]) if domain_scores["social"] else 1.0
    avg_independence = sum(domain_scores["independence"]) / len(domain_scores["independence"]) if domain_scores["independence"] else 1.0

    # Compute Weighted Composite Index
    # Weights: Cognitive (25%), Motoric (25%), Language (20%), Social (15%), Independence (15%)
    composite_index = (
        (avg_cognitive * 0.25) +
        (avg_motoric * 0.25) +
        (avg_language * 0.20) +
        (avg_social * 0.15) +
        (avg_independence * 0.15)
    )
    composite_index = round(composite_index, 2)

    # Convert to Percentage Index: (Index - 1) / 3 * 100
    index_percentage = round(((composite_index - 1.0) / 3.0) * 100.0, 1)
    if index_percentage < 0.0:
        index_percentage = 0.0

    # Determine Predicate
    # 1.0 - 1.49: BB, 1.5 - 2.49: MB, 2.5 - 3.49: BSH, 3.5 - 4.0: BSB
    if composite_index >= 3.50:
        predicate = "BSB"
    elif composite_index >= 2.50:
        predicate = "BSH"
    elif composite_index >= 1.50:
        predicate = "MB"
    else:
        predicate = "BB"

    eval_date = datetime.strptime(date_str, "%Y-%m-%d").date()

    evaluation = Evaluation(
        student_id=student_id,
        date=eval_date,
        class_name=class_name or None,
        diagnosa=diagnosa or None,
        scores=json.dumps(scores_dict),
        avg_cognitive=avg_cognitive,
        avg_motoric=avg_motoric,
        avg_language=avg_language,
        avg_social=avg_social,
        avg_independence=avg_independence,
        composite_index=composite_index,
        index_percentage=index_percentage,
        predicate=predicate
    )
    
    db.add(evaluation)
    
    # Update student's profile class & diagnosis to reflect the latest evaluation if necessary
    student = db.query(Student).filter(Student.id == student_id).first()
    if student:
        if class_name:
            student.class_name = class_name
        if diagnosa:
            student.special_needs = diagnosa
            
    db.commit()
    
    return RedirectResponse(url="/evaluations/rekap?student_id=" + str(student_id) + "&msg=Penilaian+kuantitatif+berhasil+disimpan", status_code=302)


@router.get("/rekap", response_class=HTMLResponse)
async def evaluation_rekap(request: Request, student_id: Optional[int] = None, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user:
        return RedirectResponse(url="/login")
    if user.role != "admin":
        return RedirectResponse(url="/dashboard")

    students = db.query(Student).order_by(Student.name).all()
    
    # If no student selected, pick the first one if available
    selected_student_id = student_id
    if not selected_student_id and students:
        selected_student_id = students[0].id
        
    selected_student = None
    history = []
    comparison_data = []
    
    # Data structures for Chart.js
    chart_dates = []
    chart_composite = []
    chart_cog = []
    chart_mot = []
    chart_lang = []
    chart_soc = []
    chart_ind = []
    
    # Comparison comparison trends
    comparison_trend = []
    
    if selected_student_id:
        selected_student = db.query(Student).filter(Student.id == selected_student_id).first()
        history = db.query(Evaluation).filter(Evaluation.student_id == selected_student_id).order_by(Evaluation.date.asc()).all()
        
        for ev in history:
            chart_dates.append(ev.date.strftime("%d %b %Y"))
            chart_composite.append(ev.composite_index)
            chart_cog.append(round(ev.avg_cognitive, 2))
            chart_mot.append(round(ev.avg_motoric, 2))
            chart_lang.append(round(ev.avg_language, 2))
            chart_soc.append(round(ev.avg_social, 2))
            chart_ind.append(round(ev.avg_independence, 2))

        # Check if there are at least 2 evaluations for comparison
        if len(history) >= 2:
            last_ev = history[-1]
            prev_ev = history[-2]
            
            domains = [
                ("Kognitif", last_ev.avg_cognitive, prev_ev.avg_cognitive),
                ("Motorik", last_ev.avg_motoric, prev_ev.avg_motoric),
                ("Bahasa & Komunikasi", last_ev.avg_language, prev_ev.avg_language),
                ("Sosial-Emosional", last_ev.avg_social, prev_ev.avg_social),
                ("Kemandirian", last_ev.avg_independence, prev_ev.avg_independence),
            ]
            
            for name, curr, prev in domains:
                diff = curr - prev
                if diff > 0:
                    status = "naik"
                elif diff < 0:
                    status = "turun"
                else:
                    status = "stabil"
                comparison_trend.append({
                    "name": name,
                    "prev": round(prev, 2),
                    "curr": round(curr, 2),
                    "diff": round(abs(diff), 2),
                    "status": status
                })

    # Cross-student comparison table
    # Get the latest evaluation for each student
    for s in students:
        latest_ev = db.query(Evaluation).filter(Evaluation.student_id == s.id).order_by(Evaluation.date.desc()).first()
        comparison_data.append({
            "student": s,
            "latest_evaluation": latest_ev
        })

    return templates.TemplateResponse(
        request, "evaluations/rekap.html",
        {
            "user": user,
            "students": students,
            "selected_student_id": selected_student_id,
            "selected_student": selected_student,
            "history": history[::-1], # newest first for table view
            "comparison_data": comparison_data,
            "comparison_trend": comparison_trend,
            
            # Chart inputs (JSON strings for JS)
            "chart_dates": json.dumps(chart_dates),
            "chart_composite": json.dumps(chart_composite),
            "chart_cog": json.dumps(chart_cog),
            "chart_mot": json.dumps(chart_mot),
            "chart_lang": json.dumps(chart_lang),
            "chart_soc": json.dumps(chart_soc),
            "chart_ind": json.dumps(chart_ind),
        }
    )


@router.get("/{eval_id}/delete")
async def evaluation_delete(eval_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request.cookies.get("access_token"), db)
    if not user or user.role != "admin":
        return RedirectResponse(url="/login")
    
    evaluation = db.query(Evaluation).filter(Evaluation.id == eval_id).first()
    student_id = None
    if evaluation:
        student_id = evaluation.student_id
        db.delete(evaluation)
        db.commit()
        
    url = "/evaluations/rekap"
    if student_id:
        url += "?student_id=" + str(student_id) + "&msg=Penilaian+kuantitatif+berhasil+dihapus"
    else:
        url += "?msg=Penilaian+kuantitatif+berhasil+dihapus"
    return RedirectResponse(url=url, status_code=302)
