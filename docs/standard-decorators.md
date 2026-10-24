# Standard decorators, typed tokens and `injectable()`

> Standard decorators are supported alongside the legacy `experimentalDecorators` mode. Existing code keeps working unchanged. See the [design note](design/tc39-decorators.md) for the reasoning behind the API.

Needle's decorators were written for TypeScript's legacy `experimentalDecorators` with `emitDecoratorMetadata`. Standard (TC39, TypeScript 5+) decorators have **no parameter decorators** and **emit no constructor metadata**, so constructor injection needs a different description of the constructor. This page covers the three pieces that make Needle work without the legacy flags:

1. [`deps`](#describing-the-constructor-with-deps) - say what the constructor takes
2. [`createToken<T>()`](#typed-tokens) - tokens that carry their type
3. [`injectable()`](#injectable-decorator-free-and-type-checked) - register a class with `deps` checked against the constructor

## TypeScript configuration

Needle detects which decorator flavour is calling it at runtime, so the same package works in both modes. Pick one per project:

|                                                    | Standard (TC39) decorators               | Legacy decorators                                       |
| -------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| TypeScript                                         | 5.0 or later                             | any supported version                                   |
| `experimentalDecorators`                           | `false` (or omitted)                     | `true`                                                  |
| `emitDecoratorMetadata`                            | `false` (or omitted)                     | `true`                                                  |
| `reflect-metadata`                                 | not needed                               | required (`import 'reflect-metadata'` once at start-up) |
| Constructor parameters                             | described with `deps` or `injectable()`  | inferred from emitted metadata                          |
| Parameter decorators (`constructor(@Inject(x) a)`) | not available (not part of the standard) | supported                                               |
| Field / `accessor` injection                       | supported                                | not supported                                           |

A minimal standard-decorator `tsconfig.json`:

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "NodeNext",
        "experimentalDecorators": false,
        "emitDecoratorMetadata": false
    }
}
```

`target` must be `ES2022` or later for `accessor` fields to be emitted natively; with a lower target TypeScript down-levels them, which also works. If you target lower than `ES2015`, a `WeakMap` polyfill is required, as before.

Tested toolchains: `tsc` (TypeScript 5.0 to 5.9 native emit), esbuild and SWC (`decoratorVersion: '2022-03'`). Babel's `2023-05`+ decorator transform is not tested.

Standard decorators work the same from the ESM and the CommonJS build of the package (`import` and `require`), and both builds are covered by `npm run test:package`.

## Describing the constructor with `deps`

```typescript
import { Injectable, dep } from '@morgan-stanley/needle';

@Injectable({
    deps: [Engine, dep.token('config'), dep.optional(Logger), dep.lazy(Wheels)],
})
class Car {
    constructor(engine: Engine, config: Config, logger: Logger | undefined, wheels: LazyInstance<Wheels>) {}
}
```

A class is a type dependency. `dep.token`, `dep.optional`, `dep.lazy`, `dep.factory` and `dep.strategy` map to `@Inject`, `@Optional`, `@Lazy`, `@Factory` and `@Strategy`.

### Dev-mode warning

A standard-decorated class that forgets `deps` would be constructed with `undefined` arguments. In development, Needle warns through the [pluggable logger](errors-and-logging.md) when:

- the constructor declares parameters but there are no `deps` (and no `metadata`), or
- `deps.length` differs from the constructor's `Function.length`.

The warning is not emitted when `process.env.NODE_ENV` is `production`, nor for legacy decorator usage. Needle reads the literal `process.env.NODE_ENV`, so bundlers that replace it (webpack, Vite, esbuild with `define`) remove the check from production builds. In a browser without a bundler `process` does not exist and the check stays on. `Function.length` stops at the first parameter with a default value or a rest parameter, so a longer `deps` list can be a false alarm for those constructors. A derived class with no constructor of its own reports a length of 0, so it is not checked.

## Typed tokens

```typescript
import { createToken, get } from '@morgan-stanley/needle';

interface AppConfig {
    url: string;
}

export const Config = createToken<AppConfig>('config');

getRootInjector().registerValue({ tokens: [Config], value: { url: '/api' } });

const config = get(Config); // AppConfig
const maybe = getRootInjector().getOptional(Config); // AppConfig | undefined
const lazy = getRootInjector().getLazy(Config); // LazyInstance<AppConfig>
```

At runtime a token is a unique `symbol`, so it works everywhere a symbol token does: `@Inject(Config)`, `tokens: [Config]`, `deps: [Config]`, `dep.token(Config)`. The type is only used to infer what `get`, `getOptional` and `getLazy` return and what `injectable()` accepts.

Note `registerValue` and `@Inject(token) accessor x` do not yet check the value or member type against the token.

## `injectable()`: decorator-free and type-checked

```typescript
import { injectable, createToken, dep } from '@morgan-stanley/needle';

class Car {
    constructor(
        readonly engine: Engine,
        readonly config: AppConfig,
        readonly logger: Logger | undefined,
    ) {}
}

injectable(Car, [Engine, Config, dep.optional(Logger)]);
```

The `deps` tuple is checked against `ConstructorParameters<typeof Car>`, one entry per parameter:

```typescript
injectable(Car, [Engine]); // error: missing entries
injectable(Car, [Wheels, Config, dep.optional(Logger)]); // error: Wheels is not an Engine
injectable(Car, [Engine, createToken<number>(), dep.optional(Logger)]); // error: wrong token type
injectable(Car, [Engine, Config, Logger]); // error: parameter is `Logger | undefined`, use dep.optional
```

Each entry is a class (or subclass), a typed token or a `dep.*` helper: `dep.optional(X)` provides `X | undefined`, `dep.lazy(X)` provides `LazyInstance<X>`, `dep.factory(X)` provides `AutoFactory<typeof X>`. String tokens (`dep.token('name')`, `dep.strategy('name')`) cannot be checked and match any parameter.

Because TypeScript types are structural, a class whose shape equals the expected one is accepted. `injectable()` works with legacy decorators, standard decorators or none, and does not need any compiler flags.

## Members instead of constructor parameters

Fields and `accessor`s can be decorated directly (standard decorators only):

```typescript
@Injectable()
class Car {
    @Inject(Engine) accessor engine!: Engine;
    @Inject(Config) accessor config!: AppConfig;
    @Optional(Logger) accessor logger: Logger | undefined;
}
```

## Migrating from `experimentalDecorators`

Nothing changes for existing legacy users, and you can migrate one class at a time: `deps` also works under legacy decorators, so a project can adopt it first, drop `reflect-metadata`, then turn `experimentalDecorators` off.

1. Add `deps` (or call `injectable()`) for every class whose constructor takes parameters. Translate parameter decorators like this:

    | Legacy parameter                          | Standard `deps` entry                         |
    | ----------------------------------------- | --------------------------------------------- |
    | `engine: Engine` (inferred from metadata) | `Engine`                                      |
    | `@Inject('cfg') cfg: Config`              | `dep.token('cfg')`, or a typed token `Config` |
    | `@Optional() log?: Logger`                | `dep.optional(Logger)`                        |
    | `@Lazy() wheels: LazyInstance<Wheels>`    | `dep.lazy(Wheels)`                            |
    | `@Factory() f: AutoFactory<typeof Part>`  | `dep.factory(Part)`                           |
    | `@Strategy('plugins') p: Plugin[]`        | `dep.strategy('plugins')`                     |

2. Remove `experimentalDecorators` and `emitDecoratorMetadata` from `tsconfig.json`, and remove the `reflect-metadata` import.
3. Run your tests in development mode: Needle warns about any standard-decorated class whose constructor takes parameters but has no `deps`, or whose `deps` length does not match.

```ts
// before (legacy)
@Injectable()
class Car {
    constructor(
        private engine: Engine,
        @Inject('cfg') private cfg: Config,
        @Optional() private log?: Logger,
    ) {}
}

// after (standard), option A: deps
@Injectable({ deps: [Engine, dep.token('cfg'), dep.optional(Logger)] })
class Car {
    constructor(
        private engine: Engine,
        private cfg: Config,
        private log?: Logger,
    ) {}
}

// after (standard), option B: type-checked deps with injectable()
class Car {
    constructor(
        private engine: Engine,
        private cfg: Config,
        private log?: Logger,
    ) {}
}
injectable(Car, [Engine, dep.token('cfg'), dep.optional(Logger)]);

// after (standard), option C: members
@Injectable()
class Car {
    @Inject(Engine) accessor engine!: Engine;
    @Inject('cfg') accessor cfg!: Config;
    @Optional(Logger) accessor log: Logger | undefined;
}
```

Things to watch for:

- **Forgotten `deps`.** Without metadata, a constructor with parameters is called with `undefined` arguments. The dev-mode warning catches this; `injectable()` catches it at compile time.
- **Member injection is lazy for `accessor`s and eager for plain fields.** Members resolve against the injector the instance was requested from, like constructor parameters, so a dependency registered only in a scope is found when the instance is requested from that scope. Objects created with `new` resolve their members from the root injector.
- **Cycles.** A cycle through eager fields (`A` field needs `B`, `B` field needs `A`) throws `MaxDepthExceededError` with the resolution path. Use `accessor`s (resolved on first read) or `@Lazy` to break a cycle.
- **`metadataMode`.** `deps` is stored as explicit metadata, so it is honoured in the default `'both'` mode and in `'explicit'` mode, but ignored when `metadataMode` is `'reflection'`. Don't use `'reflection'` with standard decorators.
- **Strategies, interceptors, scopes, caching and metrics** behave the same in both modes.

## Limitations

- `deps` on `@Injectable` is positional and not type-checked (a class decorator cannot see its own constructor's parameter types). Use `injectable()` for compile-time checking.
- `registerValue` values and `@Inject(token) accessor` member types are not yet checked against a typed token.
- `Function.length` ignores parameters with defaults and rest parameters, so the dev-mode warning can be a false alarm for those constructors.
- Member injection tracks the in-progress construction in module-level state, and the ESM and CommonJS builds each have their own copy. Load the decorators and the injector from the same build (all `import` or all `require`); if they come from different builds, field and `accessor` dependencies fall back to the root injector instead of the requesting scope.

## Testing the toolchains

```bash
npm run test:standard                 # SWC
node scripts/test-standard-native.mjs tsc       # tsc native emit
npm install --no-save esbuild@^0.27   # esbuild is not a dependency of the repo
node scripts/test-standard-native.mjs esbuild   # esbuild native emit
```

The `Standard decorators` workflow runs all three, plus `tsc` on every TypeScript release from 5.0 to 5.9.
