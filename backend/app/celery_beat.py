from celery.schedules import crontab
from app.celery_app import celery_app

celery_app.conf.beat_schedule = {
    "run-integrity-check-every-5-min": {
        "task": "app.integrity.tasks.integrity_check_task",
        "schedule": crontab(minute="*/5"),
    }
}
