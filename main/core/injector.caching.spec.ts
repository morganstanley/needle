 

import { beforeEach, describe, expect, it } from 'vitest';
import {
    Child,
    WeakReferenceInjectable,
    getInstance,
    installFreshRootInjector,
    pause,
} from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Caching', () => {
        it('should NOT cache the injectable if default cache strategy set to `no-cache`', () => {
            getInstance().configuration.defaultCacheStrategy = 'no-cache';

            const instance = getInstance();
            instance.register(Child);

            const child1 = instance.get(Child);
            const child2 = instance.get(Child);

            expect(child1).not.toBe(child2);
        });

        it('should return same reference for weak reference instance if GC has not run', () => {
            const instance = getInstance();
            instance.register(WeakReferenceInjectable, { cacheStrategy: 'weak-reference' });

            let firstInstance: WeakReferenceInjectable | undefined = instance.get(WeakReferenceInjectable);
            const idOne = firstInstance.id;
            //DeRef the child to allow GC to collect it
            firstInstance = undefined;

            const secondInstance = instance.get(WeakReferenceInjectable);
            const idTwo = secondInstance.id;

            expect(idOne).toBe(idTwo);
        });

        /**
         * This is a special test to ensure that the WeakRef is collected by the GC.
         * It is not guaranteed to pass every time, as it depends on the timing of the
         * Garbage Collector. Therefore to test this you can run the test then in chrome
         * devtools you can run the GC manually and the test will pass.
         */
        it.skip('should return a different instance for a weakly referenced type after the GC has had time to run', async () => {
            const instance = getInstance();
            instance.register(WeakReferenceInjectable, { cacheStrategy: 'weak-reference' });

            let firstInstance: WeakReferenceInjectable | undefined = instance.get(WeakReferenceInjectable);
            const idOne = firstInstance.id;

            // Access the WeakRef to monitor it
            const weakRef = new WeakRef(firstInstance);

            // Dereference to allow GC
            firstInstance = undefined;

            // Wait for a short while but not long enough for GC to kick in
            await pause(10000); // Wait for the GC to run and the reference to have been collected

            const ref = weakRef.deref();

            const secondInstance = instance.get(WeakReferenceInjectable);
            const idTwo = secondInstance.id;

            expect(ref).toBeUndefined();
            expect(idOne).not.toBe(idTwo); // Should be the same because GC hasn't run
        }, 60000); // Increase timeout for this test

        it('should evict the injectable from the cache after its timeout has expired and no other resolutions', async () => {
            const instance = getInstance();
            instance.register(WeakReferenceInjectable, { cacheStrategy: { type: 'idle', timeout: 500 } });

            const firstInstance: WeakReferenceInjectable | undefined = instance.get(WeakReferenceInjectable);

            await pause(750); // Wait for the timeout to expire

            const secondInstance = instance.get(WeakReferenceInjectable);

            expect(firstInstance).not.toBe(secondInstance);
        });

        it('should evict the injectable from the cache after its timeout has expired and call destroy if it implements IDestroyable', async () => {
            const instance = getInstance();
            instance.register(Child, { cacheStrategy: { type: 'idle', timeout: 500 } });

            const child = instance.get(Child);
            const before = child.isDestroyed;

            await pause(750); // Wait for the timeout to expire

            const after = child.isDestroyed;

            expect(before).toBe(false);
            expect(after).toBe(true);
        });

        it('should NOT evict the injectable from the cache ifs its timeout has NOT expired and other resolutions have occurred', async () => {
            const instance = getInstance();
            instance.register(WeakReferenceInjectable, { cacheStrategy: { type: 'idle', timeout: 1000 } });

            const firstInstance: WeakReferenceInjectable | undefined = instance.get(WeakReferenceInjectable);

            await pause(25); // Wait for the timeout to expire
            const secondInstance = instance.get(WeakReferenceInjectable);

            await pause(25); // Wait for the timeout to expire
            const thirdInstance = instance.get(WeakReferenceInjectable);

            await pause(25); // Wait brief period
            const forthInstance = instance.get(WeakReferenceInjectable);

            await pause(1500); // Wait for the timeout to expire
            const fifthInstance = instance.get(WeakReferenceInjectable);

            expect(firstInstance).toBe(secondInstance);
            expect(secondInstance).toBe(thirdInstance);
            expect(thirdInstance).toBe(forthInstance);
            expect(fifthInstance).not.toBe(forthInstance); //Should be different because the timeout has expired
        });

        it('should NOT evict the injectable from the cache if its cache condition is return FALSE', () => {
            const instance = getInstance();
            instance.register(Child, { cacheStrategy: { type: 'conditional', predicate: () => false } });

            const firstInstance = instance.get(Child);
            const secondInstance = instance.get(Child);
            const thirdInstance = instance.get(Child);
            const forthInstance = instance.get(Child);

            expect(firstInstance).toBe(secondInstance);
            expect(secondInstance).toBe(thirdInstance);
            expect(thirdInstance).toBe(forthInstance);
        });

        it('should evict the injectable from the cache if its cache condition returns TRUE', async () => {
            const instance = getInstance();
            let condition = false;
            instance.register(Child, { cacheStrategy: { type: 'conditional', predicate: () => condition } });

            const firstInstance = instance.get(Child);
            const secondInstance = instance.get(Child);

            condition = true;
            await pause(25); // Wait brief period

            const thirdInstance = instance.get(Child);
            const forthInstance = instance.get(Child);

            expect(firstInstance).toBe(secondInstance);
            expect(secondInstance).not.toBe(thirdInstance);
            expect(thirdInstance).toBe(forthInstance);
        });

        it('should evict the injectable from the cache and run its destroy if its cache condition returns TRUE and it implements IDestroyable', async () => {
            const instance = getInstance();
            let condition = false;
            instance.register(Child, { cacheStrategy: { type: 'conditional', predicate: () => condition } });

            const child = instance.get(Child);
            const before = child.isDestroyed;

            condition = true;
            await pause(25); // Wait for the timeout to expire

            const child2 = instance.get(Child);

            const after = child.isDestroyed;

            expect(before).toBe(false);
            expect(after).toBe(true);
            expect(child).not.toBe(child2);
        });
    });
});
