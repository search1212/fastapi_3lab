from pydantic import BaseModel

from app.db.enums import ReactionType


class ReactionUpdate(BaseModel):
    reaction_type: ReactionType


class ReactionRead(BaseModel):
    post_id: int
    reaction_type: ReactionType


class ReactionCountRead(BaseModel):
    post_id: int
    like: int = 0
    heart: int = 0
    fire: int = 0
    laugh: int = 0
