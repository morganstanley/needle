import { generateUUID } from '../core/uuid.js';
import { Factory } from '../annotations/factory.js';
import { Inject } from '../annotations/inject.js';
import { Lazy } from '../annotations/lazy.js';
import { Optional } from '../annotations/optional.js';
import { Strategy } from '../annotations/strategy.js';
import { DI_ROOT_INJECTOR_KEY, INJECTOR_TYPE_ID } from '../constants/constants.js';
import { defaultInjectionConfiguration } from '../constants/defaults.js';
import {
    ICache,
    IConfiguration,
    IConstructionInterceptor,
    IConstructionOptions,
    IInjectionConfiguration,
    IInjector,
    IMetrics,
    InjectorIdentifier,
    InstanceOfType,
    ITokenCache,
    Newable,
    StringOrSymbol,
    IValueInjectionConfiguration,
    ValueType,
    ResolvedType,
} from '../contracts/contracts.js';
import { MissingValueTokenError } from './errors.js';
import { InstanceCache } from './cache.js';
import { Configuration } from './configuration.js';
import { AutoFactory } from './factory.js';
import { getGlobal } from './globals.js';
import { createBoxedValueType } from './boxing.js';
import { LazyInstance } from './lazy.js';
import { getConstructorTypes } from './metadata.functions.js';
import { Metrics } from './metrics.js';
import { InjectionTokensCache } from './tokens.js';
import { addInterceptor } from './injection/interceptors.js';
import { normalizeRegistration, registerStrategyToken, registerTypeTokens } from './injection/registration.js';
import { assertNotDestroyed, createInstanceFactory, resolveInstance } from './injection/resolution.js';
import { findInjectorForTypeOrToken, findScope, getRootInjector } from './injection/scoping.js';
import { IConstructionOptionsInternal } from './injection/types.js';
import { scheduleVerify } from './injection/verify.js';

export type { IConstructionOptionsInternal } from './injection/types.js';

/**
 * Injector type used for registering types for injection
 */
export class Injector implements IInjector {
    static verify = false;

    /**
     * Creates a new map from our internal child maps
     */
    public get children(): Map<InjectorIdentifier, IInjector> {
        return this._children;
    }

    /**
     * @internal Create a new injector instance for this type (Could change in the future for different versions)
     * @description When multiple versions of the injector are in play, this function ensures we can
     * construct it without doing the work externally. (no introspection required).
     */
    public static create(
        parent?: IInjector,
        name?: string,
        configuration: Configuration = new Configuration(),
    ): Injector {
        return new Injector(
            new InstanceCache(),
            configuration,
            new InjectionTokensCache(),
            new Metrics(),
            parent,
            name,
        );
    }
    public static readonly typeId = INJECTOR_TYPE_ID;
    private _isDestroyed = false;
    private readonly _registrations = new Map<any, IInjectionConfiguration>();
    private readonly _interceptors = new Map<any, IConstructionInterceptor[]>();
    private readonly _children = new Map<InjectorIdentifier, Injector>();
    public readonly id = generateUUID();

    public readonly cache: ICache;
    public readonly tokenCache: ITokenCache;
    public readonly configuration: IConfiguration;
    public readonly metrics: IMetrics;

    constructor(
        cache: InstanceCache,
        configuration: Configuration,
        tokenCache: InjectionTokensCache,
        metrics: Metrics,
        public readonly parent?: IInjector,
        public readonly name?: string,
    ) {
        this.cache = cache;
        this.configuration = configuration;
        this.tokenCache = tokenCache;
        this.metrics = metrics;
    }

    /**
     * Registers an interceptor with the root injector
     * @param interceptor
     */
    public registerInterceptor(interceptor: IConstructionInterceptor<any>): this {
        addInterceptor(getRootInjector(this)._interceptors, interceptor);
        return this;
    }

    /**
     * Registers a type and associated injection config with the the injector
     */
    public register(type: any, config: IInjectionConfiguration = defaultInjectionConfiguration): this {
        // Make a shallow copy and normalise the resolution strategy
        config = normalizeRegistration(config);

        registerTypeTokens(this.tokenCache, this.configuration, type, config.tokens);
        registerStrategyToken(this.tokenCache, type, config.strategy);
        this._registrations.set(type, config);
        return this;
    }

    public registerValue<T extends ValueType>(configuration: IValueInjectionConfiguration<T>): this {
        if (configuration.tokens == null || configuration.tokens.length === 0) {
            throw new MissingValueTokenError();
        }

        // Create a boxed value type, then an instance of it.
        const BoxedValue = createBoxedValueType();
        const boxedValueInstance = new BoxedValue(this, configuration.value);

        //Now we can just register this type and its instance with the standard injector register method
        this.registerInstance(BoxedValue, boxedValueInstance, configuration);

        return this;
    }

    /**
     * Gets a scoped injector using the Id or the Name
     * @param nameOrId The name or the ID of the scope;
     * @description Will perform a breadth-first search
     */
    public getScope(nameOrId: string): IInjector | undefined {
        return findScope(this, nameOrId);
    }

    /**
     * Creates a child scope.
     * @param name optional name for the scope (Duplicates allowed in the tree but not in child collection)
     */
    public createScope(name: string): IInjector {
        const child = this.create(this, name);
        this._children.set(child.id, child);
        return child;
    }

    /**
     * Get the list of registration
     */
    public getRegistrations(): Map<any, IInjectionConfiguration> {
        return new Map(this._registrations);
    }

    /**
     * Registers and instance of a type in the container
     */
    public registerInstance<T extends Newable>(
        type: any,
        instance: InstanceOfType<T>,
        config: IInjectionConfiguration = defaultInjectionConfiguration,
    ): this {
        const existingRegistration = this.getRegistrationForType(type);
        //We should only register it if there is no existing registration OR its not the default registration.
        if (
            existingRegistration == null ||
            (existingRegistration != null && config !== defaultInjectionConfiguration)
        ) {
            // Auto add the registration details
            this.register(type, config);
        }

        // Preload the cache
        this.cache.update(type, instance, existingRegistration);
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
     * Registers a parameter for Optional injection. This maps to the @Optional annotation
     */
    public registerParamForOptionalInjection(ownerType: any, index: number): this {
        Optional()(ownerType, undefined, index);
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
    public destroy(parent?: IInjector): void {
        // Destroy our branch of the tree.
        this.children.forEach((c) => c.destroy(this));

        // We only remove ourselves from the parent if this instance had its destroy invoked not via its parent injector
        if (parent == null && this.parent != null) {
            this.parent.children.delete(this.id);
        }

        // Clear out all the local data (registrations, cache etc)
        this.reset();

        // Mark as destroyed
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

        const strategies: Array<T> = [];
        this._registrations.forEach((config, type) => {
            if (config.strategy === strategy) {
                strategies.push(this.get(type, []) as T);
            }
        });

        return strategies;
    }

    /**
     * Gets an AutoFactory for a given type
     * @param type
     */
    public getFactory<T extends Newable>(type: T): AutoFactory<T> {
        return new AutoFactory<any>(type, this, (...args: [any, boolean?, any?, any[]?, IInjector?]) =>
            createInstanceFactory(this, ...args),
        );
    }

    /**
     * Gets an Lazy<T> for a given type
     * @param typeOrToken
     */
    public getLazy<T>(typeOrToken: T | StringOrSymbol): LazyInstance<ResolvedType<T>> {
        return new LazyInstance<any>(() => this.get(typeOrToken));
    }

    /**
     * Resolves a type and optional returns undefined if no registrations present
     */
    public getOptional<T>(type: T | StringOrSymbol): InstanceOfType<ResolvedType<T>> | undefined {
        return this.getImpl(type as unknown as Newable, [], { mode: 'optional' });
    }

    public get<T>(
        typeOrToken: T | StringOrSymbol,
        ancestry: any[] = [],
        options?: T extends Newable ? IConstructionOptions<T> : never,
    ): InstanceOfType<ResolvedType<T>> {
        return this.getImpl(typeOrToken, ancestry, options) as InstanceOfType<any>;
    }

    /**
     * Returns an Array of the all types registered in the container
     */
    public getRegisteredTypes(): Array<any> {
        return Array.from(this._registrations.keys());
    }

    /**
     * Returns an array of all the types registered in the container with associated constructor dependencies
     */
    public getRegisteredTypesWithDependencies(): Array<{ provide: any; deps: Array<any> }> {
        return this.getRegisteredTypes().map((t) => ({ provide: t, deps: getConstructorTypes(t) }));
    }

    /**
     * Resets the injector back to its default state
     */
    public reset() {
        this.cache.clear();
        this.tokenCache.clear();
        this.children.clear();
        this._registrations.clear();
        this.metrics.clear();
        this._interceptors.clear();
    }

    public getInterceptorsForType(type: any): IConstructionInterceptor[] | undefined {
        return getRootInjector(this)._interceptors.get(type);
    }

    public getRegistrationForType(type: any): IInjectionConfiguration | undefined {
        return this._registrations.get(type);
    }

    public verify(): void {
        //Ok lets walk down the tree of scopes and start verifying
        this.children.forEach((child) => child.verify());

        //Purge our local cache here
        this.cache.purge();
    }

    /**
     * This method will resolve the closest injector on our tree who can handle construction of this type based on registrations
     */
    public getInjectorForTypeOrToken(injector: IInjector, tokenOrType: any): Injector {
        return findInjectorForTypeOrToken(injector, tokenOrType, this);
    }

    /**
     * Schedules a verification of the injector tree at the end of the current event loop
     */
    private scheduleVerify(): void {
        scheduleVerify(this, Injector);
    }

    private getImpl<T>(
        typeOrToken: T | StringOrSymbol,
        ancestry: any[] = [],
        options?: T extends Newable ? IConstructionOptionsInternal<T> : never,
    ): InstanceOfType<T> | undefined {
        assertNotDestroyed(this);

        //Any operation that results in a get should trigger verification at the end of the event loop. Note it will only run once
        this.scheduleVerify();

        return resolveInstance(this, typeOrToken, ancestry, options);
    }

    private create(
        parent?: IInjector,
        name?: string,
        configuration: Configuration = this.configuration as Configuration,
    ): Injector {
        return Injector.create(parent, name, configuration);
    }
}

// Register the global root injector if not present already
const globalReference = getGlobal();

globalReference[DI_ROOT_INJECTOR_KEY] = globalReference[DI_ROOT_INJECTOR_KEY] || Injector.create();
