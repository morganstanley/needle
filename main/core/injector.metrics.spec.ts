 

import { beforeEach, describe, expect, it } from 'vitest';
import {
    Child,
    GrandParent,
    Parent,
    getInstance,
    installFreshRootInjector,
    pause,
} from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Metrics', () => {
        it('should record metrics for a given type on resolution', () => {
            const instance = getInstance();
            const startMetricCount = instance.metrics.data.length;
            instance.register(Child);

            instance.get(Child);

            expect(startMetricCount).toBe(0);
            expect(instance.metrics.data.length).toBe(1);
            expect(instance.metrics.data[0]).toBeDefined();
            expect(instance.metrics.data[0].activated instanceof Date).toBeTruthy();
            expect(instance.metrics.data[0].activationTypeOwner).toBe(Child);
            expect(instance.metrics.data[0].creationTimeMs).toBeDefined();
            expect(instance.metrics.data[0].dependencyCount).toBe(0);
            expect(instance.metrics.data[0].lastResolution instanceof Date).toBeTruthy();
            expect(instance.metrics.data[0].resolutionCount).toBe(1);
            expect(instance.metrics.data[0].type).toBe(Child);
            expect(instance.metrics.data[0].name).toBe('Child');
        });

        it('should increment the resolution count on each resolution', () => {
            const instance = getInstance();

            instance.register(Child);

            instance.get(Child);
            instance.get(Child);
            instance.get(Child);
            instance.get(Child);
            instance.get(Child);

            expect(instance.metrics.data[0].resolutionCount).toBe(5);
        });

        it('should return metrics for a given type', () => {
            const instance = getInstance();

            instance.register(Child);
            instance.get(Child);

            const metrics = instance.metrics.getMetricsForType(Child);

            expect(metrics!.resolutionCount).toBeDefined();
        });

        it('should not track metrics if the configuration disables this', () => {
            const instance = getInstance();
            instance.configuration.trackMetrics = false;

            instance.register(Child);
            instance.get(Child);

            const metrics = instance.metrics.getMetricsForType(Child);

            expect(metrics).toBeUndefined();
        });

        it('should record the correct dependency count for a given type', () => {
            const instance = getInstance();

            instance.register(GrandParent).register(Parent).register(Child);

            instance.get(GrandParent);
            instance.metrics.dump();

            const result = instance.metrics.getMetricsForType(GrandParent);

            expect(result!.dependencyCount).toBe(1);
        });

        it('should update the last resolution time', async () => {
            const instance = getInstance();

            instance.register(Child);

            instance.get(Child);
            const firstResolutionTime = instance.metrics.data[0].lastResolution;

            await pause(50);

            instance.get(Child);
            expect(instance.metrics.data[0].lastResolution.getTime()).toBeGreaterThan(firstResolutionTime.getTime());
        });

        describe('Scoping', () => {
            it('should record metrics correctly for each scope', () => {
                const instance = getInstance();

                instance.register(GrandParent).register(Parent).register(Child);

                const scoped = instance
                    .createScope('test-scope')
                    .register(GrandParent)
                    .register(Parent)
                    .register(Child);

                instance.get(GrandParent);
                scoped.get(GrandParent);

                const parentMetrics = instance.metrics.getMetricsForType(GrandParent);
                const scopedMetrics = scoped.metrics.getMetricsForType(GrandParent);

                expect(parentMetrics!.resolutionCount).toBe(1);
                expect(scopedMetrics!.resolutionCount).toBe(1);
            });

            it('should remove the child scope from the parent', () => {
                const instance = getInstance();

                instance.register(GrandParent).register(Parent).register(Child);

                const scoped = instance
                    .createScope('test-scope')
                    .register(GrandParent)
                    .register(Parent)
                    .register(Child);

                const childCountBefore = instance.children.size;

                scoped.destroy();

                const childCountAfter = instance.children.size;

                expect(childCountBefore).toBe(1);
                expect(childCountAfter).toBe(0);
            });

            it('should remove the children in all scopes when parent scope destroyed', () => {
                const instance = getInstance();

                const level2 = instance.createScope('level-2');
                const level3 = level2.createScope('level-3');
                const level4 = level3.createScope('level-4');

                const level1CountBefore = instance.children.size;
                const level2CountBefore = level2.children.size;
                const level3CountBefore = level3.children.size;
                const level4CountBefore = level4.children.size;

                level3.destroy();

                const level1CountAfter = instance.children.size;
                const level2CountAfter = level2.children.size;
                const level3CountAfter = level3.children.size;
                const level4CountAfter = level4.children.size;

                expect(level1CountBefore).toBe(1);
                expect(level2CountBefore).toBe(1);
                expect(level3CountBefore).toBe(1);
                expect(level4CountBefore).toBe(0);

                expect(level1CountAfter).toBe(1);
                expect(level2CountAfter).toBe(0);
                expect(level3CountAfter).toBe(0);
                expect(level4CountAfter).toBe(0);
            });

            it('should call destroy on injectables that implement IDestroy', () => {
                const instance = getInstance();

                const level2 = instance.createScope('level-2');

                const child = new Child();
                const before = child.isDestroyed;

                //Front load our cache
                level2.cache.update(Child, child);

                level2.destroy();

                const after = child.isDestroyed;

                expect(before).toBeFalsy();
                expect(after).toBeTruthy(); // Child should be destroyed
            });

            it('should record metrics correctly for correct parent scope when instance resolved from parent rather than local', () => {
                const instance = getInstance();

                instance.register(GrandParent).register(Parent).register(Child);

                const scoped = instance.createScope('test-scope');

                instance.get(GrandParent);
                scoped.get(GrandParent);

                const parentMetrics = instance.metrics.getMetricsForType(GrandParent)!;
                const scopedMetrics = scoped.metrics.getMetricsForType(GrandParent)!;

                expect(parentMetrics.resolutionCount).toBe(2);
                expect(scopedMetrics).toBeUndefined();
            });
        });
    });
});
