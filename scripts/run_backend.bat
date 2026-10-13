@echo off
echo ========================================================
echo Starting Adaptive Zero Trust FastAPI Backend...
echo ========================================================
cd /d "%~dp0\..\backend"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
