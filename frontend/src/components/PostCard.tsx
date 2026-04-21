import type { PostRead, ReactionType } from '../types/api'

interface PostCardProps {
  post: PostRead
  editable?: boolean
  onEdit?: (post: PostRead) => void
  reaction?: ReactionType | null
  onReact?: (reaction: ReactionType) => void
  onRemoveReaction?: () => void
}

export function PostCard({ post, editable = false, onEdit, reaction = null, onReact, onRemoveReaction }: PostCardProps) {
  return (
    <article className="card">
      <p className="content-text">{post.content}</p>
      <div className="meta">
        <span>Автор: {post.author_id}</span>
        <span>{new Date(post.created_at).toLocaleString()}</span>
        {post.is_edited && <span>изменен</span>}
      </div>
      <div className="post-actions">
        {editable && onEdit && (
          <button type="button" className="ghost-button small" onClick={() => onEdit(post)}>
            Редактировать
          </button>
        )}
        {onReact && (
          <div className="reaction-row">
            {(['like', 'heart', 'fire', 'laugh'] as ReactionType[]).map((value) => (
              <button
                type="button"
                key={value}
                className={`ghost-button small ${reaction === value ? 'active-reaction' : ''}`}
                onClick={() => onReact(value)}
              >
                {value}
              </button>
            ))}
            {reaction && onRemoveReaction && (
              <button type="button" className="ghost-button small" onClick={onRemoveReaction}>
                убрать
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
