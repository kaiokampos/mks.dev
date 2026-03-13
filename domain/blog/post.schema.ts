import { z } from 'zod'

// ─── Schema do Post ───────────────────────────────────────────────────────────
//
// Este schema é a FONTE DA VERDADE para o domínio de blog.
// Todos os tipos são inferidos daqui — nunca declarados em paralelo.
//
// O schema serve dois propósitos:
// 1. Validação em runtime (server/content/loader.ts valida o frontmatter MDX)
// 2. Definição de tipos TypeScript (via z.infer)
//
// Se um campo do frontmatter não passar nesta validação,
// o build falha — dados inválidos nunca chegam ao usuário.

export const PostSchema = z.object({
  // Identificador único na URL — ex: "arquitetura-nextjs-2026"
  slug: z.string().min(1),

  title: z.string().min(1),

  // ISO 8601 — ex: "2026-03-11"
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),

  description: z.string().min(1),

  tags: z.array(z.string()).default([]),

  // Permite ocultar posts sem remover do repositório
  published: z.boolean().default(true),

  // Tempo estimado de leitura em minutos (calculado pelo loader se ausente)
  readingTime: z.number().positive().optional(),
})

// Tipo inferido automaticamente — nunca declare PostType manualmente
export type Post = z.infer<typeof PostSchema>
