
# @morgan-stanley/needle
![npm](https://img.shields.io/npm/v/@morgan-stanley/needle)
[![Build Status](https://travis-ci.com/Morgan-Stanley/needle.svg?branch=master)](https://travis-ci.com/Morgan-Stanley/needle)
[![codecov](https://codecov.io/gh/Morgan-Stanley/needle/branch/master/graph/badge.svg)](https://codecov.io/gh/Morgan-Stanley/needle)
[![Known Vulnerabilities](https://snyk.io/test/github/Morgan-Stanley/needle/badge.svg)](https://snyk.io/test/github/Morgan-Stanley/needle})
![NPM](https://img.shields.io/npm/l/@morgan-stanley/needle)
![NPM](https://img.shields.io/badge/types-TypeScript-blue)

# Documentation

Documentation available here: [needle](http://opensource.morganstanley.com/needle/)

# Installation

```
npm install @morgan-stanley/needle
```

# TypeScript

Required Typescript version: >3.2

The library depends on TypeScript's support for decorators. Therefore you must enable `experimentalDecorators` and `emitDecoratorMetadata`

```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

# Why use this?

* Simple & lightweight 
* Can be used in many different JavaScript contexts: node, browsers, angular, react or vanilla js  
* Provides a non-invasive way to stand up a tree of dependencies
* Increases your code testability
* Support semantic versioning injection

# Polyfills

This library requires modern browsers supporting `Maps` or an appropriate polyfill. It also makes use of a `reflect-metadata` polyfill for performing runtime introspection.  You can install the reflect-metadata polyfill with 

```typescript
npm install reflect-metadata
```

And you should import this module at the root of your application.  

```typescript
import "reflect-metadata";
```

# Injectable basics

## Creating an injectable type

The easiest way to make a type injectable is to annotate it with the @Injectable annotation.  All types by default decorated in this way will be available for injection in any runtime context. 

```typescript
import { Injectable } from '@morgan-stanley/needle';

@Injectable()
class MyThing {}
```

While annotation are recommend for most use cases, you can also achieve the same using the Injector API. You gain access to this API by importing the `getRootInjector` function. 

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

class MyThing {}

//Equivalent to annotation
getRootInjector().register(MyThing)
```

## Resolving injectables

In order to resolve an instance of your injectable you have a couple of options.  You can use the `getRootInjector` function which you can import from the main package.  This function returns an instance of the `Injector` API.  

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const myThing = getRootInjector().get(MyThing);
```

Alternatively, you can import the `get` function directly. 

```typescript
import { get } from '@morgan-stanley/needle';

const myThing = get(MyThing);
```

Both examples map to the same underlying implementation and use the root injector to resolve an instance.  Resolving the same type twice will result in the same instance being serviced from the cache.  

```typescript
import { getRootInjector, get } from '@morgan-stanley/needle';

const thing1 = getRootInjector().get(MyThing);
const thing2 = get(MyThing);

console.log(thing1 === thing2) //True
```

# Tokens

Tokens allow us to provide a marker to the injector whereby the type we are going to be injecting either cannot be imported or we wish to use an interface instead.  Every injectable in the system can be registered with either zero or more tokens.  A single type can register itself against multiple tokens.  

## Registering with tokens

The simplest way to register your type against a token is to use the tokens array defined in the `@Injectable` annotation. here we have a type `GeographyStudent` who defines a string `geography-student`  upon which this type can be resolved.  

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

As stated, you are not limited to just one 1 token per type.  Simple add additional tokens to the list if you require more. 

```typescript
import { Injectable } from '@morgan-stanley/needle';

@Injectable({
    tokens: ['geography-student', 'student'],
})
export class GeographyStudent extends Student {}
```
## Resolving by token

To resolve a type by token we can make use of the `@Inject` annotation. In the constructor of a given injectable we can mark one of the parameters with `@Inject` providing a token which we wish to resolve. Note, the parameter type does not need to match the type of the injected value.  This is what allows us to use either interfaces or a super type as a replacement for the real type. 

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
It is often the case that you may want to resolve a different type instance as a replacement for say a default one.  For example, say you have a Pricing service which for new customers you want to use the new pricing models but for existing customers you will use the old pricing model. 

Using token injection we follow a last in first out (`LIFO`).  Therefore, the last Injectable to be registered to a given token is the one that will be resolved.  

*Note: the configuration must be set to `allowDuplicateTokens` for this to be possible.*

```typescript
import { getRootInjector, Injectable } from '@morgan-stanley/needle';

getRootInjector().configuration.allowDuplicateTokens = true;

@Injectable(
    tokens: ['pricing']
)
export class PricingServiceV1 implements IPricing {}

@Injectable(
    tokens: ['pricing']
)
export class PricingServiceV2 implements IPricing  {}

@Injectable()
export class CustomerPricing {
    constructor(private @Inject('pricing') pricing: IPricing ) {
        console.log(pricing instanceof PricingServiceV2) //True
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
    .register(CustomerPricing)
    .registerParamForTokenInjection('pricing', CustomerPricing, argumentIndex);

```

## Unique token enforcement

If you wish to restrict duplicate tokens in the system you can control this using the configuration. *Note, the default is already set to `false`.*

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

Strategies allows us to register multiple type providers against a given strategy key and then inject an array of all the strategies in the given consumer class. An injectable type can both exist as a strategy and pure injectable at the same time.  

Creating strategies can be be achieved using the `@Injectable` annotation or the API. Both approaches make use of the `strategy` property on the injectable config. 

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

or registering view the API would look like this. 

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

## Resolving strategies

When it comes to injecting lists of strategies we can use the `@Strategy` annotation to mark that we expect an array of strategies.  You can register consumers of strategies using this annotation or the API.  

```typescript
import { Injectable, get } from '@morgan-stanley/needle';

@Injectable()
export class StrategyConsumer {
    constructor(@Strategy('work-strategies') public workStrategies: IStrategy[]) {}
}

const instance = get(StrategyConsumer);

console.log(instance.workStrategies.length) // 2 strategies
```

Or using the API we can resolve a list of strategies in the following way.  

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const strategies = getRootInjector().getStrategies('work-strategies');

console.log(strategies.length) // 2 strategies
```

# Factories

It is often the case that you need to be able to construct types with specific context or dependencies.  For these use cases you can rely of factories.

## Registering a Factory

All types registered with the container can be used as factories.  There is no special registration required.

## Resolve a Factory

There are two ways to resolve a factory.  Explicitly using the API or via the `@Factory` annotation.  Below are examples of both types of resolution.  
```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const carFactory = getRootInjector().getFactory(Car)

console.log(carFactory) // Defined
```

Example of annotation. 

```typescript
@Injectable()
class CarManufacturer {
    constructor(@Factory(Car) private carFactory: AutoFactory<typeof Car>) {}
}
```

In each case the consumer will be returned an `AutoFactory`.  The AutoFactory provides a type safe `create` method in order to construct a new instance of the target type. 

```typescript

@Injectable()
class Engine {}

@Injectable()
class Car extends Vehicle {
    constructor(public engine: Engine, public numberOfDoor = 2) {
        super('Car');
    }
}

const factory:  AutoFactory<typeof Car> = getRootInjector().getFactory(Car);
const carWithFourDoors = factory.create(undefined, 4);
const carWithSuperPowerfulEngine = factory.create(new SuperPowerfulEngine());

```

# Lazy injection

In certain situations, constructing the entire dependency tree can either be expensive or alternatively might introduce side effects you want to avoid.  In those cases `Lazy` injectables can be useful. Lazy injectables provide a placeholder injection type of `LazyInstance<T>` which will only construct the target injectable when its value property is read. 

## Registering a Lazy injectable

All types registered with the container can be used with lazy injection.  There is no special registration required.

## Resolve a LazyInstance

There are two ways to resolve a Lazy.  Explicitly using the API or via the `@Lazy` annotation.  Below are examples of both types of resolution.  

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const carLazy = getRootInjector().getLazy(Car)

console.log(carLazy) // Defined
```

We can trigger realization of the target injectable value by reading the lazy's `value` property.  

```typescript
const carInstance = carLazy.value;
```

We can also check to see if the lazy's value has been generated by reading the `hasValue` property.  

```typescript
let hasValue = carLazy.hasValue //False;
const carInstance = carLazy.value;
hasValue = carLazy.hasValue //True;
```

We can use the `@Lazy` annotation to signal to the injector that we would like a lazy to be provided in place of the real injectable.  

```typescript
@Injectable()
class CarManufacturer {
    constructor(@Lazy(Car) private carLazy: LazyInstance<typeof Car>) {}
}
```

`IMPORTANT`: You can only pass undefined to constructor params which either support injection or default value.  Type safety must be adhered to so `SuperPowerfulEngine` in this case must extend `Engine` type to be valid to the compiler.

# Register instance

There are sometimes where you do not want the injection container to create the type. Instead you want to take an already existing instance and register it against a type.  For this you can use `registerInstance` on the injector.  


```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const vehicle =  new Vehicle('Bike');

getRootInjector().registerInstance(Vehicle, vehicle);

const instance = get(Vehicle); 

console.log(instance === vehicle) // True
```

# Global configuration

## Construct Undecorated Types

When constructing a tree of dependencies you may encounter types in that tree that have no registrations associated to them. In this case you can set the configuration to `constructUndecoratedTypes`.  By default this value is set to `false` changing it to true will avoid an error that would normally be thrown. 

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().configuration.constructUndecoratedTypes = true;
```

## Max tree depth

When constructing a tree of dependencies the hierarchy can get very deep, this is especially so if a circular reference is encountered.  Determining if this is the case can be difficult which is where `maxTreeDepth` can help.  Setting this value (`defaults to 100`) will set a max limit on the depth of the tree being created. If the limit is reached an exception will be thrown. 

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().configuration.maxTreeDepth = 1000;
```

## External Resolution Strategy

In certain environments you will want to delegate the type construction to an external DI container. The `externalResolutionStrategy` is what makes this possible. When you define this strategy all construction will be delegated an the local type construction provided by this library will be ignored. 

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const dummyStrategy: IExternalResolutionConfiguration = {
    resolver: (type: any, locals?: any[]) => {
        return new type();
    }
    cacheSyncing: true;
}

getRootInjector().configuration.externalResolutionStrategy = dummyStrategy;
```

Setting `cacheSyncing` to `true` will ensure that our local cache will be updated when each type instance is resolved. This is useful when you are performing bridging between an external container and the local one.  Technically tho, if the external DI strategy is implementing caching you will not need to sync the cache and instead re-request to the strategies resolver should result in a cached instance. 

# Getting lists of registered types

When working with other libraries you may wish to resolve a list of types that have been registered with the container.   For this there are three utility methods you can use `getRegisteredTypes`, `getRegisteredTypesWithDependencies` and `getRegisteredTypesWithFactories`.

```typescript
import { getRegisteredTypes } from '@morgan-stanley/needle';

const types = getRegisteredTypes() //Returns an array of raw types. 

const typesWithDeps = getRegisteredTypesWithDependencies() //Returns an Array<{provide: any, deps: Array<>any}>

const typesWithFactories = getRegisteredTypesWithFactories() //Returns an Array<{provide: any, useFactory: () => T)}>

```

# Semantic Injection

Node's module resolution works on a folder hierarchy where an applications dependencies are stored in a `node_modules` folder and dependencies can either be shared across multiple transient dependencies or localized to a specific dependencies needs. This means that if you have an npm package installed in your app that has a dependency on foo@1.1.1 and another that uses foo@2.0.0, both can co-exist in the same app domain.  

This is a powerful feature of the node/npm ecosystem and one that developers take advantage of everyday when building their apps. However, it is often the case that this semantic version isolation is not extended to your DI container.  This is something this library is trying help with.  

When constructing a tree of dependencies our DI container will guarantee that each injected instance into a constructor will match the semantic version the consuming code was built against.  This means that you can introduce new versions of libraries into your application in a more natural and safe manner, avoiding big bang migrations. The DI system will automatically manage the what and where of injection into your types. 

Further, due to the way npm organizes semantic versions, if you have two or more dependencies in your app that rely on foo@^1.x.x, then npm will determine what is the latest compatible version of the @foo dependency being used and then synchronize all the others to use that by de-duping out older versions.  So versions 1.1.1 and 1.2.1 would be aligned to 1.5.0 if that was being used. Read more about that [here](https://docs.npmjs.com/cli/dedupe)

Semantic injection is a powerful technique for isolating change and instead letting it trickle through your system.  It can extend all the way through your package hierarchy and requires little effort from the developers to manager. 

# Integrating with Angular 2+

If you want to integrate this library with Angular's dependency injection system its a pretty easy thing to do.  In the `main.ts` file of your angular app you can resolve all the registered providers and then pass them to the `platformBrowserDynamic` call. 

```typescript
import 'reflect-metadata';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { getRegisteredTypesWithFactories } from '@morgan-stanley/needle';
import { AppModule } from 'app/app.module';

const providers = getRegisteredTypesWithFactories();

platformBrowserDynamic(providers)
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
```

# Annotations vs API

Using the annotations or using the API is really up to the developer.  As you can see you can achieve the same with both approaches.  However some advice when using the API. You may want to have a single registration file which registers all your injectables.  Avoid the urge to do this as it leads to issues when trying to implement semantic injection. Instead keep registrations local to the class implementations. 

