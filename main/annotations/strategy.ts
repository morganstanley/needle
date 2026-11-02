import { StringOrSymbol } from '../contracts/contracts.js';
import { getRootInjector } from '../core/util.functions.js';
import { createInjectionDecorator, IInjectionDecorator, resolveStrategy } from './decorator-support.js';

/**
 * The @Strategy annotation allows you inject an array of strategy types registered against the given key
 * (constructor parameter in legacy mode, field / accessor in standard mode)
 */
export function Strategy(strategyName: StringOrSymbol): IInjectionDecorator {
    return createInjectionDecorator(
        'Strategy',
        (owner, property, index) => {
            getRootInjector().tokenCache.register({
                token: strategyName,
                owner,
                property: property as string | symbol,
                index,
                injectionType: 'multiple',
            });
        },
        resolveStrategy(strategyName),
    );
}
