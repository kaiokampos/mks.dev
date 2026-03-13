# Setup Guide — mks.dev

Guia completo para criar o projeto do zero no Linux.
Execute cada bloco em sequência — cada passo depende do anterior.

---

## Pré-requisitos

Este guia assume que o `setup-dev.sh` já foi executado. Verifique:

```bash
mise --version    # deve retornar 2026.x.x
node --version    # deve ser v24.x (gerenciado pelo mise)
pnpm --version    # deve ser v9.x ou superior
git --version
```

Se o Node ainda não estiver disponível após o setup:

```bash
mise install      # instala versões definidas no mise.toml
```

---

## Passo 1 — Criar o projeto Next.js

```bash
pnpm create next-app@latest mks.dev \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --no-import-alias
cd mks.dev
```

> **Por que `--no-src-dir`?** As camadas (`features/`, `domain/`, `server/`) ficam na
> raiz do projeto — não em `src/`. Isso mantém imports limpos e comunica visualmente
> que a arquitetura é de primeira classe.
>
> **Por que `--no-import-alias`?** O create-next-app adicionaria apenas `@/*`.
> Vamos configurar aliases granulares por camada no tsconfig.json.
>
> **Turbopack** é o bundler padrão no Next.js 16 — não é preciso ativar manualmente.

---

## Passo 2 — Limpar o scaffold padrão

```bash
rm -rf app/fonts
rm -f app/page.tsx app/globals.css
touch app/globals.css
touch app/page.tsx
```

---

## Passo 3 — Criar estrutura de diretórios

```bash
# Features (Application Layer)
mkdir -p features/blog/{components,hooks,services,utils}
mkdir -p features/projects
mkdir -p features/lab

# Domain (modelo conceitual)
mkdir -p domain/{blog,projects,lab}

# Server (infraestrutura I/O)
mkdir -p server/content

# Content (data source — MDX)
mkdir -p content/{blog,projects,lab}

# UI primitivos
mkdir -p components/ui

# Transversais
mkdir -p lib
mkdir -p config

# Documentação
mkdir -p docs/adr

# CI/CD
mkdir -p .github/workflows

# Barrel exports — API pública de cada módulo
touch features/blog/index.ts
touch features/projects/index.ts
touch features/lab/index.ts
touch domain/blog/index.ts
touch domain/projects/index.ts
touch domain/lab/index.ts
touch server/content/index.ts
```

> **Por que criar os `index.ts` agora?** Cada módulo expõe sua API pública exclusivamente
> via `index.ts`. Criar o arquivo desde o início garante que os path aliases do TypeScript
> resolvam corretamente mesmo antes de ter conteúdo.

---

## Passo 4 — Instalar dependências

```bash
# Produção
pnpm add zod

# ESLint — enforcement de arquitetura
# Nota: eslint e @typescript-eslint já vêm com create-next-app
pnpm add -D \
  typescript-eslint \
  eslint-plugin-import \
  eslint-import-resolver-typescript \
  eslint-config-prettier

# Formatação
pnpm add -D prettier

# Git hooks — qualidade local antes do push
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# Testes
pnpm add -D vitest @vitejs/plugin-react jsdom @vitest/coverage-v8
```

---

## Passo 5 — Substituir arquivos de configuração

Substitua os arquivos gerados pelo create-next-app pelos arquivos de `CONFIG_FILES.md`:

```
mise.toml               ← criar novo (versões de runtime do projeto)
tsconfig.json           ← substitui o gerado (adiciona path aliases)
eslint.config.mjs       ← substitui o gerado (adiciona regras de arquitetura)
.prettierrc             ← criar novo
.prettierignore         ← criar novo
commitlint.config.mjs   ← criar novo
lint-staged.config.mjs  ← criar novo
vitest.config.ts        ← criar novo
.env.example            ← criar novo
lib/env.ts              ← criar novo
domain/blog/post.schema.ts      ← criar novo
domain/blog/post.schema.test.ts ← criar novo
.github/workflows/ci.yml        ← criar novo
```

---

## Passo 6 — Atualizar package.json

Abra o `package.json` gerado e **substitua a seção `scripts`** por:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage",
    "prepare": "husky"
  }
}
```

> **Por que `lint: "eslint"` sem argumentos?** No Next.js 16, `next lint` foi removido.
> O ESLint 9 com flat config detecta automaticamente os arquivos pelo `eslint.config.mjs`.
> Não é mais necessário passar `--ext` ou diretórios explicitamente.
>
> **`prepare: "husky"`** roda automaticamente após `pnpm install`. Garante que os git
> hooks sejam instalados quando qualquer colaborador clonar o repo.

---

## Passo 7 — Configurar Husky

```bash
pnpm exec husky init

# Pre-commit: lint + format nos arquivos staged
echo "pnpm exec lint-staged" > .husky/pre-commit

# Commit-msg: valida mensagem contra Conventional Commits
echo "pnpm exec commitlint --edit \$1" > .husky/commit-msg
```

---

## Passo 8 — Mover documentação para o lugar correto

```bash
mkdir -p docs/adr
mv CONVENTIONS.md docs/
mv ARCHITECTURE.md docs/
mv PROJECT_STRUCTURE.md docs/
mv SETUP_GUIDE.md docs/
mv CONFIG_FILES.md docs/
mv ADR-001-architecture.md docs/adr/
mv ADR-002-tech-stack.md docs/adr/
```

---

## Passo 9 — Validar a fundação

```bash
pnpm type-check    # zero erros TypeScript
pnpm lint          # zero warnings ESLint
pnpm format:check  # zero arquivos fora do padrão
pnpm test:run      # testes passando
pnpm build         # build limpo
```

**Todos os cinco devem passar sem erro.** Se qualquer um falhar, corrija antes de avançar.

---

## Passo 10 — Primeiro commit

```bash
git add .
git commit -m "chore(config): scaffold project with architecture foundation"
```

O commitlint valida a mensagem automaticamente via hook.

---

## Passo 11 — Subir para o GitHub

```bash
git remote add origin git@github.com:kaiokampos/mks.dev.git
git branch -M main
git push -u origin main
```

Após o push, o CI roda automaticamente no GitHub Actions.
Aguarde ficar verde antes de avançar para código de produto.

---

## Próxima sessão

```
domain/blog/post.schema.ts       ← já gerado, revisar
domain/projects/project.schema.ts
domain/lab/experiment.schema.ts
server/content/loader.ts
lib/env.ts                       ← já gerado, copiar
→ vertical slice: blog post simples
→ Hero section
```

_Não avance para código de produto antes do Passo 9 estar 100% verde._
