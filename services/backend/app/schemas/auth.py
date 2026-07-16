from pydantic import BaseModel, EmailStr, model_validator

from app.schemas.user import UserRead


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserRead
    tokens: TokenPairResponse


class GoogleAuthRequest(BaseModel):
    id_token: str


class OtpRequestSchema(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None

    @model_validator(mode="after")
    def require_email_or_phone(self) -> "OtpRequestSchema":
        if self.email is None and self.phone is None:
            raise ValueError("Either email or phone is required")
        return self


class OtpVerifySchema(OtpRequestSchema):
    code: str


class RefreshRequest(BaseModel):
    refresh_token: str
