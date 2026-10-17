// Runs every compiled example in order and fails if any of them throws.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const dir = join('reports', 'examples', 'examples');
const files = readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
let failed = false;
for (const file of files) {
    console.log(`\n--- ${file} ---`);
    const result = spawnSync(process.execPath, [join(dir, file)], { stdio: 'inherit' });
    if (result.status !== 0) {
        failed = true;
    }
}
process.exit(failed ? 1 : 0);
