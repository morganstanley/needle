 

/**
 * Shared fixtures and helpers for the injector specs (see main/core/injector*.spec.ts)
 */
import { Configuration } from '../main/core/configuration.js';
import { Metrics } from '../main/core/metrics.js';
import {
    AutoFactory,
    Factory,
    getRootInjector,
    IConstructionInterceptor,
    IDestroyable,
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
} from '../main/index.js';
import { DI_ROOT_INJECTOR_KEY } from '../main/constants/constants.js';
import { InstanceCache } from '../main/core/cache.js';
import { InjectionTokensCache } from '../main/core/tokens.js';

export abstract class Individual {
    public id = Math.floor(Math.random() * 100000 + 1);
}

export abstract class Student extends Individual {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IStrategy {}

//no metadata test
export abstract class Pet {
    public animalType = 'unknown';
}

export class Dog extends Pet {
    public animalType = 'Dog';
}

export class Cat extends Pet {
    public animalType = 'Cat';
    public breed = 'Ginger';
}

//no metadata test
export class Owner {
    constructor(
        public dog: Dog,
        public cat: Cat,
    ) {}
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
export class Child extends Individual implements IDestroyable {
    public isDestroyed = false;
    public age = 7;

    public needle_destroy(): void {
        this.isDestroyed = true;
    }
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
export class NaughtyTurtle {
    constructor(public child: NaughtyTurtle) {}
}

@Injectable()
export class SecurityToken {
    constructor(@Inject('raw-token') public rawToken: string) {}
}

@Injectable()
export class Payload {
    constructor(@Inject('data-token') public jsonData: any) {}
}

@Injectable()
export class Vehicle {
    constructor(public type: 'Bike' | 'Car' | 'Bus' | 'Train') {}
}

@Injectable()
export class Engine {}

export class WeakReferenceInjectable {
    public id = Math.floor(Math.random() * 100000 + 1);
    constructor() {}
}

@Injectable()
export class Car extends Vehicle {
    constructor(@Optional() public engine: Engine) {
        super('Car');
    }
}

@Injectable()
export class Bus extends Vehicle {
    constructor(
        public engine: Engine,
        public capacity: number,
    ) {
        super('Car');
    }
}

@Injectable()
export class Train extends Vehicle {
    constructor(@Lazy(Engine) public engine: LazyInstance<typeof Engine>) {
        super('Train');
    }
}

@Injectable()
export class CarManufacturer {
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

/**
 * Replaces the global root injector with a fresh one. Call from `beforeEach`.
 */
export function installFreshRootInjector(): void {
    (window as any)[DI_ROOT_INJECTOR_KEY] = new Injector(
        new InstanceCache(),
        new Configuration(),
        new InjectionTokensCache(),
        new Metrics(),
    );
}

export const createScopes = (injector: IInjector, depth: number) => {
    for (let index = 1; index <= depth; index++) {
        injector = injector.createScope(`level-${index}`);
    }
};

export const getInstance = (resetInjector = true, scopes = 0) => {
    if (resetInjector) {
        getRootInjector().reset();
    }

    const injector = getRootInjector();

    if (scopes > 0) {
        createScopes(injector, scopes);
    }

    return getRootInjector();
};

export function pause(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
