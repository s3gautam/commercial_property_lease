import pytest

from app.core.security import (
    InvalidTokenError,
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_access_token_round_trip() -> None:
    token = create_access_token("user-1")
    payload = decode_token(token, TokenType.ACCESS)
    assert payload.sub == "user-1"
    assert payload.type == TokenType.ACCESS


def test_refresh_token_round_trip() -> None:
    token = create_refresh_token("user-1")
    payload = decode_token(token, TokenType.REFRESH)
    assert payload.sub == "user-1"
    assert payload.type == TokenType.REFRESH


def test_wrong_token_type_is_rejected() -> None:
    access = create_access_token("user-1")
    with pytest.raises(InvalidTokenError):
        decode_token(access, TokenType.REFRESH)


def test_malformed_token_is_rejected() -> None:
    with pytest.raises(InvalidTokenError):
        decode_token("not-a-real-token", TokenType.ACCESS)
