import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

/**
 * Test project for standard (TC39, TS 5+ non-experimental) decorators.
 * No `reflect-metadata`, no `experimentalDecorators`, no `emitDecoratorMetadata` (see spec-standard/tsconfig.json).
 */
export default defineConfig({
    plugins: [
        swc.vite({
            tsconfigFile: false,
            jsc: {
                target: 'es2022',
                parser: { syntax: 'typescript', decorators: true },
                transform: { decoratorVersion: '2022-03', legacyDecorator: false, decoratorMetadata: false },
            },
        }),
    ],
    test: {
        globals: true,
        environment: 'node',
        include: ['spec-standard/**/*.spec.ts'],
    },
});
