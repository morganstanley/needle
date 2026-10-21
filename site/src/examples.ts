/**
 * Live examples. Each `code` string is plain JavaScript run with `needle` (the library namespace)
 * and `log` (writes to the output panel) in scope. They use the registration API with explicit
 * metadata, so they need no decorators or build step and can be edited in the browser.
 *
 * `site/scripts/check-examples.mjs` runs every one of these against the built library, so they cannot rot.
 */
export interface IExample {
    id: string;
    title: string;
    summary: string;
    code: string;
}

export const examples: IExample[] = [
    {
        id: 'basics',
        title: 'Basics',
        summary: 'Register types, resolve them, and see instances shared through the cache.',
        code: `const { getRootInjector } = needle;
const root = getRootInjector();
root.reset();

class Engine { horsepower = 150; }
class Car {
  constructor(engine) { this.engine = engine; }
}

// Metadata tells Needle what to inject into each constructor
root.register(Engine).register(Car, { metadata: [Engine] });

const car = root.get(Car);
log('Car engine:', car.engine.horsepower + 'hp');
log('Engine is shared (cached):', root.get(Engine) === car.engine);`,
    },
    {
        id: 'tokens',
        title: 'Tokens and strategies',
        summary: 'Inject by name, and inject every type registered under a strategy key.',
        code: `const { getRootInjector, METADATA } = needle;
const root = getRootInjector();
root.reset();

class Card { pay(n) { return 'card ' + n; } }
class Cash { pay(n) { return 'cash ' + n; } }
class Checkout {
  constructor(preferred, all) { this.preferred = preferred; this.all = all; }
}

root
  .register(Card, { tokens: ['payment:card'], strategy: 'payments' })
  .register(Cash, { strategy: 'payments' })
  .register(Checkout, { metadata: [METADATA.token, METADATA.strategy] })
  .registerParamForTokenInjection('payment:card', Checkout, 0)
  .registerParamForStrategyInjection('payments', Checkout, 1);

const checkout = root.get(Checkout);
log('Preferred:', checkout.preferred.pay(10));
log('All methods:', checkout.all.map((p) => p.pay(5)).join(', '));
log('Resolve by token directly:', root.get('payment:card') instanceof Card);`,
    },
    {
        id: 'scopes',
        title: 'Scopes',
        summary: 'Child injectors fall back to their parent, can override registrations, and can be destroyed.',
        code: `const { getRootInjector } = needle;
const root = getRootInjector();
root.reset();

class Session { id = Math.random().toString(36).slice(2, 7); }
class TestSession extends Session {}
root.register(Session);

const scope = root.createScope('request-1');
log('Falls back to parent:', scope.get(Session) === root.get(Session));

scope.register(TestSession).register(Session, { resolution: TestSession });
log('Scope override applies:', scope.get(Session) instanceof TestSession);
log('Root is untouched:', !(root.get(Session) instanceof TestSession));
log('Lookup by name:', root.getScope('request-1') === scope);

scope.destroy();
log('Destroyed:', scope.isDestroyed());`,
    },
    {
        id: 'interception',
        title: 'Interceptors',
        summary: 'Hook construction of a type before and after it is created.',
        code: `const { getRootInjector } = needle;
const root = getRootInjector();
root.reset();

class Ticket { serial = Math.random().toString(36).slice(2, 6); }
root.register(Ticket, { cacheStrategy: 'no-cache' });

const interceptor = {
  target: Ticket,
  beforeCreate: (ctx) => log('before create', ctx.type.name),
  afterCreate: (instance) => log('created ticket', instance.serial),
};
root.registerInterceptor(interceptor);

const a = root.get(Ticket);
const b = root.get(Ticket);
log('no-cache gives new instances:', a !== b);`,
    },
    {
        id: 'caching',
        title: 'Caching strategies',
        summary: 'Persistent, no-cache, idle eviction and conditional eviction side by side.',
        code: `const { getRootInjector } = needle;
const root = getRootInjector();
root.reset();

class Persistent {}
class Fresh {}
class Idle {}
root
  .register(Persistent)
  .register(Fresh, { cacheStrategy: 'no-cache' })
  .register(Idle, { cacheStrategy: { type: 'idle', timeout: 200 } });

log('persistent same:', root.get(Persistent) === root.get(Persistent));
log('no-cache same:', root.get(Fresh) === root.get(Fresh));

const first = root.get(Idle);
await new Promise((r) => setTimeout(r, 350));
log('idle evicted after 200ms:', root.get(Idle) !== first);`,
    },
    {
        id: 'lazy-factory-optional',
        title: 'Lazy, factory and optional',
        summary: 'Defer construction, create on demand with arguments, or tolerate a missing dependency.',
        code: `const { getRootInjector, METADATA, AutoFactory, LazyInstance } = needle;
const root = getRootInjector();
root.reset();

class Engine { constructor() { log('Engine constructed'); } }
class Wheel { constructor(size) { this.size = size ?? 16; } }
class Radio {}
class Car {
  constructor(lazyEngine, wheelFactory, radio) {
    this.lazyEngine = lazyEngine; this.wheelFactory = wheelFactory; this.radio = radio;
  }
}

root
  .register(Engine)
  .register(Wheel, { metadata: [Number] })
  .register(Car, { metadata: [Engine, Wheel, Radio] })
  .registerParamForLazyInjection(Engine, Car, 0)
  .registerParamForFactoryInjection(Wheel, Car, 1)
  .registerParamForOptionalInjection(Car, 2);

const car = root.get(Car);
log('Engine built yet?', 'no (lazy)');
log('Lazy value:', car.lazyEngine.value instanceof Engine);
log('Factory wheel:', car.wheelFactory.create(18).size + 'in');
log('Radio is not registered, so it is:', String(car.radio));`,
    },
    {
        id: 'errors',
        title: 'Typed errors',
        summary: 'Failures are typed, carry a stable code, and show the resolution path.',
        code: `const { getRootInjector, TypeNotRegisteredError, NeedleError } = needle;
const root = getRootInjector();
root.reset();

class Wheel {}
class Bike { constructor(wheel) { this.wheel = wheel; } }
root.register(Bike, { metadata: [Wheel] }); // Wheel is never registered

try {
  root.get(Bike);
} catch (e) {
  log('is TypeNotRegisteredError:', e instanceof TypeNotRegisteredError);
  log('is NeedleError:', e instanceof NeedleError);
  log('code:', e.code);
  log('resolution path:', e.resolutionPath.join(' -> '));
}

try { root.get('nope'); } catch (e) { log(e.name + ':', e.message); }`,
    },
    {
        id: 'metrics',
        title: 'Metrics and logging',
        summary: 'Inspect resolution statistics and route diagnostics through your own logger.',
        code: `const { getRootInjector, setLogger, resetLogger } = needle;
const root = getRootInjector();
root.reset();

class Service {}
root.register(Service);
root.get(Service); root.get(Service); root.get(Service);

const record = root.metrics.getMetricsForType(Service);
log('resolutions:', record.resolutionCount, '| dependencies:', record.dependencyCount);

// Redirect metrics.dump() (normally console.table) into the output panel
setLogger({ warn: log, log: (m) => log('dump:', JSON.stringify(m.map((r) => r.name))) });
root.metrics.dump();
resetLogger();`,
    },
];
