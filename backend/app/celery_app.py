from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "trade_integrity",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.integrity"])

# 🔥 REGISTER BEAT SCHEDULE HERE
celery_app.conf.beat_schedule = {
    "run-integrity-check-every-5-min": {
        "task": "app.integrity.tasks.integrity_check_task",
        "schedule": crontab(minute="*/5"),
    }
}

celery_app.conf.timezone = "UTC"
