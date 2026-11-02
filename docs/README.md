# Needle documentation

| Guide                                           | What it covers                                           |
| ----------------------------------------------- | -------------------------------------------------------- |
| [Getting started](getting-started.md)           | Install, TypeScript setup, metadata, injectable basics   |
| [Tokens](tokens.md)                             | Injecting by string/symbol, overriding, uniqueness       |
| [Standard decorators](standard-decorators.md)   | TC39 decorators, `deps`, typed tokens, `injectable()`    |
| [Strategies](strategies.md)                     | Injecting every type registered under a key              |
| [Factories](factories.md)                       | Creating instances on demand                             |
| [Lazy and optional](lazy-and-optional.md)       | Deferred and optional injection                          |
| [Instances and values](instances-and-values.md) | Registering existing instances and plain values          |
| [External resolution](external-resolution.md)   | Delegating construction to another container             |
| [Caching](caching.md)                           | Persistent, no-cache, weak, idle and conditional caching |
| [Scopes](scopes.md)                             | Child injectors, overrides, disposal and destroy hooks   |
| [Interception](interception.md)                 | Hooking construction                                     |
| [Metrics](metrics.md)                           | Tracking resolutions and cost                            |
| [Configuration](configuration.md)               | Global settings                                          |
| [Errors and logging](errors-and-logging.md)     | Typed errors and the pluggable logger                    |
| [Registered types](registered-types.md)         | Listing what is registered                               |
| [Semantic injection](semantic-injection.md)     | Version-aware injection                                  |
| [Angular](angular.md)                           | Using Needle with Angular                                |
| [Feature support](feature-support.md)           | Full feature matrix                                      |
| [Troubleshooting](troubleshooting.md)           | Common problems and fixes                                |
| [Contributing and benchmarks](contributing.md)  | Toolchain and benchmark report                           |

## Runnable examples

The [`examples/`](../examples) folder has small programs you can run against the source in this repo:

```bash
npm ci
npm run examples
```

| Example                                                                   | Shows                             |
| ------------------------------------------------------------------------- | --------------------------------- |
| [01-basics](../examples/01-basics.ts)                                     | `@Injectable`, resolving, caching |
| [02-tokens-and-strategies](../examples/02-tokens-and-strategies.ts)       | `@Inject` and `@Strategy`         |
| [03-scopes](../examples/03-scopes.ts)                                     | Child scopes, overrides, destroy  |
| [04-interceptors-and-caching](../examples/04-interceptors-and-caching.ts) | Interceptors and `no-cache`       |
| [05-errors-and-logging](../examples/05-errors-and-logging.ts)             | Typed errors and `setLogger`      |

The API reference is generated with `npx typedoc main/index.ts` into `docs/api` (git-ignored).
