# CONFIG_FILES.md — Arquivos de Configuração

Referência completa. Para cada arquivo: onde vai, o que faz, e pontos de atenção.

---

## Mapa de localização

```
mks.dev/
├── tsconfig.json
├── eslint.config.mjs
├── .prettierrc
├── .prettierignore
├── .editorconfig
├── commitlint.config.mjs
├── lint-staged.config.mjs
├── vitest.config.ts
├── .env.example
├── .env.local              ← não commitar (já está no .gitignore do Next.js)
│
├── lib/
│   └── env.ts
│
├── domain/
│   └── blog/
│       ├── post.schema.ts
│       ├── post.schema.test.ts
│       └── index.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── PROJECT_STRUCTURE.md
│   ├── SETUP_GUIDE.md
│   └── adr/
│       ├── ADR-001-architecture.md
│       └── ADR-002-tech-stack.md
│
└── .github/
    └── workflows/
        └── ci.yml
```

---

## tsconfig.json

Path aliases granulares por camada — espelham a arquitetura.
`moduleResolution: bundler` é o modo correto para Next.js 16 com Turbopack.
`strict: true` é obrigatório — nunca desativar.

**Ponto de atenção:** os aliases do Vitest em `vitest.config.ts` devem ser idênticos.
Se adicionar um alias aqui, adicione lá também.

---

## eslint.config.mjs

**Next.js 16 usa ESLint 9 com flat config nativo.**
`next lint` foi removido no Next.js 16 — use `eslint` diretamente via `pnpm lint`.

O arquivo usa `defineConfig` do `typescript-eslint` que encapsula corretamente
o `eslint-config-next/core-web-vitals` e as regras TypeScript.

Três regras que enforçam a arquitetura:

1. `@typescript-eslint/consistent-type-imports` — força `import type` para tipos.
   Removido em runtime pelo compilador — zero acoplamento em runtime.

2. `import/no-cycle` — detecta ciclos de dependência.
   `features/blog → features/projects → features/blog` é proibido.

3. `import/no-internal-modules` — encapsulamento via `index.ts`.
   `import { x } from '@/features/blog/services/post.service'` é proibido.
   Apenas `import { x } from '@/features/blog'` é permitido.

---

## .prettierrc

- `semi: false` — sem ponto e vírgula
- `singleQuote: true` — aspas simples
- `trailingComma: es5` — vírgula em objetos e arrays, não em parâmetros de função
- `printWidth: 100` — adequado para TypeScript moderno

---

## commitlint.config.mjs

Escopos válidos (definidos em `docs/CONVENTIONS.md` seção 7):
`hero`, `blog`, `projects`, `lab`, `config`, `server`, `domain`,
`components`, `lib`, `docs`, `ci`, `deps`

Formato obrigatório:

```
tipo(escopo): descrição em minúsculas

feat(blog): add PostCard component
fix(server): handle missing frontmatter gracefully
chore(deps): update next to 16.x
docs(adr): add ADR-003 for search decision
```

---

## lint-staged.config.mjs

Roda no pre-commit apenas nos arquivos staged:

- `.ts`, `.tsx` → ESLint + Prettier
- `.js`, `.mjs`, `.json`, `.md`, `.css` → Prettier

**Ponto de atenção:** o ESLint no lint-staged não passa `--max-warnings=0`
intencionalmente — o CI é o gate de warnings. O pre-commit só bloqueia erros.

---

## vitest.config.ts

- `environment: jsdom` — simula browser para React
- Aliases idênticos ao `tsconfig.json` (obrigatório)
- Testes co-localizados: `post.schema.test.ts` junto ao `post.schema.ts`
- `index.ts` excluído da cobertura — barrel exports não têm lógica testável

---

## lib/env.ts

Ponto central de acesso a variáveis de ambiente.

**Regra:** nunca use `process.env` diretamente fora deste arquivo.

```typescript
// ✅ Correto
import { env } from '@/lib/env'
const url = env.NEXT_PUBLIC_SITE_URL

// ❌ Errado
const url = process.env.NEXT_PUBLIC_SITE_URL
```

Se uma variável obrigatória estiver faltando, a aplicação não sobe
e o erro é claro — nunca em runtime silencioso.

---

## domain/blog/post.schema.ts

Primeiro schema de domínio — serve como template para os demais.

Padrão a replicar em `domain/projects/project.schema.ts`:

```typescript
import { z } from 'zod'

export const ProjectSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  stack: z.array(z.string()).default([]),
  url: z.string().url().optional(),
  repo: z.string().url().optional(),
  published: z.boolean().default(true),
})

export type Project = z.infer<typeof ProjectSchema>
```

---

## .github/workflows/ci.yml

5 gates em sequência — todos devem passar para merge ser permitido:

```
1. type-check  → zero erros TypeScript
2. lint        → zero warnings ESLint (--max-warnings=0)
3. format      → zero arquivos fora do padrão Prettier
4. test        → todos os testes passando
5. build       → build limpo (valida MDX e schemas em build time)
```

O build como último gate é intencional: é o mais lento, mas valida o sistema
como um todo — schemas Zod, MDX, geração de páginas estáticas.

---

## .env.local (não commitar)

```bash
cp .env.example .env.local
# edite .env.local com os valores corretos
```

O `.gitignore` gerado pelo Next.js já inclui `.env*.local` por padrão.
Verifique que a linha está lá antes do primeiro push.

---

_Qualquer novo arquivo de configuração deve ser documentado aqui._
