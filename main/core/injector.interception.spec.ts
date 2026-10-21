 

import { beforeEach, describe, expect, it } from 'vitest';
import { Interceptor } from '../index.js';
import { Engine, EngineInterceptor, getInstance, installFreshRootInjector } from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Interception', () => {
        it('should create the interceptor upon registration when registered with @Interceptor', () => {
            const instance = getInstance();

            Interceptor()(EngineInterceptor);

            expect(instance.cache.instanceCount).toBe(1);
            expect(instance.cache.resolve(EngineInterceptor)).toBeDefined();
        });

        it('should call the correct interception methods if interceptor registered', () => {
            const instance = getInstance();
            const interceptor = new EngineInterceptor();

            instance.register(Engine).registerInterceptor(interceptor);

            instance.get(Engine);

            expect(interceptor.beforeInvocation.length).toBe(1);
            expect(interceptor.beforeInvocation[0]).toBeDefined();
            expect(interceptor.beforeInvocation[0].configuration).toBe(instance.getRegistrationForType(Engine)!);
            expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
            expect(interceptor.beforeInvocation[0].injector).toBe(instance);
            expect(interceptor.beforeInvocation[0].type).toBe(Engine);

            expect(interceptor.afterInvocation.length).toBe(1);
            expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
            expect(interceptor.afterInvocation[0].context).toBeDefined();
            expect(interceptor.afterInvocation[0].context.configuration).toBe(instance.getRegistrationForType(Engine)!);
            expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
            expect(interceptor.afterInvocation[0].context.injector).toBe(instance);
            expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
        });

        it('should intercept creation if interceptor registered in root but Type resolved from scope', () => {
            const instance = getInstance();
            const interceptor = new EngineInterceptor();

            instance.registerInterceptor(interceptor);
            const scoped = instance.createScope('scoped').register(Engine);

            scoped.get(Engine);
            const registration = scoped.getRegistrationForType(Engine);

            expect(interceptor.beforeInvocation.length).toBe(1);
            expect(interceptor.beforeInvocation[0]).toBeDefined();
            expect(interceptor.beforeInvocation[0].configuration).toBe(registration!);
            expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
            expect(interceptor.beforeInvocation[0].injector).toBe(scoped);
            expect(interceptor.beforeInvocation[0].type).toBe(Engine);

            expect(interceptor.afterInvocation.length).toBe(1);
            expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
            expect(interceptor.afterInvocation[0].context).toBeDefined();
            expect(interceptor.afterInvocation[0].context.configuration).toBe(registration!);
            expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
            expect(interceptor.afterInvocation[0].context.injector).toBe(scoped);
            expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
        });

        it('should always register interceptors in root even if registered via a scope', () => {
            const root = getInstance();
            const interceptor = new EngineInterceptor();

            root.register(Engine).createScope('scoped').registerInterceptor(interceptor);

            root.get(Engine);
            const registration = root.getRegistrationForType(Engine);

            expect(interceptor.beforeInvocation.length).toBe(1);
            expect(interceptor.beforeInvocation[0]).toBeDefined();
            expect(interceptor.beforeInvocation[0].configuration).toBe(registration!);
            expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
            expect(interceptor.beforeInvocation[0].injector).toBe(root);
            expect(interceptor.beforeInvocation[0].type).toBe(Engine);

            expect(interceptor.afterInvocation.length).toBe(1);
            expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
            expect(interceptor.afterInvocation[0].context).toBeDefined();
            expect(interceptor.afterInvocation[0].context.configuration).toBe(registration!);
            expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
            expect(interceptor.afterInvocation[0].context.injector).toBe(root);
            expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
        });

        it('should register an interceptor instance only one time in the system', () => {
            const root = getInstance();
            const interceptor = new EngineInterceptor();

            root.register(Engine)
                .registerInterceptor(interceptor)
                .createScope('scoped')
                .registerInterceptor(interceptor)
                .registerInterceptor(interceptor);

            root.get(Engine);
            const registration = root.getRegistrationForType(Engine);

            expect(interceptor.beforeInvocation.length).toBe(1);
            expect(interceptor.beforeInvocation[0]).toBeDefined();
            expect(interceptor.beforeInvocation[0].configuration).toBe(registration!);
            expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
            expect(interceptor.beforeInvocation[0].injector).toBe(root);
            expect(interceptor.beforeInvocation[0].type).toBe(Engine);

            expect(interceptor.afterInvocation.length).toBe(1);
            expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
            expect(interceptor.afterInvocation[0].context).toBeDefined();
            expect(interceptor.afterInvocation[0].context.configuration).toBe(registration!);
            expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
            expect(interceptor.afterInvocation[0].context.injector).toBe(root);
            expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
        });

        it('should register duplicate type instances for interception', () => {
            const root = getInstance();
            const interceptor1 = new EngineInterceptor();
            const interceptor2 = new EngineInterceptor();
            const interceptor3 = new EngineInterceptor();

            root.register(Engine)
                .registerInterceptor(interceptor1)
                .createScope('scoped')
                .registerInterceptor(interceptor2)
                .registerInterceptor(interceptor3);

            root.get(Engine);
            const registration = root.getRegistrationForType(Engine);

            [interceptor1, interceptor2, interceptor3].forEach((interceptor) => {
                expect(interceptor.beforeInvocation.length).toBe(1);
                expect(interceptor.beforeInvocation[0]).toBeDefined();
                expect(interceptor.beforeInvocation[0].configuration).toBe(registration!);
                expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
                expect(interceptor.beforeInvocation[0].injector).toBe(root);
                expect(interceptor.beforeInvocation[0].type).toBe(Engine);

                expect(interceptor.afterInvocation.length).toBe(1);
                expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
                expect(interceptor.afterInvocation[0].context).toBeDefined();
                expect(interceptor.afterInvocation[0].context.configuration).toBe(registration!);
                expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
                expect(interceptor.afterInvocation[0].context.injector).toBe(root);
                expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
            });
        });
    });
});
