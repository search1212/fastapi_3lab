import uuid
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from app.core.config import get_settings

_settings = get_settings()


def create_access_token(user_id: int) -> str:
    lifetime = timedelta(minutes=_settings.access_token_ttl_minutes)
    return _build_jwt(user_id, "access", lifetime)


def create_refresh_token(user_id: int) -> str:
    lifetime = timedelta(days=_settings.refresh_token_ttl_days)
    return _build_jwt(user_id, "refresh", lifetime)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, _settings.jwt_secret_key, algorithms=[_settings.jwt_algorithm])
    except JWTError as error:
        raise ValueError("Invalid token") from error


def _build_jwt(user_id: int, token_type: str, expires_delta: timedelta) -> str:
    issued_at = datetime.now(UTC)
    claims = {
        "sub": str(user_id),
        "type": token_type,
        "iat": int(issued_at.timestamp()),
        "exp": int((issued_at + expires_delta).timestamp()),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(claims, _settings.jwt_secret_key, algorithm=_settings.jwt_algorithm)
