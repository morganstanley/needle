import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    // Relative base so the site works from any path (GitHub Pages project sites live under /<repo>/)
    base: './',
    resolve: {
        alias: { '@needle': fileURLToPath(new URL('../main/index.ts', import.meta.url)) },
    },
    server: { fs: { allow: ['..'] } },
    build: { outDir: 'dist', emptyOutDir: true, target: 'es2022' },
});
