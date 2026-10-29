from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    bio: str | None
    avatar_url: str | None
    is_active: bool
    created_at: datetime


class UserUpdateMe(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    bio: str | None = Field(default=None, max_length=1000)
    avatar_url: str | None = Field(default=None, max_length=1024)
