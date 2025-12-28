from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session

from .database import get_session
from . import schemas, crud
from .auth import create_access_token, create_refresh_token, verify_password
from .routers import users, documents, ledger

app = FastAPI(title="Trade Finance Backend")


@app.get("/", include_in_schema=False)
def root():
    return {"message": "Trade Finance API running"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/register")
def register_user(
    user_in: schemas.UserCreate,
    session: Session = Depends(get_session),
):
    existing = crud.get_user_by_email(session, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered with this email",
        )

    crud.create_user(
        session=session,
        name=user_in.name,
        email=user_in.email,
        password=user_in.password,
        role=user_in.role,
        org_name=user_in.org_name,
    )

    return {"message": "Registration successful!"}


@auth_router.post("/login", response_model=schemas.Token)
def login(
    data: schemas.LoginRequest,
    session: Session = Depends(get_session),
):
    user = crud.get_user_by_email(session, data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not registered",
        )

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )

    payload = {"sub": str(user.id), "role": user.role}
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    return schemas.Token(
        message="Login successful",
        access_token=access_token,
        refresh_token=refresh_token,
    )


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(ledger.router)

