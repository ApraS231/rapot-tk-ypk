# pyrefly: ignore [missing-import]
import os
import subprocess
import sys
import uvicorn

def start_vite():
    # Path to the frontend-react folder
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend-react")
    
    if os.path.exists(frontend_dir):
        print("\n[INFO] Menjalankan Vite development server (npm run dev)...")
        # Use shell=True for Windows compatibility with npm commands
        try:
            process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=frontend_dir,
                shell=True
            )
            return process
        except Exception as e:
            print(f"[WARN] Gagal memulai Vite server: {e}")
            return None
    else:
        print("[WARN] Direktori frontend-react tidak ditemukan. Menjalankan backend saja.")
        return None

if __name__ == "__main__":
    vite_process = start_vite()
    
    try:
        uvicorn.run(
            "backend.app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
        )
    except KeyboardInterrupt:
        pass
    finally:
        if vite_process:
            print("\n[INFO] Menghentikan Vite development server...")
            try:
                if sys.platform == "win32":
                    # On Windows, terminate the shell wrapper and all its child processes (Node/Vite)
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(vite_process.pid)],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )
                else:
                    vite_process.terminate()
            except Exception:
                pass
            print("[INFO] Server Vite berhasil dihentikan.")
