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
