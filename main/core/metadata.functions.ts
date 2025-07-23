import { getRootInjector } from './util.functions';

/* Consumers must import the "reflect-metadata" polyfill. */
declare const Reflect: any;

/**
 * Gets an array of types defined in a types constructor
 */
export function getConstructorTypes<T = unknown>(constr: T): any[] {
    const registration = getRootInjector().getRegistrationForType(constr);
    const metadataModel = getRootInjector().configuration.metadataMode;
    switch (metadataModel) {
        case 'explicit':
            return registration?.metadata ?? [];
        case 'reflection':
            return Reflect?.getMetadata('design:paramtypes', constr) || [];
        case 'both':
            return registration?.metadata ?? Reflect?.getMetadata('design:paramtypes', constr) ?? [];
        default:
            return [];
    }
}
