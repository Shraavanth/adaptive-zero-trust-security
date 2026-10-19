@echo off
echo ========================================================
echo Running Adaptive Zero Trust Automated Test Suite...
echo ========================================================
cd /d "%~dp0\..\backend"
python run_tests.py
pause
