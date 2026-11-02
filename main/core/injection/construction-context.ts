import type { IInjector } from '../../contracts/contracts.js';

/**
 * One in-progress construction: the injector the instance was requested from and the type being built.
 */
export interface IConstructionFrame {
    injector: IInjector;
    type: unknown;
}

/**
 * Key of the shared construction stack on the host global. Using `Symbol.for` means the ESM and CommonJS copies of
 * Needle (if both are loaded) share one stack, so decorators from one copy see constructions started by the other.
 */
const NEEDLE_CONSTRUCTION_KEY = Symbol.for('needle.morganstanley.com.construction-stack');

/**
 * Tracks the types currently being constructed, innermost last.
 *
 * Standard (TC39) decorators cannot decorate constructor parameters, so field and accessor injection needs another
 * way to find "the injector that is building me". `createInstance` pushes a frame around `new type(...)` and the
 * field/accessor initialisers read it back while the instance is being initialised. The frames also give field
 * injection a resolution path, so cycles through fields fail with a clear error rather than a stack overflow.
 */
function stack(): IConstructionFrame[] {
    const host = globalThis as unknown as Record<symbol, IConstructionFrame[] | undefined>;
    return (host[NEEDLE_CONSTRUCTION_KEY] ??= []);
}

/**
 * Runs `fn` with `injector` marked as the injector currently constructing an instance of `type`
 */
export function runWithConstructingInjector<T>(injector: IInjector, type: unknown, fn: () => T): T {
    const frames = stack();
    frames.push({ injector, type });
    try {
        return fn();
    } finally {
        frames.pop();
    }
}

/**
 * The injector currently constructing an instance (if any)
 */
export function getConstructingInjector(): IInjector | undefined {
    const frames = stack();
    return frames[frames.length - 1]?.injector;
}

/**
 * The types currently being constructed, outermost first
 */
export function getConstructionPath(): unknown[] {
    return stack().map((frame) => frame.type);
}
