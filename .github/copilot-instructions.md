# Copilot Instructions for Needle Contributors

## Scope
- This file guides AI assistants for changes inside this repository.
- For downstream app guidance, use `ai/needle.instructions.md`.

## Guardrails
- Keep the public API stable unless the task explicitly requires API changes.
- Do not add or rely on imports from internals in user-facing examples.
- Prefer imports from `@morgan-stanley/needle` for usage snippets.
- Keep local TypeScript imports aligned with current repo style (including `.js` specifiers where present).

## Required Validation
- Run `npm run lint`.
- Run `npm run test:ci` for PR/CI equivalence.
- Run `npm run build`.
- If runtime behavior changes, update or add tests under `spec/`.

## Release/Quality Notes
- `npm run verify:fast` runs lint + tests + build.
- `npm run verify:full` runs release-grade checks including bench and Typedoc.
- Avoid committing generated build artifacts unless explicitly requested.

## Documentation Expectations
- Update `README.md` for user-visible behavior or support window changes.
- Keep docs generation workflows intact; do not hand-edit generated files under `docs/`.
