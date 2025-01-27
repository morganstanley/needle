import { IInjectionConfiguration } from '../contracts/contracts';
import { getRootInjector } from '../core/util.functions';

/**
 * This is the core decorator for all injectables
 *
 * @Injectable()
 * class Foo{}
 *
 * @Injectable({tokens: ['bar']})
 * class Foo{}
 *
 * @Injectable({strategy: 'strategy-name'})
 * class Foo{}
 *
 * @param configuration
 */
export function Injectable<T>(configuration?: IInjectionConfiguration<T>) {
    return (type: T) => {
        getRootInjector().register(type, configuration);
    };
}
