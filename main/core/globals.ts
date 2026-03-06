declare let global: any;

/**
 * @name getGlobal
 * @description Returns window object in context of browser or global in context of node.
 */
/* istanbul ignore next */
export function getGlobal(): any {
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
export function getZoneSafeMicrotaskScheduler(globalReference: any = getGlobal()): MicrotaskScheduler {
    const zone = globalReference?.Zone;
    const zoneSymbol = typeof zone?.__symbol__ === 'function' ? zone.__symbol__('queueMicrotask') : undefined;
    const unpatchedQueueMicrotask = zoneSymbol ? globalReference?.[zoneSymbol] : undefined;

    if (typeof unpatchedQueueMicrotask === 'function') {
        return unpatchedQueueMicrotask.bind(globalReference) as MicrotaskScheduler;
    }

    if (typeof globalReference?.queueMicrotask === 'function') {
        return globalReference.queueMicrotask.bind(globalReference) as MicrotaskScheduler;
    }

    return (callback: () => void) => Promise.resolve().then(callback);
}
