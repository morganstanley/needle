import { IConstructionOptions, Newable } from '../../contracts/contracts.js';

/**
 * This interface extends the constructor options to allow internal behavior to profiled when constructing injectables
 */
export interface IConstructionOptionsInternal<
    T extends Newable,
    TParams = Partial<ConstructorParameters<T>>,
> extends IConstructionOptions<T, TParams> {
    mode?: 'standard' | 'optional';
}
