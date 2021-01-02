import { DI_ROOT_INJECTOR_KEY } from '../constants/constants';
import { IConstructionOptions, IInjector, Newable } from '../contracts/contracts';
import { getGlobal } from './globals';

const globalReference = getGlobal();
/**
 * Gets the root injector
 */
export function getRootInjector(): IInjector {
    return globalReference[DI_ROOT_INJECTOR_KEY];
}

/**
 * Gets an instance of a given type either from cache or constructing the type and placing into the cache.
 * @param type
 * @param ancestry
 * @param options
 */
export function get<T extends Newable>(
    type: T,
    ancestry: any[] = [],
    options?: IConstructionOptions<T>,
): InstanceType<T> {
    return getRootInjector().get(type, ancestry, options);
}

/***
 * Gets an instance of a type or returns undefined if no registration
 * @param type The type to be resolved
 */
export function getOptional<T extends Newable>(type: T): InstanceType<T> | undefined {
    return getRootInjector().getOptional(type);
}

/***
 * Gets a function which when invoked will return the injectable instance
 */
export function getLazy<T extends Newable>(
    type: T,
    ancestry: any[] = [],
    options?: IConstructionOptions<T>,
): () => InstanceType<T> {
    return () => get(type, ancestry, options);
}

/**
 * Returns an Array of the all types registered in the container
 */
export function getRegisteredTypes(): Array<any> {
    return getRootInjector().getRegisteredTypes();
}

/**
 * Returns an array of all the types registered in the container with associated constructor dependencies
 */
export function getRegisteredTypesWithDependencies() {
    return getRootInjector().getRegisteredTypesWithDependencies();
}
