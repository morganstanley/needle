import { describe, expect, it } from 'vitest';
import {
    isBoxedValue,
    isConditionalCacheStrategy,
    isConstructorParameterToken,
    isDestroyable,
    isExternalResolutionConfigurationLike,
    isExternalValueResolutionConfigurationLike,
    isFactoryParameterToken,
    isIdleCacheStrategy,
    isInjectorLike,
    isLazyParameterToken,
    isStringOrSymbol,
} from './guards.js';

describe('guards', () => {
    it('detects constructor/factory/lazy parameter token shapes', () => {
        const base = { owner: class Test {}, token: 'x', injectionType: 'singleton', index: 0 };

        expect(isConstructorParameterToken(base as any)).toBe(true);
        expect(isFactoryParameterToken({ ...base, factoryTarget: class A {} } as any)).toBe(true);
        expect(isLazyParameterToken({ ...base, lazyTarget: class A {} } as any)).toBe(true);
    });

    it('detects string/symbol tokens', () => {
        expect(isStringOrSymbol('a')).toBe(true);
        expect(isStringOrSymbol(Symbol.for('a'))).toBe(true);
        expect(isStringOrSymbol(1)).toBe(false);
    });

    it('detects resolver/value resolver configuration', () => {
        expect(isExternalResolutionConfigurationLike({ resolver: () => 1 })).toBe(true);
        expect(isExternalValueResolutionConfigurationLike({ resolver: () => 1 })).toBe(true);
        expect(isExternalResolutionConfigurationLike({})).toBe(false);
    });

    it('detects injector-like and boxed/destroyable values', () => {
        const injectorLike = {
            cache: {},
            configuration: {},
            getStrategies: () => [],
            registerInstance: () => null,
            tokenCache: {},
            register: () => null,
            registerParamForFactoryInjection: () => null,
        };

        expect(isInjectorLike(injectorLike)).toBe(true);
        expect(isBoxedValue({ typeId: '__needle_boxed__' })).toBe(false);
        expect(isDestroyable({ needle_destroy: () => null })).toBe(true);
    });

    it('detects idle and conditional cache strategies', () => {
        expect(isIdleCacheStrategy({ type: 'idle', timeout: 10 })).toBe(true);
        expect(isConditionalCacheStrategy({ type: 'conditional', predicate: () => true })).toBe(true);
        expect(isConditionalCacheStrategy({ type: 'conditional' })).toBe(false);
    });
});
