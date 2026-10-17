import { CacheStrategyType, IConfiguration, IExternalResolutionConfiguration } from '../contracts/contracts.js';

type ConfigurationDefaults = Required<Omit<IConfiguration, 'externalResolutionStrategy'>> &
    Pick<IConfiguration, 'externalResolutionStrategy'>;

const DEFAULTS: Readonly<ConfigurationDefaults> = Object.freeze({
    maxTreeDepth: 100,
    externalResolutionStrategy: undefined,
    allowDuplicateTokens: false,
    trackMetrics: true,
    metadataMode: 'both',
    defaultCacheStrategy: 'persistent',
});

/**
 * Configuration class used for handling global container settings and behavioral flags
 */
export class Configuration implements IConfiguration {
    /**
     * The current max tree depth
     */
    public maxTreeDepth: number = DEFAULTS.maxTreeDepth;

    /**
     * The external type resolver if one has been registered
     */
    public externalResolutionStrategy?: IExternalResolutionConfiguration;

    /**
     * Flag indicating if duplicate tokens should be allowed.
     * @default false
     */
    public allowDuplicateTokens: boolean = DEFAULTS.allowDuplicateTokens;

    /**
     * Flag indicating if metrics tracking is enabled
     * @default true
     */
    public trackMetrics: boolean = DEFAULTS.trackMetrics;

    /**
     * The metadata mode to use for type resolution.
     * - 'explicit': Uses explicit metadata provided by the user.
     * - 'reflection': Uses reflection to gather metadata.
     * - 'both': Attempts to resolve metadata using explicit first then reflection second.
     * @default 'both'
     */
    public metadataMode: 'explicit' | 'reflection' | 'both' = DEFAULTS.metadataMode;

    /**
     * The cache strategy applied to injectables that don't declare their own.
     * - 'persistent': Instances are cached and reused for the lifetime of the injector.
     * - 'no-cache': A new instance is created on every resolution.
     * - 'weak-reference': Instances are held weakly and may be garbage collected.
     * - idle / conditional strategy objects: Instances are evicted on idle timeout or when a condition is met.
     * @default 'persistent'
     */
    public defaultCacheStrategy: CacheStrategyType = DEFAULTS.defaultCacheStrategy;

    /**
     * Resets the configuration back to its default state
     */
    public reset(): void {
        Object.assign(this, DEFAULTS);
    }
}
