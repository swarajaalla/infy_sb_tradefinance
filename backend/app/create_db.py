from sqlmodel import Session
from .database import engine, init_db
from . import crud
from .models import Role
from .auth import create_refresh_token

def seed():
    init_db()

    users_to_create = [
        {"name": "Deepu", "email": "deepu@gmail.com", "password": "deepu123", "role": Role.admin, "org_name": "orgA"},
        {"name": "Bunny", "email": "bunny@gmail.com", "password": "bunny123", "role": Role.bank, "org_name": "orgB"},
        {"name": "Charlie", "email": "charlie@gmail.com", "password": "charlie123", "role": Role.corporate, "org_name": "orgC"},
        {"name": "Siva", "email": "siva@gmail.com", "password": "siva123", "role": Role.auditor, "org_name": "orgD"},
    ]

    with Session(engine) as session:
        for u in users_to_create:
            existing = crud.get_user_by_email(session, u["email"])
            if not existing:
                user = crud.create_user(session=session, name=u["name"], email=u["email"], password=u["password"], role=u["role"], org_name=u["org_name"])
                payload = {"sub": str(user.id), "role": user.role if not hasattr(user.role, "value") else user.role.value}
                refresh = create_refresh_token(payload)
                crud.set_refresh_token_for_user(session, user, refresh)
            else:
                if not getattr(existing, "refresh_token", None):
                    payload = {"sub": str(existing.id), "role": existing.role if not hasattr(existing.role, "value") else existing.role.value}
                    refresh = create_refresh_token(payload)
                    crud.set_refresh_token_for_user(session, existing, refresh)

    print("Seeded default users.")

if __name__ == "__main__":
    print("Creating database and tables + seeding users...")
    seed()
    print("Done.")
