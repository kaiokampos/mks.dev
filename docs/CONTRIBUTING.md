# Contribuindo com o mks.dev

Este documento descreve como trabalhar no projeto — setup, fluxo de desenvolvimento e padrões obrigatórios.

---

## Setup

Siga o [`docs/SETUP_GUIDE.md`](./docs/SETUP_GUIDE.md) para configurar o ambiente local do zero.

---

## Antes de começar

Leia a documentação de arquitetura antes de escrever código:

1. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — entender o sistema como um todo
2. [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md) — regras que governam o dia a dia
3. [`docs/PROJECT_STRUCTURE.md`](./docs/PROJECT_STRUCTURE.md) — onde cada coisa vai

Se surgir dúvida sobre onde algo deve ficar, a resposta está em `CONVENTIONS.md`.

---

## Fluxo de trabalho

```
main (protegida)
  └── feature/nome-da-feature
        └── commits atômicos
              └── PR → main
```

Nunca commitar diretamente na `main`.

---

## Commits

O projeto segue [Conventional Commits](https://www.conventionalcommits.org/).
O `commitlint` valida automaticamente cada mensagem via git hook.

**Formato:**

```
tipo(escopo): descrição em minúsculas
```

**Tipos válidos:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `ci`

**Escopos válidos:**
`hero`, `blog`, `projects`, `lab`, `config`, `server`, `domain`, `components`, `lib`, `docs`, `ci`, `deps`

**Exemplos:**

```
feat(blog): add PostCard component
fix(server): handle missing frontmatter gracefully
docs(adr): add ADR-003 for MDX parser choice
refactor(domain): extract slug validation to shared util
chore(deps): update next to 15.2.0
```

---

## Qualidade

O pre-commit hook roda automaticamente ao commitar:

- **ESLint** — regras de arquitetura (ciclos, encapsulamento, import type)
- **Prettier** — formatação consistente

O CI valida tudo novamente no push:

```
type-check → lint → format:check → test → build
```

Se qualquer gate falhar, o merge é bloqueado.

---

## Adicionando conteúdo

Posts, projetos e experimentos vivem em `content/`:

```
content/blog/nome-do-post.mdx
content/projects/nome-do-projeto.mdx
content/lab/nome-do-experimento.mdx
```

O frontmatter de cada arquivo é validado contra o schema Zod do domínio correspondente.
Se o frontmatter for inválido, o build falha com uma mensagem de erro clara.

---

## Decisões arquiteturais

Qualquer mudança significativa na arquitetura — nova camada, nova dependência, alteração nas convenções — deve ser registrada em um ADR antes de ser implementada.

```
docs/adr/ADR-XXX-descricao.md
```

Consulte os ADRs existentes em `docs/adr/` como referência de formato.
