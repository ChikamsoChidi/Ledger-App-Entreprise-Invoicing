from pydantic import BaseModel, EmailStr, Field

class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    company_name: str = Field(..., min_length=2, description="The name of the SME")

class UserSignupResponse(BaseModel):
    user_id: str
    tenant_id: str
    message: str
    access_token: str

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    tenant_id: str