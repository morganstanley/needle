# @morgan-stanley/needle

![Lifecycle Active](https://badgen.net/badge/Lifecycle/Active/green)
![npm](https://img.shields.io/npm/v/@morgan-stanley/needle)
[![Build Status](https://github.com/morganstanley/needle/actions/workflows/build.yml/badge.svg)](https://github.com/Roaders/needle/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/MorganStanley/needle/branch/master/graph/badge.svg)](https://codecov.io/gh/MorganStanley/needle)
[![Known Vulnerabilities](https://snyk.io/test/github/MorganStanley/needle/badge.svg)](https://snyk.io/test/github/MorganStanley/needle})
![NPM](https://img.shields.io/npm/l/@morgan-stanley/needle)
![NPM](https://img.shields.io/badge/types-TypeScript-blue)

# What is Needle?

Needle is a lightweight & powerful dependency injection container for supporting the development of universal code with full semantic runtime injection. It helps you increase the testability of your applications as well as decoupling your code more effectively

# Installation

```
npm install @morgan-stanley/needle
```

# TypeScript

Required Typescript version: > 3.4

The library depends on TypeScript's support for decorators.

# Why use this?

- Simple & lightweight
- Can be used in many different JavaScript contexts: node, browsers, angular, react or vanilla js
- Provides a non-invasive way to stand up a tree of dependencies
- Increases your code testability
- Support semantic versioning injection

# Feature support

| Feature                                                                                       | Sub-feature                      | Details                                                                                | Status       |
| --------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- | ------------ |
| [Decorator support](https://github.com/morganstanley/needle#creating-an-injectable-type)      |                                  | Using '@decorators' to signal behavior                                                 | Full Support |
| Optional decorators                                                                           |                                  | Supporting decorator free injection                                                    | Full Support |
| TypeScript support                                                                            |                                  | Full TypeScript support with type safety                                               | Full Support |
| [Global configuration](https://github.com/morganstanley/needle#global-configuration)          |                                  | Ability to configure global settings in the container                                  | Full Support |
| [Semantic Injection](https://github.com/morganstanley/needle#semantic-injection)              |                                  | Ability to respect semantic versioning in all injectable types                         | Full Support |
| Cache                                                                                         |                                  | Caching of injectables                                                                 | Full Support |
|                                                                                               | Cache manipulation               | Ability to directly manipulate the cache                                               | Full Support |
|                                                                                               | Scoping support                  | Caching support in scoped injectors                                                    | Full Support |
| [Metrics](https://github.com/morganstanley/needle#metrics-tracking)                           |                                  | Tracking injectables in the system                                                     | Full Support |
|                                                                                               | Auto tracking                    | Zero config tracking model                                                             | Full Support |
|                                                                                               | Activation tracking              | Tracking when a type is first constructed                                              | Full Support |
|                                                                                               | Activation owners                | Tracking what type is responsible for constructing an Injectable                       | Full Support |
|                                                                                               | Resolution statistics            | Details of how often a type has been resolved etc                                      | Full Support |
|                                                                                               | Creation cost                    | Cost in time to construct the Injectable                                               | Full Support |
|                                                                                               | Dependency counts                | Number of dependencies a given type has in its constructor                             | Full Support |
|                                                                                               | Scoping support                  | Are metrics tracked in scoped injectors                                                | Full Support |
|                                                                                               | Metrics manipulation             | Can developers manipulate the metric data                                              | Full Support |
| [Tokenisation](https://github.com/morganstanley/needle#tokens)                                |                                  | Does the DI library support tokenisation                                               | Full Support |
|                                                                                               | Decorator support                | Can you define tokens using '@decorators'                                              | Full Support |
|                                                                                               | API support                      | Can you define tokens using an API                                                     | Full Support |
|                                                                                               | String tokens                    | Can I use strings as tokens                                                            | Full Support |
|                                                                                               | Symbol tokens                    | Can I use Symbols as tokens                                                            | Full Support |
|                                                                                               | Multiple tokens                  | Can I register multiple tokens for a single injectable                                 | Full Support |
|                                                                                               | Token overriding                 | Can I override existing token registrations                                            | Full Support |
|                                                                                               | Unique token enforcement         | Can I enforce unqiue tokens                                                            | Full Support |
|                                                                                               | Scoping support                  | Are tokens supported in scoped injectors                                               | Full Support |
| [Strategies](https://github.com/morganstanley/needle#strategies)                              |                                  | Does the DI library support injecting multiple injectables into a given constructor    | Full Support |
|                                                                                               | Decorator support                | Can I use `@decorators` to register a strategy                                         | Full Support |
|                                                                                               | API support                      | Can I use the API to register a strategy                                               | Full Support |
|                                                                                               | String tokens                    | Can I register strategies using strings                                                | Full Support |
|                                                                                               | Symbol tokens                    | Can I register strategies using Symbols                                                | Full Support |
|                                                                                               | Scoping support                  | Are strategies supported in scoped injectors                                           | Full Support |
| [Factories](https://github.com/morganstanley/needle#factories)                                |                                  | Does the DI library support factory construction types                                 | Full Support |
|                                                                                               | Decorator support                | Can I use `@decorators` to resolve a factory                                           | Full Support |
|                                                                                               | API support                      | Can I use API to resolve a factory                                                     | Full Support |
|                                                                                               | Scoping support                  | Are factories supported in scoped injectors                                            | Full Support |
|                                                                                               | Auto factories                   | Can all types be used as Factories                                                     | Full Support |
|                                                                                               | Parameter profiling              | Can I control constructor parameters explicitly                                        | Full Support |
| [Lazy Injection](https://github.com/morganstanley/needle#lazy-injection)                      |                                  | Does the DI library support lazy dependency injection                                  | Full Support |
|                                                                                               | Decorator support                | Can I use `@decorators` to register/resolve a lazy injectable                          | Full Support |
|                                                                                               | API support                      | Can I use the API to register/resolve a lazy injectable                                | Full Support |
|                                                                                               | Scoping support                  | Are lazy injectables supported in scoped injectors                                     | Full Support |
| [Optional Injection](https://github.com/morganstanley/needle#optional-injection)              |                                  | Does the DI library support optional constructor params for injection                  | Full Support |
|                                                                                               | Decorator support                | Can I use `@decorators` to resolve optional injectable                                 | Full Support |
|                                                                                               | API support                      | Can I use the API to register/resolve a optional injectable                            | Full Support |
|                                                                                               | Scoping support                  | Are optional injectables supported in scoped injectors                                 | Full Support |
| [Instance Injection](https://github.com/morganstanley/needle#register-instance)               |                                  | Does the DI library support registering instances against a type                       | Full Support |
|                                                                                               | API support                      | Can I use the API to register an instance of a type for injection                      | Full Support |
|                                                                                               | Scoping support                  | Are instances supported in scoped injectors                                            | Full Support |
| [Value Injection](https://github.com/morganstanley/needle#register-value)                     |                                  | Does the DI library allow for registering a value for injection (Non-injectable types) | Full Support |
|                                                                                               | Intrinsic values                 | Can I register intrinsic types such as Date, Regex, Number                             | Full Support |
|                                                                                               | AOT values                       | Can I eagerly supply the value for the value injection                                 | Full Support |
|                                                                                               | JIT values                       | Can I compute the value at point of injection                                          | Full Support |
|                                                                                               | Dynamic values                   | Can I recompute the value being injected on each resolution                            | Full Support |
| [Custom Construction](https://github.com/morganstanley/needle#external-resolution-strategies) |                                  | Does the DI library support construction external to the library itself                | Full Support |
|                                                                                               | Bespoke type construction        | Can I create my own constructor for a given type                                       | Full Support |
|                                                                                               | Global bespoke construction      | Can I create a global constructor for all types                                        | Full Support |
|                                                                                               | Abstract type construction       | Can I create a constructor for abstract base types                                     | Full Support |
|                                                                                               | Scoping support                  | Are custom constructors supported in scoped injectors                                  | Full Support |
| [Caching strategies](https://github.com/morganstanley/needle#caching-strategies)              |                                  | Does the DI library support scoped injection contexts                                  | Full Support |
|                                                                                               | Persistent                       | Can injectables be cached indefinitely                                                 | Full Support |
|                                                                                               | No caching                       | Can I stop the injector caching my injectables                                         | Full Support |
|                                                                                               | Weak References                  | Can I store injectables using weak references in the cache                             | Full Support |
|                                                                                               | Idle caching                     | Can have my injectables evicted on the cache based on a given timeout                  | Full Support |
|                                                                                               | Conditional caching              | Can I evict items from the cache if a given condition is met                           | Full Support |
| [Hierarchical injection](https://github.com/morganstanley/needle#scoped-injection)            |                                  | Does the DI library support scoped injection contexts                                  | Full Support |
|                                                                                               | String scope names               | Can I use strings for scope names                                                      | Full Support |
|                                                                                               | Symbol scope names               | Can I use Symbols for scoped names                                                     | Full Support |
|                                                                                               | Registration overriding          | Can I override ancestral registration in my scope                                      | Full Support |
|                                                                                               | Disposal                         | Can I destroy a scope                                                                  | Full Support |
|                                                                                               | Destroy                          | Can I hook into destroy so that I can clean up my resources                            | Full Support |
|                                                                                               | Scope lookup                     | Can I find a scope easily using its name or id.                                        | Full Support |
|                                                                                               | Scope inheritance                | Can scopes extend other scopes                                                         | Full Support |
| [Interception](https://github.com/morganstanley/needle#interception)                          |                                  | Does the DI library support interceptors                                               | Full Support |
|                                                                                               | Decorator support                | Can I register interceptions using `@decorators`                                       | Full Support |
|                                                                                               | API support                      | Can I register interceptions using the API                                             | Full Support |
|                                                                                               | Before construction interception | Can I intercept a given type before its constructed                                    | Full Support |
|                                                                                               | After construction interception  | Can I intercept a given type after its constructed                                     | Full Support |
| [Injection delegation](https://github.com/morganstanley/needle#external-resolution-strategy)  |                                  | Can I delegate all construction to another DI library.                                 | Full Support |

# Injectable basics

## Decorators & Metadata

This library performs runtime type introspection in order to determine what types it should construct. There are two modes you can use for metadata `auto-generated` or `explicit`. Lets take a look at each, first lets start with explicit metadata.

### Explicit Metadata

When using explicit metadata we can use either the decorator or the registration API. Below is an example of how we provide the metadata using the decorator.

```typescript
import { Injectable } from '@morgan-stanley/needle';

@Injectable()
class Pet {}

//Explicit metadata via the metadata property on the decorator.
@Injectable({ metadata: [Pet] })
class Owner {
    constructor(pet: Pet) {}
}
```

And if we prefer to use the registration API we can provide the metadata as follows.

```typescript
//Explicit metadata using the registration API
getRootInjector()
    .register(Owner, { metadata: [Pet] })
    .register(Pet);
```

Note, if you are injecting a token or a strategy etc into a constructor you may not have the type available to you. In this case you can use following.

```typescript
import { Injectable, METADATA } from '@morgan-stanley/needle';

@Injectable({ metadata: [METADATA.token] })
class Owner {
    constructor(@Inject('my-pet') pet: IPet) {}
}
```

### Auto-generated metadata

TypeScript has support for being able to generate the metadata for you as part of your compilation. You can enable this feature in your `tsconfig.json` file as follows.

```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

Once enabled TypeScript will emit special JS code which depends on a polyfill library called `reflect-metadata`. To use this approach you must install this polyfill with

```typescript
npm install reflect-metadata
```

Once installed you must then import this module as the very first import on the root of your application.

```typescript
import 'reflect-metadata';
```

After this, needle will then adopt a strategy of looking for explicitly defined metadata first and if not found falling back to the TypeScript generated metadata.

## Creating an injectable type

The easiest way to make a type injectable is to decorate it with the @Injectable decorator. All types by default decorated in this way will be available for injection in any runtime context.

```typescript
import { Injectable } from '@morgan-stanley/needle';

@Injectable()
class Pet {}

@Injectable()
class Owner {
    constructor(pet: Pet) {}
}
```

While decorators are recommended, you can also achieve the same using the Injector API. You gain access to this API by importing the `getRootInjector` function.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

class Pet {}

class Owner {
    constructor(pet: Pet) {}
}

//Equivalent to decorator
getRootInjector()
    .register(Owner, { metadata: [Pet] })
    .register(Pet);
```

## Resolving injectables

In order to resolve an instance of your injectable you have a couple of options. You can use the `getRootInjector` function which you can import from the main package. This function returns an instance of the `Injector` API.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const myThing = getRootInjector().get(Owner);
```

Alternatively, you can import the `get` function directly.

```typescript
import { get } from '@morgan-stanley/needle';

const myThing = get(Owner);
```

Both examples map to the same underlying implementation and use the root injector to resolve an instance. Resolving the same type twice will result in the same instance being serviced from the cache.

```typescript
import { getRootInjector, get } from '@morgan-stanley/needle';

const owner1 = getRootInjector().get(Owner);
const owner2 = get(Owner);

console.log(owner1 === owner2); //True
```

All child dependencies (in this case `Pet`) will be automatically resolved for the `Owners` constructor.

# Tokens

Tokens allow us to provide a marker to the injector whereby the type we are going to be injecting either cannot be imported or we wish to use an interface instead. Every injectable in the system can be registered with either zero or more tokens. A single type can register itself against multiple tokens. Tokens can be defined using a `string` or `symbol`

## Registering with tokens

The simplest way to register your type against a token is to use the tokens array defined in the `@Injectable` decorator. here we have a type `GeographyStudent` who defines a string `geography-student` upon which this type can be resolved.

```typescript
import { Injectable } from '@morgan-stanley/needle';

@Injectable({
    tokens: ['geography-student'],
})
export class GeographyStudent extends Student {}
```

The API equivalent of this registration is shown below.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().register(GeographyStudent, { tokens: ['geography-student'] });
```

As stated, you are not limited to just one 1 token per type. Simply add additional tokens to the list if you require more.

```typescript
import { Injectable } from '@morgan-stanley/needle';

@Injectable({
    tokens: ['geography-student', 'student'],
})
export class GeographyStudent extends Student {}
```

## Registering Symbols for tokens

Using strings as tokens for most teams is perfectly acceptable, however often in large code bases it is possible to run into naming collisions. In order to resolve this issue you can instead adopt `Symbols` instead to define your tokens. Below is an example of two registrations where the Symbol names overlap but will not pollute each other when resolutions are made as Symbols are unique.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const pricingSymbol1 = Symbol.for('pricing');
const pricingSymbol2 = Symbol.for('pricing');

getRootInjector().configuration.allowDuplicateTokens = false;

getRootInjector()
    .register(PricingServiceV1, { tokens: [pricingSymbol1] })
    .register(PricingServiceV2, { tokens: [pricingSymbol2] }); //No exception thrown as Symbols are unique
```

## Resolving by token

To resolve a type by token we can make use of the `@Inject` decorator. In the constructor of a given injectable we can mark one of the parameters with `@Inject` providing a token which we wish to resolve. Note, the parameter type does not need to match the type of the injected value. This is what allows us to use either interfaces or a sub type as a replacement for the real type.

```typescript
@Injectable()
export class GeographyTeacher extends Person {
    constructor(@Inject('geography-student') public student: Student) {
        super();
    }
}
```

The API equivalent of this registration is shown below.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

export class GeographyTeacher extends Person {
    constructor(public student: IStudent) {
        super();
    }
}

const argumentIndex = 0;

getRootInjector()
    .register(GeographyTeacher)
    .registerParamForTokenInjection('geography-student', GeographyTeacher, argumentIndex);
```

## Token overriding

It is often the case that you may want to resolve a different type instance as a replacement for say a default one. For example, say you have a Pricing service which for new customers you want to use the new pricing models but for existing customers you will use the old pricing model.

Using token injection we follow a last in first out (`LIFO`). Therefore, the last Injectable to be registered to a given token is the one that will be resolved.

_Note: the configuration must be set to `allowDuplicateTokens` for this to be possible._

```typescript
import { getRootInjector, Injectable, METADATA } from '@morgan-stanley/needle';

getRootInjector().configuration.allowDuplicateTokens = true;

@Injectable({ tokens: ['pricing'] })
export class PricingServiceV1 implements IPricing {}

@Injectable({ tokens: ['pricing'] })
export class PricingServiceV2 implements IPricing {}

@Injectable({ metadata: [METADATA.token] })
export class CustomerPricing {
    constructor(@Inject('pricing') private pricing: IPricing) {
        console.log(pricing instanceof PricingServiceV2); // true
        super();
    }
}
```

The API equivalent of this registration is shown below.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().configuration.allowDuplicateTokens = true;

const argumentIndex = 0;

getRootInjector()
    .register(PricingServiceV1, { tokens: ['pricing'] })
    .register(PricingServiceV2, { tokens: ['pricing'] })
    .register(CustomerPricing, { metadata: [METADATA.token] })
    .registerParamForTokenInjection('pricing', CustomerPricing, argumentIndex);
```

## Unique token enforcement

If you wish to restrict duplicate tokens in the system you can control this using the configuration. _Note, the default is already set to `false`._

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().configuration.allowDuplicateTokens = false;

getRootInjector()
    .register(PricingServiceV1, { tokens: ['pricing'] })
    //Exception thrown here
    .register(PricingServiceV2, { tokens: ['pricing'] });
```

# Strategies

## Creating strategies

Strategies allow us to register multiple type providers against a given strategy key and then inject an array of all the strategies in the given consumer class. An injectable type can both exist as a strategy and pure injectable at the same time.

Creating strategies can be achieved using the `@Injectable` decorator or the API. Both approaches make use of the `strategy` property on the injectable config.

## Registering strategies

```typescript
import { Injectable } from '@morgan-stanley/needle';

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
```

or registering via the API would look like this.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector()
    .register(Strategy1, {
        strategy: 'work-strategies',
    })
    .register(Strategy2, {
        strategy: 'work-strategies',
    });
```

To avoid naming conflicts that can occur with strings, you can also use `symbols` for your strategy names. Below is an example of this using the injector API.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';
const strategySymbol = Symbol.for('work-strategies');

getRootInjector()
    .register(Strategy1, {
        strategy: strategySymbol,
    })
    .register(Strategy2, {
        strategy: strategySymbol,
    });
```

## Resolving strategies

When it comes to injecting lists of strategies we can use the `@Strategy` decorator to mark that we expect an array of strategies. You can register consumers of strategies using this decorator or the API.

```typescript
import { Injectable, get } from '@morgan-stanley/needle';

@Injectable()
export class StrategyConsumer {
    constructor(@Strategy('work-strategies') public workStrategies: IStrategy[]) {}
}

const instance = get(StrategyConsumer);

console.log(instance.workStrategies.length); // 2 strategies
```

Or using the API we can resolve a list of strategies in the following way.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const strategies = getRootInjector().getStrategies('work-strategies');

console.log(strategies.length); // 2 strategies
```

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

# Lazy injection

In certain situations, constructing the entire dependency tree can either be expensive or alternatively might introduce side effects you want to avoid. In those cases `Lazy` injectables can be useful. Lazy injectables provide a placeholder injection type of `LazyInstance<T>` which will only construct the target injectable when its value property is read.

## Registering a Lazy injectable

All types registered with the container can be used with lazy injection. There is no special registration required.

## Resolve a LazyInstance

There are two ways to resolve a Lazy. Explicitly using the API or via the `@Lazy` decorator. Below are examples of both types of resolution.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const carLazy = getRootInjector().getLazy(Car);

console.log(carLazy); // Defined
```

We can trigger realization of the target injectable value by reading the lazy's `value` property.

```typescript
const carInstance = carLazy.value;
```

We can also check to see if the lazy's value has been generated by reading the `hasValue` property.

```typescript
let hasValue = carLazy.hasValue; //False;
const carInstance = carLazy.value;
hasValue = carLazy.hasValue; //True;
```

We can use the `@Lazy` decorator to signal to the injector that we would like a lazy to be provided in place of the real injectable.

```typescript
@Injectable()
class CarManufacturer {
    constructor(@Lazy(Car) private carLazy: LazyInstance<typeof Car>) {}
}
```

# Optional injection

In some environments it will not always be the case that an injectable type has been registered with the injector. For these scenarios you can leverage the `@Optional` decorator which will allow the injector to resolve `undefined` if no matching registration can be found.

## Registering an Optional Injectable

All constructor types can be used with optional injection. There is no special registration required.

## Resolve an optional injectable

We can use the `@Optional` decorator to signal to the injector that we would like it to resolve `undefined` if no registrations can be found. Below is an example of a constructor for a Car type which supports optional storage.

```typescript
@Injectable()
class Car {
    constructor(@Optional() private storage?: Storage) {
        console.log(storage); //Undefined
    }
}
```

You can also resolve an optional injectable using the `getOptional` method on the injector api.

```typescript
const car = injector.getOptional(Car); //Undefined
```

## Resolve and optional token

The `@Optional` decorator and the `getOptional` method also accept tokens to optionally inject:

```typescript
@Injectable()
class Car {
    constructor(@Optional('storageToken') private storage?: Storage) {
        console.log(storage); //Undefined
    }
}
```

```typescript
const car = injector.getOptional('carToken'); //Undefined
```

# Register instance

There are sometimes where you do not want the injection container to create the type. Instead you want to take an already existing instance and register it against a type. For this you can use `registerInstance` on the injector.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const vehicle = new Vehicle('Bike');

getRootInjector().registerInstance(Vehicle, vehicle);

const instance = get(Vehicle);

console.log(instance === vehicle); // True
```

# External Resolution Strategies

There are times where you may require more granular control of a specific types construction. This may be because you want to resolve the the type from a different injection container, the type may not be `Newable` consider the case of an abstract class or for a variety of other reasons. In order to support this, needles injectable config provides a `resolution` property which can be used to specify your own external resolution strategy.

## Registering a type for external resolution

If you want to entirely own the process of constructing a given type you can define an `ExternalResolutionStrategy` which will be used in place of needles construction logic. Below shows an example of registering our own resolution strategy against a given type using the decorator approach. The `resolution` takes a resolver function where you can perform your custom construction and an additional flag (`cacheSyncing`) signalling to needle if it should store the result in its internal cache.

```typescript
@Injectable({
    resolution: {
        resolver: (_injector, _args) => new SuperCar(),
        cacheSyncing: true,
    },
})
class SuperCar {}
```

The same can be achieved using the injector API.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().register(SuperCar, {
    resolution: {
        resolver: (_injector, _args) => new SuperCar(),
        cacheSyncing: true,
    },
});
```

## Registering abstract types for external resolution

Some types cannot be constructed directly, these types instead require that we use a subtype which is considered `Newable`. This is commonly the case where we have an abstract base class that we want to inject that into other types using the base class, but at the same time we need to provide a concrete instance.

In the example below we provide an example of this whereby we have an abstract `Car` class which can be registered to a sub type, in this case `SuperCar`.

**Note**: The `resolution` property accepts a shorthand version whereby you provide just a compatible type for the super type. If this is used, needle will automatically do the type substitution for you. This makes overriding a base type very simple.

```typescript
@Injectable({
    resolution: SuperCar,
})
abstract class Car {}
```

Or using the injector API

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().register(Car, { resolution: SuperCar });
```

In the section under **Global Configuration** you can learn about how you can use **External Resolution Strategies** to delegate construction globally and provide fallback strategies when performing interop with other container systems.

# Register Value

JavaScript has a number of intrinsic types that you may wish to inject directly into a constructor without the need for wrapping in a higher type. These types include `Array`, `Boolean`, `Date`, `Error`, `Function`, `JSON`, `Number`, `RegExp` and `String`. In order to support direct injection of these types we can use the `registerValue` method found on the injector. The `registerValue` method only takes one parameter, the injection configuration object. There are two ways to resolve the value, you can either provide a value at point of registration or you can use a resolution strategy to resolve at point of use. Below are some examples to illustrate how this works.

## Registering with a AOT value

```typescript
@Injectable()
class SecurityContext {
    constructor(@Inject('security-token') public securityToken: string) {}
}

// Tokens are used the same as for other types.
getRootInjector().registerValue<string>({
    tokens: ['security-token'],
    value: 'TmVlZGxlIFByb2plY3Q=',
});
```

## Registering with a JIT computed value value

```typescript
getRootInjector().registerValue<string>({
    tokens: ['security-token'],
    value: {
        cacheSyncing: true,
        resolver: (_injector) => Encryption.resolveUserContextToken(),
    },
});
```

If you want the value to mutate on each request, you can set `cacheSyncing` to false.

**Note**: As values have no associated type upon which to decorate, you can only use the Injector API to register values.

# Metrics tracking

The injector tracks metrics about your injectable types during runtime. There are a range of different values captured and these are stored in the metrics provider which is accessible via the Injector type. The data is store as records and the below type shows the information captured.

```typescript
export interface IMetricRecord {
    /**
     * The type who's metrics are being tracked
     */
    type: any;
    /**
     * First activation time
     */
    activated: Date;
    /**
     * What type constructed this type. (Defaults to self if bare resolution)
     */
    activationTypeOwner: any;
    /**
     * The number of times this type has been resolved
     */
    resolutionCount: number;
    /**
     * The last time this type resolved
     */
    lastResolution: Date;
    /**
     * The number of types this type depends on based on constructor signature.
     */
    dependencyCount: number;
    /**
     * The time it took to construct this type
     */
    creationTimeMs: number;
}
```

## Reading the metric data

There are a number of ways to read the metric data. To access via the injector instance simply do the following.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const metrics = getRootInjector().metrics;
```

You can easily `dump` the data to the console using the following.

```typescript
getRootInjector().metrics.dump();
```

You can reset the metrics by calling the `reset` method.

```typescript
getRootInjector().metrics.reset();
```

You read the metrics for a specific type by using the `getMetricsForType` method.

```typescript
getRootInjector().metrics.getMetricsForType(MyType);
```

You an read all the metric data by reading the `data` property.

```typescript
const records: IMetricRecord[] = getRootInjector().metrics.data;
```

# Caching strategies

Needle provides several flexible caching strategies for managing your injectables, allowing you to fine-tune memory usage and optimize for different runtime environments. The available caching strategies are:

- **Persistent**: The default strategy. Once an injectable is created, it remains cached for the application's lifetime.
- **No-cache**: Disables caching entirely. Each resolution creates a new instance.
- **Weak references**: Uses JavaScript's `WeakRef` to cache injectables, enabling garbage collection when no strong references remain.
- **Idle**: Evicts injectables from the cache after a specified period of inactivity. The timeout resets on each access.
- **Conditional**: Lets you define a custom predicate function to determine when an injectable should be evicted from the cache, evaluated after each resolution.

These strategies give you granular control over resource management and can be tailored to fit the needs of both high-performance and resource-constrained applications.

## Persistent

By default, the persistent cache strategy is applied automatically—no additional configuration is needed. However, if you want to be explicit and ensure that your injectable always uses the persistent strategy (regardless of global settings), you can specify it directly as shown below.

```typescript
//Using the decorator
@Injectable({ cacheStrategy: 'persistent' })
class NaughtyTurtle {}

//Using the registration API
injector.register(NaughtyTurtle, { cacheStrategy: 'persistent' });
```

## No cache

The `no-cache` option tells Needle to skip caching entirely, so a fresh instance is created every time the injectable is resolved. This is useful when you need stateless or short-lived objects that shouldn't be reused. Example:

```typescript
//Using the decorator
@Injectable({ cacheStrategy: 'no-cache' })
class NaughtyTurtle {}

//Using the registration API
injector.register(NaughtyTurtle, { cacheStrategy: 'no-cache' });
```

## Weak references

The `weak-reference` cache strategy tells Needle to store your injectable instance using JavaScript's `WeakRef`. This allows the garbage collector to reclaim the instance's memory if there are no strong references to it elsewhere in your application. As a result, you are not guaranteed to receive the same instance on subsequent resolutions if the instance has been collected, Needle will create a new one. Because garbage collection is non-deterministic, use this strategy when you want to minimize memory usage and don't require persistent instances.

```typescript
//Using the decorator
@Injectable({cacheStrategy: 'weak-reference'})
class NaughtyTurtle {}

//Using the registration API
injector.register(NaughtyTurtle, { cacheStrategy: 'weak-reference'' });
```

## Idle

The idle cache strategy automatically removes your injectable from the cache after a specified period of inactivity. You can configure the timeout in milliseconds. Each time the injectable is accessed, the timer resets so the instance remains cached as long as it is used within the timeout window. This is useful for managing memory in scenarios where objects should only persist while actively in use.

```typescript
//Using the decorator
@Injectable({ cacheStrategy: { type: 'idle', timeout: 500 } })
class NaughtyTurtle {}

//Using the registration API
injector.register(NaughtyTurtle, { cacheStrategy: { type: 'idle', timeout: 500 } });
```

## Conditional

The conditional cache strategy allows you to evict items from the cache based on a custom condition. You provide a predicate function that receives the instance and returns `true` if the item should be evicted. This gives you fine-grained control over cache behavior, enabling scenarios like time-based, state-based, or environment-based eviction. Example:

```typescript
//Using the decorator
@Injectable({
    cacheStrategy: {
        type: 'conditional',
        predicate: (instance) => new Date().getDay() === 3 /*its Wednesday so evict*/,
    },
})
class NaughtyTurtle {}

//Using the registration API
injector.register(NaughtyTurtle, {
    cacheStrategy: {
        type: 'conditional',
        predicate: (instance) => new Date().getDay() === 3 /*its Wednesday so evict*/,
    },
});
```

# Scoped injection

Hierarchical injection (aka Scoped injection) is the ability to create new child injection scopes which descend from our primary root injector. There are many times when you may require scoped injection, normally they are associated with a given context in our app domains and provide the ability to deviate from the global registrations defined in the root injector.

Scoped injectors inherit their ancestors registrations by default, and then can override those with their own or add additional registrations as required.

Scoped injectors can also be created from other scopes, therefore allowing you to build complex hierarchies which can model your domain accurately.

## Creating a scope

To create a new injection scope we can call the `createScope` method from any `Injector` instance. When we create the new scope we must provide a name for the new scope.

```typescript
const scopedInjector = getRootInjector().createScope('my-scoped-injector');

const amIScoped = scopedInjector.isScoped(); //True
```

## Scope Resolution

By default scoped injectors inherit their parents registrations. Any updates to the parent scopes registrations automatically flow to the child scopes.

Therefore if a parent has defined a registration and we try and resolve that type from our scoped injector, then the type instance will be provided without error.

This is true no matter how deep the scope hierarchy is, as the resolution process walks up the tree until a valid registration is found. Example below.

```typescript
const rootInjector = getRootInjector();

//Single registration
rootInjector.register(Child);

//Create 2 levels of scope
const level2Injector = rootInjector.createScope('level-1').createScope('level-2');

//Instance of child (Serviced from root injector)
const child = level2Injector.get(Child);
```

## Scope overrides

The key reason to create a new scope is in order to provide overrides for a particular context in your applications. During the resolution process for a given type, the injector will first look towards its local registrations and if it finds a match will use that over any parent registrations. Therefore you can easily replace registrations from the hierarchy with your own and create instances localized to your scope and all child scopes within it.

```typescript
const rootInjector = getRootInjector();

//Single registration
rootInjector.register(Child);

//Create 2 levels of scope
const level2Injector = rootInjector.createScope('level-1').createScope('level-2');

//Create our scoped registrations
level2Injector
    .register(Child) //override root registration
    .registerInstance(Teacher, new Teacher('History'));

const child1 = rootInjector.get(Child);
const child2 = level2Injector.get(Child);
const teacher = level2Injector.get(Teacher);

child1 === child2; // False

rootInjector.get(Teacher); //Fails as no registration in parent scopes
```

As a scoped injector is no different to the root injector, the full registration API is available. Therefore you can create registrations of any kind.

## Finding a scope

If you want to resolve a scope you can do this either using the `id` or `name` of the scope. Below is an example.

```typescript
const rootInjector = getRootInjector();

const level2Injector = rootInjector.createScope('level-1');

rootInjector.getScope(level2Injector.id);
rootInjector.getScope('level-1');
```

## Scope disposal

As scoped injectors sit in a tree they can be disposed of easily by calling dispose either on the scope directly or a parent scope.

```typescript
const rootInjector = getRootInjector();

//Single registration
rootInjector.register(Child);

//Create 2 levels of scope
const level2Injector = rootInjector.createScope('level-1').createScope('level-2');

const level1 = rootInjector.getScope('level-1');
const level2 = rootInjector.getScope('level-2');

level1.destroy();

level1.isDestroyed(); //True;
level2.isDestroyed(); //True;
```

## Destroy hooks

When an injection scope is destroyed needle will look to see if injectables in that scopes cache implement `IDestroyable`. If cache references are found, needle will invoke the `needle_destroy` function. This provides a perfect place for you to perform necessary clean up. Example below.

```typescript
export class Child implements IDestroyable {
    public isDestroyed = false;

    public needle_destroy(): void {
        this.isDestroyed = true;
    }
}

const rootInjector = getRootInjector();

//Create a scoped injector
const scopedInjector = rootInjector.createScope('my-new-scope');

scopedInjector.register(Child);

const child = scopedInjector.get(Child);
console.log(child.isDestroyed); //False

scopedInjector.destroy();

console.log(child.isDestroyed); //True
```

# Interception

Needle provides support for interception of construction using `interceptors`. Interceptors provide the ability for developers to hook into a types construction both immediately before and after a type is instanced. This technique is useful when you need to configure an instance before that instance is injected into downstream consumers. For example, if we had a Car type which injected an Engine, we may wish to call the engine.tune() function before giving to the car instance. Interceptors are considered global inside of needle. Therefore if you create multiple scopes each instance being constructed will pass through the same set of interceptors.

## Creating an interceptor

To create an interceptor is simple, we simply implement an interface called `IConstructionInterceptor` in our class. The interface is generic and there we can provide the Type that we wish to target as a generic param. Below is an example interceptor which implements the interface for the Engine type.

```typescript
export class EngineInterceptor implements IConstructionInterceptor<typeof Engine> {
    public readonly target: typeof Engine = Engine;
    public beforeCreate(context: IInjectionContext<typeof Engine>): void {
        console.log(context);
    }
    public afterCreate(instance: Engine, context: IInjectionContext<typeof Engine>): void {
        console.log(instance);
        console.log(context);
    }
}
```

The interface requires we implement 3 members

- `target` - The type we wish to intercept
- `beforeCreate` - A method that will be invoked directly before the type instanced and after all its constructor args are resolved.
- `afterCreate` - A method that will be invoked immediately after the target type was instanced.

Each method call will receive an `injection context` object which provides information about the context of injection. This includes information such as the injector instance resolving the type, the configuration used during construction and an array of constructor args.

## Registering an interceptor

There are two ways to register an interceptor in the system, you can either decorate your class with `@Interceptor()`. The decorator approach essentially makes you interceptor an injectable so that you can inject other dependencies into it. The other approach is to use the injector API and provide an instance manually. **Note**: Decorated interceptors will be constructed at point of registration.

```typescript
//Decorated
@Interceptor()
class EngineInterceptor {}

//Explicit
injector.registerInterceptor(new EngineInterceptor());
```

**Note**, regardless of the scope of the injector all interceptors will be registered with the the root injector.

# Global configuration

## Max tree depth

When constructing a tree of dependencies the hierarchy can get very deep, this is especially so if a circular reference is encountered. Determining if this is the case can be difficult which is where `maxTreeDepth` can help. Setting this value (`defaults to 500`) will set a max limit on the depth of the tree being created. If the limit is reached an exception will be thrown.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().configuration.maxTreeDepth = 1000;
```

## Track metrics

By default the injector will track common metric information about types in the system. This includes information such as first activation time, number of resolutions, cost of construction etc. You can disable metrics tracking by setting the `trackMetrics` flag to false.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().configuration.trackMetrics = false;
```

## Default cache strategy

You set the global `defaultCacheStrategy` that will be used for injectables which do not define a local caching strategy via the injection config. For Example

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().configuration.defaultCacheStrategy = 'persistent';
```

## Default metadata modes

You set the global default `metadataMode` that will be used when resolving metadata for injection. The options are `explicit`, where metadata is resolved the metadata array only, `reflection` where the metadata will attempt to be resolved using the reflect-metadata polyfill, or `both` which is the default and will attempt to resolve explicit first then fallback to reflection.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().configuration.metadataMode = 'explicit';
```

## External Resolution Strategy

In certain environments you will want to delegate type construction to an external DI container or custom constructor function. The `externalResolutionStrategy` is what makes this possible. When you define this strategy all construction will be delegated to that strategy and the internal type resolution strategy will be ignored. If however you want to adopt a fallback strategy, first checking your external resolver then falling back to this injector you can achieve this by returning a special value `TYPE_NOT_FOUND` which will signal to needle that it should now attempt to resolve the type as the external one couldn't. This mechanism allows developers to completely control type construction so that they can inject their own pipelines into the process.

```typescript
import { getRootInjector, IInjector, TYPE_NOT_FOUND } from '@morgan-stanley/needle';

const dummyStrategy: IExternalResolutionConfiguration = {
    resolver: (type: any, currentInjector: IInjector, locals?: any[]) => {
        if(type === MyCustomType){
            return new MyCustomType();
        } else {
            return TYPE_NOT_FOUND;
        }
    }
    cacheSyncing: true;
}

getRootInjector().configuration.externalResolutionStrategy = dummyStrategy;
```

Setting `cacheSyncing` to `true` will ensure that our local cache will be updated when each type instance is resolved. This is useful when you are performing bridging between an external container and the local one. Technically tho, if the external DI strategy is implementing caching you will not need to sync the cache and instead re-request to the strategies resolver should result in a cached instance.

# Getting lists of registered types

When working with other libraries you may wish to resolve a list of types that have been registered with the container. For this there are three utility methods you can use `getRegisteredTypes`, `getRegisteredTypesWithDependencies` and `getRegisteredTypesWithFactories`.

```typescript
import { getRegisteredTypes } from '@morgan-stanley/needle';

const types = getRegisteredTypes(); //Returns an array of raw types.

const typesWithDeps = getRegisteredTypesWithDependencies(); //Returns an Array<{provide: any, deps: Array<>any}>

const typesWithFactories = getRegisteredTypesWithFactories(); //Returns an Array<{provide: any, useFactory: () => T)}>
```

# Semantic Injection

Node's module resolution works on a folder hierarchy where an applications dependencies are stored in a `node_modules` folder and dependencies can either be shared across multiple transient dependencies or localized to a specific dependency's needs. This means that if you have an npm package installed in your app that has a dependency on foo@1.1.1 and another that uses foo@2.0.0, both can co-exist in the same app domain.

This is a powerful feature of the node/npm ecosystem and one that developers take advantage of everyday when building their apps. However, it is often the case that this semantic version isolation is not extended to your DI container. This is something this library is trying help with.

When constructing a tree of dependencies our DI container will guarantee that each injected instance into a constructor will match the semantic version the consuming code was built against. This means that you can introduce new versions of libraries into your application in a more natural and safe manner, avoiding big bang migrations. The DI system will automatically manage the what and where of injection into your types.

Further, due to the way npm organizes semantic versions, if you have two or more dependencies in your app that rely on foo@^1.x.x, then npm will determine what is the latest compatible version of the @foo dependency being used and then synchronize all the others to use that by de-duping out older versions. So versions 1.1.1 and 1.2.1 would be aligned to 1.5.0 if that was being used. Read more about that [here](https://docs.npmjs.com/cli/dedupe)

Semantic injection is a powerful technique for isolating change and instead letting it trickle through your system. It can extend all the way through your package hierarchy and requires little effort from the developers to manage.

# Integrating with Angular 2+

If you want to integrate this library with Angular's dependency injection system it's a pretty easy thing to do. In the `main.ts` file of your Angular app you can resolve all the registered providers and then pass them to the `platformBrowserDynamic` call.

```typescript
import 'reflect-metadata';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { getRegisteredTypesWithFactories } from '@morgan-stanley/needle';
import { AppModule } from 'app/app.module';

const providers = getRegisteredTypesWithFactories();

platformBrowserDynamic(providers)
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
```

## Using Needle's decorators within Angular components

It is important to note that the decorators provided by Needle cannot be used directly within the constructor of an Angular component. Angular is not aware of these decorators so it is unable to resolve the required instances at runtime. When working with Angular components the `Injector` API should be used instead. To access the `Injector` API inject an instance of the `Injector` directly into your component.

```typescript
import { Injector } from '@morgan-stanley/needle';

@Component({
    selector: 'my-component',
    templateUrl: './my-component.html',
    styleUrls: ['./my-component.scss'],
})
export class MyComponent {
    constructor(injector: Injector) {
        // Example resolutions
        const strategies = injector.getStrategies('work-strategies');
        const carLazy = injector.getLazy(Car);
    }
}
```
