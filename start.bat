@echo off
title E-Raport TK ABK - Production Server (FastAPI + React)
cd /d "%~dp0"

echo ========================================================
echo   E-Raport TK ABK - Uvicorn Server (Backend + React)
echo ========================================================

REM Cek apakah dist React sudah ada, jika belum lakukan build
if not exist "frontend-react\dist\index.html" (
    echo [INFO] Melakukan build frontend React pertama kali...
    cd frontend-react
    call npm run build
    cd ..
)

echo [INFO] Menjalankan Uvicorn Server di http://127.0.0.1:8000 ...
python run.py
pause
