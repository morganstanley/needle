import { v4 as uuid } from 'uuid';
import { Newable } from '../contracts/contracts';
import { getRootInjector } from '../core/util.functions';

/**
 * The @Lazy annotation allows you inject a Lazy<T> into a given parameter.
 *
 * constructor(@Lazy(MyInjectableType) myLazy: LazyInstance<MyInjectableType>){
 *  const instance = lazy.value;
 * }
 */
export function Lazy(lazyTarget: Newable) {
    // the original decorator
    function lazy(target: any, property: string | symbol | undefined, index: number): void {
        getRootInjector().tokenCache.register({
            token: `lazy_${uuid()}`, // We can auto generate a token for lazy.
            owner: target,
            lazyTarget,
            property,
            index,
            tokenType: 'lazy',
        });
    }

    // return the decorator
    return lazy;
}
