import { beforeEach, describe, expect, it } from 'vitest';
import { dep } from '../index.js';
import { getInstance, installFreshRootInjector } from '../../spec/injector.fixtures.js';

describe('Injector deps regressions (PR #281 review)', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    it('uses the deps of a registration made only in a child scope', () => {
        const root = getInstance();
        class Engine {}
        class Car {
            constructor(public engine: Engine) {}
        }
        const child = root.createScope('child');
        child.register(Engine).register(Car, { deps: [Engine] });

        expect(child.get(Car).engine).toBeInstanceOf(Engine);
    });

    it('a child scope registration with different deps overrides the root one', () => {
        const root = getInstance();
        class A {}
        class B {}
        class Host {
            constructor(public dep: unknown) {}
        }
        root.register(A)
            .register(B)
            .register(Host, { deps: [A] });
        const child = root.createScope('child');
        child.register(Host, { deps: [B] });

        expect(child.get(Host).dep).toBeInstanceOf(B);
        expect(root.get(Host).dep).toBeInstanceOf(A);
    });
});
