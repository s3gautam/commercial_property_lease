from dataclasses import dataclass

from app.core.config import get_settings
from app.core.http_client import get_http_client

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class GoogleTokenError(Exception):
    pass


@dataclass
class GoogleIdentity:
    google_id: str
    email: str
    email_verified: bool


class GoogleOAuthService:
    async def verify_id_token(self, id_token: str) -> GoogleIdentity:
        settings = get_settings()
        client = get_http_client()

        response = await client.get(GOOGLE_TOKENINFO_URL, params={"id_token": id_token})
        if response.status_code != 200:
            raise GoogleTokenError("Invalid Google ID token")

        payload = response.json()

        if payload.get("aud") != settings.google_client_id:
            raise GoogleTokenError("Token audience does not match this application")

        return GoogleIdentity(
            google_id=payload["sub"],
            email=payload["email"],
            email_verified=payload.get("email_verified") == "true",
        )
