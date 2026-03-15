// features/blog/services/post.service.ts
//
// Application Services do domínio de blog.
//
// Responsabilidade: orquestrar casos de uso — recebe dados do server/,
// aplica transformações leves e entrega para a camada de apresentação.
//
// Regras arquiteturais:
// - Nunca acessa filesystem ou APIs diretamente (isso é responsabilidade de server/)
// - Nunca contém lógica de domínio complexa (isso pertence a domain/)
// - Serviços devem permanecer finos — se crescer demais, mover lógica para domain/

import { loadPost, loadPosts } from '@/server/content'
import type { Post } from '@/domain/blog'

// Retorna todos os posts publicados, ordenados por data.
export async function getPosts(): Promise<Post[]> {
  return loadPosts()
}

// Retorna os N posts mais recentes. Útil para seções de destaque na homepage.
export async function getRecentPosts(limit = 3): Promise<Post[]> {
  const posts = await getPosts()
  return posts.slice(0, limit)
}

// Retorna um post pelo slug. Lança erro se não encontrado.
export async function getPostBySlug(slug: string): Promise<Post> {
  return loadPost(slug)
}

// Retorna todos os posts que contêm uma tag específica.
export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getPosts()
  return posts.filter((p) => p.tags.includes(tag))
}

// Retorna todas as tags únicas usadas nos posts, ordenadas alfabeticamente.
export async function getAllTags(): Promise<string[]> {
  const posts = await getPosts()
  const tags = posts.flatMap((p) => p.tags)
  return [...new Set(tags)].sort()
}
