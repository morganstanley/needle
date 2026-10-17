import { describe, expect, it } from 'vitest';
import { Configuration } from './configuration.js';

describe('Configuration', () => {
    it('has expected defaults', () => {
        const config = new Configuration();

        expect(config.maxTreeDepth).toBe(100);
        expect(config.allowDuplicateTokens).toBe(false);
        expect(config.trackMetrics).toBe(true);
        expect(config.metadataMode).toBe('both');
        expect(config.defaultCacheStrategy).toBe('persistent');
    });

    it('resets values to reset defaults', () => {
        const config = new Configuration();
        config.maxTreeDepth = 10;
        config.allowDuplicateTokens = true;
        config.trackMetrics = true;
        config.metadataMode = 'explicit';
        config.defaultCacheStrategy = 'no-cache';
        config.externalResolutionStrategy = { resolver: () => null } as any;

        config.reset();

        expect(config.maxTreeDepth).toBe(100);
        expect(config.allowDuplicateTokens).toBe(false);
        expect(config.trackMetrics).toBe(true);
        expect(config.metadataMode).toBe('both');
        expect(config.defaultCacheStrategy).toBe('persistent');
        expect(config.externalResolutionStrategy).toBeUndefined();
    });

    it('reset() restores exactly the same state as a new Configuration', () => {
        const config = new Configuration();
        config.maxTreeDepth = 1;
        config.allowDuplicateTokens = true;
        config.trackMetrics = false;
        config.metadataMode = 'reflection';
        config.defaultCacheStrategy = 'no-cache';
        config.externalResolutionStrategy = { resolver: () => null } as any;

        config.reset();

        expect({ ...config }).toEqual({ ...new Configuration() });
    });
});
