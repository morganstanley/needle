import { v4 as uuid } from 'uuid';
import { Factory } from '../annotations/factory';
import { Inject } from '../annotations/inject';
import { Lazy } from '../annotations/lazy';
import { Strategy } from '../annotations/strategy';
import {
    DI_ROOT_INJECTOR_KEY,
    INJECTOR_TYPE_ID,
    InjectorIdentifier,
    NULL_VALUE,
    UNDEFINED_VALUE,
} from '../constants/constants';
import { defaultInjectionConfiguration } from '../constants/defaults';
import {
    ICache,
    IConfiguration,
    IConstructionOptions,
    IInjectionConfiguration,
    IInjectionToken,
    IInjector,
    IMetrics,
    IParameterInjectionToken,
    ITokenCache,
    Newable,
} from '../contracts/contracts';
import { InstanceCache } from './cache';
import { Configuration } from './configuration';
import { AutoFactory } from './factory';
import { getGlobal } from './globals';
import { isFactoryParameterToken, isLazyParameterToken } from './guards';
import { LazyInstance } from './lazy';
import { getConstructorTypes } from './metadata.functions';
import { Metrics } from './metrics';
import { InjectionTokensCache } from './tokens';

/**
 * Injector type used for registering types for injection
 */
export class Injector implements IInjector {
    /**
     * Creates a new map from our internal child maps
     */
    public get children(): Map<InjectorIdentifier, IInjector> {
        return new Map(this._children);
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
    public readonly _children = new Map<InjectorIdentifier, Injector>();
    public readonly id = uuid();
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
    }

    /**
     * Registers a type and associated injection config with the the injector
     */
    public register(type: any, config: IInjectionConfiguration = defaultInjectionConfiguration): this {
        this.registerTokens(type, config.tokens);
        this.registerStrategy(type, config.strategy);
        this._registrations.set(type, config);
        return this;
    }

    /**
     * Gets a scoped injector using the Id or the Name
     * @param nameOrId The name or the ID of the scope;
     * @description Will perform a breadth-first search
     */
    public getScope(nameOrId: string): IInjector | undefined {
        const childScopes = Array.from(this._children).map(([_id, scope]) => scope);

        const findIndex = childScopes.findIndex(c => c.id === nameOrId || c.name === nameOrId);
        if (findIndex !== -1) {
            return childScopes[findIndex];
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
        instance: InstanceType<T>,
        config: IInjectionConfiguration = defaultInjectionConfiguration,
    ): this {
        // Auto add the registration details
        this.register(type, config);
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
        this.children.forEach(c => c.destroy(this));

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
        return new AutoFactory(type, this, this.createInstance);
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
        if (this._isDestroyed) {
            throw new Error(
                `Invalid operation, the current injector instance is marked as destroyed. Injector Id: [${this.id}]`,
            );
        }

        // Measuring time taken
        const start = Date.now();
        let instance: any;

        const constructorType: any =
            typeof typeOrToken === 'string' ? this.getTypeForToken(this, typeOrToken) : typeOrToken;

        if (constructorType === undefined) {
            throw new Error(
                `Cannot resolve Type with token '${typeOrToken}' as no types have been registered against that token value`,
            );
        }

        ancestry.push(constructorType);

        // If injector type then return `this` if not try and resolve from cache
        const isInjectorType = constructorType === Injector || constructorType.typeId === INJECTOR_TYPE_ID;
        instance = isInjectorType ? this : this.cache.resolve(constructorType);

        if (instance == null) {
            // Lets see if the type has an associated registration. If root and answer is no then bail
            const registration = this._registrations.get(constructorType);
            // If root then we cannot go further up to look for registration so we can bomb here
            if (registration == null && this.isRoot()) {
                this.throwRegistrationNotFound(constructorType, ancestry);
                // Now if we are scoped the registration maybe inherited so lets ask our parent to resolve it for us.
            } else if (registration == null && this.isScoped() && this.parent) {
                // Note we return here as we want to stop metric being created for this scope
                return this.parent.get(typeOrToken, ancestry, options);
            }

            // We use a special Id (Guid) to determine if a type could be an injector type rather than fallible prototype comparison
            if (this.configuration.externalResolutionStrategy != null) {
                // If an external resolution strategy has been set, delegate all responsibility to it
                instance = this.configuration.externalResolutionStrategy.resolver(
                    constructorType,
                    this, // Pass injector so resolver understands the current context (scope, cache etc)
                    (options || {}).params || [],
                );
                if (this.configuration.externalResolutionStrategy.cacheSyncing === true) {
                    this.cache.update(constructorType, instance);
                }
            } else {
                instance = this.createInstance(constructorType, true, options as any, ancestry, this);
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
        return Array.from(this._registrations.keys());
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
        this.cache.clear();
        this.tokenCache.clear();
        this.children.clear();
        this._registrations.clear();
        this.metrics.clear();
    }

    private throwRegistrationNotFound(constructorType: any, ancestry: any[]) {
        throw new Error(
            `Cannot construct Type '${constructorType.name}' with ancestry '${ancestry
                .map(ancestor => ancestor.name)
                .join(
                    ' -> ',
                )}' the type is either not decorated with @Injectable or injector.register was not called for the type and configuration has constructUndecoratedTypes set to false`,
        );
    }

    private createInstance<T extends new (...args: any[]) => any>(
        type: T,
        updateCache: boolean = false,
        options?: IConstructionOptions<T>,
        ancestors: any[] = [],
        injector: IInjector = globalReference[DI_ROOT_INJECTOR_KEY],
    ): InstanceType<T> {
        // Do our base checks to see if we are exceeding our depth limits
        if (ancestors.length > injector.configuration.maxTreeDepth) {
            throw new Error(
                `Cannot construct Type '${(type as any).name}' with ancestry '${ancestors
                    .map(ancestor => ancestor.name)
                    .join(' -> ')}' as max tree depth has been reached`,
            );
        }

        let instance: any;

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

        instance = new type(...constructorParamValues);

        if (updateCache) {
            injector.cache.update(type, instance);
        }

        return instance;
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
        const {
            injectionParamTokens,
            strategyParamTokens,
            factoryParamTokens,
            lazyParamTokens,
        } = this.getConstructorsParamTokens(injector, type);

        return constructorParamTypes.map((paramType, index) => {
            // Have they provided a value, if they have use it, if its undefined (Not explicit NULL_VALUE or UNDEFINED_VALUE) construct using the type
            const value = overrideParams[index];
            if (value != null) {
                if (value === UNDEFINED_VALUE) {
                    return undefined;
                } else if (value === NULL_VALUE) {
                    return null;
                }
                return value;
            }

            const token = injectionParamTokens[injectionParamTokens.findIndex(ip => ip.index === index)];
            if (token != null) {
                paramType = this.getTypeForToken(injector, token.token);
            }
            // Handle @Strategy
            const strategyToken = strategyParamTokens[strategyParamTokens.findIndex(ip => ip.index === index)];
            if (strategyToken != null) {
                const strategies = this.getStrategiesTypes(injector, strategyToken).map(([t]) =>
                    injector.get(t, ancestors),
                );
                return strategies;
            }

            // Handle @Factory
            const factoryToken = factoryParamTokens[factoryParamTokens.findIndex(ip => ip.index === index)];
            if (factoryToken != null && isFactoryParameterToken(factoryToken)) {
                return new AutoFactory(
                    factoryToken.factoryTarget,
                    injector,
                    // Need to ensure the this pointer is not lost (consider autobind (spread throwing errors :/))
                    (s: any, m: boolean, i?: any, l?: Array<any>, e?: IInjector) => this.createInstance(s, m, i, l, e),
                );
            }

            // Handle @Lazy
            const lazyToken = lazyParamTokens[lazyParamTokens.findIndex(ip => ip.index === index)];
            if (lazyToken != null && isLazyParameterToken(lazyToken)) {
                return new LazyInstance(() => injector.get(lazyToken.lazyTarget));
            }

            if (paramType == null) {
                throw new Error(
                    `Cannot construct class '${(type as any).name}' with ancestry '${ancestors
                        .map(ancestor => ancestor.name)
                        .join(' -> ')}' as constructor param is ${paramType}`,
                );
            }

            return injector.cache.resolve(paramType) || this.get(paramType, ancestors, undefined);
        });
    }

    /**
     * Gets strategy types (but takes hierarchy into account)
     */
    private getStrategiesTypes(injector: IInjector | undefined, strategyToken: IParameterInjectionToken) {
        let strategies = new Array<any>();
        while (injector != null && strategies.length === 0) {
            strategies = [...injector.getRegistrations().entries()].filter(
                ([_t, config]) => config.strategy === strategyToken.token,
            );

            injector = injector.parent;
        }

        return strategies;
    }

    /**
     * Gets a type for a given injection token (but takes hierarchy into account)
     */
    private getTypeForToken(injector: IInjector, token: string): any {
        let constructorType: any;
        let currentInjector: IInjector | undefined = injector;

        while (currentInjector != null && constructorType == null) {
            constructorType = currentInjector.tokenCache.getTypeForToken(token);
            currentInjector = currentInjector.parent;
        }

        return constructorType;
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
        let emptyTokens = true;

        /*
         * We will start walking up the tree moving to the root injector to see if we can find tokens at
         * any level.  Note, token found at the lowest level override the parents.
         */
        while (injector != null && emptyTokens) {
            injectionParamTokens =
                injectionParamTokens.length === 0 ? injector.tokenCache.getInjectTokens(type) : injectionParamTokens;
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

        return { injectionParamTokens, strategyParamTokens, factoryParamTokens, lazyParamTokens };
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

// Register the global root injector if not present already
const globalReference = getGlobal();

globalReference[DI_ROOT_INJECTOR_KEY] = globalReference[DI_ROOT_INJECTOR_KEY] || Injector.create();
