import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { createToken, dep, get, getOptional, injectable, LazyInstance, Token } from '../index.js';
import { getInstance, installFreshRootInjector } from '../../spec/injector.fixtures.js';

interface AppConfig {
    url: string;
}

describe('createToken', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    it('creates unique symbols', () => {
        const a = createToken<string>('x');
        const b = createToken<string>('x');
        expect(typeof a).toBe('symbol');
        expect(a).not.toBe(b);
        expect(a.toString()).toBe('Symbol(x)');
    });

    it('infers the resolved type from get, getOptional and getLazy', () => {
        const injector = getInstance();
        const Config = createToken<AppConfig>('config');
        injector.registerValue({ tokens: [Config], value: { url: '/api' } });

        const config = injector.get(Config);
        expectTypeOf(config).toEqualTypeOf<AppConfig>();
        expect(config.url).toBe('/api');

        expectTypeOf(injector.getOptional(Config)).toEqualTypeOf<AppConfig | undefined>();
        expectTypeOf(injector.getLazy(Config)).toEqualTypeOf<LazyInstance<AppConfig>>();
        expect(injector.getLazy(Config).value.url).toBe('/api');
        expect(injector.getOptional(createToken<number>())).toBeUndefined();
    });

    it('infers types from the global get and getOptional', () => {
        const Num = createToken<number>();
        getInstance().registerValue({ tokens: [Num], value: 42 });
        expectTypeOf(get(Num)).toEqualTypeOf<number>();
        expectTypeOf(getOptional(Num)).toEqualTypeOf<number | undefined>();
    });

    it('is still assignable wherever a symbol token is accepted', () => {
        const T = createToken<string>();
        expectTypeOf(T).toExtend<symbol>();
        expectTypeOf<Token<string>>().not.toEqualTypeOf<Token<number>>();
    });

    it('works in deps (bare, and via dep.token / dep.optional)', () => {
        const injector = getInstance();
        const Url = createToken<string>('url');
        const Missing = createToken<number>('missing');
        class Svc {
            constructor(
                public url: string,
                public url2: string,
                public missing: number | undefined,
            ) {}
        }
        injector.registerValue({ tokens: [Url], value: '/x' });
        injector.register(Svc, { deps: [Url, dep.token(Url), dep.optional(Missing)] });
        const svc = injector.get(Svc);
        expect(svc.url).toBe('/x');
        expect(svc.url2).toBe('/x');
        expect(svc.missing).toBeUndefined();
    });

    it('works in register({ tokens })', () => {
        const Greeter = createToken<{ hi(): string }>('greeter');
        class English {
            public hi() {
                return 'hello';
            }
        }
        const injector = getInstance();
        injector.register(English, { tokens: [Greeter] });
        expect(injector.get(Greeter).hi()).toBe('hello');
    });
});

describe('injectable() type-checked deps', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    class Engine {
        public hp = 1;
    }
    class Wheels {
        public count = 4;
        public spare = true;
    }
    class Logger {
        public log(_m: string) {
            /* noop */
        }
    }
    const Cfg = createToken<AppConfig>('cfg');

    class Car {
        constructor(
            public engine: Engine,
            public config: AppConfig,
            public logger: Logger | undefined,
            public wheels: LazyInstance<Wheels>,
        ) {}
    }

    it('registers and resolves a class without decorators', () => {
        const root = getInstance();
        root.registerValue({ tokens: [Cfg], value: { url: '/car' } });
        root.register(Engine);
        root.register(Wheels);
        const Registered = injectable(Car, [Engine, Cfg, dep.optional(Logger), dep.lazy(Wheels)]);
        expect(Registered).toBe(Car);
        const car = root.get(Car);
        expect(car.engine).toBeInstanceOf(Engine);
        expect(car.config.url).toBe('/car');
        expect(car.logger).toBeUndefined();
        expect(car.wheels.value.count).toBe(4);
    });

    it('rejects mismatched deps at compile time', () => {
        // never executed; the assertions are the @ts-expect-error lines (checked by `tsc -p spec/tsconfig.json`)
        const check = () => {
            // @ts-expect-error too few deps
            injectable(Car, [Engine]);
            // @ts-expect-error too many deps
            injectable(Car, [Engine, Cfg, dep.optional(Logger), dep.lazy(Wheels), Engine]);
            // @ts-expect-error wrong class for the first parameter
            injectable(Car, [Wheels, Cfg, dep.optional(Logger), dep.lazy(Wheels)]);
            // @ts-expect-error token of the wrong type
            injectable(Car, [Engine, createToken<number>(), dep.optional(Logger), dep.lazy(Wheels)]);
            // @ts-expect-error a lazy parameter needs dep.lazy
            injectable(Car, [Engine, Cfg, dep.optional(Logger), Wheels]);
            // @ts-expect-error optional dep given where a required one is expected
            injectable(Car, [dep.optional(Engine), Cfg, dep.optional(Logger), dep.lazy(Wheels)]);
        };
        expect(typeof check).toBe('function');
    });

    it('accepts untyped string tokens and subclasses', () => {
        class Turbo extends Engine {}
        class Plain {
            constructor(
                public e: Engine,
                public s: string,
            ) {}
        }
        injectable(Plain, [Turbo, dep.token('s')]);
        expect(true).toBe(true);
    });
});
