# Multiple instances of Needle

If Needle throws `Multiple copies of @morgan-stanley/needle have been loaded in the same application. This is not supported.`, this page explains why and how to fix it.

## What happened

Two separately installed or bundled copies of Needle are running in the same JavaScript realm (for example a nested `node_modules/@morgan-stanley/needle` with a different version, or Needle bundled into two bundles). This is detected even when both copies are the same version. Each copy has its own decorators, metadata and `Injector` class but they share one root injector, so DI can silently break. Needle throws when the second copy loads.

## How to fix it (dedupe)

Make sure only one copy exists:

- `npm ls @morgan-stanley/needle` to find the copies, then `npm dedupe`.
- Pin a single version with `overrides` (npm), `resolutions` (yarn) or `pnpm.overrides` (pnpm).
- In micro-frontends / module federation, share Needle as a singleton or mark it external so it is bundled once.

Loading the ESM and CommonJS builds of the *same* install is not a duplicate; it only logs the [dual-load warning](module-formats.md#dual-load-warning).

## Overriding the error

To opt out (unsupported, at your own risk) and get a warning instead, either set the flag before any copy of Needle is imported:

```ts
(globalThis as any)[Symbol.for('needle.morganstanley.com.allow-multiple-instances')] = true;
```

or set `getRootInjector().configuration.allowMultipleInstances = true` before the second copy loads (see [configuration](configuration.md#allow-multiple-instances)).

