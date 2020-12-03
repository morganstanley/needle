import { IConstructionOptions, IInjector, Newable, OptionalConstructorParameters } from '../contracts/contracts';

/**
 * The AutoFactory class can be injected into a consumer and allow the user to construct an instance of a type supplying optional dependencies for the constructor.
 */
export class AutoFactory<T extends Newable> {
    constructor(
        public type: T,
        private injector: IInjector,
        private factoryImpl: (
            type: T,
            updateCache: boolean,
            options?: IConstructionOptions<T>,
            ancestors?: Array<any>,
            injector?: IInjector,
        ) => InstanceType<T>,
    ) {}

    /**
     * Create is used to create a new instance of the given type. All constructor params are considered optional and if undefined is passed the container will attempt to resolve the dependencies itself.
     */
    public create(...params: OptionalConstructorParameters<T>): InstanceType<T> {
        return this.factoryImpl.bind(this.injector)(this.type, false, { params: params as any }, [], this.injector);
    }
}
