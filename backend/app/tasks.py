from app.celery_app import celery_app
from app import crud
from app.models import User

@celery_app.task(name="app.tasks.run_integrity_task")
def run_integrity_task(actor_id: int, document_ids=None):
    from app.database import engine
    from sqlmodel import Session

    with Session(engine) as session:
        actor = session.get(User, actor_id)
        if not actor:
            return {"error": "Actor not found"}

        return crud.run_integrity_check(
            session=session,
            actor=actor,
            document_ids=document_ids,
        )
