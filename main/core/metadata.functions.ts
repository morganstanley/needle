import { Newable } from '../contracts/contracts.js';
import { getRootInjector } from './util.functions.js';

/* Consumers must import the "reflect-metadata" polyfill. */
declare const Reflect: { getMetadata?(key: string, target: unknown): unknown[] | undefined } | undefined;

const reflectedTypes = (constr: unknown) =>
    Reflect?.getMetadata?.('design:paramtypes', constr) as Newable[] | undefined;

/**
 * Gets an array of types defined in a types constructor
 */
export function getConstructorTypes<T = unknown>(constr: T): Newable[] {
    const rootInjector = getRootInjector();
    const registration = rootInjector.getRegistrationForType(constr);
    const metadataModel = rootInjector.configuration.metadataMode;
    switch (metadataModel) {
        case 'explicit':
            return registration?.metadata ?? [];
        case 'reflection':
            return reflectedTypes(constr) || [];
        case 'both':
            return registration?.metadata ?? reflectedTypes(constr) ?? [];
        default:
            return [];
    }
}
