import { NewableConstructorInterceptor } from '../contracts/contracts.js';
import { getRootInjector } from '../core/util.functions.js';
import { IStandardDecoratorContext } from './decorator-support.js';

/**
 * This decorator can be used to register interceptors (legacy or standard class decorator)
 *
 * @Interceptor()
 * class ConstructorInterceptor{}
 */
export function Interceptor() {
    return (interceptor: NewableConstructorInterceptor, _context?: IStandardDecoratorContext): void => {
        getRootInjector().register(interceptor).registerInterceptor(getRootInjector().get(interceptor));
    };
}
