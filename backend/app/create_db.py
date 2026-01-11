from sqlmodel import Session
from .database import engine, init_db
from . import crud
from .models import Role

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
                crud.create_user(
                    session=session,
                    name=u["name"],
                    email=u["email"],
                    password=u["password"],
                    role=u["role"],
                    org_name=u["org_name"],
                )

    print("Seeded default users.")

if __name__ == "__main__":
    print("Creating database and tables + seeding users...")
    seed()
    print("Done.")
