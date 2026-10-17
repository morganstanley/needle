# Factories

It is often the case that you need to be able to construct types with specific context or dependencies. For these use cases you can rely on factories.

## Registering a Factory

All types registered with the container can be used as factories. There is no special registration required.

## Resolve a Factory

There are two ways to resolve a factory. Explicitly using the API or via the `@Factory` decorator. Below are examples of both types of resolution.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const carFactory = getRootInjector().getFactory(Car);

console.log(carFactory); // Defined
```

Example of decorator.

```typescript
@Injectable()
class CarManufacturer {
    constructor(@Factory(Car) private carFactory: AutoFactory<typeof Car>) {}
}
```

In each case the consumer will be returned an `AutoFactory`. The AutoFactory provides a type safe `create` method in order to construct a new instance of the target type.

```typescript
@Injectable()
class Engine {}

@Injectable()
class Car extends Vehicle {
    constructor(
        public engine: Engine,
        public numberOfDoor = 2,
    ) {
        super('Car');
    }
}

const factory: AutoFactory<typeof Car> = getRootInjector().getFactory(Car);
const carWithFourDoors = factory.create(undefined, 4);
const carWithSuperPowerfulEngine = factory.create(new SuperPowerfulEngine());
```

If you prefer not to pass undefined to the factory, there is also a named constant `AUTO_RESOLVE` which can be used instead.

```typescript
factory.create(AUTO_RESOLVE, 4);
```

If you would **not** like the injector to auto resolve the value for engine and you wanted to actually return `null` or `undefined` you can use well known injector values (`UNDEFINED_VALUE`, `NULL_VALUE` ) to achieve this.

```typescript

@Injectable()
import { NULL_VALUE, UNDEFINED_VALUE} from '@morgan-stanley/needle';

const factory:  AutoFactory<typeof Car> = getRootInjector().getFactory(Car);
const carWithEmptyEngine = factory.create(UNDEFINED_VALUE, 4);
const carWithNoEngine = factory.create(NULL_VALUE);

carWithEmptyEngine.engine === undefined //True
carWithNoEngine.engine === null //True
```

`IMPORTANT`: You can only pass undefined to constructor params which either support injection or default value. Type safety must be adhered to so `SuperPowerfulEngine` in this case must extend `Engine` type to be valid to the compiler.
