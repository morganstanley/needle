 

import { beforeEach, describe, expect, it } from 'vitest';
import { Vehicle, getInstance, installFreshRootInjector } from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Instances', () => {
        it('should register an instance with the injector', () => {
            const instance = getInstance();

            const vehicle = new Vehicle('Car');

            instance.register(Vehicle).registerInstance(Vehicle, vehicle);

            const sameVehicle = instance.get(Vehicle);

            expect(vehicle).toBeDefined();
            expect(sameVehicle).toBeDefined();
            expect(sameVehicle).toBe(vehicle);
        });

        it('should replace the instance with a new instance', () => {
            const instance = getInstance();

            const vehicle1 = new Vehicle('Car');
            const vehicle2 = new Vehicle('Bike');

            instance.register(Vehicle);

            instance.registerInstance(Vehicle, vehicle1);

            const car = instance.get(Vehicle);
            instance.registerInstance(Vehicle, vehicle2);
            const bike = instance.get(Vehicle);

            expect(car).toBeDefined();
            expect(bike).toBeDefined();
            expect(car).not.toBe(bike);
        });

        it('should register with default config', () => {
            const instance = getInstance();

            const vehicle1 = new Vehicle('Car');

            instance.register(Vehicle);

            instance.registerInstance(Vehicle, vehicle1);

            const reg = instance.getRegistrationForType(Vehicle);

            expect(reg).toEqual({});
        });

        it('should register with custom config', () => {
            const instance = getInstance();

            const vehicle1 = new Vehicle('Car');

            instance.register(Vehicle);

            instance.registerInstance(Vehicle, vehicle1, { metadata: [String] });

            const reg = instance.getRegistrationForType(Vehicle);

            expect(reg).toEqual({ metadata: [String] });
        });
    });
});
