import type { Injector } from '../injector.js';
import { IConstructionInterceptor, IInjector } from '../../contracts/contracts.js';

/**
 * Adds an interceptor to the given registry (always the root injector's), ignoring duplicates.
 */
export function addInterceptor(
    registry: Map<unknown, IConstructionInterceptor[]>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic type, cannot be narrowed without breaking callers
    interceptor: IConstructionInterceptor<any>,
): void {
    let interceptors = registry.get(interceptor.target);
    if (interceptors == null) {
        interceptors = [];
        registry.set(interceptor.target, interceptors);
    }

    // Avoid duplicate instances being registered
    if (interceptors.indexOf(interceptor) === -1) {
        interceptors.push(interceptor);
    }
}

/**
 * Builds the contexts passed to each interceptor registered against `type`
 */
export function createInterceptorContexts(
    owner: Injector,
    scope: IInjector,
    type: unknown,
    constructorArgs: unknown[],
) {
    return (owner.getInterceptorsForType(type) || [])
        .filter((interceptor) => interceptor.target === type)
        .map((interceptor) => ({
            interceptor,
            configuration: scope.getRegistrationForType(type)!,
            constructorArgs,
            injector: scope,
            type,
        }));
}
