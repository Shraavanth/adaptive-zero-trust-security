@echo off
echo ========================================================
echo Running Adaptive Zero Trust Automated Test Suite...
echo ========================================================
cd /d "%~dp0\..\backend"
pytest tests/ -v
pause
