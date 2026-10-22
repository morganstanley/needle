// Packs the library and runs @arethetypeswrong/cli against the tarball (node16 profile: CJS, ESM and bundler).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const shell = process.platform === 'win32';
const dir = mkdtempSync(join(tmpdir(), 'needle-attw-'));
try {
    execFileSync('npm', ['pack', '--pack-destination', dir], { stdio: 'ignore', shell });
    const tarball = join(dir, readdirSync(dir).find((f) => f.endsWith('.tgz')));
    execFileSync('npx', ['--yes', '@arethetypeswrong/cli@0.18.5', tarball, '--profile', 'node16'], { stdio: 'inherit', shell });
} finally {
    rmSync(dir, { recursive: true, force: true });
}
