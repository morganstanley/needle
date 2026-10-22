import type { IInjector, Newable, StringOrSymbol } from '../contracts/contracts.js';
import { getConstructingInjector, getConstructionPath } from '../core/injection/construction-context.js';
import { MaxDepthExceededError } from '../core/errors.js';
import { getStrategiesTypes } from '../core/injection/parameters.js';
import { isStringOrSymbol } from '../core/guards.js';
import { getRootInjector } from '../core/util.functions.js';

/**
 * The subset of a TC39 decorator context object that Needle looks at.
 * (Declared structurally so the library compiles with or without `lib.decorators.d.ts` features.)
 */
export interface IStandardDecoratorContext {
    kind: 'class' | 'method' | 'getter' | 'setter' | 'field' | 'accessor';
    name: string | symbol | undefined;
    static?: boolean;
    private?: boolean;
    addInitializer?(initializer: () => void): void;
}

/**
 * True when a decorator was invoked the standard (TC39) way, i.e. its second argument is a context object.
 * Legacy decorators receive `(target, propertyKey | undefined, parameterIndex | descriptor)`, whose second
 * argument is never an object, so the check is unambiguous.
 */
export function isStandardContext(value: unknown): value is IStandardDecoratorContext {
    return value != null && typeof value === 'object' && typeof (value as { kind?: unknown }).kind === 'string';
}

/**
 * Something a field/accessor can be injected with: a registered type or a token
 */
export type InjectionTarget = Newable | StringOrSymbol;

/**
 * Describes how to produce the value for a field/accessor given the injector that is constructing the instance
 */
export type FieldResolver = (injector: IInjector) => unknown;

export const resolveTarget =
    (target: InjectionTarget): FieldResolver =>
    (injector) =>
        injector.get(target as never);

export const resolveOptional =
    (target: InjectionTarget): FieldResolver =>
    (injector) =>
        injector.getOptional(target as never);

export const resolveLazy =
    (target: InjectionTarget): FieldResolver =>
    (injector) =>
        injector.getLazy(target as never);

export const resolveFactory =
    (target: Newable): FieldResolver =>
    (injector) =>
        injector.getFactory(target);

export const resolveStrategy =
    (strategy: StringOrSymbol): FieldResolver =>
    (injector) =>
        getStrategiesTypes(injector, { token: strategy } as never).map(([type]) => injector.get(type as never));

const PENDING = Symbol('needle.pending');

/**
 * Guards eager field injection against cycles. Field initialisers run inside `new A()`, before A is cached, so
 * `A -> field B -> field A` would otherwise recurse until the stack overflows. Throws `MaxDepthExceededError` with
 * the resolution path when the target is already being constructed or the construction stack is too deep.
 */
function assertNoFieldCycle(injector: IInjector, target: InjectionTarget): void {
    const path = getConstructionPath();
    if (path.length === 0) {
        return;
    }
    const type = isStringOrSymbol(target) ? injector.tokenCache?.getTypeForToken(target) : target;
    const name = (t: unknown) => (typeof t === 'function' ? t.name : String(t));
    if ((type !== undefined && path.includes(type)) || path.length > injector.configuration.maxTreeDepth) {
        throw new MaxDepthExceededError(name(type ?? target), [...path, type ?? target]);
    }
}

/**
 * Builds the standard decorator for a field (`@X() foo`) or auto-accessor (`@X() accessor foo`).
 *
 * - field:    resolved eagerly when the instance's fields are initialised.
 * - accessor: resolved lazily on first read (so cycles and optional dependencies behave), using the injector that
 *             was constructing the instance (falling back to the root injector for `new Foo()`).
 */
export function createStandardMemberDecorator(describe: string, resolver: FieldResolver, target?: InjectionTarget) {
    const injectors = new WeakMap<object, IInjector>();
    const injectorFor = (instance: object) => injectors.get(instance) ?? getRootInjector();

    const injectionTarget = target;
    return (decorated: unknown, context: IStandardDecoratorContext): unknown => {
        if (context.static) {
            throw new Error(`@${describe} cannot be applied to static members`);
        }
        switch (context.kind) {
            case 'field':
                return function (this: object, initial: unknown) {
                    if (initial !== undefined) {
                        return initial;
                    }
                    const injector = getConstructingInjector() ?? getRootInjector();
                    if (injectionTarget !== undefined) {
                        assertNoFieldCycle(injector, injectionTarget);
                    }
                    return resolver(injector);
                };
            case 'accessor': {
                const accessor = decorated as { get(this: object): unknown; set(this: object, v: unknown): void };
                return {
                    init(this: object, initial: unknown) {
                        injectors.set(this, getConstructingInjector() ?? getRootInjector());
                        return initial !== undefined ? initial : PENDING;
                    },
                    get(this: object) {
                        const current = accessor.get.call(this);
                        if (current === PENDING) {
                            const value = resolver(injectorFor(this));
                            accessor.set.call(this, value);
                            return value;
                        }
                        return current;
                    },
                };
            }
            default:
                throw new Error(`@${describe} can only decorate fields and accessors (got ${context.kind})`);
        }
    };
}

export function assertInjectionTarget(target: unknown, decorator: string): asserts target is InjectionTarget {
    if (!isStringOrSymbol(target) && typeof target !== 'function') {
        throw new Error(`@${decorator} requires a token (string | symbol) or a registered type`);
    }
}

/**
 * A decorator usable as a legacy constructor-parameter decorator AND as a standard field / accessor decorator
 */
export interface IInjectionDecorator {
    /** legacy (`experimentalDecorators`) constructor parameter */
    (target: unknown, property: string | symbol | undefined, index: number): void;
    /** standard auto-accessor */
    <This extends object, Value>(
        target: ClassAccessorDecoratorTarget<This, Value>,
        context: ClassAccessorDecoratorContext<This, Value>,
    ): ClassAccessorDecoratorResult<This, Value>;
    /** standard field */
    <This extends object, Value>(
        target: undefined,
        context: ClassFieldDecoratorContext<This, Value>,
    ): (this: This, value: Value) => Value;
}

/**
 * Builds a decorator that dispatches on how it was invoked.
 * @param describe name used in error messages
 * @param registerLegacyParameter registers the constructor parameter metadata (legacy path, or programmatic use)
 * @param resolver how to produce the value for a standard field/accessor
 * @param cycleTarget for eagerly-resolved targets (`@Inject`, `@Optional`): checked for field-injection cycles
 */
export function createInjectionDecorator(
    describe: string,
    registerLegacyParameter: (owner: unknown, property: string | symbol | undefined, index: number) => void,
    resolver: FieldResolver | undefined,
    cycleTarget?: InjectionTarget,
): IInjectionDecorator {
    const member = resolver ? createStandardMemberDecorator(describe, resolver, cycleTarget) : undefined;
    return ((target: unknown, propertyOrContext: unknown, index?: number) => {
        if (isStandardContext(propertyOrContext)) {
            if (!member) {
                throw new Error(
                    `@${describe} needs a target type when used on a field or accessor, e.g. @${describe}(MyType)`,
                );
            }
            return member(target, propertyOrContext);
        }
        registerLegacyParameter(target, propertyOrContext as string | symbol | undefined, index as number);
        return undefined;
    }) as IInjectionDecorator;
}
