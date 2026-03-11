export * from './annotations/inject.js';
export * from './annotations/injectable.js';
export * from './annotations/strategy.js';
export * from './annotations/factory.js';
export * from './annotations/lazy.js';
export * from './annotations/optional.js';
export * from './annotations/interceptor.js';
export * from './constants/constants.js';
export * from './contracts/contracts.js';
export * from './core/factory.js';
export * from './core/lazy.js';
export * from './core/metadata.functions.js';
export * from './core/util.functions.partial.js';
export * from './core/util.functions.js';
export * from './core/injector.js';

import { Injector } from './core/injector.js';
import { getRootInjector } from './core/util.functions.js';

/* 
    Register this injector prototype against the current injector (Which could be different depending on the node_modules hierarchy).
    We do this to ensure it can be injected anywhere down the tree where the injector version could differ.
    Avoids a common `Cannot resolve Injector => Injector => Injector` that is seen.
*/
getRootInjector().register(Injector);
