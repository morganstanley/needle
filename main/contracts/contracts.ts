import { AutoFactory } from '../core/factory';
import { LazyInstance } from '../core/lazy';

export type InstanceFactory = () => InstanceType<any>;

export type TokenType = 'singleton' | 'multiple' | 'factory' | 'lazy';

export type Newable = new (...args: any[]) => any;

/**
 * Constructor options allows passing of partial params to injector for construction
 */
export interface IConstructionOptions<T extends Newable, TParams = Partial<ConstructorParameters<T>>> {
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
    token: string;
    owner: any;
    tokenType: TokenType;
}

/**
 * Injection token parameter metadata.
 */
export interface IParameterInjectionToken extends IInjectionToken {
    property: string | symbol;
    index: number;
}

/**
 * Injection factory token parameter metadata.
 */
export interface IFactoryParameterInjectionToken extends IParameterInjectionToken {
    factoryTarget: Newable;
}

/**
 * Injection lazy token parameter metadata.
 */
export interface ILazyParameterInjectionToken extends IParameterInjectionToken {
    lazyTarget: Newable;
}

/**
 * The Injector configuration contract
 */
export interface IConfiguration {
    /**
     * A flag signalling if types not decoratored with @Injectable should attempt to be constructed by the Injector
     */
    constructUndecoratedTypes: boolean;
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
    resolve<T extends Newable>(type: T): InstanceType<T>;
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
     * Gets a list of tokens this type has be registered against
     */
    getTokensForType(type: any): IInjectionToken[];
    /**
     * Gets a list of types registered against this token
     * @param token
     */
    getTypesForToken(token: string): any[];
    /**
     * Gets a list of types which are consumers of the given strategy key
     * @param token
     */
    getStrategyConsumers(token: string): any[];
    /**
     * Gets the type associated to this token.  Note, if there are many it will return the last one registered
     * @param token
     */
    getTypeForToken(token: string): any | undefined;

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
    readonly id: string;
    readonly cache: ICache;
    readonly configuration: IConfiguration;
    readonly tokenCache: ITokenCache;
    readonly parent?: IInjector;
    readonly scope?: IScopeConfiguration;

    /**
     * Registers a type and associated injection config with the the injector
     */
    register(type: any, config?: IInjectionConfiguration): this;

    /**
     * Get the list of registration
     */
    getRegistrations(): Map<any, IInjectionConfiguration>;

    /**
     * Registers and instance of a type in the container
     */
    registerInstance<T extends Newable>(type: any, instance: InstanceType<T>): this;

    /**
     * Registers a parameter for factory injection.  This maps to the @Factory annotation
     */
    registerParamForFactoryInjection(type: any, ownerType: any, index: number): this;

    /**
     * Registers a parameter for lazy injection.  This maps to the @Lazy annotation
     */
    registerParamForLazyInjection(type: any, ownerType: any, index: number): this;

    /**
     * Registers a parameter for token injection.  This maps to the @Inject annotation
     */
    registerParamForTokenInjection(token: string, ownerType: any, index: number): this;

    /**
     * Registers a parameter for strategy injection.  This maps to the @Strategy annotation
     */
    registerParamForStrategyInjection(strategy: string, ownerType: any, index: number): this;
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
     */
    destroy(): void;

    /**
     * Gets an AutoFactory for a given type
     * @param type
     */
    getFactory<T extends Newable>(type: T): AutoFactory<T>;

    /**
     * Gets a Lazy for a given type
     * @param type
     */
    getLazy<T extends Newable>(type: T): LazyInstance<T>;

    /**
     * Gets an instance of a given type
     */
    get<T extends Newable>(
        typeOrToken: T | string,
        ancestry?: any[],
        options?: IConstructionOptions<T>,
    ): InstanceType<T>;

    /**
     * Returns an Array of the all types registered in the container
     */
    getRegisteredTypes(): Array<any>;

    /**
     * Returns an Array of strategy types for the given strategy token
     */
    getStrategies<T = unknown>(strategy: string): Array<T>;

    /**
     * Returns an array of all the types registered in the container with associated constructor dependencies
     */
    getRegisteredTypesWithDependencies(): Array<{ provide: any; deps: Array<any> }>;

    /**
     * Resets the injector back to its default state
     */
    reset(): void;
}

/**
 * Configuration object which can be used when creating an injection scope
 */
export interface IScopeConfiguration {
    name?: string;
}

/**
 * Injection configuration object used for profiling information and behavior about the injectable to the injector
 */
export interface IInjectionConfiguration {
    /**
     * A list of tokens that this injectable can be resolved by using the @Inject("token") annotation
     */
    tokens?: Array<string> | undefined;

    /**
     * The strategy property works in conjunction with the @Strategy("key") annotation and signals that an array of items can be injected under this key
     */
    strategy?: string;
}

/**
 * Configuration interface used when defining external resolution strategy
 */
export interface IExternalResolutionConfiguration {
    /**
     * The resolver function to be used when instancing types
     */
    resolver: (type: any, locals?: any) => any;

    /**
     * Flag that when set to true will sync instances with the injectors cache.
     * @description By default no cache syncing is done
     */
    cacheSyncing?: boolean;
}
