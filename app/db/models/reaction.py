from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.enums import ReactionType


class Reaction(Base):
    __tablename__ = "reactions"
    __table_args__ = (Index("ix_reactions_post_id_reaction_type", "post_id", "reaction_type"),)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    post_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("posts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    reaction_type: Mapped[ReactionType] = mapped_column(
        Enum(ReactionType, name="reaction_type_enum"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
