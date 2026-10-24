import { Newable } from '../contracts/contracts.js';
import { getRootInjector } from '../core/util.functions.js';
import { generateUUID } from '../core/uuid.js';
import { createInjectionDecorator, IInjectionDecorator, resolveFactory } from './decorator-support.js';

/**
 * The @Factory annotation allows you inject a AutoFactory<T> into a given parameter.
 *
 * constructor(@Factory(MyFactoryType) myfactory: AutoFactory<MyFactoryType>){
 *  const instance = myfactory.create();
 * }
 *
 * Also usable on a standard field / accessor: @Factory(MyFactoryType) accessor myFactory!: AutoFactory<MyFactoryType>;
 */
export function Factory(factoryTarget: Newable): IInjectionDecorator {
    return createInjectionDecorator(
        'Factory',
        (owner, property, index) => {
            getRootInjector().tokenCache.register({
                token: `factory_${generateUUID()}`, // We can auto generate a token for factories.
                owner,
                factoryTarget,
                property: property as string | symbol,
                index,
                injectionType: 'factory',
            });
        },
        resolveFactory(factoryTarget),
    );
}
