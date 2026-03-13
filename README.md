# mks.dev

Portfólio técnico pessoal — Miguel, Kaio e Samara.

Site estático construído com Next.js 16, TypeScript e MDX. Serve como vitrine de engenharia: a qualidade da arquitetura é parte do produto.

**Deploy:** [mksdev.vercel.app](https://mksdev.vercel.app)

---

## Stack

| Camada          | Tecnologia                 |
| --------------- | -------------------------- |
| Framework       | Next.js 16 (App Router)    |
| Linguagem       | TypeScript 5 — strict mode |
| Estilo          | Tailwind CSS 4.x           |
| Validação       | Zod                        |
| Conteúdo        | MDX                        |
| Package manager | pnpm                       |
| Deploy          | Vercel                     |
| Testes          | Vitest                     |

---

## Setup local

**Pré-requisitos:** Node.js 24, pnpm 9+

```bash
# Clonar o repositório
git clone git@github.com:kaiokampos/mks.dev.git
cd mks.dev

# Instalar dependências (instala e ativa os git hooks automaticamente)
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# edite .env.local com os valores corretos

# Rodar em desenvolvimento
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Scripts disponíveis

```bash
pnpm dev           # servidor de desenvolvimento
pnpm build         # build de produção
pnpm start         # rodar o build localmente
pnpm type-check    # verificar tipos TypeScript
pnpm lint          # ESLint
pnpm format        # Prettier (modifica arquivos)
pnpm format:check  # Prettier (só verifica, sem modificar — usado no CI)
pnpm test          # Vitest em modo watch
pnpm coverage      # relatório de cobertura de testes
```

---

## Estrutura do projeto

A arquitetura segue um modelo de **Modular Layered Architecture** com inspiração em DDD Lite:

```
app/          → apresentação (Next.js App Router)
features/     → application layer (casos de uso, orquestração)
domain/       → modelo conceitual (schemas Zod, tipos)
server/       → infraestrutura (leitura de MDX, filesystem)
content/      → data source (arquivos .mdx)
components/   → UI primitivos (agnósticos de domínio)
lib/          → integrações externas
config/       → configurações globais
docs/         → documentação e ADRs
```

Para entender as decisões e convenções em detalhe:

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — visão arquitetural do sistema
- [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md) — regras e convenções do projeto
- [`docs/PROJECT_STRUCTURE.md`](./docs/PROJECT_STRUCTURE.md) — estrutura de diretórios
- [`docs/adr/`](./docs/adr/) — Architecture Decision Records

---

## Contribuindo

Veja [`CONTRIBUTING.md`](./CONTRIBUTING.md) antes de abrir um PR.

---

## Licença

MIT — veja [`LICENSE`](./LICENSE).
