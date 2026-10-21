# Troubleshooting

## `Cannot construct Type 'X' with ancestry 'A -> X' ...`

Needle could not find a registration for `X`. This is a `TypeNotRegisteredError`; its `resolutionPath` shows the chain that led to it. Check, in order:

1. `X` is decorated with `@Injectable()` **or** registered with `getRootInjector().register(X)`.
2. The file that declares `X` is actually imported somewhere before you resolve. Decorators run when the module loads, so an unimported file means no registration.
3. If the dependency is genuinely optional, mark the parameter `@Optional()`.
4. Abstract classes and interfaces cannot be constructed. Register a concrete type against a token or use an [external resolution strategy](external-resolution.md).

## Parameters resolve to `undefined` / `Object` or you get `Cannot construct Type 'Object'`

Metadata for the constructor was not emitted.

- Turn on `experimentalDecorators` **and** `emitDecoratorMetadata` in `tsconfig.json`.
- Import `reflect-metadata` once, as the very first import of your app (and in your test setup).
- If your build tool does not emit decorator metadata (esbuild, `tsx`, Vite without SWC/Babel plugins), either switch to a plugin that does, or use [explicit metadata](getting-started.md#injectable-basics): `@Injectable({ metadata: [Pet] })`.
- Type-only imports erase the class. Use a normal `import { Pet }`, not `import type`.
- Interfaces have no runtime value: inject them with a [token](tokens.md).

## `max tree depth has been reached`

Almost always a circular dependency (`A` needs `B` needs `A`). Break the cycle with [`@Lazy`](lazy-and-optional.md) on one side, or inject a [factory](factories.md). If your graph is legitimately deep, raise `configuration.maxTreeDepth` (default 100).

## `Duplicate token found`

Two types registered the same token. Either use unique tokens, or opt in to overriding with `allowDuplicateTokens` (see [tokens](tokens.md#token-overriding) and [configuration](configuration.md)).

## `the current injector instance is marked as destroyed`

You called `get` on a scope after `destroy()`. Create a new scope, or avoid keeping references to disposed scopes.

## My cached instance disappeared

Check the registration's `cacheStrategy`: `weak-reference` instances can be garbage collected, `idle` ones are evicted after the timeout, and `conditional` ones when the predicate returns true. See [caching](caching.md).

## Tests share state between each other

The root injector is global. Call `getRootInjector().reset()` in `beforeEach`, or create isolated scopes with `createScope()` per test and `destroy()` them afterwards.

## Multiple copies of Needle in `node_modules`

Each copy registers its own `Injector` type against the shared global root. Needle detects injectors by a type id, so injecting `Injector` works across versions, but registrations made through one copy are visible to all of them. If behaviour looks inconsistent, run `npm ls @morgan-stanley/needle` and dedupe.

## Angular

Needle's decorators cannot be used in the constructor of an Angular component. Inject `Injector` instead; see [Angular](angular.md).
