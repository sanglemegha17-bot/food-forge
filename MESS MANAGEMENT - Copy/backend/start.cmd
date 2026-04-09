@echo off
REM start.cmd - Windows batch version of start script
REM This is for local testing only

echo Installing dependencies...
pip install -r requirements.txt

echo Starting FastAPI server...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
