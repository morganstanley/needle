/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* INTERNALS */
import { Configuration } from 'main/core/configuration';
import { Metrics } from 'main/core/metrics';
/* INTERNALS */
import {
    AutoFactory,
    Factory,
    getOptional,
    getRootInjector,
    IConstructionInterceptor,
    IInjectionContext,
    IInjector,
    Inject,
    Injectable,
    Injector,
    Interceptor,
    Lazy,
    LazyInstance,
    Optional,
    Strategy,
} from '../main';
import {
    DI_ROOT_INJECTOR_KEY,
    NULL_VALUE,
    TYPE_NOT_FOUND,
    UNDEFINED_VALUE,
    AUTO_RESOLVE,
} from '../main/constants/constants';
import { InstanceCache } from '../main/core/cache';
import { isInjectorLike } from '../main/core/guards';
import { InjectionTokensCache } from '../main/core/tokens';

export abstract class Individual {
    public id = Math.floor(Math.random() * 100000 + 1);
}

export abstract class Student extends Individual {}

interface IStrategy {}

//no metadata test
abstract class Pet {
    public animalType = 'unknown';
}

class Dog extends Pet {
    public animalType = 'Dog';
}

class Cat extends Pet {
    public animalType = 'Cat';
    public breed = 'Ginger';
}

//no metadata test
class Owner {
    constructor(public dog: Dog, public cat: Cat) {}
}

@Injectable({
    strategy: 'work-strategies',
})
export class Strategy1 implements IStrategy {}

// tslint:disable-next-line:max-classes-per-file
@Injectable({
    strategy: 'work-strategies',
})
export class Strategy2 implements IStrategy {}

@Injectable()
export class StrategyOwner {
    constructor(@Strategy('work-strategies') public workStrategies: IStrategy[]) {}
}

@Injectable({
    tokens: ['geography-student'],
})
export class GeographyStudent extends Student {}

@Injectable()
export class GeographyTeacher extends Individual {
    constructor(@Inject('geography-student') public student: Student) {
        super();
    }
}

@Injectable()
export class HistoryTeacher extends Individual {
    constructor(@Inject('history-student') public student: Student) {
        super();
    }
}

@Injectable()
export class Child extends Individual {
    public age = 7;
}

@Injectable()
export class AdoptedChild extends Child {}

@Injectable({
    tokens: ['father', 'mother'],
})
export class Parent extends Individual {
    constructor(public daughter: Child) {
        super();
    }
}

@Injectable()
export class GrandParent extends Individual {
    constructor(public son: Parent) {
        super();
    }
}

@Injectable()
class NaughtyTurtle {
    constructor(public child: NaughtyTurtle) {}
}

@Injectable()
class SecurityToken {
    constructor(@Inject('raw-token') public rawToken: string) {}
}

@Injectable()
class Payload {
    constructor(@Inject('data-token') public jsonData: any) {}
}

@Injectable()
class Vehicle {
    constructor(public type: 'Bike' | 'Car' | 'Bus' | 'Train') {}
}

@Injectable()
class Engine {}

@Injectable()
class Car extends Vehicle {
    constructor(@Optional() public engine: Engine) {
        super('Car');
    }
}

@Injectable()
class Bus extends Vehicle {
    constructor(public engine: Engine, public capacity: number) {
        super('Car');
    }
}

@Injectable()
class Train extends Vehicle {
    constructor(@Lazy(Engine) public engine: LazyInstance<typeof Engine>) {
        super('Train');
    }
}

@Injectable()
class CarManufacturer {
    public cars = new Array<Car>();

    constructor(@Factory(Car) private carFactory: AutoFactory<typeof Car>) {}

    public makeCar(): Car {
        const car = this.carFactory.create();
        this.cars.push(car);
        return car;
    }
}

@Interceptor()
export class EngineInterceptor implements IConstructionInterceptor<typeof Engine> {
    public beforeInvocation = new Array<IInjectionContext<typeof Engine>>();
    public afterInvocation = new Array<{ instance: Engine; context: IInjectionContext<typeof Engine> }>();

    public target: typeof Engine = Engine;
    public beforeCreate(context: IInjectionContext<typeof Engine>): void {
        this.beforeInvocation.push(context);
    }
    public afterCreate(instance: Engine, context: IInjectionContext<typeof Engine>): void {
        this.afterInvocation.push({ instance, context });
    }
}

describe('Injector', () => {
    beforeEach(() => {
        (window as any)[DI_ROOT_INJECTOR_KEY] = new Injector(
            new InstanceCache(),
            new Configuration(),
            new InjectionTokensCache(),
            new Metrics(),
        );
    });

    const createScopes = (injector: IInjector, depth: number) => {
        for (let index = 1; index <= depth; index++) {
            injector = injector.createScope(`level-${index}`);
        }
    };

    const getInstance = (resetInjector = true, scopes = 0) => {
        if (resetInjector) {
            getRootInjector().reset();
        }

        const injector = getRootInjector();

        if (scopes > 0) {
            createScopes(injector, scopes);
        }

        return getRootInjector();
    };

    describe('Functions', () => {
        it('should return true if the type is injectorLike', () => {
            const instance = getInstance();

            const result = isInjectorLike(instance);

            expect(result).toBeTruthy();
        });

        it('should return false if the type is not injectorLike', () => {
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
                message = ex.message;
            }

            expect(
                message.indexOf(
                    'Invalid operation, the current injector instance is marked as destroyed. Injector Id: [',
                ) !== -1,
            ).toBeTrue();
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
        it('should resolve an instance of the type by token (string)', () => {
            const instance = getInstance();

            instance.register(Child, {
                tokens: ['child'],
            });

            const child = instance.get<typeof Child>('child');

            expect(child).toBeDefined();
        });

        it('should resolve an instance of the type by token (string) and no type info pass returns ANY', () => {
            const instance = getInstance();

            instance.register(Child, {
                tokens: ['child'],
            });

            const child = instance.get('child');

            expect(child).toBeDefined();
        });

        it('should resolve an instance of the type by token (symbol)', () => {
            const instance = getInstance();

            const symbol = Symbol.for('child');

            instance.register(Child, {
                tokens: [symbol],
            });

            const child = instance.get<typeof Child>(symbol);

            expect(child).toBeDefined();
        });

        it('should resolve the correct instance based on the token defined in the @Inject annotation (string)', () => {
            const instance = getInstance();

            instance
                .register(GeographyTeacher)
                .register(GeographyStudent, { tokens: ['geography-student'] })
                .registerParamForTokenInjection('geography-student', GeographyTeacher, 0);

            const geographyTeacher = instance.get(GeographyTeacher);

            expect(geographyTeacher).toBeDefined();
            expect(geographyTeacher.student).toBeDefined();
            expect(geographyTeacher.student instanceof GeographyStudent).toBeTruthy();
        });

        it('should resolve the correct instance based on the token defined in the @Inject annotation (symbol)', () => {
            const instance = getInstance();

            const symbol = Symbol.for('geography-student');

            instance
                .register(GeographyTeacher)
                .register(GeographyStudent, { tokens: [symbol] })
                .registerParamForTokenInjection(symbol, GeographyTeacher, 0);

            const geographyTeacher = instance.get(GeographyTeacher);

            expect(geographyTeacher).toBeDefined();
            expect(geographyTeacher.student).toBeDefined();
            expect(geographyTeacher.student instanceof GeographyStudent).toBeTruthy();
        });

        it('should resolve an instance of the type using multiple tokens', () => {
            const instance = getInstance();

            const symbol = Symbol.for('daughter');

            instance.register(Child, {
                tokens: ['child', 'son', symbol],
            });

            const child = instance.get<typeof Child>('child');
            const son = instance.get<typeof Child>('son');
            const daughter = instance.get<typeof Child>(symbol);

            expect(child).toBeDefined();
            expect(son).toBeDefined();
            expect(daughter).toBeDefined();

            expect(child).toBe(son);
            expect(daughter).toBe(son);
        });

        it('should throw an error if we try and register two types sharing the same String token and allowDuplicateTokens=false.', () => {
            const instance = getInstance();

            instance.configuration.allowDuplicateTokens = false;
            let message = '';

            instance.register(Child, {
                tokens: ['child'],
            });

            try {
                instance.register(Parent, {
                    tokens: ['child'],
                });
            } catch (ex) {
                message = ex.message;
            }

            expect(message).toBe(
                "Cannot register Type [Parent] with token 'child'. Duplicate token found for the following type [Child]",
            );
        });

        it('should throw an error if we try and register two types sharing the same Symbol token and allowDuplicateTokens=false.', () => {
            const instance = getInstance();

            const symbol = Symbol.for('child');
            instance.configuration.allowDuplicateTokens = false;
            let message = '';

            instance.register(Child, {
                tokens: [symbol],
            });

            try {
                instance.register(Parent, {
                    tokens: [symbol],
                });
            } catch (ex) {
                message = ex.message;
            }

            expect(message).toBe(
                "Cannot register Type [Parent] with token 'Symbol(child)'. Duplicate token found for the following type [Child]",
            );
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
    });

    describe('Values', () => {
        it('should throw and error if no tokens provided', () => {
            const instance = getInstance();
            let error: any;

            try {
                instance.registerValue<string>({
                    tokens: [],
                    value: 'myvalue',
                });
            } catch (ex) {
                error = ex;
            }

            expect(error).toBeDefined();
            expect(error.message).toBe('All values must be registered with a given token');
        });

        it('should register and resolve the value of type [String]', () => {
            const instance = getInstance();

            instance.registerValue<string>({
                tokens: ['mystring'],
                value: 'myvalue',
            });

            const value = instance.get('mystring');

            expect(value).toBeDefined();
            expect(value).toBe('myvalue');
        });

        it('should register and resolve the value of type [Number]', () => {
            const instance = getInstance();

            instance.registerValue<number>({
                tokens: ['answer-to-everything'],
                value: 42,
            });

            const value = instance.get<number>('answer-to-everything');

            expect(value).toBeDefined();
            expect(value).toBe(42);
        });

        it('should register and resolve the value of type [Date]', () => {
            const instance = getInstance();

            instance.registerValue<Date>({
                tokens: ['battle-of-hastings'],
                value: new Date('14 Oct 1066'),
            });

            const value = instance.get<Date>('battle-of-hastings');

            expect(value).toBeDefined();
            expect(value.getDate()).toBe(14);
            expect(value.getMonth()).toBe(9);
            expect(value.getFullYear()).toBe(1066);
        });

        it('should register and resolve the value of type [Function]', () => {
            const instance = getInstance();

            let invoked = false;

            // eslint-disable-next-line @typescript-eslint/ban-types
            instance.registerValue<Function>({
                tokens: ['my-func'],
                value: () => (invoked = true),
            });

            // eslint-disable-next-line @typescript-eslint/ban-types
            const value = instance.get<Function>('my-func');
            value();

            expect(typeof value === 'function').toBeTrue();
            expect(invoked).toBeTrue();
        });

        it('should register and resolve the value of type [Boolean]', () => {
            const instance = getInstance();

            instance.registerValue<boolean>({
                tokens: ['flag'],
                value: true,
            });

            const value = instance.get<boolean>('flag');

            expect(value).toBeTrue();
        });

        it('should register and resolve the value of type [RegEx]', () => {
            const instance = getInstance();

            instance.registerValue<RegExp>({
                tokens: ['regular-expression'],
                value: new RegExp('@'),
            });

            const value = instance.get<RegExp>('regular-expression');

            expect(value).toBeDefined();
        });

        it('should register and resolve the value of type [Error]', () => {
            const instance = getInstance();

            instance.registerValue<Error>({
                tokens: ['error-token'],
                value: new Error('oops'),
            });

            const value = instance.get<Error>('error-token');

            expect(value).toBeDefined();
            expect(value.message).toBe('oops');
        });

        it('should register and resolve the value of type [Array]', () => {
            const instance = getInstance();

            instance.registerValue<Array<any>>({
                tokens: ['array-token'],
                value: [1, 2, 3],
            });

            const value = instance.get<Array<any>>('array-token');

            expect(value).toBeDefined();
            expect(value).toEqual([1, 2, 3]);
        });

        it('should register and resolve the value of type [JSON]', () => {
            const instance = getInstance();
            const jsonData = {
                name: 'test',
            };

            // eslint-disable-next-line @typescript-eslint/ban-types
            instance.registerValue<object>({
                tokens: ['json-token'],
                value: jsonData,
            });

            // eslint-disable-next-line @typescript-eslint/ban-types
            const value = instance.get<object>('json-token');

            expect(value).toBeDefined();
            expect(value).toBe(jsonData);
        });

        it('should use the resolver config if provided to resolve the value', () => {
            const instance = getInstance();

            instance.registerValue<string>({
                tokens: ['value-1'],
                value: {
                    cacheSyncing: true,
                    resolver: _injector => 'my-test',
                },
            });

            const value = instance.get<string>('value-1');

            expect(value).toBe('my-test');
        });

        it('should use the resolver config if provided to resolve the value', () => {
            const instance = getInstance();
            const regex = new RegExp('@');

            instance.registerValue<RegExp>({
                tokens: ['value-1'],
                value: {
                    cacheSyncing: true,
                    resolver: _injector => regex,
                },
            });

            const value = instance.get<RegExp>('value-1');

            expect(value).toBe(regex);
        });

        it('should regenerate the value if the resolver config does not enable caching', () => {
            const instance = getInstance();

            let counter = 0;

            instance.registerValue<number>({
                tokens: ['value-1'],
                value: {
                    cacheSyncing: false,
                    resolver: _injector => ++counter,
                },
            });

            const value1 = instance.get<number>('value-1');
            const value2 = instance.get<number>('value-1');
            const value3 = instance.get<number>('value-1');

            expect(value1).toBe(1);
            expect(value2).toBe(2);
            expect(value3).toBe(3);
        });

        it('should register multiple values and resolve each without issue', () => {
            const instance = getInstance();

            instance.registerValue<boolean>({
                tokens: ['value-1'],
                value: true,
            });

            instance.registerValue<string>({
                tokens: ['value-2'],
                value: 'my-test',
            });

            instance.registerValue<number>({
                tokens: ['value-3'],
                value: 13,
            });

            const value1 = instance.get<boolean>('value-1');
            const value2 = instance.get<string>('value-2');
            const value3 = instance.get<number>('value-3');

            expect(value1).toBe(true);
            expect(value2).toBe('my-test');
            expect(value3).toBe(13);
        });

        it('should inject the value into parent type [string]', () => {
            const instance = getInstance();

            instance
                .register(SecurityToken)
                .registerParamForTokenInjection('raw-token', SecurityToken, 0)
                .registerValue<string>({
                    tokens: ['raw-token'],
                    value: 'ABDCEF-12345',
                });

            const securityToken = instance.get(SecurityToken);

            expect(securityToken).toBeDefined();
            expect(securityToken.rawToken).toBe('ABDCEF-12345');
        });

        it('should inject the value into parent type [object]', () => {
            const instance = getInstance();
            const jsonData = {
                test: 'data',
            };

            instance
                .register(Payload)
                .registerParamForTokenInjection('data-token', Payload, 0)
                // eslint-disable-next-line @typescript-eslint/ban-types
                .registerValue<object>({
                    tokens: ['data-token'],
                    value: jsonData,
                });

            const payload = instance.get(Payload);

            expect(payload).toBeDefined();
            expect(payload.jsonData).toBe(jsonData);
        });

        it('should throw an error if value registered twice under same token and allowDuplicateTokens not enabled', () => {
            const instance = getInstance();
            let error: any;

            instance.registerValue<string>({
                tokens: ['my-value'],
                value: 'my-test-value',
            });

            try {
                instance.registerValue<string>({
                    tokens: ['my-value'],
                    value: 'another value',
                });
            } catch (ex) {
                error = ex;
            }

            expect(error).toBeDefined();
            expect(error.message).toBe(
                `Cannot register Type [class_1] with token 'my-value'. Duplicate token found for the following type [class_1]`,
            );
        });
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
    });

    describe('Strategies', () => {
        it('should register the injectable type as a strategy (String token)', () => {
            const instance = getInstance();

            instance.register(Strategy1, {
                strategy: 'my-test-strategy',
            });

            const tokens = instance.tokenCache.getStrategyConsumers('my-test-strategy');

            expect(tokens).toBeDefined();
            expect(tokens.length).toBe(1);
        });

        it('should register the injectable type as a strategy (Symbol token)', () => {
            const instance = getInstance();
            const strategySymbol = Symbol.for('my-test-strategy');

            instance.register(Strategy1, {
                strategy: strategySymbol,
            });

            const tokens = instance.tokenCache.getStrategyConsumers(strategySymbol);

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

        it('should return multiple strategies when multiple have been registered (String token)', () => {
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

        it('should return multiple strategies when multiple have been registered (Symbol token)', () => {
            const instance = getInstance();
            const strategySymbol = Symbol.for('my-test-strategy');

            instance
                .register(Strategy1, {
                    strategy: strategySymbol,
                })
                .register(Strategy2, {
                    strategy: strategySymbol,
                });

            const strategies = instance.getStrategies(strategySymbol);

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

            instance
                .register(Engine)
                .register(Train)
                .registerParamForLazyInjection(Engine, Train, 0);

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
                message = ex.message;
            }

            expect(message).toBe(
                `Cannot construct Type 'Parent' with ancestry 'GrandParent -> Parent' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
            );
        });

        it('should resolve undefined instance for parameter decorated with @Optional and has NOT been registered', () => {
            const instance = getInstance();

            instance
                .register(GrandParent)
                .register(Parent)
                .registerParamForOptionalInjection(Parent, 0);

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

        it('should create an instance of the type using local resolution strategy', () => {
            const instance = getInstance();
            let invoked = false;

            instance.register(Child, {
                resolution: {
                    resolver: (_injector, _args) => {
                        invoked = true;
                        return new Child();
                    },
                    cacheSyncing: true,
                },
            });

            const child = instance.get(Child);

            expect(child).toBeDefined();
            expect(invoked).toBeTrue();
            expect(instance.cache.instanceCount).toBe(1);
        });

        it('should return an instance of a subtype in place of a super type using external resolver config', () => {
            const instance = getInstance();
            let invoked = false;

            instance.register(Individual, {
                resolution: {
                    resolver: (_injector, _args) => {
                        invoked = true;
                        return new Child();
                    },
                    cacheSyncing: true,
                },
            });

            const individual = instance.get(Individual);

            expect(individual).toBeDefined();
            expect(individual.id).toBeDefined();
            expect(individual instanceof Child).toBeTrue();
            expect(invoked).toBeTrue();
            expect(instance.cache.instanceCount).toBe(1);
        });

        it('should return an instance of a subtype in place of a super type using just the subtype', () => {
            const instance = getInstance();

            instance.register(Child).register(Individual, {
                resolution: Child,
            });

            const individual = instance.get(Individual);

            expect(individual).toBeDefined();
            expect(individual.id).toBeDefined();
            expect(individual instanceof Child).toBeTrue();
            expect(instance.cache.instanceCount).toBe(2); // Child and the Individual
            expect(instance.cache.resolve(Individual)).toBe(instance.cache.resolve(Child)); // Same references for Subtype and SuperType in cache
        });

        it('should throw an exception if an attempt to resolve a type that is not registered', () => {
            const instance = getInstance();
            let exception: any;

            try {
                instance.get(Child);
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeDefined();
            expect(exception.message).toBe(
                `Cannot construct Type 'Child' with ancestry 'Child' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
            );
        });

        it('should resolve a type that is using explicit metadata', () => {
            const instance = getInstance();

            const owner = instance
                .register(Owner, { metadata: [Dog, Cat] })
                .register(Dog)
                .register(Cat)
                .get(Owner);

            expect(owner).toBeDefined();
            expect(owner.dog).toBeDefined();
            expect(owner.cat).toBeDefined();
        });

        it('should return undefined for deps', () => {
            const instance = getInstance();

            const owner = instance
                .register(Owner)
                .register(Dog)
                .register(Cat)
                .get(Owner);

            expect(owner).toBeDefined();
            expect(owner.dog).toBeUndefined();
            expect(owner.cat).toBeUndefined();
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

        it('should throw exception if dependency in tree is not marked as injectable', () => {
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
                `Cannot construct Type 'Parent' with ancestry 'GrandParent -> Parent' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
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
                `Cannot construct Type 'NaughtyTurtle' with ancestry 'NaughtyTurtle -> NaughtyTurtle -> NaughtyTurtle -> NaughtyTurtle' as max tree depth has been reached`,
            );
        });

        describe('Delegated construction', () => {
            it('should resolve the instance from the externalResolutionStrategy', () => {
                const instance = getInstance();
                let invoked = false;
                let injector: IInjector;

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, currentInjector: IInjector, ..._args: any[]) => {
                        invoked = true;
                        injector = currentInjector;
                        return new Child();
                    },
                };

                const child = instance.get(Child);

                expect(child).toBeDefined();
                expect(injector!).toBeDefined();
                expect(injector! === instance).toBeTruthy();
                expect(invoked).toBeTruthy();
                expect(instance.cache.instanceCount).toBe(0); // Cache should not be updated by default.
            });

            it('should fallback to our injector if the external resolver returns NOT_FOUND and it was correctly registered with the Injector', () => {
                const instance = getInstance();
                let invoked = false;
                instance.register(Child);

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, _currentInjector: IInjector, ..._args: any[]) => {
                        invoked = true;
                        return TYPE_NOT_FOUND;
                    },
                };

                const child = instance.get(Child);

                expect(child).toBeDefined();
                expect(invoked).toBeTruthy();
                expect(instance.cache.instanceCount).toBe(1); // Cache should not be updated by default.
            });

            it('should throw exception if fallback to our injector and no registration found', () => {
                const instance = getInstance();
                let invoked = false;
                let message = '';

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, _currentInjector: IInjector, ..._args: any[]) => {
                        invoked = true;
                        return TYPE_NOT_FOUND;
                    },
                };

                try {
                    instance.get(Child);
                } catch (ex) {
                    message = ex.message;
                }

                expect(invoked).toBeTruthy();
                expect(message).toBe(
                    `Cannot construct Type 'Child' with ancestry 'Child' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
                );
                expect(instance.cache.instanceCount).toBe(0); // Cache should not be updated by default.
            });

            it('should resolve the instance from the externalResolutionStrategy and sync into cache if cacheSyncing = true', () => {
                const instance = getInstance();
                let invoked = false;
                instance.register(Child);

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
                instance.register(Child);

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

            instance
                .register(GrandParent)
                .register(Parent)
                .register(Child);

            instance.get(GrandParent);
            instance.metrics.dump();

            const result = instance.metrics.getMetricsForType(GrandParent);

            expect(result!.dependencyCount).toBe(1);
        });

        it('should update the last resolution time', done => {
            const instance = getInstance();

            instance.register(Child);

            instance.get(Child);
            const firstResolutionTime = instance.metrics.data[0].lastResolution;

            setTimeout(() => {
                instance.get(Child);
                expect(instance.metrics.data[0].lastResolution.getTime()).toBeGreaterThan(
                    firstResolutionTime.getTime(),
                );
                done();
            }, 50);
        });

        describe('Scoping', () => {
            it('should record metrics correctly for each scope', () => {
                const instance = getInstance();

                instance
                    .register(GrandParent)
                    .register(Parent)
                    .register(Child);

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

                instance
                    .register(GrandParent)
                    .register(Parent)
                    .register(Child);

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

            it('should record metrics correctly for correct parent scope when instance resolved from parent rather than local', () => {
                const instance = getInstance();

                instance
                    .register(GrandParent)
                    .register(Parent)
                    .register(Child);

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

    function getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    describe('Depth Tests', () => {
        const testCount = 10;

        type ITestRun = { depth: number; registrationLevel: number; resolutionLevel: number };

        const generateTestExecutionData = (depthOfTree = 30) => {
            const testData = new Array<ITestRun>();

            while (testData.length < testCount) {
                const depth = getRandomInt(1, depthOfTree);
                const registrationLevel = getRandomInt(1, depth);
                const resolutionLevel = getRandomInt(registrationLevel, depth);

                if (registrationLevel !== resolutionLevel) {
                    testData.push({ depth, registrationLevel, resolutionLevel });
                }
            }

            return testData;
        };

        const getTestInfoAsText = (test: ITestRun) =>
            `Tree depth: [${test.depth}], Registration: [${test.registrationLevel}], Scope: [${test.resolutionLevel}] `;

        it('should return a new instances when scope created', () => {
            const instance = getInstance();

            const scoped = instance.createScope('test-scope');

            expect(scoped).toBeDefined();
            expect(scoped.id).not.toBe(instance.id);
            expect(scoped.getRegisteredTypes()).toEqual([]);
            expect(scoped.isRoot()).toBeFalsy();
            expect(scoped.isScoped).toBeTruthy();
            expect(scoped.parent).toBeDefined();
            expect(scoped.parent!.id).toBe(instance.id);
            expect(scoped.name).toBe('test-scope');
            expect(scoped.cache.instanceCount).toBe(0);
        });

        it('should resolve a type if the parent injector has a valid registration.', () => {
            const instance = getInstance();
            instance.register(Child);

            const scoped = instance.createScope('test-scope');
            const child = scoped.get(Child);

            expect(child).toBeDefined();
        });

        it('should resolve a scope based on its name an Id', () => {
            const instance = getInstance();
            instance.register(Child);

            const scope = instance.createScope('test-scope');
            const namedScope = instance.getScope('test-scope');
            const idScope = instance.getScope(scope.id);
            expect(namedScope).toBeDefined();
            expect(idScope).toBeDefined();
            expect(idScope === namedScope).toBeTrue();
        });

        it('should return undefined if scope is not found', () => {
            const instance = getInstance();
            instance.register(Child);

            instance.createScope('test-scope');
            const noMatchScope = instance.getScope('NO_MATCH');

            expect(noMatchScope).toBeUndefined();
        });

        describe('Ancestry', () => {
            describe('Resolution', () => {
                describe('Resolve instance from ancestor with explicit metadata', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should resolve using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance
                                .getScope(`level-${test.registrationLevel}`)!
                                .register(Owner, { metadata: [Dog, Cat] })
                                .register(Dog)
                                .register(Cat);

                            const owner = instance.getScope(`level-${test.resolutionLevel}`)!.get(Owner);

                            expect(owner).toBeDefined();
                        });
                    });
                });

                describe('Resolve instance from ancestor', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should resolve using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance.getScope(`level-${test.registrationLevel}`)!.register(Child);

                            const child = instance.getScope(`level-${test.resolutionLevel}`)!.get(Child);

                            expect(child).toBeDefined();
                        });
                    });
                });

                describe('Resolve instance from ancestor using token', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should resolve instance using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance.getScope(`level-${test.registrationLevel}`)!.register(Child, {
                                tokens: ['ancestor-token'],
                            });

                            const child = instance.getScope(`level-${test.resolutionLevel}`)!.get('ancestor-token');

                            expect(child).toBeDefined();
                        });
                    });
                });

                describe('Resolve value from ancestor using token', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should resolve value using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance.getScope(`level-${test.registrationLevel}`)!.registerValue<string>({
                                tokens: ['ancestor-token'],
                                value: 'ancestor',
                            });

                            const ancestorValue = instance
                                .getScope(`level-${test.resolutionLevel}`)!
                                .get('ancestor-token');

                            expect(ancestorValue).toBeDefined();
                            expect(ancestorValue).toBe('ancestor');
                        });
                    });
                });

                describe('Resolve strategy from ancestor', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should resolve strategies using ancestors registration - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            injector.register(StrategyOwner, {}).register(Strategy1, {
                                strategy: 'my-test-strategy',
                            });

                            // Lets dynamically setup a @Strategy annotation for first parameter in StrategyOwner's constructor
                            Strategy('my-test-strategy')(StrategyOwner, 'strategies', 0);

                            const owner = instance.getScope(`level-${test.resolutionLevel}`)!.get(StrategyOwner);

                            expect(owner.workStrategies.length).toBe(1);
                            expect(owner.workStrategies[0] instanceof Strategy1).toBeTruthy();
                        });
                    });
                });

                describe('Resolve factory from ancestor', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should resolve factory using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance.getScope(`level-${test.registrationLevel}`)!.register(Child);

                            const child = instance
                                .getScope(`level-${test.resolutionLevel}`)!
                                .getFactory(Child)
                                .create();

                            expect(child).toBeDefined();
                        });
                    });
                });

                describe('Resolve lazy from ancestor', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should resolve lazy.value using ancestors registration - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance.getScope(`level-${test.registrationLevel}`)!.register(Child);

                            const child = instance.getScope(`level-${test.resolutionLevel}`)!.getLazy(Child).value;

                            expect(child).toBeDefined();
                        });
                    });
                });
            });

            describe('Destroy', () => {
                describe('with parent (In middle of tree) where destroy is invoked', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should resolve using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);
                            const parent = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scope = parent.getScope(`level-${test.resolutionLevel}`)!;
                            const destroyed = scope.isDestroyed();
                            parent.destroy();

                            expect(destroyed).not.toBe(scope.isDestroyed());
                            expect(scope.isDestroyed()).toBeTrue();
                            expect(parent.children.has(scope.id)).toBeFalse();
                        });
                    });
                });
            });

            describe('Interception', () => {
                describe('with interceptor registered in parent and type resolved from scope', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should intercept the construction - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);
                            const parent = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scope = parent.getScope(`level-${test.resolutionLevel}`)!;
                            const interceptor = new EngineInterceptor();

                            parent.registerInterceptor(interceptor);
                            parent.register(Engine);
                            const registration = parent.getRegistrationForType(Engine);

                            const engine = scope.get(Engine);

                            expect(engine).toBeDefined();
                            expect(interceptor.beforeInvocation.length).toBe(1);
                            expect(interceptor.beforeInvocation[0]).toBeDefined();
                            expect(interceptor.beforeInvocation[0].configuration).toBe(registration!);
                            expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
                            expect(interceptor.beforeInvocation[0].injector).toBe(parent);
                            expect(interceptor.beforeInvocation[0].type).toBe(Engine);

                            expect(interceptor.afterInvocation.length).toBe(1);
                            expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
                            expect(interceptor.afterInvocation[0].context).toBeDefined();
                            expect(interceptor.afterInvocation[0].context.configuration).toBe(registration!);
                            expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
                            expect(interceptor.afterInvocation[0].context.injector).toBe(parent);
                            expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
                        });
                    });
                });

                describe('with interceptor registered in scope and type resolved from parent', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should intercept the construction - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);
                            const parent = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scope = parent.getScope(`level-${test.resolutionLevel}`)!;
                            const interceptor = new EngineInterceptor();

                            scope.registerInterceptor(interceptor);
                            parent.register(Engine);
                            const registration = parent.getRegistrationForType(Engine);

                            const engine = scope.get(Engine);

                            expect(engine).toBeDefined();
                            expect(interceptor.beforeInvocation.length).toBe(1);
                            expect(interceptor.beforeInvocation[0]).toBeDefined();
                            expect(interceptor.beforeInvocation[0].configuration).toBe(registration!);
                            expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
                            expect(interceptor.beforeInvocation[0].injector).toBe(parent);
                            expect(interceptor.beforeInvocation[0].type).toBe(Engine);

                            expect(interceptor.afterInvocation.length).toBe(1);
                            expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
                            expect(interceptor.afterInvocation[0].context).toBeDefined();
                            expect(interceptor.afterInvocation[0].context.configuration).toBe(registration!);
                            expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
                            expect(interceptor.afterInvocation[0].context.injector).toBe(parent);
                            expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
                        });
                    });
                });

                describe('with interceptor registered directly in root and type resolved from parent and scope', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should intercept the construction only once - ${getTestInfoAsText(test)}`, () => {
                            const root = getInstance(true, test.depth);
                            const parent = root.getScope(`level-${test.registrationLevel}`)!;
                            const scope = parent.getScope(`level-${test.resolutionLevel}`)!;
                            const interceptor = new EngineInterceptor();

                            root.registerInterceptor(interceptor);
                            parent.register(Engine);
                            const registration = parent.getRegistrationForType(Engine);

                            const engine = scope.get(Engine);
                            const engine2 = scope.get(Engine);

                            expect(engine).toBeDefined();
                            expect(engine2).toBeDefined();
                            expect(engine2 === engine).toBeTruthy();
                            expect(interceptor.beforeInvocation.length).toBe(1);
                            expect(interceptor.beforeInvocation[0]).toBeDefined();
                            expect(interceptor.beforeInvocation[0].configuration).toBe(registration!);
                            expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
                            expect(interceptor.beforeInvocation[0].injector).toBe(parent);
                            expect(interceptor.beforeInvocation[0].type).toBe(Engine);

                            expect(interceptor.afterInvocation.length).toBe(1);
                            expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
                            expect(interceptor.afterInvocation[0].context).toBeDefined();
                            expect(interceptor.afterInvocation[0].context.configuration).toBe(registration!);
                            expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
                            expect(interceptor.afterInvocation[0].context.injector).toBe(parent);
                            expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
                        });
                    });
                });
            });

            describe('Overriding', () => {
                describe('with registerInstance() override in a scope', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`should resolve the instance from the local scope ignoring the instance already resolved in parent scopes - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const ancestralInjector = instance
                                .getScope(`level-${test.registrationLevel}`)!
                                .register(Child);

                            const child = ancestralInjector.get(Child);

                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;
                            scoped.registerInstance(Child, new Child());
                            const scopedChild = scoped.get(Child);

                            expect(child === scopedChild).toBeFalsy();
                        });
                    });
                });

                describe('with registerValue() override in a scope', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`should resolve the value from the local scope ignoring the value already resolved in parent scopes - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const ancestralInjector = instance
                                .getScope(`level-${test.registrationLevel}`)!
                                .registerValue<string>({
                                    tokens: ['my-value'],
                                    value: 'value-parent',
                                });

                            const value1 = ancestralInjector.get('my-value');
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;

                            scoped.registerValue<string>({
                                tokens: ['my-value'],
                                value: 'value-child',
                            });

                            const value2 = scoped.get('my-value');

                            expect(value1 === value2).toBeFalsy();
                        });
                    });
                });

                describe('with register.strategies override in a scope', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`should resolve a different set of strategies ignoring those already resolved in the parent scopes (string token)- ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;

                            injector.register(Strategy1, {
                                strategy: 'my-test-strategy',
                            });

                            scoped.register(Strategy1, {
                                strategy: 'my-test-strategy',
                            });

                            const ancestorStrategies = injector.getStrategies('my-test-strategy');
                            const scopedStrategies = scoped.getStrategies('my-test-strategy');

                            expect(ancestorStrategies.length).toBe(1);
                            expect(scopedStrategies.length).toBe(1);
                            expect(scopedStrategies[0] === ancestorStrategies[0]).toBeFalsy();
                        });
                    });
                });

                describe('with register.tokens override in a scope', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`should resolve the instance from local scope using a String token ignoring the instance already resolved in parent scopes - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);
                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;

                            injector.register(Child, {
                                tokens: ['child-instance'],
                            });

                            scoped.register(Child, {
                                tokens: ['child-instance'],
                            });

                            const ancestorChild = injector.get('child-instance');
                            const scopeChild = scoped.get('child-instance');

                            expect(ancestorChild).toBeDefined();
                            expect(scopeChild).toBeDefined();
                            expect(ancestorChild).not.toBe(scopeChild);
                        });
                    });

                    generateTestExecutionData().forEach(test => {
                        it(`should resolve the instance from local scope using a Symbol token ignoring the instance already resolved in parent scopes - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);
                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;
                            const childSymbol = Symbol.for('child-instance');

                            injector.register(Child, {
                                tokens: ['child-instance'],
                            });

                            scoped.register(Child, {
                                tokens: [childSymbol],
                            });

                            const ancestorChild = injector.get<Child>('child-instance');
                            const scopeChild = scoped.get<Child>(childSymbol);

                            expect(ancestorChild).toBeDefined();
                            expect(scopeChild).toBeDefined();
                            expect(ancestorChild).not.toBe(scopeChild);
                        });
                    });
                });

                describe('with type registered in local scope and registrar.getLazy invoked', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should resolve an instance from the local scope ignoring parent scopes - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;

                            injector.register(Child);

                            scoped.register(Child);

                            const ancestorChild = injector.getLazy(Child).value;
                            const scopeChildLazy = scoped.getLazy(Child);

                            expect(scopeChildLazy.hasValue).toBeFalse();
                            expect(scopeChildLazy.value).toBeDefined();
                            expect(scopeChildLazy.value).not.toBe(ancestorChild);
                        });
                    });
                });

                describe('with type registered in local scope with scoped dependency and registrar.getFactory invoked', () => {
                    generateTestExecutionData().forEach(test => {
                        it(`Should resolve an new instance with each instance having a scoped shared dependency - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;

                            injector.register(Parent).register(Child);

                            scoped.register(Parent).register(Child);

                            const parentFactory = injector.getFactory(Parent);
                            const scopedFactory = scoped.getFactory(Parent);

                            const parentInstance1 = parentFactory.create();
                            const parentInstance2 = parentFactory.create();
                            const scopedInstance1 = scopedFactory.create();
                            const scopedInstance2 = scopedFactory.create();

                            expect(parentInstance1).toBeDefined();
                            expect(parentInstance2).toBeDefined();
                            expect(scopedInstance1).toBeDefined();
                            expect(scopedInstance2).toBeDefined();
                            expect(scopedInstance1 === scopedInstance2).toBeFalse();
                            expect(scopedInstance1 === parentInstance1).toBeFalse();
                            expect(scopedInstance1.daughter === parentInstance1.daughter).toBeFalse();
                            expect(scopedInstance1.daughter === scopedInstance2.daughter).toBeTrue();
                        });
                    });
                });
            });
        });
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

            root.register(Engine)
                .createScope('scoped')
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

            [interceptor1, interceptor2, interceptor3].forEach(interceptor => {
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
