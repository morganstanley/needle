import { StringOrSymbol } from '../contracts/contracts';
import { getRootInjector } from '../core/util.functions';

/**
 * The @Inject annotation allows you inject an instance of a given type using a token instead of the prototype of the type
 *
 * @Injectable()
 * class Foo(@Inject('my-token') foo: Foo) {}
 */
export function Inject(token: StringOrSymbol) {
    // the original decorator
    function inject(target: any, property: string | symbol | undefined, index: number): void {
        getRootInjector().tokenCache.register({
            token,
            owner: target,
            property,
            index,
            injectionType: 'singleton',
        });
    }

    // return the decorator
    return inject;
}
