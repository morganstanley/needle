import { beforeEach, describe, expect, it } from 'vitest';
import { dep, Inject, Injectable, Lazy, LazyInstance } from '../index.js';
import { getInstance, installFreshRootInjector } from '../../spec/injector.fixtures.js';

describe('Injector deps (explicit constructor dependencies)', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    it('resolves types and tokens listed in deps without any decorators', () => {
        const injector = getInstance();
        class Engine {}
        class Config {}
        class Car {
            constructor(
                public engine: Engine,
                public config: Config,
                public missing?: unknown,
            ) {}
        }
        injector
            .register(Engine)
            .register(Config, { tokens: ['config'] })
            .register(Car, { deps: [Engine, dep.token('config'), dep.optional('nope')] });

        const car = injector.get(Car);
        expect(car.engine).toBeInstanceOf(Engine);
        expect(car.config).toBeInstanceOf(Config);
        expect(car.missing).toBeUndefined();
    });

    it('resolves lazy deps', () => {
        const injector = getInstance();
        class Heavy {}
        class Host {
            constructor(public heavy: LazyInstance<Heavy>) {}
        }
        injector.register(Heavy).register(Host, { deps: [dep.lazy(Heavy)] });
        expect(injector.get(Host).heavy.value).toBeInstanceOf(Heavy);
    });

    it('explicit metadata wins over deps types', () => {
        const injector = getInstance();
        class A {}
        class B {}
        class Host {
            constructor(public a: unknown) {}
        }
        injector
            .register(A)
            .register(B)
            .register(Host, { deps: [A], metadata: [B] as never });
        expect(injector.get(Host).a).toBeInstanceOf(B);
    });

    it('rejects an unknown descriptor', () => {
        const injector = getInstance();
        class Host {}
        expect(() => injector.register(Host, { deps: [{ kind: 'wat' } as never] })).toThrow(/Unknown dependency/);
    });

    describe('legacy decorators still work through the dual-mode decorators', () => {
        it('@Inject(token) on a constructor parameter', () => {
            const injector = getInstance();
            @Injectable({ tokens: ['t'] })
            class Tok {}
            @Injectable()
            class Host {
                constructor(@Inject('t') public tok: Tok) {}
            }
            expect(injector.get(Host).tok).toBeInstanceOf(Tok);
        });

        it('@Lazy on a constructor parameter', () => {
            const injector = getInstance();
            @Injectable()
            class Dep {}
            @Injectable()
            class Host {
                constructor(@Lazy(Dep) public dep: LazyInstance<Dep>) {}
            }
            expect(injector.get(Host).dep.value).toBeInstanceOf(Dep);
        });

        it('@Inject(Type) on a constructor parameter gives a clear error', () => {
            class Dep {}
            expect(() => {
                class Host {
                    constructor(@Inject(Dep) public dep: Dep) {}
                }
                return Host;
            }).toThrow(/string or symbol token/);
        });

        it('@Inject rejects an invalid target', () => {
            expect(() => Inject(undefined as never)).toThrow(/requires a token/);
        });
    });
});
