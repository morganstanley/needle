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

You set the global default `metadataMode` that will be used when resolving metadata for injection. The options are `explicit`, where metadata is resolved the metadata array only, `reflection` where the metadata will attempt to be resolved using the reflect-metadata polyfill, or `both` which is the default and will attempt to resolve explicit first then fallback to reflection. `deps` (used with [standard decorators](standard-decorators.md)) is explicit metadata, so it is ignored in `reflection` mode.

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
