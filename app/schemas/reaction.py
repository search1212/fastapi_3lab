from pydantic import BaseModel

from app.db.enums import ReactionType


class ReactionUpdate(BaseModel):
    reaction_type: ReactionType


class ReactionRead(BaseModel):
    post_id: int
    reaction_type: ReactionType

