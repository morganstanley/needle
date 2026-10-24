import { IInjectionConfiguration, Newable } from '../contracts/contracts.js';
import { getRootInjector } from '../core/util.functions.js';
import { DepsFor, warnOnDepsMismatch } from '../core/injection/deps.js';
import { IStandardDecoratorContext } from './decorator-support.js';

/**
 * This is the core decorator for all injectables. Works as a legacy (`experimentalDecorators`) class decorator and as
 * a standard (TC39) class decorator.
 *
 * @Injectable()
 * class Foo{}
 *
 * @Injectable({tokens: ['bar']})
 * class Foo{}
 *
 * @Injectable({strategy: 'strategy-name'})
 * class Foo{}
 *
 * // standard decorators have no emitDecoratorMetadata, so describe the constructor explicitly
 * @Injectable({deps: [Engine, dep.token('config'), dep.optional(Logger)]})
 * class Car{ constructor(e: Engine, c: Config, l?: Logger){} }
 *
 * @param configuration
 */
export function Injectable<T>(configuration?: IInjectionConfiguration<T>) {
    // `context` is only supplied by standard decorators
    return (type: T, context?: IStandardDecoratorContext): void => {
        if (context != null) {
            warnOnDepsMismatch(type, configuration);
        }
        getRootInjector().register(type, configuration);
    };
}

/**
 * Decorator-free, type-checked registration. The `deps` tuple must match the constructor's parameter types
 * one-for-one: a class (or subclass) for a type, a typed token from `createToken<T>()`, or a `dep.*` helper.
 * Works with any decorator mode, or none, and with any toolchain.
 *
 * @example
 * class Car { constructor(readonly engine: Engine, readonly config: AppConfig, readonly log?: Logger) {} }
 * injectable(Car, [Engine, ConfigToken, dep.optional(Logger)]);
 * // injectable(Car, [Engine]) and injectable(Car, [Wheels, ...]) are compile errors
 *
 * @returns the class, so it can be exported in one expression
 */
export function injectable<C extends Newable>(
    type: C,
    deps: DepsFor<ConstructorParameters<C>>,
    configuration?: Omit<IInjectionConfiguration<C>, 'deps'>,
): C {
    getRootInjector().register(type, { ...configuration, deps } as unknown as IInjectionConfiguration);
    return type;
}
