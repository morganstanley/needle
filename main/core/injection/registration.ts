import {
    IExternalResolutionConfiguration,
    IInjectionConfiguration,
    IInjectionToken,
    ITokenCache,
    IConfiguration,
    StringOrSymbol,
} from '../../contracts/contracts.js';
import { isExternalResolutionConfigurationLike, isStringOrSymbol } from '../guards.js';

/**
 * Makes a shallow copy of a registration config and normalises its resolution strategy.
 * The resolution strategy for a type can be either a config or a type. If just a type we auto convert to a config.
 */
export function normalizeRegistration(config: IInjectionConfiguration): IInjectionConfiguration {
    config = { ...config };
    const resolution = config.resolution;

    if (resolution != null && !isExternalResolutionConfigurationLike(resolution)) {
        config.resolution = {
            resolver: (_type, currentInjector, locals) => currentInjector.get(resolution, [], locals),
            cacheSyncing: true,
        } as IExternalResolutionConfiguration;
    }
    return config;
}

/**
 * Registers a multiple-injection token for a strategy
 */
export function registerStrategyToken(tokenCache: ITokenCache, type: any, strategy: StringOrSymbol | undefined): void {
    if (isStringOrSymbol(strategy)) {
        const token: IInjectionToken = { token: strategy, owner: type, injectionType: 'multiple' };
        tokenCache.register(token);
    }
}

/**
 * Registers singleton tokens for a type, enforcing token uniqueness when configured
 */
export function registerTypeTokens(
    tokenCache: ITokenCache,
    configuration: IConfiguration,
    type: any,
    tokens: Array<StringOrSymbol> = [],
): void {
    tokens
        .map((token) => ({ token, owner: type, injectionType: 'singleton' }) as IInjectionToken)
        .forEach((t) => {
            if (!configuration.allowDuplicateTokens) {
                const tokenTypes = tokenCache.getTypesForToken(t.token);
                if (tokenTypes.length > 0) {
                    throw new Error(
                        `Cannot register Type [${
                            (type as any).name
                        }] with token '${t.token.toString()}'. Duplicate token found for the following type [${tokenTypes
                            .map((tt) => tt.name)
                            .join(' -> ')}]`,
                    );
                }
            }

            tokenCache.register(t);
        });
}
