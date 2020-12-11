import {
    IFactoryParameterInjectionToken,
    IInjectionToken,
    ILazyParameterInjectionToken,
    IParameterInjectionToken,
    ITokenCache,
} from '../contracts/contracts';
import { isConstructorParameterToken } from './guards';

/**
 * The injection token cache is used to store all uses of the @Inject annotation.
 */
export class InjectionTokensCache implements ITokenCache {
    private injectParameterTokens = new Map<any, IParameterInjectionToken[]>();
    private strategyParameterTokens = new Map<any, IParameterInjectionToken[]>();
    private factoryParameterTokens = new Map<any, IParameterInjectionToken[]>();
    private lazyParameterTokens = new Map<any, IParameterInjectionToken[]>();
    // Fast reverse lookups.  Need to improve
    private typeToTokens = new Map<any, IInjectionToken[]>();
    private tokensToTypes = new Map<string, any[]>();
    private strategyConsumers = new Map<string, any[]>();

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
    public getTokensForType(type: any): IInjectionToken[] {
        return [...(this.typeToTokens.get(type) || [])];
    }

    public getTypesForToken(token: string): any[] {
        return [...(this.tokensToTypes.get(token) || [])];
    }

    public getStrategyConsumers(token: string): any[] {
        return [...(this.strategyConsumers.get(token) || [])];
    }

    public getTypeForToken(token: string): any | undefined {
        return this.getTypesForToken(token).pop();
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
    }

    /**
     * Registers all the types token information explicitly defined in @Injectable
     */
    private registerTypeTokens(metadata: IInjectionToken) {
        if (metadata.tokenType === 'singleton') {
            // Update the lookup for tokens -> types
            this.typeToTokens.set(metadata.owner, [...this.getTokensForType(metadata.owner), metadata]);
            // Update the reverse lookup for types -> token
            this.tokensToTypes.set(metadata.token, [...this.getTypesForToken(metadata.token), metadata.owner]);
        } else if (metadata.tokenType === 'multiple') {
            this.strategyConsumers.set(metadata.token, [
                ...this.getStrategyConsumers(metadata.token),
                [metadata.owner],
            ]);
        }
    }

    /**
     * Registers all the tokens used in a constructor such as @Inject, @Strategy, @Factory, @Lazy
     */
    private registerParameterTokens(metadata: IParameterInjectionToken) {
        if (metadata.tokenType === 'singleton') {
            this.injectParameterTokens.set(metadata.owner, [...this.getInjectTokens(metadata.owner), metadata]);
        } else if (metadata.tokenType === 'multiple') {
            this.strategyParameterTokens.set(metadata.owner, [...this.getStrategyTokens(metadata.owner), metadata]);
        } else if (metadata.tokenType === 'factory') {
            this.factoryParameterTokens.set(metadata.owner, [...this.getFactoryTokens(metadata.owner), metadata]);
        } else if (metadata.tokenType === 'lazy') {
            this.lazyParameterTokens.set(metadata.owner, [...this.getLazyTokens(metadata.owner), metadata]);
        }
    }
}
