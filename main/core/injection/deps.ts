import {
    Dependency,
    IDependencyDescriptor,
    IInjectionConfiguration,
    ITokenCache,
    Newable,
    Token,
} from '../../contracts/contracts.js';
import type { AutoFactory } from '../factory.js';
import type { LazyInstance } from '../lazy.js';
import { getLogger } from '../logger.js';
import { generateUUID } from '../uuid.js';

/** Placeholder constructor type for parameters whose value is not resolved from a type (token, lazy, factory, strategy) */
const PLACEHOLDER = Object as unknown as Newable;

/**
 * Turns an explicit `deps` list (the standard-decorator replacement for parameter decorators + design:paramtypes)
 * into `metadata` (the param types) plus parameter tokens registered on the given token cache.
 * A plain constructor in the list is a type dependency; descriptors (see `dep`) cover the rest.
 */
export function applyDeps(
    tokenCache: ITokenCache,
    owner: unknown,
    config: IInjectionConfiguration,
): IInjectionConfiguration {
    const deps = config.deps;
    if (deps == null) {
        return config;
    }
    const metadata: Newable[] = deps.map((d, index) => {
        if (typeof d === 'function') {
            return d as Newable;
        }
        if (typeof d === 'symbol') {
            // a bare (typed) token is the same as dep.token(token)
            return applyDescriptor(tokenCache, owner, index, { kind: 'token', token: d });
        }
        return applyDescriptor(tokenCache, owner, index, d);
    });
    // explicit metadata wins if the user supplied both, deps then only contributes tokens
    return { ...config, metadata: (config.metadata ?? metadata) as never };
}

function applyDescriptor(tokenCache: ITokenCache, owner: unknown, index: number, d: IDependencyDescriptor): Newable {
    const base = { owner, property: undefined as unknown as string, index };
    switch (d.kind) {
        case 'token':
            tokenCache.register({ ...base, token: d.token, injectionType: 'singleton' });
            return PLACEHOLDER;
        case 'strategy':
            tokenCache.register({ ...base, token: d.token, injectionType: 'multiple' });
            return PLACEHOLDER;
        case 'lazy':
            tokenCache.register({
                ...base,
                token: `lazy_${generateUUID()}`,
                lazyTarget: d.target,
                injectionType: 'lazy',
            });
            return PLACEHOLDER;
        case 'factory':
            tokenCache.register({
                ...base,
                token: `factory_${generateUUID()}`,
                factoryTarget: d.target,
                injectionType: 'factory',
            });
            return PLACEHOLDER;
        case 'optional': {
            tokenCache.register({ ...base, token: `optional_${generateUUID()}`, injectionType: 'optional' });
            if (typeof d.target === 'function') {
                return d.target;
            }
            // optional token
            tokenCache.register({ ...base, token: d.target, injectionType: 'singleton' });
            return PLACEHOLDER;
        }
        default:
            throw new Error(`Unknown dependency descriptor: ${JSON.stringify(d)}`);
    }
}

/**
 * Helpers for describing constructor dependencies in `@Injectable({ deps: [...] })` or `injectable(Type, [...])`.
 * Each helper remembers the constructor parameter type it provides, which `injectable()` checks.
 *
 * @example
 * @Injectable({ deps: [Engine, dep.token('config'), dep.optional(Logger), dep.lazy(Wheels)] })
 * class Car { constructor(engine: Engine, config: Config, logger?: Logger, wheels: LazyInstance<Wheels>) {} }
 */
export const dep = {
    /** inject whatever is registered against a token (same as `@Inject('token')`). A typed token carries its type, a string/symbol is unchecked */
    token: ((token: string | symbol): Dependency<unknown> => ({ kind: 'token', token })) as {
        <T>(token: Token<T>): Dependency<T>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- an untyped token cannot be checked against the parameter
        (token: string | symbol): Dependency<any>;
    },
    /** inject `undefined` rather than throwing if nothing is registered (same as `@Optional()`); target may be a type or token */
    optional: ((target: Newable | string | symbol): Dependency<unknown> => ({ kind: 'optional', target })) as {
        <T>(target: Newable<T>): Dependency<T | undefined>;
        <T>(target: Token<T>): Dependency<T | undefined>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- an untyped token cannot be checked against the parameter
        (target: string | symbol): Dependency<any>;
    },
    /** inject a LazyInstance (same as `@Lazy(Type)`) */
    lazy: <T>(target: Newable<T>): Dependency<LazyInstance<T>> => ({ kind: 'lazy', target }),
    /** inject an AutoFactory (same as `@Factory(Type)`) */
    factory: <T extends Newable>(target: T): Dependency<AutoFactory<T>> => ({ kind: 'factory', target }),
    /** inject all types registered with `strategy: name` (same as `@Strategy(name)`) */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the strategy's member type is not known from its name
    strategy: (token: string | symbol): Dependency<any> => ({ kind: 'strategy', token }),
};

/** One checked entry of a `deps` tuple: a class, a typed token or a `dep.*` helper that provides `T` */
export type DepFor<T> = Newable<T> | Token<T> | Dependency<T>;

/** Maps a constructor's parameter tuple to the `deps` tuple that satisfies it */
export type DepsFor<P extends unknown[]> = { [K in keyof P]-?: DepFor<P[K]> };

// Declared locally so the library does not depend on @types/node; only read inside a try/catch.
declare const process: { env: { NODE_ENV?: string } };

/**
 * Whether Needle's dev-mode diagnostics are on (off when `NODE_ENV` is `production`)
 */
function isDevMode(): boolean {
    try {
        // Written as the literal `process.env.NODE_ENV` so bundlers (webpack, Vite, esbuild...) replace it and fold
        // this check away in production builds. Without a bundler, in a browser `process` is not defined: treat as dev.
        return process.env.NODE_ENV !== 'production';
    } catch {
        return true;
    }
}

/** True when `type` extends another class (so an implicit constructor forwards `...args` and `length` is 0) */
function extendsAnotherClass(type: object): boolean {
    return Object.getPrototypeOf(type) !== Function.prototype;
}

/**
 * Dev-mode only: warns (through the pluggable logger) when the number of `deps` differs from the constructor's declared
 * parameter count. Used for standard-decorated classes, which have no `design:paramtypes` to fall back on, so a missing
 * or short `deps` would otherwise construct the class with `undefined` arguments silently.
 * `Function.length` stops at the first parameter with a default value or rest, so a longer `deps` can be a false alarm there.
 */
export function warnOnDepsMismatch(type: unknown, config: IInjectionConfiguration | undefined): void {
    if (!isDevMode() || typeof type !== 'function') {
        return;
    }
    const expected = type.length;
    const actual = config?.deps?.length;
    if (expected === 0 && extendsAnotherClass(type)) {
        // A derived class with no constructor of its own (or one taking `...args`) reports length 0 even though it
        // needs its base class's parameters, so there is nothing reliable to compare against.
        return;
    }
    if (actual == null) {
        if (expected > 0 && config?.metadata == null) {
            getLogger().warn(
                `[needle] ${type.name || 'anonymous class'} is decorated with a standard decorator and its constructor takes ${expected} parameter(s), but no 'deps' were given. ` +
                    `Standard decorators emit no constructor metadata, so they will be undefined. Use @Injectable({ deps: [...] }).`,
            );
        }
        return;
    }
    if (actual !== expected) {
        getLogger().warn(
            `[needle] ${type.name || 'anonymous class'} declares ${actual} 'deps' but its constructor takes ${expected} parameter(s). ` +
                `Check that 'deps' lists one entry per constructor parameter, in order.` +
                (actual > expected
                    ? ' (Parameters with default values or rest parameters are not counted, nor are parameters inherited from a base class constructor.)'
                    : ''),
        );
    }
}
