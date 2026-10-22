/**
 * The module format of this copy of Needle. The source (and the ESM build) says 'esm';
 * `scripts/write-cjs-package.mjs` rewrites this value to 'cjs' in the CommonJS build output.
 * A build-time constant avoids runtime sniffing of `module`/`exports`, which bundlers can mis-handle.
 */
export const NEEDLE_MODULE_FORMAT: 'esm' | 'cjs' = 'esm';
