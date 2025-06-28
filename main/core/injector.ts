import { generateUUID } from '../core/uuid';
import { Factory } from '../annotations/factory';
import { Inject } from '../annotations/inject';
import { Lazy } from '../annotations/lazy';
import { Optional } from '../annotations/optional';
import { Strategy } from '../annotations/strategy';
import {
    DI_ROOT_INJECTOR_KEY,
    INJECTOR_TYPE_ID,
    NULL_VALUE,
    TYPE_NOT_FOUND,
    UNDEFINED_VALUE,
} from '../constants/constants';
import { defaultInjectionConfiguration } from '../constants/defaults';
import {
    ICache,
    IConfiguration,
    IConstructionInterceptor,
    IConstructionOptions,
    IExternalResolutionConfiguration,
    IInjectionConfiguration,
    IInjectionToken,
    IInjector,
    IMetrics,
    InjectorIdentifier,
    InstanceOfType,
    IParameterInjectionToken,
    ITokenCache,
    Newable,
    StringOrSymbol,
    IValueInjectionConfiguration,
    ValueType,
    ResolvedType,
} from '../contracts/contracts';
import { InstanceCache } from './cache';
import { Configuration } from './configuration';
import { AutoFactory } from './factory';
import { getGlobal } from './globals';
import { createBoxedValueType } from './boxing';
import {
    isExternalResolutionConfigurationLike,
    isFactoryParameterToken,
    isLazyParameterToken,
    isStringOrSymbol,
    isBoxedValue,
    isDestroyable,
} from './guards';
import { LazyInstance } from './lazy';
import { getConstructorTypes } from './metadata.functions';
import { Metrics } from './metrics';
import { InjectionTokensCache } from './tokens';

/**
 * Local polyfill function to avoid IE11 not having find index on array
 * @param data
 * @param predicate
 */
function findIndex<T>(data: Array<T>, predicate: (item: T) => boolean): number {
    let index = -1;
    for (let i = 0; i < data.length; ++i) {
        if (predicate(data[i])) {
            index = i;
            break;
        }
    }
    return index;
}

/**
 * This interface extends the constructor options to allow internal behavior to profiled when constructing injectables
 */
export interface IConstructionOptionsInternal<T extends Newable, TParams = Partial<ConstructorParameters<T>>>
    extends IConstructionOptions<T, TParams> {
    mode?: 'standard' | 'optional';
}

/**
 * Injector type used for registering types for injection
 */
export class Injector implements IInjector {
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
    private _registrations: Map<any, IInjectionConfiguration>;
    private _interceptors: Map<any, IConstructionInterceptor[]>;
    public readonly _children = new Map<InjectorIdentifier, Injector>();
    public readonly id = generateUUID();
    public readonly cache: ICache;
    public readonly tokenCache: ITokenCache;
    public readonly configuration: IConfiguration;
    public readonly parent?: IInjector;
    public readonly metrics: IMetrics;
    public readonly name?: string;

    constructor(
        readonly _cache: InstanceCache,
        readonly _configuration: Configuration,
        readonly _tokenCache: InjectionTokensCache,
        readonly _metrics: Metrics,
        readonly _parent?: IInjector,
        readonly _name?: string,
    ) {
        this.name = _name;
        this.cache = _cache;
        this.configuration = _configuration;
        this.tokenCache = _tokenCache;
        this.parent = _parent;
        this.metrics = this._metrics;
        this._registrations = new Map<any, IInjectionConfiguration>();
        this._interceptors = new Map<any, IConstructionInterceptor[]>();
    }

    /**
     * Registers an interceptor with the root injector
     * @param interceptor
     */
    public registerInterceptor(interceptor: IConstructionInterceptor<any>): this {
        const target = interceptor.target;
        let interceptors = this.getInterceptorsForType(interceptor.target);
        if (interceptors == null) {
            interceptors = [];
            this.getRootInjector()._interceptors.set(target, interceptors);
        }

        // Avoid duplicate instances being registered
        if (interceptors.indexOf(interceptor) === -1) {
            interceptors.push(interceptor);
        }

        return this;
    }

    /**
     * Registers a type and associated injection config with the the injector
     */
    public register(type: any, config: IInjectionConfiguration = defaultInjectionConfiguration): this {
        // Make a shallow copy
        config = { ...config };
        const resolution = config.resolution;

        // The resolution strategy for a type can be either a config or a type.  If a just a type we can auto convert to a config
        if (resolution != null && !isExternalResolutionConfigurationLike(resolution)) {
            config.resolution = {
                resolver: (_type, currentInjector, locals) => currentInjector.get(resolution, [], locals),
                cacheSyncing: true,
            } as IExternalResolutionConfiguration;
        }

        this.registerTokens(type, config.tokens);
        this.registerStrategy(type, config.strategy);
        this._registrations.set(type, config);
        return this;
    }

    public registerValue<T extends ValueType>(configuration: IValueInjectionConfiguration<T>): this {
        if (configuration.tokens == null || configuration.tokens.length === 0) {
            throw new Error('All values must be registered with a given token');
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
        const childScopes = Array.from(this._children).map(([_id, scope]) => scope);

        const foundIndex = findIndex(childScopes, (c) => c.id === nameOrId || c.name === nameOrId);
        if (foundIndex !== -1) {
            return childScopes[foundIndex];
        }

        for (let index = 0; index < childScopes.length; index++) {
            const child = childScopes[index];
            const scope = child.getScope(nameOrId);
            if (scope != null) {
                return scope;
            }
        }
        return undefined;
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

        //Before we purge the cache we must check to see if the type implements IDestroyable and then invoke as needed
        this._cache.all().forEach((instance) => {
            if (isDestroyable(instance)) {
                instance.needle_destroy();
            }
        });

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

        const strategies = [...this.getRegistrations().entries()]
            .filter(([_t, config]) => config.strategy === strategy)
            .map(([t]) => this.get<T>(t, []));

        return strategies as unknown as Array<T>;
    }

    /**
     * Gets an AutoFactory for a given type
     * @param type
     */
    public getFactory<T extends Newable>(type: T): AutoFactory<T> {
        return new AutoFactory<any>(type, this, this.createInstanceFactory);
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
        return this.getRootInjector()._interceptors.get(type);
    }

    public getRegistrationForType(type: any): IInjectionConfiguration | undefined {
        return this._registrations.get(type);
    }

    /**
     * To avoid circular import we can use this function to get the root injector
     */
    private getRootInjector(): Injector {
        let currentInjector: Injector = this;
        while (currentInjector.isRoot() === false) {
            currentInjector = currentInjector.parent! as Injector;
        }
        return currentInjector;
    }

    /**
     * Gets an instance of a given type
     */
    private getImpl<T>(
        typeOrToken: T | StringOrSymbol,
        ancestry: any[] = [],
        options?: T extends Newable ? IConstructionOptionsInternal<T> : never,
    ): InstanceOfType<T> | undefined {
        if (this._isDestroyed) {
            throw new Error(
                `Invalid operation, the current injector instance is marked as destroyed. Injector Id: [${this.id}]`,
            );
        }

        // Measuring time taken
        const start = Date.now();
        let instance: any;

        const NOT_FOUND = isStringOrSymbol(typeOrToken)
            ? `Cannot resolve Type with token '${typeOrToken.toString()}' as no types have been registered against that token value`
            : `Cannot resolve Type '${
                  (typeOrToken as any)?.name
              }' as no types have been registered against any injectors`;

        const injector = this.getInjectorForTypeOrToken(this, typeOrToken);

        const constructorType: any = isStringOrSymbol(typeOrToken)
            ? injector.tokenCache.getTypeForToken(typeOrToken)
            : typeOrToken;

        const allowOptional = options != null && options.mode === 'optional';

        if (constructorType === undefined) {
            if (allowOptional) {
                return undefined;
            }
            throw new Error(NOT_FOUND);
        }

        ancestry.push(constructorType);

        instance = this.getInjectorOrCacheValue(constructorType, injector);

        //Intrinsic types are boxed by default and primed in the cache.  If we have one lets unbox its value and use that
        if (isBoxedValue(instance)) {
            instance = instance.unbox();
        }

        // Not in cache so lets try and construct it
        if (instance == null) {
            const registration = injector.getRegistrationForType(constructorType);

            // Are we going to use the types resolution strategy over the external one
            const externalResolutionStrategy =
                registration != null && registration.resolution != null
                    ? registration.resolution
                    : this.configuration.externalResolutionStrategy;

            // If we have no registration for this type then throw error. (note @optional will allow this to pass)
            // (Possible if no injector was found and current one has no registration locally)
            if (!registration && !allowOptional && !externalResolutionStrategy) {
                this.throwRegistrationNotFound(constructorType, ancestry);
            }

            if (!allowOptional || registration || externalResolutionStrategy) {
                if (externalResolutionStrategy) {
                    // If an external resolution strategy has been set, attempt to resolve the instance from there first.
                    instance = externalResolutionStrategy.resolver(
                        constructorType,
                        injector, // Pass injector so resolver understands the current context (scope, cache etc)
                        ((options || {}) as any).params || [],
                    );

                    if (instance !== TYPE_NOT_FOUND && externalResolutionStrategy.cacheSyncing === true) {
                        // Sync cache if required
                        injector.cache.update(constructorType, instance);
                    }
                }

                // At this point either we have no external resolution or if we did it didn't want to handle it so we must now try
                if (instance === TYPE_NOT_FOUND || instance == null) {
                    if (registration) {
                        instance = this.createInstance(constructorType, true, options as any, ancestry, injector);
                    } else {
                        this.throwRegistrationNotFound(constructorType, ancestry);
                    }
                }
            }
        }

        // Measuring time taken
        const end = Date.now();

        // Capture metrics on this types usage
        if (this.configuration.trackMetrics) {
            injector._metrics.update(constructorType, undefined, end - start);
        }

        return instance;
    }

    private getInjectorOrCacheValue(constructorType: any, injector: Injector): any {
        // We use a special Id (Guid) to determine if a type could be an injector type rather than fallible prototype comparison
        // If injector type then return `this` if not try and resolve from cache
        const isInjectorType = constructorType === Injector || constructorType.typeId === INJECTOR_TYPE_ID;
        return isInjectorType ? this : injector.cache.resolve(constructorType);
    }

    private throwRegistrationNotFound(constructorType: any, ancestry: any[]) {
        throw new Error(
            `Cannot construct Type '${constructorType.name}' with ancestry '${ancestry
                .map((ancestor) => ancestor.name)
                .join(
                    ' -> ',
                )}' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
        );
    }

    private createInstanceFactory<T extends Newable>(
        type: T,
        updateCache = false,
        options?: IConstructionOptionsInternal<T>,
        ancestors: any[] = [],
        injector: IInjector = globalReference[DI_ROOT_INJECTOR_KEY],
    ) {
        const injectorForType = injector.getInjectorForTypeOrToken(injector, type);
        const registration = injectorForType.getRegistrationForType(type);
        if (registration == null) {
            this.throwRegistrationNotFound(type, ancestors);
        }
        return this.createInstance(type, updateCache, options, ancestors, injector);
    }

    private createInstance<T extends new (...args: any[]) => any>(
        type: T,
        updateCache = false,
        options?: IConstructionOptionsInternal<T>,
        ancestors: any[] = [],
        injector: IInjector = globalReference[DI_ROOT_INJECTOR_KEY],
    ): InstanceType<T> {
        // Do our base checks to see if we are exceeding our depth limits
        if (ancestors.length > injector.configuration.maxTreeDepth) {
            throw new Error(
                `Cannot construct Type '${(type as any).name}' with ancestry '${ancestors
                    .map((ancestor) => ancestor.name)
                    .join(' -> ')}' as max tree depth has been reached`,
            );
        }

        const overrideParams = (options || {}).params || [];
        const constructorParamTypes = getConstructorTypes(type);
        // Note this call to construct param values introduces recursive behavior
        const constructorParamValues = this.getConstructorParamValues<T>(
            constructorParamTypes,
            overrideParams,
            injector,
            ancestors,
            type,
        );

        // Construct our interceptor contexts (If we have some registered)
        const interceptorContexts = (this.getInterceptorsForType(type) || [])
            .filter((interceptor) => interceptor.target === type)
            .map((interceptor) => ({
                interceptor,

                configuration: injector.getRegistrationForType(type)!,
                constructorArgs: constructorParamValues,
                injector,
                type,
            }));

        // Trigger before interceptors
        interceptorContexts.forEach((context) => context.interceptor.beforeCreate(context));

        const instance: any = new type(...constructorParamValues);

        // Trigger after interceptors
        interceptorContexts.forEach((context) => context.interceptor.afterCreate(instance, context));

        if (updateCache) {
            injector.cache.update(type, instance);
        }

        return instance;
    }

    /**
     * Handles resolving the value for a given override value
     * @param value
     */
    private getOverrideValue(value: any): any {
        if (value === UNDEFINED_VALUE) {
            return undefined;
        } else if (value === NULL_VALUE) {
            return null;
        }
        return value;
    }

    /**
     * Resolves the strategies instances for the given strategy token
     * @param injector - Scope to resolve from
     * @param paramTokens List of strategy tokens
     * @param ancestors
     * @param index constructor index position
     */
    private tryGetStrategyParam(
        injector: IInjector,
        paramTokens: IParameterInjectionToken[],
        ancestors: any[],
        index: number,
    ): any[] | undefined {
        const strategyToken = paramTokens[findIndex(paramTokens, (ip) => ip.index === index)];
        if (strategyToken != null) {
            const strategies = this.getStrategiesTypes(injector, strategyToken).map(([t]) =>
                injector.get(t, ancestors),
            );
            return strategies;
        }
        return undefined;
    }

    /**
     * Attempts to resolve factory for given param
     * @param injector - Scope to resolve from
     * @param paramTokens List of factory tokens
     * @param index constructor index position
     */
    private tryGetFactoryParam(injector: IInjector, paramTokens: IParameterInjectionToken[], index: number) {
        const factoryToken = paramTokens[findIndex(paramTokens, (ip) => ip.index === index)];
        if (factoryToken != null && isFactoryParameterToken(factoryToken)) {
            return new AutoFactory(
                factoryToken.factoryTarget as Newable,
                injector,
                // Need to ensure the this pointer is not lost (consider autobind (spread throwing errors :/))
                (s: any, m: boolean, i?: any, l?: Array<any>, e?: IInjector) =>
                    this.createInstanceFactory(s, m, i, l, e), // :)
            );
        }
        return undefined;
    }

    /**
     * Resolves an lazy injectable for a given param
     * @param injector - Scope to resolve from
     * @param paramTokens - The lazy injection tokens
     * @param index constructor index position
     */
    private tryGetLazyParam(injector: IInjector, paramTokens: IParameterInjectionToken[], index: number) {
        const lazyToken = paramTokens[findIndex(paramTokens, (ip) => ip.index === index)];
        if (lazyToken != null && isLazyParameterToken(lazyToken)) {
            return new LazyInstance(() => injector.get(lazyToken.lazyTarget));
        }
        return undefined;
    }

    private isOptionalParam(paramTokens: IParameterInjectionToken[], index: number): boolean {
        return findIndex(paramTokens, (ip) => ip.index === index) !== -1;
    }

    /**
     * This method will resolve all the constructor args values taking into account the tokens
     */
    private getConstructorParamValues<T extends new (...args: any[]) => any>(
        constructorParamTypes: any[],
        overrideParams: Partial<ConstructorParameters<T>> | never[],
        injector: IInjector,
        ancestors: any[],
        type: T,
    ) {
        if (constructorParamTypes.length === 0) {
            return [];
        }

        // These tokens are constructor parameter tokens
        const { injectionParamTokens, strategyParamTokens, factoryParamTokens, lazyParamTokens, optionalParamTokens } =
            this.getConstructorsParamTokens(injector, type);

        return constructorParamTypes.map((paramType, index) => {
            const paramInjector = this.getInjectorForTypeOrToken(injector, paramType);

            // Have they provided a value, if they have use it, if its undefined (Not explicit NULL_VALUE or UNDEFINED_VALUE) construct using the type
            const value = overrideParams[index];
            if (value != null) {
                return this.getOverrideValue(value);
            }

            // Handle @Strategy
            const strategies = this.tryGetStrategyParam(injector, strategyParamTokens, ancestors, index);
            if (strategies != null) {
                return strategies;
            }

            // Handle @Factory
            const factory = this.tryGetFactoryParam(paramInjector, factoryParamTokens, index);
            if (factory) {
                return factory;
            }

            // Handle @Lazy
            const lazy = this.tryGetLazyParam(paramInjector, lazyParamTokens, index);
            if (lazy) {
                return lazy;
            }

            // If we have an @Inject annotation we will attempt to substitute the param type using the annotations token
            paramType = this.tryGetParamTypeFromToken(injectionParamTokens, index, paramType, paramInjector);
            const optional = this.isOptionalParam(optionalParamTokens, index);

            let instance =
                paramInjector.cache.resolve(paramType) ||
                paramInjector.getImpl(paramType, ancestors, {
                    mode: optional ? 'optional' : 'standard',
                });

            if (isBoxedValue(instance)) {
                instance = instance.unbox();
            }

            return instance;
        });
    }

    private tryGetParamTypeFromToken(
        paramTokens: IParameterInjectionToken[],
        index: number,
        defaultType: any,
        paramInjector: Injector,
    ) {
        const token = paramTokens[findIndex(paramTokens, (ip) => ip.index === index)];
        if (token != null) {
            defaultType = paramInjector._tokenCache.getTypeForToken(token.token);
        }
        return defaultType;
    }

    /**
     * Gets strategy types (but takes hierarchy into account)
     */
    private getStrategiesTypes(injector: IInjector, strategyToken: IParameterInjectionToken) {
        const strategies = [...injector.getRegistrations().entries()].filter(
            ([_t, config]) => config.strategy === strategyToken.token,
        );

        return strategies;
    }

    /**
     * This method will resolve the closest injector on our tree who can handle construction of this type based on registrations
     * @param injector
     * @param tokenOrType
     */
    public getInjectorForTypeOrToken(injector: IInjector, tokenOrType: any): Injector {
        const isType = !isStringOrSymbol(tokenOrType);
        let currentInjector = injector as Injector;

        while (currentInjector != null) {
            const found = isType
                ? currentInjector._registrations.get(tokenOrType)
                : currentInjector._tokenCache.getTypeForToken(tokenOrType);

            if (found != null) {
                return currentInjector;
            }
            currentInjector = currentInjector.parent as Injector;
        }

        return this;
    }

    private create(parent?: IInjector, name?: string, configuration: Configuration = this._configuration): Injector {
        return Injector.create(parent, name, configuration);
    }

    /**
     * Gets injection tokens for a given type (but takes hierarchy into account)
     */
    private getConstructorsParamTokens(injector: IInjector | undefined, type: any) {
        let injectionParamTokens = new Array<IParameterInjectionToken>();
        let strategyParamTokens = new Array<IParameterInjectionToken>();
        let factoryParamTokens = new Array<IParameterInjectionToken>();
        let lazyParamTokens = new Array<IParameterInjectionToken>();
        let optionalParamTokens = new Array<IParameterInjectionToken>();
        let emptyTokens = true;

        /*
         * We will start walking up the tree moving to the root injector to see if we can find tokens at
         * any level.  Note, token found at the lowest level override the parents.
         */
        while (injector != null && emptyTokens) {
            injectionParamTokens =
                injectionParamTokens.length === 0 ? injector.tokenCache.getInjectTokens(type) : injectionParamTokens;
            optionalParamTokens =
                optionalParamTokens.length === 0 ? injector.tokenCache.getOptionalTokens(type) : optionalParamTokens;
            strategyParamTokens =
                strategyParamTokens.length === 0 ? injector.tokenCache.getStrategyTokens(type) : strategyParamTokens;
            factoryParamTokens =
                factoryParamTokens.length === 0 ? injector.tokenCache.getFactoryTokens(type) : factoryParamTokens;
            lazyParamTokens = lazyParamTokens.length === 0 ? injector.tokenCache.getLazyTokens(type) : lazyParamTokens;

            injector = injector.parent;
            emptyTokens =
                injectionParamTokens.length === 0 ||
                strategyParamTokens.length === 0 ||
                factoryParamTokens.length === 0 ||
                lazyParamTokens.length === 0;
        }

        return { injectionParamTokens, strategyParamTokens, factoryParamTokens, lazyParamTokens, optionalParamTokens };
    }

    private registerStrategy(type: any, strategy: StringOrSymbol | undefined): void {
        if (isStringOrSymbol(strategy)) {
            const token: IInjectionToken = { token: strategy, owner: type, injectionType: 'multiple' };
            this.tokenCache.register(token);
        }
    }

    private registerTokens(type: any, tokens: Array<StringOrSymbol> = []): void {
        tokens
            .map((token) => ({ token, owner: type, injectionType: 'singleton' }) as IInjectionToken)
            .forEach((t) => {
                if (!this.configuration.allowDuplicateTokens) {
                    const tokenTypes = this.tokenCache.getTypesForToken(t.token);
                    if (tokenTypes.length > 0) {
                        throw new Error(
                            `Cannot register Type [${
                                (type as any).name
                            }] with token '${t.token.toString()}'. Duplicate token found for the following type [${tokenTypes
                                .map((tt) => tt.name)
                                .join(' -> ')}]`,
                        );
                    }
                }

                this.tokenCache.register(t);
            });
    }
}

// Register the global root injector if not present already
const globalReference = getGlobal();

globalReference[DI_ROOT_INJECTOR_KEY] = globalReference[DI_ROOT_INJECTOR_KEY] || Injector.create();
