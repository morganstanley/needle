import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
    createToken,
    dep,
    getRootInjector,
    Inject,
    Injectable,
    injectable,
    Injector,
    LazyInstance,
    resetLogger,
    setLogger,
} from '../main/index.js';
import { Configuration } from '../main/core/configuration.js';
import { Metrics } from '../main/core/metrics.js';
import { InstanceCache } from '../main/core/cache.js';
import { InjectionTokensCache } from '../main/core/tokens.js';
import { DI_ROOT_INJECTOR_KEY } from '../main/constants/constants.js';

interface AppConfig {
    url: string;
}

describe('typed tokens, injectable() and deps warnings under standard decorators', () => {
    const warn = vi.fn();
    beforeEach(() => {
        (globalThis as unknown as Record<string, unknown>)[DI_ROOT_INJECTOR_KEY] = new Injector(
            new InstanceCache(),
            new Configuration(),
            new InjectionTokensCache(),
            new Metrics(),
        );
        warn.mockReset();
        setLogger({ warn, log: vi.fn() });
        return () => resetLogger();
    });

    it('typed token in @Injectable deps and @Inject accessor', () => {
        const Cfg = createToken<AppConfig>('cfg');
        getRootInjector().registerValue({ tokens: [Cfg], value: { url: '/std' } });

        @Injectable({ deps: [Cfg] })
        class Client {
            constructor(public config: AppConfig) {}
        }
        @Injectable()
        class Viaaccessor {
            @Inject(Cfg) accessor config!: AppConfig;
        }

        expect(getRootInjector().get(Client).config.url).toBe('/std');
        expect(getRootInjector().get(Viaaccessor).config.url).toBe('/std');
        expectTypeOf(getRootInjector().get(Cfg)).toEqualTypeOf<AppConfig>();
        expect(warn).not.toHaveBeenCalled();
    });

    it('injectable() registers a class with checked deps, no decorator needed', () => {
        @Injectable()
        class Engine {}
        class Wheels {}
        const Cfg = createToken<AppConfig>('cfg');
        getRootInjector().registerValue({ tokens: [Cfg], value: { url: '/h' } });
        getRootInjector().register(Wheels);

        class Car {
            constructor(
                public engine: Engine,
                public config: AppConfig,
                public wheels: LazyInstance<Wheels>,
                public note?: string,
            ) {}
        }
        injectable(Car, [Engine, Cfg, dep.lazy(Wheels), dep.optional('note')]);

        const car = getRootInjector().get(Car);
        expect(car.engine).toBeInstanceOf(Engine);
        expect(car.config.url).toBe('/h');
        expect(car.wheels.value).toBeInstanceOf(Wheels);
        expect(car.note).toBeUndefined();

        // @ts-expect-error missing deps are a compile error
        injectable(Car, [Engine]);
    });

    it('warns once per mismatched standard-decorated class', () => {
        class A {}
        class B {}
        @Injectable({ deps: [A] })
        class Two {
            constructor(
                public a: A,
                public b: B,
            ) {}
        }
        expect(Two).toBeDefined();
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toContain('Two');
    });

    it('warns when a constructor takes parameters but deps is missing', () => {
        class A {}
        @Injectable()
        class Forgot {
            constructor(public a?: A) {}
        }
        expect(Forgot).toBeDefined();
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toContain("no 'deps' were given");
    });

    it('does not warn for a matching deps list', () => {
        class A {}
        @Injectable({ deps: [A] })
        class One {
            constructor(public a: A) {}
        }
        expect(One).toBeDefined();
        expect(warn).not.toHaveBeenCalled();
    });

    it('does not warn for a derived class that relies on its base constructor', () => {
        class Engine {}
        class Base {
            constructor(public engine: Engine) {}
        }
        @Injectable({ deps: [Engine] })
        class Sub extends Base {}
        expect(Sub).toBeDefined();
        expect(warn).not.toHaveBeenCalled();
    });

    it('still warns for a derived class whose own constructor does not match deps', () => {
        class Engine {}
        class Base {}
        @Injectable({ deps: [Engine] })
        class Sub extends Base {
            constructor(
                public engine: Engine,
                public extra: string,
            ) {
                super();
            }
        }
        expect(Sub).toBeDefined();
        expect(warn).toHaveBeenCalledOnce();
    });
});
