// features/blog/index.ts
//
// API pública da feature de blog.
// Nenhuma camada externa importa de arquivos internos desta feature —
// tudo passa por aqui.
//
// O que é exposto aqui é o contrato público da feature.
// O que não está aqui é detalhe de implementação — pode mudar a qualquer momento.

export {
  getPosts,
  getRecentPosts,
  getPostBySlug,
  getPostsByTag,
  getAllTags,
} from './services/post.service'

export { PostCard } from './components/PostCard'
export { PostList } from './components/PostList'
