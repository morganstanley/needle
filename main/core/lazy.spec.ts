import { describe, expect, it, vi } from 'vitest';
import { LazyInstance } from './lazy.js';

describe('LazyInstance', () => {
    it('does not evaluate until value is read and only evaluates once', () => {
        const factory = vi.fn(() => ({ id: 123 }));
        const lazy = new LazyInstance(factory);

        expect(lazy.hasValue).toBe(false);

        const first = lazy.value;
        const second = lazy.value;

        expect(lazy.hasValue).toBe(true);
        expect(factory).toHaveBeenCalledTimes(1);
        expect(first).toBe(second);
    });
});
