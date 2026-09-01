import os
import sys
import subprocess
import signal
import time

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend-react")

processes = []

def signal_handler(sig, frame):
    print("\n[INFO] Menghentikan semua service (Uvicorn & Vite)...")
    for p in processes:
        try:
            if sys.platform == "win32":
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                p.terminate()
        except Exception:
            pass
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, signal_handler)

    print("=" * 65)
    print("🚀 Mode Pengembangan (Dual Dev Server): Uvicorn + Vite React")
    print("📍 Backend FastAPI (Uvicorn) : http://127.0.0.1:8000")
    print("🎨 Frontend React  (Vite)    : http://localhost:5173")
    print("💡 Tekan Ctrl + C untuk menghentikan kedua server.")
    print("=" * 65)

    # 1. Jalankan Backend FastAPI via Uvicorn
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=ROOT_DIR)
    processes.append(backend_proc)

    # Beri jeda 1 detik sebelum frontend menyala
    time.sleep(1)

    # 2. Jalankan Frontend React via Vite Dev Server
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=FRONTEND_DIR)
    processes.append(frontend_proc)

    try:
        while True:
            time.sleep(1)
            # Cek jika ada proses yang keluar lebih awal
            for p in processes:
                if p.poll() is not None:
                    signal_handler(None, None)
    except KeyboardInterrupt:
        signal_handler(None, None)
