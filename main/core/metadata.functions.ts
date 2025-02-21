import { getRootInjector } from './util.functions';

/* Consumers must import the "reflect-metadata" polyfill. */
declare const Reflect: any;

/**
 * Gets an array of types defined in a types constructor
 */
export function getConstructorTypes<T = unknown>(constr: T): any[] {
    const registration = getRootInjector().getRegistrationForType(constr);
    if (registration != null && registration.metadata != null) {
        return registration.metadata;
    } else if (Reflect != null) {
        return Reflect.getMetadata('design:paramtypes', constr) || [];
    }

    return [];
}
