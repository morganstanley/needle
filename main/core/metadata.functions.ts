/* Consumers must import the "reflect-metadata" polyfill. */
declare const Reflect: any;

/**
 * Gets an array of types defined in a types constructor
 */
export function getConstructorTypes<T = unknown>(constr: T): any[] {
    return Reflect.getMetadata('design:paramtypes', constr) || [];
}
