import { describe, expect, it, vi } from 'vitest';
import { InstanceCache } from './cache.js';

describe('InstanceCache', () => {
    it('stores and resolves persistent values', () => {
        const cache = new InstanceCache();
        const token = Symbol('cache-token');
        const instance = { v: 1 };

        cache.update(token, instance, { cacheStrategy: 'persistent' } as any);

        expect(cache.resolve(token)).toBe(instance);
        expect(cache.instanceCount).toBe(1);
    });

    it('destroys previous value when replaced', () => {
        const cache = new InstanceCache();
        const token = Symbol('replace-token');
        const destroy = vi.fn();
        const oldInstance = { needle_destroy: destroy };
        const newInstance = { id: 2 };

        cache.update(token, oldInstance, { cacheStrategy: 'persistent' } as any);
        cache.update(token, newInstance, { cacheStrategy: 'persistent' } as any);

        expect(destroy).toHaveBeenCalledTimes(1);
        expect(cache.resolve(token)).toBe(newInstance);
    });

    it('purges conditionally cached values when predicate matches', () => {
        const cache = new InstanceCache();
        const token = Symbol('conditional-token');
        const instance = { active: false };

        cache.update(token, instance, {
            cacheStrategy: {
                type: 'conditional',
                predicate: (value: { active: boolean }) => value.active === false,
            },
        } as any);

        expect(cache.resolve(token)).toBe(instance);
        cache.purge();
        expect(cache.resolve(token)).toBeUndefined();
    });
});
