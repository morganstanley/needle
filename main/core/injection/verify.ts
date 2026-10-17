import { getGlobal, getZoneSafeMicrotaskScheduler } from '../globals.js';
import type { Injector } from '../injector.js';
import { getRootInjector } from './scoping.js';

/**
 * Schedules a verification of the injector tree which will happen at the end of the current event loop
 * @description This is used to ensure that the cache is purged of any stale instances for example
 */
export function scheduleVerify(injector: Injector, state: { verify: boolean }): void {
    if (state.verify === false) {
        state.verify = true;

        // We can't use a direct queueMicrotask call here as it may be patched by Zone.js which would cause the verify to run inside the zone and potentially cause issues with change detection in frameworks like Angular.  By resolving the microtask scheduler at runtime we can ensure we get the unpatched version if it exists.
        const scheduleMicrotask = getZoneSafeMicrotaskScheduler(getGlobal());

        scheduleMicrotask(() => {
            try {
                //Start from the top and work our way down
                getRootInjector(injector).verify();
            } finally {
                //Always reset the flag, otherwise a throwing verify() would stop verification ever being scheduled again
                state.verify = false;
            }
        });
    }
}
