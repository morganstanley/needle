import { GLOBAL_CONFIGURATION } from '../constants/constants';
import { IExternalResolutionConfiguration } from '../contracts/contracts';
import { globalState } from './globals';

/**
 * Configurator class used for handling global container settings and behavioral flags
 */
export class Configuration {
    private _turtleDepth = 100;
    private _externalResolutionStrategy: IExternalResolutionConfiguration | undefined;
    private _constructUndecoratedTypes = false;
    private _allowDuplicateTokens = false;
    private _globalConfig = globalState(GLOBAL_CONFIGURATION, () => this);

    /**
     * Gets the value indicating if the injector should attempt to construct types that have metadata but are not decorated with @Injectable
     */
    public get constructUndecoratedTypes(): boolean {
        return this._globalConfig._constructUndecoratedTypes;
    }

    /**
     * If set to true, this will signal to the injector to attempt to construct types that have metadata but are not decorated with @Injectable
     */
    public set constructUndecoratedTypes(value: boolean) {
        this._globalConfig._constructUndecoratedTypes = value;
    }

    /**
     * Gets the current turtle depth
     */
    public get turtleDepth(): number {
        return this._globalConfig._turtleDepth;
    }

    /**
     * Sets the limit on how deep the dependency graph tree can go.  Avoiding possible circular references with a cut out.
     * https://stackoverflow.com/questions/12022182/specific-to-the-world-of-programming-what-does-turtles-all-the-way-down-mean
     *
     */
    public set turtleDepth(value: number) {
        this._globalConfig._turtleDepth = value;
    }

    /**
     * Gets the external type resolver if one has been registered
     */
    public get externalResolutionStrategy(): IExternalResolutionConfiguration | undefined {
        return this._globalConfig._externalResolutionStrategy;
    }

    /**
     * Sets the type resolver to an external implementation. Delegates all construction and caching to that container
     */
    public set externalResolutionStrategy(value: IExternalResolutionConfiguration | undefined) {
        this._globalConfig._externalResolutionStrategy = value;
    }

    /**
     * Gets the flag indicating if duplicate tokens should be allowed.
     * @default false
     */
    public get allowDuplicateTokens(): boolean {
        return this._globalConfig._allowDuplicateTokens;
    }

    /**
     * Sets the flag to signal to the injector that duplicate tokens are either allowed or restricted
     */
    public set allowDuplicateTokens(value: boolean) {
        this._globalConfig._allowDuplicateTokens = value;
    }

    /**
     * Resets the configuration back to its default state
     */
    public reset(): void {
        this.turtleDepth = 100;
        this.externalResolutionStrategy = undefined;
        this.allowDuplicateTokens = false;
        this.constructUndecoratedTypes = false;
    }
}
