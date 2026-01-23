@echo off
call .venv\Scripts\activate

echo Starting Redis...
start cmd /k redis-server

echo Starting FastAPI...
start cmd /k uvicorn app.main:app --reload

echo Starting Celery Worker...
start cmd /k celery -A app.celery_app worker -l info
