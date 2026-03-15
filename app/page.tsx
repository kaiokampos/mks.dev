// app/page.tsx
//
// Homepage do mks.dev.
// Server Component — busca posts recentes no servidor, sem estado cliente.
// Compõe seções: hero, posts recentes, navegação para outras áreas.

import type { Metadata } from 'next'
import Link from 'next/link'
import { getRecentPosts } from '@/features/blog'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
}

export default async function HomePage() {
  const recentPosts = await getRecentPosts(3)

  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      {/* Hero */}
      <section className="mb-20">
        <p
          className="text-xs tracking-widest uppercase mb-3"
          style={{ color: 'var(--color-muted)' }}
        >
          {siteConfig.url}
        </p>
        <h1
          className="text-7xl font-light mb-4 leading-none tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
        >
          mks
        </h1>
        <p className="text-xl mb-1" style={{ color: 'var(--color-text)' }}>
          {siteConfig.author.name}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {siteConfig.author.role}
        </p>
      </section>

      {/* Posts recentes */}
      {recentPosts.length > 0 && (
        <section className="mb-16">
          <h2
            className="text-xs tracking-widest uppercase mb-6"
            style={{ color: 'var(--color-muted)' }}
          >
            escrito recentemente
          </h2>
          <ul className="space-y-6">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <time
                    dateTime={post.date}
                    className="text-xs block mb-1"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {post.date}
                  </time>
                  <span className="text-base" style={{ color: 'var(--color-text)' }}>
                    {post.title}
                  </span>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                    {post.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/blog"
            className="inline-block mt-8 text-sm"
            style={{ color: 'var(--color-accent)' }}
          >
            ver todos os posts →
          </Link>
        </section>
      )}

      {/* Navegação */}
      <nav>
        <h2
          className="text-xs tracking-widest uppercase mb-6"
          style={{ color: 'var(--color-muted)' }}
        >
          explorar
        </h2>
        <ul className="space-y-3">
          {[
            { href: '/blog', label: 'blog', desc: 'artigos técnicos' },
            { href: '/projects', label: 'projetos', desc: 'o que construí' },
            { href: '/lab', label: 'lab', desc: 'experimentos e protótipos' },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-baseline gap-4 group">
                <span style={{ color: 'var(--color-accent)' }}>{item.label}</span>
                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {item.desc}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <footer className="mt-24 pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex gap-6 text-xs" style={{ color: 'var(--color-muted)' }}>
          <a href={siteConfig.author.github} target="_blank" rel="noopener noreferrer">
            github
          </a>
          <a href={siteConfig.author.linkedin} target="_blank" rel="noopener noreferrer">
            linkedin
          </a>
        </div>
      </footer>
    </main>
  )
}
