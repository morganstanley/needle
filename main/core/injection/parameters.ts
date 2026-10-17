import { NULL_VALUE, UNDEFINED_VALUE } from '../../constants/constants.js';
import {
    IInjectionConfiguration,
    IInjector,
    IParameterInjectionToken,
    ITokenCache,
    Newable,
} from '../../contracts/contracts.js';
import { AutoFactory } from '../factory.js';
import { isFactoryParameterToken, isLazyParameterToken } from '../guards.js';
import { LazyInstance } from '../lazy.js';

export interface IConstructorParamTokens {
    injectionParamTokens: IParameterInjectionToken[];
    strategyParamTokens: IParameterInjectionToken[];
    factoryParamTokens: IParameterInjectionToken[];
    lazyParamTokens: IParameterInjectionToken[];
    optionalParamTokens: IParameterInjectionToken[];
}

/**
 * Handles resolving the value for a given override value
 */
export function getOverrideValue(value: any): any {
    if (value === UNDEFINED_VALUE) {
        return undefined;
    } else if (value === NULL_VALUE) {
        return null;
    }
    return value;
}

/**
 * Gets strategy types (but takes hierarchy into account)
 */
export function getStrategiesTypes(injector: IInjector, strategyToken: IParameterInjectionToken) {
    const strategies: Array<[any, IInjectionConfiguration]> = [];
    injector.getRegistrations().forEach((config, type) => {
        if (config.strategy === strategyToken.token) {
            strategies.push([type, config]);
        }
    });

    return strategies;
}

/**
 * Resolves the strategies instances for the given strategy token
 */
export function tryGetStrategyParam(
    injector: IInjector,
    paramTokens: IParameterInjectionToken[],
    ancestors: any[],
    index: number,
): any[] | undefined {
    const strategyToken = paramTokens.find((ip) => ip.index === index);
    if (strategyToken != null) {
        return getStrategiesTypes(injector, strategyToken).map(([t]) => injector.get(t, ancestors));
    }
    return undefined;
}

/**
 * Attempts to resolve factory for given param
 * @param createFactoryImpl the function the factory uses to create instances (keeps the `this` pointer from being lost)
 */
export function tryGetFactoryParam(
    injector: IInjector,
    paramTokens: IParameterInjectionToken[],
    index: number,
    createFactoryImpl: ConstructorParameters<typeof AutoFactory<any>>[2],
) {
    const factoryToken = paramTokens.find((ip) => ip.index === index);
    if (factoryToken != null && isFactoryParameterToken(factoryToken)) {
        return new AutoFactory(factoryToken.factoryTarget as Newable, injector, createFactoryImpl);
    }
    return undefined;
}

/**
 * Resolves an lazy injectable for a given param
 */
export function tryGetLazyParam(injector: IInjector, paramTokens: IParameterInjectionToken[], index: number) {
    const lazyToken = paramTokens.find((ip) => ip.index === index);
    if (lazyToken != null && isLazyParameterToken(lazyToken)) {
        return new LazyInstance(() => injector.get(lazyToken.lazyTarget));
    }
    return undefined;
}

export function isOptionalParam(paramTokens: IParameterInjectionToken[], index: number): boolean {
    return paramTokens.some((ip) => ip.index === index);
}

/**
 * If we have an @Inject annotation we substitute the param type using the annotations token
 */
export function tryGetParamTypeFromToken(
    paramTokens: IParameterInjectionToken[],
    index: number,
    defaultType: any,
    tokenCache: ITokenCache,
) {
    const token = paramTokens.find((ip) => ip.index === index);
    return token != null ? tokenCache.getTypeForToken(token.token) : defaultType;
}

/**
 * Gets injection tokens for a given type (but takes hierarchy into account)
 */
export function getConstructorsParamTokens(injector: IInjector | undefined, type: any): IConstructorParamTokens {
    let injectionParamTokens = new Array<IParameterInjectionToken>();
    let strategyParamTokens = new Array<IParameterInjectionToken>();
    let factoryParamTokens = new Array<IParameterInjectionToken>();
    let lazyParamTokens = new Array<IParameterInjectionToken>();
    let optionalParamTokens = new Array<IParameterInjectionToken>();
    let emptyTokens = true;

    /*
     * We will start walking up the tree moving to the root injector to see if we can find tokens at
     * any level.  Note, token found at the lowest level override the parents.
     */
    while (injector != null && emptyTokens) {
        injectionParamTokens =
            injectionParamTokens.length === 0 ? injector.tokenCache.getInjectTokens(type) : injectionParamTokens;
        optionalParamTokens =
            optionalParamTokens.length === 0 ? injector.tokenCache.getOptionalTokens(type) : optionalParamTokens;
        strategyParamTokens =
            strategyParamTokens.length === 0 ? injector.tokenCache.getStrategyTokens(type) : strategyParamTokens;
        factoryParamTokens =
            factoryParamTokens.length === 0 ? injector.tokenCache.getFactoryTokens(type) : factoryParamTokens;
        lazyParamTokens = lazyParamTokens.length === 0 ? injector.tokenCache.getLazyTokens(type) : lazyParamTokens;

        injector = injector.parent;
        emptyTokens =
            injectionParamTokens.length === 0 ||
            strategyParamTokens.length === 0 ||
            factoryParamTokens.length === 0 ||
            lazyParamTokens.length === 0;
    }

    return { injectionParamTokens, strategyParamTokens, factoryParamTokens, lazyParamTokens, optionalParamTokens };
}
