import type { PostRead, ReactionType } from '../types/api'
import { PrimaryButton, SecondaryButton } from './ui/Buttons'
import { GlassCard } from './ui/GlassCard'

interface PostCardProps {
  post: PostRead
  editable?: boolean
  onEdit?: (post: PostRead) => void
  reaction?: ReactionType | null
  onReact?: (reaction: ReactionType) => void
  onRemoveReaction?: () => void
}

export function PostCard({ post, editable = false, onEdit, reaction = null, onReact, onRemoveReaction }: PostCardProps) {
  const reactionMap: Array<{ value: ReactionType; emoji: string; label: string }> = [
    { value: 'like', emoji: '👍', label: 'Нравится' },
    { value: 'heart', emoji: '❤️', label: 'Любовь' },
    { value: 'fire', emoji: '🔥', label: 'Огонь' },
    { value: 'laugh', emoji: '😂', label: 'Смешно' },
  ]

  return (
    <GlassCard className="post-card">
      <p className="content-text">{post.content}</p>
      <div className="meta">
        <span>Автор: {post.author_id}</span>
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
            {reactionMap.map((item) => (
              <SecondaryButton
                type="button"
                key={item.value}
                className={`small emoji-pill ${reaction === item.value ? 'active-reaction' : ''}`}
                onClick={() => onReact(item.value)}
                title={item.label}
              >
                <span>{item.emoji}</span>
              </SecondaryButton>
            ))}
            {reaction && onRemoveReaction && (
              <PrimaryButton type="button" className="small" onClick={onRemoveReaction}>
                убрать
              </PrimaryButton>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
