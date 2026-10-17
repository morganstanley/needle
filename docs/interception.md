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
