# Changelog

All notable changes to this project are documented in this file.

## Unreleased

### Added
- Added a CommonJS build alongside ESM, with an `exports` map (`import`/`require`, each with its own types) - see `docs/module-formats.md`.
- Needle logs a one-time warning when both its ESM and CommonJS copies are loaded in the same process.
- Support for standard (TC39) decorators, without `experimentalDecorators`, `emitDecoratorMetadata` or `reflect-metadata` - see `docs/standard-decorators.md`:
  - `deps` option on `@Injectable` and the `dep.token/optional/lazy/factory/strategy` helpers to describe constructor parameters.
  - Field and `accessor` injection with `@Inject`, `@Optional`, `@Lazy`, `@Factory` and `@Strategy`.
  - `createToken<T>()` typed tokens, with typed `get`/`getOptional`/`getLazy` overloads.
  - `injectable(Type, deps, config?)` to register a class with `deps` checked against its constructor at compile time.
  - A development-mode warning when a standard-decorated class's `deps` do not match its constructor.
- `deps` also works with legacy decorators, for incremental migration.

### Changed
- Decorator factories now return `IInjectionDecorator` (callable as both legacy and standard decorators) and `@Inject` also accepts a class. Existing call sites are source-compatible.

## 1.0.0

### Added
- Added AI guidance files for agents and downstream instructions:
  - `AGENTS.md`
  - `ai/needle.instructions.md`
- Added support to avoid Angular Zone digest cycles during housekeeping scheduling.

### Changed
- Migrated project tooling and runtime posture:
  - Moved to ESM.
  - Moved to Vite.
  - Added benchmark tests and performance-related improvements.
- Moved to latest TypeScript and Node.js versions.
- Removed older TypeScript version support.
- Imported JavaScript extension types.