import { AutoFactory } from '../core/factory';
import { LazyInstance } from '../core/lazy';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type ValueType = number | string | Date | boolean | Function | RegExp | Error | Array<any> | object;

export type InjectorIdentifier = string;

export type StringOrSymbol = string | symbol;

export type InstanceFactory = () => InstanceOfType<any>;

export type InjectionType = 'singleton' | 'multiple' | 'factory' | 'lazy' | 'optional';

export type Newable<T = any, T2 extends T = T> = new (...args: any[]) => T2;

export type Constructor<T> = new (...args: any[]) => T;

export type StaticTypes<T> = {
    [K in keyof T]: Constructor<T[K]>;
};

export type MetadataParams<T> = T extends new (...args: infer P) => any ? P : never;

export type MetadataStaticConstructorTypes<T> = StaticTypes<MetadataParams<T>>;

export type NewableConstructorInterceptor = new (...args: any[]) => IConstructionInterceptor;

// More forgiving InstanceType to support instances of an Abstract Type (not Newable)
export type InstanceOfType<T> = T extends { prototype: infer U } ? U : T;

export type ResolvedType<T> = T extends string ? unknown : T extends symbol ? unknown : T;

/**
 * Constructor options allows passing of partial params to injector for construction
 */
export interface IConstructionOptions<T extends Newable, TParams = Partial<ConstructorParameters<T>>> {
    /**
     * Param values to use when constructing the type
     */
    params?: TParams;
}

/**
 * Provides a spreadable Constructor Params type.
 */
export type OptionalConstructorParameters<T extends new (...args: any) => any> = T extends new (...args: infer P) => any
    ? Partial<P>
    : never;

/**
 * Injection token interface
 */
export interface IInjectionToken {
    token: StringOrSymbol;
    owner: any;
    injectionType: InjectionType;
}

/**
 * Injection token parameter metadata.
 */
export interface IParameterInjectionToken extends IInjectionToken {
    property: StringOrSymbol;
    index: number;
}

/**
 * Injection factory token parameter metadata.
 */
export interface IFactoryParameterInjectionToken extends IParameterInjectionToken {
    factoryTarget: unknown;
}

/**
 * Injection lazy token parameter metadata.
 */
export interface ILazyParameterInjectionToken extends IParameterInjectionToken {
    lazyTarget: unknown;
}

/**
 * The Injector configuration contract
 */
export interface IConfiguration {
    /**
     * The maximum depth the injection graph will reach before throwing an error.
     */
    maxTreeDepth: number;
    /**
     * Specify an external resolution strategy rather than using the default resolution strategy
     */
    externalResolutionStrategy?: IExternalResolutionConfiguration;
    /**
     * A flag that determines if a type can be registered against multiple tokens.
     */
    allowDuplicateTokens: boolean;

    /**
     * A flag indicating if metrics will be tracked for resolutions
     */
    trackMetrics: boolean;
}

/**
 * The Cache holds all instantiated injectable types.
 */
export interface ICache {
    /**
     * Gets the number of instances held in the cache
     */
    readonly instanceCount: number;
    /**
     * Gets an instance from the cache based on the constructor type
     * @param type
     */
    resolve<T>(type: T): InstanceOfType<T>;
    /**
     * Updates or inserts a record into the instance cache
     * @param type The constructor type
     * @param instance the instance
     */
    update(type: any, instance: any): void;
    /**
     * Clears the cache
     */
    clear(): void;
    /**
     * Returns an array of all instances in the cache
     */
    instances(): Array<any>;
}

/**
 * The injection token cache is used to store all uses of the @Inject annotation.
 */
export interface ITokenCache {
    /**
     * Get a list of associated inject parameter tokens for the given constructor of a type
     * @param type
     */
    getInjectTokens(type: any): IParameterInjectionToken[];
    /**
     * Get a list of associated strategy parameter tokens for the given constructor of a type
     * @param type
     */
    getStrategyTokens(type: any): IParameterInjectionToken[];
    /**
     * Get a list of associated factory parameter tokens for the given constructor of a type
     * @param type
     */
    getFactoryTokens(type: any): IParameterInjectionToken[];
    /**
     * Get a list of associated lazy parameter tokens for the given constructor of a type
     * @param type
     */
    getLazyTokens(type: any): IParameterInjectionToken[];
    /**
     * Get a list of associated lazy parameter tokens for the given constructor of a type
     * @param type
     */
    getOptionalTokens(type: any): IParameterInjectionToken[];
    /**
     * Gets a list of tokens this type has be registered against
     */
    getTokensForType(type: any): IInjectionToken[];
    /**
     * Gets a list of types registered against this token
     * @param token
     */
    getTypesForToken(token: StringOrSymbol): any[];
    /**
     * Gets a list of types which are consumers of the given strategy key
     * @param token
     */
    getStrategyConsumers(token: StringOrSymbol): any[];
    /**
     * Gets the type associated to this token.  Note, if there are many it will return the last one registered
     * @param token
     */
    getTypeForToken(token: StringOrSymbol): any | undefined;

    /**
     * Register either constructor parameter token or Type injection token
     * @param metadata
     */
    register(
        metadata:
            | IParameterInjectionToken
            | IInjectionToken
            | IFactoryParameterInjectionToken
            | ILazyParameterInjectionToken,
    ): void;

    /**
     * Clears the token cache
     */
    clear(): void;
}

/**
 * Base injector interface
 */
export interface IInjector {
    readonly id: InjectorIdentifier;
    readonly cache: ICache;
    readonly configuration: IConfiguration;
    readonly tokenCache: ITokenCache;
    readonly parent?: IInjector;
    readonly metrics: IMetrics;
    readonly name?: string;
    readonly children: Map<InjectorIdentifier, IInjector>;

    /**
     * Registers an interceptor with the root injector
     * @param interceptor
     */
    registerInterceptor(interceptor: IConstructionInterceptor): this;

    /**
     * Registers a type and associated injection config with the the injector
     */
    register<T>(type: T, config?: IInjectionConfiguration<T>): this;

    /**
     * Registers a value with the injector.
     */
    registerValue<T extends ValueType>(configuration: IValueInjectionConfiguration<T>): this;

    /**
     * Registers and instance of a type in the container
     */
    registerInstance<T extends Newable>(type: any, instance: InstanceOfType<T>, config?: IInjectionConfiguration): this;

    /**
     * Registers a parameter for factory injection. This maps to the @Factory annotation
     */
    registerParamForFactoryInjection(type: any, ownerType: any, index: number): this;

    /**
     * Registers a parameter for lazy injection. This maps to the @Lazy annotation
     */
    registerParamForLazyInjection(type: any, ownerType: any, index: number): this;

    /**
     * Registers a parameter for optional injection. This maps to the @Optional annotation
     */
    registerParamForOptionalInjection(ownerType: any, index: number): this;

    /**
     * Registers a parameter for token injection. This maps to the @Inject annotation
     */
    registerParamForTokenInjection(token: StringOrSymbol, ownerType: any, index: number): this;

    /**
     * Registers a parameter for strategy injection. This maps to the @Strategy annotation
     */
    registerParamForStrategyInjection(strategy: StringOrSymbol, ownerType: any, index: number): this;
    /**
     * Determine if this is the root injector
     */
    isRoot(): boolean;

    /**
     * Determine if this injector is scoped
     */
    isScoped(): boolean;

    /**
     * Indicates if this injector has been destroyed
     */
    isDestroyed(): boolean;

    /**
     * Destroys this instance of the injector as well as all child injectors in the parents hierarchy
     * @param parent Optional, destroy can be triggered by a parent being destroyed.
     */
    destroy(parent?: IInjector): void;

    /**
     * Get the list of registration
     */
    getRegistrations(): Map<any, IInjectionConfiguration>;

    /**
     * Gets an AutoFactory for a given type
     * @param type
     */
    getFactory<T extends Newable>(type: T): AutoFactory<T>;

    /**
     * Gets a Lazy for a given type
     * @param type
     */
    getLazy<T>(type: T | StringOrSymbol): LazyInstance<ResolvedType<T>>;

    /**
     * Gets an instance of a given type
     */
    get<T>(
        typeOrToken: T | StringOrSymbol,
        ancestry?: any[],
        options?: T extends Newable ? IConstructionOptions<T> : never,
    ): InstanceOfType<ResolvedType<T>>;

    /***
     * Gets an instance of a type or returns undefined if no registration
     */
    getOptional<T>(type: T | StringOrSymbol): InstanceOfType<ResolvedType<T>> | undefined;

    /**
     * Returns an Array of the all types registered in the container
     */
    getRegisteredTypes(): Array<any>;

    /**
     * Resolves an registration for a given type if present
     * @param type
     */
    getRegistrationForType(type: any): IInjectionConfiguration | undefined;

    /**
     * Returns an Array of strategy types for the given strategy token
     */
    getStrategies<T = unknown>(strategy: StringOrSymbol): Array<T>;

    /**
     * Returns an array of all the types registered in the container with associated constructor dependencies
     */
    getRegisteredTypesWithDependencies(): Array<{ provide: any; deps: Array<any> }>;

    /**
     * Resolves the nearest injector in our hierarchy that has a registration for the given type or token
     * @param injector The starting point injector
     * @param tokenOrType The type of the token we are looking for
     */
    getInjectorForTypeOrToken(injector: IInjector, tokenOrType: any): IInjector;

    /**
     * Gets a scoped injector using the Id or the Name
     * @param nameOrId The name or the ID of the scope;
     * @description Will perform a breadth-first search
     */
    getScope(nameOrId: string): IInjector | undefined;

    /**
     * Creates a child scope.
     * @param name optional name for the scope (Duplicates allowed in the tree)
     */
    createScope(name?: string): IInjector;

    /**
     * Resets the injector back to its default state
     */
    reset(): void;
}

/**
 * Destroyable interface used to signal that an object can be destroyed
 * @description This is used to signal that the object can be cleaned up and should not be used after this point.
 */
export interface IDestroyable {
    /**
     * Destroys the object and cleans up any resources it holds.
     * @description After this method is called, the object should not be used anymore.
     */
    needle_destroy(): void;
}

/**
 * Injection configuration object used for profiling information and behavior about the injectable to the injector
 */
export interface IInjectionConfiguration<T = any> {
    /**
     * A list of tokens that this injectable can be resolved by using the @Inject("token") annotation
     */
    tokens?: Array<StringOrSymbol> | undefined;

    /**
     * The strategy property works in conjunction with the @Strategy("key") annotation and signals that an array of items can be injected under this key
     */
    strategy?: StringOrSymbol;

    /**
     * Optional resolution strategy which can be either an external resolution config or a type
     * @description If a type is provided the injector will attempt to substitute the original type with the new one being registered here.
     */
    resolution?: IExternalResolutionConfiguration<T> | T;

    /**
     * You can provide explicit metadata for a type using this property.  Note if you are not leveraging decorators with 'emitDecoratorMetadata' you must provide all metadata for a given type
     */
    metadata?: MetadataStaticConstructorTypes<T>;
}

/**
 * Injection configuration object used for profiling information and behavior about the injectable value to the injector
 */
export interface IValueInjectionConfiguration<T extends ValueType> {
    /**
     * A list of tokens that this injectable can be resolved by using the @Inject("token") annotation
     */
    tokens: Array<StringOrSymbol> | undefined;

    /**
     * The value or the value resolution strategy.
     */
    value: IExternalValueResolutionConfiguration<T> | T;
}

/**
 * Represents a Boxed value type.
 */
export interface IBoxedValue {
    typeId: string;
    unbox(): any;
}

/**
 * Base interface used when defining external resolution strategy
 */
export interface IExternalResolutionConfigurationBase {
    /**
     * Flag that when set to true will sync instances with the injectors cache.
     * @description By default no cache syncing is done
     */
    cacheSyncing?: boolean;
}

/**
 * Configuration interface used when defining external resolution strategy
 */
export interface IExternalResolutionConfiguration<T = any> extends IExternalResolutionConfigurationBase {
    /**
     * The resolver function to be used when instancing types
     */
    resolver(type: T, currentInjector: IInjector, locals?: any): InstanceOfType<T>;
}

/**
 * Configuration interface used when defining external value resolution strategy
 */
export interface IExternalValueResolutionConfiguration<T extends ValueType = any>
    extends IExternalResolutionConfigurationBase {
    /**
     * The resolver function to be used when resolving the value
     */
    resolver(currentInjector: IInjector): T;
}

/**
 * Metric record represents a single types metric information
 */
export interface IMetricRecord {
    /**
     * The name of the given type if available
     */
    name: string;
    /**
     * The type whos metrics are being tracked
     */
    type: any;
    /**
     * First activation time
     */
    activated: Date;
    /**
     * What type constructed this type. (Defaults to self if bare resolution)
     */
    activationTypeOwner: any;
    /**
     * The number of times this type has been resolved
     */
    resolutionCount: number;
    /**
     * The last time this type resolved
     */
    lastResolution: Date;
    /**
     * The number of types this type depends on based on constructor signature.
     */
    dependencyCount: number;
    /**
     * The time it took to construct this type
     */
    creationTimeMs: number;
}

export interface IMetrics {
    /**
     * Returns all the data stored in the metrics DB
     */
    readonly data: ReadonlyArray<Readonly<IMetricRecord>>;
    /**
     * Clears all the data in the metrics DB
     */
    clear(): void;
    /**
     * Dumps all the data to the console from the metric DB
     */
    dump(): void;

    /**
     * Gets the metrics for a given type
     * @param type The type who's metrics we want to read
     */
    getMetricsForType(type: any): Readonly<IMetricRecord> | undefined;
}

/**
 * Provides the ability to update the metrics store
 */
export interface IMetricsProvider extends IMetrics {
    /**
     * Updates a given types metrics
     * @param type
     * @param owner defaults to the same type if not provided
     * @param costMs Cost in milliseconds to construct the type
     */
    update(type: any, owner: any, costMs: number): void;
}

/**
 * Provides injection context used at the point of creation
 */
export interface IInjectionContext<TType extends Newable = any> {
    /**
     * The type being constructed
     */
    readonly type: TType;
    /**
     * The injector this instance is associated too
     */
    readonly injector: IInjector;
    /**
     * The configuration used during construction
     */
    readonly configuration: IInjectionConfiguration;
    /**
     * Constructor arguments used for construction
     */
    readonly constructorArgs: ConstructorParameters<TType>;
}

/**
 * Base constructor injector interceptor interface
 * @description Constructor Interceptors only fire when cache missed
 */
export interface IConstructionInterceptor<TTarget extends Newable = any> {
    /**
     * The type targeted for interception
     */
    readonly target: TTarget;

    /**
     * Invoked before the type is instanced but after its constructor arguments have been resolved
     * @param context Context at point of construction
     */
    beforeCreate(context: IInjectionContext<TTarget>): void;

    /**
     * Invoked directly after the type has been instanced
     * @param instance The instance of the given type
     * @param context Context at point of construction
     */
    afterCreate(instance: InstanceOfType<TTarget>, context: IInjectionContext<TTarget>): void;
}
