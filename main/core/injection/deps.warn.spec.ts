import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Injectable, resetLogger, setLogger } from '../../index.js';
import { warnOnDepsMismatch } from './deps.js';
import { installFreshRootInjector } from '../../../spec/injector.fixtures.js';

describe('dev-mode deps warning', () => {
    const warn = vi.fn();
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        installFreshRootInjector();
        warn.mockReset();
        setLogger({ warn, log: vi.fn() });
    });
    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        resetLogger();
    });

    class A {}
    class B {}
    class Two {
        constructor(
            public a: A,
            public b: B,
        ) {}
    }

    // a standard decorator call is (value, context); simulate it so the legacy-flag project exercises the same path
    const standardContext = { kind: 'class', name: 'Two' } as never;

    it('warns when deps is shorter than the constructor', () => {
        Injectable({ deps: [A] })(Two, standardContext);
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toContain("declares 1 'deps' but its constructor takes 2");
    });

    it('warns when deps is longer than the constructor', () => {
        Injectable({ deps: [A, B, A] })(Two, standardContext);
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toContain('3');
    });

    it('warns when a constructor takes parameters but deps is missing', () => {
        Injectable<typeof Two>()(Two, standardContext);
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toContain("no 'deps' were given");
    });

    it('does not warn when deps matches', () => {
        Injectable({ deps: [A, B] })(Two, standardContext);
        expect(warn).not.toHaveBeenCalled();
    });

    it('does not warn for no-arg constructors or explicit metadata', () => {
        Injectable<typeof A>()(A, standardContext);
        Injectable<typeof Two>({ metadata: [A, B] })(Two, standardContext);
        expect(warn).not.toHaveBeenCalled();
    });

    it('does not warn for legacy decorator usage (no context)', () => {
        Injectable<typeof Two>()(Two);
        Injectable<typeof Two>({ deps: [A] })(Two);
        expect(warn).not.toHaveBeenCalled();
    });

    it('is silent in production', () => {
        process.env.NODE_ENV = 'production';
        Injectable({ deps: [A] })(Two, standardContext);
        warnOnDepsMismatch(Two, undefined);
        expect(warn).not.toHaveBeenCalled();
    });

    it('ignores non-class types', () => {
        warnOnDepsMismatch('x', { deps: [A] });
        expect(warn).not.toHaveBeenCalled();
    });
});
