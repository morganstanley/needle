import { NewableConstructorInterceptor } from '../contracts/contracts.js';
import { getRootInjector } from '../core/util.functions.js';

/**
 * This decorator can be used to register interceptors
 *
 * @Interceptor()
 * class ConstructorInterceptor{}
 */
export function Interceptor() {
    return (interceptor: NewableConstructorInterceptor) => {
        getRootInjector()
            .register(interceptor)
            .registerInterceptor(getRootInjector().get(interceptor));
    };
}
