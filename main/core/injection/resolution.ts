import { DI_ROOT_INJECTOR_KEY, INJECTOR_TYPE_ID, TYPE_NOT_FOUND } from '../../constants/constants.js';
import {
    IConstructionOptions,
    IInjectionConfiguration,
    IInjector,
    InstanceOfType,
    Newable,
    StringOrSymbol,
} from '../../contracts/contracts.js';
import { getGlobal } from '../globals.js';
import { isBoxedValue, isStringOrSymbol } from '../guards.js';
import { getConstructorTypes } from '../metadata.functions.js';
import type { Injector } from '../injector.js';
import { createInterceptorContexts } from './interceptors.js';
import {
    getConstructorsParamTokens,
    getOverrideValue,
    isOptionalParam,
    tryGetFactoryParam,
    tryGetLazyParam,
    tryGetParamTypeFromToken,
    tryGetStrategyParam,
} from './parameters.js';
import { findInjectorForTypeOrToken } from './scoping.js';
import { IConstructionOptionsInternal } from './types.js';

function rootInjector(): IInjector {
    return getGlobal()[DI_ROOT_INJECTOR_KEY];
}

/**
 * Throws if the given injector has been destroyed
 */
export function assertNotDestroyed(self: Injector): void {
    if (self.isDestroyed()) {
        throw new Error(
            `Invalid operation, the current injector instance is marked as destroyed. Injector Id: [${self.id}]`,
        );
    }
}

/**
 * Throws the standard error for a type that cannot be constructed because nothing is registered for it
 */
export function throwRegistrationNotFound(constructorType: any, ancestry: any[]): never {
    throw new Error(
        `Cannot construct Type '${constructorType?.name}' with ancestry '${ancestry
            .map((ancestor) => ancestor?.name)
            .join(
                ' -> ',
            )}' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
    );
}

/**
 * Resolves an instance of a type (or token) from `self`, taking the scope hierarchy into account
 */
export function resolveInstance<T>(
    self: Injector,
    typeOrToken: T | StringOrSymbol,
    ancestry: any[] = [],
    options?: T extends Newable ? IConstructionOptionsInternal<T> : never,
): InstanceOfType<T> | undefined {
    assertNotDestroyed(self);

    // Measuring time taken
    const start = Date.now();
    let instance: any;

    const injector = findInjectorForTypeOrToken(self, typeOrToken, self);

    const constructorType: any = isStringOrSymbol(typeOrToken)
        ? injector.tokenCache.getTypeForToken(typeOrToken)
        : typeOrToken;

    const allowOptional = options != null && options.mode === 'optional';

    if (constructorType === undefined) {
        if (allowOptional) {
            return undefined;
        }
        throw new Error(
            isStringOrSymbol(typeOrToken)
                ? `Cannot resolve Type with token '${typeOrToken.toString()}' as no types have been registered against that token value`
                : `Cannot resolve Type '${
                      (typeOrToken as any)?.name
                  }' as no types have been registered against any injectors`,
        );
    }

    ancestry.push(constructorType);

    //We use a special Id (Guid) to determine if a type could be an injector type rather than fallible prototype comparison
    const isInjectorType = constructorType.typeId === INJECTOR_TYPE_ID;
    instance = isInjectorType ? self : injector.cache.resolve(constructorType);

    //Intrinsic types are boxed by default and primed in the cache.  If we have one lets unbox its value and use that
    if (isBoxedValue(instance)) {
        instance = instance.unbox();
    }

    // Not in cache so lets try and construct it
    if (instance == null) {
        const registration = injector.getRegistrationForType(constructorType);

        // Are we going to use the types resolution strategy over the external one
        const externalResolutionStrategy =
            registration != null && registration.resolution != null
                ? registration.resolution
                : self.configuration.externalResolutionStrategy;

        // If we have no registration for this type then throw error. (note @optional will allow this to pass)
        // (Possible if no injector was found and current one has no registration locally)
        if (!registration && !allowOptional && !externalResolutionStrategy) {
            throwRegistrationNotFound(constructorType, ancestry);
        }

        if (!allowOptional || registration || externalResolutionStrategy) {
            if (externalResolutionStrategy) {
                // If an external resolution strategy has been set, attempt to resolve the instance from there first.
                instance = externalResolutionStrategy.resolver(
                    constructorType,
                    injector, // Pass injector so resolver understands the current context (scope, cache etc)
                    ((options || {}) as any).params || [],
                );

                if (instance !== TYPE_NOT_FOUND && externalResolutionStrategy.cacheSyncing === true) {
                    // Sync cache if required
                    injector.cache.update(constructorType, instance, registration);
                }
            }

            // At this point either we have no external resolution or if we did it didn't want to handle it so we must now try
            if (instance === TYPE_NOT_FOUND || instance == null) {
                if (registration) {
                    instance = createInstance(
                        self,
                        constructorType,
                        true,
                        options as any,
                        ancestry,
                        injector,
                        registration,
                    );
                } else {
                    throwRegistrationNotFound(constructorType, ancestry);
                }
            }
        }
    }

    // Capture metrics on this types usage
    if (self.configuration.trackMetrics) {
        (injector.metrics as any).update(constructorType, undefined, Date.now() - start);
    }

    return instance;
}

/**
 * Used by AutoFactory (bound to the injector it was created from) to create new instances of a registered type
 */
export function createInstanceFactory<T extends Newable>(
    self: Injector,
    type: T,
    updateCache = false,
    options?: IConstructionOptionsInternal<T>,
    ancestors: any[] = [],
    injector: IInjector = rootInjector(),
) {
    const injectorForType = injector.getInjectorForTypeOrToken(injector, type);
    const registration = injectorForType.getRegistrationForType(type);
    if (registration == null) {
        throwRegistrationNotFound(type, ancestors);
    }
    return createInstance(self, type, updateCache, options, ancestors, injector, registration);
}

/**
 * Constructs a new instance of a type, resolving its constructor parameters and running interceptors
 */
export function createInstance<T extends new (...args: any[]) => any>(
    self: Injector,
    type: T,
    updateCache = false,
    options?: IConstructionOptionsInternal<T>,
    ancestors: any[] = [],
    injector: IInjector = rootInjector(),
    configuration?: IInjectionConfiguration,
): InstanceType<T> {
    // Do our base checks to see if we are exceeding our depth limits
    if (ancestors.length > injector.configuration.maxTreeDepth) {
        throw new Error(
            `Cannot construct Type '${(type as any)?.name}' with ancestry '${ancestors
                .map((ancestor) => ancestor?.name)
                .join(' -> ')}' as max tree depth has been reached`,
        );
    }

    const overrideParams = (options || {}).params || [];
    const constructorParamTypes = getConstructorTypes(type);
    // Note this call to construct param values introduces recursive behavior
    const constructorParamValues = getConstructorParamValues<T>(
        self,
        constructorParamTypes,
        overrideParams,
        injector,
        ancestors,
        type,
    );

    // Construct our interceptor contexts (If we have some registered)
    const interceptorContexts = createInterceptorContexts(self, injector, type, constructorParamValues);

    // Trigger before interceptors
    interceptorContexts.forEach((context) => context.interceptor.beforeCreate(context));

    const instance: any = new type(...constructorParamValues);

    // Trigger after interceptors
    interceptorContexts.forEach((context) => context.interceptor.afterCreate(instance, context));

    if (updateCache) {
        injector.cache.update(type, instance, configuration);
    }

    return instance;
}

/**
 * Resolves all the constructor args values taking into account the tokens
 */
function getConstructorParamValues<T extends new (...args: any[]) => any>(
    self: Injector,
    constructorParamTypes: any[],
    overrideParams: Partial<ConstructorParameters<T>> | never[],
    injector: IInjector,
    ancestors: any[],
    type: T,
) {
    if (constructorParamTypes.length === 0) {
        return [];
    }

    // These tokens are constructor parameter tokens
    const { injectionParamTokens, strategyParamTokens, factoryParamTokens, lazyParamTokens, optionalParamTokens } =
        getConstructorsParamTokens(injector, type);

    return constructorParamTypes.map((paramType, index) => {
        const paramInjector = findInjectorForTypeOrToken(injector, paramType, self);

        // Have they provided a value, if they have use it, if its undefined (Not explicit NULL_VALUE or UNDEFINED_VALUE) construct using the type
        const value = overrideParams[index];
        if (value != null) {
            return getOverrideValue(value);
        }

        // Handle @Strategy
        const strategies = tryGetStrategyParam(injector, strategyParamTokens, ancestors, index);
        if (strategies != null) {
            return strategies;
        }

        // Handle @Factory (the arrow keeps the `this` pointer from being lost)
        const factory = tryGetFactoryParam(
            paramInjector,
            factoryParamTokens,
            index,
            (s: any, m: boolean, i?: IConstructionOptions<any>, l?: Array<any>, e?: IInjector) =>
                createInstanceFactory(self, s, m, i, l, e),
        );
        if (factory) {
            return factory;
        }

        // Handle @Lazy
        const lazy = tryGetLazyParam(paramInjector, lazyParamTokens, index);
        if (lazy) {
            return lazy;
        }

        paramType = tryGetParamTypeFromToken(injectionParamTokens, index, paramType, paramInjector.tokenCache);
        const optional = isOptionalParam(optionalParamTokens, index);

        let instance =
            paramInjector.cache.resolve(paramType) ??
            resolveInstance(paramInjector, paramType, ancestors, {
                mode: optional ? 'optional' : 'standard',
            } as any);

        if (isBoxedValue(instance)) {
            instance = instance.unbox();
        }

        return instance;
    });
}
