import os
import sys
import json
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the project root directory to the python path
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, PROJECT_ROOT)

from dotenv import load_dotenv
load_dotenv()

from backend.app.database import engine, SessionLocal
from backend.app.models.user import User
from backend.app.models.student import Student
from backend.app.models.daily_report import DailyReport
from backend.app.models.assessment import Assessment
from backend.app.models.gallery import Gallery
from backend.app.models.evaluation import Evaluation

def seed_data():
    db = SessionLocal()
    try:
        print("[+] Starting database seeding...")

        # 1. Check or seed pendamping user
        pendamping = db.query(User).filter(User.email == "pendamping@rapor.tk").first()
        if not pendamping:
            import bcrypt as _bcrypt
            hashed = _bcrypt.hashpw("pin123".encode(), _bcrypt.gensalt()).decode()
            pendamping = User(
                name="Guru Pendamping",
                email="pendamping@rapor.tk",
                hashed_password=hashed,
                role="pendamping"
            )
            db.add(pendamping)
            db.commit()
            db.refresh(pendamping)
            print("[+] Seeded shadow teacher: pendamping@rapor.tk")
        else:
            print("[Info] Shadow teacher pendamping@rapor.tk already exists")

        # 2. Seed Students (if empty)
        student_count = db.query(Student).count()
        if student_count == 0:
            students = [
                Student(id=1, name="Apin", age=6, birth_date="2020-04-12", special_needs="Autisme Ringan", class_name="TK A", teacher_id=pendamping.id),
                Student(id=2, name="Budi", age=5, birth_date="2021-06-18", special_needs="Down Syndrome", class_name="TK A", teacher_id=pendamping.id),
                Student(id=3, name="Cici", age=6, birth_date="2020-09-05", special_needs="Speech Delay", class_name="TK B", teacher_id=pendamping.id),
                Student(id=4, name="Dino", age=5, birth_date="2021-11-22", special_needs="ADHD", class_name="TK B", teacher_id=pendamping.id),
            ]
            for s in students:
                db.add(s)
            db.commit()
            print("[+] Seeded 4 students: Apin, Budi, Cici, Dino")
        else:
            print("[Info] Students table is not empty. Skipping student seeding.")

        # Let's get all students in db
        all_students = db.query(Student).all()

        # 3. Seed Daily Reports
        report_count = db.query(DailyReport).count()
        if report_count == 0:
            daily_reports = []
            for s in all_students:
                # Add 3 daily reports for each student
                daily_reports.append(DailyReport(
                    student_id=s.id,
                    date=date(2026, 6, 25),
                    notes=f"{s.name} menunjukkan konsentrasi yang baik saat sesi belajar pagi hari.",
                    behavior="Sangat kooperatif dan tenang saat diarahkan oleh guru pendamping.",
                    social_interaction="Mulai berani menyapa teman sebangku dan mau berbagi krayon warna.",
                    created_by=pendamping.id
                ))
                daily_reports.append(DailyReport(
                    student_id=s.id,
                    date=date(2026, 6, 26),
                    notes=f"{s.name} berhasil menyelesaikan latihan motorik halus dengan rapi.",
                    behavior="Sempat gelisah di siang hari tetapi mereda setelah diajak berjalan-jalan sejenak.",
                    social_interaction="Mengikuti permainan kelompok kecil dengan bimbingan penuh.",
                    created_by=pendamping.id
                ))
                daily_reports.append(DailyReport(
                    student_id=s.id,
                    date=date(2026, 6, 27),
                    notes=f"{s.name} sangat antusias saat mendengarkan cerita interaktif dari buku gambar.",
                    behavior="Fokus dan bersemangat, merespon cerita dengan senyuman dan gestur tubuh.",
                    social_interaction="Bertepuk tangan bersama teman-teman saat cerita selesai.",
                    created_by=pendamping.id
                ))
            for r in daily_reports:
                db.add(r)
            db.commit()
            print(f"[+] Seeded {len(daily_reports)} daily reports")
        else:
            print("[Info] Daily reports table is not empty. Skipping daily report seeding.")

        # 4. Seed Gallery items
        gallery_count = db.query(Gallery).count()
        if gallery_count == 0:
            gallery_items = []
            for s in all_students:
                gallery_items.append(Gallery(
                    student_id=s.id,
                    image_path="/static/YPK_LOGO.png",
                    description=f"{s.name} meronce manik-manik warna-warni untuk melatih ketangkasan jemari.",
                    domain="Motorik",
                    date=date(2026, 6, 25)
                ))
                gallery_items.append(Gallery(
                    student_id=s.id,
                    image_path="/static/YPK_LOGO.png",
                    description=f"{s.name} mengelompokkan balok kayu berbentuk segitiga dan persegi.",
                    domain="Kognitif",
                    date=date(2026, 6, 26)
                ))
            for g in gallery_items:
                db.add(g)
            db.commit()
            print(f"[+] Seeded {len(gallery_items)} gallery items")
        else:
            print("[Info] Gallery table is not empty. Skipping gallery seeding.")

        # 5. Seed Qualitative Assessments
        assessment_count = db.query(Assessment).count()
        if assessment_count == 0:
            assessments = []
            for s in all_students:
                assessments.append(Assessment(
                    student_id=s.id,
                    period="Semester 1 2025/2026",
                    motoric=f"{s.name} menunjukkan perkembangan motorik kasar yang baik seperti berjalan lurus dan melompat rintangan. Motorik halus (menggunting dan memegang krayon) mulai stabil meskipun masih membutuhkan bimbingan untuk presisi.",
                    language=f"{s.name} merespon instruksi sederhana dengan baik. Kosakata verbal bertambah, mampu menyusun kalimat pendek yang dipahami lingkungan sekitar.",
                    social=f"{s.name} senang berada di antara teman-teman. Terkadang mengalami tantrum ringan saat lelah, namun cepat ditenangkan dengan teknik relaksasi.",
                    cognitive=f"{s.name} sangat baik dalam mengenali bentuk geometri dan warna dasar. Fokus bertahan hingga 10-15 menit untuk tugas terstruktur.",
                    independence=f"{s.name} mandiri dalam makan dan minum dengan sendok, serta merapikan tas sekolah setelah digunakan. Proses toilet training masih berjalan.",
                    summary=f"Secara umum, {s.name} mengalami kemajuan emosional dan sosial yang signifikan. Orang tua diharapkan melanjutkan stimulasi toilet training dan melatih kemandirian di rumah."
                ))
            for a in assessments:
                db.add(a)
            db.commit()
            print(f"[+] Seeded {len(assessments)} qualitative assessments")
        else:
            print("[Info] Assessments table is not empty. Skipping assessments seeding.")

        # 6. Seed Evaluations
        evaluation_count = db.query(Evaluation).count()
        if evaluation_count == 0:
            evaluations = []
            
            # Helper to build evaluation row
            def build_eval(student_id, eval_date, class_name, diagnosa, score_map):
                domain_scores = {
                    "cognitive": [],
                    "motoric": [],
                    "language": [],
                    "social": [],
                    "independence": []
                }
                
                # Indicator mappings
                indicators_map = {
                    "c1": "cognitive", "c2": "cognitive", "c3": "cognitive", "c4": "cognitive",
                    "m1": "motoric", "m2": "motoric", "m3": "motoric", "m4": "motoric",
                    "l1": "language", "l2": "language", "l3": "language", "l4": "language",
                    "s1": "social", "s2": "social", "s3": "social", "s4": "social",
                    "i1": "independence", "i2": "independence", "i3": "independence", "i4": "independence"
                }
                
                for k, v in score_map.items():
                    dom = indicators_map[k]
                    domain_scores[dom].append(v)
                    
                avg_cognitive = sum(domain_scores["cognitive"]) / len(domain_scores["cognitive"])
                avg_motoric = sum(domain_scores["motoric"]) / len(domain_scores["motoric"])
                avg_language = sum(domain_scores["language"]) / len(domain_scores["language"])
                avg_social = sum(domain_scores["social"]) / len(domain_scores["social"])
                avg_independence = sum(domain_scores["independence"]) / len(domain_scores["independence"])
                
                composite_index = (
                    (avg_cognitive * 0.25) +
                    (avg_motoric * 0.25) +
                    (avg_language * 0.20) +
                    (avg_social * 0.15) +
                    (avg_independence * 0.15)
                )
                
                index_percentage = round(((composite_index - 1.0) / 3.0) * 100.0, 1)
                if index_percentage < 0.0:
                    index_percentage = 0.0
                    
                if composite_index >= 3.50:
                    predicate = "BSB"
                elif composite_index >= 2.50:
                    predicate = "BSH"
                elif composite_index >= 1.50:
                    predicate = "MB"
                else:
                    predicate = "BB"
                    
                return Evaluation(
                    student_id=student_id,
                    date=eval_date,
                    class_name=class_name,
                    diagnosa=diagnosa,
                    scores=json.dumps(score_map),
                    avg_cognitive=avg_cognitive,
                    avg_motoric=avg_motoric,
                    avg_language=avg_language,
                    avg_social=avg_social,
                    avg_independence=avg_independence,
                    composite_index=composite_index,
                    index_percentage=index_percentage,
                    predicate=predicate
                )

            for s in all_students:
                # Seeding an earlier assessment with lower scores
                early_scores = {
                    "c1": 2, "c2": 2, "c3": 1, "c4": 1,
                    "m1": 2, "m2": 1, "m3": 2, "m4": 1,
                    "l1": 2, "l2": 1, "l3": 2, "l4": 1,
                    "s1": 1, "s2": 2, "s3": 1, "s4": 2,
                    "i1": 2, "i2": 1, "i3": 1, "i4": 2
                }
                evaluations.append(build_eval(s.id, date(2026, 5, 15), s.class_name, s.special_needs, early_scores))
                
                # Seeding a later assessment showing improvements
                late_scores = {
                    "c1": 3, "c2": 3, "c3": 2, "c4": 2,
                    "m1": 3, "m2": 2, "m3": 3, "m4": 2,
                    "l1": 3, "l2": 3, "l3": 3, "l4": 2,
                    "s1": 2, "s2": 3, "s3": 2, "s4": 3,
                    "i1": 3, "i2": 2, "i3": 2, "i4": 3
                }
                evaluations.append(build_eval(s.id, date(2026, 6, 28), s.class_name, s.special_needs, late_scores))

            for ev in evaluations:
                db.add(ev)
            db.commit()
            print(f"[+] Seeded {len(evaluations)} evaluations")
        else:
            print("[Info] Evaluations table is not empty. Skipping evaluations seeding.")

        print("[+] Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[-] Database seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
