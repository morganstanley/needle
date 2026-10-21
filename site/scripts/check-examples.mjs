// Runs every live example against the built library (../dist) so the docs cannot drift from the code.
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '../../dist/main/index.js');
if (!existsSync(dist)) {
    console.error('Build the library first (npm run build in the repo root).');
    process.exit(1);
}
await import('reflect-metadata').catch(() => undefined);
const needle = await import(pathToFileURL(dist).href);

const source = readFileSync(resolve(here, '../src/examples.ts'), 'utf8');
const body = source.slice(source.indexOf('export const examples'));
const examples = new Function(`${body.replace('export const examples: IExample[] =', 'return')}`)();

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
let failed = 0;
for (const ex of examples) {
    const lines = [];
    try {
        await new AsyncFunction('needle', 'log', ex.code)(needle, (...a) => lines.push(a.join(' ')));
        if (lines.length === 0) throw new Error('example printed nothing');
        console.log(`ok   ${ex.id} (${lines.length} lines)`);
        if (process.env.SHOW) console.log(lines.map((l) => '       ' + l).join('\n'));
    } catch (e) {
        failed++;
        console.error(`FAIL ${ex.id}:`, e);
    }
}
process.exit(failed ? 1 : 0);
