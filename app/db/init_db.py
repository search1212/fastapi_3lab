from app.db.base import Base
from app.db.models import AuthSession, Post, Reaction, Subscription, User
from app.db.session import engine


async def init_db() -> None:
    _ = (User, AuthSession, Post, Subscription, Reaction)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
