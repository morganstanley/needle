import { InstanceCache } from '../core/cache';
import { Configuration } from '../core/configuration';
import { AutoFactory } from '../core/factory';
import { LazyInstance } from '../core/lazy';
import { InjectionTokensCache } from '../core/tokens';

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
 * Injection token parameter metadata. Used for looking up param tokens during type construction
 */
export interface IParameterInjectionToken extends IInjectionToken {
    property: string | symbol;
    index: number;
}

export interface IFactoryParameterInjectionToken extends IParameterInjectionToken {
    factoryTarget: Newable;
}

export interface ILazyParameterInjectionToken extends IParameterInjectionToken {
    lazyTarget: Newable;
}

/**
 * Base injector interface
 */
export interface IInjector {
    readonly id: string;
    readonly cache: InstanceCache;
    readonly configuration: Configuration;
    readonly tokenCache: InjectionTokensCache;
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
