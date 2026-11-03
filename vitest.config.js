import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/server/tests/**/*.test.js', 'src/renderer/**/*.test.js'],
        testTimeout: 10000,
    },
});
