# Contributing

Thanks for contributing! This guide covers getting set up, the development
workflow, and how to publish releases.

## Prerequisites

- **Node.js 22+** (use [nvm](https://github.com/nvm-sh/nvm) or
  [fnm](https://github.com/Schniz/fnm); this repo includes an `.nvmrc`)
- **npm** (bundled with Node)
- **pre-commit** — `pipx install pre-commit` or `brew install pre-commit`
- **gitleaks** — `brew install gitleaks` (secret scanner for pre-commit)
- **Go toolchain** — `brew install go` (required once for the TruffleHog hook
  build)

## Getting started

```bash
git clone <repo-url>
cd <repo-name>
nvm use              # or: fnm use
npm install          # installs deps (prepare blocked by .npmrc ignore-scripts)
npx husky            # sets up Husky hooks (run after npm install)
pre-commit install   # sets up pre-commit hooks for file hygiene + secrets
```

## Development commands

| Command | What it does |
| --- | --- |
| `npm run build` | Build the package (tsup + tsc — dual ESM/CJS output with `.d.ts`/`.d.cts` declarations) |
| `npm run dev` | Build in watch mode |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome (writes changes) |
| `npm run check` | Lint + format in one pass (writes changes) |
| `npm run typecheck` | Type-check `src/` + `tests/` with `tsc` (no emit) |
| `npm test` | Run tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage reporting |

## Git hooks

This repo uses **two** git hook managers that complement each other:

1. **pre-commit** — file hygiene (whitespace, EOL, YAML/JSON validation),
   secret scanning (gitleaks + TruffleHog), and shellcheck. Enforces
   `no-commit-to-branch` to protect `main`/`master`.

2. **Husky** — TypeScript-specific checks on staged files:
   - `pre-commit`: runs `lint-staged` (Biome format + lint on staged files
     only)
   - `commit-msg`: runs `commitlint` to enforce
     [conventional commits](https://www.conventionalcommits.org/)

You need both for full coverage:
```bash
pre-commit install
npx husky   # prepare script is blocked by .npmrc ignore-scripts=true
```

## Commit messages

This repo enforces [conventional commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`,
`perf`, `ci`.

Examples:
```
feat(auth): add token refresh logic
fix: handle null response from API
docs: update README with publish instructions
```

## Versioning and releases

This repo uses [Changesets](https://github.com/changesets/changesets) for
versioning. Versioning is **decoupled from merges** — you can merge multiple
PRs and release them all at once.

### Adding a changeset

Every PR that changes published output should include a changeset:

```bash
npx changeset
```

Select the bump type (patch/minor/major) and write a short summary. A new
`.md` file appears in `.changeset/` — commit it alongside your code.

### Releasing

**Manual release:**
```bash
npx changeset version    # bumps package.json + generates CHANGELOG.md
npm run release          # builds + publishes to npm
git add . && git commit -m "chore: release" && git push
```

**Automated release (GitHub Actions):**
Enable the `release.yml` workflow (change the trigger from `workflow_dispatch`
to `push: branches: [main]`). The changesets action will open a "Version
Packages" PR; merging it publishes to npm and creates a GitHub Release.

### Before publishing, always verify

```bash
npm run build
npm pack --dry-run    # verify only dist/ + docs are included
```

## Publishing security

- **2FA** — enable on your npm account: `npm profile enable-2fa auth-and-writes`
- **Granular tokens** — use npm Granular Access Tokens (scoped to the package,
  publish-only, time-limited). Classic tokens were revoked in December 2025.
- **Provenance** — this repo publishes with `--provenance` (cryptographic
  attestation linking the published package to the commit + workflow).
- **Scoped names** — use `@yourscope/package` names to prevent dependency
  confusion attacks.
- **No secrets in the package** — the `files` field in `package.json`
  whitelists only `dist`, `README.md`, and `CHANGELOG.md`.

## Pull request process

1. Create a branch from `main`.
2. Make your changes + add a changeset (`npx changeset`).
3. Ensure all checks pass: `npm run lint && npm run typecheck && npm test &&
   npm run build`.
4. Open a PR against `main`. The CI workflow runs lint, typecheck, build,
   test, and `npm audit`.
5. After review, merge. Release separately via changesets.
