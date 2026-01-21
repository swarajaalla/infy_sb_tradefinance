from pydantic import BaseModel, validator

ALLOWED_ROLES = {"ADMIN", "CORPORATE", "BANK", "AUDITOR"}

class RegisterSchema(BaseModel):
    name: str
    email: str
    password: str
    role: str
    org_name: str

    @validator("role")
    def validate_role(cls, v):
        v = v.upper()
        if v not in ALLOWED_ROLES:
            raise ValueError("Invalid role")
        return v


class LoginSchema(BaseModel):
    email: str
    password: str
