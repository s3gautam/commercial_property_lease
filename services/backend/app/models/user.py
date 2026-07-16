import enum
import uuid

from sqlalchemy import CheckConstraint, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedModel


class UserRole(str, enum.Enum):
    TENANT = "tenant"
    LANDLORD = "landlord"
    BROKER = "broker"
    ADMIN = "admin"


class User(TimestampedModel):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("email IS NOT NULL OR phone IS NOT NULL", name="ck_users_email_or_phone"),
    )

    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), unique=True, index=True, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), default=UserRole.TENANT, nullable=False
    )
    google_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    is_email_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    is_phone_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    tenant_profile: Mapped["TenantProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class TenantProfile(TimestampedModel):
    __tablename__ = "tenant_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    business_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    user: Mapped["User"] = relationship(back_populates="tenant_profile")
