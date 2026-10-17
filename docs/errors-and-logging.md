# Errors and logging

## Typed errors

Every error Needle throws extends `NeedleError`, which adds a stable `code` you can switch on. Errors raised while resolving a type extend `ResolutionError` and carry a `resolutionPath` (the names of the types being resolved, outermost first).

| Class                    | `code`                       | Thrown when                                                                  |
| ------------------------ | ---------------------------- | ---------------------------------------------------------------------------- |
| `TypeNotRegisteredError` | `NEEDLE_TYPE_NOT_REGISTERED` | A type (usually a constructor parameter) has no registration                 |
| `NotResolvableError`     | `NEEDLE_NOT_RESOLVABLE`      | A type or token cannot be found on any injector (message ends with the path) |
| `MaxDepthExceededError`  | `NEEDLE_MAX_DEPTH_EXCEEDED`  | The graph is deeper than `maxTreeDepth` (usually a circular dependency)      |
| `InjectorDestroyedError` | `NEEDLE_INJECTOR_DESTROYED`  | You use an injector after `destroy()`                                        |
| `DuplicateTokenError`    | `NEEDLE_DUPLICATE_TOKEN`     | A token is registered twice and `allowDuplicateTokens` is false              |
| `MissingValueTokenError` | `NEEDLE_MISSING_VALUE_TOKEN` | `registerValue` is called without any token                                  |

```typescript
import { getRootInjector, TypeNotRegisteredError } from '@morgan-stanley/needle';

try {
    getRootInjector().get(Bike);
} catch (e) {
    if (e instanceof TypeNotRegisteredError) {
        console.log(e.code); // NEEDLE_TYPE_NOT_REGISTERED
        console.log(e.resolutionPath.join(' -> ')); // Bike -> Wheel
    }
}
```

The existing message text is unchanged, so code that matches on messages keeps working. The `NotResolvableError` message additionally ends with `(resolution path: A -> B)` when it happens inside a dependency chain.

## Logging

Needle writes to the console in two places: when a conditional cache predicate throws (a warning) and when you call `metrics.dump()`. Both go through a small logger you can replace.

```typescript
import { setLogger, resetLogger, ILogger } from '@morgan-stanley/needle';

const logger: ILogger = {
    warn: (message, ...args) => myLogger.warn(message, ...args),
    log: (message, ...args) => myLogger.info(message, ...args),
    table: (data) => myLogger.info(JSON.stringify(data)), // optional
};

setLogger(logger);
// ...
resetLogger(); // back to the console
```

`table` is optional; when it is missing `metrics.dump()` falls back to `log`. The default logger (`consoleLogger`) looks up `console` at call time, so spies and patched consoles behave as before.

See [examples/05-errors-and-logging.ts](../examples/05-errors-and-logging.ts) for a runnable version.
