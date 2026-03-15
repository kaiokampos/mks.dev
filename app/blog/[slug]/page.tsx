// app/blog/[slug]/page.tsx
//
// Página individual de um post, identificado pelo slug na URL.
// generateStaticParams instrui o Next.js a gerar todas as páginas
// em build time — zero processamento em runtime.

import type { Metadata } from 'next'
import { getPosts, getPostBySlug } from '@/features/blog'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

// Gera todas as rotas estáticas em build time.
// Next.js chama essa função e pré-renderiza uma página para cada slug.
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

// Gera os metadados da página dinamicamente com base no post.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  return {
    title: post.title,
    description: post.description,
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params

  // getPostBySlug lança erro se o slug não existir —
  // notFound() converte isso em uma página 404.
  let post
  try {
    post = await getPostBySlug(slug)
  } catch {
    notFound()
  }

  return (
    <main>
      <header>
        <time dateTime={post.date}>{post.date}</time>
        <h1>{post.title}</h1>
        <p>{post.description}</p>
      </header>
      <article>
        {/* Conteúdo MDX será adicionado na próxima etapa */}
        <p>Conteúdo em breve.</p>
      </article>
    </main>
  )
}
