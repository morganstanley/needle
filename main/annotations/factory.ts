import { v4 as uuid } from 'uuid';
import { Newable } from '../contracts/contracts';
import { getRootInjector } from '../core/util.functions';

/**
 * The @Factory annotation allows you inject a AutoFactory<T> into a given parameter.
 *
 * constructor(@Factory(MyFactoryType) myfactory: AutoFactory<MyFactoryType>){
 *  const instance = myfactory.create();
 * }
 */
export function Factory(factoryTarget: Newable) {
    // the original decorator
    function factory(target: any, property: string | symbol | undefined, index: number): void {
        getRootInjector().tokenCache.register({
            token: `factory_${uuid()}`, // We can auto generate a token for factories.
            owner: target,
            factoryTarget,
            property,
            index,
            injectionType: 'factory',
        });
    }

    // return the decorator
    return factory;
}
