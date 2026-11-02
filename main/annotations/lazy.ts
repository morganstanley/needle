import { generateUUID } from '../core/uuid.js';
import { Newable } from '../contracts/contracts.js';
import { getRootInjector } from '../core/util.functions.js';
import { createInjectionDecorator, IInjectionDecorator, resolveLazy } from './decorator-support.js';

/**
 * The @Lazy annotation allows you inject a Lazy<T> into a given parameter.
 *
 * constructor(@Lazy(MyInjectableType) myLazy: LazyInstance<MyInjectableType>){
 *  const instance = lazy.value;
 * }
 *
 * Also usable on a standard field / accessor: @Lazy(MyInjectableType) accessor myLazy!: LazyInstance<MyInjectableType>;
 */
export function Lazy(lazyTarget: Newable): IInjectionDecorator {
    return createInjectionDecorator(
        'Lazy',
        (owner, property, index) => {
            getRootInjector().tokenCache.register({
                token: `lazy_${generateUUID()}`, // We can auto generate a token for lazy.
                owner,
                lazyTarget,
                property: property as string | symbol,
                index,
                injectionType: 'lazy',
            });
        },
        resolveLazy(lazyTarget),
    );
}
