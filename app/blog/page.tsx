// app/blog/page.tsx
//
// Página de listagem do blog.
// Server Component — busca dados diretamente, sem hooks ou estado.
// Delega renderização para features/blog.

import type { Metadata } from 'next'
import { getPosts } from '@/features/blog'
import { PostList } from '@/features/blog'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artigos técnicos sobre engenharia, arquitetura e desenvolvimento.',
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main>
      <h1>Blog</h1>
      <PostList posts={posts} />
    </main>
  )
}
