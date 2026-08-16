# AGENTS.md

Instructions and steering for AI coding agents working in this repository.

This is a TypeScript starter template for universal npm packages (Node, React
Native, and more). Customize per project and keep this file updated as
conventions evolve.

---

## Setup

### System requirements

Before installing git hooks, ensure the following are available on the
system:

1. **Node.js 22+** — use [nvm](https://github.com/nvm-sh/nvm) or
   [fnm](https://github.com/Schniz/fnm); this repo includes an `.nvmrc`.
2. **npm** — bundled with Node.
3. **pre-commit** — install via `pipx install pre-commit` or
   `brew install pre-commit`. Handles file hygiene + secret scanning.
4. **gitleaks** — install via `brew install gitleaks` or see
   <https://github.com/gitleaks/gitleaks>. The hook uses the
   system-installed binary (`gitleaks-system` hook ID) for lightweight
   regex-based secret scanning.
5. **Go toolchain** — required for the TruffleHog hook, which pre-commit
   builds from source in an isolated GOPATH on first run (slow; cached
   afterward). Install via `brew install go` or see <https://go.dev/dl/>.
6. **shellcheck** is **not** a system dependency — `shellcheck-py` ships its
   own bundled binary.

### Install dependencies and hooks

```bash
nvm use                  # or: fnm use
npm install              # installs deps (does NOT run prepare — see .npmrc)
npx husky                # set up Husky hooks (blocked by ignore-scripts)
pre-commit install       # wire pre-commit hooks into .git/hooks/
pre-commit run --all-files  # validate against the entire repo
```

`npm install` does **not** run the `prepare` script because `.npmrc` sets
`ignore-scripts=true` (supply-chain security — blocks dependency postinstall
scripts). Run `npx husky` separately to set up the Husky-managed hooks
(pre-commit → lint-staged, commit-msg → commitlint). `pre-commit install`
separately sets up the pre-commit-managed hooks (file hygiene + secret
scanning). Both are needed for full coverage.

### Adding and removing hooks

- **Prefer existing hooks.** Always check the pre-commit hooks index
  (<https://pre-commit.com/hooks.html>) and the featured repositories
  (<https://pre-commit.com/hooks.html#featured-hooks>) before writing a custom
  hook. Existing, maintained hooks are preferred over custom ones.
- **If no existing hook can satisfy a requirement**, flag this in your output
  and request input before adding a custom hook.
- **TypeScript linting/formatting** is handled by **Biome** via Husky +
  lint-staged (see `.husky/pre-commit`). Do not add a TS linter to
  `.pre-commit-config.yaml`; use Husky/lint-staged for that.
- **TruffleHog**: replaceable with another secret scanner if preferred. Both
  gitleaks and TruffleHog run in pre-commit. If CI-based secret scanning is
  also desired (e.g. to catch secrets when hooks are skipped), add a workflow
  in `.github/workflows/` and document it here.
- **Hook revisions** are pinned. Bump deliberately and review changelogs.
- Reference: <https://pre-commit.com/hooks.html>

---

## Development commands

| Command | What it does |
| --- | --- |
| `npm run build` | Build the package (tsup + tsc — dual ESM/CJS output with `.d.ts`/`.d.cts` declarations) |
| `npm run dev` | Build in watch mode |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome (writes changes) |
| `npm run check` | Lint + format in one pass (writes changes) |
| `npm run typecheck` | Type-check `src/` + `tests/` with `tsc` (uses `tsconfig.test.json`, no emit) |
| `npm test` | Run tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage reporting |
| `npx changeset` | Create a changeset (required for any change that affects published output) |

---

## Testing and CI

- Tests live in `tests/` and use **Vitest**. Add test files as
  `*.test.ts` alongside or under `tests/`.
- **GitHub Actions** runs the full check suite on every push to `main` and on
  PRs against `main` (see `.github/workflows/tests.yml`):
  - `npm run lint` (Biome)
  - `npm run typecheck` (tsc, src + tests)
  - `npm run build` (tsup)
  - `npm test` (Vitest)
  - `npm audit --audit-level=moderate` (vulnerability scan)
- pre-commit hooks (file hygiene + secret scanning) and Husky hooks (Biome +
  commitlint) run locally only. They are **not** run in GitHub Actions in this
  template. If CI enforcement is desired, add a workflow that runs
  `pre-commit run --all-files` and document it here.
- Optional security scanning additions (free for public repos): CodeQL
  (<https://github.com/github/codeql-action>), gitleaks-action
  (<https://github.com/gitleaks/gitleaks-action>), Semgrep
  (<https://github.com/returntocorp/semgrep-action>). Add workflows in
  `.github/workflows/` if desired and document them here.

---

## Versioning and publishing

This repo uses [Changesets](https://github.com/changesets/changesets) for
versioning. Versioning is **decoupled from merges** — you can merge multiple
PRs and release them all at once.

- **Before a PR that changes published output**: run `npx changeset`, select
  bump type (patch/minor/major), write a summary. Commit the generated
  `.changeset/*.md` file alongside the code change.
- **To release**: `npx changeset version` (bumps `package.json` +
  `CHANGELOG.md`), then `npm run release` (builds + publishes).
- **GitHub Actions release** (`.github/workflows/release.yml`): disabled by
  default (`workflow_dispatch` only). To enable automated releases, change the
  trigger to `push: branches: [main]`. The changesets action opens a "Version
  Packages" PR; merging it publishes to npm + creates a GitHub Release.
- **Always verify before publishing**: `npm run build && npm pack --dry-run`
  to confirm only `dist/` + docs are included.

### Publishing security

- **2FA** — enable on npm account: `npm profile enable-2fa auth-and-writes`.
  Do not publish without 2FA.
- **Granular tokens** — use npm Granular Access Tokens (scoped to the
  package, publish-only, time-limited). Classic tokens were revoked in
  December 2025.
- **Provenance** — `publishConfig.provenance: true` in `package.json` enables
  npm provenance attestation (cryptographic link to commit + workflow).
- **Scoped names** — use `@yourscope/package` names to prevent dependency
  confusion attacks.
- **No secrets in published files** — the `files` field in `package.json`
  whitelists only `dist`, `README.md`, and `CHANGELOG.md`. Never add `src/`,
  `.env`, `tsconfig.json`, or other config to the `files` list.
- **`.npmrc`** — `ignore-scripts=true` blocks dependency `postinstall`
  scripts by default (supply-chain security). This also blocks this repo's
  own `prepare` script, so `npm install` will not auto-set-up Husky hooks —
  run `npx husky` after `npm install`, or use
  `npm install --ignore-scripts=false` to allow the prepare script.

---

## Guardrails and steering rules

These rules are mandatory. Follow them strictly.

### Git operations

- Do **not** perform git write operations — `commit`, `push`, `amend`, `tag`,
  create PRs — unless explicitly asked by the user.

### File removal

- `rm` is intentionally blocked in this environment. Do **not** attempt to
  bypass this restriction (no `find -delete`, `python -c "os.remove(...)"`,
  shell tricks, or alternative deletion methods).
- Use `git rm` for tracked files that need removal.
- If untracked files need removal, or if your action is required to remove
  something, **stop** and flag what needs to be removed and why in your output.

### Licensing

- Do **not** add a `LICENSE` file, license headers, or any licensing
  declarations without explicit user instruction.
- This applies broadly: build configs, package manifests (e.g. `license`
  fields in `package.json`, `pyproject.toml`, etc.), boilerplate, comments,
  and anywhere else a license might appear. Committing an unintentional
  license is not acceptable. If a license field is required by a tool's
  schema, leave it blank or omit it and flag it in your output for the user
  to decide.

### Documentation

- Keep `AGENTS.md` and `README.md` up to date as part of any change that
  affects setup, conventions, or project structure.
- Use the `docs/` directory for higher-level design notes, architecture, and
  decision records (ADRs). See `docs/README.md` for the ADR template.
- Treat `docs/` as living documentation. Create an ADR in `docs/decisions/`
  for significant design decisions.

### Before declaring done

- Run all quality gates:
  ```bash
  npm run lint && npm run typecheck && npm test && npm run build
  ```
- Verify that `npm pack --dry-run` includes only `dist/`, `README.md`, and
  `CHANGELOG.md` (no source, config, or secret files).
- Verify that `AGENTS.md` and `README.md` still reflect the current state of
  the repository.
