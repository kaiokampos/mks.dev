# ADR-001 — Arquitetura Base do Sistema

Status: **Aprovado**
Data: 2026-03-11
Relacionado a: [ADR-002 — Tech Stack](./ADR-002-tech-stack.md)

---

## Contexto

O projeto mks.dev precisava de uma arquitetura que atendesse simultaneamente a dois objetivos:

- funcionar como um site pessoal técnico real, com conteúdo publicável e manutenível
- servir como vitrine de engenharia — a estrutura do projeto em si comunica qualidade técnica

Isso exigia uma arquitetura que fosse **simples o suficiente para um projeto solo**, mas **madura o suficiente para demonstrar pensamento arquitetural consciente**.

As alternativas consideradas foram:

- **Tudo em `app/`**: simples, mas sem separação de responsabilidades — não demonstra nada além de conhecimento de Next.js
- **Feature folders planos**: organização por feature sem separação de domínio e infraestrutura — melhor, mas ainda mistura lógica de aplicação com I/O
- **Clean Architecture completa**: ports, adapters, use cases, repositories — overengineered para um site pessoal
- **Modular Layered Architecture**: camadas com responsabilidades claras, domínio isolado, infraestrutura separada — equilibrado

---

## Decisão

Adotar uma **Modular Layered Architecture** com inspiração em DDD Lite e Clean Architecture, organizada nas seguintes camadas:

```
app/          — apresentação (Next.js App Router)
features/     — application layer (casos de uso, orquestração)
domain/       — modelo conceitual (schemas, tipos, contratos)
server/       — infraestrutura (I/O, filesystem, MDX)
content/      — data source (arquivos MDX)
components/   — UI primitivos (agnósticos de domínio)
lib/          — integrações externas
config/       — configurações globais
```

Com as seguintes regras de dependência:

```
app         → features, components, lib, config
app         → domain (import type apenas)
features    → domain, server, components, lib, config
features    → outras features (via index.ts)
server      → domain, lib
domain      → (nenhuma — apenas Zod como dependência externa)
components  → lib
```

E os seguintes princípios não negociáveis:

1. **Domínio puro**: `domain/` não depende de nenhuma camada interna nem de bibliotecas externas além de Zod. Dado o mesmo input, sempre produz o mesmo output.
2. **I/O centralizado**: todo acesso a filesystem ocorre em `server/`. Features nunca executam I/O diretamente.
3. **Encapsulamento via `index.ts`**: todo módulo expõe API pública exclusivamente pelo `index.ts`. Arquivos internos são privados.
4. **content/ é data source, não camada**: não tem responsabilidades arquiteturais. É acessado exclusivamente por `server/`.
5. **Build-time first**: todo processamento que pode ocorrer em build time deve ocorrer em build time. Runtime serve HTML estático.

---

## Consequências

### Benefícios

- domínio isolado e testável independentemente de framework
- infraestrutura de I/O centralizada e substituível
- encapsulamento real de módulos via `index.ts`
- separação clara entre orquestração (features) e execução de I/O (server)
- arquitetura preparada para evoluir para bounded contexts sem reestruturação drástica

### Tradeoffs

- maior número de diretórios que uma estrutura flat
- requer disciplina para manter as fronteiras de dependência
- newcomers precisam ler a documentação antes de contribuir

### Mitigações

- `CONVENTIONS.md` documenta todas as regras com exemplos de código
- aliases de import (`@/domain/*`, `@/features/*`) tornam as fronteiras visíveis
- `eslint-plugin-import` detecta ciclos automaticamente em CI
- `@typescript-eslint/consistent-type-imports` enforça `import type` onde necessário

---

## Possível Evolução

Se o sistema crescer significativamente, a arquitetura pode evoluir para bounded contexts:

```
contexts/
  blog/
    domain/
    application/
    infrastructure/
    presentation/
  projects/
  lab/
```

Essa evolução só deve ocorrer quando a complexidade justificar. A arquitetura atual foi projetada para permitir essa migração sem reescrita — as fronteiras já estão onde precisariam estar.

---

_Este ADR registra oficialmente a decisão arquitetural base do projeto mks.dev._
