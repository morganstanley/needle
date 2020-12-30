import { getRootInjector } from '../core/util.functions';

/**
 * This decorator can be used to register interceptors
 *
 * @Interceptor()
 * class ConstructorInterceptor{}
 */
export function Interceptor() {
    return (interceptor: any) => {
        getRootInjector().registerInterceptor(interceptor);
    };
}
