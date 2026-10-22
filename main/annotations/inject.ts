import { Newable, StringOrSymbol } from '../contracts/contracts.js';
import { getRootInjector } from '../core/util.functions.js';
import {
    assertInjectionTarget,
    createInjectionDecorator,
    IInjectionDecorator,
    resolveTarget,
} from './decorator-support.js';

/**
 * The @Inject annotation allows you inject an instance of a given type using a token instead of the prototype of the type
 *
 * Legacy decorators (constructor parameter):
 * @Injectable()
 * class Foo(@Inject('my-token') foo: Foo) {}
 *
 * Standard decorators (field / auto-accessor, a token or a registered type):
 * @Injectable()
 * class Foo { @Inject('my-token') accessor foo!: Foo; @Inject(Bar) accessor bar!: Bar; }
 */
export function Inject(token: StringOrSymbol | Newable): IInjectionDecorator {
    assertInjectionTarget(token, 'Inject');
    return createInjectionDecorator(
        'Inject',
        (target, property, index) => {
            if (typeof token === 'function') {
                throw new Error('@Inject on a constructor parameter requires a string or symbol token');
            }
            getRootInjector().tokenCache.register({
                token,
                owner: target,
                property: property as StringOrSymbol,
                index,
                injectionType: 'singleton',
            });
        },
        resolveTarget(token),
        token,
    );
}
