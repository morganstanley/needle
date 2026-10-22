# Getting started

## Installation

```
npm install @morgan-stanley/needle
```

## TypeScript

Required TypeScript version: >= 5.7 < 6

The library depends on TypeScript's support for decorators.

Compatibility is validated in CI against TypeScript 5.7, 5.8, and 5.9.

## Injectable basics

### Decorators & Metadata

This library performs runtime type introspection in order to determine what types it should construct. There are two modes you can use for metadata `auto-generated` or `explicit`. Lets take a look at each, first lets start with explicit metadata.

#### Explicit Metadata

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

#### Auto-generated metadata

> Using TypeScript 5+ standard decorators instead of `experimentalDecorators`? Skip `reflect-metadata` and see [Standard decorators](standard-decorators.md).

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

### Creating an injectable type

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

### Resolving injectables

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
