// features/blog/components/PostCard.tsx
//
// Componente domain-aware: conhece o tipo Post do domínio.
// Recebe dados via props — sem acesso direto a server/ ou services/.
// Server Component por padrão — sem 'use client'.

import type { Post } from '@/domain/blog'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article>
      <time dateTime={post.date}>{post.date}</time>
      <h2>
        <a href={`/blog/${post.slug}`}>{post.title}</a>
      </h2>
      <p>{post.description}</p>
      {post.tags.length > 0 && (
        <ul>
          {post.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
    </article>
  )
}
