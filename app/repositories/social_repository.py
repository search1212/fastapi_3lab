from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import ReactionType
from app.db.models import Reaction, Subscription, User


class SocialRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._db = session

    async def follow(self, follower_id: int, followed_id: int) -> Subscription:
        existing = await self._db.execute(
            select(Subscription).where(
                Subscription.follower_id == follower_id,
                Subscription.followed_id == followed_id,
            )
        )
        found = existing.scalar_one_or_none()
        if found:
            return found

        link = Subscription(follower_id=follower_id, followed_id=followed_id)
        self._db.add(link)
        await self._db.flush()
        return link

    async def unfollow(self, follower_id: int, followed_id: int) -> None:
        await self._db.execute(
            delete(Subscription).where(
                Subscription.follower_id == follower_id,
                Subscription.followed_id == followed_id,
            )
        )
        await self._db.flush()

    async def list_followers(self, user_id: int, limit: int = 50) -> list[User]:
        rows = await self._db.execute(
            select(User)
            .join(Subscription, Subscription.follower_id == User.id)
            .where(Subscription.followed_id == user_id)
            .limit(limit)
        )
        return list(rows.scalars().all())

    async def list_following(self, user_id: int, limit: int = 50) -> list[User]:
        rows = await self._db.execute(
            select(User)
            .join(Subscription, Subscription.followed_id == User.id)
            .where(Subscription.follower_id == user_id)
            .limit(limit)
        )
        return list(rows.scalars().all())

    async def set_reaction(self, user_id: int, post_id: int, reaction_type: ReactionType) -> Reaction:
        rows = await self._db.execute(
            select(Reaction).where(and_(Reaction.user_id == user_id, Reaction.post_id == post_id))
        )
        current = rows.scalar_one_or_none()
        if current is None:
            current = Reaction(user_id=user_id, post_id=post_id, reaction_type=reaction_type)
            self._db.add(current)
        else:
            current.reaction_type = reaction_type
        await self._db.flush()
        return current

    async def remove_reaction(self, user_id: int, post_id: int) -> None:
        await self._db.execute(delete(Reaction).where(Reaction.user_id == user_id, Reaction.post_id == post_id))
        await self._db.flush()

    async def list_user_reactions(self, user_id: int) -> list[Reaction]:
        rows = await self._db.execute(select(Reaction).where(Reaction.user_id == user_id))
        return list(rows.scalars().all())

    async def get_reaction_counts(self, post_ids: list[int]) -> dict[int, dict[ReactionType, int]]:
        if not post_ids:
            return {}

        rows = await self._db.execute(
            select(Reaction.post_id, Reaction.reaction_type, func.count())
            .where(Reaction.post_id.in_(post_ids))
            .group_by(Reaction.post_id, Reaction.reaction_type)
        )

        totals: dict[int, dict[ReactionType, int]] = {}
        for post_id, reaction_type, amount in rows.all():
            bucket = totals.setdefault(post_id, {})
            bucket[reaction_type] = int(amount)
        return totals
