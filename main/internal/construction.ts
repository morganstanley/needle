import { DI_ROOT_INJECTOR_KEY, INJECTOR_TYPE_ID } from '../constants/constants';
import { IConstructionOptions, IInjector } from '../contracts/contracts';
import { AutoFactory } from '../core/factory';
import { getGlobal } from '../core/globals';
import { isFactoryParameterToken, isLazyParameterToken } from '../core/guards';
import { LazyInstance } from '../core/lazy';
import { getConstructorTypes } from '../core/metadata.functions';

const globalReference = getGlobal();

/**
 * @internal Core universal construction function. Internal implementation do not expose
 */
export function createInstance<T extends new (...args: any[]) => any>(
    type: T,
    updateCache: boolean = false,
    options?: IConstructionOptions<T>,
    ancestors?: any[],
    injector: IInjector = globalReference[DI_ROOT_INJECTOR_KEY],
): InstanceType<T> {
    const familyTree = ancestors || [];
    familyTree.push(type);

    if (!injector.configuration.constructUndecoratedTypes && injector.getRegistrations().get(type) === undefined) {
        throw new Error(
            `Cannot construct Type '${(type as any).name}' with ancestry '${familyTree
                .map(ancestor => ancestor.name)
                .join(
                    ' -> ',
                )}' the type is either not decorated with @Injectable or injector.register was not called for the type and configuration has constructUndecoratedTypes set to false`,
        );
    }

    if (familyTree.length > injector.configuration.maxTreeDepth) {
        throw new Error(
            `Cannot construct Type '${(type as any).name}' with ancestry '${familyTree
                .map(ancestor => ancestor.name)
                .join(' -> ')}' as too many levels deep`,
        );
    }

    let instance: any;
    // If we have add profiled values for the constructor args use those then resolve the remainder
    const optional = (options || {}).params || [];
    const constructorParamTypes = getConstructorTypes(type);
    // These tokens are constructor parameter tokens
    const { injectionParamTokens, strategyParamTokens, factoryParamTokens, lazyParamTokens } = getTokenTypes(
        injector,
        type,
    );
    const constructorParams = constructorParamTypes.map((paramType, index) => {
        // Have they provided a value, if they have use it, if its undefined construct using the type
        const value = optional[index];
        if (value != null) {
            return value;
        }

        // If its an injector being injected then return the instance of the current injector scope for the param value
        if (paramType.typeId === INJECTOR_TYPE_ID) {
            return injector;
        }

        const token = injectionParamTokens[injectionParamTokens.findIndex(ip => ip.index === index)];
        if (token != null) {
            paramType = injector.tokenCache.getTypeForToken(token.token);
        }
        // Handle @Strategy
        const strategyToken = strategyParamTokens[strategyParamTokens.findIndex(ip => ip.index === index)];
        if (strategyToken != null) {
            const strategies = [...injector.getRegistrations().entries()]
                .filter(([_t, config]) => config.strategy === strategyToken.token)
                .map(([t]) => injector.get(t, ancestors));
            return strategies;
        }

        // Handle @Factory
        const factoryToken = factoryParamTokens[factoryParamTokens.findIndex(ip => ip.index === index)];
        if (factoryToken != null && isFactoryParameterToken(factoryToken)) {
            return new AutoFactory(factoryToken.factoryTarget, injector, createInstance);
        }

        // Handle @Lazy
        const lazyToken = lazyParamTokens[lazyParamTokens.findIndex(ip => ip.index === index)];
        if (lazyToken != null && isLazyParameterToken(lazyToken)) {
            return new LazyInstance(() => injector.get(lazyToken.lazyTarget));
        }

        if (paramType == null) {
            throw new Error(
                `Cannot construct class '${(type as any).name}' with ancestry '${familyTree
                    .map(ancestor => ancestor.name)
                    .join(' -> ')}' as constructor param is ${paramType}`,
            );
        }

        return injector.cache.resolve(paramType) || createInstance(paramType, true, undefined, ancestors, injector);
    });

    instance = new type(...constructorParams);

    if (updateCache) {
        injector.cache.update(type, instance);
    }

    return instance;
}

function getTokenTypes(injector: IInjector, type: any) {
    const injectionParamTokens = injector.tokenCache.getInjectTokens(type);
    const strategyParamTokens = injector.tokenCache.getStrategyTokens(type);
    const factoryParamTokens = injector.tokenCache.getFactoryTokens(type);
    const lazyParamTokens = injector.tokenCache.getLazyTokens(type);
    return { injectionParamTokens, strategyParamTokens, factoryParamTokens, lazyParamTokens };
}
