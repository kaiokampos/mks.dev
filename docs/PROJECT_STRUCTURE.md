# PROJECT_STRUCTURE.md

## Estrutura Oficial do Repositório

```
mks.dev
│
├─ app/                         # Camada de apresentação (Next.js App Router)
│  ├─ (home)/
│  ├─ blog/
│  ├─ projects/
│  ├─ lab/
│  ├─ layout.tsx
│  └─ page.tsx
│
├─ components/                  # UI primitivos — agnósticos de domínio, importam apenas lib/
│  ├─ Button.tsx
│  ├─ Card.tsx
│  └─ ...
│
├─ features/                    # Funcionalidades organizadas por domínio
│  ├─ blog/
│  │  ├─ components/            # Componentes domain-aware (PostCard, PostList...)
│  │  ├─ hooks/
│  │  ├─ services/              # Application Layer — orquestra casos de uso, nunca executa I/O
│  │  ├─ utils/
│  │  └─ index.ts               # API pública obrigatória
│  ├─ projects/
│  │  └─ index.ts
│  └─ lab/
│     └─ index.ts
│
├─ domain/                      # Modelos e contratos de domínio
│  ├─ blog/
│  │  ├─ post.schema.ts         # Schema Zod (fonte da verdade)
│  │  ├─ post.types.ts          # Tipos inferidos do schema
│  │  └─ index.ts               # Barrel export obrigatório
│  ├─ projects/
│  │  └─ index.ts
│  └─ lab/
│     └─ index.ts
│
├─ server/                      # Infraestrutura server-side
│  └─ content/
│     ├─ loader.ts              # Leitura, parsing e validação de MDX
│     ├─ registry.ts            # Mapeamento de domínios para coleções
│     └─ index.ts               # API pública obrigatória
│
├─ content/                     # Conteúdo estático (MDX) — acessado apenas por server/
│  ├─ blog/
│  │  └─ *.mdx
│  ├─ projects/
│  │  └─ *.mdx
│  └─ lab/
│     └─ *.mdx
│
├─ lib/                         # Integrações externas — transversal para app, features e server
│  ├─ mdx.ts
│  ├─ env.ts
│  └─ analytics.ts
│
├─ config/                      # Configurações globais — transversal para app, features e server
│  ├─ site.ts
│  ├─ navigation.ts
│  └─ metadata.ts
│
└─ docs/
   └─ adr/                      # Architecture Decision Records
      ├─ ADR-001-architecture.md
      └─ ADR-002-tech-stack.md
```

---

## Regras de localização

| O que é                                                 | Onde vai                                                  |
| ------------------------------------------------------- | --------------------------------------------------------- |
| Rota ou página                                          | `app/`                                                    |
| Componente sem conhecimento de domínio                  | `components/`                                             |
| Componente que recebe `Post`, `Project`, etc. como prop | `features/<domínio>/components/`                          |
| Hook React de uma feature                               | `features/<domínio>/hooks/`                               |
| Função que orquestra dados de um domínio                | `features/<domínio>/services/`                            |
| Schema Zod de uma entidade                              | `domain/<domínio>/`                                       |
| Tipo TypeScript de uma entidade                         | `domain/<domínio>/` (inferido do schema)                  |
| Leitura de arquivo MDX                                  | `server/content/loader.ts`                                |
| Wrapper de biblioteca externa                           | `lib/`                                                    |
| Dado estrutural da aplicação                            | `config/` (não disponível em `domain/` nem `components/`) |
| Conteúdo editorial                                      | `content/<domínio>/`                                      |
| Decisão arquitetural                                    | `docs/adr/`                                               |

---

_Para descrição completa das responsabilidades de cada camada, consulte `CONVENTIONS.md`._
_Para decisões de arquitetura e tech stack, consulte `docs/adr/`._
