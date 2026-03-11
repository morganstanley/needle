import { describe, expect, it, vi } from 'vitest';
import { createBoxedValueType } from './boxing.js';

describe('createBoxedValueType', () => {
    it('unboxes static values and caches them', () => {
        const BoxedValue = createBoxedValueType();
        const boxed = new BoxedValue({} as any, 42);

        expect(boxed.unbox()).toBe(42);
        expect(boxed.unbox()).toBe(42);
    });

    it('evaluates resolver each call when cacheSyncing is false', () => {
        const resolver = vi.fn(() => Math.random());
        const BoxedValue = createBoxedValueType();
        const boxed = new BoxedValue({} as any, { resolver, cacheSyncing: false });

        const value1 = boxed.unbox();
        const value2 = boxed.unbox();

        expect(resolver).toHaveBeenCalledTimes(2);
        expect(value1).not.toBe(value2);
    });

    it('evaluates resolver once when cacheSyncing is true', () => {
        const resolver = vi.fn(() => ({ id: 1 }));
        const BoxedValue = createBoxedValueType();
        const boxed = new BoxedValue({} as any, { resolver, cacheSyncing: true });

        const value1 = boxed.unbox();
        const value2 = boxed.unbox();

        expect(resolver).toHaveBeenCalledTimes(1);
        expect(value1).toBe(value2);
    });
});
