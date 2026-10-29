import { Link } from 'react-router-dom'
import type { PostAuthorPreview, PostRead, ReactionType } from '../types/api'
import { SecondaryButton } from './ui/Buttons'
import { GlassCard } from './ui/GlassCard'

const REACTION_OPTIONS: Array<{ value: ReactionType; emoji: string; label: string }> = [
  { value: 'like', emoji: '👍', label: 'Нравится' },
  { value: 'heart', emoji: '❤️', label: 'Любовь' },
  { value: 'fire', emoji: '🔥', label: 'Огонь' },
  { value: 'laugh', emoji: '😂', label: 'Смешно' },
]

interface PostCardProps {
  post: PostRead
  author?: PostAuthorPreview
  isOwnAuthor?: boolean
  isFollowingAuthor?: boolean
  onToggleFollowAuthor?: (authorId: number, isFollowing: boolean) => void
  editable?: boolean
  onEdit?: (post: PostRead) => void
  reaction?: ReactionType | null
  reactionCounts?: Partial<Record<ReactionType, number>>
  onReact?: (reaction: ReactionType) => void
}

export function PostCard({
  post,
  author,
  isOwnAuthor = false,
  isFollowingAuthor = false,
  onToggleFollowAuthor,
  editable = false,
  onEdit,
  reaction = null,
  reactionCounts,
  onReact,
}: PostCardProps) {
  const initial = author ? author.username.slice(0, 1).toUpperCase() : ''

  return (
    <GlassCard className="post-card">
      {author && (
        <div className="author-chip">
          <Link to={`/users/${author.id}`} className="author-main">
            {author.avatar_url ? (
              <img className="author-avatar" src={author.avatar_url} alt={`Аватар ${author.username}`} />
            ) : (
              <span className="author-avatar author-avatar-fallback">{initial}</span>
            )}
            <span className="author-name">@{author.username}</span>
          </Link>
          <div className="author-popover glass-card">
            <div className="author-popover-head">
              <div className="author-popover-user">
                {author.avatar_url ? (
                  <img
                    className="author-avatar author-avatar-mini"
                    src={author.avatar_url}
                    alt={`Аватар ${author.username}`}
                  />
                ) : (
                  <span className="author-avatar author-avatar-fallback author-avatar-mini">{initial}</span>
                )}
                <strong>@{author.username}</strong>
              </div>
              {author.bio && <p className="muted">{author.bio}</p>}
            </div>
            <div className="action-row">
              <Link to={`/users/${author.id}`} className="menu-button">
                Профиль
              </Link>
              {!isOwnAuthor && onToggleFollowAuthor && (
                <SecondaryButton type="button" onClick={() => onToggleFollowAuthor(author.id, isFollowingAuthor)}>
                  {isFollowingAuthor ? 'Отписаться' : 'Подписаться'}
                </SecondaryButton>
              )}
            </div>
          </div>
        </div>
      )}
      <p className="content-text">{post.content}</p>
      <div className="meta">
        {!author && <span>Автор: {post.author_id}</span>}
        <span>{new Date(post.created_at).toLocaleString()}</span>
        {post.is_edited && <span>изменен</span>}
      </div>
      <div className="post-actions">
        {editable && onEdit && (
          <SecondaryButton type="button" className="small" onClick={() => onEdit(post)}>
            Редактировать
          </SecondaryButton>
        )}
        {onReact && (
          <div className="reaction-row">
            {REACTION_OPTIONS.map((option) => (
              <SecondaryButton
                type="button"
                key={option.value}
                className={`small emoji-pill ${reaction === option.value ? 'active-reaction' : ''}`}
                onClick={() => onReact(option.value)}
                title={option.label}
              >
                <span>{option.emoji}</span>
                <span>{reactionCounts?.[option.value] ?? 0}</span>
              </SecondaryButton>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
