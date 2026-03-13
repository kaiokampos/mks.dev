# mks.dev — Convenções de Arquitetura

Este documento define as **convenções oficiais de arquitetura** do projeto **mks.dev**.

Ele serve como referência para qualquer pessoa que trabalhe no projeto, garantindo:

- consistência estrutural
- previsibilidade do código
- separação clara de responsabilidades
- facilidade de manutenção
- evolução segura da arquitetura

Este documento é considerado a **base arquitetural do projeto**.

> Qualquer alteração estrutural relevante deve atualizar este arquivo e, se necessário, registrar um ADR em `docs/adr/`.

---

# 1. Princípios Arquiteturais

## 1.1 Separação de Responsabilidades

Cada camada do sistema possui uma responsabilidade clara e bem definida.

Misturar responsabilidades gera:

- alto acoplamento
- dificuldade de manutenção
- código difícil de testar

Portanto cada diretório possui um propósito específico e deve ser respeitado.

---

## 1.2 Dependências Unidirecionais

As dependências sempre fluem de **camadas externas para internas**.

Fluxo arquitetural correto:

```
app
 ↓
features
 ↓      ↓
domain  server
           ↓
        content (data source)
```

> `features` consome `domain` (tipos e schemas) e `server` (dados carregados).
> `server` consome `domain` para validar dados brutos contra os schemas.
> `domain` e `server` não têm relação entre si além dessa — `domain` não conhece `server`.
> `lib` e `config` são camadas transversais — acessíveis por qualquer camada.

Regra fundamental:

> **Camadas internas nunca dependem de camadas externas.**

---

## 1.3 Domínio como centro da aplicação

O domínio representa o **modelo conceitual do sistema**.

Ele define:

- entidades
- tipos
- contratos
- schemas de validação

A interface e a infraestrutura existem para **servir o domínio**. O domínio não conhece nenhuma delas.

---

## 1.4 Encapsulamento via `index.ts`

Toda feature, domínio e módulo de servidor deve expor sua API pública **exclusivamente** através de um arquivo `index.ts`.

**Regra obrigatória:**

> Importações diretas em arquivos internos de uma camada são **proibidas** fora dessa camada.

```typescript
// ✅ Correto
import { getPosts } from '@/features/blog'

// ❌ Errado
import { getPosts } from '@/features/blog/services/post.service'
```

**Contrato público/privado:**

Todo diretório com `index.ts` define um **módulo com API pública**. Tudo que não está exportado pelo `index.ts` é considerado **privado** — um detalhe de implementação que pode mudar a qualquer momento sem aviso.

```
features/blog/
├─ services/post.service.ts   ← privado
├─ hooks/usePosts.ts          ← privado
└─ index.ts                   ← public API (único ponto de entrada)
```

Esse contrato permite refatorar, renomear ou reorganizar arquivos internos sem impactar nenhum consumidor externo do módulo.

---

## 1.5 Arquitetura Evolutiva

A arquitetura atual é **modular**, mas preparada para evoluir para estruturas mais avançadas como:

- Bounded Contexts
- Domain Modules
- Application Services

Isso evita **overengineering no início**, mas mantém espaço para crescimento.

---

# 2. Estrutura Oficial do Projeto

```
mks.dev
│
├─ app/                    # Camada de apresentação (Next.js App Router)
│
├─ components/             # Componentes visuais primitivos e reutilizáveis
│
├─ features/               # Funcionalidades da aplicação
│  ├─ blog/
│  ├─ projects/
│  └─ lab/
│
├─ domain/                 # Modelos e contratos de domínio
│  ├─ blog/
│  ├─ projects/
│  └─ lab/
│
├─ server/                 # Infraestrutura server-side
│  └─ content/
│      ├─ loader.ts
│      ├─ registry.ts
│      └─ index.ts
│
├─ content/                # Conteúdo estático (MDX)
│  ├─ blog/
│  ├─ projects/
│  └─ lab/
│
├─ lib/                    # Integrações com bibliotecas externas
│
├─ config/                 # Configurações globais da aplicação
│
└─ docs/
   └─ adr/                 # Architecture Decision Records
```

---

# 3. Camadas da Arquitetura

## 3.1 Camada `app/`

Responsável por:

- definição de rotas
- composição de páginas
- conexão entre UI e features

Regras:

- **não** deve conter lógica de negócio
- páginas devem ser finas — delegar para features
- pode importar de: `features`, `components`, `config`, `lib`
- pode importar **tipos** de `domain/` para anotação de props e parâmetros, usando obrigatoriamente `import type`

> Importações de `domain/` dentro de `app/` devem utilizar `import type` para garantir que nenhuma lógica de domínio seja acoplada à camada de apresentação. `import type` é removido pelo compilador em runtime — é uma garantia estrutural, não apenas uma convenção.

```typescript
// ✅ Correto — import type garante zero acoplamento em runtime
import type { Post } from '@/domain/blog'

// ❌ Errado — import regular pode trazer lógica acidentalmente
import { Post } from '@/domain/blog'
```

**Enforcement via ESLint:**

A regra de `import type` deve ser automatizada com `@typescript-eslint/consistent-type-imports`, que é a abordagem confiável usada em projetos TypeScript maduros:

```json
{
  "rules": {
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        "prefer": "type-imports",
        "fixStyle": "inline-type-imports"
      }
    ]
  }
}
```

Isso força `import type` em qualquer import que só use tipos — em todo o projeto, não apenas em `app/`. Verificável em CI e com autofix disponível.

Qualquer transformação ou busca de dados passa obrigatoriamente por `features/`.

---

## 3.2 Camada `components/`

Contém **apenas componentes visuais primitivos e reutilizáveis**, sem conhecimento de negócio.

Exemplos válidos:

```
Button.tsx
Card.tsx
Container.tsx
Section.tsx
Badge.tsx
```

Regras:

- **não** acessam `server`, `domain`, `features`
- recebem dados exclusivamente via props
- são **agnósticos de domínio**

> Componentes que conhecem tipos do domínio (ex: `PostCard`, `ProjectCard`) pertencem dentro de `features/<domínio>/components/`, não aqui.

Pode importar de: `lib`

> `config` não é permitido em `components/`. Componentes primitivos devem ser agnósticos do contexto da aplicação — importar `config/site.ts` ou `config/navigation.ts` os acopla ao projeto específico, quebrando reusabilidade. Dados de configuração chegam via props.

---

## 3.3 Camada `features/`

Cada feature representa uma **capacidade funcional do sistema**.

Estrutura interna recomendada:

```
features/blog/
│
├─ components/        # Componentes domain-aware (PostCard, PostList, etc.)
├─ hooks/             # React hooks da feature
├─ services/          # Application Services — orquestração de casos de uso
├─ utils/             # Funções utilitárias da feature
└─ index.ts           # API pública da feature (obrigatório)
```

Responsabilidades:

- orquestrar lógica da aplicação
- conectar domínio com interface
- encapsular funcionalidades por domínio

**`features/services/` = Application Layer**

Arquiteturalmente, `features/services/` representa a **camada de aplicação** — o mesmo conceito presente em Clean Architecture, DDD e Hexagonal Architecture. O modelo mental é:

```
UI (app)
  ↓
Application Layer (features/services)   ← coordena casos de uso
  ↓               ↓
Domain          Infrastructure
(domain)        (server / lib)
```

Essa camada coordena casos de uso do sistema sem conter lógica de domínio nem executar I/O diretamente. É o ponto onde os dois mundos se encontram — mas sem se misturar.

**Regra dos services:**

> `services/` **nunca acessa filesystem, APIs externas ou banco de dados diretamente**. Essa responsabilidade pertence a `server/` ou `lib/`. Services orquestram — delegam I/O para as camadas de infraestrutura.

```typescript
// ✅ Correto — service orquestra, delega para server
export async function getRecentPosts(): Promise<Post[]> {
  const posts = await loadPosts() // vem de server/
  return posts.slice(0, 5)
}

// ❌ Errado — service acessando filesystem diretamente
export async function getRecentPosts(): Promise<Post[]> {
  const files = fs.readdirSync('./content/blog') // não é responsabilidade de service
  ...
}
```

**Services devem permanecer finos:**

Um service deve preferencialmente: chamar loaders do `server/`, aplicar transformações leves e delegar lógica complexa ao `domain/`. Services que crescem demais são um sinal de que parte da lógica pertence ao domínio — não ao caso de uso.

```typescript
// ✅ Service fino — orquestra e delega
export async function getFeaturedPosts(): Promise<Post[]> {
  const posts = await loadPosts() // server/
  return posts.filter(isFeatured).slice(0, 3) // lógica leve inline
}

// ⚠️ Service gordo — lógica complexa que provavelmente pertence ao domain/
export async function getFeaturedPosts(): Promise<Post[]> {
  const posts = await loadPosts()
  return posts
    .filter((p) => p.tags.includes('featured') && !p.draft && isAfter(p.date, subDays(now, 30)))
    .sort((a, b) => calculateRelevanceScore(b) - calculateRelevanceScore(a))
    .slice(0, 3)
  // → mover calculateRelevanceScore e a lógica de filtro para domain/
}
```

Pode importar de: `domain`, `server`, `components`, `lib`, `config`

**Não pode importar de:** `app`

**Cross-feature imports:**

Features podem importar outras features, mas **apenas via `index.ts`** — nunca de arquivos internos.

```typescript
// ✅ Correto — feature/home consume API pública de feature/blog
import { getRecentPosts } from '@/features/blog'

// ❌ Errado — acesso a arquivo interno de outra feature
import { getRecentPosts } from '@/features/blog/services/post.service'
```

Quando o consumo entre features for necessário, ele deve reutilizar uma **capacidade funcional clara**, nunca duplicar lógica. Se duas features dependem fortemente uma da outra, a lógica compartilhada deve ser extraída para `domain/` ou `lib/`.

**Tamanho de features:**

Features devem permanecer focadas em um único domínio funcional. Thresholds para avaliação de divisão:

- mais de **~10 services** distintos
- mais de **~1000 linhas de código** na feature
- múltiplos subdomínios dentro da mesma feature
- dependência intensa de múltiplas outras features

Quando qualquer threshold for atingido, avalie extrair um novo domínio e feature correspondente. Registre a decisão em um ADR.

---

## 3.4 Camada `domain/`

Representa o **modelo central da aplicação**.

Organização por subdomínio:

```
domain/
├─ blog/
│  ├─ post.types.ts     # Tipos TypeScript derivados do schema
│  ├─ post.schema.ts    # Schema Zod (fonte da verdade)
│  └─ index.ts          # Barrel export obrigatório
├─ projects/
│  ├─ project.types.ts
│  ├─ project.schema.ts
│  └─ index.ts
└─ lab/
   ├─ experiment.types.ts
   ├─ experiment.schema.ts
   └─ index.ts
```

**Barrel export obrigatório em cada subdomínio:**

```typescript
// domain/blog/index.ts
export * from './post.types'
export * from './post.schema'
```

Nenhuma camada externa deve importar diretamente de `post.types.ts` ou `post.schema.ts`. Toda importação passa pelo `index.ts`:

```typescript
// ✅ Correto
import { Post, PostSchema } from '@/domain/blog'

// ❌ Errado
import { Post } from '@/domain/blog/post.types'
```

Convenção Zod → TypeScript:

> O **schema Zod é a fonte da verdade**. Os tipos TypeScript são **sempre inferidos** do schema, nunca declarados manualmente em paralelo.

```typescript
// post.schema.ts
import { z } from 'zod'

export const PostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  tags: z.array(z.string()).default([]),
})

// post.types.ts
import { z } from 'zod'
import { PostSchema } from './post.schema'

export type Post = z.infer<typeof PostSchema>
```

Responsabilidades:

- definição de schemas de validação (Zod)
- tipos TypeScript inferidos dos schemas
- contratos de dados do sistema

Regras:

- **não** depende de UI
- **não** depende de infraestrutura (`server`, `lib`)
- **não** depende de `features`
- **não** depende de `config`

> A única dependência externa permitida no domínio é **Zod** — a ferramenta de modelagem, não uma integração. Qualquer utilitário puro que o domínio precise deve viver dentro do próprio `domain/`, nunca ser importado de `lib/`.

### Imutabilidade de Entidades

Objetos de domínio devem ser tratados como **imutáveis** fora da camada `domain/`. Nenhuma camada externa deve modificar propriedades de uma entidade diretamente.

Transformações devem ocorrer dentro de `features/services/` ou em funções utilitárias controladas, sempre produzindo um novo objeto:

```typescript
// ❌ Errado — mutação direta de entidade de domínio
post.title = 'novo título'

// ✅ Correto — produz novo objeto sem mutar o original
const updatedPost = { ...post, title: 'novo título' }
```

Isso evita efeitos colaterais escondidos e mantém o fluxo de dados previsível.

### Restrições do Domínio

A camada `domain/` deve permanecer **totalmente independente e determinística**.

É proibido no domínio:

- acessar filesystem ou banco de dados
- fazer requisições a APIs externas
- usar React ou qualquer biblioteca de UI
- usar APIs específicas de framework (Next.js, Node.js)
- acessar variáveis de ambiente (`process.env`)
- executar qualquer side effect

> Dado o mesmo input, o domínio sempre produz o mesmo output. Sem exceções.

---

## 3.5 Camada `server/`

Contém a infraestrutura responsável por **obter, validar e preparar dados**.

Estrutura atual:

```
server/content/
├─ loader.ts     # Leitura e parsing de arquivos MDX
├─ registry.ts   # Mapeamento de domínios para coleções
└─ index.ts      # API pública do server
```

Responsabilidades:

- leitura de arquivos MDX
- parsing de frontmatter
- **validação obrigatória via schema Zod do domínio**
- transformação para entidades de domínio

Estratégia de tratamento de erros:

> O `loader.ts` **nunca retorna dados inválidos silenciosamente**. Arquivos com frontmatter malformado devem lançar um erro descritivo em build time, jamais em runtime para o usuário.

```typescript
// Exemplo de validação no loader
const result = PostSchema.safeParse(frontmatter)
if (!result.success) {
  throw new Error(`[loader] Frontmatter inválido em "${slug}": ${result.error.message}`)
}
```

Pode importar de: `domain`, `content` (via filesystem), `lib`

**Não pode importar de:** `features`, `app`, `components`

**Encapsulamento via `index.ts`:**

A mesma regra de encapsulamento que se aplica a `features/` se aplica a `server/`. Nenhuma camada deve importar diretamente dos arquivos internos do server:

```typescript
// ✅ Correto — importa pela API pública
import { loadPosts } from '@/server/content'

// ❌ Errado — importa arquivo interno diretamente
import { loadPosts } from '@/server/content/loader'
```

Isso garante que a implementação interna do loader (filesystem, parsing) possa ser alterada sem impactar as camadas que consomem os dados.

---

## 3.6 `content/` — Data Source

`content/` **não é uma camada da arquitetura**. É um **data source** — análogo a um banco de dados, uma API externa ou uma fila de mensagens. A distinção é importante: camadas têm responsabilidades arquiteturais e regras de dependência; data sources são apenas origens de dados.

```
Analogia:
  database  →  content/blog/
  SQL query →  server/content/loader.ts
  ORM model →  domain/blog/post.schema.ts
```

Estrutura:

```
content/
├─ blog/
├─ projects/
└─ lab/
```

Cada arquivo contém:

- `frontmatter` — metadados validados pelo schema Zod do domínio
- corpo em MDX

`content/` é acessado **exclusivamente** pela camada `server/`. Nenhuma outra parte do sistema lê arquivos diretamente daqui.

---

## 3.7 Camada `lib/`

Contém **integrações e adaptadores para bibliotecas externas**.

Exemplos:

```
lib/mdx.ts        # Configuração do processador MDX
lib/analytics.ts  # Wrapper de analytics
lib/env.ts        # Validação de variáveis de ambiente
```

Regras:

- **não** deve conter regras de negócio
- apenas integração com ferramentas externas

**`lib` é uma camada transversal** — pode ser importada por qualquer outra camada (`features`, `server`, `domain`, `app`).

---

## 3.8 Camada `config/`

Armazena configurações globais e estruturais da aplicação.

Exemplos:

```
config/site.ts          # Dados do site (nome, url, autor)
config/navigation.ts    # Estrutura de navegação
config/metadata.ts      # Metadados base (SEO)
```

**`config` é uma camada transversal** — pode ser importada por qualquer outra camada.

---

## 3.9 Camada `docs/`

Contém documentação técnica do projeto.

```
docs/
└─ adr/               # Architecture Decision Records
   ├─ ADR-001-architecture.md
   ├─ ADR-002-tech-stack.md
   └─ ...
```

ADR (Architecture Decision Record) registra:

- contexto da decisão
- a decisão tomada
- alternativas consideradas
- consequências e tradeoffs

---

# 4. Regras de Dependência

## 4.1 Dependências permitidas

```
app         → features, components, config, lib
app         → domain (import type apenas, nunca lógica)
features    → domain, server, components, lib, config
features    → outras features (apenas via index.ts)
server      → domain, lib
domain      → (nenhuma camada interna — apenas Zod como dependência externa)
components  → lib
lib         → (bibliotecas externas apenas)
config      → (valores estáticos apenas)
```

## 4.2 Dependências proibidas

```
domain      → features, server, components, app, lib, config
server      → features, app, components
components  → domain, server, features, app, config
```

## 4.3 Camadas transversais

`lib` e `config` podem ser importadas por qualquer camada **exceto `domain/` e `components/`**:

- `domain/` é puro — sem dependências externas além de Zod
- `components/` é UI primitiva — sem acoplamento ao contexto da aplicação

## 4.4 Ciclos de Dependência

Ciclos entre módulos são **proibidos**.

```
// ❌ Proibido — ciclo entre features
features/blog     → features/projects
features/projects → features/blog
```

Se dois módulos precisam compartilhar lógica, a solução é mover essa lógica para uma camada mais interna:

- lógica de domínio → `domain/`
- utilitário técnico → `lib/`
- dado estrutural → `config/`

Ciclos criam dependências invisíveis, dificultam testes isolados e tornam refatorações arriscadas. Ferramentas como `eslint-plugin-import` podem detectar ciclos automaticamente.

---

# 5. Convenções de Nomenclatura

## 5.1 Arquivos

| Tipo             | Convenção                        | Exemplo           |
| ---------------- | -------------------------------- | ----------------- |
| Componente React | `PascalCase.tsx`                 | `PostCard.tsx`    |
| Hook             | `camelCase.ts` com prefixo `use` | `usePosts.ts`     |
| Service          | `camelCase.service.ts`           | `post.service.ts` |
| Tipos TypeScript | `camelCase.types.ts`             | `post.types.ts`   |
| Schema Zod       | `camelCase.schema.ts`            | `post.schema.ts`  |
| Utilitário       | `camelCase.ts`                   | `formatDate.ts`   |
| Barrel export    | `index.ts`                       | `index.ts`        |
| Config           | `camelCase.ts`                   | `navigation.ts`   |

## 5.2 Variáveis e funções

- Funções e variáveis: `camelCase`
- Componentes e classes: `PascalCase`
- Constantes globais: `UPPER_SNAKE_CASE`
- Tipos e interfaces: `PascalCase`

## 5.3 Diretórios

Sempre `kebab-case` para diretórios:

```
features/blog/
features/lab-experiments/    ✅
features/labExperiments/     ❌
```

---

# 6. Variáveis de Ambiente

Toda variável de ambiente deve ser **validada via Zod** no arquivo `lib/env.ts` antes de ser usada no projeto.

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

Regras:

- **nunca** acessar `process.env` diretamente fora de `lib/env.ts`
- variáveis públicas (expostas ao browser): prefixo `NEXT_PUBLIC_`
- variáveis privadas (server-only): sem prefixo

---

# 7. Convenções de Commits

O projeto segue o padrão **Conventional Commits** com os seguintes escopos definidos:

| Escopo       | Uso                                      |
| ------------ | ---------------------------------------- |
| `hero`       | Hero section da home                     |
| `blog`       | Feature, domínio ou conteúdo de blog     |
| `projects`   | Feature, domínio ou conteúdo de projetos |
| `lab`        | Feature, domínio ou conteúdo do lab      |
| `config`     | Configurações globais                    |
| `server`     | Infraestrutura server-side               |
| `domain`     | Modelos e contratos de domínio           |
| `components` | Componentes visuais primitivos           |
| `lib`        | Integrações externas                     |
| `docs`       | Documentação e ADRs                      |
| `ci`         | CI/CD e deploy                           |
| `deps`       | Atualização de dependências              |

Exemplos:

```
feat(blog): add PostCard component
fix(server): handle missing frontmatter gracefully
chore(deps): update next to 15.x
docs(adr): add ADR-002 for MDX choice
refactor(domain): extract post schema to separate file
```

---

# 8. Testes

## 8.1 Localização

Testes ficam **co-localizados** com o arquivo que testam:

```
domain/blog/post.schema.test.ts
server/content/loader.test.ts
features/blog/services/post.service.test.ts
```

## 8.2 Prioridade por camada

| Camada              | Prioridade | Tipo de teste                      |
| ------------------- | ---------- | ---------------------------------- |
| `domain`            | Alta       | Unit (schemas Zod, transformações) |
| `server`            | Alta       | Unit (loader, parsing, erros)      |
| `features/services` | Média      | Unit / Integration                 |
| `components`        | Baixa      | Visual (futuramente)               |

## 8.3 Convenção de nomenclatura

- Arquivo de teste: `<nome>.test.ts` ou `<nome>.test.tsx`
- Describe block: nome da unidade testada
- It block: descreve o comportamento esperado em português

```typescript
describe('PostSchema', () => {
  it('deve rejeitar post sem título', () => { ... })
  it('deve aceitar tags como array vazio por padrão', () => { ... })
})
```

---

# 9. Regras de Dependência — Resumo Visual

```
┌─────────────────────────────────────────────────┐
│                     app                         │
│         (import type { X } from domain/ ↗)      │
└───────────────────────┬─────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│                   features        ←──────────┐  │
│                                  (via index) │  │
└──────────────┬─────────────┬─────────────────┘  │
               ↓             ↓                     │
┌──────────────────┐  ┌─────────────────────────┐  │
│     domain       │  │         server          │  │
└──────────────────┘  └────────────┬────────────┘  │
        ↑ (valida)                 ↓               │
        └──────────────────────────┘               │
                        ↓                          │
           ┌────────────────────────┐              │
           │ content (data source)  │              │
           └────────────────────────┘

Camadas base — UI primitiva, sem acesso a domain/server/features:
┌──────────────────────────────────────────┐
│              components/                 │
└──────────────────────────────────────────┘

Transversais — acessíveis por qualquer camada:
┌──────────────┐   ┌──────────────┐
│     lib      │   │    config    │
└──────────────┘   └──────────────┘
```

---

# 10. Side Effects

Operações com efeitos colaterais — filesystem, rede, banco de dados, analytics, cookies — devem ocorrer **apenas** nas seguintes camadas:

- `server/` — I/O de dados (filesystem, MDX, APIs server-side)
- `lib/` — integrações externas (analytics, serviços de terceiros)

**`features/services/`** pode **orquestrar** side effects, mas nunca executá-los diretamente. Um service chama `server/` ou `lib/`, não acessa o filesystem ou faz fetch diretamente.

**`domain/` e `components/` devem ser totalmente puros** — dado o mesmo input, sempre produzem o mesmo output, sem dependências externas ou estado global.

```typescript
// ✅ Correto — side effect isolado em server/
// server/content/loader.ts
export async function loadPosts() {
  const files = fs.readdirSync(contentPath) // filesystem aqui
  ...
}

// ✅ Correto — service orquestra, não executa I/O
// features/blog/services/post.service.ts
export async function getRecentPosts() {
  const posts = await loadPosts() // delega para server/
  return posts.slice(0, 5)
}

// ❌ Errado — service executando side effect diretamente
// features/blog/services/post.service.ts
export async function getRecentPosts() {
  const files = fs.readdirSync(contentPath) // não é responsabilidade de service
  ...
}
```

---

# 11. Filosofia do Projeto

### Domínio em primeiro lugar

A modelagem do domínio é a base da arquitetura. Antes de criar uma feature, defina o modelo.

### Simplicidade arquitetural

Preferimos soluções simples, baixo acoplamento e alta legibilidade. Complexidade deve ser justificada.

### Schema como fonte da verdade

Zod schemas definem o contrato dos dados. Tipos TypeScript são sempre inferidos — nunca duplicados.

### Evolução contínua

A arquitetura deve evoluir com o sistema, sem introduzir complexidade desnecessária antecipadamente.

---

# 12. Aliases de Import

O projeto utiliza aliases de import configurados em `tsconfig.json` para evitar caminhos relativos longos e tornar as importações legíveis.

**Aliases definidos:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/app/*": ["./app/*"],
      "@/features/*": ["./features/*"],
      "@/domain/*": ["./domain/*"],
      "@/server/*": ["./server/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/config/*": ["./config/*"],
      "@/content/*": ["./content/*"]
    }
  }
}
```

**Regra:**

> Importações entre camadas **sempre usam aliases**. Caminhos relativos são permitidos apenas dentro da mesma camada.

```typescript
// ✅ Correto — entre camadas, usa alias
import { Post } from '@/domain/blog'
import { getPosts } from '@/features/blog'

// ✅ Correto — dentro da mesma feature, pode ser relativo
import { formatDate } from '../utils/formatDate'

// ❌ Errado — caminho relativo entre camadas
import { Post } from '../../../domain/blog'
```

---

# 13. React Server Components

O projeto usa Next.js 16 com App Router. Por padrão, todos os componentes dentro de `app/` são **React Server Components (RSC)**.

**Regra:**

> `'use client'` deve ser adicionado **apenas quando necessário**. O objetivo é minimizar o JavaScript enviado ao cliente.

Quando usar `'use client'`:

- hooks de estado: `useState`, `useReducer`
- hooks de efeito: `useEffect`, `useLayoutEffect`
- hooks de interatividade: `useRef`, event handlers
- bibliotecas client-only (animações, analytics no browser)

Quando **não** usar `'use client'`:

- busca de dados (use `async/await` direto no componente server)
- acesso a `domain` ou `server`
- componentes puramente visuais sem interatividade

```typescript
// ✅ Server Component — padrão, sem diretiva necessária
export default async function BlogPage() {
  const posts = await getPosts() // busca dados no servidor
  return <PostList posts={posts} />
}

// ✅ Client Component — apenas quando há interatividade
'use client'
export function SearchInput() {
  const [query, setQuery] = useState('')
  return <input value={query} onChange={e => setQuery(e.target.value)} />
}
```

**Impacto arquitetural:** componentes em `features/<domínio>/components/` que apenas recebem dados via props e renderizam HTML são **server components por padrão** — não precisam de `'use client'`.

---

# 14. Estado Global

O projeto **evita estado global** sempre que possível. A arquitetura baseada em React Server Components reduz naturalmente a necessidade de estado compartilhado — dados vêm do servidor, não de stores client-side.

Regras:

- preferir dados via RSC — busca no servidor, sem estado cliente
- estado local em componentes `'use client'` quando necessário para interatividade
- evitar stores globais (`Redux`, `Zustand`, `Context` amplo) sem necessidade arquitetural clara e documentada

> Se um estado global for necessário no futuro, a decisão deve ser registrada em um **ADR** antes de ser implementada. Estado global é uma decisão arquitetural, não uma escolha de implementação.

---

# 15. Build Time Architecture

O sistema mks.dev é **orientado a build time**. Todo o conteúdo é processado durante o build e transformado em páginas estáticas antes de chegar ao usuário.

```
build time                          runtime
──────────────────────────────────  ──────────────
content/*.mdx                       página HTML estática
    ↓                                    ↓
server/content/loader.ts            zero processamento
    ↓                               zero dependência externa
domain/*/post.schema.ts             zero latência de dados
    ↓
features/*/services/
    ↓
app/*/page.tsx → HTML estático
```

**Consequências arquiteturais:**

- parsing MDX ocorre em build — nunca em runtime
- validação Zod ocorre em build — erros são detectados antes do deploy
- o `server/` só é executado durante o build, nunca pelo usuário final
- runtime é extremamente simples — servir arquivos estáticos

**Regra:**

> Qualquer lógica que pode ser executada em build time **deve** ser executada em build time. Mover processamento para runtime sem justificativa é uma regressão arquitetural.

Isso garante performance máxima, segurança (sem lógica server-side exposta em produção) e falhas detectadas antecipadamente no CI — nunca em produção.

---

# 16. Anti-Patterns Arquiteturais

Arquitetura não quebra por falta de boas decisões — quebra por más decisões que se acumulam silenciosamente. Esta seção documenta os anti-patterns mais comuns para que possam ser identificados e revertidos antes de se tornarem dívida técnica.

**Lógica de negócio em componentes React**

```typescript
// ❌ Componente fazendo o que é responsabilidade de service/domain
export function PostList() {
  const posts = usePosts()
  const featured = posts.filter(p => p.tags.includes('featured') && !p.draft)
  const sorted = featured.sort((a, b) => new Date(b.date) - new Date(a.date))
  ...
}
// → mover para features/blog/services/ ou domain/blog/
```

**Features acessando filesystem ou APIs diretamente**

```typescript
// ❌ I/O dentro de service
export async function getPosts() {
  const files = fs.readdirSync('./content/blog') // pertence a server/
}
```

**Importar arquivos internos de outro módulo**

```typescript
// ❌ Viola encapsulamento — acopla à implementação interna
import { formatPost } from '@/features/blog/utils/formatPost'
// → importar apenas de '@/features/blog'
```

**Domain com dependências externas**

```typescript
// ❌ Domain importando biblioteca de UI ou framework
import { cache } from 'react' // Next.js/React
import { readFileSync } from 'fs' // Node.js
import { z } from 'zod' // ✅ exceção — Zod é a ferramenta do domínio
```

**Estado global sem decisão arquitetural**

```typescript
// ❌ Store global adicionado sem ADR e sem justificativa clara
import { create } from 'zustand'
export const useAppStore = create(...)
// → criar ADR antes de qualquer store global
```

**Ciclos entre módulos**

```typescript
// ❌ Ciclo — A depende de B, B depende de A
import { x } from '@/features/projects' // dentro de features/blog
import { y } from '@/features/blog' // dentro de features/projects
// → extrair lógica compartilhada para domain/ ou lib/
```

**Barrel exports incompletos**

```typescript
// ❌ Exportar seletivamente e forçar imports diretos
// features/blog/index.ts exportando só metade das funções públicas
// → index.ts deve ser a única porta de entrada do módulo
```

---

# 17. Possíveis Evoluções Arquiteturais

A arquitetura atual foi projetada para permitir crescimento sem reestruturação drástica. Se o sistema crescer significativamente, as evoluções naturais são:

**Bounded Contexts em `domain/`**

```
domain/
  blog/
  projects/
  lab/
  # → cada um pode evoluir para um contexto completamente isolado
  #   com domain/, application/, infrastructure/ próprios
```

**Application Modules mais fortes em `features/`**

Features que crescem muito podem evoluir para módulos com fronteiras mais rígidas, aproximando-se de um monorepo interno:

```
features/blog/
  # hoje: components, hooks, services, utils
  # amanhã: package próprio com API explícita
```

**Content Collections independentes**

Se o volume de conteúdo crescer, o `server/content/` pode evoluir para suportar múltiplas fontes de dados (CMS externo, API, banco), mantendo a mesma interface para `features/`.

**Indexação e busca**

A adição de busca full-text pode exigir uma nova camada de infraestrutura em `server/search/`, seguindo os mesmos princípios do `server/content/`.

> Cada uma dessas evoluções deve ser registrada em um **ADR** antes de ser implementada.

---

# 18. Ferramentas de Enforcement

Arquitetura sem enforcement automatizado vira sugestão. As seguintes ferramentas garantem que as convenções deste documento sejam verificáveis em CI:

**ESLint — regras de import**

```json
// .eslintrc
{
  "plugins": ["import"],
  "rules": {
    "import/no-cycle": "error",
    "import/no-internal-modules": [
      "error",
      {
        "allow": ["*/index"]
      }
    ]
  }
}
```

**TypeScript — path aliases**

Configurados em `tsconfig.json` para tornar as camadas endereçáveis por nome e eliminar caminhos relativos entre camadas.

**eslint-plugin-import — detecção de ciclos**

`import/no-cycle` detecta automaticamente dependências circulares entre módulos — especialmente útil à medida que o número de features cresce.

**CI — validações obrigatórias**

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: pnpm lint # ESLint com regras de import

- name: Type check
  run: pnpm type-check # TypeScript sem emitir arquivos

- name: Test
  run: pnpm test # domain e server com prioridade
```

> A arquitetura é tão forte quanto seu enforcement. Regras que só existem no documento são frágeis — regras verificadas em CI são robustas.

---

# 19. Regra Final

Sempre que houver dúvida sobre onde algo deve ficar:

1. verifique a responsabilidade da camada
2. verifique a direção das dependências
3. mantenha o domínio independente
4. verifique se está encapsulando via `index.ts`

Se ainda houver dúvida, registre a decisão em um **ADR** em `docs/adr/`.

---

_Este documento é a **referência oficial de arquitetura do projeto mks.dev**._
