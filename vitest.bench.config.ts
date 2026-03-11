import { defineConfig } from 'vitest/config';

export default defineConfig({
    benchmark: {
        include: ['bench/**/*.bench.ts'],
    },
});
