export * from './annotations/inject';
export * from './annotations/injectable';
export * from './annotations/strategy';
export * from './annotations/factory';
export * from './annotations/lazy';
export * from './annotations/optional';
export * from './annotations/interceptor';
export * from './core/factory';
export * from './core/lazy';
export * from './core/metadata.functions';
export * from './core/util.functions.partial';
export * from './core/util.functions';
export * from './core/injector';

import { Injector } from './core/injector';
import { getRootInjector } from './core/util.functions';

/* 
    Register this injector prototype against the current injector (Which could be different depending on the node_modules hierarchy).
    We do this to ensure it can be injected anywhere down the tree where the injector version could differ.
    Avoids a common `Cannot resolve Injector => Injector => Injector` that is seen.
*/
getRootInjector().register(Injector);
