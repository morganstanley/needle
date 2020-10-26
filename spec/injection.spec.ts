import {
    AutoFactory,
    Configuration,
    Factory,
    getRootInjector,
    Inject,
    Injectable,
    Injector,
    Lazy,
    LazyInstance,
    Strategy,
} from '../main';
import { DI_GLOBAL_STATE_STORE, DI_ROOT_INJECTOR_KEY, GLOBAL_CONFIGURATION } from '../main/constants/constants';
import { InstanceCache } from '../main/core/cache';
import { globalState } from '../main/core/globals';
import { isInjectorLike } from '../main/core/guards';
import { InjectionTokensCache } from '../main/core/tokens';

export class Person {}

export class Student extends Person {}

interface IStrategy {}

@Injectable({
    strategy: 'work-strategies',
})
export class Strategy1 implements IStrategy {}

// tslint:disable-next-line:max-classes-per-file
@Injectable({
    strategy: 'work-strategies',
})
export class Strategy2 implements IStrategy {}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
export class StrategyOwner {
    constructor(@Strategy('work-strategies') public workStrategies: IStrategy[]) {}
}

// tslint:disable-next-line:max-classes-per-file
@Injectable({
    tokens: ['geography-student'],
})
export class GeographyStudent extends Student {}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
export class GeographyTeacher extends Person {
    constructor(@Inject('geography-student') public student: Student) {
        super();
    }
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
export class HistoryTeacher extends Person {
    constructor(@Inject('history-student') public student: Student) {
        super();
    }
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
export class Child extends Person {}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
export class AdoptedChild extends Child {}
// tslint:disable-next-line:max-classes-per-file
@Injectable({
    tokens: ['father', 'mother'],
})
export class Parent extends Person {
    constructor(public daughter: Child) {
        super();
    }
}
// tslint:disable-next-line:max-classes-per-file
@Injectable()
export class GrandParent extends Person {
    constructor(public son: Parent) {
        super();
    }
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
class NaughtyTurtle {
    constructor(public child: NaughtyTurtle) {}
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
class Vehicle {
    constructor(public type: 'Bike' | 'Car' | 'Bus' | 'Train') {}
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
class Engine {}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
class Car extends Vehicle {
    constructor(public engine: Engine) {
        super('Car');
    }
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
class Bus extends Vehicle {
    constructor(public engine: Engine, public capacity: number) {
        super('Car');
    }
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
class Train extends Vehicle {
    constructor(@Lazy(Engine) public engine: LazyInstance<typeof Engine>) {
        super('Train');
    }
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
class CarManufacturer {
    public cars = new Array<Car>();

    constructor(@Factory(Car) private carFactory: AutoFactory<typeof Car>) {}

    public makeCar(): void {
        this.cars.push(this.carFactory.create());
    }
}

describe('Injector', () => {
    beforeEach(() => {
        // Delete the global state store on each run
        (window as any)[DI_GLOBAL_STATE_STORE] = undefined;

        // Use a global config which should override the one used by this injector instance
        globalState(GLOBAL_CONFIGURATION, () => new Configuration());

        (window as any)[DI_ROOT_INJECTOR_KEY] = new Injector(
            new InstanceCache(),
            new Configuration(),
            new InjectionTokensCache(),
        );
    });

    const getInstance = (resetInjector = true) => {
        if (resetInjector) {
            getRootInjector().reset();
        }

        return getRootInjector();
    };

    describe('Functions', () => {
        it('should return true if the type is injectorLike', () => {
            const instance = getInstance();

            const result = isInjectorLike(instance);

            expect(result).toBeTruthy();
        });

        it('should return false if the type is injectorLike', () => {
            const result = isInjectorLike({});

            expect(result).toBeFalsy();
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

        it('should return undefined for scope if the root injector', () => {
            const instance = getInstance();

            expect(instance.scope).toBeUndefined();
        });

        it('should return false for isDestroyed', () => {
            const instance = getInstance();

            expect(instance.isDestroyed()).toBeFalsy();
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

            instance
                .register(GrandParent)
                .register(GrandParent)
                .register(GrandParent);

            expect(instance.getRegisteredTypes().length).toBe(1);
        });

        it('should  register distinct types', () => {
            const instance = getInstance();

            instance
                .register(GrandParent)
                .register(Parent)
                .register(Child);

            expect(instance.getRegisteredTypes().length).toBe(3);
        });
    });

    describe('Tokens', () => {
        it('should resolve an instance of the type by token', () => {
            const instance = getInstance();

            instance.register(Child, {
                tokens: ['child'],
            });

            const child = instance.get<typeof Child>('child');

            expect(child).toBeDefined();
        });

        it('should resolve the correct instance based on the token defined in the @Inject annotation', () => {
            const instance = getInstance();

            instance
                .register(GeographyTeacher)
                .register(Student, { tokens: ['geography-student'] })
                .registerParamForTokenInjection('geography-student', GeographyTeacher, 0);

            const geographyTeacher = instance.get(GeographyTeacher);

            expect(geographyTeacher).toBeDefined();
            expect(geographyTeacher.student).toBeDefined();
            expect(geographyTeacher.student instanceof GeographyStudent).toBeDefined();
        });

        it('should resolve an instance of the type using multiple tokens', () => {
            const instance = getInstance();

            instance.register(Child, {
                tokens: ['child', 'son', 'daughter'],
            });

            const child = instance.get<typeof Child>('child');
            const son = instance.get<typeof Child>('son');
            const daughter = instance.get<typeof Child>('daughter');

            expect(child).toBeDefined();
            expect(son).toBeDefined();
            expect(daughter).toBeDefined();

            expect(child).toBe(son);
            expect(daughter).toBe(son);
        });

        it('should resolve an instance of the type using the last registered type against the token when configuration allowDuplicateTokens=true.', () => {
            const instance = getInstance();

            instance.configuration.allowDuplicateTokens = true;

            instance.register(Child, {
                tokens: ['child'],
            });

            instance.register(Parent, {
                tokens: ['child'],
            });

            const child = instance.get<typeof AdoptedChild>('child');

            expect(child).toBeDefined();
            expect(child instanceof Parent).toBeTruthy();
        });

        it('should throw an error when the token cannot be resolved', () => {
            const instance = getInstance();
            let exception: any;
            try {
                instance.register(Child, {
                    tokens: ['child'],
                });

                instance.get<typeof Child>('unknownChild');
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeDefined();
            expect(exception.message).toBe(
                `Cannot resolve Type with token 'unknownChild' as no types have been registered against that token value`,
            );
        });

        it('should throw an exception if the token has already been registered to another type', () => {
            const instance = getInstance();
            let exception: any;
            try {
                instance.register(GrandParent, {
                    tokens: ['duplicateToken'],
                });
                instance.register(Parent, {
                    tokens: ['duplicateToken'],
                });
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeDefined();
            expect(exception.message).toBe(
                `Cannot register Type 'Parent' with token duplicateToken. Duplicate token found for the following type 'GrandParent'`,
            );
        });
    });

    describe('Instances', () => {
        it('should register an instance with the injector', () => {
            const instance = getInstance();

            const vehicle = new Vehicle('Car');

            instance.registerInstance(Vehicle, vehicle);

            const sameVehicle = instance.get(Vehicle);

            expect(vehicle).toBeDefined();
            expect(sameVehicle).toBeDefined();
            expect(sameVehicle).toBe(vehicle);
        });

        it('should replace the instance with a new instance', () => {
            const instance = getInstance();

            const vehicle1 = new Vehicle('Car');
            const vehicle2 = new Vehicle('Bike');

            instance.registerInstance(Vehicle, vehicle1);

            const car = instance.get(Vehicle);
            instance.registerInstance(Vehicle, vehicle2);
            const bike = instance.get(Vehicle);

            expect(car).toBeDefined();
            expect(bike).toBeDefined();
            expect(car).not.toBe(bike);
        });
    });

    describe('Strategies', () => {
        it('should register the injectable type as a strategy', () => {
            const instance = getInstance();

            instance.register(Strategy1, {
                strategy: 'my-test-strategy',
            });

            const tokens = instance.tokenCache.getStrategyConsumers('my-test-strategy');

            expect(tokens).toBeDefined();
            expect(tokens.length).toBe(1);
        });

        it('should allow registering multiple injectable types under same strategy', () => {
            const instance = getInstance();

            instance
                .register(Strategy1, {
                    strategy: 'my-test-strategy',
                })
                .register(Strategy2, {
                    strategy: 'my-test-strategy',
                });
            const tokens = instance.tokenCache.getStrategyConsumers('my-test-strategy');

            expect(tokens).toBeDefined();
            expect(tokens.length).toBe(2);
        });

        it('should resolve an empty array of strategies when no strategies registered', () => {
            const instance = getInstance();

            instance.register(StrategyOwner, {});

            instance.registerParamForStrategyInjection('my-test-strategy', StrategyOwner, 0);

            const owner = instance.get(StrategyOwner);

            expect(owner).toBeDefined();
            expect(owner.workStrategies).toEqual([]);
        });

        it('should resolve an empty array of strategies when no strategies registered', () => {
            const instance = getInstance();

            const strategies = instance.getStrategies('no-matches');

            expect(strategies).toEqual([]);
        });

        it('should return a single strategy when one has been registered', () => {
            const instance = getInstance();

            instance.register(StrategyOwner, {}).register(Strategy1, {
                strategy: 'my-test-strategy',
            });

            // Lets dynamically setup a @Strategy annotation for first parameter in StrategyOwner's constructor
            Strategy('my-test-strategy')(StrategyOwner, 'strategies', 0);

            const owner = instance.get(StrategyOwner);

            expect(owner).toBeDefined();
            expect(owner.workStrategies.length).toBe(1);
            expect(owner.workStrategies[0] instanceof Strategy1).toBeTruthy();
        });

        it('should return multiple strategies when multiple have been registered', () => {
            const instance = getInstance();

            instance
                .register(StrategyOwner, {})
                .register(Strategy1, {
                    strategy: 'my-test-strategy',
                })
                .register(Strategy2, {
                    strategy: 'my-test-strategy',
                });

            // Lets dynamically setup a @Strategy annotation for first parameter in StrategyOwner's constructor
            Strategy('my-test-strategy')(StrategyOwner, 'strategies', 0);

            const owner = instance.get(StrategyOwner);

            expect(owner).toBeDefined();
            expect(owner.workStrategies.length).toBe(2);
            expect(owner.workStrategies[0] instanceof Strategy1).toBeTruthy();
            expect(owner.workStrategies[1] instanceof Strategy2).toBeTruthy();
        });

        it('should return multiple strategies when multiple have been registered', () => {
            const instance = getInstance();

            instance
                .register(Strategy1, {
                    strategy: 'my-test-strategy',
                })
                .register(Strategy2, {
                    strategy: 'my-test-strategy',
                });

            const strategies = instance.getStrategies('my-test-strategy');

            expect(strategies).toBeDefined();
            expect(strategies.length).toBe(2);
            expect(strategies[0] instanceof Strategy1).toBeTruthy();
            expect(strategies[1] instanceof Strategy2).toBeTruthy();
        });
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

        it('should auto resolve parameters for a factory when not supplied by developer', () => {
            const instance = getInstance();

            instance.register(Car).register(Engine);

            const carFactory = instance.getFactory(Car);
            const car = carFactory.create();

            expect(carFactory).toBeDefined();
            expect(car).toBeDefined();
            expect(car.engine).toBeDefined();
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

    describe('Lazy', () => {
        it('should resolve an instance of lazy when getLazy invoked on any type.', () => {
            const instance = getInstance();

            instance.register(Child);

            const lazy = instance.getLazy(Child);

            expect(lazy instanceof LazyInstance).toBeTruthy();
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

            instance
                .register(Engine)
                .register(Train)
                .registerParamForLazyInjection(Engine, Train, 0);

            const train = instance.get(Train);

            expect(train.engine instanceof LazyInstance).toBeTruthy();
        });
    });

    describe('Resolution', () => {
        it('should resolve an instance of injector if injector.get invoked with type of Injector', () => {
            const instance = getInstance();
            const instance2 = instance.get(Injector);

            expect(instance2).toBeDefined();
            expect(instance).toBe(instance2);
        });

        it('should create an instance of the type', () => {
            const instance = getInstance();

            instance.register(Child);

            const child = instance.get(Child);

            expect(child).toBeDefined();
            expect(instance.cache.instanceCount).toBe(1);
        });

        it('should throw an exception if an attempt to resolve a type that is not registered and constructUndecoratedTypes is set to false (default)', () => {
            const instance = getInstance();
            let exception: any;

            try {
                instance.get(Child);
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeDefined();
            expect(exception.message).toBe(
                `Cannot construct Type 'Child' with ancestry 'Child' the type is either not decorated with @Injectable or injector.register was not called for the type and configuration has constructUndecoratedTypes set to false`,
            );
        });

        it('should NOT throw an exception if an attempt to resolve a type that is not registered and constructUndecoratedTypes is set to true', () => {
            const instance = getInstance();
            let exception: any;
            let child: any;

            // Change the default
            instance.configuration.constructUndecoratedTypes = true;

            try {
                child = instance.get(Child);
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeUndefined();
            expect(child).toBeDefined();
        });

        it('should service subsequent instances of a type from the cache', () => {
            const instance = getInstance();

            instance.register(Child);

            const child = instance.get(Child);
            const child2 = instance.get(Child);
            const child3 = instance.get(Child);

            expect(child).toEqual(child2);
            expect(child).toEqual(child3);
            expect(instance.cache.instanceCount).toBe(1);
        });

        it('should construct a tree of dependencies', () => {
            const instance = getInstance();

            instance
                .register(GrandParent)
                .register(Parent)
                .register(Child);

            const gp = instance.get(GrandParent);

            expect(gp).toBeDefined();
            expect(gp.son).toBeDefined();
            expect(gp.son.daughter).toBeDefined();
        });

        it('should NOT throw exception if dependency in tree is not marked as injectable and constructUndecoratedTypes = true', () => {
            const instance = getInstance();
            let exception: any;

            instance.configuration.constructUndecoratedTypes = true;

            instance
                .register(GrandParent)
                // .register(Parent)
                .register(Child);

            try {
                instance.get(GrandParent);
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeUndefined();
        });

        it('should throw exception if dependency in tree is not marked as injectable and constructUndecoratedTypes = false', () => {
            const instance = getInstance();
            let exception: any;

            instance
                .register(GrandParent)
                // .register(Parent)
                .register(Child);

            try {
                instance.get(GrandParent);
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeDefined();
            expect(exception.message).toBe(
                `Cannot construct Type 'Parent' with ancestry 'GrandParent -> Parent' the type is either not decorated with @Injectable or injector.register was not called for the type and configuration has constructUndecoratedTypes set to false`,
            );
        });

        it('should throw exception if type reaches maximum tree depth', () => {
            const instance = getInstance();
            let exception: any;

            instance.configuration.maxTreeDepth = 3;
            instance.register(NaughtyTurtle);

            try {
                instance.get(NaughtyTurtle);
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeDefined();
            expect(exception.message).toBe(
                `Cannot construct Type 'NaughtyTurtle' with ancestry 'NaughtyTurtle -> NaughtyTurtle -> NaughtyTurtle -> NaughtyTurtle' as too many levels deep`,
            );
        });

        describe('Delegated construction', () => {
            it('should resolve the instance from the externalResolutionStrategy', () => {
                const instance = getInstance();
                let invoked = false;

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, ..._args: any[]) => {
                        invoked = true;
                        return new Child();
                    },
                };

                const child = instance.get(Child);

                expect(child).toBeDefined();
                expect(invoked).toBeTruthy();
                expect(instance.cache.instanceCount).toBe(0); // Cache should not be updated by default.
            });

            it('should resolve the instance from the externalResolutionStrategy and sync into cache if cacheSyncing = true', () => {
                const instance = getInstance();
                let invoked = false;

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, ..._args: any[]) => {
                        invoked = true;
                        return new Child();
                    },
                    cacheSyncing: true,
                };

                const child = instance.get(Child);

                expect(child).toBeDefined();
                expect(invoked).toBeTruthy();
                expect(instance.cache.instanceCount).toBe(1); // Cache should not be updated by default.
            });

            it('should resolve the instance from the externalResolutionStrategy first time only and then service from cache if cacheSyncing = true for subsequent requests', () => {
                const instance = getInstance();
                let invoked = 0;

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, ..._args: any[]) => {
                        ++invoked;
                        return new Child();
                    },
                    cacheSyncing: true,
                };

                const child = instance.get(Child);
                const child2 = instance.get(Child);

                expect(child).toBeDefined();
                expect(child2).toBeDefined();
                expect(child).toBe(child2);
                expect(invoked).toEqual(1);
                expect(instance.cache.instanceCount).toBe(1); // Cache should not be updated by default.
            });
        });
    });
});
