import { useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import {
  getFollowingFeed,
  getMyReactions,
  getReactionCounts,
  removeReaction,
  setReaction,
} from '../api/posts'
import { followUser, getFollowing, getMe, getUserById, unfollowUser } from '../api/users'
import { useAuth } from '../auth/AuthContext'
import { PostCard } from '../components/PostCard'
import { PageState } from '../components/ui/PageState'
import type { PostAuthorPreview, PostRead, ReactionType } from '../types/api'

const EMPTY_COUNTS: Record<ReactionType, number> = { like: 0, heart: 0, fire: 0, laugh: 0 }

export function FollowingFeedPage() {
  const { accessToken } = useAuth()
  const [items, setItems] = useState<PostRead[]>([])
  const [authorsById, setAuthorsById] = useState<Record<number, PostAuthorPreview>>({})
  const [followingById, setFollowingById] = useState<Record<number, boolean>>({})
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [myReactions, setMyReactions] = useState<Record<number, ReactionType | null>>({})
  const [countsByPost, setCountsByPost] = useState<Record<number, Record<ReactionType, number>>>({})
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return

    const loadFeed = async () => {
      setLoading(true)
      setErrorText(null)
      try {
        const feed = await getFollowingFeed(accessToken)
        setItems(feed)

        const counts = await getReactionCounts(feed.map((entry) => entry.id))
        setCountsByPost(
          Object.fromEntries(
            counts.map((row) => [
              row.post_id,
              { like: row.like, heart: row.heart, fire: row.fire, laugh: row.laugh } as Record<
                ReactionType,
                number
              >,
            ]),
          ),
        )

        const me = await getMe(accessToken)
        setCurrentUserId(me.id)

        const following = await getFollowing(me.id, accessToken)
        setFollowingById(Object.fromEntries(following.map((person) => [person.id, true])))

        const authorIds = Array.from(new Set(feed.map((entry) => entry.author_id)))
        const authors = await Promise.all(authorIds.map((authorId) => getUserById(authorId, accessToken)))
        setAuthorsById(Object.fromEntries(authors.map((person) => [person.id, person])))

        const reactions = await getMyReactions(accessToken)
        setMyReactions(
          Object.fromEntries(reactions.map((row) => [row.post_id, row.reaction_type])) as Record<
            number,
            ReactionType | null
          >,
        )
      } catch (failure) {
        setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось загрузить ленту подписок')
      } finally {
        setLoading(false)
      }
    }

    loadFeed()
  }, [accessToken])

  const handleToggleFollow = async (authorId: number, isFollowing: boolean) => {
    if (!accessToken || currentUserId === authorId) return
    try {
      if (isFollowing) {
        await unfollowUser(authorId, accessToken)
        setFollowingById((previous) => ({ ...previous, [authorId]: false }))
      } else {
        await followUser(authorId, accessToken)
        setFollowingById((previous) => ({ ...previous, [authorId]: true }))
      }
    } catch (failure) {
      setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось обновить подписку')
    }
  }

  const handleReact = async (postId: number, nextReaction: ReactionType) => {
    if (!accessToken) return
    try {
      const previousReaction = myReactions[postId] ?? null
      if (previousReaction === nextReaction) {
        await removeReaction(postId, accessToken)
        setMyReactions((state) => ({ ...state, [postId]: null }))
        setCountsByPost((state) => {
          const current = state[postId] ?? { ...EMPTY_COUNTS }
          return {
            ...state,
            [postId]: {
              ...current,
              [nextReaction]: Math.max((current[nextReaction] ?? 0) - 1, 0),
            },
          }
        })
        return
      }

      await setReaction(postId, nextReaction, accessToken)
      setMyReactions((state) => ({ ...state, [postId]: nextReaction }))
      setCountsByPost((state) => {
        const current = state[postId] ?? { ...EMPTY_COUNTS }
        const updated: Record<ReactionType, number> = { ...current }
        if (previousReaction) {
          updated[previousReaction] = Math.max((updated[previousReaction] ?? 0) - 1, 0)
        }
        updated[nextReaction] = (updated[nextReaction] ?? 0) + 1
        return { ...state, [postId]: updated }
      })
    } catch (failure) {
      setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось поставить реакцию')
    }
  }

  return (
    <section>
      <PageState
        loading={loading ? 'Загружаем посты...' : undefined}
        error={errorText}
        empty={!loading && !errorText && items.length === 0 ? 'Пока нет постов от ваших подписок.' : null}
      />
      <div className="stack">
        {items.map((entry) => (
          <PostCard
            key={entry.id}
            post={entry}
            author={authorsById[entry.author_id]}
            isOwnAuthor={currentUserId === entry.author_id}
            isFollowingAuthor={Boolean(followingById[entry.author_id])}
            onToggleFollowAuthor={handleToggleFollow}
            reaction={myReactions[entry.id] ?? null}
            reactionCounts={countsByPost[entry.id]}
            onReact={(value) => handleReact(entry.id, value)}
          />
        ))}
      </div>
    </section>
  )
}
