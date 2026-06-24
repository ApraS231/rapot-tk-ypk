import os
import sys
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# Add the project root directory to the python path to allow importing app modules
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, PROJECT_ROOT)

from dotenv import load_dotenv
load_dotenv()

from backend.app.models import User, Student, DailyReport, Assessment, Gallery, Evaluation

def run_migration():
    # 1. Locate the source SQLite database
    sqlite_paths = [
        os.path.join(PROJECT_ROOT, "rapor_tk.db"),
        os.path.join(PROJECT_ROOT, "backend", "rapor_tk.db"),
    ]
    
    source_db_path = None
    for path in sqlite_paths:
        if os.path.exists(path):
            source_db_path = path
            break
            
    if not source_db_path:
        print("[-] Error: File SQLite database (rapor_tk.db) tidak ditemukan!")
        print("    Harap letakkan file 'rapor_tk.db' Anda di root directory proyek ini:")
        print(f"    -> {os.path.join(PROJECT_ROOT, 'rapor_tk.db')}")
        print("    lalu jalankan kembali script ini.")
        return
        
    print(f"[+] Menemukan database SQLite di: {source_db_path}")
    
    # 2. Get target MySQL connection URL
    mysql_url = os.getenv("DATABASE_URL")
    if not mysql_url or mysql_url.startswith("sqlite"):
        print("[-] Error: URL database MySQL tidak ditemukan di .env atau masih diatur ke SQLite.")
        print("    Periksa file '.env' Anda dan pastikan DATABASE_URL berisi koneksi MySQL.")
        return
        
    print(f"[+] Menghubungkan ke MySQL database...")
    
    try:
        # Create Engines and Sessions
        sqlite_engine = create_engine(f"sqlite:///{source_db_path}")
        mysql_engine = create_engine(mysql_url)
        
        SqliteSession = sessionmaker(bind=sqlite_engine)
        MysqlSession = sessionmaker(bind=mysql_engine)
        
        sqlite_session = SqliteSession()
        mysql_session = MysqlSession()
        
        # Models in order of dependencies (to avoid foreign key errors)
        models_to_migrate = [
            User,          # Level 0 (no dependencies)
            Student,       # Level 1 (depends on User)
            DailyReport,   # Level 2 (depends on Student, User)
            Assessment,    # Level 2 (depends on Student)
            Gallery,       # Level 2 (depends on Student)
            Evaluation     # Level 2 (depends on Student)
        ]
        
        print("[+] Memulai migrasi data...")
        for model in models_to_migrate:
            table_name = model.__tablename__
            print(f"    -> Memigrasikan tabel: '{table_name}'...")
            
            # Fetch all records from SQLite
            sqlite_records = sqlite_session.query(model).all()
            if not sqlite_records:
                print(f"       [Info] Tabel '{table_name}' kosong di SQLite.")
                continue
                
            count = 0
            for record in sqlite_records:
                # Extract all attributes of the record dynamically
                attrs = {
                    col.key: getattr(record, col.key)
                    for col in inspect(model).mapper.column_attrs
                }
                
                # Create a new model instance with the same attributes (and exact ID)
                new_record = model(**attrs)
                
                # Merge into MySQL (inserts or updates if ID exists)
                mysql_session.merge(new_record)
                count += 1
                
            mysql_session.commit()
            print(f"       [Sukses] Berhasil memigrasikan {count} baris data ke tabel '{table_name}'.")
            
        print("[+] Migrasi database selesai dengan sukses!")
        
    except Exception as e:
        print(f"[-] Terjadi kesalahan saat migrasi: {e}")
        if 'mysql_session' in locals():
            mysql_session.rollback()
    finally:
        if 'sqlite_session' in locals():
            sqlite_session.close()
        if 'mysql_session' in locals():
            mysql_session.close()

if __name__ == "__main__":
    run_migration()
