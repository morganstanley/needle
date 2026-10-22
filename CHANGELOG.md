# Changelog

All notable changes to this project are documented in this file.

## Unreleased

### Added
- Added a CommonJS build alongside ESM, with an `exports` map (`import`/`require`, each with its own types) - see `docs/module-formats.md`.
- Needle logs a one-time warning when both its ESM and CommonJS copies are loaded in the same process.

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