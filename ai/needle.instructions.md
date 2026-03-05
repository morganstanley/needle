# Needle Consumer Agent Instructions

This file defines guidance for AI agents helping application teams use `@morgan-stanley/needle` in their own projects.

## Audience

- App developers consuming Needle as a dependency.
- AI agents writing or reviewing app code that uses Needle.

## Agent Goals

- Produce code that is valid for published package usage.
- Prefer stable public APIs exported from `@morgan-stanley/needle`.
- Keep examples minimal, copy-ready, and framework-agnostic.
- Do not rely on Needle repo internals (`main/core/*`, `spec/*`, local test scaffolding).

## Quick Start

Install:

```bash
npm install @morgan-stanley/needle
```

Basic usage:

```typescript
import { Injectable, get } from '@morgan-stanley/needle';

@Injectable()
class Pet {}

@Injectable()
class Owner {
    constructor(public pet: Pet) {}
}

const owner = get(Owner);
```

## TypeScript Metadata Modes

Needle supports two metadata approaches.

### Mode A: Explicit metadata (no emitted metadata dependency)

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

class Pet {}

class Owner {
    constructor(public pet: Pet) {}
}

getRootInjector()
    .register(Owner, { metadata: [Pet] })
    .register(Pet);
```

### Mode B: TypeScript-emitted metadata

`tsconfig.json`:

```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

App entrypoint (first import):

```typescript
import 'reflect-metadata';
```

Install dependency:

```bash
npm install reflect-metadata
```

## Import Patterns

Use public package exports only:

```typescript
import {
    Injectable,
    Inject,
    Optional,
    Lazy,
    Factory,
    Strategy,
    Interceptor,
    get,
    getOptional,
    getLazy,
    getRootInjector,
    AutoFactory,
    LazyInstance,
    IConstructionInterceptor,
    IInjectionContext,
} from '@morgan-stanley/needle';
```

Avoid:

```typescript
// Avoid internal paths in consumer apps.
import { Injector } from '@morgan-stanley/needle/main/core/injector';
```

## Common Consumer Patterns

### Constructor injection

```typescript
@Injectable()
class ApiClient {}

@Injectable()
class UserService {
    constructor(public apiClient: ApiClient) {}
}
```

### Token injection

```typescript
@Injectable({
    tokens: ['base-url'],
})
class BaseUrlValue {
    constructor(public value: string) {}
}

@Injectable()
class ApiConfig {
    constructor(@Inject('base-url') public baseUrl: BaseUrlValue) {}
}
```

### Register primitive values

```typescript
import { Injectable, Inject, getRootInjector } from '@morgan-stanley/needle';

const injector = getRootInjector();
injector.registerValue('api-key', 'abc123');

@Injectable()
class Secrets {
    constructor(@Inject('api-key') public apiKey: string) {}
}

const secrets = injector.get(Secrets);
```

### Optional dependencies

```typescript
@Injectable()
class Telemetry {}

@Injectable()
class Worker {
    constructor(@Optional() public telemetry: Telemetry) {}
}
```

### Lazy dependencies

```typescript
@Injectable()
class ExpensiveService {}

@Injectable()
class Handler {
    constructor(@Lazy(ExpensiveService) public lazyService: LazyInstance<typeof ExpensiveService>) {}

    run(): void {
        const service = this.lazyService.value;
        void service;
    }
}
```

### Factory dependencies

```typescript
@Injectable()
class Report {
    constructor(public id: string) {}
}

@Injectable()
class ReportController {
    constructor(@Factory(Report) private reportFactory: AutoFactory<typeof Report>) {}

    createReport(): Report {
        return this.reportFactory.create();
    }
}
```

### Strategy collections

```typescript
interface PaymentStrategy {
    name: string;
}

@Injectable({ strategy: 'payment-strategies' })
class CardStrategy implements PaymentStrategy {
    name = 'card';
}

@Injectable({ strategy: 'payment-strategies' })
class WireStrategy implements PaymentStrategy {
    name = 'wire';
}

@Injectable()
class Checkout {
    constructor(@Strategy('payment-strategies') public strategies: PaymentStrategy[]) {}
}
```

### Interceptors

```typescript
@Injectable()
class Engine {}

@Interceptor()
class EngineInterceptor implements IConstructionInterceptor<typeof Engine> {
    public target: typeof Engine = Engine;

    public beforeCreate(context: IInjectionContext<typeof Engine>): void {
        void context;
    }

    public afterCreate(instance: Engine, context: IInjectionContext<typeof Engine>): void {
        void instance;
        void context;
    }
}
```

### Scopes

```typescript
const root = getRootInjector();
const requestScope = root.createScope('request');

requestScope.registerValue('request-id', 'req-001');

const requestId = requestScope.get<string>('request-id');
void requestId;

requestScope.destroy();
```

### Convenience helpers

```typescript
@Injectable()
class Child {
    public age = 7;
}

const child = get(Child);
const maybeChild = getOptional(Child);
const lazyChildFactory = getLazy(Child);
const lazyChild = lazyChildFactory();

void child;
void maybeChild;
void lazyChild;
```

## Consumer Testing Pattern

Use your app test framework and isolate container state between tests.

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { Injectable, getRootInjector } from '@morgan-stanley/needle';

describe('Needle in app tests', () => {
    beforeEach(() => {
        getRootInjector().reset();
    });

    it('resolves dependencies', () => {
        @Injectable()
        class Service {}

        const injector = getRootInjector();
        injector.register(Service);

        expect(injector.get(Service)).toBeDefined();
    });
});
```

## Guardrails For Consumer Code

- Use `getRootInjector().reset()` in tests to avoid cross-test state bleed.
- Prefer constructor injection instead of service locator usage inside business logic.
- Keep token names centralized to avoid typos (`const TOKENS = { apiKey: 'api-key' }`).
- If using emitted metadata mode, ensure `reflect-metadata` is imported before decorated classes execute.
- If you need deterministic construction for a class with runtime args, use factory patterns.

## Troubleshooting

- Error: cannot resolve type.
  - Confirm class is decorated with `@Injectable()` or registered explicitly.
  - Confirm dependency metadata exists (explicit metadata or emitted metadata config).
- Error: token not found.
  - Confirm token registration happened before resolution.
  - Confirm exact token identity (same string or same symbol instance).
- Unexpected shared instances.
  - Needle caches by default; use scopes or explicit cache strategy configuration when needed.

## What Agents Should Not Do

- Do not import from Needle internal source paths.
- Do not assume project-specific frameworks unless the user asks for one.
- Do not overwrite user injector configuration unexpectedly.
- Do not introduce repository-contributor workflows into consumer setup docs.
