# ARCHITECTURE.md

> Este documento descreve a **visão arquitetural** do sistema mks.dev — o contexto, os domínios, o fluxo de dados e as decisões de design que moldaram a estrutura atual.
>
> Para as **regras e convenções** que governam o dia a dia do desenvolvimento, consulte `CONVENTIONS.md`.
> Para as **decisões técnicas** com contexto e tradeoffs, consulte `docs/adr/`.

---

## Contexto do Sistema

O **mks.dev** é um site pessoal técnico que serve dois propósitos simultâneos: ser um produto real com conteúdo útil, e ser uma vitrine da qualidade de engenharia do seu autor.

Isso influencia diretamente as decisões de arquitetura. Um site que apenas funciona não é suficiente — ele precisa demonstrar modelagem, separação de responsabilidades e pensamento arquitetural consciente.

O sistema é **estático por natureza**: todo o conteúdo é conhecido em build time, não há autenticação, não há banco de dados em produção. Isso simplifica a infraestrutura mas exige uma arquitetura de dados clara para organizar o conteúdo editorial.

---

## Domínios do Sistema

O sistema é organizado em torno de três domínios funcionais:

**`blog`** — artigos técnicos publicados pelo autor. Cada post tem metadados estruturados (título, data, tags, slug) e corpo em MDX. O domínio representa o modelo de um `Post`.

**`projects`** — projetos desenvolvidos pelo autor. Cada projeto tem contexto, stack técnica e links. O domínio representa o modelo de um `Project`.

**`lab`** — experimentos públicos, protótipos e explorações técnicas. Mais informal que os projetos, mais técnico que o blog. O domínio representa o modelo de um `Experiment`.

Cada domínio é **independente**: possui seus próprios modelos, feature correspondente e conteúdo. Eles não se conhecem entre si.

---

## Arquitetura de Camadas

O sistema segue uma **Modular Layered Architecture** com separação clara entre apresentação, aplicação, domínio e infraestrutura.

```
┌──────────────────────────────────────────────┐
│                    app/                      │
│         Apresentação — Next.js App Router    │
│         rotas · páginas · layouts            │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│                  features/                   │
│      Application Layer — casos de uso        │
│      orquestração · services · UI domain     │
└──────────────┬───────────────────────────────┘
               ↓               ↓
┌──────────────────────┐  ┌───────────────────────────┐
│      domain/         │  │         server/            │
│  Modelo Conceitual   │  │  Infraestrutura — I/O      │
│  schemas · tipos     │  │  filesystem · MDX · parse  │
│  puro · sem deps     │  └─────────────┬─────────────┘
└──────────────────────┘                ↓
        ↑ valida                ┌───────────────────┐
        └────────────────────── │   content/        │
                                │  data source MDX  │
                                └───────────────────┘

Camada base UI — sem acesso a domain/server/features:
┌──────────────────────────────────────────────┐
│              components/                     │
│   UI primitivos · agnósticos de domínio      │
└──────────────────────────────────────────────┘

Transversais — acessíveis por app, features e server:
┌──────────────┐   ┌──────────────┐
│     lib/     │   │   config/    │
│   adapters   │   │   globals    │
└──────────────┘   └──────────────┘
```

---

## Fluxo de Dados

O fluxo principal do sistema é o seguinte:

**1. Conteúdo editorial** vive em `content/` como arquivos `.mdx` com frontmatter estruturado.

**2. A infraestrutura** em `server/content/` lê esses arquivos, faz o parsing do frontmatter e valida os dados contra os schemas Zod definidos em `domain/`. Se a validação falhar, o build falha — dados inválidos nunca chegam ao usuário.

**3. Os Application Services** em `features/<domínio>/services/` consomem a API do `server/` e orquestram os dados para os casos de uso da aplicação (listar posts recentes, buscar por slug, filtrar por tag, etc.).

**4. Os componentes** em `features/<domínio>/components/` recebem os dados via props e renderizam a UI. Por padrão, são React Server Components.

**5. As páginas** em `app/` compõem os componentes e serviços, definindo o layout e a estrutura de rotas.

```
content/*.mdx
    ↓
server/content/loader.ts  [parse + validate via Zod]
    ↓
domain/<domínio>/          [schema é a fonte da verdade]
    ↓
features/<domínio>/services/  [Application Services]
    ↓
features/<domínio>/components/  [RSC por padrão]
    ↓
app/<rota>/page.tsx
```

---

## Decisões de Design

**Por que MDX e não um CMS?**
Conteúdo versionado junto ao código — cada publicação é um commit. Sem dependência externa em runtime. Build-time rendering para performance máxima. Adequado para um autor técnico que é o único editor.

**Por que `domain/` isolado?**
O domínio não sabe que existe Next.js, nem MDX, nem filesystem. Isso significa que os modelos de dados poderiam ser reutilizados em outro contexto sem alteração. É a principal proteção contra acoplamento ao framework.

**Por que `server/` separado de `features/`?**
Para evitar I/O espalhado. Sem essa separação, é comum encontrar `fs.readFileSync()` dentro de services ou hooks. Centralizar o acesso ao filesystem em uma única camada torna o código previsível e testável.

**Por que `features/services/` = Application Services?**
Seguindo a terminologia de DDD lite: a camada de aplicação coordena casos de uso sem conter lógica de domínio. O domínio fica em `domain/`. O I/O fica em `server/`. Os services apenas orquestram — isso mantém cada camada com uma única responsabilidade.

---

## Possível Evolução

A arquitetura atual suporta crescimento sem reescrita. Se o sistema escalar significativamente, a evolução natural seria organizar por **bounded contexts**:

```
contexts/
  blog/
    domain/
    application/
    infrastructure/
    presentation/
  projects/
    ...
```

Cada contexto passaria a ser uma unidade completamente autocontida. Essa refatoração **só faz sentido quando a complexidade justificar** — hoje a arquitetura modular atual é o nível correto.

---

_Visão arquitetural do projeto mks.dev. Última atualização: 2026-03-11._
