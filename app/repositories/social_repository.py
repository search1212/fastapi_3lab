from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import ReactionType
from app.db.models import Reaction, Subscription, User


class SocialRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def follow(self, follower_id: int, followed_id: int) -> Subscription:
        existing = await self.session.execute(
            select(Subscription).where(
                Subscription.follower_id == follower_id,
                Subscription.followed_id == followed_id,
            )
        )
        row = existing.scalar_one_or_none()
        if row:
            return row
        follow = Subscription(follower_id=follower_id, followed_id=followed_id)
        self.session.add(follow)
        await self.session.flush()
        return follow

    async def unfollow(self, follower_id: int, followed_id: int) -> None:
        await self.session.execute(
            delete(Subscription).where(
                Subscription.follower_id == follower_id,
                Subscription.followed_id == followed_id,
            )
        )
        await self.session.flush()

    async def list_followers(self, user_id: int, limit: int = 50) -> list[User]:
        result = await self.session.execute(
            select(User)
            .join(Subscription, Subscription.follower_id == User.id)
            .where(Subscription.followed_id == user_id)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_following(self, user_id: int, limit: int = 50) -> list[User]:
        result = await self.session.execute(
            select(User)
            .join(Subscription, Subscription.followed_id == User.id)
            .where(Subscription.follower_id == user_id)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def set_reaction(self, user_id: int, post_id: int, reaction_type: ReactionType) -> Reaction:
        result = await self.session.execute(
            select(Reaction).where(and_(Reaction.user_id == user_id, Reaction.post_id == post_id))
        )
        reaction = result.scalar_one_or_none()
        if reaction is None:
            reaction = Reaction(user_id=user_id, post_id=post_id, reaction_type=reaction_type)
            self.session.add(reaction)
        else:
            reaction.reaction_type = reaction_type
        await self.session.flush()
        return reaction

    async def remove_reaction(self, user_id: int, post_id: int) -> None:
        await self.session.execute(delete(Reaction).where(Reaction.user_id == user_id, Reaction.post_id == post_id))
        await self.session.flush()

    async def list_user_reactions(self, user_id: int) -> list[Reaction]:
        result = await self.session.execute(select(Reaction).where(Reaction.user_id == user_id))
        return list(result.scalars().all())

    async def get_reaction_counts(self, post_ids: list[int]) -> dict[int, dict[ReactionType, int]]:
        if not post_ids:
            return {}
        result = await self.session.execute(
            select(Reaction.post_id, Reaction.reaction_type, func.count())
            .where(Reaction.post_id.in_(post_ids))
            .group_by(Reaction.post_id, Reaction.reaction_type)
        )
        rows = result.all()
        counts: dict[int, dict[ReactionType, int]] = {}
        for post_id, reaction_type, count in rows:
            bucket = counts.setdefault(post_id, {})
            bucket[reaction_type] = int(count)
        return counts

