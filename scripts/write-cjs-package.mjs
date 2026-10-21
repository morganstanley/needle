// The package is "type": "module", so the CommonJS build in dist/cjs must opt back in to CommonJS.
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('dist/cjs', { recursive: true });
writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }, null, 4) + '\n');

// Stamp the module format of the CommonJS copy (the source constant says 'esm').
import { readFileSync } from 'node:fs';
const formatFile = 'dist/cjs/main/core/module-format.js';
const src = readFileSync(formatFile, 'utf8');
const stamped = src.replace(/NEEDLE_MODULE_FORMAT = 'esm'/, "NEEDLE_MODULE_FORMAT = 'cjs'");
if (stamped === src) {
    throw new Error(`Could not stamp module format in ${formatFile}`);
}
writeFileSync(formatFile, stamped);
