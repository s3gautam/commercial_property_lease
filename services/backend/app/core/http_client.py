"""Centralized HTTP client factory.

Every outbound HTTP call (Groq, Google OAuth, S3-compatible storage, etc.)
must go through `get_http_client()` so SSL/TLS verification behavior is
configured in exactly one place. Never instantiate httpx clients elsewhere
and never pass verify=False directly in application code.
"""

from functools import lru_cache

import httpx

from app.core.config import get_settings


def _resolve_verify() -> bool | str:
    settings = get_settings()

    if settings.disable_ssl_verify:
        if settings.is_production:
            raise RuntimeError("DISABLE_SSL_VERIFY must never be enabled in production")
        return False

    if settings.ssl_cert_file:
        return settings.ssl_cert_file

    if settings.requests_ca_bundle:
        return settings.requests_ca_bundle

    return True


@lru_cache
def get_http_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(verify=_resolve_verify(), timeout=30.0)
