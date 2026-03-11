import { beforeEach, describe, expect, it } from 'vitest';
import { DI_ROOT_INJECTOR_KEY } from '../constants/constants.js';
import { Injector } from './injector.js';
import { Metrics } from './metrics.js';

class Dep {}
class Owner {
    constructor(_dep: Dep) {}
}

describe('Metrics', () => {
    beforeEach(() => {
        (globalThis as any)[DI_ROOT_INJECTOR_KEY] = Injector.create();
    });

    it('creates and updates records for resolved types', () => {
        const injector = (globalThis as any)[DI_ROOT_INJECTOR_KEY] as Injector;
        injector.register(Owner, { metadata: [Dep] });

        const metrics = new Metrics();
        metrics.update(Owner, undefined, 2);
        metrics.update(Owner, undefined, 4);

        const record = metrics.getMetricsForType(Owner);
        expect(record).toBeDefined();
        expect(record?.resolutionCount).toBe(2);
        expect(record?.dependencyCount).toBe(1);
    });

    it('clears data', () => {
        const metrics = new Metrics();
        metrics.update(Owner, undefined, 1);
        expect(metrics.data.length).toBe(1);
        metrics.clear();
        expect(metrics.data.length).toBe(0);
    });
});
