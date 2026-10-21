// Packs the library, installs the tarball into a throwaway project and exercises it the way a consumer would:
// import() (ESM), require() (CJS), and both copies loaded together (the dual package hazard).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const root = resolve('.');
const work = mkdtempSync(join(tmpdir(), 'needle-package-'));
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

try {
    run(npm, ['pack', '--pack-destination', work], root);
    const tarball = readdirSync(work).find((f) => f.endsWith('.tgz'));
    writeFileSync(join(work, 'package.json'), JSON.stringify({ name: 'needle-package-test', private: true }));
    run(npm, ['install', '--no-audit', '--no-fund', '--no-package-lock', join(work, tarball), 'reflect-metadata@^0.2.2'], work);

    const common = `
require('reflect-metadata');
const assert = require('node:assert');
function check(lib, label) {
    const { Injectable, Inject, get, getRootInjector, Injector, createToken } = lib;
    assert.ok(typeof get === 'function', label + ': get exported');
    class Dep {}
    class Svc { constructor(dep) { this.dep = dep; } }
    Reflect.defineMetadata('design:paramtypes', [Dep], Svc); // what tsc emits with emitDecoratorMetadata
    Injectable()(Svc);
    Injectable()(Dep);
    assert.ok(get(Svc).dep instanceof Dep, label + ': resolves constructor dependencies');
    return lib;
}
module.exports = { check };
`;
    writeFileSync(join(work, 'check.cjs'), common);

    // 1. CommonJS consumer
    writeFileSync(join(work, 'cjs.cjs'), `
const { check } = require('./check.cjs');
const lib = check(require('@morgan-stanley/needle'), 'cjs');
console.log('cjs ok', typeof lib.getRootInjector());
`);
    // 2. ESM consumer
    writeFileSync(join(work, 'esm.mjs'), `
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { check } = require('./check.cjs');
import * as lib from '@morgan-stanley/needle';
check(lib, 'esm');
console.log('esm ok');
`);
    // 3. Both copies in one process: they must share ONE root injector and recognise each other's Injector.
    writeFileSync(join(work, 'dual.mjs'), `
import assert from 'node:assert';
import { createRequire } from 'node:module';
const warnings = [];
const origWarn = console.warn;
console.warn = (msg, ...rest) => { warnings.push(String(msg)); };
const esm = await import('@morgan-stanley/needle');
assert.strictEqual(warnings.length, 0, 'no dual-format warning for a single copy');
const require = createRequire(import.meta.url);
const cjs = require('@morgan-stanley/needle');
require('@morgan-stanley/needle');
await import('@morgan-stanley/needle');
console.warn = origWarn;
const dual = warnings.filter((w) => w.includes('loaded as both ESM and CommonJS'));
assert.strictEqual(dual.length, 1, 'dual-format warning is logged exactly once');
assert.notStrictEqual(esm.Injector, cjs.Injector, 'two distinct copies are loaded');
assert.strictEqual(esm.getRootInjector(), cjs.getRootInjector(), 'copies share one root injector');

class Shared { }
esm.Injectable()(Shared);
assert.strictEqual(esm.get(Shared), cjs.get(Shared), 'registrations and singletons are shared across copies');

// the injector can be resolved from either copy without 'Cannot resolve Injector' errors
assert.ok(esm.get(esm.Injector));
assert.ok(cjs.get(cjs.Injector));
assert.ok(esm.get(cjs.Injector));

// setLogger in one copy is seen by the other (the logger lives on globalThis)
const logger = { warn() {}, log() {} };
esm.setLogger(logger);
assert.strictEqual(cjs.getLogger(), logger, 'cjs copy sees logger set via esm copy');
cjs.resetLogger();
assert.strictEqual(esm.getLogger(), esm.consoleLogger, 'esm copy sees reset via cjs copy');
console.log('dual ok');
`);
    for (const f of ['cjs.cjs', 'esm.mjs', 'dual.mjs']) {
        run(process.execPath, [f], work);
    }
    console.log('package consumer tests passed');
} finally {
    rmSync(work, { recursive: true, force: true });
}
