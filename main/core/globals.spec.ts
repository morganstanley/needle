import { describe, expect, it } from 'vitest';
import { getGlobal, getZoneSafeMicrotaskScheduler } from './globals.js';

describe('globals', () => {
    it('returns a global reference', () => {
        expect(getGlobal()).toBeDefined();
    });

    it('prefers Zone unpatched queueMicrotask when available', () => {
        let unpatchedCalls = 0;
        let patchedCalls = 0;

        const globalRef = {
            Zone: {
                __symbol__: (name: string) => `__zone_symbol__${name}`,
            },
            queueMicrotask: (_cb: () => void) => {
                patchedCalls++;
            },
            __zone_symbol__queueMicrotask: (cb: () => void) => {
                unpatchedCalls++;
                cb();
            },
        };

        let executed = false;
        const scheduler = getZoneSafeMicrotaskScheduler(globalRef);
        scheduler(() => {
            executed = true;
        });

        expect(unpatchedCalls).toBe(1);
        expect(patchedCalls).toBe(0);
        expect(executed).toBe(true);
    });

    it('falls back to Promise scheduling if queueMicrotask is unavailable', async () => {
        const globalRef = {};
        const scheduler = getZoneSafeMicrotaskScheduler(globalRef);

        let executed = false;
        scheduler(() => {
            executed = true;
        });

        await Promise.resolve();
        expect(executed).toBe(true);
    });
});
