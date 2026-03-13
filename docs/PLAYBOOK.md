# PLAYBOOK.md — mks.dev

Guia definitivo. Do zero ao projeto rodando.

---

## Passo 0 — Pasta de trabalho

```bash
mkdir ~/mks-setup && cd ~/mks-setup
# coloque todos os arquivos baixados aqui
```

---

## Passo 1 — Configurar o Ubuntu (uma única vez)

```bash
chmod +x setup-dev.sh && ./setup-dev.sh
```

Instala: Zsh, mise, Node.js 24 LTS, pnpm, Python, Docker, Git, GitHub CLI, VS Code.

```bash
# Após terminar — feche e reabra o terminal, depois:
gh auth login
```

---

## Passo 2 — Criar o projeto

```bash
chmod +x bootstrap.sh && ./bootstrap.sh
```

Cria `~/mks-setup/mks.dev/` completo e validado.

---

## Passo 3 — Subir para o GitHub

```bash
cd ~/mks-setup/mks.dev
git init && git add .
git commit -m "chore(config): scaffold project with architecture foundation"
git remote add origin git@github.com:kaiokampos/mks.dev.git
git branch -M main && git push -u origin main
```

Aguarde o CI ficar verde antes de avançar.

---

## Mapa de arquivos

| Arquivo                   | Destino                                   |
| ------------------------- | ----------------------------------------- |
| `setup-dev.sh`            | Roda na pasta de trabalho                 |
| `bootstrap.sh`            | Roda na pasta de trabalho                 |
| `tsconfig.json`           | `mks.dev/`                                |
| `eslint.config.mjs`       | `mks.dev/`                                |
| `.prettierrc`             | `mks.dev/`                                |
| `.prettierignore`         | `mks.dev/`                                |
| `.editorconfig`           | `mks.dev/`                                |
| `.env.example`            | `mks.dev/`                                |
| `commitlint.config.mjs`   | `mks.dev/`                                |
| `lint-staged.config.mjs`  | `mks.dev/`                                |
| `vitest.config.ts`        | `mks.dev/`                                |
| `README.md`               | `mks.dev/`                                |
| `LICENSE`                 | `mks.dev/`                                |
| `CONTRIBUTING.md`         | `mks.dev/`                                |
| `env.ts`                  | `mks.dev/lib/env.ts`                      |
| `post.schema.ts`          | `mks.dev/domain/blog/post.schema.ts`      |
| `post.schema.test.ts`     | `mks.dev/domain/blog/post.schema.test.ts` |
| `ci.yml`                  | `mks.dev/.github/workflows/ci.yml`        |
| `CONVENTIONS.md`          | `mks.dev/docs/`                           |
| `ARCHITECTURE.md`         | `mks.dev/docs/`                           |
| `PROJECT_STRUCTURE.md`    | `mks.dev/docs/`                           |
| `SETUP_GUIDE.md`          | `mks.dev/docs/`                           |
| `CONFIG_FILES.md`         | `mks.dev/docs/`                           |
| `PLAYBOOK.md`             | `mks.dev/docs/`                           |
| `ADR-001-architecture.md` | `mks.dev/docs/adr/`                       |
| `ADR-002-tech-stack.md`   | `mks.dev/docs/adr/`                       |

---

## Próxima sessão (após CI verde)

```
1. domain/projects/project.schema.ts
2. domain/lab/experiment.schema.ts
3. server/content/loader.ts + registry.ts
4. Vertical slice: blog end-to-end
5. Hero section
```
