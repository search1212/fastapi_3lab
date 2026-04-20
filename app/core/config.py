import os

from pydantic import BaseModel, ConfigDict, Field


class Settings(BaseModel):
    model_config = ConfigDict(frozen=True)

    app_name: str = "FastAPI 3Lab"
    database_url: str = Field(default="sqlite+aiosqlite:///./app.db")
    debug: bool = False
    jwt_secret_key: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 14


def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "FastAPI 3Lab"),
        database_url=os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./app.db"),
        debug=os.getenv("DEBUG", "false").lower() in {"1", "true", "yes", "on"},
        jwt_secret_key=os.getenv("JWT_SECRET_KEY", "change-me-in-prod"),
        jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        access_token_ttl_minutes=int(os.getenv("ACCESS_TOKEN_TTL_MINUTES", "30")),
        refresh_token_ttl_days=int(os.getenv("REFRESH_TOKEN_TTL_DAYS", "14")),
    )

