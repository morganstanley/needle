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
