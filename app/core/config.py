import os

from pydantic import BaseModel, ConfigDict, Field


class Settings(BaseModel):
    model_config = ConfigDict(frozen=True)

    app_name: str = "FastAPI 3Lab"
    database_url: str = Field(default="sqlite+aiosqlite:///./app.db")
    debug: bool = False


def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "FastAPI 3Lab"),
        database_url=os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./app.db"),
        debug=os.getenv("DEBUG", "false").lower() in {"1", "true", "yes", "on"},
    )

