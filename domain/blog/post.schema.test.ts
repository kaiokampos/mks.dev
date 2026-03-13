import { describe, it, expect } from 'vitest'
import { PostSchema } from './post.schema'

// ─── Testes do schema de Post ─────────────────────────────────────────────────
//
// Por que testar o schema do domínio?
// O schema é a fundação de tudo — se ele aceitar dados inválidos,
// componentes e páginas recebem lixo sem saber.
//
// Esses testes garantem que:
// 1. Dados válidos passam sem erro
// 2. Dados inválidos são rejeitados com mensagens claras
// 3. Defaults funcionam corretamente
//
// Convenção: describe/it em português (definido em CONVENTIONS.md seção 8.3)

describe('PostSchema', () => {
  describe('quando os dados são válidos', () => {
    it('deve aceitar um post completo', () => {
      const result = PostSchema.safeParse({
        slug: 'arquitetura-nextjs-2026',
        title: 'Arquitetura em Next.js',
        date: '2026-03-11',
        description: 'Como estruturar um projeto Next.js de forma profissional.',
        tags: ['nextjs', 'arquitetura'],
        published: true,
        readingTime: 8,
      })

      expect(result.success).toBe(true)
    })

    it('deve aplicar defaults quando campos opcionais estão ausentes', () => {
      const result = PostSchema.safeParse({
        slug: 'post-minimo',
        title: 'Post Mínimo',
        date: '2026-03-11',
        description: 'Descrição.',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tags).toEqual([])
        expect(result.data.published).toBe(true)
      }
    })
  })

  describe('quando os dados são inválidos', () => {
    it('deve rejeitar slug vazio', () => {
      const result = PostSchema.safeParse({
        slug: '',
        title: 'Post',
        date: '2026-03-11',
        description: 'Desc.',
      })

      expect(result.success).toBe(false)
    })

    it('deve rejeitar data com formato inválido', () => {
      const result = PostSchema.safeParse({
        slug: 'post',
        title: 'Post',
        date: '11/03/2026', // formato errado — deve ser YYYY-MM-DD
        description: 'Desc.',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.date).toBeDefined()
      }
    })

    it('deve rejeitar readingTime negativo', () => {
      const result = PostSchema.safeParse({
        slug: 'post',
        title: 'Post',
        date: '2026-03-11',
        description: 'Desc.',
        readingTime: -5,
      })

      expect(result.success).toBe(false)
    })
  })
})
