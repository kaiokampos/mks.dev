// server/content/loader.ts
//
// Responsabilidade: ler arquivos MDX de content/blog/, fazer parsing
// do frontmatter e validar contra o PostSchema.
//
// Regras arquiteturais:
// - Único ponto de acesso ao filesystem para conteúdo de blog
// - Valida via Zod em build time — erro aqui = build quebra, nunca runtime
// - Não importa de features/, app/ ou components/

import fs from 'node:fs'
import path from 'node:path'
import { PostSchema } from '@/domain/blog'
import type { Post } from '@/domain/blog'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog')

// Extrai o frontmatter de um arquivo MDX.
// Formato esperado: bloco --- ... --- no início do arquivo.
function parseFrontmatter(source: string): Record<string, unknown> {
  const match = source.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}

  const block = match[1]
  const result: Record<string, unknown> = {}

  for (const line of block.split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    const raw = line.slice(colonIndex + 1).trim()

    // Array simples: tags: [nextjs, typescript]
    if (raw.startsWith('[') && raw.endsWith(']')) {
      result[key] = raw
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      continue
    }

    // Boolean
    if (raw === 'true') {
      result[key] = true
      continue
    }
    if (raw === 'false') {
      result[key] = false
      continue
    }

    // Número
    const num = Number(raw)
    if (!isNaN(num) && raw !== '') {
      result[key] = num
      continue
    }

    // String com ou sem aspas
    result[key] = raw.replace(/^["']|["']$/g, '')
  }

  return result
}

// Carrega e valida um único post pelo slug.
// Lança erro em build time se o frontmatter for inválido.
export function loadPost(slug: string): Post {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)

  if (!fs.existsSync(filePath)) {
    throw new Error(`[loader] Post não encontrado: "${slug}"`)
  }

  const source = fs.readFileSync(filePath, 'utf-8')
  const frontmatter = parseFrontmatter(source)

  const result = PostSchema.safeParse({ slug, ...frontmatter })

  if (!result.success) {
    throw new Error(`[loader] Frontmatter inválido em "${slug}":\n${result.error.message}`)
  }

  return result.data
}

// Carrega todos os posts publicados, ordenados por data (mais recente primeiro).
export function loadPosts(): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) return []

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'))

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, '')
    return loadPost(slug)
  })

  return posts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
