# ADR-002 — Decisões de Tech Stack

Status: **Aprovado**
Data: 2026-03-11
Relacionado a: [ADR-001 — Arquitetura Base](./ADR-001-architecture.md)

---

## Contexto

O projeto mks.dev precisava definir as ferramentas e tecnologias que formariam a base do desenvolvimento. As decisões precisavam atender a três critérios simultaneamente:

- adequação para um site pessoal técnico com conteúdo estático
- experiência de desenvolvimento produtiva
- servir como vitrine técnica — o próprio portfólio demonstra as escolhas que defende

Isso significa que as decisões de tech stack não são apenas técnicas: elas também comunicam posicionamento profissional.

---

## Decisões

### Next.js 16 com App Router

**Motivo:** React Server Components permitem renderizar conteúdo MDX no servidor sem enviar JavaScript desnecessário ao cliente — especialmente relevante para um site de conteúdo. Layouts aninhados do App Router reduzem duplicação estrutural entre páginas de blog e projetos. O Pages Router está em modo de manutenção.

**Alternativas consideradas:** Astro, Remix, SvelteKit.

**Tradeoffs:**

- App Router tem curva de aprendizado maior que Pages Router
- Documentação de alguns casos de uso ainda em evolução

---

### TypeScript

**Motivo:** TypeScript garante contratos explícitos entre as camadas do sistema (`domain`, `server`, `features`), reduzindo erros de integração em tempo de compilação. Especialmente crítico no fluxo `MDX → parsing → entidade de domínio`, onde dados externos precisam ser validados antes de entrar na aplicação.

**Alternativas consideradas:** Nenhuma — TypeScript é o padrão do ecossistema Next.js moderno.

---

### Tailwind CSS 4.x

**Motivo:** Alta produtividade com utilitários. A versão 4.x usa CSS nativo como configuração, eliminando o `tailwind.config.js` e reduzindo a superfície de configuração do projeto.

**Alternativas consideradas:** CSS Modules, Vanilla Extract, UnoCSS.

**Tradeoffs:**

- Markup pode ficar verboso com muitas classes utilitárias
- Acoplamento ao framework Tailwind — migração futura exigiria reescrita de estilos

---

### Zod

**Motivo:** Validação de schemas em runtime com inferência automática de tipos TypeScript. Permite que o schema seja a fonte da verdade — os tipos são sempre derivados do schema, nunca declarados em paralelo. Isso conecta diretamente com a convenção arquitetural definida em CONVENTIONS.md.

**Alternativas consideradas:** Yup, Valibot, TypeBox.

---

### MDX como fonte de dados

**Motivo:** Conteúdo versionado junto ao código no mesmo repositório. Sem dependência de CMS externo ou API. Publicar um post é equivalente a fazer um commit — com histórico, revisão e atomicidade. Build-time rendering garante performance máxima sem requisições em runtime.

**Alternativas consideradas:** Contentlayer, Sanity, Notion API.

**Tradeoffs:**

- Sem interface visual de edição — adequado para um portfólio técnico onde o autor é o único editor
- Escalabilidade limitada para volumes muito grandes de conteúdo

---

### mise

**Motivo:** Gerenciador de versões universal escrito em Rust. Substitui o asdf com vantagens concretas: instalação via APT (atualizações automáticas com `apt upgrade`), sem shims — modifica o PATH diretamente, eliminando overhead de ~120ms por invocação. Um único arquivo `mise.toml` por projeto define versões de Node.js e Python — qualquer colaborador que clonar o repositório e rodar `mise install` tem o ambiente idêntico automaticamente.

**Por que não asdf:** asdf usa shims que interceptam cada chamada de binário, adicionando latência perceptível. O plugin `asdf` do oh-my-zsh não foi atualizado para a API de completions do v0.16+, causando comportamento inesperado. mise resolve ambos os problemas nativamente.

**Alternativas consideradas:** asdf, nvm + pyenv, Volta.

---

### pnpm

**Motivo:** Instalação mais rápida e eficiente que npm, com workspaces nativos para o caso de o projeto evoluir para monorepo.

**Alternativas consideradas:** npm, yarn, bun.

---

### Vercel

**Motivo:** Integração nativa com Next.js App Router, deploy automático por push, CDN global, Image Optimization e preview deployments por PR — sem configuração adicional.

**Alternativas consideradas:** Netlify, Cloudflare Pages, Railway.

**Tradeoffs:**

- Dependência do ecossistema Next.js/Vercel — migração futura exigiria adaptações de infra

---

### Node.js 24 LTS

**Motivo:** Versão LTS ativa em 2026 (codename: Krypton). Suportada pelo ecossistema Next.js com suporte garantido até abril de 2028. Versão fixada explicitamente no `mise.toml` — determinístico, sem depender de aliases dinâmicos como `lts`.

---

## Consequências

### Benefícios

- stack moderna e bem documentada
- experiência de desenvolvimento produtiva
- deploy simples, automático e com preview por PR
- conteúdo versionado no Git com build-time rendering

### Tradeoffs

- MDX limita edição a quem tem acesso ao repositório
- Dependência concentrada no ecossistema Next.js/Vercel

---

## Impacto na Arquitetura

- **Zod** influencia diretamente a modelagem da camada `domain` — schemas são a fonte da verdade
- **MDX** define a necessidade de um `loader` server-side dedicado em `server/content/`
- **Next.js App Router** influencia a estrutura da camada `app/` — layouts, loading states e Server Components são nativos
- **Vercel** define o ambiente de produção e justifica o uso de variáveis de ambiente validadas em `lib/env.ts`
- **mise** define o arquivo `mise.toml` na raiz do projeto — versões de runtime versionadas junto ao código

---

_Este ADR registra oficialmente as decisões de tecnologia do projeto mks.dev._
