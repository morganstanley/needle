export * from './annotations/inject.js';
export * from './annotations/injectable.js';
export * from './annotations/strategy.js';
export * from './annotations/factory.js';
export * from './annotations/lazy.js';
export * from './annotations/optional.js';
export * from './annotations/interceptor.js';
export { dep } from './core/injection/deps.js';
export type { DepFor, DepsFor } from './core/injection/deps.js';
export { createToken } from './core/typed-token.js';
export * from './constants/constants.js';
export * from './contracts/contracts.js';
export * from './core/factory.js';
export * from './core/lazy.js';
export * from './core/metadata.functions.js';
export * from './core/util.functions.partial.js';
export * from './core/util.functions.js';
export * from './core/injector.js';
export * from './core/errors.js';
export * from './core/logger.js';

import { Injector } from './core/injector.js';
import { getRootInjector } from './core/util.functions.js';
import { registerLoadedFormat } from './core/loaded-formats.js';
import { NEEDLE_MODULE_FORMAT } from './core/module-format.js';

/* 
    Register this injector prototype against the current injector (Which could be different depending on the node_modules hierarchy).
    We do this to ensure it can be injected anywhere down the tree where the injector version could differ.
    Avoids a common `Cannot resolve Injector => Injector => Injector` that is seen.
*/
getRootInjector().register(Injector);

// Warn (once) if both the ESM and CommonJS copies of Needle end up loaded in the same app.
registerLoadedFormat(NEEDLE_MODULE_FORMAT);
