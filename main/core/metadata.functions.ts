import { getRootInjector } from './util.functions.js';

/* Consumers must import the "reflect-metadata" polyfill. */
declare const Reflect: any;

/**
 * Gets an array of types defined in a types constructor
 */
export function getConstructorTypes<T = unknown>(constr: T): any[] {
    const rootInjector = getRootInjector();
    const registration = rootInjector.getRegistrationForType(constr);
    const metadataModel = rootInjector.configuration.metadataMode;
    switch (metadataModel) {
        case 'explicit':
            return registration?.metadata ?? [];
        case 'reflection':
            return Reflect?.getMetadata?.('design:paramtypes', constr) || [];
        case 'both':
            return registration?.metadata ?? Reflect?.getMetadata?.('design:paramtypes', constr) ?? [];
        default:
            return [];
    }
}
