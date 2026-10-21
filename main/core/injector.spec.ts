 

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Injector } from '../index.js';
import { Child, GrandParent, Parent, getInstance, installFreshRootInjector } from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Scheduled verification', () => {
        afterEach(() => {
            vi.restoreAllMocks();
            (Injector as any).verify = false;
        });

        it('should reset the static verify flag when verify throws so it can be scheduled again', () => {
            const instance = getInstance() as Injector;
            const queued: Array<() => void> = [];
            vi.spyOn(globalThis, 'queueMicrotask').mockImplementation((cb) => {
                queued.push(cb);
            });
            const verifySpy = vi.spyOn(instance, 'verify').mockImplementation(() => {
                throw new Error('verify failed');
            });

            (instance as any).scheduleVerify();
            expect(queued.length).toBe(1);
            expect((Injector as any).verify).toBe(true);

            expect(() => queued[0]()).toThrow('verify failed');
            expect((Injector as any).verify).toBe(false);

            // A later resolution must be able to schedule verification again
            verifySpy.mockImplementation(() => undefined);
            (instance as any).scheduleVerify();
            expect(queued.length).toBe(2);
            queued[1]();
            expect(verifySpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Defaults', () => {
        it('should return an instance of the injector', () => {
            const instance = getInstance();

            expect(instance).toBeDefined();
        });

        it('should allocate a unique Id to the injector instance', () => {
            const instance = getInstance();

            expect(instance.id).toBeDefined();
            expect(instance.id.length).toBe(36);
        });

        it('should return an empty array of registered types by default when getRegisteredTypes invoked', () => {
            const instance = getInstance();

            expect(instance.getRegisteredTypes()).toEqual([]);
        });

        it('should return an empty array of registered types by default when getRegisteredTypesWithDependencies invoked', () => {
            const instance = getInstance();

            expect(instance.getRegisteredTypesWithDependencies()).toEqual([]);
        });

        it('should return true when isRoot invoked and this is the root injector', () => {
            const instance = getInstance();

            expect(instance.isRoot()).toBeTruthy();
        });

        it('should return false when isScoped invoked and this is the root injector', () => {
            const instance = getInstance();

            expect(instance.isScoped()).toBeFalsy();
        });

        it('should return undefined for parent if the root injector', () => {
            const instance = getInstance();

            expect(instance.parent).toBeUndefined();
        });

        it('should return undefined for name', () => {
            const instance = getInstance();

            expect(instance.name).toBeUndefined();
        });

        it('should return false for isDestroyed', () => {
            const instance = getInstance();

            expect(instance.isDestroyed()).toBeFalsy();
        });

        it('should throw exception if injector is destroyed and attempt to resolve is made', () => {
            const instance = getInstance();
            let message = '';

            instance.register(Child);
            instance.destroy();

            try {
                instance.get(Child);
            } catch (ex) {
                message = (ex as any).message;
            }

            expect(
                message.indexOf(
                    'Invalid operation, the current injector instance is marked as destroyed. Injector Id: [',
                ) !== -1,
            ).toBeTruthy();
        });
    });

    describe('Registration', () => {
        it('should register a type for injection', () => {
            const instance = getInstance();

            instance.register(GrandParent);

            expect(instance.getRegisteredTypes()[0]).toBe(GrandParent);
        });

        it('should not register a type twice', () => {
            const instance = getInstance();

            instance.register(GrandParent).register(GrandParent).register(GrandParent);

            expect(instance.getRegisteredTypes().length).toBe(1);
        });

        it('should  register distinct types', () => {
            const instance = getInstance();

            instance.register(GrandParent).register(Parent).register(Child);

            expect(instance.getRegisteredTypes().length).toBe(3);
        });
    });
});
