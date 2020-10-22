import { getRootInjector } from '../core/util.functions';

/**
 * The @Inject annotation allows you inject an instance of a given type using a token instead of the prototype of the type
 *
 * @Injectable()
 * class Foo(@Inject('my-token') foo: Foo) {}
 */
export function Inject(token: string) {
    // the original decorator
    function inject(target: any, property: string | symbol | undefined, index: number): void {
        getRootInjector().tokenCache.register({
            token,
            owner: target,
            property,
            index,
            tokenType: 'singleton',
        });
    }

    // return the decorator
    return inject;
}
