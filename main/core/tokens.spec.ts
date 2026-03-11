import { describe, expect, it } from 'vitest';
import { InjectionTokensCache } from './tokens.js';

class Owner {}
class Target {}

describe('InjectionTokensCache', () => {
    it('registers singleton type tokens and resolves lookups', () => {
        const cache = new InjectionTokensCache();

        cache.register({ owner: Owner, token: 'owner-token', injectionType: 'singleton' } as any);

        expect(cache.getTokensForType(Owner).length).toBe(1);
        expect(cache.getTypesForToken('owner-token')).toEqual([Owner]);
        expect(cache.getTypeForToken('owner-token')).toBe(Owner);
    });

    it('registers parameter tokens across all injection kinds', () => {
        const cache = new InjectionTokensCache();

        cache.register({ owner: Owner, token: 'inject', injectionType: 'singleton', index: 0 } as any);
        cache.register({ owner: Owner, token: 'strategy', injectionType: 'multiple', index: 1 } as any);
        cache.register({ owner: Owner, token: 'factory', injectionType: 'factory', index: 2, factoryTarget: Target } as any);
        cache.register({ owner: Owner, token: 'lazy', injectionType: 'lazy', index: 3, lazyTarget: Target } as any);
        cache.register({ owner: Owner, token: 'optional', injectionType: 'optional', index: 4 } as any);

        expect(cache.getInjectTokens(Owner).length).toBe(1);
        expect(cache.getStrategyTokens(Owner).length).toBe(1);
        expect(cache.getFactoryTokens(Owner).length).toBe(1);
        expect(cache.getLazyTokens(Owner).length).toBe(1);
        expect(cache.getOptionalTokens(Owner).length).toBe(1);

        cache.register({ owner: Owner, token: 'strategy-list', injectionType: 'multiple' } as any);
        expect(cache.getStrategyConsumers('strategy-list')).toEqual([Owner]);
    });

    it('clears all internal caches', () => {
        const cache = new InjectionTokensCache();
        cache.register({ owner: Owner, token: 'owner-token', injectionType: 'singleton' } as any);
        cache.clear();

        expect(cache.getTokensForType(Owner)).toEqual([]);
        expect(cache.getTypesForToken('owner-token')).toEqual([]);
    });
});
