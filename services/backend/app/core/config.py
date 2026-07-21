from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "PropLease AI"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"

    # Comma-separated allowed origins for CORS in production, e.g.
    # "https://app.example.com,https://www.example.com". Ignored outside
    # production, where all origins are allowed for local dev convenience.
    cors_allowed_origins: str = ""

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/proplease"
    redis_url: str = "redis://localhost:6379/0"

    @field_validator("database_url")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        # Managed Postgres providers (Railway, Heroku, etc.) hand out
        # postgres:// or postgresql:// URLs; SQLAlchemy's async engine needs
        # the +asyncpg driver suffix. Normalize here so no manual URL editing
        # is needed when wiring up a provider's connection string.
        if value.startswith("postgres://"):
            return "postgresql+asyncpg://" + value[len("postgres://") :]
        if value.startswith("postgresql://"):
            return "postgresql+asyncpg://" + value[len("postgresql://") :]
        return value

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 30

    google_client_id: str = ""
    google_client_secret: str = ""

    groq_api_key: str = ""

    # Gates GET /api/v1/admin/seed-properties, a dev/test convenience for
    # inserting dummy listings. Unset (default) disables the endpoint
    # entirely - it 404s regardless of what token is passed.
    admin_seed_token: str = ""

    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    s3_bucket: str = ""
    s3_endpoint_url: str = ""

    # Transactional email (booking confirmations/reschedules). Unset host
    # falls back to ConsoleNotificationSender (logs instead of sending) so
    # local dev never needs real SMTP credentials.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True

    # SSL handling: centralized so no module ever sets verify=False directly.
    # See app.core.http_client for the single HTTP client that reads these.
    disable_ssl_verify: bool = False
    requests_ca_bundle: str = ""
    ssl_cert_file: str = ""

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def cors_allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
