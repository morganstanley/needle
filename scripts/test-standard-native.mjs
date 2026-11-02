// Runs the standard-decorator test project against a toolchain's *native* decorator emit.
//   node scripts/test-standard-native.mjs tsc      -> compile with `tsc` (whatever TypeScript is installed), then run vitest on the output
//   node scripts/test-standard-native.mjs esbuild  -> transform with esbuild, then run vitest on the output
//                                                     (esbuild is not a dependency: `npm install --no-save esbuild@^0.27` first)
// (The SWC emit is covered by `npm run test:standard`.)
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
const out = join(root, '.standard-out', mode);
const run = (cmd, args) =>
    execFileSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });

function tsFiles(dir) {
    return readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) return tsFiles(full);
        return full.endsWith('.ts') && !full.endsWith('.d.ts') && !full.endsWith('.spec.ts') ? [full] : [];
    });
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

if (mode === 'tsc') {
    run('npx', ['tsc', '-v']);
    run('npx', ['tsc', '-p', 'spec-standard/tsconfig.emit.json']);
} else if (mode === 'esbuild') {
    const esbuild = await import('esbuild');
    console.log(`esbuild ${esbuild.version}`);
    await esbuild.build({
        entryPoints: [
            ...tsFiles(join(root, 'main')),
            join(root, 'spec-standard', 'standard-decorators.spec.ts'),
            join(root, 'spec-standard', 'typed-deps.spec.ts'),
        ],
        outbase: root,
        outdir: out,
        format: 'esm',
        target: 'es2022',
        bundle: false,
        // standard decorators: no experimentalDecorators, so esbuild lowers the TC39 proposal itself
        tsconfigRaw: {
            compilerOptions: { experimentalDecorators: false, useDefineForClassFields: true, target: 'es2022' },
        },
        logLevel: 'warning',
    });
} else {
    console.error('usage: test-standard-native.mjs <tsc|esbuild>');
    process.exit(2);
}

process.env.STANDARD_OUT = mode;
run('npx', ['vitest', 'run', '--config', 'vitest.native.config.ts']);
