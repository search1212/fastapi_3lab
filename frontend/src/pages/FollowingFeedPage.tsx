import { useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { getFollowingFeed, getMyReactions, getReactionCounts, removeReaction, setReaction } from '../api/posts'
import { useAuth } from '../auth/AuthContext'
import { followUser, getFollowing, getMe, getUserById, unfollowUser } from '../api/users'
import { PostCard } from '../components/PostCard'
import { PageState } from '../components/ui/PageState'
import type { PostAuthorPreview, PostRead, ReactionType } from '../types/api'

export function FollowingFeedPage() {
  const { accessToken } = useAuth()
  const [posts, setPosts] = useState<PostRead[]>([])
  const [authors, setAuthors] = useState<Record<number, PostAuthorPreview>>({})
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({})
  const [myId, setMyId] = useState<number | null>(null)
  const [reactions, setReactions] = useState<Record<number, ReactionType | null>>({})
  const [reactionCounts, setReactionCounts] = useState<Record<number, Record<ReactionType, number>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getFollowingFeed(accessToken)
        setPosts(data)
        const counts = await getReactionCounts(data.map((post) => post.id))
        setReactionCounts(
          Object.fromEntries(
            counts.map((item) => [
              item.post_id,
              { like: item.like, heart: item.heart, fire: item.fire, laugh: item.laugh } as Record<ReactionType, number>,
            ]),
          ),
        )
        const me = await getMe(accessToken)
        setMyId(me.id)
        const following = await getFollowing(me.id, accessToken)
        setFollowingMap(Object.fromEntries(following.map((user) => [user.id, true])))

        const authorIds = Array.from(new Set(data.map((post) => post.author_id)))
        const users = await Promise.all(authorIds.map((authorId) => getUserById(authorId, accessToken)))
        setAuthors(Object.fromEntries(users.map((user) => [user.id, user])))

        const existingReactions = await getMyReactions(accessToken)
        setReactions(
          Object.fromEntries(existingReactions.map((item) => [item.post_id, item.reaction_type])) as Record<
            number,
            ReactionType | null
          >,
        )
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить ленту подписок')
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [accessToken])

  const onToggleFollowAuthor = async (authorId: number, isFollowing: boolean) => {
    if (!accessToken || myId === authorId) return
    try {
      if (isFollowing) {
        await unfollowUser(authorId, accessToken)
        setFollowingMap((prev) => ({ ...prev, [authorId]: false }))
      } else {
        await followUser(authorId, accessToken)
        setFollowingMap((prev) => ({ ...prev, [authorId]: true }))
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось обновить подписку')
    }
  }

  const onReact = async (postId: number, reaction: ReactionType) => {
    if (!accessToken) return
    try {
      const current = reactions[postId] ?? null
      if (current === reaction) {
        await removeReaction(postId, accessToken)
        setReactions((prev) => ({ ...prev, [postId]: null }))
        setReactionCounts((prev) => {
          const postCounts = prev[postId] ?? { like: 0, heart: 0, fire: 0, laugh: 0 }
          return {
            ...prev,
            [postId]: {
              ...postCounts,
              [reaction]: Math.max((postCounts[reaction] ?? 0) - 1, 0),
            },
          }
        })
        return
      }

      await setReaction(postId, reaction, accessToken)
      setReactions((prev) => ({ ...prev, [postId]: reaction }))
      setReactionCounts((prev) => {
        const postCounts = prev[postId] ?? { like: 0, heart: 0, fire: 0, laugh: 0 }
        const nextCounts: Record<ReactionType, number> = { ...postCounts }
        if (current) {
          nextCounts[current] = Math.max((nextCounts[current] ?? 0) - 1, 0)
        }
        nextCounts[reaction] = (nextCounts[reaction] ?? 0) + 1
        return { ...prev, [postId]: nextCounts }
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось поставить реакцию')
    }
  }

  return (
    <section>
      <h2>Лента подписок</h2>
      <PageState
        loading={isLoading ? 'Загружаем посты...' : undefined}
        error={error}
        empty={!isLoading && !error && posts.length === 0 ? 'Пока нет постов от ваших подписок.' : null}
      />
      <div className="stack">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            author={authors[post.author_id]}
            isOwnAuthor={myId === post.author_id}
            isFollowingAuthor={Boolean(followingMap[post.author_id])}
            onToggleFollowAuthor={onToggleFollowAuthor}
            reaction={reactions[post.id] ?? null}
            reactionCounts={reactionCounts[post.id]}
            onReact={(reaction) => onReact(post.id, reaction)}
          />
        ))}
      </div>
    </section>
  )
}
