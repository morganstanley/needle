import {
    IFactoryParameterInjectionToken,
    IInjectionToken,
    IInjector,
    ILazyParameterInjectionToken,
    IParameterInjectionToken,
} from '../contracts/contracts';

/**
 * Determines if the given type is an IInjectionTokenParameter
 * @param item
 */
export function isConstructorParameterToken(
    item: IInjectionToken | IParameterInjectionToken,
): item is IParameterInjectionToken {
    return (
        (item as IParameterInjectionToken).property !== undefined ||
        (item as IParameterInjectionToken).index !== undefined
    );
}

/**
 * Determines if the given type is an IFactoryParameterInjectionToken
 * @param item
 */
export function isFactoryParameterToken(
    item: IInjectionToken | IFactoryParameterInjectionToken,
): item is IFactoryParameterInjectionToken {
    return isConstructorParameterToken(item) && item.factoryTarget != null;
}

/**
 * Determines if the given type is a ILazyParameterInjectionToken
 * @param item
 */
export function isLazyParameterToken(
    item: IInjectionToken | ILazyParameterInjectionToken,
): item is ILazyParameterInjectionToken {
    return isConstructorParameterToken(item) && item.lazyTarget != null;
}

/**
 * Determines if a `thing` is injector like in its appearance.
 */
export function isInjectorLike(thing: any): thing is IInjector {
    return (
        thing != null &&
        thing.cache != null &&
        thing.configuration != null &&
        thing.getStrategies != null &&
        thing.registerInstance != null &&
        thing.tokenCache != null &&
        thing.register != null &&
        thing.registerParamForFactoryInjection != null
    );
}
