import { beforeEach, describe, expect, it } from 'vitest';
import {
    AutoFactory,
    dep,
    Factory,
    IConstructionInterceptor,
    IInjectionContext,
    Inject,
    Injectable,
    Injector,
    Interceptor,
    MaxDepthExceededError,
    Lazy,
    LazyInstance,
    Optional,
    Strategy,
    getRootInjector,
} from '../main/index.js';
import { Configuration } from '../main/core/configuration.js';
import { Metrics } from '../main/core/metrics.js';
import { InstanceCache } from '../main/core/cache.js';
import { InjectionTokensCache } from '../main/core/tokens.js';
import { DI_ROOT_INJECTOR_KEY } from '../main/constants/constants.js';

// Sanity: this project must really be running without legacy metadata
declare const Reflect: { getMetadata?: unknown };

function freshRoot() {
    (globalThis as unknown as Record<string, unknown>)[DI_ROOT_INJECTOR_KEY] = new Injector(
        new InstanceCache(),
        new Configuration(),
        new InjectionTokensCache(),
        new Metrics(),
    );
}

describe('standard (TC39) decorators', () => {
    beforeEach(() => {
        freshRoot();
    });

    it('runs without reflect-metadata', () => {
        expect(Reflect.getMetadata).toBeUndefined();
    });

    describe('@Injectable + deps', () => {
        it('registers a class and resolves it', () => {
            @Injectable()
            class Engine {
                public hp = 100;
            }
            expect(getRootInjector().get(Engine).hp).toBe(100);
            expect(getRootInjector().get(Engine)).toBe(getRootInjector().get(Engine)); // cached
        });

        it('resolves constructor dependencies declared with deps', () => {
            @Injectable()
            class Engine {}
            @Injectable({ deps: [Engine] })
            class Car {
                constructor(public engine: Engine) {}
            }
            const car = getRootInjector().get(Car);
            expect(car.engine).toBeInstanceOf(Engine);
            expect(car.engine).toBe(getRootInjector().get(Engine));
        });

        it('supports tokens (class-level and dep.token)', () => {
            @Injectable({ tokens: ['config'] })
            class Config {
                public env = 'prod';
            }
            @Injectable({ deps: [dep.token('config')] })
            class App {
                constructor(public config: Config) {}
            }
            expect(getRootInjector().get(App).config).toBeInstanceOf(Config);
        });

        it('supports dep.optional for unregistered types and tokens', () => {
            class Missing {}
            @Injectable({ deps: [dep.optional(Missing), dep.optional('nope')] })
            class Consumer {
                constructor(
                    public a?: Missing,
                    public b?: unknown,
                ) {}
            }
            const c = getRootInjector().get(Consumer);
            expect(c.a).toBeUndefined();
            expect(c.b).toBeUndefined();
        });

        it('dep.optional still injects when registered', () => {
            @Injectable()
            class Present {}
            @Injectable({ deps: [dep.optional(Present)] })
            class Consumer {
                constructor(public p?: Present) {}
            }
            expect(getRootInjector().get(Consumer).p).toBeInstanceOf(Present);
        });

        it('supports dep.lazy', () => {
            let constructed = 0;
            @Injectable()
            class Heavy {
                constructor() {
                    constructed++;
                }
            }
            @Injectable({ deps: [dep.lazy(Heavy)] })
            class Consumer {
                constructor(public heavy: LazyInstance<Heavy>) {}
            }
            const c = getRootInjector().get(Consumer);
            expect(constructed).toBe(0);
            expect(c.heavy.value).toBeInstanceOf(Heavy);
            expect(constructed).toBe(1);
        });

        it('supports dep.factory', () => {
            @Injectable()
            class Widget {
                constructor(public label?: string) {}
            }
            @Injectable({ deps: [dep.factory(Widget)] })
            class Consumer {
                constructor(public widgets: AutoFactory<typeof Widget>) {}
            }
            const c = getRootInjector().get(Consumer);
            const a = c.widgets.create();
            const b = c.widgets.create();
            expect(a).not.toBe(b);
            expect(a).toBeInstanceOf(Widget);
        });

        it('supports strategies via dep.strategy', () => {
            interface Handler {
                name: string;
            }
            @Injectable({ strategy: 'handlers' })
            class A implements Handler {
                name = 'a';
            }
            @Injectable({ strategy: 'handlers' })
            class B implements Handler {
                name = 'b';
            }
            @Injectable({ deps: [dep.strategy('handlers')] })
            class Router {
                constructor(public handlers: Handler[]) {}
            }
            const names = getRootInjector()
                .get(Router)
                .handlers.map((h) => h.name)
                .sort();
            expect(names).toEqual(['a', 'b']);
            expect(A).toBeDefined();
            expect(B).toBeDefined();
        });

        it('mixes several kinds of dependency by position', () => {
            @Injectable()
            class A {}
            @Injectable({ tokens: ['b'] })
            class B {}
            @Injectable({ deps: [A, dep.token('b'), dep.optional('missing')] })
            class C {
                constructor(
                    public a: A,
                    public b: B,
                    public m?: unknown,
                ) {}
            }
            const c = getRootInjector().get(C);
            expect(c.a).toBeInstanceOf(A);
            expect(c.b).toBeInstanceOf(B);
            expect(c.m).toBeUndefined();
        });
    });

    describe('accessor / field injection', () => {
        it('@Inject(Type) accessor', () => {
            @Injectable()
            class Engine {}
            @Injectable()
            class Car {
                @Inject(Engine) accessor engine!: Engine;
            }
            const car = getRootInjector().get(Car);
            expect(car.engine).toBeInstanceOf(Engine);
            expect(car.engine).toBe(getRootInjector().get(Engine));
        });

        it('@Inject(token) accessor', () => {
            @Injectable({ tokens: ['cfg'] })
            class Config {}
            @Injectable()
            class App {
                @Inject('cfg') accessor config!: Config;
            }
            expect(getRootInjector().get(App).config).toBeInstanceOf(Config);
        });

        it('accessor is resolved lazily and once', () => {
            let n = 0;
            @Injectable()
            class Dep {
                constructor() {
                    n++;
                }
            }
            @Injectable()
            class Host {
                @Inject(Dep) accessor dep!: Dep;
            }
            const h = getRootInjector().get(Host);
            expect(n).toBe(0);
            expect(h.dep).toBe(h.dep);
            expect(n).toBe(1);
        });

        it('@Inject(Type) field is resolved eagerly', () => {
            let n = 0;
            @Injectable()
            class Dep {
                constructor() {
                    n++;
                }
            }
            @Injectable()
            class Host {
                @Inject(Dep) dep!: Dep;
            }
            getRootInjector().get(Host);
            expect(n).toBe(1);
        });

        it('@Optional(Type) accessor gives undefined when unregistered', () => {
            class Missing {}
            @Injectable()
            class Host {
                @Optional(Missing) accessor m: Missing | undefined;
            }
            expect(getRootInjector().get(Host).m).toBeUndefined();
        });

        it('@Lazy(Type) accessor', () => {
            @Injectable()
            class Dep {}
            @Injectable()
            class Host {
                @Lazy(Dep) accessor dep!: LazyInstance<Dep>;
            }
            const h = getRootInjector().get(Host);
            expect(h.dep).toBeInstanceOf(LazyInstance);
            expect(h.dep.value).toBeInstanceOf(Dep);
        });

        it('@Factory(Type) accessor', () => {
            @Injectable()
            class Widget {}
            @Injectable()
            class Host {
                @Factory(Widget) accessor widgets!: AutoFactory<typeof Widget>;
            }
            const h = getRootInjector().get(Host);
            expect(h.widgets.create()).not.toBe(h.widgets.create());
        });

        it('@Strategy(name) accessor', () => {
            @Injectable({ strategy: 's' })
            class One {}
            @Injectable({ strategy: 's' })
            class Two {}
            @Injectable()
            class Host {
                @Strategy('s') accessor all!: unknown[];
            }
            const all = getRootInjector().get(Host).all;
            expect(all).toHaveLength(2);
            expect(One).toBeDefined();
            expect(Two).toBeDefined();
        });

        it('resolves from the scoped injector that constructed the instance', () => {
            const root = getRootInjector();
            const child = root.createScope('child');
            @Injectable()
            class Dep {}
            class Host {
                @Inject(Dep) accessor dep!: Dep;
            }
            child.register(Dep).register(Host);
            const h = child.get(Host);
            expect(h.dep).toBe(child.get(Dep));
        });

        it('resolves member deps registered only in the requesting scope (parity with constructor params)', () => {
            const root = getRootInjector();
            const child = root.createScope('child');
            class ScopedDep {}
            @Injectable()
            class Host {
                @Inject(ScopedDep) accessor dep!: ScopedDep;
                @Inject(ScopedDep) eager!: ScopedDep;
            }
            child.register(ScopedDep);
            const h = child.get(Host);
            expect(h.dep).toBe(child.get(ScopedDep));
            expect(h.eager).toBe(child.get(ScopedDep));
        });

        it('throws MaxDepthExceededError (not a stack overflow) for a cycle through eager fields', () => {
            // decorator arguments are evaluated at class definition, so A reaches B through a token
            class A {
                @Inject('b-type') b!: unknown;
            }
            class B {
                @Inject(A) a!: A;
            }
            getRootInjector()
                .register(A)
                .register(B, { tokens: ['b-type'] });
            let error: unknown;
            try {
                getRootInjector().get(A);
            } catch (e) {
                error = e;
            }
            expect(error).toBeInstanceOf(MaxDepthExceededError);
            expect((error as MaxDepthExceededError).resolutionPath).toEqual(['A', 'B', 'A']);
        });

        it('throws MaxDepthExceededError for a cycle through token fields', () => {
            class A {
                @Inject('b-token') b!: unknown;
            }
            class B {
                @Inject('a-token') a!: unknown;
            }
            getRootInjector()
                .register(A, { tokens: ['a-token'] })
                .register(B, { tokens: ['b-token'] });
            expect(() => getRootInjector().get(A)).toThrow(MaxDepthExceededError);
        });

        it('allows cycles through lazily-resolved accessors', () => {
            class A {
                @Inject('lazy-b') accessor b!: { a: A };
            }
            class B {
                @Inject(A) accessor a!: A;
            }
            getRootInjector()
                .register(A)
                .register(B, { tokens: ['lazy-b'] });
            const a = getRootInjector().get(A);
            expect(a.b.a).toBe(a);
        });

        it('falls back to the root injector when constructed with `new`', () => {
            @Injectable()
            class Dep {}
            class Host {
                @Inject(Dep) accessor dep!: Dep;
            }
            expect(new Host().dep).toBe(getRootInjector().get(Dep));
        });

        it('a field initialiser value wins over injection', () => {
            @Injectable()
            class Dep {}
            @Injectable()
            class Host {
                @Inject(Dep) accessor dep: Dep | string = 'manual';
            }
            expect(getRootInjector().get(Host).dep).toBe('manual');
        });

        it('rejects static members and methods with clear errors', () => {
            expect(() => {
                class X {
                    @Inject('a') static accessor s: unknown;
                }
                return X;
            }).toThrow(/static/);
            expect(() => {
                class Y {
                    // @ts-expect-error methods are not supported
                    @Inject('a') method() {}
                }
                return Y;
            }).toThrow(/fields and accessors/);
        });
    });

    describe('@Interceptor', () => {
        it('registers and runs a standard-decorated interceptor', () => {
            const created: string[] = [];
            @Injectable()
            class Thing {}
            @Interceptor()
            class Spy implements IConstructionInterceptor {
                target = Thing; // interceptors are matched per exact type
                beforeCreate(ctx: IInjectionContext) {
                    created.push(`before:${(ctx.type as { name: string }).name}`);
                }
                afterCreate(_i: unknown, ctx: IInjectionContext) {
                    created.push(`after:${(ctx.type as { name: string }).name}`);
                }
            }
            getRootInjector().get(Thing);
            expect(created).toContain('before:Thing');
            expect(created).toContain('after:Thing');
            expect(Spy).toBeDefined();
        });
    });

    describe('limitations', () => {
        it('without deps, constructor params are NOT inferred (no emitDecoratorMetadata)', () => {
            @Injectable()
            class Engine {}
            @Injectable()
            class Car {
                constructor(public engine?: Engine) {}
            }
            expect(getRootInjector().get(Car).engine).toBeUndefined();
        });
    });
});
