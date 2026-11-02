# Design note: standard (TC39) decorators

Status: **implemented**. User guide: [Standard decorators](../standard-decorators.md). This note records the design reasoning; the sections below were written during the spike.

## Problem

Needle's decorators (`@Injectable`, `@Inject`, `@Factory`, `@Lazy`, `@Optional`, `@Strategy`, `@Interceptor`) are written for
TypeScript's legacy `experimentalDecorators` + `emitDecoratorMetadata`. Two things in that model do not exist in standard
(stage 3, TS 5.0+ non-experimental) decorators:

1. **Parameter decorators.** `constructor(@Inject('x') a: A)` is not part of the standard. Everything except `@Injectable` and
   `@Interceptor` is a parameter decorator today.
2. **`design:paramtypes`.** Needle reads constructor parameter types from `reflect-metadata` (written by
   `emitDecoratorMetadata`). Standard decorators emit nothing, and TS ignores `emitDecoratorMetadata` when
   `experimentalDecorators` is off. (Decorator `context.metadata` exists in the standard, but it does not carry types.)

Consumers on modern toolchains (Vite/oxc/esbuild defaults, TS 5+ projects, newer Angular alternatives) increasingly cannot or
do not want to turn the legacy flags on.

## Approach

Keep one set of decorator names that works in both modes, and add an explicit, decorator-independent way to describe
constructor dependencies.

### 1. Runtime style detection

A standard decorator is called with `(value, context)` where `context` is an object with a string `kind`. A legacy
parameter decorator is called with `(target, propertyKey | undefined, parameterIndex)`, so its second argument is never an
object. `isStandardContext()` (`main/annotations/decorator-support.ts`) checks exactly that, which is unambiguous.

Programmatic APIs such as `registerParamForTokenInjection` call the decorators with the legacy shape and keep working.

### 2. Constructor injection: `deps`

`IInjectionConfiguration` gets a new `deps` list. It replaces both parameter decorators and `design:paramtypes`:

```ts
import { Injectable, dep } from '@morgan-stanley/needle';

@Injectable({
    deps: [
        Engine,
        dep.token('config'),
        dep.optional(Logger),
        dep.lazy(Wheels),
        dep.factory(Door),
        dep.strategy('handlers'),
    ],
})
class Car {
    constructor(
        engine: Engine,
        config: Config,
        logger: Logger | undefined,
        wheels: LazyInstance<Wheels>,
        doors: AutoFactory<typeof Door>,
        handlers: Handler[],
    ) {}
}
```

- A plain class is a type dependency (what `design:paramtypes` provides today).
- `dep.token(t)` = `@Inject(t)`, `dep.optional(X)` = `@Optional()` (X may be a type or token), `dep.lazy(X)` = `@Lazy(X)`,
  `dep.factory(X)` = `@Factory(X)`, `dep.strategy(s)` = `@Strategy(s)`.
- `Injector.register()` expands `deps` into `metadata` (the existing explicit-metadata mechanism) plus parameter tokens in the
  registering injector's token cache (`main/core/injection/deps.ts`). So the resolution code is unchanged and `deps` also works
  with `injector.register(Type, { deps })` and with no decorators at all.
- If `metadata` is also supplied it wins for the types; `deps` only adds tokens.
- Positions matter, as with constructor parameters. `deps` on `@Injectable` is not type-checked (decorators cannot see the constructor type), but the decorator-free `injectable(Car, [...])` helper is (see 'Typed tokens, `injectable()` and dev warning').

### 3. Field and accessor injection

Standard decorators can decorate fields and `accessor`s, so the same decorators accept those:

```ts
@Injectable()
class Car {
    @Inject(Engine) accessor engine!: Engine; // type target
    @Inject('config') accessor config!: Config; // token target
    @Optional(Logger) accessor logger: Logger | undefined;
    @Lazy(Wheels) accessor wheels!: LazyInstance<Wheels>;
    @Factory(Door) accessor doors!: AutoFactory<typeof Door>;
    @Strategy('handlers') accessor handlers!: Handler[];
}
```

- **`accessor` (recommended):** resolved lazily on first read, then stored. Lazy resolution means cyclic references and optional
  dependencies behave better than with constructor injection.
- **plain field:** resolved eagerly during field initialisation (`@Inject(Engine) engine!: Engine`). Note `useDefineForClassFields`
  semantics apply, and `!` fields get `undefined` first, the decorator initialiser replaces it.
- A value from the field initialiser (`accessor x = 'manual'`) wins over injection.
- **Which injector?** `createInstance` now wraps `new type(...)` in `runWithConstructingInjector` (a small stack in
  `main/core/injection/construction-context.ts`). Initialisers read it, so an instance resolved from a scoped injector gets its
  members from that injector. `new Foo()` outside the injector falls back to the root injector.
- `@Inject(Type)` is now accepted in addition to string/symbol tokens. On a **legacy constructor parameter** a type target
  throws a clear error (parameter tokens are string/symbol only).
- `@Optional()` with no argument has no type to look up, so on a field/accessor it must be `@Optional(Target)`; it throws otherwise.
- Static members and methods/getters/setters are rejected with a descriptive error.

### 4. Class decorators

`@Injectable(config)` and `@Interceptor()` now accept (and ignore) the optional context argument, so they are valid standard class
decorators. Nothing else was needed for registration.

### 5. Types

`@Inject`/`@Optional`/`@Lazy`/`@Factory`/`@Strategy` return `IInjectionDecorator`, an overloaded callable type that is valid as a legacy
parameter decorator, a standard accessor decorator, and a standard field decorator. It relies on `ClassAccessorDecoratorTarget`
etc. from TS 5.0's `lib.decorators.d.ts` (the repo uses TS 5.9).

## What was built

| Piece                                         | File                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| style detection + dual-mode decorator factory | `main/annotations/decorator-support.ts`                                                                      |
| updated decorators                            | `main/annotations/{inject,optional,lazy,factory,strategy,injectable,interceptor}.ts`                         |
| `deps` + `dep` helpers                        | `main/core/injection/deps.ts`, `contracts.ts` (`deps`, `IDependencyDescriptor`)                              |
| constructing-injector context                 | `main/core/injection/construction-context.ts`, `resolution.ts`                                               |
| standard-mode tests                           | `spec-standard/standard-decorators.spec.ts` (24 tests)                                                       |
| typed tokens, `injectable()`, warning tests   | `spec-standard/typed-deps.spec.ts`, `main/core/typed-token.spec.ts`, `main/core/injection/deps.warn.spec.ts` |
| `deps` + legacy regression tests              | `main/core/injector.deps.spec.ts`                                                                            |

### Test setup

`spec-standard/` is a separate project: its own `tsconfig.json` (`experimentalDecorators: false`, `emitDecoratorMetadata: false`,
type-checked by `npm run test:types`) and `vitest.standard.config.ts` (SWC with `decoratorVersion: '2022-03'`, no `reflect-metadata`).
`npm test` runs the legacy suite and then `npm run test:standard`. One test asserts `Reflect.getMetadata` is undefined and another
asserts constructor params are **not** inferred without `deps`, so the project can't silently fall back to legacy behaviour.

## What works / what doesn't

Works under standard decorators (tested): `@Injectable` (+ tokens, strategy), `deps` for types/tokens/optional/lazy/factory/strategy,
accessor and field injection of type, token, optional, lazy, factory and strategy, scoped-injector resolution, `new` fallback,
`@Interceptor`.

Limitations:

- **No type inference for constructor parameters.** Without `deps` a standard-decorated class resolves with no arguments (explicit
  test). Mitigated by the dev-mode warning (partial: default/rest params are not counted in `Function.length`), and
  `injectable()` for compile-time checking.
- **`deps` on `@Injectable` is positional and not type-checked** (a class decorator cannot constrain the class's own constructor). Use `injectable(Car, [...])` for compile-time checking.
- **Parameter decorators don't exist**, so `constructor(@Inject('x') a)` is legacy-only by definition.
- **Field/accessor injection is not available during the constructor body** for plain fields of subclasses until initialisation
  order allows it; `accessor` resolves lazily so is safe, eager fields run at field init, before the constructor body but after
  `super()`.
- **Members are resolved against the requesting injector** (as constructor params are), so objects created manually with `new` use the root
  injector, never a scope. The construction stack lives on `globalThis` (`Symbol.for`), shared by the ESM and CJS copies, and
  eager field cycles throw `MaxDepthExceededError`.
- No class-member `@Injectable` inheritance semantics were designed: decorated members on a base class are initialised per
  instance by the base class's own decorators (works naturally) but this is untested.
- Interceptors still match on an exact `target` type, unchanged.
- `context.metadata` (decorator metadata proposal) is not used. It could carry per-class tokens without touching the global token cache.
- Tested against SWC `2022-03`, `tsc` native emit (TS 5.0 to 5.9) and esbuild native emit. Babel is not tested (`2023-05+` can differ in ordering edge cases).

## Typed tokens, `injectable()` and dev warning

Added after the first prototype (see [the guide](../standard-decorators.md)).

**`createToken<T>(description?)`** returns `Token<T> = symbol & { [brand]: T }`, a unique symbol at runtime. So it needs no changes in
the token cache, `@Inject`, `tokens` or `deps`, and `get`/`getOptional`/`getLazy` gained `Token<T>` overloads (on `IInjector`,
`Injector` and the global helpers) that return `T`, `T | undefined` and `LazyInstance<T>`. A bare token in `deps` is shorthand
for `dep.token(token)`. Not done: checking `registerValue` values or `@Inject(token) accessor x` member types against `T`.

**`injectable(Type, deps, config?)`** registers on the root injector and returns the class. `deps: DepsFor<ConstructorParameters<C>>`
maps each constructor parameter `P` to `Newable<P> | Token<P> | Dependency<P>`. The `dep.*` helpers now return `Dependency<T>`,
an `IDependencyDescriptor` carrying a phantom `() => T` (a function type, so `dep.optional(X)` is `X | undefined` and is rejected
where `X` is required). `dep.optional(X)` gives `X | undefined`, `dep.lazy(X)` `LazyInstance<X>`, `dep.factory(X)` `AutoFactory<typeof X>`;
string tokens are `Dependency<any>`. Limits: structural typing accepts any class with the same shape; abstract classes are not `Newable`.

**Dev warning**: `Injectable()` receives the standard decorator context, so it knows when it is a standard decorator and calls
`warnOnDepsMismatch`. It warns (via `getLogger().warn`, unless `NODE_ENV === 'production'`) when `deps.length !== type.length`, or when
`type.length > 0` and neither `deps` nor `metadata` is given. Legacy usage (no context) is never warned. A longer `deps` than
`Function.length` can be a false positive for constructors with defaults or rest parameters, and the message says so.

**CI** (`.github/workflows/standard-decorators.yml`): SWC, `tsc` and esbuild native emit jobs, and a TypeScript 5.0 to 5.9 matrix. The native-emit
jobs compile `spec-standard/` then run the output with `vitest.native.config.ts` (`scripts/test-standard-native.mjs`). The
version matrix uses `--skipLibCheck` for `tsc --noEmit` because the repo's `@types/node` needs newer TypeScript than 5.0/5.1.
Two small fixes were needed for old TypeScript: `WeakKey` (TS 5.2+) in `cache.ts` became `object`.

## Migration

Nothing changes for existing legacy users: all 350 pre-existing tests pass unchanged. Legacy decorators remain the default path.

To move a class to standard decorators:

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

// after (standard) - option A: deps
@Injectable({ deps: [Engine, dep.token('cfg'), dep.optional(Logger)] })
class Car {
    constructor(
        private engine: Engine,
        private cfg: Config,
        private log?: Logger,
    ) {}
}

// after (standard) - option B: members
@Injectable()
class Car {
    @Inject(Engine) accessor engine!: Engine;
    @Inject('cfg') accessor cfg!: Config;
    @Optional(Logger) accessor log: Logger | undefined;
}
```

`deps` also works with legacy decorators if a team wants to drop `reflect-metadata` before dropping `experimentalDecorators`.

## Risks

- The `Injectable` type signature changed from `(type: T) => void` to `(type: T, _context?) => void`. Source-compatible, but anyone
  wrapping `Injectable()` by hand with a strict function type could notice.
- `@Inject`'s parameter widened (`StringOrSymbol | Newable`) and decorator return types are now `IInjectionDecorator` instead of
  bare functions. Any consumer calling them directly as `(target, undefined, index)` still type-checks.
- Needs TS >= 5.0 for the types (a `peerDependency`/docs note, effectively already true given the repo's TS).
- The constructing-injector stack is synchronous module state; `await` inside a constructor is impossible so this is safe, but a
  constructor that triggers another resolution is handled by the stack.
- Two code paths to maintain and test (legacy + standard) until legacy is dropped.

## Open questions

1. (Answered by `injectable()`) Should a `static inject = [...]` convention (Angular-style) also exist? It would let a class carry its own deps and still be checked via a `satisfies`-style helper.
2. (Done) `createToken<T>()`. Remaining: check `registerValue({ tokens: [T], value })` and `@Inject(T) accessor` member types against `T`.
3. Should accessor injection be the documented preferred style for standard mode, with `deps` for constructor-style code?
4. (Done) dev-mode warning for `Function.length` vs `deps.length`. Should it be opt-out via `Configuration`?
5. Use `context.metadata` to carry member injection info instead of per-instance `WeakMap`/stack tricks?
6. (Done) Dual ESM/CJS publish: both builds share the root injector via `globalThis`, and standard decorators are tested against both builds in `scripts/test-package.mjs`.

## Recommended next steps

1. Review/approve the API shape (`deps`, `dep.*`, `createToken`, `injectable`, accessor injection).
2. Type-check `registerValue` and `@Inject(token) accessor` against the token type; consider a `Configuration` switch for the warning.
3. Add a docs-site example with a toggle between legacy and standard.
4. Decide the major/minor version story (additive, so a minor; `deps` could stay "experimental" for a release).
