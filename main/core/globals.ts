declare let global: IGlobalReference;
declare let window: IGlobalReference;

/**
 * The parts of the host global that Needle touches. Anything else is addressable by key (the root injector lives here).
 */
export interface IGlobalReference {
    Zone?: { __symbol__?: (name: string) => string };
    queueMicrotask?: (callback: () => void) => void;
    [key: string | symbol]: unknown;
}

/**
 * @name getGlobal
 * @description Returns the host global reference across browser, Node, and worker-like runtimes.
 */
/* istanbul ignore next */
export function getGlobal(): IGlobalReference {
    if (typeof globalThis !== 'undefined') {
        return globalThis;
    }

    try {
        return window;
    } catch (e) {
        if (e instanceof ReferenceError) {
            return global;
        }

        throw e;
    }
}

type MicrotaskScheduler = (callback: () => void) => void;

/**
 * Returns a microtask scheduler that avoids Zone.js patched APIs when possible.
 */
export function getZoneSafeMicrotaskScheduler(globalReference: IGlobalReference = getGlobal()): MicrotaskScheduler {
    const zone = globalReference?.Zone;
    const zoneSymbol = typeof zone?.__symbol__ === 'function' ? zone.__symbol__('queueMicrotask') : undefined;
    const unpatchedQueueMicrotask = zoneSymbol ? globalReference?.[zoneSymbol] : undefined;

    if (typeof unpatchedQueueMicrotask === 'function') {
        return (unpatchedQueueMicrotask as MicrotaskScheduler).bind(globalReference);
    }

    if (typeof globalReference?.queueMicrotask === 'function') {
        return globalReference.queueMicrotask.bind(globalReference);
    }

    return (callback: () => void) => Promise.resolve().then(callback);
}
