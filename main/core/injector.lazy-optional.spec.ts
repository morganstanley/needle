 

import { beforeEach, describe, expect, it } from 'vitest';
import { getOptional, LazyInstance } from '../index.js';
import {
    Car,
    CarManufacturer,
    Child,
    Engine,
    GrandParent,
    Individual,
    Parent,
    Train,
    getInstance,
    installFreshRootInjector,
} from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Lazy', () => {
        it('should resolve an instance of lazy when getLazy invoked on any type.', () => {
            const instance = getInstance();

            instance.register(Child);

            const lazy = instance.getLazy(Child);

            expect(lazy instanceof LazyInstance).toBeTruthy();
            expect(lazy.value.id).toBeDefined();
            expect(lazy.value.age).toBe(7);
        });

        it('should resolve a lazy when getLazy invoked on an abstract type.', () => {
            const instance = getInstance();

            instance.register(Child).register(Individual, {
                resolution: Child,
            });

            const lazyIndividual = instance.getLazy(Individual);

            expect(lazyIndividual instanceof LazyInstance).toBeTruthy();
            expect(lazyIndividual.value.id).toBeDefined();
            expect((lazyIndividual.value as Child).age).toBe(7);
        });

        it('should resolve an instance of lazy when getLazy invoked with a token', () => {
            const instance = getInstance();

            instance.register(Child, {
                tokens: ['child'],
            });

            const lazy = instance.getLazy<Child>('child');

            expect(lazy instanceof LazyInstance).toBeTruthy();
            expect(lazy.value.id).toBeDefined();
            expect(lazy.value.age).toBe(7);
        });

        it('should return false when hasValue queried and value has not yet been read', () => {
            const instance = getInstance();

            instance.register(Child);

            const lazy = instance.getLazy(Child);

            expect(lazy.hasValue).toBeFalsy();
        });

        it('should return true when hasValue queried and value has been read', () => {
            const instance = getInstance();

            instance.register(Child);

            const lazy = instance.getLazy(Child);
            const value = lazy.value;

            expect(value).toBeDefined();
            expect(lazy.hasValue).toBeTruthy();
        });

        it('should return the same instance after the value has been read', () => {
            const instance = getInstance();

            instance.register(Child);

            const lazy = instance.getLazy(Child);
            const value1 = lazy.value;
            const value2 = lazy.value;
            const value3 = lazy.value;

            const equalValues = value1 === value2 && value3 === value2;

            expect(equalValues).toBeTruthy();
        });

        it('should inject a parameter of type lazy when lazy annotation present', () => {
            const instance = getInstance();

            instance.register(Engine).register(Train).registerParamForLazyInjection(Engine, Train, 0);

            const train = instance.get(Train);

            expect(train.engine instanceof LazyInstance).toBeTruthy();
        });
    });

    describe('Optional', () => {
        it('should resolve the type instance for parameter decorated with @Optional and has been registered', () => {
            const instance = getInstance();

            instance
                .register(GrandParent)
                .register(Parent)
                .register(Child)
                .registerParamForOptionalInjection(Parent, 0);

            const grandParent = instance.get(GrandParent);

            expect(grandParent).toBeDefined();
            expect(grandParent.son).toBeDefined();
            expect(grandParent.son.daughter).toBeDefined();
        });

        it('should resolve undefined when getOptional invoked on injector and no registrations', () => {
            const instance = getInstance();

            const child = instance.getOptional(Child);

            expect(child).toBeUndefined();
        });

        it('should resolve undefined when getOptional invoked on injector with a token and no registrations', () => {
            const instance = getInstance();

            const child = instance.getOptional('nonExistentToken');

            expect(child).toBeUndefined();
        });

        it('should resolve undefined when getOptional invoked via pure import and no registrations', () => {
            const child = getOptional(Child);

            expect(child).toBeUndefined();
        });

        it('should resolve undefined when getOptional invoked via pure import with a token and no registrations', () => {
            const child = getOptional('nonExistentToken');

            expect(child).toBeUndefined();
        });

        it('should resolve instance of type when getOptional invoked on injector has registrations', () => {
            const instance = getInstance();

            instance.register(Child);

            const child = instance.getOptional(Child);

            expect(child).toBeDefined();
        });

        it('should resolve token when getOptional invoked on injector has registrations', () => {
            const instance = getInstance();

            const token = 'injectionToken';

            instance.register(Child, { tokens: [token] });

            const child = instance.getOptional(token);

            expect(child).toBeDefined();
        });

        it('should throw exception if we try and resolve optional type but its children are not registered', () => {
            const instance = getInstance();
            let message = '';
            instance.register(GrandParent);

            try {
                instance.getOptional(GrandParent);
            } catch (ex) {
                message = (ex as any).message;
            }

            expect(message).toBe(
                `Cannot construct Type 'Parent' with ancestry 'GrandParent -> Parent' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
            );
        });

        it('should resolve undefined instance for parameter decorated with @Optional and has NOT been registered', () => {
            const instance = getInstance();

            instance.register(GrandParent).register(Parent).registerParamForOptionalInjection(Parent, 0);

            const grandParent = instance.get(GrandParent);

            expect(grandParent).toBeDefined();
            expect(grandParent.son).toBeDefined();
            expect(grandParent.son.daughter).toBeUndefined();
        });

        it('should still inject a Factory<T> when param is marked @Factory & @optional', () => {
            const instance = getInstance();

            instance
                .register(Car)
                .register(Engine)
                .register(CarManufacturer)
                .registerParamForFactoryInjection(Car, CarManufacturer, 0);

            const carManufacturer = instance.get(CarManufacturer);
            const car = carManufacturer.makeCar();

            expect(car).toBeDefined();
        });

        it('should still inject a Lazy<T> when param is marked @Lazy & @optional', () => {
            const instance = getInstance();

            instance
                .register(Engine)
                .register(Train)
                .registerParamForLazyInjection(Engine, Train, 0)
                .registerParamForOptionalInjection(Train, 0);

            const train = instance.get(Train);

            expect(train.engine instanceof LazyInstance).toBeTruthy();
        });
    });
});
