import { getRootInjector } from '../core/util.functions';

/**
 * The @Strategy annotation allows you inject an array of strategy types registered against the given key
 */
export function Strategy(strategyName: string) {
    // the original decorator
    function strategy(target: any, property: string | symbol | undefined, index: number): void {
        getRootInjector().tokenCache.register({
            token: strategyName,
            owner: target,
            property,
            index,
            tokenType: 'multiple',
        });
    }

    // return the decorator
    return strategy;
}
