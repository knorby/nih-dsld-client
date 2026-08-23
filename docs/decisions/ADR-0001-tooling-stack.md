# ADR-0001: Tooling Stack

- **Status:** Accepted
- **Date:** 2026-08-15

## Context

`@knorby/nih-dsld-client` is a zero-dependency TypeScript package targeting
Node, React Native, browsers, Bun, and Deno ("universal" packages). The repo
began from a universal-package template; we need a build tool, linter,
formatter, test runner, versioning tool, and commit convention that are
modern, fast, and well-maintained as of 2026.

## Decision

| Concern | Tool | Rationale |
| --- | --- | --- |
| Build (dual ESM/CJS) | **tsup** + **tsc** | tsup (wrapping esbuild) produces `.js` (ESM) + `.cjs` (CJS) bundles; `tsc --emitDeclarationOnly` produces `.d.ts` declarations. tsup's built-in `dts: true` uses `rollup-plugin-dts` which bundles v6.1.1 internally and is incompatible with TypeScript 7.x; using tsc directly for declarations is more reliable. Because tsc emits extensionless relative specifiers (rejected by `moduleResolution: node16`/`nodenext`), `scripts/fix-declaration-imports.mjs` rewrites them to explicit `.js` paths as a build post-step; `index.d.ts` is copied to `index.d.cts` for the CJS entry. Verified with `publint` + `arethetypeswrong`. |
| Lint + Format | **Biome** | Single Rust binary replacing ESLint + Prettier. 10-100x faster (0.8s vs 45s on 10K files). Smaller rule ecosystem but growing fast; sufficient for template defaults. |
| Testing | **Vitest** | Native ESM + TS support, 5-28x faster than Jest, Jest-compatible API. The 2026 default for new TS projects. |
| Versioning / Release | **Changesets** | Decouples versioning from merges; generates changelogs; integrates with GitHub Actions. Dominant standard for npm packages. |
| Commit convention | **commitlint** (conventional commits) | Enforces structured commit messages. Complements changesets and provides standardized history. |
| Git hooks | **Husky** + **pre-commit** | Husky handles TypeScript checks (lint-staged + commitlint); pre-commit handles file hygiene + secret scanning (gitleaks, TruffleHog). Two managers, non-overlapping responsibilities. |

## Alternatives considered

- **ESLint + Prettier** — largest rule ecosystem but slower; more config
  surface. Chosen alternative: Biome (speed + simplicity for a template).
- **Jest** — stable legacy default but poor ESM support and slower. Chosen
  alternative: Vitest (speed + native ESM/TS).
- **semantic-release** — fully automated but tightly couples versioning to
  merges. Chosen alternative: Changesets (explicit, decoupled, more
  control).
- **tsdx** — all-in-one but largely unmaintained. Chosen alternative: tsup
  (actively maintained, more flexible).

## Consequences

- Biome's smaller rule set means some advanced ESLint rules aren't available;
  teams needing specific rules can swap to ESLint + Prettier.
- Two git hook managers (pre-commit + Husky) require both to be installed for
  full coverage, but their responsibilities are non-overlapping.
- Changesets requires authors to manually create `.changeset` files; the
  `commit-msg` hook + conventional commits provide complementary structure.
