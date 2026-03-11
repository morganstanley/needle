# AGENTS.md

Guidance for developers and coding agents working in this repository.

## Purpose

- Maintain and evolve the Needle library (`@morgan-stanley/needle`).
- Keep public API stability and documentation quality high.
- Ensure all changes are validated by lint, type checks, and tests.

## Repository Map

- `main/`: library source code.
- `main/index.ts`: public export surface for the package.
- `spec/`: unit and integration tests (`*.spec.ts`).
- `bench/`: benchmark runners and report generation.
- `docs/`: generated documentation output.
- `ai/needle.instructions.md`: guidance for agents helping downstream consumers (app teams).

## Setup

1. Use Node.js and npm.
2. Install dependencies:

```bash
npm install
```

## Build, Test, Lint

Use these commands from repo root:

- `npm run build`: compile TypeScript (`main/tsconfig.json`) to `dist/`.
- `npm run test`: type-check test code then run Vitest.
- `npm run lint`: run ESLint over `.ts` and `.js`.
- `npm run build:verify`: run lint + test + build concurrently.
- `npm run bench`: run benchmarks and write JSON report.
- `npm run bench:report`: run benchmarks and generate HTML benchmark report.

If your change affects runtime behavior, run at least `npm run test` and `npm run lint` before opening a PR.

## Coding Conventions

- Language: TypeScript with strict compiler settings.
- Module system: ESM.
- In TypeScript source, local imports typically use `.js` extension in specifiers (keep existing style).
- Prefer small, focused changes over broad refactors.
- Do not change public exports in `main/index.ts` unless the task requires API changes.
- Do not commit build artifacts (`dist/`, generated reports, generated docs) unless explicitly requested.

## Tests

- Add or update tests under `spec/` for behavioral changes.
- Keep tests deterministic and aligned with existing Vitest patterns.
- `spec/setup.ts` imports `reflect-metadata`; avoid duplicate setup inside individual tests unless required.

## Documentation Expectations

- Update `README.md` for user-visible API or behavior changes.
- Keep generated docs workflows intact; do not hand-edit generated files under `docs/`.

## Pull Request Expectations

- Follow `CONTRIBUTING.md` requirements (DCO, NOTICE updates, and PR process).
- Include a clear summary of behavior changes and testing performed.
- Prefer minimal, reviewable commits and avoid unrelated edits.

## Agent-Specific Guardrails

- Prioritize safe, non-breaking fixes.
- Preserve existing code style and file organization.
- When modifying internals, verify external behavior through tests in `spec/`.
- For consumer-app examples or guidance, prefer public package imports from `@morgan-stanley/needle` and refer to `ai/needle.instructions.md`.
