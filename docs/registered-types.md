# Getting lists of registered types

When working with other libraries you may wish to resolve a list of types that have been registered with the container. For this there are three utility methods you can use `getRegisteredTypes`, `getRegisteredTypesWithDependencies` and `getRegisteredTypesWithFactories`.

```typescript
import { getRegisteredTypes } from '@morgan-stanley/needle';

const types = getRegisteredTypes(); //Returns an array of raw types.

const typesWithDeps = getRegisteredTypesWithDependencies(); //Returns an Array<{provide: any, deps: Array<>any}>

const typesWithFactories = getRegisteredTypesWithFactories(); //Returns an Array<{provide: any, useFactory: () => T)}>
```
