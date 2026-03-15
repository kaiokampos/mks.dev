// server/content/index.ts
//
// API pública da camada server/content.
// Nenhuma camada externa importa de loader.ts diretamente —
// tudo passa por aqui.

export { loadPost, loadPosts } from './loader'
