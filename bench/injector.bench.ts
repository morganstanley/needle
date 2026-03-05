import { bench, describe } from 'vitest';
import { Configuration } from '../main/core/configuration';
import { Injector } from '../main/core/injector';
import { InstanceCache } from '../main/core/cache';
import { Metrics } from '../main/core/metrics';
import { InjectionTokensCache } from '../main/core/tokens';
import { AutoFactory, Factory, Inject, Lazy, LazyInstance, Optional, Strategy } from '../main';

class Leaf {}

class Branch {
    constructor(public leaf: Leaf) {}
}

class Trunk {
    constructor(public branch: Branch) {}
}

class AlternateLeaf {}

class OptionalEngine {}

class OptionalVehicle {
    constructor(@Optional() public engine?: OptionalEngine) {}
}

class LazyVehicle {
    constructor(@Lazy(Leaf) public lazyLeaf?: LazyInstance<typeof Leaf>) {}
}

class FactoryConsumer {
    constructor(@Factory(Leaf) public leafFactory?: AutoFactory<typeof Leaf>) {}
}

class StrategyA {}

class StrategyB {}

class StrategyConsumer {
    constructor(@Strategy('transport-strategy') public strategies?: Array<unknown>) {}
}

class TokenConsumer {
    constructor(@Inject('leaf-token') public leaf?: Leaf) {}
}

function createInjector(): Injector {
    return new Injector(new InstanceCache(), new Configuration(), new InjectionTokensCache(), new Metrics());
}

function consume(value: unknown): void {
    if (value === undefined) {
        return;
    }
}

describe('Injector Benchmarks', () => {
    const tokenSymbol = Symbol.for('leaf-symbol-token');

    const cachedInjector = createInjector().register(Leaf);
    const uncachedInjector = createInjector().register(Leaf, {
        cacheStrategy: 'no-cache',
    });
    const graphInjector = createInjector()
        .register(Leaf)
        .register(Branch, {
            metadata: [Leaf],
            cacheStrategy: 'no-cache',
        })
        .register(Trunk, {
            metadata: [Branch],
            cacheStrategy: 'no-cache',
        });

    const tokenInjector = createInjector().register(Leaf, {
        tokens: ['leaf-token', tokenSymbol],
    });

    const tokenConsumerInjector = createInjector()
        .register(Leaf, {
            tokens: ['leaf-token'],
        })
        .register(TokenConsumer, {
            metadata: [Leaf],
            cacheStrategy: 'no-cache',
        });

    const aliasInjector = createInjector()
        .register(Leaf)
        .register(AlternateLeaf, {
            resolution: Leaf,
        });

    const optionalMissingInjector = createInjector().register(OptionalVehicle, {
        metadata: [OptionalEngine],
        cacheStrategy: 'no-cache',
    });

    const optionalPresentInjector = createInjector()
        .register(OptionalEngine)
        .register(OptionalVehicle, {
            metadata: [OptionalEngine],
            cacheStrategy: 'no-cache',
        });

    const lazyInjector = createInjector()
        .register(Leaf)
        .register(LazyVehicle, {
            metadata: [Leaf],
            cacheStrategy: 'no-cache',
        });

    const factoryInjector = createInjector()
        .register(Leaf)
        .register(FactoryConsumer, {
            metadata: [Leaf],
            cacheStrategy: 'no-cache',
        });

    const strategyInjector = createInjector()
        .register(StrategyA, {
            strategy: 'transport-strategy',
            cacheStrategy: 'no-cache',
        })
        .register(StrategyB, {
            strategy: 'transport-strategy',
            cacheStrategy: 'no-cache',
        })
        .register(StrategyConsumer, {
            metadata: [Array],
            cacheStrategy: 'no-cache',
        });

    const valueInjector = createInjector().registerValue({
        tokens: ['app-config'],
        value: {
            retries: 3,
        },
    });

    const instanceInjector = createInjector();
    const preBuiltLeaf = new Leaf();
    instanceInjector.registerInstance(Leaf, preBuiltLeaf);

    const reportingInjector = createInjector()
        .register(Leaf)
        .register(Branch, {
            metadata: [Leaf],
        })
        .register(Trunk, {
            metadata: [Branch],
        });

    const scopedInjector = createInjector().register(Leaf);
    const scopeLookupInjector = createInjector();
    scopeLookupInjector.createScope('bench-scope-a');
    scopeLookupInjector.createScope('bench-scope-b');

    let scopeCounter = 0;

    bench('resolve cached singleton dependency', () => {
        cachedInjector.get(Leaf);
    });

    bench('resolve no-cache dependency', () => {
        uncachedInjector.get(Leaf);
    });

    bench('resolve shallow graph (Branch -> Leaf)', () => {
        graphInjector.get(Branch);
    });

    bench('resolve deeper graph (Trunk -> Branch -> Leaf)', () => {
        graphInjector.get(Trunk);
    });

    bench('resolve by string token', () => {
        tokenInjector.get('leaf-token');
    });

    bench('resolve by symbol token', () => {
        tokenInjector.get(tokenSymbol);
    });

    bench('resolve token via @Inject constructor parameter', () => {
        tokenConsumerInjector.get(TokenConsumer);
    });

    bench('resolve alias type via resolution mapping', () => {
        aliasInjector.get(AlternateLeaf);
    });

    bench('resolve optional dependency when missing', () => {
        optionalMissingInjector.get(OptionalVehicle);
    });

    bench('resolve optional dependency when present', () => {
        optionalPresentInjector.get(OptionalVehicle);
    });

    bench('resolve Lazy wrapper and materialize value', () => {
        const lazyVehicle = lazyInjector.get(LazyVehicle);
        consume(lazyVehicle.lazyLeaf?.value);
    });

    bench('resolve AutoFactory and create dependency', () => {
        const owner = factoryInjector.get(FactoryConsumer);
        owner.leafFactory?.create();
    });

    bench('resolve strategy collection with @Strategy', () => {
        strategyInjector.get(StrategyConsumer);
    });

    bench('resolve registered value by token', () => {
        valueInjector.get('app-config');
    });

    bench('resolve pre-registered instance', () => {
        instanceInjector.get(Leaf);
    });

    bench('get registered types list', () => {
        reportingInjector.getRegisteredTypes();
    });

    bench('get registered types with dependencies', () => {
        reportingInjector.getRegisteredTypesWithDependencies();
    });

    bench('resolve missing dependency with getOptional', () => {
        uncachedInjector.getOptional('missing-token');
    });

    bench('resolve type with getLazy', () => {
        const lazy = cachedInjector.getLazy(Leaf);
        consume(lazy.value);
    });

    bench('resolve type with getFactory', () => {
        const factory = cachedInjector.getFactory(Leaf);
        factory.create();
    });

    bench('lookup scope by name', () => {
        scopeLookupInjector.getScope('bench-scope-b');
    });

    bench('create nested scope and resolve from parent registration', () => {
        const scope = scopedInjector.createScope(`nested-${scopeCounter++}`);
        scope.get(Leaf);
        scope.destroy();
    });

    bench('create and destroy scope', () => {
        const scope = scopedInjector.createScope(`bench-${scopeCounter++}`);
        scope.destroy();
    });
});
