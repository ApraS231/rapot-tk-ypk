# pyrefly: ignore [missing-import]
import os
import sys
import uvicorn

# Get the project root directory (parent of frontend folder)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Add root folder to sys.path to ensure backend module is discoverable by uvicorn
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

if __name__ == "__main__":
    try:
        uvicorn.run(
            "backend.app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
        )
    except KeyboardInterrupt:
        pass
