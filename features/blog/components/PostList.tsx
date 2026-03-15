// features/blog/components/PostList.tsx
//
// Renderiza uma lista de PostCards.
// Componente fino — só compõe, sem lógica própria.

import type { Post } from '@/domain/blog'
import { PostCard } from './PostCard'

interface PostListProps {
  posts: Post[]
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <p>Nenhum post publicado ainda.</p>
  }

  return (
    <section>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </section>
  )
}
