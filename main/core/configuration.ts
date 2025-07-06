import { CacheStrategyType, IConfiguration, IExternalResolutionConfiguration } from '../contracts/contracts';

/**
 * Configuration class used for handling global container settings and behavioral flags
 */
export class Configuration implements IConfiguration {
    /**
     * The current max tree depth
     */
    public maxTreeDepth: number = 100;

    /**
     * The external type resolver if one has been registered
     */
    public externalResolutionStrategy?: IExternalResolutionConfiguration;

    /**
     * Flag indicating if duplicate tokens should be allowed.
     * @default false
     */
    public allowDuplicateTokens: boolean = false;

    /**
     * Flag indicating if metrics tracking is enabled
     * @default true
     */
    public trackMetrics: boolean = true;

    /*
     * The metadata mode to use for type resolution.
     * - 'explicit': Uses explicit metadata provided by the user.
     * - 'reflection': Uses reflection to gather metadata.
     * - 'both': Attempts to resolve metadata using explicit first then reflection second.
     * @default 'both'
     */
    public metadataMode: 'explicit' | 'reflection' | 'both' = 'both';

    /*
     * The metadata mode to use for type resolution.
     * - 'explicit': Uses explicit metadata provided by the user.
     * - 'reflection': Uses reflection to gather metadata.
     * - 'both': Attempts to resolve metadata using explicit first then reflection second.
     * @default 'both'
     */
    public defaultCacheStrategy: CacheStrategyType = 'persistent';

    /**
     * Resets the configuration back to its default state
     */
    public reset(): void {
        this.maxTreeDepth = 500;
        this.externalResolutionStrategy = undefined;
        this.allowDuplicateTokens = false;
        this.trackMetrics = false;
    }
}
