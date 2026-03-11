import { getLazy, getRegisteredTypes } from './util.functions.js';

/***
 * Returns an array of of providers and associated factory functions.
 */
export function getRegisteredTypesWithFactories() {
    return getRegisteredTypes().map(t => ({ provide: t, useFactory: getLazy(t) }));
}
