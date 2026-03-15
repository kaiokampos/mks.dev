// domain/blog/index.ts
//
// API pública do domínio de blog.
// Nenhuma camada externa importa de post.schema.ts diretamente.

export { PostSchema } from './post.schema'
export type { Post } from './post.schema'
