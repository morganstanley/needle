import {
    IFactoryParameterInjectionToken,
    IInjectionToken,
    ILazyParameterInjectionToken,
    IParameterInjectionToken,
    ITokenCache,
    StringOrSymbol,
} from '../contracts/contracts.js';
import { isConstructorParameterToken } from './guards.js';

/**
 * The injection token cache is used to store all uses of the @Inject annotation.
 */
export class InjectionTokensCache implements ITokenCache {
    private injectParameterTokens = new Map<any, IParameterInjectionToken[]>();
    private strategyParameterTokens = new Map<any, IParameterInjectionToken[]>();
    private factoryParameterTokens = new Map<any, IParameterInjectionToken[]>();
    private lazyParameterTokens = new Map<any, IParameterInjectionToken[]>();
    private optionalParameterTokens = new Map<any, IParameterInjectionToken[]>();
    // Fast reverse lookups.  Need to improve
    private typeToTokens = new Map<any, IInjectionToken[]>();
    private tokensToTypes = new Map<StringOrSymbol, any[]>();
    private strategyConsumers = new Map<StringOrSymbol, any[]>();

    public getInjectTokens(type: any): IParameterInjectionToken[] {
        return [...(this.injectParameterTokens.get(type) || [])];
    }

    public getStrategyTokens(type: any): IParameterInjectionToken[] {
        return [...(this.strategyParameterTokens.get(type) || [])];
    }

    public getFactoryTokens(type: any): IParameterInjectionToken[] {
        return [...(this.factoryParameterTokens.get(type) || [])];
    }

    public getLazyTokens(type: any): IParameterInjectionToken[] {
        return [...(this.lazyParameterTokens.get(type) || [])];
    }

    public getOptionalTokens(type: any): IParameterInjectionToken[] {
        return [...(this.optionalParameterTokens.get(type) || [])];
    }

    public getTokensForType(type: any): IInjectionToken[] {
        return [...(this.typeToTokens.get(type) || [])];
    }

    public getTypesForToken(token: StringOrSymbol): any[] {
        return [...(this.tokensToTypes.get(token) || [])];
    }

    public getStrategyConsumers(token: StringOrSymbol): any[] {
        return [...(this.strategyConsumers.get(token) || [])];
    }

    public getTypeForToken(token: StringOrSymbol): any | undefined {
        const types = this.tokensToTypes.get(token);
        return types == null || types.length === 0 ? undefined : types[types.length - 1];
    }

    public register(
        metadata:
            | IParameterInjectionToken
            | IInjectionToken
            | IFactoryParameterInjectionToken
            | ILazyParameterInjectionToken,
    ) {
        if (isConstructorParameterToken(metadata)) {
            this.registerParameterTokens(metadata);
        } else {
            this.registerTypeTokens(metadata);
        }
    }

    /**
     * Clears the token cache
     */
    public clear(): void {
        this.injectParameterTokens.clear();
        this.typeToTokens.clear();
        this.tokensToTypes.clear();
        this.strategyParameterTokens.clear();
        this.strategyConsumers.clear();
        this.factoryParameterTokens.clear();
        this.lazyParameterTokens.clear();
        this.optionalParameterTokens.clear();
    }

    /**
     * Registers all the types token information explicitly defined in @Injectable
     */
    private registerTypeTokens(metadata: IInjectionToken) {
        if (metadata.injectionType === 'singleton') {
            this.appendToMapArray(this.typeToTokens, metadata.owner, metadata);
            this.appendToMapArray(this.tokensToTypes, metadata.token, metadata.owner);
        } else if (metadata.injectionType === 'multiple') {
            this.appendToMapArray(this.strategyConsumers, metadata.token, metadata.owner);
        }
    }

    /**
     * Registers all the tokens used in a constructor such as @Inject, @Strategy, @Factory, @Lazy
     */
    private registerParameterTokens(metadata: IParameterInjectionToken) {
        if (metadata.injectionType === 'singleton') {
            this.appendToMapArray(this.injectParameterTokens, metadata.owner, metadata);
        } else if (metadata.injectionType === 'multiple') {
            this.appendToMapArray(this.strategyParameterTokens, metadata.owner, metadata);
        } else if (metadata.injectionType === 'factory') {
            this.appendToMapArray(this.factoryParameterTokens, metadata.owner, metadata);
        } else if (metadata.injectionType === 'lazy') {
            this.appendToMapArray(this.lazyParameterTokens, metadata.owner, metadata);
        } else if (metadata.injectionType === 'optional') {
            this.appendToMapArray(this.optionalParameterTokens, metadata.owner, metadata);
        }
    }

    private appendToMapArray<TKey, TValue>(map: Map<TKey, TValue[]>, key: TKey, value: TValue): void {
        const values = map.get(key);
        if (values == null) {
            map.set(key, [value]);
            return;
        }

        values.push(value);
    }
}
