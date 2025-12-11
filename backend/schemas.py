from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    org_name: str

class UserLogin(BaseModel):
    username: str
    password: str
