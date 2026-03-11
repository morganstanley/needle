import { beforeEach, describe, expect, it } from 'vitest';
import { DI_ROOT_INJECTOR_KEY } from '../constants/constants.js';
import { Injector } from './injector.js';
import { getRegisteredTypesWithFactories } from './util.functions.partial.js';

class Alpha {}

describe('getRegisteredTypesWithFactories', () => {
    beforeEach(() => {
        const injector = Injector.create();
        injector.register(Alpha);
        (globalThis as any)[DI_ROOT_INJECTOR_KEY] = injector;
    });

    it('returns providers paired with lazy factory functions', () => {
        const providers = getRegisteredTypesWithFactories();

        expect(providers.length).toBeGreaterThan(0);
        expect(providers[0]?.provide).toBe(Alpha);
        expect(typeof providers[0]?.useFactory).toBe('function');
        expect(providers[0]?.useFactory()).toBeInstanceOf(Alpha);
    });
});
