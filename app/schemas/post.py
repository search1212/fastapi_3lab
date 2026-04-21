from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PostCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class PostUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class PostRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_id: int
    content: str
    is_edited: bool
    created_at: datetime
    updated_at: datetime

