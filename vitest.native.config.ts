import { defineConfig } from 'vitest/config';

/** Runs already-compiled standard-decorator tests (see scripts/test-standard-native.mjs). No transforms for decorators here. */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: [`.standard-out/${process.env.STANDARD_OUT ?? '*'}/spec-standard/*.spec.js`],
    },
});
