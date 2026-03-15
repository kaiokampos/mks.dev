# mks.dev — Diário de Aprendizado Técnico

> Este documento registra decisões, erros, descobertas e fundamentos arquiteturais
> acumulados durante o desenvolvimento do mks.dev. É um documento vivo — cresce
> a cada sessão de desenvolvimento.
>
> **Para quem é este documento:** para você, Kaio, dominar a arquitetura que está
> construindo — não apenas executá-la.

---

## Índice

1. [Fundamentos da Arquitetura FBA](#1-fundamentos-da-arquitetura-fba)
2. [Fluxo de Dados](#2-fluxo-de-dados)
3. [Regras de Dependência](#3-regras-de-dependência)
4. [Tooling e Enforcement](#4-tooling-e-enforcement)
5. [Erros Encontrados e Resoluções](#5-erros-encontrados-e-resoluções)
6. [Decisões Técnicas Registradas](#6-decisões-técnicas-registradas)
7. [Comandos do Dia a Dia](#7-comandos-do-dia-a-dia)

---

## 1. Fundamentos da Arquitetura FBA

### O que é Feature-Based Architecture

FBA é uma forma de organizar código por **capacidade funcional** (o que o sistema faz),
não por tipo técnico (controllers, models, views).

Em vez de:

```
models/Post.ts
controllers/PostController.ts
views/PostView.tsx
```

Você tem:

```
features/blog/
  services/post.service.ts
  components/PostCard.tsx
  hooks/usePosts.ts
```

A diferença prática: tudo relacionado a blog fica junto. Quando você precisa entender
ou modificar a feature de blog, você abre uma pasta — não cinco.

---

### As Camadas do mks.dev

```
app/              → apresentação: rotas, páginas, layouts (Next.js App Router)
features/         → application layer: casos de uso, orquestração
domain/           → modelo conceitual: schemas Zod, tipos TypeScript
server/           → infraestrutura: acesso a filesystem, parsing MDX
components/       → UI primitiva: botões, cards, sem conhecimento de negócio
lib/              → adaptadores: integrações com bibliotecas externas
config/           → configurações globais: metadados, navegação
content/          → data source: arquivos MDX (análogo a um banco de dados)
```

**Analogia com banco de dados:**

| Banco de dados       | mks.dev                                  |
| -------------------- | ---------------------------------------- |
| Tabela / coleção     | `content/blog/*.mdx`                     |
| Query SQL            | `server/content/loader.ts`               |
| ORM Model / Schema   | `domain/blog/post.schema.ts`             |
| Repository / Service | `features/blog/services/post.service.ts` |
| Controller / Route   | `app/blog/page.tsx`                      |

---

### O Domínio é o Centro

O `domain/` é a camada mais importante e mais protegida do sistema.

**O que vive no domínio:**

- Schemas Zod (fonte da verdade)
- Tipos TypeScript inferidos dos schemas
- Regras de negócio puras

**O que NUNCA entra no domínio:**

- Next.js, React, Node.js
- Filesystem (`fs`)
- Variáveis de ambiente (`process.env`)
- Qualquer side effect

**Por quê?** Porque domínio puro é testável, previsível e reutilizável. Dado o mesmo
input, sempre produz o mesmo output — sem exceções.

```typescript
// ✅ Domain — puro, sem dependências externas além de Zod
export const PostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(true),
})

export type Post = z.infer<typeof PostSchema>
//                 ↑ tipo SEMPRE inferido, nunca declarado manualmente
```

---

### Zod como Fonte da Verdade

**Regra:** o schema Zod define o contrato. O tipo TypeScript é derivado do schema,
nunca o contrário.

```typescript
// ❌ Errado — tipo declarado manualmente, duplicando informação
export type Post = {
  slug: string
  title: string
  // ...
}

// ✅ Correto — tipo inferido do schema
export const PostSchema = z.object({ slug: z.string(), title: z.string() })
export type Post = z.infer<typeof PostSchema>
```

**Por quê?** Porque se você mudar o schema, o tipo muda automaticamente. Se tiver
tipo manual, você tem dois lugares para manter sincronizados — e eles vão divergir.

---

## 2. Fluxo de Dados

### O Pipeline Completo

```
content/blog/post.mdx          ← arquivo MDX com frontmatter
        ↓
server/content/loader.ts       ← lê o arquivo, extrai frontmatter
        ↓
domain/blog/post.schema.ts     ← valida o frontmatter com Zod
        ↓
features/blog/services/        ← orquestra casos de uso
        ↓
app/blog/page.tsx              ← renderiza a página
```

### Build Time vs Runtime

O mks.dev é **orientado a build time**. Isso significa:

- Todo conteúdo é processado durante o `pnpm build`
- Validação Zod acontece no build — erros são detectados antes do deploy
- O usuário final recebe HTML estático — zero processamento em runtime
- Se o build passou, dados inválidos nunca chegam ao usuário

```
BUILD TIME                          RUNTIME
──────────────────────────────────  ──────────────
content/*.mdx                       página HTML estática
    ↓                                    ↓
server/content/loader.ts            zero processamento
    ↓                               zero latência de dados
domain/*/post.schema.ts
    ↓
features/*/services/
    ↓
app/*/page.tsx → HTML estático
```

### Encapsulamento via `index.ts`

Cada camada expõe sua API **exclusivamente** pelo `index.ts`.

```typescript
// ✅ Correto — importa pela API pública
import { getPosts } from '@/features/blog'
import { Post } from '@/domain/blog'
import { loadPosts } from '@/server/content'

// ❌ Errado — acessa arquivo interno diretamente
import { getPosts } from '@/features/blog/services/post.service'
import { Post } from '@/domain/blog/post.types'
```

**Por quê?** Porque o `index.ts` é um contrato. O que está lá é público e estável.
O que não está lá é detalhe de implementação — pode mudar a qualquer momento sem
quebrar nada fora daquele módulo.

---

## 3. Regras de Dependência

### Fluxo Unidirecional

Dependências fluem sempre de fora para dentro. **Camadas internas nunca conhecem
camadas externas.**

```
app
 ↓
features
 ↓        ↓
domain   server
              ↓
          content
```

### Tabela de Dependências Permitidas

| Camada       | Pode importar de                                                       |
| ------------ | ---------------------------------------------------------------------- |
| `app`        | `features`, `components`, `config`, `lib`, `domain` (só `import type`) |
| `features`   | `domain`, `server`, `components`, `lib`, `config`                      |
| `server`     | `domain`, `lib`                                                        |
| `domain`     | apenas Zod                                                             |
| `components` | `lib`                                                                  |
| `lib`        | bibliotecas externas                                                   |
| `config`     | valores estáticos                                                      |

### `import type` em `app/`

Quando `app/` precisa de um tipo do `domain/`, usa `import type`:

```typescript
// ✅ Correto — import type é removido pelo compilador em runtime
import type { Post } from '@/domain/blog'

// ❌ Errado — pode trazer lógica acidentalmente
import { Post } from '@/domain/blog'
```

`import type` é uma garantia estrutural: o compilador TypeScript remove completamente
esse import no bundle final — zero risco de acoplar lógica de domínio à camada de
apresentação.

---

## 4. Tooling e Enforcement

### A Cadeia de Validação

```
git commit
    ↓
Husky (pre-commit hook)
    ↓
lint-staged
    ├── ESLint nos arquivos staged
    └── Prettier nos arquivos staged
    ↓
commitlint (commit-msg hook)
    ↓
git push
    ↓
GitHub Actions CI
    ├── Gate 1: pnpm type-check (TypeScript)
    ├── Gate 2: pnpm lint (ESLint)
    ├── Gate 3: pnpm format:check (Prettier)
    ├── Gate 4: pnpm test:run (Vitest)
    └── Gate 5: pnpm build (Next.js)
```

**Princípio:** arquitetura sem enforcement é sugestão. Regras verificadas em CI são
robustas.

### Conventional Commits

Formato: `tipo(escopo): descrição em lowercase`

```bash
feat(blog): add PostCard component
fix(server): handle missing frontmatter gracefully
chore(ci): upgrade actions to node.js 24 compatible versions
docs(adr): add ADR-003 for font choice
refactor(domain): extract post schema to separate file
```

**Escopos do projeto:** `hero`, `blog`, `projects`, `lab`, `config`, `server`,
`domain`, `components`, `lib`, `docs`, `ci`, `deps`

**Atenção:** a descrição deve ser totalmente em lowercase — o commitlint vai rejeitar
`chore(ci): Upgrade Actions` por causa do `U` e do `A` maiúsculos.

### `pnpm format` antes do push

O Prettier corrige automaticamente — nunca edite na mão para satisfazer o formatter.

```bash
pnpm format        # corrige todos os arquivos
pnpm format:check  # só verifica (usado no CI)
```

---

## 5. Erros Encontrados e Resoluções

### ESLint: `import/no-internal-modules`

**Erro:**

```
Reaching to "@/domain/blog" is not allowed  import/no-internal-modules
```

**Causa raiz:** a regra `import/no-internal-modules` do `eslint-plugin-import` usa
`minimatch` para testar os caminhos. Ela recebe o caminho **resolvido** do import
— não a string literal. Então `@/domain/blog` é testado como está escrito, com o
`@/` incluído.

**Lição aprendida:** a regra não resolve aliases TypeScript antes de aplicar os
patterns. Por isso `domain/*/index` não bate com `@/domain/blog` — o `@/` não está
no pattern.

**Resolução:** os patterns no `allow` precisam usar o mesmo formato que os imports
reais do projeto:

```javascript
// ✅ Correto — espelha os aliases reais do projeto
allow: [
  '@/features/*',
  '@/domain/*',
  '@/server/*',
  '@/components/*',
  '@/lib/*',
  '@/config/*',
  // ...
]
```

**Lição adicional:** imports relativos dentro da mesma camada (`./services/post.service`)
são resolvidos para o caminho real (`features/blog/services/post.service`) antes do
teste. Por isso o pattern correto é `**/features/**`, não `./**`.

---

### ESLint: `domain/blog/index.ts` vazio

**Erro:** mesmo erro de `import/no-internal-modules`, mas causado pelo `index.ts`
vazio do domínio.

**Causa raiz:** sem exports no `index.ts`, o ESLint não reconhecia o módulo como
uma API pública válida.

**Resolução:** todo `index.ts` de módulo público deve exportar explicitamente:

```typescript
// domain/blog/index.ts
export { PostSchema } from './post.schema'
export type { Post } from './post.schema'
```

---

### Commitlint: `subject must be lower-case`

**Erro:**

```
✖ subject must be lower-case [subject-case]
```

**Causa:** mensagem de commit com letra maiúscula na descrição.

```
chore(ci): upgrade actions to Node.js 24  ← "Node.js" tem maiúsculas
```

**Resolução:**

```bash
git commit -m "chore(ci): upgrade actions to node.js 24 compatible versions"
```

**Lição:** o commitlint valida a mensagem inteira após os dois pontos. Nomes próprios
como "Node.js", "GitHub", "TypeScript" precisam ser escritos em lowercase nas mensagens
de commit deste projeto.

---

### CI: warning de Node.js 20 nas GitHub Actions

**Sintoma:** warning persistente mesmo após atualizar versões das actions e adicionar
`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`.

**Causa real:** o runner do GitHub ainda usa Node.js 20 internamente para executar
as actions. Isso é uma limitação da infraestrutura do GitHub — não algo que o projeto
controla.

**Status:** a migração forçada para Node.js 24 está prevista para junho de 2026.
O `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` já está configurado — quando o runner
for atualizado pelo GitHub, o projeto já estará preparado.

**Lição:** nem todo warning é um problema para resolver agora. Saber distinguir
o que é urgente do que é inevitável é parte do trabalho de engenharia.

---

### Git: `cannot run delta: No such file or directory`

**Causa:** o `~/.gitconfig` está configurado com `delta` como pager, mas o `delta`
não está instalado.

**Resolução:**

```bash
git config --global core.pager less
```

---

## 6. Decisões Técnicas Registradas

### Por que o `server/` existe separado de `features/`

Sem essa separação, é comum encontrar `fs.readFileSync()` dentro de services ou hooks.
Centralizar o acesso ao filesystem em `server/` torna o código previsível e testável.

```typescript
// ❌ Anti-pattern — I/O dentro de service
export async function getPosts() {
  const files = fs.readdirSync('./content/blog') // pertence a server/
}

// ✅ Correto — service delega I/O para server/
export async function getPosts() {
  return loadPosts() // loadPosts vive em server/content/
}
```

### Por que `services/` = Application Layer

`features/services/` é a camada de aplicação no sentido de DDD:

- coordena casos de uso sem conter lógica de domínio
- não executa I/O diretamente — delega para `server/` ou `lib/`
- é o ponto onde domínio e infraestrutura se encontram, sem se misturar

**Services devem permanecer finos.** Se um service crescer demais com lógica complexa,
é sinal de que essa lógica pertence ao `domain/`.

### Por que aliases TypeScript e não caminhos relativos entre camadas

```typescript
// ❌ Frágil — quebra se você mover o arquivo
import { Post } from '../../../domain/blog'

// ✅ Robusto — sempre funciona independente de onde o arquivo está
import { Post } from '@/domain/blog'
```

Caminhos relativos só são permitidos **dentro** da mesma camada.

---

## 7. Comandos do Dia a Dia

### Desenvolvimento

```bash
pnpm dev              # inicia o servidor de desenvolvimento
pnpm build            # build de produção (valida schemas, gera páginas estáticas)
pnpm start            # serve o build de produção localmente
```

### Qualidade de código

```bash
pnpm type-check       # TypeScript sem emitir arquivos
pnpm lint             # ESLint
pnpm lint:fix         # ESLint com autofix
pnpm format           # Prettier com --write (corrige)
pnpm format:check     # Prettier com --check (só verifica, usado no CI)
pnpm test             # Vitest em modo watch
pnpm test:run         # Vitest sem watch (usado no CI)
pnpm coverage         # cobertura de testes
```

### Git

```bash
git add .
git commit -m "tipo(escopo): descrição em lowercase"
git push

git log --oneline -10          # histórico resumido
git status                     # estado atual
git diff                       # mudanças não staged
```

### Validação completa antes de PR

```bash
pnpm type-check && pnpm lint && pnpm format:check && pnpm test:run && pnpm build
```

---

_Documento iniciado em março de 2026. Atualizar a cada sessão de desenvolvimento._
