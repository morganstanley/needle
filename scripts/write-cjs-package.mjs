// The package is "type": "module", so the CommonJS build in dist/cjs must opt back in to CommonJS.
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('dist/cjs', { recursive: true });
writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }, null, 4) + '\n');
