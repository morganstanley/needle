import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        swc.vite({
            jsc: {
                parser: {
                    syntax: 'typescript',
                    decorators: true,
                },
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true,
                },
            },
        }),
    ],
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['spec/**/*.spec.ts'],
        setupFiles: ['spec/setup.ts'],
        reporters: ['default', 'junit'],
        outputFile: {
            junit: 'reports/junit/TESTS.xml',
        },
        coverage: {
            provider: 'v8',
            reportsDirectory: 'reports/coverage',
            reporter: ['html', 'text', 'cobertura', 'lcov'],
            thresholds: {
                statements: 85,
                lines: 85,
                branches: 85,
                functions: 85,
            },
        },
    },
});
