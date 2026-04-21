import type { PostRead } from '../types/api'

export function PostCard({ post }: { post: PostRead }) {
  return (
    <article className="card">
      <p className="content-text">{post.content}</p>
      <div className="meta">
        <span>Author: {post.author_id}</span>
        <span>{new Date(post.created_at).toLocaleString()}</span>
        {post.is_edited && <span>edited</span>}
      </div>
    </article>
  )
}
