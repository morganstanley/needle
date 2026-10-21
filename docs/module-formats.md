# Module formats (ESM and CommonJS)

Needle ships both an ES module build and a CommonJS build, so it works with `import`, `require()` and bundlers.

| Consumer | Resolves to |
| --- | --- |
| `import … from '@morgan-stanley/needle'` | `dist/main/index.js` (ESM) + `dist/main/index.d.ts` |
| `require('@morgan-stanley/needle')` | `dist/cjs/main/index.js` (CJS) + `dist/cjs/main/index.d.ts` |

The `exports` map has `import` and `require` conditions, each with its own nested `types` condition, so TypeScript under `node16`/`nodenext` picks the right declarations for each format. `main`/`module`/`types` are kept for older tools.

## How it is built

- `npm run build:esm` compiles with `main/tsconfig.json` into `dist/main`.
- `npm run build:cjs` compiles with `main/tsconfig.cjs.json` (`module: commonjs`) into `dist/cjs/main`, then `scripts/write-cjs-package.mjs` writes `dist/cjs/package.json` containing `{ "type": "commonjs" }`. The package is `"type": "module"`, so that marker is what makes Node treat the `.js` files under `dist/cjs` as CommonJS. The CJS declarations live next to the CJS code for the same reason.

## The dual package hazard

If an application loads both copies (for example an ESM app that depends on a library that `require()`s Needle) the module-level state exists twice. Needle is designed for this: the root injector is stored on `globalThis` under a well-known key (`needle.morganstanley.com.root.injector`), and both copies create it only if it does not exist yet. That means:

- both copies share one root injector, one registry and one set of singletons;
- `get(Injector)` resolves from either copy, because injectors are recognised by a type id rather than by class identity;
- the logger is stored on `globalThis` under `Symbol.for('needle.morganstanley.com.logger')`, so `setLogger` in one copy applies to both.

What is **not** shared is class identity: `esmCopy.Injector !== cjsCopy.Injector`, so `instanceof` checks across copies are false. Compare with the exported helpers rather than `instanceof` if you can end up with both. Module-level statics such as `Injector.verify` are also per copy.

## How it is tested

- `npm run test:package` packs the library, installs the tarball into a throwaway project, then runs a CJS consumer, an ESM consumer, and a script that loads both copies in one process and asserts they share the root injector, singletons and logger.
- `npm run lint:package` runs [publint](https://publint.dev).
- `npm run lint:types` runs [`@arethetypeswrong/cli`](https://github.com/arethetypeswrong/arethetypeswrong.github.io) against the packed tarball (node16 CJS and ESM, and bundler resolution). The `node10` resolution is ignored, as it cannot read `exports`.

All three run in the `package` CI job.
