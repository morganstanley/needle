 

import { beforeEach, describe, expect, it } from 'vitest';
import { NULL_VALUE, UNDEFINED_VALUE, AUTO_RESOLVE } from '../constants/constants.js';
import {
    Bus,
    Car,
    CarManufacturer,
    Engine,
    Vehicle,
    getInstance,
    installFreshRootInjector,
} from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Factories', () => {
        it('should resolve an instance of factory when getFactory invoked on any type.', () => {
            const instance = getInstance();

            instance.register(Vehicle);

            const factory = instance.getFactory(Vehicle);
            const vehicle = factory.create('Bike');

            expect(factory).toBeDefined();
            expect(vehicle).toBeDefined();
            expect(vehicle.type).toBe('Bike');
        });

        it('should throw excception when factory type is not registered and attempt to resolve.', () => {
            const instance = getInstance();
            let registrationError: any;
            const factory = instance.getFactory(Vehicle);

            try {
                factory.create('Bike');
            } catch (ex) {
                registrationError = ex;
            }

            expect(registrationError).toBeDefined();
            expect(registrationError.message).toBe(
                "Cannot construct Type 'Vehicle' with ancestry '' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional",
            );
        });

        it('should auto resolve parameters for a factory when not supplied by developer', () => {
            const instance = getInstance();

            instance.register(Car).register(Engine);

            const carFactory = instance.getFactory(Car);
            const car = carFactory.create();

            expect(carFactory).toBeDefined();
            expect(car).toBeDefined();
            expect(car.engine).toBeDefined();
        });

        it('should auto resolve parameters for a factory when supplied using named constant', () => {
            const instance = getInstance();

            instance.register(Car).register(Engine);

            const carFactory = instance.getFactory(Car);
            const car = carFactory.create(AUTO_RESOLVE);

            expect(carFactory).toBeDefined();
            expect(car).toBeDefined();
            expect(car.engine).toBeDefined();
        });

        it('should resolve a undefined if explicitly passed', () => {
            const instance = getInstance();

            instance.register(Car).register(Engine);

            const carFactory = instance.getFactory(Car);
            const car = carFactory.create(UNDEFINED_VALUE);

            expect(carFactory).toBeDefined();
            expect(car).toBeDefined();
            expect(car.engine).toBeUndefined();
        });

        it('should resolve a null value if explicitly passed', () => {
            const instance = getInstance();

            instance.register(Car).register(Engine);

            const carFactory = instance.getFactory(Car);
            const car = carFactory.create(NULL_VALUE);

            expect(carFactory).toBeDefined();
            expect(car).toBeDefined();
            expect(car.engine).toBeNull();
        });

        it('should return a new instance of a car on each create request', () => {
            const instance = getInstance();

            instance.register(Car).register(Engine);

            const carFactory = instance.getFactory(Car);
            const car1 = carFactory.create();
            const car2 = carFactory.create();

            expect(carFactory).toBeDefined();
            expect(car1).toBeDefined();
            expect(car2).toBeDefined();
            expect(car1).not.toBe(car2);
        });

        it('should return a new instance of Bus when partial parameters supplied', () => {
            const instance = getInstance();

            instance.register(Bus).register(Engine);

            const busFactory = instance.getFactory(Bus);
            const bus1 = busFactory.create(undefined, 100);
            const bus2 = busFactory.create(undefined, 150);

            expect(busFactory).toBeDefined();
            expect(bus1).toBeDefined();
            expect(bus1.engine).toBeDefined();
            expect(bus1.capacity).toBe(100);

            expect(bus2).toBeDefined();
            expect(bus2.engine).toBeDefined();
            expect(bus2.capacity).toBe(150);

            expect(bus1).not.toBe(bus2);
        });

        it('should inject an AutoFactory if the constructor param decorate correctly', () => {
            const instance = getInstance();

            instance
                .register(Car)
                .register(Engine)
                .register(CarManufacturer)
                .registerParamForFactoryInjection(Car, CarManufacturer, 0);

            const carManufacturer = instance.get(CarManufacturer);

            expect(carManufacturer).toBeDefined();
        });
    });
});
