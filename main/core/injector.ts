import { v4 as uuid } from 'uuid';
import { Factory } from '../annotations/factory';
import { Inject } from '../annotations/inject';
import { Lazy } from '../annotations/lazy';
import { Strategy } from '../annotations/strategy';
import { DI_ROOT_INJECTOR_KEY, GLOBAL_REGISTRATION_MAP, INJECTOR_TYPE_ID } from '../constants/constants';
import { defaultInjectionConfiguration } from '../constants/defaults';
import {
    ICache,
    IConfiguration,
    IConstructionOptions,
    IInjectionConfiguration,
    IInjectionToken,
    IInjector,
    IMetrics,
    IScopeConfiguration,
    ITokenCache,
    Newable,
} from '../contracts/contracts';
import { createInstance } from '../internal/construction';
import { InstanceCache } from './cache';
import { Configuration } from './configuration';
import { AutoFactory } from './factory';
import { getGlobal, globalState } from './globals';
import { LazyInstance } from './lazy';
import { getConstructorTypes } from './metadata.functions';
import { Metrics } from './metrics';
import { InjectionTokensCache } from './tokens';

const globalReference = getGlobal();

/**
 * Injector type used for registering types for injection
 */
export class Injector implements IInjector {
    public static readonly typeId = INJECTOR_TYPE_ID;
    private _isDestroyed = false;
    private registrations = globalState(GLOBAL_REGISTRATION_MAP, () => new Map<any, IInjectionConfiguration>());
    private children = new Map<string, Injector>();
    public readonly id = uuid();
    public readonly cache: ICache;
    public readonly tokenCache: ITokenCache;
    public readonly configuration: IConfiguration;
    public readonly parent?: IInjector;
    public readonly metrics: IMetrics;

    constructor(
        readonly _cache: InstanceCache,
        readonly _configuration: Configuration,
        readonly _tokenCache: InjectionTokensCache,
        readonly _metrics: Metrics,
        readonly _parent?: IInjector,
        public readonly scope?: IScopeConfiguration,
    ) {
        this.cache = _cache;
        this.configuration = _configuration;
        this.tokenCache = _tokenCache;
        this.parent = _parent;
        this.metrics = this._metrics;
    }

    /**
     * Registers a type and associated injection config with the the injector
     */
    public register(type: any, config: IInjectionConfiguration = defaultInjectionConfiguration): this {
        this.registerTokens(type, config.tokens);
        this.registerStrategy(type, config.strategy);
        this.registrations.set(type, config);
        return this;
    }

    /**
     * Get the list of registration
     */
    public getRegistrations(): Map<any, IInjectionConfiguration> {
        return new Map(this.registrations);
    }

    /**
     * Registers and instance of a type in the container
     */
    public registerInstance<T extends Newable>(type: any, instance: InstanceType<T>): this {
        this.cache.update(type, instance);
        return this;
    }

    /**
     * Registers a parameter for factory injection.  This maps to the @Factory annotation
     */
    public registerParamForFactoryInjection(type: any, ownerType: any, index: number): this {
        Factory(type)(ownerType, undefined, index);
        return this;
    }

    /**
     * Registers a parameter for Lazy injection. This maps to the @Lazy annotation
     */
    public registerParamForLazyInjection(type: any, ownerType: any, index: number): this {
        Lazy(type)(ownerType, undefined, index);
        return this;
    }

    /**
     * Registers a parameter for token injection.  This maps to the @Inject annotation
     */
    public registerParamForTokenInjection(token: string, ownerType: any, index: number): this {
        Inject(token)(ownerType, undefined, index);
        return this;
    }

    /**
     * Registers a parameter for strategy injection.  This maps to the @Strategy annotation
     */
    public registerParamForStrategyInjection(strategy: string, ownerType: any, index: number): this {
        Strategy(strategy)(ownerType, undefined, index);
        return this;
    }

    /**
     * Determine if this is the root injector
     */
    public isRoot(): boolean {
        return this.parent == null;
    }

    /**
     * Determine if this injector is scoped
     */
    public isScoped(): boolean {
        return this.parent != null;
    }

    /**
     * Determine if this injector is destroyed
     */
    public isDestroyed(): boolean {
        return this._isDestroyed;
    }

    /**
     * Destroys this instance of the injector as well as all child injectors in the parents hierarchy
     */
    public destroy(): void {
        // Clear down our registrations and all our children
        this.registrations.clear();
        this.children.forEach(c => c.destroy());

        // Remove ourselves from the parent scope if not root.
        if (this.parent != null) {
            (this.parent as Injector).children.delete(this.id);
        }
        this._isDestroyed = true;
    }

    /**
     * Gets an array of strategies based on a given strategy key
     * @param strategy The key the strategies are registered too
     */
    public getStrategies<T = unknown>(strategy: string): Array<T> {
        if (strategy == null) {
            return [];
        }

        const strategies = [...this.getRegistrations().entries()]
            .filter(([_t, config]) => config.strategy === strategy)
            .map(([t]) => this.get(t, []));
        return strategies;
    }

    /**
     * Gets an AutoFactory for a given type
     * @param type
     */
    public getFactory<T extends Newable>(type: T): AutoFactory<T> {
        return new AutoFactory(type, this, createInstance);
    }

    /**
     * Gets an Lazy<T> for a given type
     * @param type
     */
    public getLazy<T extends Newable>(type: T): LazyInstance<T> {
        return new LazyInstance(() => this.get(type));
    }

    /**
     * Gets an instance of a given type
     */
    public get<T extends Newable>(
        typeOrToken: T | string,
        ancestry: any[] = [],
        options?: IConstructionOptions<T>,
    ): InstanceType<T> {
        // Measuring time taken
        const start = Date.now();

        const constructorType: any =
            typeof typeOrToken === 'string' ? this.tokenCache.getTypeForToken(typeOrToken) : typeOrToken;

        if (constructorType === undefined) {
            throw new Error(
                `Cannot resolve Type with token '${typeOrToken}' as no types have been registered against that token value`,
            );
        }

        // We use a special ID to determine a type could be an injector type
        const isInjectorType = constructorType.typeId === Injector.typeId;

        // Lets check the cache and see if we have an instance ready to service
        let instance = this.cache.resolve(constructorType);

        // Support resolving Injector as injectable if found in the dependency tree
        if (isInjectorType) {
            if (instance == null) {
                // Does the instance being requested share the same prototype as our current injector instance (Or it has no create function)
                if (
                    constructorType === Injector ||
                    (constructorType !== Injector && constructorType.create === undefined)
                ) {
                    instance = this;
                    this.cache.update(constructorType, instance);
                } else {
                    /* If we are here then we have multiple injector versions in play.
                     * we check to see if the type has the static create method.  If
                     * we find it we can instance it using that method. */
                    instance = constructorType.create();
                    this.cache.update(constructorType, instance);
                }
            }
        }

        if (instance == null) {
            // If an external resolution strategy has been set, delegate all responsibility to it
            if (this.configuration.externalResolutionStrategy != null) {
                instance = this.configuration.externalResolutionStrategy.resolver(
                    constructorType,
                    (options || {}).params || [],
                );
                if (this.configuration.externalResolutionStrategy.cacheSyncing === true) {
                    this.cache.update(constructorType, instance);
                }
            } else {
                instance = createInstance(constructorType, true, options as any, ancestry, this);
            }
        }

        // Measuring time taken
        const end = Date.now();

        // Capture metrics on this types usage
        if (this.configuration.trackMetrics) {
            this._metrics.update(constructorType, undefined, end - start);
        }

        return instance;
    }

    /**
     * Returns an Array of the all types registered in the container
     */
    public getRegisteredTypes(): Array<any> {
        return Array.from(this.registrations.keys());
    }

    /**
     * @internal Create a new injector instance for this type (Could change in the future for different versions)
     * @description When multiple versions of the injector are in play, this function ensures we can
     * construct it without doing the work externally. (no introspection required).
     */
    public static create(): Injector {
        return new Injector(new InstanceCache(), new Configuration(), new InjectionTokensCache(), new Metrics());
    }

    /**
     * Returns an array of all the types registered in the container with associated constructor dependencies
     */
    public getRegisteredTypesWithDependencies(): Array<{ provide: any; deps: Array<any> }> {
        return this.getRegisteredTypes().map(t => ({ provide: t, deps: getConstructorTypes(t) }));
    }

    /**
     * Resets the injector back to its default state
     */
    public reset() {
        this._isDestroyed = false;
        this.cache.clear();
        this.tokenCache.clear();
        this.children = new Map<string, Injector>();
        this.registrations.clear();
        this._metrics.clear();
    }

    private registerStrategy(type: any, strategy: string | undefined): void {
        if (strategy != null && strategy.length > 0) {
            const token: IInjectionToken = { token: strategy, owner: type, tokenType: 'multiple' };
            this.tokenCache.register(token);
        }
    }

    private registerTokens(type: any, tokens: string[] = []): void {
        tokens
            .map(token => ({ token, owner: type, tokenType: 'singleton' } as IInjectionToken))
            .forEach(t => {
                if (!this.configuration.allowDuplicateTokens) {
                    const tokenTypes = this.tokenCache.getTypesForToken(t.token);
                    if (tokenTypes.length > 0) {
                        throw new Error(
                            `Cannot register Type '${(type as any).name}' with token ${
                                t.token
                            }. Duplicate token found for the following type '${tokenTypes
                                .map(tt => tt.name)
                                .join(' -> ')}'`,
                        );
                    }
                }

                this.tokenCache.register(t);
            });
    }
}

globalReference[DI_ROOT_INJECTOR_KEY] =
    globalReference[DI_ROOT_INJECTOR_KEY] ||
    new Injector(new InstanceCache(), new Configuration(), new InjectionTokensCache(), new Metrics());
