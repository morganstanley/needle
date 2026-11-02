// Packs the library, installs the tarball into a throwaway project and exercises it the way a consumer would:
// import() (ESM), require() (CJS), both copies loaded together (the dual package hazard), and standard (TC39)
// decorators compiled by tsc against each build.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import ts from 'typescript';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const root = resolve('.');
const work = mkdtempSync(join(tmpdir(), 'needle-package-'));
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

try {
    run(npm, ['pack', '--pack-destination', work], root);
    const tarball = readdirSync(work).find((f) => f.endsWith('.tgz'));
    writeFileSync(join(work, 'package.json'), JSON.stringify({ name: 'needle-package-test', private: true }));
    run(
        npm,
        ['install', '--no-audit', '--no-fund', '--no-package-lock', join(work, tarball), 'reflect-metadata@^0.2.2'],
        work,
    );

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
    writeFileSync(
        join(work, 'cjs.cjs'),
        `
const { check } = require('./check.cjs');
const lib = check(require('@morgan-stanley/needle'), 'cjs');
console.log('cjs ok', typeof lib.getRootInjector());
`,
    );
    // 2. ESM consumer
    writeFileSync(
        join(work, 'esm.mjs'),
        `
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { check } = require('./check.cjs');
import * as lib from '@morgan-stanley/needle';
check(lib, 'esm');
console.log('esm ok');
`,
    );
    // 3. Both copies in one process: they must share ONE root injector and recognise each other's Injector.
    writeFileSync(
        join(work, 'dual.mjs'),
        `
import * as assert from 'node:assert';
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
`,
    );

    // 4. Standard (TC39) decorators against the built package, from both the ESM and the CJS build.
    //    Compiled with tsc's native decorator emit (no experimentalDecorators, no reflect-metadata).
    const standardSource = (importLine) => `
${importLine}
import * as assert from 'node:assert';
const Config = createToken<{ url: string }>('pkg-config');
getRootInjector().registerValue({ tokens: [Config], value: { url: '/api' } });
@Injectable()
class Engine {}
class Logger {}
@Injectable({ deps: [Engine, Config, dep.optional(Logger)] })
class Car {
    constructor(readonly engine: Engine, readonly config: { url: string }, readonly logger: Logger | undefined) {}
}
@Injectable()
class Boat {
    @Inject(Engine) accessor engine!: Engine;
    @Inject(Config) accessor config!: { url: string };
}
class Plane {
    constructor(readonly engine: Engine) {}
}
injectable(Plane, [Engine]);
const car = get(Car);
assert.ok(car.engine instanceof Engine, 'deps: type');
assert.strictEqual(car.config.url, '/api', 'deps: typed token');
assert.strictEqual(car.logger, undefined, 'deps: optional');
const boat = get(Boat);
assert.ok(boat.engine instanceof Engine, 'accessor: type');
assert.strictEqual(boat.config.url, '/api', 'accessor: token');
assert.ok(get(Plane).engine instanceof Engine, 'injectable()');
console.log('standard decorators ok (' + FORMAT + ')');
`;
    const names = 'Injectable, Inject, dep, createToken, injectable, get, getRootInjector';
    const emit = (source, module) =>
        ts.transpileModule(source, {
            compilerOptions: {
                target: ts.ScriptTarget.ES2022,
                module,
                experimentalDecorators: false,
                emitDecoratorMetadata: false,
            },
        }).outputText;
    writeFileSync(
        join(work, 'standard-esm.mjs'),
        emit(
            `const FORMAT = 'esm';` + standardSource(`import { ${names} } from '@morgan-stanley/needle';`),
            ts.ModuleKind.ESNext,
        ),
    );
    writeFileSync(
        join(work, 'standard-cjs.cjs'),
        emit(
            `const FORMAT = 'cjs';` + standardSource(`import { ${names} } from '@morgan-stanley/needle';`),
            ts.ModuleKind.CommonJS,
        ),
    );
    for (const f of ['cjs.cjs', 'esm.mjs', 'dual.mjs', 'standard-esm.mjs', 'standard-cjs.cjs']) {
        run(process.execPath, [f], work);
    }
    console.log('package consumer tests passed');
} finally {
    rmSync(work, { recursive: true, force: true });
}
