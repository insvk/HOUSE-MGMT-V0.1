import os
import sys

# Ensure backend root is in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import time_api, email_api

app = FastAPI(title="Madura House Maintenance API")

# Configure CORS for local development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve API routes
app.include_router(time_api.router, prefix="/api")
app.include_router(email_api.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running successfully."}

# Mount static frontend if running standalone locally
frontend_path = os.path.join(_current_dir, "..", "frontend")
if os.path.exists(frontend_path):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")


